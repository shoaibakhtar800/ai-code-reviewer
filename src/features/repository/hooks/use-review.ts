import { ReviewStatus } from "@/generated/prisma/enums";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "sonner";
import { useGetPullRequest } from "./use-pull-request";

/**
 * Fetch the latest review for a pull request
 */
export const useGetLatestReviewForPR = (
  repositoryId: string,
  prNumber: number,
  enabled: boolean,
) => {
  const trpc = useTRPC();

  const query = useQuery({
    ...trpc.review.getLatestForPR.queryOptions({
      repositoryId,
      prNumber,
    }),
    enabled,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (
        status === ReviewStatus.PENDING ||
        status === ReviewStatus.PROCESSING
      ) {
        return 2000;
      }
      return false;
    },
  });

  useEffect(() => {
    if (query.isError) {
      toast.error("Failed to load review");
    }
  }, [query.isError]);

  return query;
};

/**
 * Trigger a review for a pull request
 */
export const useTriggerReview = (
  latestReviewQuery: ReturnType<typeof useGetLatestReviewForPR>,
  pullRequestQuery: ReturnType<typeof useGetPullRequest>,
) => {
  const trpc = useTRPC();

  const mutation = useMutation({
    ...trpc.review.trigger.mutationOptions(),
    onSuccess: () => {
      // Lets refetch the latest review for PR and pr files
      latestReviewQuery.refetch();
      pullRequestQuery.refetch();

      toast.success("Review triggered successfully");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return mutation;
};
