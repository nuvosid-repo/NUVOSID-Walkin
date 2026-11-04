import path from "node:path";
import { db } from "./db";
import { isJunkModelPath, MAX_MODEL_BYTES, MAX_MODEL_FILES } from "./constants";

export class ModelPackageError extends Error {}

/** Normalizes a file path from an upload, or returns null if it's unusable. */
export function cleanModelPath(name: string) {
  const normalized = path.posix.normalize(name.replaceAll("\\", "/"));
  if (
    !normalized ||
    normalized === "." ||
    normalized === ".." ||
    normalized.startsWith("../") ||
    normalized.startsWith("/") ||
    /^[a-zA-Z]:/.test(normalized) ||
    isJunkModelPath(normalized)
  ) {
    return null;
  }
  return normalized;
}

type FinishedModel = { entry: string; size: number; fileCount: number; warnings: string[] };

/** Checks an uploaded version is complete and usable, before it replaces the live model. */
export async function checkUploadedModel(projectId: string, version: string, kind: "html" | "zip"): Promise<FinishedModel> {
  const chunks = await db.modelChunk.findMany({
    where: { projectId, version },
    select: { path: true, index: true, total: true, size: true },
  });

  const files = new Map<string, { total: number; received: number }>();
  let size = 0;
  for (const chunk of chunks) {
    const file = files.get(chunk.path) ?? { total: chunk.total, received: 0 };
    file.received += 1;
    files.set(chunk.path, file);
    size += chunk.size;
  }

  if (!files.size) throw new ModelPackageError("Nothing was uploaded. Please try again.");
  if (size > MAX_MODEL_BYTES) throw new ModelPackageError("This model is larger than the 200 MB limit.");
  if (files.size > MAX_MODEL_FILES) throw new ModelPackageError("This model has too many files.");
  for (const [name, file] of files) {
    if (file.received !== file.total) throw new ModelPackageError(`${name} didn't upload completely. Please try again.`);
  }

  const names = [...files.keys()];
  const entry = findEntry(names);
  if (!entry) throw new ModelPackageError("No HTML file found. Include an index.html.");

  const html = await readEntryHtml(projectId, version, entry);
  if (kind === "html") {
    if (!html.trim()) throw new ModelPackageError("The HTML is empty.");
    if (!/<(!doctype|html|body|script|canvas|iframe|div)\b/i.test(html)) {
      throw new ModelPackageError("This doesn't look like HTML. Paste the full code of the walkthrough page.");
    }
  }

  return { entry, size, fileCount: names.length, warnings: missingFileWarnings(html, entry, new Set(names)) };
}

async function readEntryHtml(projectId: string, version: string, entry: string) {
  const chunks = await db.modelChunk.findMany({
    where: { projectId, version, path: entry },
    orderBy: { index: "asc" },
    select: { data: true },
  });
  return Buffer.concat(chunks.map((chunk) => chunk.data)).toString("utf8");
}

function findEntry(names: string[]) {
  const html = names.filter((name) => /\.html?$/i.test(name));
  const byDepth = (a: string, b: string) => a.split("/").length - b.split("/").length || a.localeCompare(b);
  const index = html.filter((name) => /(^|\/)index\.html?$/i.test(name)).sort(byDepth);
  return index[0] ?? html.sort(byDepth)[0];
}

/**
 * A walkthrough page often loads local files (three.module.js, voice.js...). Pasting only
 * the HTML leaves a blank screen, so name the missing files for the admin instead.
 */
function missingFileWarnings(html: string, entry: string, available: Set<string>) {
  const refs = new Set<string>();
  const patterns = [
    /\b(?:src|href)\s*=\s*["']([^"']+)["']/gi,
    /\bfrom\s+["']([^"']+)["']/g,
    /\bimport\s*\(?\s*["']([^"']+)["']/g,
    /"[^"\n]+"\s*:\s*"(\.{1,2}\/[^"]+)"/g,
  ];
  for (const pattern of patterns) {
    for (const match of html.matchAll(pattern)) refs.add(match[1]);
  }

  const base = path.posix.dirname(entry);
  const missing: string[] = [];
  for (const ref of refs) {
    if (!/^\.{0,2}\/?[\w-]/.test(ref) || /^[a-z][a-z0-9+.-]*:/i.test(ref) || ref.startsWith("//")) continue;
    // Bare names like "three" are import-map keys. Only names with a file extension are files.
    if (!ref.startsWith(".") && !/\.[a-z0-9]{1,6}($|[?#])/i.test(ref)) continue;
    const clean = ref.split(/[?#]/)[0];
    if (clean.startsWith("/")) continue;
    if (!available.has(path.posix.normalize(path.posix.join(base, clean)))) missing.push(clean);
  }
  if (!missing.length) return [];
  const shown = missing.slice(0, 5).join(", ");
  const more = missing.length > 5 ? ` and ${missing.length - 5} more` : "";
  return [`This page needs files that weren't uploaded: ${shown}${more}. Upload everything together as a ZIP, or the walkthrough may not load.`];
}
