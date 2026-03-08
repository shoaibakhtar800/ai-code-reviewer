import { RepositoryList } from "@/features/repository/components/repository-list";
import { requireAuth } from "@/lib/auth-server";

export default async function RepositoriesPage() {
  await requireAuth();

  return <RepositoryList />;
}
