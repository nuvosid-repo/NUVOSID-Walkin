import { readFile } from "node:fs/promises";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { canViewProject, getCurrentAdmin, getCurrentClient } from "@/lib/session";
import { coverPath } from "@/lib/storage";

const TYPES: Record<string, string> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp" };

export async function GET(_request: NextRequest, context: RouteContext<"/api/covers/[id]">) {
  const { id } = await context.params;
  const user = (await getCurrentAdmin()) ?? (await getCurrentClient());
  if (!user) return new Response("Unauthorized", { status: 401 });

  const project = await db.project.findUnique({ where: { id } });
  if (!project?.coverExt || !canViewProject(user, project)) return new Response("Not found", { status: 404 });

  const data = await readFile(coverPath(id, project.coverExt)).catch(() => null);
  if (!data) return new Response("Not found", { status: 404 });

  return new Response(data, {
    headers: {
      "Content-Type": TYPES[project.coverExt] ?? "application/octet-stream",
      "Cache-Control": "private, max-age=86400",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
