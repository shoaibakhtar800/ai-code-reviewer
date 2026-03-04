import { redirectIfAuthenticated } from "@/lib/auth-server";
import { redirect } from "next/navigation";

export default async function Home() {
  await redirectIfAuthenticated();
  redirect("/auth/sign-in");
}
