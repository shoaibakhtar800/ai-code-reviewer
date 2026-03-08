import { useTRPC } from "@/trpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

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
