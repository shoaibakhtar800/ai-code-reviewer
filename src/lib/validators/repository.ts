import { z } from "zod";

export const connectRepositorySchema = z.object({
  repos: z.array(
    z.object({
      externalId: z.string(),
      name: z.string(),
      fullName: z.string(),
      private: z.boolean(),
      htmlUrl: z.string(),
      provider: z.enum(["github", "gitlab", "bitbucket"]).default("github"),
    }),
  ),
});

export const getRepositorySchema = z.object({
  id: z.string(),
  provider: z.enum(["github", "gitlab", "bitbucket"]),
});

export type ConnectRepositoryInput = z.infer<typeof connectRepositorySchema>;

export const disconnectRepositorySchema = z.object({
  id: z.string(),
});

export type DisconnectRepositoryInput = z.infer<
  typeof disconnectRepositorySchema
>;
