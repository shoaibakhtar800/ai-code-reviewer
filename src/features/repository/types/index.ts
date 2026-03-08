import type { Provider } from "@/lib/providers/types";

export interface ProviderRepo {
  externalId: string;
  provider: Provider;
  name: string;
  fullName: string;
  private: boolean;
  htmlUrl: string;
  description: string | null;
  language: string | null;
  stars: number;
  updatedAt: string;
}

// Backward compatibility alias
export type GitHubRepo = ProviderRepo;

export type RepositoryDetailPageProps = {
  params: Promise<{ id: string }>
}