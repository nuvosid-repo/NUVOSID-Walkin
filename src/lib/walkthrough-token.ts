import { jwtVerify, SignJWT } from "jose";
import type { User } from "@prisma/client";
import { getSecretKey } from "./secret";

const AUDIENCE = "walkthrough";
const HOUR = 60 * 60;

/**
 * Walkthroughs run in a sandboxed iframe with an opaque origin, so the browser sends
 * no cookies with their requests. Access is carried by a signed token in the URL path
 * instead, which relative imports like ./three.module.js inherit automatically.
 *
 * Expiry is rounded to the hour so the URL stays stable and browsers can cache a large
 * model. The route re-checks user and project on every request, so revoking works at once.
 */
export function createWalkthroughToken(
  user: Pick<User, "id" | "sessionVersion">,
  project: { id: string; modelVersion: string | null },
) {
  const exp = (Math.ceil(Date.now() / 1000 / HOUR) + 3) * HOUR;
  return new SignJWT({ pid: project.id, v: project.modelVersion, sv: user.sessionVersion })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setAudience(AUDIENCE)
    .setExpirationTime(exp)
    .sign(getSecretKey());
}

export async function verifyWalkthroughToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), { audience: AUDIENCE, algorithms: ["HS256"] });
    if (!payload.sub || typeof payload.pid !== "string") return null;
    return { userId: payload.sub, projectId: payload.pid, version: payload.v, sessionVersion: payload.sv };
  } catch {
    return null;
  }
}
