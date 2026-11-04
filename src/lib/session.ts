import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { jwtVerify, SignJWT } from "jose";
import type { User } from "@prisma/client";
import { db } from "./db";
import { getSecretKey } from "./secret";

export type SessionRole = "ADMIN" | "CLIENT";

// One cookie per portal, so an admin and a client can stay signed in side by side in one browser.
const COOKIE_NAMES: Record<SessionRole, string> = {
  ADMIN: "nv_admin_session",
  CLIENT: "nv_client_session",
};
const SESSION_DAYS = 7;
const AUDIENCE = "session";

function sessionRole(user: Pick<User, "role">): SessionRole {
  return user.role === "ADMIN" ? "ADMIN" : "CLIENT";
}

export async function createSession(user: Pick<User, "id" | "role" | "sessionVersion">) {
  const token = await new SignJWT({ sv: user.sessionVersion })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(getSecretKey());

  (await cookies()).set(COOKIE_NAMES[sessionRole(user)], token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production" && process.env.COOKIE_SECURE !== "false",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function destroySession(role: SessionRole) {
  (await cookies()).delete(COOKIE_NAMES[role]);
}

/** The signed-in user of one portal, re-checked against the database so revocation takes effect at once. */
const getSessionUser = cache(async (role: SessionRole): Promise<User | null> => {
  const token = (await cookies()).get(COOKIE_NAMES[role])?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), { audience: AUDIENCE, algorithms: ["HS256"] });
    if (!payload.sub) return null;
    const user = await db.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.active || user.role !== role || user.sessionVersion !== payload.sv) return null;
    return user;
  } catch {
    return null;
  }
});

export function getCurrentAdmin() {
  return getSessionUser("ADMIN");
}

export function getCurrentClient() {
  return getSessionUser("CLIENT");
}

export async function requireAdmin() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}

export async function requireClient() {
  const client = await getCurrentClient();
  if (!client) redirect("/login");
  return client;
}

export function canViewProject(
  user: Pick<User, "role" | "companyId">,
  project: { published: boolean; companyId: string },
) {
  if (user.role === "ADMIN") return true;
  return project.published && project.companyId === user.companyId;
}
