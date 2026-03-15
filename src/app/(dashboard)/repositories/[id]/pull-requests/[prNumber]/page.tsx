import PullRequestDetail from "@/features/repository/components/pull-request/pull-request-detail";
import { requireAuth } from "@/lib/auth-server";

export default async function PullRequestPage({
  params,
}: {
  params: Promise<{ id: string; prNumber: string }>;
}) {
  await requireAuth();
  const { id, prNumber } = await params;

  return <PullRequestDetail repositoryId={id} prNumber={Number(prNumber)} />;
}
