import { z } from "zod";
import { baseProcedure, createTRPCRouter } from "../trpc";

export const helloRouter = createTRPCRouter({
  hello: baseProcedure
    .input(
      z.object({
        text: z.string(),
      }),
    )
    .query(async (opts) => {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      return {
        greeting: `hello ${opts.input.text}`,
      };
    }),
});
