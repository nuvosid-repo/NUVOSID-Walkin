import { Building2 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { createProjectAction } from "@/actions/projects";
import { ProjectForm } from "@/components/admin/project-form";
import { buttonClass } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = { title: "New project" };

export default async function NewProjectPage({ searchParams }: { searchParams: Promise<{ company?: string }> }) {
  await requireAdmin();
  const { company } = await searchParams;
  const companies = await db.company.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } });

  return (
    <div className="max-w-3xl">
      <PageHeader title="New project" description="Step 1 of 2: enter the property details. Step 2 is the 3D model, where you paste the HTML code or upload a file." back={{ href: "/admin/projects", label: "Projects" }} />
      <Card>
        {companies.length ? (
          <ProjectForm action={createProjectAction} companies={companies} defaultCompanyId={company} submitLabel="Save and continue to 3D model" />
        ) : (
          <EmptyState icon={Building2} title="Add a company first" description="Every project belongs to a builder company." action={<Link href="/admin/companies/new" className={buttonClass("secondary")}>Add a company</Link>} />
        )}
      </Card>
    </div>
  );
}
