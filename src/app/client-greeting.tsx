"use client";
import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";

export function ClientGreeting() {
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(
    trpc.helloRouter.hello.queryFilter({ text: "Hello" }),
  );
  return <div>{data.greeting}</div>;
}
