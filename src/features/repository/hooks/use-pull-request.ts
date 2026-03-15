import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "sonner";

/**
 * Fetch all pull requests for a repository
 */
export const useGetPullRequests = (
  repositoryId: string,
  state: "open" | "closed" | "all",
  enabled: boolean,
) => {
  const trpc = useTRPC();

  const query = useQuery({
    ...trpc.pullRequest.list.queryOptions({
      repositoryId,
      state,
    }),
    enabled,
  });

  useEffect(() => {
    if (query.isError) {
      toast.error("Failed to load repositories");
    }
  }, [query.isError]);

  return query;
};

/**
 * Fetch a single pull request
 */
export const useGetPullRequest = (
  repositoryId: string,
  prNumber: number,
  enabled: boolean,
) => {
  const trpc = useTRPC();

  const query = useQuery({
    ...trpc.pullRequest.get.queryOptions({
      repositoryId,
      prNumber,
    }),
    enabled,
  });

  useEffect(() => {
    if (query.isError) {
      toast.error("Failed to load pull request");
    }
  }, [query.isError]);

  return query;
};

/**
 * Fetch all files in a pull request
 */
export const useGetPullRequestFiles = (
  repositoryId: string,
  prNumber: number,
  enabled: boolean,
) => {
  const trpc = useTRPC();

  const query = useQuery({
    ...trpc.pullRequest.files.queryOptions({
      repositoryId,
      prNumber,
    }),
    enabled,
  });

  useEffect(() => {
    if (query.isError) {
      toast.error("Failed to load pull request files");
    }
  }, [query.isError]);

  return query;
};
