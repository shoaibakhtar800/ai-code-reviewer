import z from "zod";

export const pullRequestListSchema = z.object({
  repositoryId: z.string(),
  state: z.enum(["open", "closed", "all"]).default("open"),
});

export const pullRequestGetSchema = z.object({
  repositoryId: z.string(),
  prNumber: z.coerce.number(),
});
