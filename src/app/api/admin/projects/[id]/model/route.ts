import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { MAX_MODEL_UPLOAD_BYTES } from "@/lib/constants";
import { db } from "@/lib/db";
import { ModelPackageError, packageFromHtml, packageFromZip, type ModelPackage } from "@/lib/model-package";
import { getCurrentAdmin } from "@/lib/session";
import { removeModelFiles, replaceModelFiles } from "@/lib/storage";

type Context = RouteContext<"/api/admin/projects/[id]/model">;

const fail = (error: string, status = 400) => NextResponse.json({ error }, { status });

async function authorize(context: Context) {
  if (!(await getCurrentAdmin())) return null;
  const { id } = await context.params;
  return db.project.findUnique({ where: { id } });
}

function refresh() {
  revalidatePath("/admin", "layout");
  revalidatePath("/projects", "layout");
}

export async function POST(request: NextRequest, context: Context) {
  const project = await authorize(context);
  if (!project) return fail("Not allowed.", 403);

  if (Number(request.headers.get("content-length") ?? 0) > MAX_MODEL_UPLOAD_BYTES) {
    return fail("This upload is larger than the 300 MB limit.", 413);
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return fail("The upload could not be read. Please try again.");
  }

  let modelPackage: ModelPackage;
  try {
    const file = form.get("file");
    const html = form.get("html");
    if (file instanceof File && file.size > 0) {
      const data = new Uint8Array(await file.arrayBuffer());
      if (/\.zip$/i.test(file.name)) modelPackage = packageFromZip(data);
      else if (/\.html?$/i.test(file.name)) modelPackage = packageFromHtml(new TextDecoder().decode(data));
      else return fail("Upload an .html or .zip file.");
    } else if (typeof html === "string") {
      modelPackage = packageFromHtml(html);
    } else {
      return fail("Paste the HTML code or choose a file.");
    }
  } catch (error) {
    if (error instanceof ModelPackageError) return fail(error.message);
    throw error;
  }

  await replaceModelFiles(project.id, modelPackage.files);
  await db.project.update({
    where: { id: project.id },
    data: {
      modelKind: modelPackage.kind,
      modelEntry: modelPackage.entry,
      modelVersion: randomUUID().slice(0, 8),
      modelSize: modelPackage.size,
      modelFileCount: modelPackage.files.length,
      modelUploadedAt: new Date(),
    },
  });
  refresh();
  return NextResponse.json({ ok: true, warnings: modelPackage.warnings });
}

export async function DELETE(_request: NextRequest, context: Context) {
  const project = await authorize(context);
  if (!project) return fail("Not allowed.", 403);

  await removeModelFiles(project.id);
  await db.project.update({
    where: { id: project.id },
    data: { modelKind: null, modelEntry: null, modelVersion: null, modelSize: 0, modelFileCount: 0, modelUploadedAt: null },
  });
  refresh();
  return NextResponse.json({ ok: true });
}
