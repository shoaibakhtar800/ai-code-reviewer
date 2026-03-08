import "server-only";

import { createCallerFactory, createTRPCRouter } from "./trpc";
import { repositoryRouter } from "./routers/repository";
import { pullRequestRouter } from "./routers/pull-request";

export const appRouter = createTRPCRouter({
  repository: repositoryRouter,
  pullRequest: pullRequestRouter,
});

export type AppRouter = typeof appRouter;
export const createCaller = createCallerFactory(appRouter);
