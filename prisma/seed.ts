import { randomBytes } from "node:crypto";
import { cp, readdir, rm, stat } from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { sealPasscode } from "../src/lib/passcode-vault";

const db = new PrismaClient();
const DEMO_USERNAME = "crystal.demo";
const DEMO_COMPANY = "Shubh Shanti Construction";

async function directorySize(dir: string): Promise<{ size: number; count: number }> {
  let size = 0;
  let count = 0;
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const nested = await directorySize(full);
      size += nested.size;
      count += nested.count;
    } else {
      size += (await stat(full)).size;
      count += 1;
    }
  }
  return { size, count };
}

async function seedAdmin() {
  const username = (process.env.ADMIN_USERNAME || "admin").toLowerCase();
  if (await db.user.findUnique({ where: { username } })) {
    console.log(`Admin "${username}" already exists, left unchanged.`);
    return;
  }
  const password = process.env.ADMIN_PASSWORD || randomBytes(9).toString("base64url");
  await db.user.create({
    data: { username, name: "NUVOSID Admin", role: "ADMIN", passcodeHash: await bcrypt.hash(password, 12) },
  });
  console.log(`Admin created  → ID: ${username}`);
  if (!process.env.ADMIN_PASSWORD) console.log(`                 Password: ${password}`);
}

async function seedDemo() {
  const existing = await db.user.findUnique({ where: { username: DEMO_USERNAME } });
  if (existing) {
    // Databases seeded before passcodes could be viewed: store the known passcode if it still matches.
    const known = process.env.DEMO_PASSCODE;
    if (!existing.passcodeSealed && known && (await bcrypt.compare(known, existing.passcodeHash))) {
      await db.user.update({ where: { id: existing.id }, data: { passcodeSealed: sealPasscode(known) } });
      console.log("Demo client passcode can now be viewed in admin.");
    } else {
      console.log("Demo client already exists, left unchanged.");
    }
    return;
  }
  const company = await db.company.create({ data: { name: DEMO_COMPANY, city: "Udaipur" } });
  const passcode = process.env.DEMO_PASSCODE || randomBytes(6).toString("base64url");
  await db.user.create({
    data: {
      username: DEMO_USERNAME,
      name: "Crystal Heights Demo",
      passcodeHash: await bcrypt.hash(passcode, 12),
      passcodeSealed: sealPasscode(passcode),
      companyId: company.id,
    },
  });

  const source = path.resolve("prisma/seed-assets/crystal-heights");
  const { size, count } = await directorySize(source);
  const project = await db.project.create({
    data: {
      companyId: company.id,
      name: "Crystal Heights",
      tagline: "Sample flat · Flat No. 2",
      propertyType: "Residential",
      city: "Udaipur",
      address: "Basant Vihar, Udaipur",
      configuration: "3 BHK",
      area: "1834 sq.ft",
      description: "Interactive 3D model of the sample flat, built from the brochure plan and specification sheet. Walk through every room with the Hindi voice guide.",
      modelKind: "zip",
      modelEntry: "index.html",
      modelVersion: randomBytes(4).toString("hex"),
      modelSize: size,
      modelFileCount: count,
      modelUploadedAt: new Date(),
    },
  });

  const target = path.resolve(process.env.STORAGE_DIR || "./storage", "models", project.id);
  await rm(target, { recursive: true, force: true });
  await cp(source, target, { recursive: true });

  console.log(`Demo client    → ID: ${DEMO_USERNAME}`);
  if (!process.env.DEMO_PASSCODE) console.log(`                 Passcode: ${passcode}`);
}

async function main() {
  await seedAdmin();
  await seedDemo();
}

main().finally(() => db.$disconnect());
