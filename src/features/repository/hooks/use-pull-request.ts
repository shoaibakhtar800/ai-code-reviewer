import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "sonner";

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
