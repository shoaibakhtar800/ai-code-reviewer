import Header from "@/components/header";
import { getServerSession } from "@/lib/auth-server";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();

  return (
    <div className="min-h-screen bg-background">
      <Header user={session!.user} />
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
