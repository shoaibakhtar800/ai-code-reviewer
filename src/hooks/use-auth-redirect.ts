"use client";

import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Hook that redirects users based on their authentication status.
 * - Authenticated → /repositories
 * - Unauthenticated → /auth/sign-in
 */
export function useAuthRedirect() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (isPending) return;

    if (session) {
      router.replace("/repositories");
    } else {
      router.replace("/auth/sign-in");
    }
  }, [session, isPending, router]);

  return { isLoading: isPending, isAuthenticated: !!session, session };
}
