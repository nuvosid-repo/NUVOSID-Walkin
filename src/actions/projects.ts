"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { MAX_COVER_BYTES, PROJECT_STATUSES, PROPERTY_TYPES } from "@/lib/constants";
import { db } from "@/lib/db";
import { fieldErrorsOf, parseForm, type ActionState } from "@/lib/form";
import { requireAdmin } from "@/lib/session";
import { removeCover, removeProjectFiles, writeCover } from "@/lib/storage";

const text = (max: number) => z.string().trim().max(max);

const projectSchema = z.object({
  companyId: z.string().min(1, "Select a company"),
  name: z.string().trim().min(2, "Enter the project name").max(120),
  tagline: text(160),
  propertyType: z.enum(PROPERTY_TYPES),
  status: z.enum(PROJECT_STATUSES),
  city: text(80),
  address: text(300),
  configuration: text(120),
  area: text(80),
  priceRange: text(80),
  possession: text(80),
  reraNumber: text(80),
  totalFloors: text(20),
  totalUnits: text(20),
  amenities: text(1000),
  description: text(4000),
});

/** Detects the type from the file's first bytes, not the name or the browser's claim. */
function detectImageExt(bytes: Uint8Array) {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpg";
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "png";
  const ascii = String.fromCharCode(...bytes.slice(0, 12));
  if (ascii.startsWith("RIFF") && ascii.slice(8) === "WEBP") return "webp";
  return null;
}

async function readCover(formData: FormData) {
  const file = formData.get("cover");
  if (!(file instanceof File) || file.size === 0) return { cover: null };
  if (file.size > MAX_COVER_BYTES) return { coverError: "Cover image must be under 10 MB" };
  const data = new Uint8Array(await file.arrayBuffer());
  const ext = detectImageExt(data);
  if (!ext) return { coverError: "Use a JPG, PNG or WebP image" };
  return { cover: { ext, data } };
}

const fix = "Please fix the highlighted fields.";

export async function createProjectAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = parseForm(projectSchema, formData);
  if (!parsed.success) return fieldErrorsOf(parsed.error);
  if (!(await db.company.findUnique({ where: { id: parsed.data.companyId } }))) {
    return { error: fix, fieldErrors: { companyId: ["Select a company"] } };
  }
  const { cover, coverError } = await readCover(formData);
  if (coverError) return { error: fix, fieldErrors: { cover: [coverError] } };

  const project = await db.project.create({ data: { ...parsed.data, coverExt: cover?.ext ?? "" } });
  if (cover) await writeCover(project.id, cover.ext, cover.data);

  revalidatePath("/admin", "layout");
  redirect(`/admin/projects/${project.id}?created=1`);
}

export async function updateProjectAction(id: string, _: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = parseForm(projectSchema, formData);
  if (!parsed.success) return fieldErrorsOf(parsed.error);
  if (!(await db.company.findUnique({ where: { id: parsed.data.companyId } }))) {
    return { error: fix, fieldErrors: { companyId: ["Select a company"] } };
  }
  const { cover, coverError } = await readCover(formData);
  if (coverError) return { error: fix, fieldErrors: { cover: [coverError] } };

  const removing = formData.get("removeCover") === "on" && !cover;
  await db.project.update({
    where: { id },
    data: { ...parsed.data, ...(cover ? { coverExt: cover.ext } : removing ? { coverExt: "" } : {}) },
  });
  if (cover) await writeCover(id, cover.ext, cover.data);
  else if (removing) await removeCover(id);

  revalidatePath("/admin", "layout");
  revalidatePath("/projects", "layout");
  return { success: "Property details saved." };
}

export async function setProjectPublishedAction(id: string, published: boolean) {
  await requireAdmin();
  await db.project.update({ where: { id }, data: { published } });
  revalidatePath("/admin", "layout");
  revalidatePath("/projects", "layout");
}

export async function deleteProjectAction(id: string, options?: { goToList?: boolean }) {
  await requireAdmin();
  await db.project.delete({ where: { id } });
  await removeProjectFiles(id);
  revalidatePath("/admin", "layout");
  revalidatePath("/projects", "layout");
  if (options?.goToList) redirect("/admin/projects");
}
