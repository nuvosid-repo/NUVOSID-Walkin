import { FolderKanban, Plus, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { updateCompanyAction } from "@/actions/companies";
import { CompanyForm } from "@/components/admin/company-form";
import { DeleteCompanyButton } from "@/components/admin/delete-company-button";
import { ProjectTable } from "@/components/admin/project-table";
import { UserTable } from "@/components/admin/user-table";
import { buttonClass } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = { title: "Company" };

export default async function CompanyPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const company = await db.company.findUnique({
    where: { id },
    include: {
      users: { orderBy: { createdAt: "desc" }, include: { company: { select: { id: true, name: true } } } },
      projects: { orderBy: { createdAt: "desc" }, include: { company: { select: { id: true, name: true } } } },
    },
  });
  if (!company) notFound();
  const companies = await db.company.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } });

  return (
    <>
      <PageHeader
        title={company.name}
        back={{ href: "/admin/companies", label: "Companies" }}
        actions={<DeleteCompanyButton id={company.id} name={company.name} users={company.users.length} projects={company.projects.length} />}
      />
      <div className="space-y-6">
        <Card>
          <CardHeader
            title="Projects"
            action={<Link href={`/admin/projects/new?company=${company.id}`} className={buttonClass("secondary", "sm")}><Plus className="size-3.5" aria-hidden /> Add project</Link>}
          />
          {company.projects.length ? <ProjectTable projects={company.projects} showCompany={false} /> : <EmptyState icon={FolderKanban} title="No projects yet" />}
        </Card>
        <Card>
          <CardHeader
            title="Users"
            description="Everyone here sees all visible projects of this company."
            action={<Link href={`/admin/users?company=${company.id}#create`} className={buttonClass("secondary", "sm")}><Plus className="size-3.5" aria-hidden /> Add user</Link>}
          />
          {company.users.length ? <UserTable users={company.users} companies={companies} showCompany={false} /> : <EmptyState icon={Users} title="No users yet" />}
        </Card>
        <div id="details" className="scroll-mt-20">
        <Card>
          <CardHeader title="Company details" />
          <CompanyForm action={updateCompanyAction.bind(null, company.id)} company={company} submitLabel="Save changes" />
        </Card>
        </div>
      </div>
    </>
  );
}
