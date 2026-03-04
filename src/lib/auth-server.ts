import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Gets the current session on the server.
 */
export async function getServerSession() {
  return await auth.api.getSession({
    headers: await headers(),
  });
}

/**
 * Ensures the user is authenticated. If not, redirects to the sign-in page.
 */
export async function requireAuth() {
  const session = await getServerSession();
  if (!session) {
    redirect("/auth/sign-in");
  }
  return session;
}

/**
 * Redirects the user to the dashboard if they are already authenticated.
 * Useful for auth pages and the home page.
 */
export async function redirectIfAuthenticated() {
  const session = await getServerSession();
  if (session) {
    redirect("/repositories");
  }
}
