import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { WalkthroughViewer } from "@/components/viewer/walkthrough-viewer";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { toPropertyDetails, walkthroughSrc } from "@/lib/viewer-data";

export const metadata: Metadata = { title: "Preview" };

export default async function AdminPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  const { id } = await params;
  const project = await db.project.findUnique({ where: { id }, include: { company: true } });
  if (!project) notFound();
  if (!project.modelVersion) redirect(`/admin/projects/${id}`);

  return (
    <WalkthroughViewer
      src={await walkthroughSrc(admin, project)}
      backHref={`/admin/projects/${id}`}
      backLabel="Back to project"
      property={toPropertyDetails(project)}
      notice="Admin preview"
    />
  );
}
