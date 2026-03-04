"use client";

import { authClient } from "@/lib/auth-client";
import { TRPCReactProvider } from "@/trpc/client";
import { AuthUIProvider } from "@daveyplate/better-auth-ui";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Toaster } from "./ui/sonner";
import Image from "next/image";

export const Providers = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();

  return (
    <AuthUIProvider
      authClient={authClient}
      navigate={router.push}
      replace={router.replace}
      onSessionChange={() => {
        router.refresh();
      }}
      Link={Link}
      social={{
        providers: ["github"],
      }}
      localizeErrors={false}
      avatar={{
        upload: async (file) => {
          const formData = new FormData();
          formData.append("avatar", file);
          const res = await fetch("/api/uploadAvatar", {
            method: "POST",
            body: formData,
          });
          const { data } = await res.json();
          return data.url;
        },
        delete: async (url) => {
          await fetch("/api/deleteAvatar", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url }),
          });
        },
        Image: Image,
      }}
    >
      <TRPCReactProvider>
        {children}
        <Toaster />
      </TRPCReactProvider>
    </AuthUIProvider>
  );
};
