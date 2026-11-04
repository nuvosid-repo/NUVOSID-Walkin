import type { Metadata } from "next";
import { createCompanyAction } from "@/actions/companies";
import { CompanyForm } from "@/components/admin/company-form";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = { title: "New company" };

export default async function NewCompanyPage() {
  await requireAdmin();
  return (
    <div className="max-w-3xl">
      <PageHeader title="New company" back={{ href: "/admin/companies", label: "Companies" }} />
      <Card><CompanyForm action={createCompanyAction} submitLabel="Create company" /></Card>
    </div>
  );
}
