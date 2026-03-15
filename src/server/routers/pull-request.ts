import {
  pullRequestGetSchema,
  pullRequestListSchema,
} from "@/lib/validators/pull-request";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import {
  fetchPullRequest,
  fetchPullRequestFiles,
  fetchPullRequests,
  getAccessToken,
} from "@/lib/providers";
import type { Provider } from "@/lib/providers/types";

export const pullRequestRouter = createTRPCRouter({
  list: protectedProcedure
    .input(pullRequestListSchema)
    .query(async ({ ctx, input }) => {
      const repository = await ctx.db.repository.findUnique({
        where: { id: input.repositoryId, userId: ctx.user.id },
      });

      if (!repository) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Repository not found",
        });
      }

      const accessToken = await getAccessToken(
        ctx.user.id,
        repository.provider as Provider,
      );
      if (!accessToken) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: `${repository.provider.charAt(0).toUpperCase() + repository.provider.slice(1)} account not connected`,
        });
      }

      const [owner, repo] = repository.fullName.split("/");
      if (!owner || !repo) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid repository name",
        });
      }

      const prs = await fetchPullRequests(
        accessToken,
        owner,
        repo,
        repository.provider as Provider,
        input.state,
      );

      const existingReviews = await ctx.db.review.findMany({
        where: {
          repositoryId: repository.id,
          prNumber: { in: prs.map((pr) => pr.number) },
        },
        select: {
          prNumber: true,
          status: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      const reviewMap = new Map(existingReviews.map((r) => [r.prNumber, r]));

      return prs.map((pr) => ({
        id: pr.externalId,
        number: pr.number,
        title: pr.title,
        state: pr.state,
        draft: pr.draft,
        htmlUrl: pr.htmlUrl,
        author: {
          login: pr.author.login,
          avatarUrl: pr.author.avatarUrl,
        },
        headRef: pr.sourceBranch,
        headSha: pr.headSha,
        baseRef: pr.targetBranch,
        additions: pr.additions,
        deletions: pr.deletions,
        changedFiles: pr.changedFiles,
        createdAt: pr.createdAt,
        updatedAt: pr.updatedAt,
        mergedAt: pr.mergedAt,
        review: reviewMap.get(pr.number) ?? null,
      }));
    }),

  get: protectedProcedure
    .input(pullRequestGetSchema)
    .query(async ({ ctx, input }) => {
      const repository = await ctx.db.repository.findUnique({
        where: { id: input.repositoryId, userId: ctx.user.id },
      });

      if (!repository) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Repository not found",
        });
      }

      const accessToken = await getAccessToken(
        ctx.user.id,
        repository.provider as Provider,
      );

      if (!accessToken) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: `${repository.provider.charAt(0).toUpperCase() + repository.provider.slice(1)} account not connected`,
        });
      }

      const [owner, repo] = repository.fullName.split("/");
      if (!owner || !repo) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid repository name",
        });
      }
      const pr = await fetchPullRequest(
        accessToken,
        owner,
        repo,
        repository.provider as Provider,
        input.prNumber,
      );

      const existingReview = await ctx.db.review.findFirst({
        where: {
          repositoryId: repository.id,
          prNumber: pr.number,
        },
        orderBy: { createdAt: "desc" },
      });

      return {
        id: pr.externalId,
        number: pr.number,
        title: pr.title,
        state: pr.state,
        draft: pr.draft,
        htmlUrl: pr.htmlUrl,
        author: {
          login: pr.author.login,
          avatar: pr.author.avatarUrl,
        },
        headRef: pr.sourceBranch,
        headSha: pr.headSha,
        baseRef: pr.targetBranch,
        additions: pr.additions,
        deletions: pr.deletions,
        changedFiles: pr.changedFiles,
        createdAt: pr.createdAt,
        updatedAt: pr.updatedAt,
        mergedAt: pr.mergedAt,
        review: existingReview,
      };
    }),

  files: protectedProcedure
    .input(pullRequestGetSchema)
    .query(async ({ ctx, input }) => {
      const repository = await ctx.db.repository.findUnique({
        where: { id: input.repositoryId, userId: ctx.user.id },
      });

      if (!repository) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Repository not found",
        });
      }

      const accessToken = await getAccessToken(
        ctx.user.id,
        repository.provider as Provider,
      );

      if (!accessToken) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: `${repository.provider.charAt(0).toUpperCase() + repository.provider.slice(1)} account not connected`,
        });
      }

      const [owner, repo] = repository.fullName.split("/");
      if (!owner || !repo) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid repository name",
        });
      }

      const files = await fetchPullRequestFiles(
        accessToken,
        owner,
        repo,
        repository.provider as Provider,
        input.prNumber,
      );

      return files;
    }),
});
