"use client";

import { cn } from "@/lib/utils";
import { FolderGit2Icon, GitPullRequestIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserMenu } from "./user-menu";

interface User {
  id: string;
  email: string;
  name: string;
  image?: string | null | undefined;
}

interface HeaderProps {
  user: User;
}

const navigationItems = [
  {
    href: "/repositories",
    label: "Repositories",
    icon: FolderGit2Icon,
  },
  {
    href: "/reviews",
    label: "Reviews",
    icon: GitPullRequestIcon,
  },
];

export default function Header({ user }: HeaderProps) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl supports-backdrop-filter:bg-background/60 px-4 py-2">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/repositories"
              className="flex items-center gap-2.5 transition-opacity hover:opacity-80"
            >
              <div className="shrink-0">
                <Image
                  src="/logo.svg"
                  alt="Logo"
                  width={26}
                  height={26}
                  className="block"
                />
              </div>
              <h3 className="text-xl font-bold tracking-tight leading-none">
                Sentinell
              </h3>
            </Link>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            {navigationItems.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/8 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                  )}
                >
                  <Icon className="size-4" />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <UserMenu user={user} />
        </div>
      </div>
    </header>
  );
}
