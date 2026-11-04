import { Box, Building2, FolderKanban, Plus, Users } from "lucide-react";
import Link from "next/link";
import { ProjectTable } from "@/components/admin/project-table";
import { StatTile } from "@/components/admin/stat-tile";
import { buttonClass } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";

export default async function AdminDashboardPage() {
  await requireAdmin();
  const [companies, users, activeUsers, projects, withModel, recent] = await Promise.all([
    db.company.count(),
    db.user.count({ where: { role: "CLIENT" } }),
    db.user.count({ where: { role: "CLIENT", active: true } }),
    db.project.count(),
    db.project.count({ where: { modelVersion: { not: null } } }),
    db.project.findMany({ orderBy: { updatedAt: "desc" }, take: 6, include: { company: { select: { id: true, name: true } } } }),
  ]);

  return (
    <>
      <PageHeader
        title="Dashboard"
        actions={<Link href="/admin/projects/new" className={buttonClass("primary")}><Plus className="size-4" aria-hidden /> New project</Link>}
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Companies" value={companies} detail="Builders on the portal" href="/admin/companies" icon={Building2} />
        <StatTile label="Users" value={users} detail={`${activeUsers} active`} href="/admin/users" icon={Users} />
        <StatTile label="Projects" value={projects} detail="Across all companies" href="/admin/projects" icon={FolderKanban} />
        <StatTile label="3D models" value={withModel} detail={`${projects - withModel} projects pending`} href="/admin/projects" icon={Box} />
      </div>
      <Card>
        <CardHeader title="Recently updated projects" />
        {recent.length ? (
          <ProjectTable projects={recent} />
        ) : (
          <EmptyState icon={FolderKanban} title="No projects yet" description="Start by adding a builder company, then its projects." action={<Link href="/admin/companies/new" className={buttonClass("secondary")}>Add a company</Link>} />
        )}
      </Card>
    </>
  );
}
