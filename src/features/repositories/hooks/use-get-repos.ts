import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "sonner";

export const useGetRepos = () => {
  const trpc = useTRPC();

  const query = useQuery(trpc.repository.getRepos.queryOptions());

  useEffect(() => {
    if (query.isError) {
      toast.error("Failed to load repositories");
    }
  }, [query.isError]);

  return query;
};
