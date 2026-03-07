import { useTRPC } from "@/trpc/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect } from "react";
import { toast } from "sonner";

export const useFetchGithubRepos = (enabled: boolean) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const query = useQuery({
    ...trpc.repository.fetchFromGithub.queryOptions(),
    enabled,
  });

  useEffect(() => {
    if (query.isError) {
      toast.error("Failed to fetch GitHub repositories");
    }
  }, [query.isError]);

  const invalidate = useCallback(() => {
    return queryClient.invalidateQueries({
      queryKey: trpc.repository.fetchFromGithub.queryKey(),
    });
  }, [queryClient, trpc]);

  return { ...query, invalidate };
};
