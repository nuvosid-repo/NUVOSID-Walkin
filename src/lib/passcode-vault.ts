import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from "node:crypto";

const VERSION = "v1";

// Derived separately so this key is never the one that signs sessions.
function vaultKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET is missing or too short. See .env.example.");
  }
  return Buffer.from(hkdfSync("sha256", secret, "", "nuvosid-passcode-vault", 32));
}

/** Encrypts a client passcode so an admin can view it later. Logins still use the bcrypt hash. */
export function sealPasscode(passcode: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", vaultKey(), iv);
  const data = Buffer.concat([cipher.update(passcode, "utf8"), cipher.final()]);
  return [VERSION, iv.toString("base64url"), cipher.getAuthTag().toString("base64url"), data.toString("base64url")].join(".");
}

/** Returns null if the value can't be read, for example after AUTH_SECRET changed. */
export function openPasscode(sealed: string) {
  try {
    const [version, iv, tag, data] = sealed.split(".");
    if (version !== VERSION) return null;
    const decipher = createDecipheriv("aes-256-gcm", vaultKey(), Buffer.from(iv, "base64url"));
    decipher.setAuthTag(Buffer.from(tag, "base64url"));
    return Buffer.concat([decipher.update(Buffer.from(data, "base64url")), decipher.final()]).toString("utf8");
  } catch {
    return null;
  }
}
