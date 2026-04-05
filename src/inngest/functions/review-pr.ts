import { prisma } from "@/server/db";
import { inngest } from "../client";
import { ReviewStatus } from "@/generated/prisma/enums";
import {
  fetchPullRequest,
  fetchPullRequestFiles,
  getAccessToken,
} from "@/lib/providers";
import { Provider } from "@/lib/providers/types";

export type ReviewPREvent = {
  name: "review/pr.requested";
  data: {
    reviewId: string;
    repositoryId: string;
    prNumber: number;
    userId: string;
  };
};

export const reviewPR = inngest.createFunction(
  {
    id: "review-pr",
    name: "Review PR",
    retries: 2,
    triggers: {
      event: "review/pr.requested",
    },
    onFailure: async ({ error, event, step }) => {
      throw new Error("Failed to review PR", { cause: error });
    },
  },
  async ({ event, step }) => {
    const { reviewId, repositoryId, prNumber, userId } = event.data;

    await step.run("update-status-processing", async () => {
      await prisma.review.update({
        where: {
          id: reviewId,
          userId: userId,
        },
        data: {
          status: ReviewStatus.PROCESSING,
        },
      });
    });

    const repository = await step.run("fetch-repository", async () => {
      return await prisma.repository.findUnique({
        where: {
          id: repositoryId,
          userId: userId,
        },
      });
    });

    if (!repository) {
      await step.run("update-status-failed", async () => {
        await prisma.review.update({
          where: {
            id: reviewId,
            userId: userId,
          },
          data: {
            status: ReviewStatus.FAILED,
            error: "Repository not found",
          },
        });
      });

      return {
        success: false,
        error: "Repository not found",
      };
    }

    const accessToken = await step.run("fetch-access-token", async () => {
      return getAccessToken(userId, repository.provider as Provider);
    });

    if (!accessToken) {
      await step.run("update-status-failed", async () => {
        await prisma.review.update({
          where: {
            id: reviewId,
            userId: userId,
          },
          data: {
            status: ReviewStatus.FAILED,
            error: `${repository.provider.charAt(0).toUpperCase() + repository.provider.slice(1)} account not connected`,
          },
        });
      });

      return {
        success: false,
        error: `${repository.provider.charAt(0).toUpperCase() + repository.provider.slice(1)} account not connected`,
      };
    }

    const [owner, repo] = repository.fullName.split("/");
    if (!owner || !repo) {
      await step.run("update-status-failed", async () => {
        await prisma.review.update({
          where: {
            id: reviewId,
            userId: userId,
          },
          data: {
            status: ReviewStatus.FAILED,
            error: "Invalid repository name",
          },
        });
      });

      return {
        success: false,
        error: "Invalid repository name",
      };
    }

    const prFiles = await step.run("fetch-pull-request-files", async () => {
      return await fetchPullRequestFiles(
        accessToken,
        owner,
        repo,
        repository.provider as Provider,
        prNumber,
      );
    });

    // TODO: Add AI review logic here
    const reviewResult = await step.run("run-ai-review", async () => {
      return {
        summary: `Reviewed ${prFiles.length} files with ${prFiles.reduce((acc, file) => acc + file.additions + file.deletions, 0)} lines of code`,
        riskScore: Math.floor(Math.random() * 100) + 1,
        comments: prFiles.slice(0, 3).map((file) => ({
          file: file.filename,
          line: 1,
          severity: "low" as const,
          message: `Reviewed ${file.filename} - ${file.additions} additions, ${file.deletions} deletions`,
        })),
      };
    });

    await step.run("save-review-result", async () => {
      await prisma.review.update({
        where: {
          id: reviewId,
          userId: userId,
        },
        data: {
          status: ReviewStatus.COMPLETED,
          summary: reviewResult.summary,
          riskScore: reviewResult.riskScore,
          comments: reviewResult.comments,
        },
      });
    });

    return {
      success: true,
    };
  },
);
