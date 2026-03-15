"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  ClockIcon,
  DotIcon,
  ExternalLinkIcon,
  GitMergeIcon,
  GitPullRequestIcon,
  XCircleIcon,
  ArrowLeftIcon,
  GitBranchIcon,
  ArrowRightIcon,
  PlusIcon,
  LucideIcon,
  MinusIcon,
  FileTextIcon,
} from "lucide-react";
import Link from "next/link";
import {
  useGetPullRequest,
  useGetPullRequestFiles,
} from "../../hooks/use-pull-request";
import { TabButton } from "@/components/tab-button";
import { useState } from "react";

const PRStatusBadge = ({
  state,
  isMerged,
  draft,
}: {
  state: string;
  isMerged: boolean;
  draft: boolean;
}) => {
  if (draft) {
    return (
      <Badge variant={"secondary"} className="gap-1">
        <GitPullRequestIcon className="size-4" />
        Draft
      </Badge>
    );
  }

  if (isMerged) {
    return (
      <Badge
        variant={"secondary"}
        className="bg-purple-600/10 dark:text-purple-400 border-purple-500/20 border gap-1"
      >
        <GitMergeIcon className="size-4" />
        Merged
      </Badge>
    );
  }

  if (state === "closed") {
    return (
      <Badge variant={"destructive"} className="gap-1">
        <XCircleIcon className="size-4" />
        Closed
      </Badge>
    );
  }

  if (state === "open") {
    return (
      <Badge
        variant={"secondary"}
        className="bg-emerald-600/10 dark:text-emerald-400 border-emerald-500/20 border gap-1"
      >
        <GitPullRequestIcon className="size-4" />
        Open
      </Badge>
    );
  }

  return null;
};

function StartItem({
  icon: Icon,
  value,
  label,
  colorClass,
  bgClass,
}: {
  icon: LucideIcon;
  value: number;
  label?: string;
  colorClass: string;
  bgClass: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className={cn("p-1.5 rounded-md", bgClass)}>
        <Icon className={cn("size-3.5", colorClass)} />
      </div>
      <div>
        <p className={cn("text-sm font-semibold tabular-nums", colorClass)}>
          {value.toLocaleString()}
        </p>
        {label && (
          <p className={cn("text-xs font-medium", colorClass)}>{label}</p>
        )}
      </div>
    </div>
  );
}

export default function PullRequestDetail({
  repositoryId,
  prNumber,
}: {
  repositoryId: string;
  prNumber: number;
}) {
  const [activeTab, setActiveTab] = useState<"review" | "files">("review");

  const pullRequestQuery = useGetPullRequest(repositoryId, prNumber, true);

  const pullRequestFilesQuery = useGetPullRequestFiles(
    repositoryId,
    prNumber,
    true,
  );

  if (pullRequestQuery.isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <Skeleton className="size-10 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-96" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (pullRequestQuery.isError || !pullRequestQuery.data) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <div className="mx-auto size-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <XCircleIcon className="size-6 text-destructive" />
          </div>
          <p className="mt-4 font-medium text-destructive">
            {pullRequestQuery.error instanceof Error
              ? pullRequestQuery.error.message
              : "Failed to load pull request"}
          </p>
          <Link
            href={`/repositories/${repositoryId}`}
            className="mt-6 inline-block"
          >
            <Button variant={"outline"}>
              <ArrowLeftIcon className="size-4" />
              Back to repository
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const isMerged =
    pullRequestQuery.data.state === "closed" && pullRequestQuery.data.mergedAt;

  return (
    <div className="space-y-8">
      <div className="flex items-start gap-4">
        <Link href={`/repositories/${repositoryId}`}>
          <Button variant={"outline"} size={"icon"} className="shrink-0 mt-1">
            <ArrowLeftIcon className="size-4" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-start gap-3 flex-wrap">
                <div
                  className={cn(
                    "p-2 rounded-lg shrink-0",
                    isMerged
                      ? "bg-purple-500/10"
                      : pullRequestQuery.data.state === "closed"
                        ? "bg-red-500/10"
                        : "bg-emerald-500/10",
                  )}
                >
                  {isMerged ? (
                    <GitMergeIcon className="size-5 text-purple-500" />
                  ) : pullRequestQuery.data.state === "closed" ? (
                    <XCircleIcon className="size-5 text-red-500" />
                  ) : (
                    <GitPullRequestIcon className="size-5 text-emerald-500" />
                  )}
                </div>

                <div className="min-w-0">
                  <h1 className="text-xl font-semibold tracking-tight truncate">
                    {pullRequestQuery.data.title}
                  </h1>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <PRStatusBadge
                      state={pullRequestQuery.data.state}
                      isMerged={!!isMerged}
                      draft={pullRequestQuery.data.draft}
                    />
                    <span className="text-sm text-muted-foreground font-mono">
                      #{pullRequestQuery.data.number}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <a
              href={pullRequestQuery.data.htmlUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0"
            >
              <Button variant={"outline"} size={"sm"} className="gap-2">
                <ExternalLinkIcon className="size-4" />
                GitHub
              </Button>
            </a>
          </div>

          <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground flex-wrap">
            <span className="flex items-center gap-2">
              <Avatar className="size-5 ring-1 ring-border">
                <AvatarImage src={pullRequestQuery.data.author.avatarUrl} />
                <AvatarFallback className="text-[10px]">
                  {pullRequestQuery.data.author.login.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-foreground font-medium">
                {pullRequestQuery.data.author.login}
              </span>
            </span>
            <DotIcon className="size-6 text-muted-foreground -mx-2" />
            <span className="flex items-center gap-1.5">
              <ClockIcon className="size-4" />
            </span>
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="flex items-center divide-x divide-border/60">
            <div className="flex-1 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <GitBranchIcon className="size-4 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground mb-1">
                    Merged request
                  </p>
                  <div className="flex items-center gap-2 text-sm">
                    <code className="text-xs bg-muted gap-2 text-muted-foreground flex items-center px-2 py-0.5 rounded-md font-mono truncate">
                      {pullRequestQuery.data.headRef}
                    </code>
                    <ArrowRightIcon className="size-4 text-muted-foreground/70" />
                    <code className="text-xs bg-muted gap-2 text-muted-foreground flex items-center px-2 py-0.5 rounded-md font-mono truncate">
                      {pullRequestQuery.data.baseRef}
                    </code>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6 px-6 py-4">
              <StartItem
                icon={PlusIcon}
                value={pullRequestQuery.data.additions}
                colorClass="text-emerald-600 dark:text-emerald-400"
                bgClass="bg-emerald-500/10"
              />
              <StartItem
                icon={MinusIcon}
                value={pullRequestQuery.data.deletions}
                colorClass="text-red-600 dark:text-red-400"
                bgClass="bg-red-500/10"
              />
              <StartItem
                icon={FileTextIcon}
                value={pullRequestQuery.data.changedFiles}
                colorClass="text-muted-foreground dark:text-muted-foreground"
                bgClass="bg-muted"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="border-b border-border/60">
        <div className="flex items-center gap-1">
          <TabButton
            active={true}
            onClick={() => {}}
            icon={FileTextIcon}
            label="Changed Files"
            count={pullRequestFilesQuery.data?.length}
          />
        </div>
      </div>
    </div>
  );
}
