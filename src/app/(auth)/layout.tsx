import { redirectIfAuthenticated } from "@/lib/auth-server";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  await redirectIfAuthenticated();

  return (
    <div className="flex h-screen items-center justify-center">{children}</div>
  );
}
