// Lets create trpc router for repository

import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { fetchGitHubRepos, getGitHubAccessToken } from "@/lib/github";
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

  fetchFromGithub: protectedProcedure.query(async ({ ctx }) => {
    const accessToken = await getGitHubAccessToken(ctx.user.id);

    if (!accessToken) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "No GitHub access token found",
      });
    }

    const repos = await fetchGitHubRepos(accessToken);
    return repos.map((repo) => ({
      id: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      private: repo.private,
      htmlUrl: repo.html_url,
      description: repo.description,
      language: repo.language,
      stars: repo.stargazers_count,
      updatedAt: repo.updated_at,
    }));
  }),

  connect: protectedProcedure
    .input(connectRepositorySchema)
    .mutation(async ({ ctx, input }) => {
      const result = await Promise.all(
        input.repos.map(async (repo) => {
          return ctx.db.repository.upsert({
            where: {
              githubId: repo.githubId,
            },
            update: {
              name: repo.name,
              fullName: repo.fullName,
              private: repo.private,
              htmlUrl: repo.htmlUrl,
              updatedAt: new Date(),
            },
            create: {
              githubId: repo.githubId,
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
