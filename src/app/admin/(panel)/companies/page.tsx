import { Building2, Pencil, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { DeleteCompanyButton } from "@/components/admin/delete-company-button";
import { buttonClass } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { SearchBox } from "@/components/ui/search-box";
import { Table, Td, Th } from "@/components/ui/table";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = { title: "Companies" };

export default async function CompaniesPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireAdmin();
  const q = (await searchParams).q?.trim() ?? "";
  const companies = await db.company.findMany({
    where: q ? { OR: [{ name: { contains: q } }, { city: { contains: q } }, { contactPerson: { contains: q } }] } : undefined,
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { users: true, projects: true } } },
  });

  return (
    <>
      <PageHeader
        title="Companies"
        description="Builders and developers, each with their own users and projects."
        actions={<Link href="/admin/companies/new" className={buttonClass("primary")}><Plus className="size-4" aria-hidden /> New company</Link>}
      />
      <div className="mb-4"><SearchBox action="/admin/companies" defaultValue={q} placeholder="Search companies" /></div>
      <Card>
        {companies.length ? (
          <Table>
            <thead>
              <tr><Th>Company</Th><Th>Contact</Th><Th>City</Th><Th className="text-right">Users</Th><Th className="text-right">Projects</Th><Th className="text-right">Actions</Th></tr>
            </thead>
            <tbody>
              {companies.map((company) => (
                <tr key={company.id}>
                  <Td><Link href={`/admin/companies/${company.id}`} className="font-medium text-ink hover:text-gold-light">{company.name}</Link></Td>
                  <Td>{company.contactPerson || "—"}{company.phone && <div className="text-xs text-muted">{company.phone}</div>}</Td>
                  <Td>{company.city || "—"}</Td>
                  <Td className="text-right tabular-nums">{company._count.users}</Td>
                  <Td className="text-right tabular-nums">{company._count.projects}</Td>
                  <Td>
                    <div className="flex justify-end gap-1">
                      <Link href={`/admin/companies/${company.id}#details`} aria-label={`Edit ${company.name}`} title="Edit" className={buttonClass("ghost", "sm")}>
                        <Pencil className="size-3.5" aria-hidden />
                      </Link>
                      <DeleteCompanyButton id={company.id} name={company.name} users={company._count.users} projects={company._count.projects} compact />
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : q ? (
          <EmptyState icon={Building2} title={`No companies match “${q}”`} />
        ) : (
          <EmptyState icon={Building2} title="No companies yet" description="Add your first builder to start creating users and projects." action={<Link href="/admin/companies/new" className={buttonClass("secondary")}>Add a company</Link>} />
        )}
      </Card>
    </>
  );
}
