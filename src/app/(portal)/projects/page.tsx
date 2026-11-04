import { Box } from "lucide-react";
import type { Metadata } from "next";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { ProjectBrowser } from "@/components/portal/project-browser";
import { db } from "@/lib/db";
import { coverUrl } from "@/lib/format";
import { requireClient } from "@/lib/session";

export const metadata: Metadata = { title: "Your projects" };

export default async function ProjectsPage() {
  const user = await requireClient();
  const projects = user.companyId
    ? await db.project.findMany({ where: { companyId: user.companyId, published: true }, orderBy: { createdAt: "desc" } })
    : [];
  const company = user.companyId ? await db.company.findUnique({ where: { id: user.companyId } }) : null;

  return (
    <>
      <PageHeader
        title={company?.name ?? "Your projects"}
        description={`${projects.length} ${projects.length === 1 ? "project" : "projects"}`}
      />
      {projects.length ? (
        <ProjectBrowser
          projects={projects.map((project) => ({
            id: project.id,
            name: project.name,
            tagline: project.tagline,
            city: project.city,
            status: project.status,
            configuration: project.configuration,
            area: project.area,
            cover: coverUrl(project),
            hasModel: !!project.modelVersion,
          }))}
        />
      ) : (
        <Card>
          <EmptyState icon={Box} title="No projects yet" description="Your projects will appear here as soon as NUVOSID adds them." />
        </Card>
      )}
    </>
  );
}
