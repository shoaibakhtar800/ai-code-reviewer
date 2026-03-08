import { RepositoryDetail } from "@/features/repository/components/repository-detail";
import { RepositoryDetailPageProps } from "@/features/repository/types";
import { requireAuth } from "@/lib/auth-server";

export default async function RepositoryPage({
  params,
}: RepositoryDetailPageProps) {
  await requireAuth();

  const { id } = await params;

  return <RepositoryDetail id={id} />;
}
