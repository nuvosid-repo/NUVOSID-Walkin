import { FolderKanban, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { ProjectTable } from "@/components/admin/project-table";
import { buttonClass } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { SearchBox } from "@/components/ui/search-box";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = { title: "Projects" };

export default async function AdminProjectsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireAdmin();
  const q = (await searchParams).q?.trim() ?? "";
  const projects = await db.project.findMany({
    where: q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { city: { contains: q, mode: "insensitive" } }, { company: { name: { contains: q, mode: "insensitive" } } }] } : undefined,
    orderBy: { updatedAt: "desc" },
    include: { company: { select: { id: true, name: true } } },
  });

  return (
    <>
      <PageHeader
        title="Projects"
        description="Property details and 3D models for every builder."
        actions={<Link href="/admin/projects/new" className={buttonClass("primary")}><Plus className="size-4" aria-hidden /> New project</Link>}
      />
      <div className="mb-4"><SearchBox action="/admin/projects" defaultValue={q} placeholder="Search projects or companies" /></div>
      <Card>
        {projects.length ? (
          <ProjectTable projects={projects} />
        ) : q ? (
          <EmptyState icon={FolderKanban} title={`No projects match “${q}”`} />
        ) : (
          <EmptyState icon={FolderKanban} title="No projects yet" action={<Link href="/admin/projects/new" className={buttonClass("secondary")}>Add a project</Link>} />
        )}
      </Card>
    </>
  );
}
