import "server-only";

import { createCallerFactory, createTRPCRouter } from "./trpc";
import { repositoryRouter } from "./routers/repository";
import { pullRequestRouter } from "./routers/pull-request";
import { reviewRouter } from "./routers/review";

export const appRouter = createTRPCRouter({
  repository: repositoryRouter,
  pullRequest: pullRequestRouter,
  review: reviewRouter,
});

export type AppRouter = typeof appRouter;
export const createCaller = createCallerFactory(appRouter);
