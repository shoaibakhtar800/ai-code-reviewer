import "server-only";

import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import z, { ZodError } from "zod";
import { prisma } from "./db";

export const createTRPCContext = (opts: { headers: Headers }) => {
  return {
    db: prisma,
    headers: opts.headers,
  };
};

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? z.treeifyError(error.cause) : null,
      },
    };
  },
});

export const createCallerFactory = t.createCallerFactory;

export const createTRPCRouter = t.router;
export const baseProcedure = t.procedure;
