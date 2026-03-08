"use client";

import { linkSocial } from "@/lib/auth-client";
import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "./ui/card";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { Loader2Icon } from "lucide-react";
import { getProviderDisplayName, getProviderIcon } from "@/lib/provider-utils";

interface ConnectProviderProps {
  provider?: string;
  title?: string;
  description?: string;
  className?: string;
}

export const ConnectProvider = ({
  provider = "github",
  title,
  description,
  className,
}: ConnectProviderProps) => {
  const providerDisplayName = getProviderDisplayName(provider);
  const ProviderIcon = getProviderIcon(provider);
  
  const defaultTitle = `${providerDisplayName} account not connected`;
  const defaultDescription = `Connect your ${providerDisplayName} account to view your repositories.`;
  
  const displayTitle = title || defaultTitle;
  const displayDescription = description || defaultDescription;
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      await linkSocial({
        provider: provider,
        callbackURL: window.location.href,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Please try again.";
      toast.error(`Failed to connect ${providerDisplayName}`, {
        description: message,
      });
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <Card className={cn(className)}>
      <CardContent className="py-12 text-center">
        <div className="mx-auto size-14 rounded-full bg-muted flex items-center justify-center">
          <ProviderIcon className="text-muted-foreground size-7" />
        </div>
        <h3 className="mt-4 font-semibold text-lg">{displayTitle}</h3>
        <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
          {displayDescription}
        </p>
        <Button
          className="mt-6"
          onClick={handleConnect}
          disabled={isConnecting}
        >
          {isConnecting ? (
            <Loader2Icon className="size-4 animate-spin" />
          ) : (
            <>
              <ProviderIcon className="size-4" />
              Connect {providerDisplayName}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
