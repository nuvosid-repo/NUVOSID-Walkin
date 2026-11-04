"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { fieldErrorsOf, parseForm, type ActionState } from "@/lib/form";
import { requireAdmin } from "@/lib/session";
import { removeProjectFiles } from "@/lib/storage";

const companySchema = z.object({
  name: z.string().trim().min(2, "Enter the company name").max(120),
  contactPerson: z.string().trim().max(120),
  email: z.union([z.literal(""), z.string().trim().email("Enter a valid email")]),
  phone: z.string().trim().max(30),
  city: z.string().trim().max(80),
  address: z.string().trim().max(300),
  website: z.string().trim().max(200).regex(/^(https?:\/\/.+)?$/i, "Start the link with https://"),
  notes: z.string().trim().max(2000),
});

export async function createCompanyAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = parseForm(companySchema, formData);
  if (!parsed.success) return fieldErrorsOf(parsed.error);
  const company = await db.company.create({ data: parsed.data });
  revalidatePath("/admin", "layout");
  redirect(`/admin/companies/${company.id}`);
}

export async function updateCompanyAction(id: string, _: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = parseForm(companySchema, formData);
  if (!parsed.success) return fieldErrorsOf(parsed.error);
  await db.company.update({ where: { id }, data: parsed.data });
  revalidatePath("/admin", "layout");
  return { success: "Company saved." };
}

export async function deleteCompanyAction(id: string) {
  await requireAdmin();
  const projects = await db.project.findMany({ where: { companyId: id }, select: { id: true } });
  await db.company.delete({ where: { id } });
  await Promise.all(projects.map((project) => removeProjectFiles(project.id)));
  revalidatePath("/admin", "layout");
  redirect("/admin/companies");
}
