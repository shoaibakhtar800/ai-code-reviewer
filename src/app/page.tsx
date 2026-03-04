"use client";

import { Button } from "@/components/ui/button";
import { runHealthCheckAction } from "./action";

export default function Home() {
  const onSubmit = async () => {
    const result = await runHealthCheckAction();
    console.log("Database health:", result);
  };

  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <p className="text-muted-foreground italic font-mono">Health Check</p>
      <Button onClick={onSubmit}>Click me</Button>
    </div>
  );
}
