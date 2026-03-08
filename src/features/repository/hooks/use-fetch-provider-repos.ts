import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "sonner";

export const useFetchProviderRepos = (enabled: boolean) => {
  const trpc = useTRPC();

  const query = useQuery({
    ...trpc.repository.fetchFromProvider.queryOptions(),
    enabled,
  });

  useEffect(() => {
    if (query.isError) {
      toast.error("Failed to fetch repositories");
    }
  }, [query.isError]);

  return { ...query };
};
