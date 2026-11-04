import { Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { UserCreateForm } from "@/components/admin/user-create-form";
import { UserTable } from "@/components/admin/user-table";
import { buttonClass } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { SearchBox } from "@/components/ui/search-box";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = { title: "Users" };

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ q?: string; company?: string }> }) {
  await requireAdmin();
  const { q: rawQuery, company } = await searchParams;
  const q = rawQuery?.trim() ?? "";
  const [users, companies] = await Promise.all([
    db.user.findMany({
      where: {
        role: "CLIENT",
        ...(q ? { OR: [{ name: { contains: q } }, { username: { contains: q } }, { company: { name: { contains: q } } }] } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: { company: { select: { id: true, name: true } } },
    }),
    db.company.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <>
      <PageHeader title="Users" description="Create a login, then share the user ID and passcode with the client." />
      <div className="space-y-6">
        <div id="create" className="scroll-mt-20">
          <Card>
            <CardHeader title="Create user" />
            {companies.length ? (
              <UserCreateForm companies={companies} defaultCompanyId={company} />
            ) : (
              <EmptyState icon={Users} title="Add a company first" description="Every user belongs to a builder company." action={<Link href="/admin/companies/new" className={buttonClass("secondary")}>Add a company</Link>} />
            )}
          </Card>
        </div>
        <div>
          <div className="mb-4"><SearchBox action="/admin/users" defaultValue={q} placeholder="Search users" /></div>
          <Card>
            {users.length ? <UserTable users={users} companies={companies} /> : <EmptyState icon={Users} title={q ? `No users match “${q}”` : "No users yet"} />}
          </Card>
        </div>
      </div>
    </>
  );
}
