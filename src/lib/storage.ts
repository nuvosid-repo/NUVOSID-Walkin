import { randomUUID } from "node:crypto";
import { mkdir, readdir, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const root = () => path.resolve(/* turbopackIgnore: true */ process.env.STORAGE_DIR || "./storage");
const modelsRoot = () => path.join(root(), "models");
const coversRoot = () => path.join(root(), "covers");

export type ModelFile = { path: string; data: Uint8Array };

/** Writes the new model beside the old one, then swaps, so a failed upload leaves the old one intact. */
export async function replaceModelFiles(projectId: string, files: ModelFile[]) {
  const target = path.join(modelsRoot(), projectId);
  const temp = path.join(modelsRoot(), `.tmp-${randomUUID()}`);
  try {
    for (const file of files) {
      const destination = path.join(temp, file.path);
      await mkdir(path.dirname(destination), { recursive: true });
      await writeFile(destination, file.data);
    }
    await rm(target, { recursive: true, force: true });
    await rename(temp, target);
  } catch (error) {
    await rm(temp, { recursive: true, force: true });
    throw error;
  }
}

export async function removeModelFiles(projectId: string) {
  await rm(path.join(modelsRoot(), projectId), { recursive: true, force: true });
}

/** Absolute path of a file inside a project's model, or null if the path escapes that folder. */
export function resolveModelFile(projectId: string, segments: string[]) {
  const base = path.join(modelsRoot(), projectId);
  const resolved = path.resolve(base, ...segments);
  return resolved.startsWith(base + path.sep) ? resolved : null;
}

export function coverPath(projectId: string, ext: string) {
  return path.join(coversRoot(), `${projectId}.${ext}`);
}

export async function writeCover(projectId: string, ext: string, data: Uint8Array) {
  await mkdir(coversRoot(), { recursive: true });
  await removeCover(projectId);
  await writeFile(coverPath(projectId, ext), data);
}

export async function removeCover(projectId: string) {
  const entries = await readdir(coversRoot()).catch(() => [] as string[]);
  await Promise.all(
    entries
      .filter((name) => name.startsWith(`${projectId}.`))
      .map((name) => rm(path.join(coversRoot(), name), { force: true })),
  );
}

export async function removeProjectFiles(projectId: string) {
  await Promise.all([removeModelFiles(projectId), removeCover(projectId)]);
}
