import { useTRPC } from "@/trpc/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect } from "react";
import { toast } from "sonner";

export const useGetRepos = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const query = useQuery(trpc.repository.getRepos.queryOptions());

  useEffect(() => {
    if (query.isError) {
      toast.error("Failed to load repositories");
    }
  }, [query.isError]);

  const invalidate = useCallback(() => {
    return queryClient.invalidateQueries({
      queryKey: trpc.repository.getRepos.queryKey(),
    });
  }, [queryClient, trpc]);

  return { ...query, invalidate };
};
