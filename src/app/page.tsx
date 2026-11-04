import { redirect } from "next/navigation";
import { getCurrentAdmin, getCurrentClient } from "@/lib/session";

export default async function Home() {
  if (await getCurrentClient()) redirect("/projects");
  if (await getCurrentAdmin()) redirect("/admin");
  redirect("/login");
}
