"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { generatePasscode, hashPasscode } from "@/lib/credentials";
import { db } from "@/lib/db";
import { fieldErrorsOf, parseForm, type ActionState } from "@/lib/form";
import { openPasscode, sealPasscode } from "@/lib/passcode-vault";
import { requireAdmin } from "@/lib/session";

const userSchema = z.object({
  companyId: z.string().min(1, "Select a company"),
  name: z.string().trim().min(2, "Enter the person's name").max(120),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9._-]{3,40}$/, "3–40 characters: letters, numbers, dot, dash or underscore"),
  passcode: z.union([z.literal(""), z.string().trim().min(6, "Use at least 6 characters").max(64)]),
});

async function passcodeFields(passcode: string) {
  return { passcodeHash: await hashPasscode(passcode), passcodeSealed: sealPasscode(passcode) };
}

export async function createUserAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = parseForm(userSchema, formData);
  if (!parsed.success) return fieldErrorsOf(parsed.error);
  const { companyId, name, username } = parsed.data;

  const company = await db.company.findUnique({ where: { id: companyId } });
  if (!company) return { fieldErrors: { companyId: ["Select a company"] }, error: "Please fix the highlighted fields." };

  if (await db.user.findUnique({ where: { username } })) {
    return { fieldErrors: { username: ["This user ID is already taken"] }, error: "Please fix the highlighted fields." };
  }

  const passcode = parsed.data.passcode || generatePasscode();
  await db.user.create({
    data: { companyId, name, username, role: "CLIENT", ...(await passcodeFields(passcode)) },
  });
  revalidatePath("/admin", "layout");
  return { credentials: { name, username, passcode, company: company.name } };
}

async function getClientUser(id: string) {
  return db.user.findFirst({ where: { id, role: "CLIENT" }, include: { company: true } });
}

export async function resetPasscodeAction(id: string): Promise<ActionState> {
  await requireAdmin();
  const user = await getClientUser(id);
  if (!user) return { error: "User not found." };
  const passcode = generatePasscode();
  await db.user.update({
    where: { id },
    data: { ...(await passcodeFields(passcode)), sessionVersion: { increment: 1 } },
  });
  revalidatePath("/admin", "layout");
  return {
    credentials: { name: user.name, username: user.username, passcode, company: user.company?.name ?? "" },
  };
}

/** Fetched only when the admin asks, so passcodes never sit in the page's HTML. */
export async function revealPasscodeAction(id: string): Promise<{ passcode: string | null }> {
  await requireAdmin();
  const user = await getClientUser(id);
  return { passcode: user?.passcodeSealed ? openPasscode(user.passcodeSealed) : null };
}

export async function updateUserAction(id: string, _: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const user = await getClientUser(id);
  if (!user) return { error: "User not found." };

  const parsed = parseForm(userSchema, formData);
  if (!parsed.success) return fieldErrorsOf(parsed.error);
  const { companyId, name, username, passcode } = parsed.data;

  const company = await db.company.findUnique({ where: { id: companyId } });
  if (!company) return { fieldErrors: { companyId: ["Select a company"] }, error: "Please fix the highlighted fields." };

  const taken = await db.user.findUnique({ where: { username } });
  if (taken && taken.id !== id) {
    return { fieldErrors: { username: ["This user ID is already taken"] }, error: "Please fix the highlighted fields." };
  }

  await db.user.update({
    where: { id },
    data: {
      companyId,
      name,
      username,
      // A new passcode signs the user out everywhere; other edits don't.
      ...(passcode ? { ...(await passcodeFields(passcode)), sessionVersion: { increment: 1 } } : {}),
    },
  });
  revalidatePath("/admin", "layout");
  return passcode
    ? { credentials: { name, username, passcode, company: company.name } }
    : { success: "User saved." };
}

export async function setUserActiveAction(id: string, active: boolean) {
  await requireAdmin();
  if (!(await getClientUser(id))) return;
  await db.user.update({ where: { id }, data: { active, sessionVersion: { increment: 1 } } });
  revalidatePath("/admin", "layout");
}

export async function deleteUserAction(id: string) {
  await requireAdmin();
  if (!(await getClientUser(id))) return;
  await db.user.delete({ where: { id } });
  revalidatePath("/admin", "layout");
}
