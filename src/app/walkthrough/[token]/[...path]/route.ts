import path from "node:path";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { canViewProject } from "@/lib/session";
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

  const key = { projectId: project.id, version: project.modelVersion };
  const filePath = segments.map(safeDecode).join("/");
  const chunks = await db.modelChunk.findMany({
    where: { ...key, path: filePath },
    orderBy: { index: "asc" },
    select: { index: true, size: true },
  });
  if (!chunks.length) return notFound();

  // Loaded one chunk at a time, so a large file is never held in memory whole.
  let next = 0;
  const body = new ReadableStream<Uint8Array>({
    async pull(controller) {
      if (next >= chunks.length) {
        controller.close();
        return;
      }
      const chunk = await db.modelChunk.findUnique({
        where: { projectId_version_path_index: { ...key, path: filePath, index: chunks[next].index } },
        select: { data: true },
      });
      if (!chunk) {
        controller.error(new Error(`Missing chunk of ${filePath}`));
        return;
      }
      controller.enqueue(chunk.data);
      next += 1;
    },
  });

  const ext = path.extname(filePath).toLowerCase();
  const isHtml = ext === ".html" || ext === ".htm";

  return new Response(body, {
    headers: {
      ...SECURITY_HEADERS,
      "Content-Type": MIME[ext] ?? "application/octet-stream",
      "Content-Length": String(chunks.reduce((total, chunk) => total + chunk.size, 0)),
      "Cache-Control": isHtml ? "private, no-store" : "private, max-age=3600",
    },
  });
}

function safeDecode(segment: string) {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}
