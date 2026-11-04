import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { WalkthroughViewer } from "@/components/viewer/walkthrough-viewer";
import { db } from "@/lib/db";
import { canViewProject, requireClient } from "@/lib/session";
import { toPropertyDetails, walkthroughSrc } from "@/lib/viewer-data";

export const metadata: Metadata = { title: "3D walkthrough" };

export default async function ProjectViewerPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireClient();
  const { id } = await params;
  const project = await db.project.findUnique({ where: { id }, include: { company: true } });
  if (!project || !canViewProject(user, project)) notFound();
  if (!project.modelVersion) redirect("/projects");

  return (
    <WalkthroughViewer
      src={await walkthroughSrc(user, project)}
      backHref="/projects"
      backLabel="All projects"
      property={toPropertyDetails(project)}
    />
  );
}
