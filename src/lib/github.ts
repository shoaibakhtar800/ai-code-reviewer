import { prisma } from "@/server/db";

export interface GitHubUser {
  login: string;
  avatar_url: string;
}

export interface GitHubPullRequest {
  id: number;
  number: number;
  title: string;
  state: "open" | "closed";
  html_url: string;
  user: GitHubUser;
  created_at: string;
  updated_at: string;
  merged_at: string | null;
  draft: boolean;
  head: {
    ref: string;
    sha: string;
  };
  base: {
    ref: string;
  };
  additions: number;
  deletions: number;
  changed_files: number;
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  html_url: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  updated_at: string;
}

export async function getGitHubAccessToken(
  userId: string,
): Promise<string | null> {
  try {
    const account = await prisma.account.findFirst({
      where: {
        userId: userId,
        providerId: "github",
      },
      select: {
        accessToken: true,
      },
    });

    if (!account) {
      return null;
    }

    return account.accessToken ?? null;
  } catch (error) {
    console.error("Error getting GitHub access token:", error);
    return null;
  }
}

export async function fetchGitHubRepos(token: string): Promise<GitHubRepo[]> {
  try {
    const repos: GitHubRepo[] = [];
    let page = 1;
    const perPage = 100;

    while (true) {
      const response = await fetch(
        `https://api.github.com/user/repos?per_page=${perPage}&page=${page}&sort=updated&visibility=all`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github.v3+json",
          },
        },
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch repositories: ${response.statusText}`);
      }

      const data = (await response.json()) as GitHubRepo[];
      repos.push(...data);

      if (data.length < perPage) {
        break;
      }

      page++;
    }

    return repos;
  } catch (error) {
    console.error("Error fetching GitHub repositories:", error);
    return [];
  }
}

export const fetchPullRequests = async (
  accessToken: string,
  owner: string,
  repo: string,
  state: "open" | "closed" | "all" = "open"
): Promise<GitHubPullRequest> => {
  const response = await 
} 