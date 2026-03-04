import { z } from "zod";

export const connectRepositorySchema = z.object({
  repos: z.array(
    z.object({
      githubId: z.number(),
      name: z.string(),
      fullName: z.string(),
      private: z.boolean(),
      htmlUrl: z.string(),
    }),
  ),
});

export type ConnectRepositoryInput = z.infer<typeof connectRepositorySchema>;

export const disconnectRepositorySchema = z.object({
  id: z.string(),
});

export type DisconnectRepositoryInput = z.infer<
  typeof disconnectRepositorySchema
>;
