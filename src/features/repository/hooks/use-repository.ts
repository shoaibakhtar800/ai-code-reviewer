import { Provider } from "@/lib/providers/types";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "sonner";

export const useGetRepo = (id: string, provider: Provider) => {
  const trpc = useTRPC();

  const query = useQuery(trpc.repository.getRepo.queryOptions({ id, provider }));

  useEffect(() => {
    if (query.isError) {
      toast.error("Failed to load repository");
    }
  }, [query.isError]);

  return query;
}

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

export const useConnectRepos = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.repository.connect.mutationOptions({
      onSuccess: (data, variables) => {
        toast.success(`Connected ${variables.repos.length} repository`);

        queryClient.invalidateQueries({
          queryKey: trpc.repository.getRepos.queryKey(),
        });
      },
      onError: (error) => {
        toast.error(error.message || "Failed to connect repository");
      },
    }),
  );
};

export const useDisconnectRepos = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.repository.disconnect.mutationOptions({
      onSuccess: (data) => {
        toast.success(`Disconnected repository ${data.disconnected.name}`);

        queryClient.invalidateQueries({
          queryKey: trpc.repository.getRepos.queryKey(),
        });
      },
      onError: (error) => {
        toast.error(error.message || "Failed to disconnect repository");
      },
    }),
  );
};

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