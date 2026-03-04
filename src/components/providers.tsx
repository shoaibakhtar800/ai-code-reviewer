"use client";

import { authClient } from "@/lib/auth-client";
import { TRPCReactProvider } from "@/trpc/client";
import { AuthUIProvider } from "@daveyplate/better-auth-ui";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Toaster } from "./ui/sonner";

export const Providers = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();

  return (
    <AuthUIProvider
      authClient={authClient}
      navigate={router.push}
      replace={router.replace}
      onSessionChange={() => {
        // Clear router cache (protected routes)
        router.refresh();
      }}
      Link={Link}
    >
      <TRPCReactProvider>
        {children}
        <Toaster />
      </TRPCReactProvider>
    </AuthUIProvider>
  );
};
