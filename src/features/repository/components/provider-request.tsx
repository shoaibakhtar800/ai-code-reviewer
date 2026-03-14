import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRightIcon,
  CheckCircleIcon,
  ClockIcon,
  DotIcon,
  FileTextIcon,
  GitMergeIcon,
  GitPullRequestIcon,
  HashIcon,
  Loader2Icon,
  MinusIcon,
  PlusIcon,
  XCircleIcon,
} from "lucide-react";
import Link from "next/link";
import { formatDate } from "../utils";
import { ReviewStatus } from "@/generated/prisma/enums";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface pullRequestProps {
  pr: {
    id: string;
    number: number;
    title: string;
    state: "open" | "closed";
    draft: boolean;
    htmlUrl: string;
    author: {
      login: string;
      avatarUrl: string;
    };
    headRef: string;
    baseRef: string;
    additions: number;
    deletions: number;
    changedFiles: number;
    createdAt: string;
    updatedAt: string;
    mergedAt: string | null;
    review: {
      status: ReviewStatus;
      createdAt: Date;
    } | null;
  };
  repositoryId: string;
}

const ReviewStatusBadge = ({ status }: { status: ReviewStatus }) => {
  const config = {
    [ReviewStatus.COMPLETED]: {
      label: "Reviewed",
      className:
        "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
      icon: CheckCircleIcon,
    },
    [ReviewStatus.PENDING]: {
      label: "Queued",
      className:
        "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
      icon: ClockIcon,
    },
    [ReviewStatus.FAILED]: {
      label: "Failed",
      className:
        "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
      icon: XCircleIcon,
    },
    [ReviewStatus.PROCESSING]: {
      label: "Processing",
      className:
        "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
      icon: Loader2Icon,
    },
  };

  const { label, className, icon: Icon } = config[status];

  return (
    <Badge className={className}>
      <Icon
        className={cn(
          "size-3",
          status === ReviewStatus.PROCESSING && "animate-spin",
        )}
      />
      {label}
    </Badge>
  );
};

export const ProviderRequest = ({ pr, repositoryId }: pullRequestProps) => {
  const isMerged = pr.state === "closed" && pr.mergedAt !== null;

  return (
    <Card className="group hover:border-border transition-all">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-6">
          <div className="flex items-start gap-4 min-w-0 flex-1">
            <div className="flex items-center gap-3">
              {isMerged ? (
                <GitMergeIcon className="size-4 text-purple-500" />
              ) : pr.state === "closed" ? (
                <XCircleIcon className="size-4 text-red-500" />
              ) : (
                <GitPullRequestIcon className="size-4 text-emerald-500" />
              )}
            </div>

            <div className="min-w-0 flex-1 space-y-2">
              <div>
                <Link
                  href={`/repositories/${repositoryId}/pull-requests/${pr.number}`}
                  className="font-medium hover:text-primary transition-colors line-clamp-1"
                >
                  {pr.title}
                </Link>
                {pr.draft && (
                  <Badge variant={"secondary"} className="text-xs">
                    Draft
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="flex items-center font-mono text-xs bg-muted-foreground/10 px-2 py-1 rounded-md">
                  <HashIcon className="size-3" />
                  {pr.number}
                </span>
                <DotIcon className="size-6 text-muted-foreground -mx-1" />
                <span className="flex items-center gap-1.5">
                  <Avatar className="size-5 ring-1 ring-border">
                    <AvatarImage
                      src={pr.author.avatarUrl}
                      alt={pr.author.login}
                    />
                    <AvatarFallback className="text-[10px]">
                      {pr.author.login}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{pr.author.login}</span>
                </span>
                <DotIcon className="size-6 text-muted-foreground -mx-1" />
                <span className="flex items-center gap-1">
                  <ClockIcon className="size-3" />
                  {formatDate(pr.createdAt)}
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <code className="text-xs bg-muted gap-2 text-muted-foreground flex items-center px-2 py-0.5 rounded-md font-mono truncate">
                  {pr.headRef}
                  <ArrowRightIcon className="size-4 mx-1.5 text-muted-foreground/70" />
                  {pr.baseRef}
                </code>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                    <PlusIcon className="size-3" />
                    <span>{pr.additions}</span>
                  </span>
                  <span className="flex items-center gap-1 text-red-600 dark:text-red-500">
                    <MinusIcon className="size-3" />
                    <span>{pr.deletions}</span>
                  </span>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <FileTextIcon className="size-3" />
                    <span>{pr.changedFiles}</span>
                    {pr.changedFiles === 1 ? "file" : "files"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {pr.review && <ReviewStatusBadge status={pr.review.status} />}
            <Link
              href={`/repositories/${repositoryId}/pull-requests/${pr.number}`}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <Button variant={pr.review ? "outline" : "default"}>
                {pr.review ? "View Review" : "Review"}
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
