import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { MODEL_CHUNK_BYTES } from "@/lib/constants";
import { db } from "@/lib/db";
import { checkUploadedModel, cleanModelPath, ModelPackageError } from "@/lib/model-package";
import { getCurrentAdmin } from "@/lib/session";

// Upload steps: POST "start", PUT each chunk, POST "finish". The live model only
// changes at "finish", so a failed or abandoned upload leaves it untouched.

type Context = RouteContext<"/api/admin/projects/[id]/model">;

const fail = (error: string, status = 400) => NextResponse.json({ error }, { status });

async function authorize(context: Context) {
  if (!(await getCurrentAdmin())) return null;
  const { id } = await context.params;
  return db.project.findUnique({ where: { id }, select: { id: true, modelVersion: true } });
}

function refresh() {
  revalidatePath("/admin", "layout");
  revalidatePath("/projects", "layout");
}

export async function POST(request: NextRequest, context: Context) {
  const project = await authorize(context);
  if (!project) return fail("Not allowed.", 403);

  const body = await request.json().catch(() => null);

  if (body?.action === "start") {
    // Clears pieces left by earlier uploads that never finished.
    await db.modelChunk.deleteMany({
      where: { projectId: project.id, version: { not: project.modelVersion ?? "" } },
    });
    return NextResponse.json({ version: randomUUID().slice(0, 8) });
  }

  if (body?.action === "finish" && typeof body.version === "string") {
    const kind = body.kind === "zip" ? "zip" : "html";
    try {
      const model = await checkUploadedModel(project.id, body.version, kind);
      await db.project.update({
        where: { id: project.id },
        data: {
          modelKind: kind,
          modelEntry: model.entry,
          modelVersion: body.version,
          modelSize: model.size,
          modelFileCount: model.fileCount,
          modelUploadedAt: new Date(),
        },
      });
      await db.modelChunk.deleteMany({ where: { projectId: project.id, version: { not: body.version } } });
      refresh();
      return NextResponse.json({ ok: true, warnings: model.warnings });
    } catch (error) {
      await db.modelChunk.deleteMany({ where: { projectId: project.id, version: body.version } });
      if (error instanceof ModelPackageError) return fail(error.message);
      throw error;
    }
  }

  return fail("Unknown upload step.");
}

export async function PUT(request: NextRequest, context: Context) {
  const project = await authorize(context);
  if (!project) return fail("Not allowed.", 403);

  const params = request.nextUrl.searchParams;
  const version = params.get("version");
  const filePath = cleanModelPath(params.get("path") ?? "");
  const index = Number(params.get("index"));
  const total = Number(params.get("total"));

  if (!version || version === project.modelVersion) return fail("Invalid upload.");
  if (!filePath) return fail(`Unsafe file path: ${params.get("path")}`);
  if (!Number.isInteger(index) || !Number.isInteger(total) || index < 0 || total < 1 || index >= total) {
    return fail("Invalid upload.");
  }

  const data = new Uint8Array(await request.arrayBuffer());
  if (data.byteLength > MODEL_CHUNK_BYTES) return fail("This piece of the upload is too large.", 413);

  await db.modelChunk.upsert({
    where: { projectId_version_path_index: { projectId: project.id, version, path: filePath, index } },
    create: { projectId: project.id, version, path: filePath, index, total, size: data.byteLength, data },
    update: { total, size: data.byteLength, data },
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: NextRequest, context: Context) {
  const project = await authorize(context);
  if (!project) return fail("Not allowed.", 403);

  await db.project.update({
    where: { id: project.id },
    data: { modelKind: null, modelEntry: null, modelVersion: null, modelSize: 0, modelFileCount: 0, modelUploadedAt: null },
  });
  await db.modelChunk.deleteMany({ where: { projectId: project.id } });
  refresh();
  return NextResponse.json({ ok: true });
}
