import z from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { fetchPullRequest, getAccessToken } from "@/lib/providers";
import { Provider } from "@/lib/providers/types";
import { ReviewStatus } from "@/generated/prisma/enums";
import { inngest } from "@/inngest/client";

export const reviewRouter = createTRPCRouter({
  trigger: protectedProcedure
    .input(
      z.object({
        repositoryId: z.string(),
        prNumber: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const repository = await ctx.db.repository.findFirst({
        where: {
          id: input.repositoryId,
          userId: ctx.user.id,
        },
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
          code: "UNAUTHORIZED",
          message: `No access token found for ${repository.provider} provider`,
        });
      }

      const [owner, repoName] = repository.fullName.split("/");

      if (!owner || !repoName) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid repository name",
        });
      }

      const pr = await fetchPullRequest(
        accessToken,
        owner,
        repoName,
        repository.provider as Provider,
        input.prNumber,
      );

      if (!pr) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Pull request not found",
        });
      }

      const review = await ctx.db.review.create({
        data: {
          repositoryId: repository.id,
          prNumber: input.prNumber,
          status: ReviewStatus.PENDING,
          userId: ctx.user.id,
          prTitle: pr.title,
          prUrl: pr.htmlUrl,
        },
      });

      await inngest.send({
        name: "review/pr.requested",
        data: {
          reviewId: review.id,
          repositoryId: repository.id,
          prNumber: pr.number,
          userId: ctx.user.id,
        },
      });

      return { reviewId: review.id };
    }),

  getById: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const review = await ctx.db.review.findUnique({
        where: {
          id: input.id,
          userId: ctx.user.id,
        },
        include: {
          repository: true,
        },
      });

      if (!review) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Review not found",
        });
      }

      return review;
    }),

  getAll: protectedProcedure
    .input(
      z.object({
        repositoryId: z.string().optional(),
        limit: z.number().min(1).max(50).default(20),
        cursor: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const reviews = await ctx.db.review.findMany({
        where: {
          userId: ctx.user.id,
          ...(input.repositoryId && { repositoryId: input.repositoryId }),
        },
        include: {
          repository: true,
        },
        take: input.limit,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: {
          createdAt: "desc",
        },
      });

      return reviews;
    }),

  getLatestForPR: protectedProcedure
    .input(
      z.object({
        repositoryId: z.string(),
        prNumber: z.number(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const review = await ctx.db.review.findFirst({
        where: {
          repositoryId: input.repositoryId,
          prNumber: input.prNumber,
          userId: ctx.user.id,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return review;
    }),
});
