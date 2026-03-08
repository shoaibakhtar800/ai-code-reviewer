"use client";

import { linkSocial } from "@/lib/auth-client";
import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "./ui/card";
import { cn } from "@/lib/utils";
import { FaGithub } from "react-icons/fa";
import { Button } from "./ui/button";
import { Loader2Icon } from "lucide-react";

interface ConnectGithubProps {
  title?: string;
  description?: string;
  className?: string;
}

export const ConnectGithub = ({
  title = "Github account not connected",
  description = "Connect your Github account to view your repositories.",
  className,
}: ConnectGithubProps) => {
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      await linkSocial({
        provider: "github",
        callbackURL: window.location.href,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Please try again.";
      toast.error("Failed to connect GitHub", {
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
          <FaGithub className="text-muted-foreground size-7" />
        </div>
        <h3 className="mt-4 font-semibold text-lg">{title}</h3>
        <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
          {description}
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
              <FaGithub className="size-4" />
              Connect GitHub
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
