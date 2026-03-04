import "server-only";

import { createCallerFactory, createTRPCRouter } from "./trpc";
import { repositoryRouter } from "./routers/repository";

export const appRouter = createTRPCRouter({
  repository: repositoryRouter,
});

export type AppRouter = typeof appRouter;
export const createCaller = createCallerFactory(appRouter);
