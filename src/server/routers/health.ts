import { baseProcedure, createTRPCRouter } from "../trpc";

export const healthRouter = createTRPCRouter({
  status: baseProcedure.query(() => {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
    };
  }),
});
