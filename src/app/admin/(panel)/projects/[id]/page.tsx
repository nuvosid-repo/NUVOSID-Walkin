import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { updateProjectAction } from "@/actions/projects";
import { ModelManager } from "@/components/admin/model-manager";
import { ProjectActions } from "@/components/admin/project-actions";
import { ProjectForm } from "@/components/admin/project-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";
import { FormAlert } from "@/components/ui/form-alert";
import { PageHeader } from "@/components/ui/page-header";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = { title: "Project" };

export default async function AdminProjectPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const { created } = await searchParams;
  const [project, companies] = await Promise.all([
    db.project.findUnique({ where: { id }, include: { company: true } }),
    db.company.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  if (!project) notFound();

  return (
    <div className="max-w-3xl">
      <PageHeader
        title={project.name}
        description={
          <span className="flex flex-wrap items-center gap-2">
            {project.company.name}
            {project.published ? <Badge tone="success">Visible to users</Badge> : <Badge>Hidden</Badge>}
          </span>
        }
        back={{ href: "/admin/projects", label: "Projects" }}
        actions={<ProjectActions id={project.id} name={project.name} published={project.published} />}
      />
      <div className="space-y-6">
        {created && !project.modelVersion && <FormAlert success="Project created. Now upload its 3D model below." />}
        <div id="model" className="scroll-mt-20">
        <Card>
          <CardHeader title="3D model" description="Paste the walkthrough's HTML code, or upload it as a file." />
          <ModelManager
            projectId={project.id}
            model={project.modelVersion ? { kind: project.modelKind ?? "html", size: project.modelSize, fileCount: project.modelFileCount, uploadedAt: project.modelUploadedAt } : null}
          />
        </Card>
        </div>
        <div id="details" className="scroll-mt-20">
        <Card>
          <CardHeader title="Property details" description="Shown to users in the walkthrough's Details panel." />
          <ProjectForm action={updateProjectAction.bind(null, project.id)} companies={companies} project={project} submitLabel="Save changes" />
        </Card>
        </div>
      </div>
    </div>
  );
}
