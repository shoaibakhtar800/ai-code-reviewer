// Lets create trpc router for repository

import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { getAccessToken, fetchRepositories } from "@/lib/providers/index";
import {
  connectRepositorySchema,
  disconnectRepositorySchema,
} from "@/lib/validators/repository";

export const repositoryRouter = createTRPCRouter({
  getRepos: protectedProcedure.query(async ({ ctx }) => {
    const repos = await ctx.db.repository.findMany({
      where: {
        userId: ctx.session.user.id,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });
    return repos;
  }),

  fetchFromProvider: protectedProcedure.query(async ({ ctx }) => {
    const accessToken = await getAccessToken(ctx.user.id, "github");

    if (!accessToken) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "No access token found",
      });
    }

    const repos = await fetchRepositories(accessToken, "github");
    return repos;
  }),

  connect: protectedProcedure
    .input(connectRepositorySchema)
    .mutation(async ({ ctx, input }) => {
      const result = await Promise.all(
        input.repos.map(async (repo) => {
          return ctx.db.repository.upsert({
            where: {
              externalId_provider: {
                externalId: repo.externalId,
                provider: repo.provider,
              },
            },
            update: {
              name: repo.name,
              fullName: repo.fullName,
              private: repo.private,
              htmlUrl: repo.htmlUrl,
              updatedAt: new Date(),
            },
            create: {
              externalId: repo.externalId,
              provider: repo.provider,
              name: repo.name,
              fullName: repo.fullName,
              private: repo.private,
              htmlUrl: repo.htmlUrl,
              userId: ctx.session.user.id,
            },
          });
        }),
      );
      return {
        connected: result,
      };
    }),

  disconnect: protectedProcedure
    .input(disconnectRepositorySchema)
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.repository.delete({
        where: {
          id: input.id,
          userId: ctx.session.user.id,
        },
      });
      return {
        success: true,
        disconnected: result,
      };
    }),
});
