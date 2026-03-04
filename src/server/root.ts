import "server-only";

import { createCallerFactory, createTRPCRouter } from "./trpc";
import { healthRouter } from "./routers/health";
import { helloRouter } from "./routers/hello";

export const appRouter = createTRPCRouter({
  healthRouter,
  helloRouter,
});

export type AppRouter = typeof appRouter;
export const createCaller = createCallerFactory(appRouter);
