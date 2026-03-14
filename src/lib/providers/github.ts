import { prisma } from "@/server/db";
import type { Repository, PullRequest } from "./types";

// GitHub-specific interfaces for internal API response handling
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

export async function fetchGitHubRepos(token: string): Promise<Repository[]> {
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

    // Map GitHub-specific types to provider-agnostic types
    return repos.map(mapGitHubRepoToRepository);
  } catch (error) {
    console.error("Error fetching GitHub repositories:", error);
    return [];
  }
}

/**
 * Maps a GitHub repository to provider-agnostic Repository type
 */
export function mapGitHubRepoToRepository(repo: GitHubRepo): Repository {
  return {
    externalId: repo.id.toString(),
    name: repo.name,
    fullName: repo.full_name,
    private: repo.private,
    htmlUrl: repo.html_url,
    description: repo.description,
    language: repo.language,
    stars: repo.stargazers_count,
    updatedAt: repo.updated_at,
  };
}

export const fetchPullRequests = async (
  accessToken: string,
  owner: string,
  repo: string,
  state: "open" | "closed" | "all" = "open",
): Promise<PullRequest[]> => {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/pulls?state=${state}&per_page=30&sort=updated&direction=desc`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    },
  );

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status}`);
  }

  const data = (await response.json()) as GitHubPullRequest[];

  const prDetailed = await Promise.all(
    data.map((pr) => fetchPullRequest(accessToken, owner, repo, pr.number)),
  );

  // Map GitHub-specific types to provider-agnostic types
  return prDetailed;
};

/**
 * Maps a GitHub pull request to provider-agnostic PullRequest type
 */
export function mapGitHubPRToPullRequest(pr: GitHubPullRequest): PullRequest {
  return {
    externalId: pr.id.toString(),
    number: pr.number,
    title: pr.title,
    state: pr.state,
    htmlUrl: pr.html_url,
    author: {
      login: pr.user.login,
      avatarUrl: pr.user.avatar_url,
    },
    createdAt: pr.created_at,
    updatedAt: pr.updated_at,
    mergedAt: pr.merged_at,
    draft: pr.draft,
    sourceBranch: pr.head.ref,
    targetBranch: pr.base.ref,
    headSha: pr.head.sha,
    additions: pr.additions,
    deletions: pr.deletions,
    changedFiles: pr.changed_files,
  };
}

export const fetchPullRequest = async (
  accessToken: string,
  owner: string,
  repo: string,
  prNumber: number,
): Promise<PullRequest> => {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    },
  );

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status}`);
  }

  const data = (await response.json()) as GitHubPullRequest;

  // Map GitHub-specific type to provider-agnostic type
  return mapGitHubPRToPullRequest(data);
};
