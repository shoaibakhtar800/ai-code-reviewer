import { useTRPC } from "@/trpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

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
