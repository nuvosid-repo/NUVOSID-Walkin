import { randomBytes } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { MODEL_CHUNK_BYTES } from "../src/lib/constants";
import { sealPasscode } from "../src/lib/passcode-vault";

const db = new PrismaClient();
const DEMO_USERNAME = "crystal.demo";
const DEMO_COMPANY = "Shubh Shanti Construction";

async function listFiles(dir: string, prefix = ""): Promise<string[]> {
  const names: string[] = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) names.push(...(await listFiles(path.join(dir, entry.name), relative)));
    else names.push(relative);
  }
  return names;
}

/** Stores the Crystal Heights walkthrough in the database as this project's live model. */
async function saveDemoModel(projectId: string) {
  const source = path.resolve("prisma/seed-assets/crystal-heights");
  const files = await listFiles(source);
  const version = randomBytes(4).toString("hex");
  let size = 0;

  for (const file of files) {
    const data = await readFile(path.join(source, file));
    size += data.byteLength;
    const total = Math.max(1, Math.ceil(data.byteLength / MODEL_CHUNK_BYTES));
    for (let index = 0; index < total; index++) {
      const part = data.subarray(index * MODEL_CHUNK_BYTES, (index + 1) * MODEL_CHUNK_BYTES);
      await db.modelChunk.create({
        data: { projectId, version, path: file, index, total, size: part.byteLength, data: part },
      });
    }
  }

  await db.project.update({
    where: { id: projectId },
    data: {
      modelKind: "zip",
      modelEntry: "index.html",
      modelVersion: version,
      modelSize: size,
      modelFileCount: files.length,
      modelUploadedAt: new Date(),
    },
  });
  await db.modelChunk.deleteMany({ where: { projectId, version: { not: version } } });
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
    // Databases seeded when models lived on disk: bring the demo walkthrough in.
    const demo = await db.project.findFirst({ where: { companyId: existing.companyId ?? "", name: "Crystal Heights" } });
    if (demo && !(await db.modelChunk.findFirst({ where: { projectId: demo.id }, select: { id: true } }))) {
      await saveDemoModel(demo.id);
      console.log("Demo walkthrough stored in the database.");
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
    },
  });
  await saveDemoModel(project.id);

  console.log(`Demo client    → ID: ${DEMO_USERNAME}`);
  if (!process.env.DEMO_PASSCODE) console.log(`                 Passcode: ${passcode}`);
}

async function main() {
  await seedAdmin();
  await seedDemo();
}

main().finally(() => db.$disconnect());
