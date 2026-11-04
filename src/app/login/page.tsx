import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { clientLoginAction } from "@/actions/auth";
import { LoginScreen } from "@/components/auth/login-screen";
import { getCurrentClient } from "@/lib/session";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage() {
  if (await getCurrentClient()) redirect("/projects");

  return (
    <LoginScreen
      action={clientLoginAction}
      logoLabel="Client portal"
      heading="Welcome back"
      subheading="Sign in with the user ID and passcode shared by NUVOSID."
      idLabel="User ID"
      secretLabel="Passcode"
      submitLabel="Sign in"
      footnote="Need access or a new passcode? Contact your NUVOSID project lead."
      showcase={{
        title: "Walk through your projects, room by room.",
        body: "Every project of your company in one private place, each with its interactive 3D walkthrough.",
      }}
    />
  );
}
