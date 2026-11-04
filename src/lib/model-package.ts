import path from "node:path";
import { unzipSync } from "fflate";
import { MAX_MODEL_EXTRACTED_BYTES, MAX_MODEL_FILES } from "./constants";
import type { ModelFile } from "./storage";

export class ModelPackageError extends Error {}

export type ModelPackage = {
  kind: "html" | "zip";
  entry: string;
  files: ModelFile[];
  size: number;
  warnings: string[];
};

export function packageFromHtml(html: string): ModelPackage {
  if (!html.trim()) throw new ModelPackageError("The HTML is empty.");
  if (!/<(!doctype|html|body|script|canvas|iframe|div)\b/i.test(html)) {
    throw new ModelPackageError("This doesn't look like HTML. Paste the full code of the walkthrough page.");
  }
  const data = new TextEncoder().encode(html);
  const entry = "index.html";
  return {
    kind: "html",
    entry,
    files: [{ path: entry, data }],
    size: data.byteLength,
    warnings: missingFileWarnings(html, entry, new Set([entry])),
  };
}

export function packageFromZip(buffer: Uint8Array): ModelPackage {
  let declaredTotal = 0;
  let declaredCount = 0;
  let unzipped: Record<string, Uint8Array>;
  try {
    unzipped = unzipSync(buffer, {
      filter(file) {
        if (isJunk(file.name) || file.name.endsWith("/")) return false;
        declaredTotal += file.originalSize;
        declaredCount += 1;
        if (declaredTotal > MAX_MODEL_EXTRACTED_BYTES || declaredCount > MAX_MODEL_FILES) {
          throw new ModelPackageError("This ZIP is too large once extracted.");
        }
        return true;
      },
    });
  } catch (error) {
    if (error instanceof ModelPackageError) throw error;
    throw new ModelPackageError("This file couldn't be read as a ZIP.");
  }

  const files: ModelFile[] = Object.entries(unzipped).map(([name, data]) => ({ path: safePath(name), data }));
  if (!files.length) throw new ModelPackageError("This ZIP is empty.");

  const entry = findEntry(files);
  if (!entry) throw new ModelPackageError("No HTML file found in this ZIP. Include an index.html.");

  const html = new TextDecoder().decode(files.find((file) => file.path === entry)!.data);
  return {
    kind: "zip",
    entry,
    files,
    size: files.reduce((total, file) => total + file.data.byteLength, 0),
    warnings: missingFileWarnings(html, entry, new Set(files.map((file) => file.path))),
  };
}

function isJunk(name: string) {
  return name.startsWith("__MACOSX/") || name.split("/").some((part) => part === ".DS_Store" || part === "Thumbs.db");
}

function safePath(name: string) {
  const normalized = path.posix.normalize(name.replaceAll("\\", "/"));
  if (normalized.startsWith("/") || normalized.startsWith("../") || normalized === ".." || /^[a-zA-Z]:/.test(normalized)) {
    throw new ModelPackageError(`Unsafe file path in ZIP: ${name}`);
  }
  return normalized;
}

function findEntry(files: ModelFile[]) {
  const html = files.map((file) => file.path).filter((name) => /\.html?$/i.test(name));
  const byDepth = (a: string, b: string) => a.split("/").length - b.split("/").length || a.localeCompare(b);
  const index = html.filter((name) => /(^|\/)index\.html?$/i.test(name)).sort(byDepth);
  return index[0] ?? html.sort(byDepth)[0];
}

/**
 * A walkthrough page often loads local files (three.module.js, voice.js...). Pasting only
 * the HTML leaves a blank screen, so name the missing files for the admin instead.
 */
export function missingFileWarnings(html: string, entry: string, available: Set<string>) {
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
