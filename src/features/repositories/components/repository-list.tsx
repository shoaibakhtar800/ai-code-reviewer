"use client";

import { useState } from "react";
import { useGetRepos } from "../hooks/use-get-repos";
import { useFetchGithubRepos } from "../hooks/use-fetch-github-repos";
import { useConnectRepos } from "../hooks/use-connect-repos";
import { useDisconnectRepos } from "../hooks/use-disconnect-repos";

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  htmlUrl: string;
  description: string | null;
  language: string | null;
  stars: number;
  updatedAt: string;
}

const languageColors: Record<string, string> = {
  TypeScript: "bg-blue-500",
  JavaScript: "bg-yellow-400",
  Python: "bg-green-500",
  Go: "bg-cyan-500",
  Rust: "bg-orange-500",
  Java: "bg-red-500",
  Ruby: "bg-red-400",
  PHP: "bg-purple-500",
  "C#": "bg-green-600",
  "C++": "bg-pink-500",
  C: "bg-gray-500",
  Swift: "bg-orange-400",
  Kotlin: "bg-purple-400",
  Dart: "bg-blue-400",
  Vue: "bg-emerald-500",
  Svelte: "bg-orange-600",
};

interface RepositoryListProps {
  user: {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    email: string;
    emailVerified: boolean;
    name: string;
    image?: string | null | undefined;
  };
}

export const RepositoryList = ({ user }: RepositoryListProps) => {
  const [selectedRepos, setSelectedRepos] = useState<Set<number>>(new Set());
  const [showGithubRepos, setShowGithubRepos] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: connectedRepos, isLoading } = useGetRepos();
  const { data: githubRepos, invalidate } =
    useFetchGithubRepos(showGithubRepos);

  const connectMutation = useConnectRepos();
  const disconnectMutation = useDisconnectRepos();

  const connectedIds = new Set(
    connectedRepos?.map((repo) => repo.githubId) || [],
  );

  const availableRepos = githubRepos?.filter(
    (repo) => !connectedIds.has(repo.githubId),
  );

  const filteredAvailableRepos = availableRepos?.filter((repo) => {
    if (searchQuery === "") return true;
    return (
      repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      repo.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const toggleRepo = (githubId: number) => {
    const next = new Set(selectedRepos);
    if (next.has(githubId)) {
      next.delete(githubId);
    } else {
      next.add(githubId);
    }
    setSelectedRepos(next);
  };

  const handleConnect = () => {
    const reposToConnect = availableRepos?.filter((repo) =>
      selectedRepos.has(repo.githubId),
    );
    if (!reposToConnect) return;
    connectMutation.mutate(
      { repos: reposToConnect },
      {
        onSuccess: () => {
          setSelectedRepos(new Set());
          setShowGithubRepos(false);
          invalidate();
        },
      },
    );
  };

  const selectAll = () => {
    setSelectedRepos(
      new Set(filteredAvailableRepos?.map((repo) => repo.githubId)),
    );
  };

  const clearSelection = () => {
    setSelectedRepos(new Set());
  };

  return (
    <div className="space-y-8">
      <div></div>
    </div>
  );
};
