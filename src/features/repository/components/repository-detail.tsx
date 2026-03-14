"use client";

import { useState } from "react";
import { useGetRepo } from "../hooks/use-repository";
import { useGetPullRequests } from "../hooks/use-pull-request";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeftIcon,
  ExternalLinkIcon,
  GitBranchIcon,
  GitMergeIcon,
  GitPullRequestIcon,
  GlobeIcon,
  LockIcon,
  RefreshCwIcon,
  XCircleIcon,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ProviderRequest } from "./provider-request";

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

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href={`/repositories`}>
            <Button variant={"outline"} size={"icon"} className="shrink-0">
              <ArrowLeftIcon className="size-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight">
                {repository.fullName}
              </h1>
              <Badge variant={"outline"} className="gap-1">
                {repository.private ? (
                  <>
                    <LockIcon className="size-4" />
                    Private
                  </>
                ) : (
                  <>
                    <GlobeIcon className="size-4" />
                    Public
                  </>
                )}
              </Badge>
            </div>
            <a
              href={repository.htmlUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:underline hover:text-foreground transition-colors inline-flex items-center gap-1.5 mt-1"
            >
              View on GitHub
              <ExternalLinkIcon className="size-3" />
            </a>
          </div>
        </div>
        <Button
          variant={"ghost"}
          size={"sm"}
          onClick={() => pullRequest.refetch()}
          disabled={pullRequest.isFetching}
          className="gap-1.5"
        >
          <RefreshCwIcon
            className={cn("size-4", pullRequest.isFetching && "animate-spin")}
          />
        </Button>
      </div>

      <div className="border-b border-border/60">
        <div className="flex items-center gap-1 -mb-px">
          {(["open", "closed", "all"] as const).map((state) => (
            <Button
              key={state}
              variant={"ghost"}
              size={"sm"}
              onClick={() => setPrState(state)}
              className={cn(
                "relative rounded-none border-b-2 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-transparent",
                prState === state
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:border-border/50 hover:text-foreground",
              )}
            >
              <span className="flex items-center gap-2">
                {state === "open" && (
                  <GitPullRequestIcon className="size-4 text-emerald-500" />
                )}
                {state === "closed" && (
                  <GitMergeIcon className="size-4 text-purple-500" />
                )}
                {state === "all" && (
                  <GitBranchIcon className="size-4 text-muted-foreground" />
                )}
                {state.charAt(0).toUpperCase() + state.slice(1)}
              </span>
              <Badge variant={"ghost"} className="ml-2 bg-muted-foreground/10">
                {prCounts[state]}
              </Badge>
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {pullRequest.isLoading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, index) => (
              <Skeleton key={index} className="h-32 w-full rounded-xl" />
            ))}
          </div>
        ) : pullRequest.error?.message ? (
          <Card className="border-destructive/50">
            <CardContent className="py-12 text-center">
              <div className="mx-auto size-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <XCircleIcon className="size-6 text-destructive" />
              </div>
              <p className="mt-4 font-medium text-destructive">
                Failed to load pull requests.
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {pullRequest.error?.message}
              </p>
              <Button
                variant={"outline"}
                onClick={() => pullRequest.refetch()}
                className="mt-6"
                disabled={pullRequest.isFetching}
              >
                <RefreshCwIcon
                  className={cn(
                    "size-4",
                    pullRequest.isFetching && "animate-spin",
                  )}
                />
                Retry
              </Button>
            </CardContent>
          </Card>
        ) : pullRequest.data?.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <div className="mx-auto size-12 rounded-full bg-muted flex items-center justify-center">
                <GitPullRequestIcon className="size-6 text-muted-foreground" />
              </div>
              <p className="mt-4 font-medium">No pull requests found.</p>
              <p className="text-sm text-muted-foreground mt-1">
                {prState === "all"
                  ? "This repository may not have any pull requests."
                  : `This repository may not have any ${prState} pull requests.`}
              </p>
            </CardContent>
          </Card>
        ) : (
          pullRequest.data?.map((pr) => (
            <ProviderRequest key={pr.id} pr={pr} repositoryId={repository.id} />
          ))
        )}
      </div>
    </div>
  );
};
