"use client";

import { Button } from "@/components/ui/button";
import {
  CheckCircleIcon,
  FolderGit2Icon,
  PlusIcon,
  RefreshCwIcon,
  SearchIcon,
  XIcon,
} from "lucide-react";
import { useState } from "react";
import {
  useConnectRepos,
  useDisconnectRepos,
  useFetchProviderRepos,
  useGetRepos,
} from "../hooks/use-repository";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { RepositorySelectItem } from "./repository-select-item";
import { Badge } from "@/components/ui/badge";
import { RepositoryConnectedCard } from "./repository-connected-card";
import { ConnectProvider } from "@/components/connect-provider";
import { getProviderDisplayName } from "@/lib/provider-utils";

export const RepositoryList = () => {
  const [selectedRepos, setSelectedRepos] = useState<Set<string>>(new Set());
  const [showProviderRepos, setShowProviderRepos] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const provider = "github"; // Default provider

  const { data: connectedRepos, isLoading: isLoadingConnectedRepos } =
    useGetRepos();
  const {
    data: providerRepos,
    refetch,
    isFetching: isFetchingProviderRepos,
    isLoading: isLoadingProviderRepos,
    error: providerReposError,
  } = useFetchProviderRepos(showProviderRepos);

  const connectMutation = useConnectRepos();
  const disconnectMutation = useDisconnectRepos();

  const connectedIds = new Set(
    connectedRepos?.map((repo) => repo.externalId) || [],
  );

  const availableRepos = providerRepos?.filter(
    (repo) => !connectedIds.has(repo.externalId),
  );

  const filteredAvailableRepos = availableRepos?.filter((repo) => {
    if (searchQuery === "") return true;
    return (
      repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      repo.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const toggleRepo = (externalId: string) => {
    const next = new Set(selectedRepos);
    if (next.has(externalId)) {
      next.delete(externalId);
    } else {
      next.add(externalId);
    }
    setSelectedRepos(next);
  };

  const handleConnect = () => {
    const reposToConnect = availableRepos?.filter((repo) =>
      selectedRepos.has(repo.externalId),
    );
    if (!reposToConnect) return;
    connectMutation.mutate(
      { repos: reposToConnect },
      {
        onSuccess: () => {
          setSelectedRepos(new Set());
          setShowProviderRepos(false);
        },
      },
    );
  };

  const handleDisconnect = (id: string) => {
    disconnectMutation.mutate({
      id: id,
    });
  };

  const selectAll = () => {
    setSelectedRepos(
      new Set(filteredAvailableRepos?.map((repo) => repo.externalId)),
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
            Select repositories to connect to your account
          </p>
        </div>
        <Button
          onClick={() => {
            setShowProviderRepos(!showProviderRepos);
            setSelectedRepos(new Set());
            setSearchQuery("");
          }}
          variant={showProviderRepos ? "outline" : "default"}
        >
          {showProviderRepos ? (
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
      {showProviderRepos && (
        <Card className="overflow-hidden">
          <div className="border-b border-border/60 bg-muted/30 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold">
                  {getProviderDisplayName(provider)} Repositories
                </h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Select repositories to connect to your account.
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => refetch()}
                disabled={isFetchingProviderRepos}
              >
                <RefreshCwIcon
                  className={cn(
                    "size-4",
                    isFetchingProviderRepos && "animate-spin",
                  )}
                />
              </Button>
            </div>
          </div>

          <CardContent className="p-0">
            {isLoadingProviderRepos ? (
              <div className="p-6 space-y-3">
                {[...Array(10)].map((_, index) => (
                  <Skeleton key={index} className="h-16 w-full rounded-lg" />
                ))}
              </div>
            ) : providerReposError ? (
              <div className="p-6">
                {providerReposError.data?.code === "PRECONDITION_FAILED" ? (
                  <ConnectProvider provider={provider} />
                ) : (
                  <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4 text-center">
                    <p className="text-sm text-destructive text-center">
                      {providerReposError.message}
                    </p>
                  </div>
                )}
              </div>
            ) : availableRepos?.length === 0 ? (
              <div className="py-16 text-center">
                <div className="mx-auto size-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <CheckCircleIcon className="size-6 text-emerald-500" />
                </div>
                <p className="mt-4 font-medium">All caught up!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  All your repositories are up to date.
                </p>
              </div>
            ) : (
              <>
                <div className="px-6 py-4 border-b border-border/60 flex items-center gap-4">
                  <div className="relative flex-1">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      placeholder="Search repositories"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Button
                      variant={"ghost"}
                      onClick={selectAll}
                      disabled={
                        availableRepos?.length === 0 ||
                        selectedRepos.size === availableRepos?.length
                      }
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Select All
                    </Button>
                    {selectedRepos.size > 0 && (
                      <>
                        <span className="text-muted-foreground">|</span>
                        <Button
                          variant={"ghost"}
                          onClick={clearSelection}
                          className="text-destructive hover:text-destructive transition-colors"
                        >
                          Clear
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                <div className="max-h-100 overflow-y-auto">
                  {filteredAvailableRepos?.length === 0 ? (
                    <div className="py-12 text-center">
                      <p className="text-sm text-muted-foreground">
                        No repositories found
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border/60">
                      {filteredAvailableRepos?.map((repo) => (
                        <RepositorySelectItem
                          key={repo.externalId}
                          repo={repo}
                          selected={selectedRepos.has(repo.externalId)}
                          onToggle={() => toggleRepo(repo.externalId)}
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between border-t border-border/60 bg-muted/60 px-6 py-4">
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

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Connected Repositories
          </h2>
          {connectedRepos && connectedRepos.length > 0 && (
            <Badge variant={"secondary"} className="tabular-nums">
              {connectedRepos.length}
            </Badge>
          )}
        </div>

        {isLoadingConnectedRepos ? (
          <div className="p-6 space-y-3">
            {[...Array(10)].map((_, index) => (
              <Skeleton key={index} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : connectedRepos?.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <div className="mx-auto h-14 rounded-md bg-muted flex items-center justify-center">
                <FolderGit2Icon className="size-7 text-muted-foreground" />
              </div>
              <p className="mt-4 font-medium">
                No connected repositories found.
              </p>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                Connect repositories to start getting AI-powered code reviews on
                your pull requests.
              </p>
              <Button
                className="mt-6"
                onClick={() => setShowProviderRepos(true)}
              >
                <PlusIcon className="size-4" />
                Add your first repository
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {connectedRepos?.map((repo) => (
              <RepositoryConnectedCard
                key={repo.externalId}
                repo={repo}
                onDisconnect={handleDisconnect}
                isDisconnecting={disconnectMutation.isPending}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
