import { randomInt } from "node:crypto";
import bcrypt from "bcryptjs";

// No 0/O or 1/I/L, so a passcode survives being read out over a call.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function generatePasscode(length = 10) {
  let code = "";
  for (let i = 0; i < length; i++) code += ALPHABET[randomInt(ALPHABET.length)];
  return code;
}

export function hashPasscode(passcode: string) {
  return bcrypt.hash(passcode, 12);
}

export function verifyPasscode(passcode: string, hash: string) {
  return bcrypt.compare(passcode, hash);
}

// Compared against when the user ID is unknown, so response time doesn't reveal which IDs exist.
const DUMMY_HASH = bcrypt.hashSync("nuvosid-placeholder", 12);

export function verifyAgainstDummy(passcode: string) {
  return bcrypt.compare(passcode, DUMMY_HASH);
}
