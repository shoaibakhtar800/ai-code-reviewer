"use client";

import { useState } from "react";
import { useGetRepo } from "../hooks/use-repository";
import { useGetPullRequests } from "../hooks/use-pull-request";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeftIcon, GitBranchIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const RepositoryDetail = ({ id }: { id: string }) => {
  const [prState, setPrState] = useState<"open" | "closed" | "all">("open");

  const { data: repository, isLoading } = useGetRepo(id, "github");

  const pullRequest = useGetPullRequests(
    repository?.id ?? "",
    prState,
    !!repository?.id,
  );

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <Skeleton className="size-9 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-64" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
        <div className="space-y-3">
          {[...Array(4)].map((_, index) => (
            <Skeleton key={index} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!repository) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
            <GitBranchIcon className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="mt-4 font-medium">Repository not found</p>
          <p className="text-sm text-muted-foreground mt-1">
            This repository may have been disconnected.
          </p>
          <Link href={`/repositories`} className="mt-6 inline-block">
            <Button variant={"outline"}>
              <ArrowLeftIcon className="size-4" />
              Back to repositories
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const prCounts = {
    open: pullRequest.data?.filter((pr) => pr.state === "open").length ?? 0,
    closed: pullRequest.data?.filter((pr) => pr.state === "closed").length ?? 0,
    all: pullRequest.data?.length ?? 0,
  };

  return <div>Repository Detail Page</div>;
};
