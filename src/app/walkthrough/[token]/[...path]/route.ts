import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { canViewProject } from "@/lib/session";
import { resolveModelFile } from "@/lib/storage";
import { verifyWalkthroughToken } from "@/lib/walkthrough-token";

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".htm": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".map": "application/json",
  ".wasm": "application/wasm",
  ".glb": "model/gltf-binary",
  ".gltf": "model/gltf+json",
  ".bin": "application/octet-stream",
  ".ktx2": "image/ktx2",
  ".hdr": "application/octet-stream",
  ".exr": "application/octet-stream",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".ogg": "audio/ogg",
  ".m4a": "audio/mp4",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
  ".txt": "text/plain; charset=utf-8",
};

const SECURITY_HEADERS = {
  // Uploaded code runs with no access to this portal's origin, cookies or APIs, even if opened directly.
  "Content-Security-Policy": "sandbox allow-scripts allow-pointer-lock allow-forms allow-modals; frame-ancestors 'self'",
  // Sandboxed pages have an opaque origin, so their module imports are cross-origin requests.
  "Access-Control-Allow-Origin": "*",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
};

const notFound = () => new Response("Not found", { status: 404, headers: SECURITY_HEADERS });

export async function GET(_request: NextRequest, context: RouteContext<"/walkthrough/[token]/[...path]">) {
  const { token, path: segments } = await context.params;

  const access = await verifyWalkthroughToken(token);
  if (!access) return notFound();

  const [user, project] = await Promise.all([
    db.user.findUnique({ where: { id: access.userId } }),
    db.project.findUnique({ where: { id: access.projectId } }),
  ]);
  if (!user?.active || user.sessionVersion !== access.sessionVersion) return notFound();
  if (!project?.modelVersion || project.modelVersion !== access.version) return notFound();
  if (!canViewProject(user, project)) return notFound();

  const file = resolveModelFile(project.id, segments);
  if (!file) return notFound();
  const info = await stat(file).catch(() => null);
  if (!info?.isFile()) return notFound();

  const ext = path.extname(file).toLowerCase();
  const isHtml = ext === ".html" || ext === ".htm";

  return new Response(Readable.toWeb(createReadStream(file)) as ReadableStream, {
    headers: {
      ...SECURITY_HEADERS,
      "Content-Type": MIME[ext] ?? "application/octet-stream",
      "Content-Length": String(info.size),
      "Cache-Control": isHtml ? "private, no-store" : "private, max-age=3600",
    },
  });
}
