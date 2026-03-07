"use client";

import { Button } from "@/components/ui/button";
import {
  CheckCircleIcon,
  PlusIcon,
  RefreshCwIcon,
  SearchIcon,
  XIcon,
} from "lucide-react";
import { useState } from "react";
import { useConnectRepos } from "../hooks/use-connect-repos";
import { useDisconnectRepos } from "../hooks/use-disconnect-repos";
import { useFetchGithubRepos } from "../hooks/use-fetch-github-repos";
import { useGetRepos } from "../hooks/use-get-repos";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  htmlUrl: string;
  description: string | null;
  language: string | null;
  stars: number;
  updatedAt: string;
}

const languageColors: Record<string, string> = {
  TypeScript: "bg-blue-500",
  JavaScript: "bg-yellow-400",
  Python: "bg-green-500",
  Go: "bg-cyan-500",
  Rust: "bg-orange-500",
  Java: "bg-red-500",
  Ruby: "bg-red-400",
  PHP: "bg-purple-500",
  "C#": "bg-green-600",
  "C++": "bg-pink-500",
  C: "bg-gray-500",
  Swift: "bg-orange-400",
  Kotlin: "bg-purple-400",
  Dart: "bg-blue-400",
  Vue: "bg-emerald-500",
  Svelte: "bg-orange-600",
};

interface RepositoryListProps {
  user: {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    email: string;
    emailVerified: boolean;
    name: string;
    image?: string | null | undefined;
  };
}

export const RepositoryList = ({ user }: RepositoryListProps) => {
  const [selectedRepos, setSelectedRepos] = useState<Set<number>>(new Set());
  const [showGithubRepos, setShowGithubRepos] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: connectedRepos } = useGetRepos();
  const {
    data: githubRepos,
    refetch,
    isFetching: isFetchingGithubRepos,
    isLoading: isLoadingGithubRepos,
    error: githubReposError,
  } = useFetchGithubRepos(showGithubRepos);

  const connectMutation = useConnectRepos();
  const disconnectMutation = useDisconnectRepos();

  const connectedIds = new Set(
    connectedRepos?.map((repo) => repo.githubId) || [],
  );

  const availableRepos = githubRepos?.filter(
    (repo) => !connectedIds.has(repo.githubId),
  );

  const filteredAvailableRepos = availableRepos?.filter((repo) => {
    if (searchQuery === "") return true;
    return (
      repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      repo.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const toggleRepo = (githubId: number) => {
    const next = new Set(selectedRepos);
    if (next.has(githubId)) {
      next.delete(githubId);
    } else {
      next.add(githubId);
    }
    setSelectedRepos(next);
  };

  const handleConnect = () => {
    const reposToConnect = availableRepos?.filter((repo) =>
      selectedRepos.has(repo.githubId),
    );
    if (!reposToConnect) return;
    connectMutation.mutate(
      { repos: reposToConnect },
      {
        onSuccess: () => {
          setSelectedRepos(new Set());
          setShowGithubRepos(false);
        },
      },
    );
  };

  const selectAll = () => {
    setSelectedRepos(
      new Set(filteredAvailableRepos?.map((repo) => repo.githubId)),
    );
  };

  const clearSelection = () => {
    setSelectedRepos(new Set());
  };

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Repositories
          </h1>
          <p className="text-muted-foreground mt-1">
            Select repositories to connect to your account.
          </p>
        </div>
        <Button
          onClick={() => {
            setShowGithubRepos(!showGithubRepos);
            setSelectedRepos(new Set());
            setSearchQuery("");
          }}
          variant={showGithubRepos ? "outline" : "default"}
        >
          {showGithubRepos ? (
            <>
              <XIcon className="size-4" />
              Close
            </>
          ) : (
            <>
              <PlusIcon className="size-4" />
              Add Repository
            </>
          )}
        </Button>
      </div>

      {/* Show Github Repositories */}
      {showGithubRepos && (
        <Card className="overflow-hidden">
          <div className="border-b border-border/60 bg-muted/30 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold">Github Repositories</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Select repositories to connect to your account.
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => refetch()}
                disabled={isFetchingGithubRepos}
              >
                <RefreshCwIcon
                  className={cn(
                    "size-4",
                    isFetchingGithubRepos && "animate-spin",
                  )}
                />
              </Button>
            </div>
          </div>

          <CardContent className="p-0">
            {isLoadingGithubRepos ? (
              <div>
                {[...Array(10)].map((_, index) => (
                  <Skeleton key={index} className="h-16 w-full" />
                ))}
              </div>
            ) : githubReposError ? (
              <div>
                {githubReposError.data?.code === "PRECONDITION_FAILED" ? (
                  <Button>Connect</Button>
                ) : (
                  <div>
                    <p className="text-center text-red-500">
                      {githubReposError.message}
                    </p>
                  </div>
                )}
              </div>
            ) : availableRepos?.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2">
                <CheckCircleIcon className="size-12 text-green-500" />
                <p className="text-center text-muted-foreground">
                  All caught up!
                </p>
                <p className="text-center text-muted-foreground">
                  All your repositories are up to date.
                </p>
              </div>
            ) : (
              <>
                <div>
                  <div className="flex items-center gap-2">
                    <SearchIcon className="size-4" />
                    <Input
                      placeholder="Search repositories"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <button>Select All</button>
                    {selectedRepos.size > 0 && (
                      <>
                        <span>.</span>
                        <span>Clear Selection</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="max-h-[400px] overflow-y-auto">
                  {filteredAvailableRepos?.length === 0 ? (
                    <div className="py-12 text-center">
                      <p>No repositories found</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredAvailableRepos?.map((repo) => (
                        <div key={repo.githubId}>
                          <p>{repo.name}</p>
                          <p>{repo.description}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between border-t border-border/60 bg-muted/20 px-6 py-4">
                  <p className="text-sm text-muted-foreground">
                    {selectedRepos.size} repositories selected of{" "}
                    {filteredAvailableRepos?.length || 0}
                  </p>
                  <Button
                    onClick={handleConnect}
                    disabled={
                      connectMutation.isPending || selectedRepos.size === 0
                    }
                    size="sm"
                  >
                    {connectMutation.isPending ? (
                      <>
                        <RefreshCwIcon className="mr-2 size-4 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        Connect
                        {selectedRepos.size > 0 && (
                          <span className="ml-1.5 rounded-full bg-primary-foreground/20 px-1.5 py-0.5 text-[10px] font-medium transition-colors group-hover:bg-primary-foreground/30">
                            {selectedRepos.size}
                          </span>
                        )}
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
