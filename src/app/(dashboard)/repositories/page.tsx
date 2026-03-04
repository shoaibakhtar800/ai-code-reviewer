import { requireAuth } from "@/lib/auth-server";

export default async function RepositoriesPage() {
  const { user } = await requireAuth();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Repositories</h1>
      <p>Welcome, {user.name ?? user.email}</p>
    </div>
  );
}
