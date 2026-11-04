import { PortalHeader } from "@/components/portal/portal-header";
import { db } from "@/lib/db";
import { requireClient } from "@/lib/session";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const user = await requireClient();
  const company = user.companyId ? await db.company.findUnique({ where: { id: user.companyId } }) : null;

  return (
    <>
      <PortalHeader userName={user.name} companyName={company?.name ?? ""} />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-8">{children}</main>
    </>
  );
}
