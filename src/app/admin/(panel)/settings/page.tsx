import type { Metadata } from "next";
import { ChangePasswordForm } from "@/components/admin/change-password-form";
import { Card, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const admin = await requireAdmin();
  return (
    <div className="max-w-3xl">
      <PageHeader title="Settings" description={<>Signed in as <span className="text-soft">{admin.username}</span></>} />
      <Card>
        <CardHeader title="Change password" description="Other signed-in devices will be signed out." />
        <ChangePasswordForm />
      </Card>
    </div>
  );
}
