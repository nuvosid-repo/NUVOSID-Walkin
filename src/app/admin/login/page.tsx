import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { adminLoginAction } from "@/actions/auth";
import { LoginScreen } from "@/components/auth/login-screen";
import { getCurrentAdmin } from "@/lib/session";

export const metadata: Metadata = { title: "Admin sign in" };

export default async function AdminLoginPage() {
  if (await getCurrentAdmin()) redirect("/admin");

  return (
    <LoginScreen
      action={adminLoginAction}
      logoLabel="Admin"
      heading="Admin sign in"
      subheading="Manage companies, users, projects and 3D models."
      idLabel="Admin ID"
      secretLabel="Password"
      submitLabel="Sign in"
      footnote="For NUVOSID staff only."
      showcase={{
        title: "One place for every builder and every walkthrough.",
        body: "Add a company, enter its property details, upload the 3D model, and share a login with the client.",
      }}
    />
  );
}
