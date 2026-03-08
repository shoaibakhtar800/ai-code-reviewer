import { RepositoryList } from "@/features/repository/components/repository-list";
import { requireAuth } from "@/lib/auth-server";

export default async function RepositoriesPage() {
  const { user } = await requireAuth();

  return <RepositoryList user={user} />;
}
