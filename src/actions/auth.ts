"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { hashPasscode, verifyAgainstDummy, verifyPasscode } from "@/lib/credentials";
import { fieldErrorsOf, parseForm, type ActionState } from "@/lib/form";
import { clearFailures, isBlocked, recordFailure } from "@/lib/rate-limit";
import { createSession, destroySession, requireAdmin } from "@/lib/session";

const loginSchema = z.object({
  username: z.string().trim().toLowerCase().min(1).max(100),
  passcode: z.string().min(1).max(200),
});

async function login(formData: FormData, role: "ADMIN" | "CLIENT"): Promise<ActionState> {
  const parsed = parseForm(loginSchema, formData);
  if (!parsed.success) return { error: "Enter your ID and passcode." };
  const { username, passcode } = parsed.data;

  const forwarded = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const userKey = `user:${username}`;
  const ipKey = `ip:${forwarded}`;
  if (isBlocked(userKey, 10) || isBlocked(ipKey, 40)) {
    return { error: "Too many attempts. Please try again in 15 minutes." };
  }

  const user = await db.user.findUnique({ where: { username } });
  const valid = user ? await verifyPasscode(passcode, user.passcodeHash) : await verifyAgainstDummy(passcode);

  if (!user || !valid || user.role !== role) {
    recordFailure(userKey);
    recordFailure(ipKey);
    return { error: "Incorrect ID or passcode." };
  }
  if (!user.active) return { error: "This account is inactive. Please contact your NUVOSID project lead." };

  clearFailures(userKey);
  await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await createSession(user);
  redirect(role === "ADMIN" ? "/admin" : "/projects");
}

export async function clientLoginAction(_: ActionState, formData: FormData) {
  return login(formData, "CLIENT");
}

export async function adminLoginAction(_: ActionState, formData: FormData) {
  return login(formData, "ADMIN");
}

export async function clientLogoutAction() {
  await destroySession("CLIENT");
  redirect("/login");
}

export async function adminLogoutAction() {
  await destroySession("ADMIN");
  redirect("/admin/login");
}

const changePasswordSchema = z
  .object({
    current: z.string().min(1, "Enter your current password"),
    next: z.string().min(10, "Use at least 10 characters").max(200),
    confirm: z.string(),
  })
  .refine((value) => value.next === value.confirm, { path: ["confirm"], message: "Passwords don't match" });

export async function changeAdminPasswordAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const parsed = parseForm(changePasswordSchema, formData);
  if (!parsed.success) return fieldErrorsOf(parsed.error);

  if (!(await verifyPasscode(parsed.data.current, admin.passcodeHash))) {
    return { fieldErrors: { current: ["Current password is incorrect"] }, error: "Please fix the highlighted fields." };
  }

  const updated = await db.user.update({
    where: { id: admin.id },
    data: { passcodeHash: await hashPasscode(parsed.data.next), sessionVersion: { increment: 1 } },
  });
  await createSession(updated);
  return { success: "Password updated." };
}
