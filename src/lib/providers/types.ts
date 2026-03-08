/**
 * Provider-agnostic type definitions for Git hosting providers
 * 
 * These types abstract away provider-specific implementations (GitHub, GitLab, etc.)
 * allowing the application to work with any Git hosting provider.
 */

/**
 * Supported Git hosting providers
 * Currently only GitHub is implemented, but designed to extend to GitLab, Bitbucket, etc.
 */
export type Provider = "github";

/**
 * Provider-agnostic repository representation
 * Maps from provider-specific repository types to a common interface
 */
export interface Repository {
  /** Provider's unique identifier for the repository (converted to string) */
  externalId: string;
  /** Repository name (e.g., "my-repo") */
  name: string;
  /** Full repository name including owner (e.g., "owner/my-repo") */
  fullName: string;
  /** Whether the repository is private */
  private: boolean;
  /** Web URL to view the repository */
  htmlUrl: string;
  /** Repository description */
  description: string | null;
  /** Primary programming language */
  language: string | null;
  /** Number of stars/favorites */
  stars: number;
  /** Last update timestamp (ISO 8601 format) */
  updatedAt: string;
}

/**
 * Provider-agnostic pull request representation
 * Maps from provider-specific PR types to a common interface
 */
export interface PullRequest {
  /** Provider's unique identifier for the pull request (converted to string) */
  externalId: string;
  /** Pull request number */
  number: number;
  /** Pull request title */
  title: string;
  /** Current state of the pull request */
  state: "open" | "closed";
  /** Web URL to view the pull request */
  htmlUrl: string;
  /** Pull request author information */
  author: {
    /** Author's username/login */
    login: string;
    /** Author's avatar image URL */
    avatarUrl: string;
  };
  /** Creation timestamp (ISO 8601 format) */
  createdAt: string;
  /** Last update timestamp (ISO 8601 format) */
  updatedAt: string;
  /** Merge timestamp, null if not merged (ISO 8601 format) */
  mergedAt: string | null;
  /** Whether this is a draft pull request */
  draft: boolean;
  /** Source branch name (branch being merged from) */
  sourceBranch: string;
  /** Target branch name (branch being merged into) */
  targetBranch: string;
  /** Number of lines added */
  additions: number;
  /** Number of lines deleted */
  deletions: number;
  /** Number of files changed */
  changedFiles: number;
}

/**
 * Provider operations interface
 * Defines the contract that all provider implementations must fulfill
 */
export interface ProviderOperations {
  /**
   * Retrieve access token for a user from the database
   * @param userId - User's unique identifier
   * @returns Access token string or null if not found
   */
  getAccessToken: (userId: string) => Promise<string | null>;

  /**
   * Fetch all repositories accessible with the given token
   * @param token - Provider access token
   * @returns Array of provider-agnostic repository objects
   */
  fetchRepositories: (token: string) => Promise<Repository[]>;

  /**
   * Fetch pull requests for a specific repository
   * @param token - Provider access token
   * @param owner - Repository owner username/organization
   * @param repo - Repository name
   * @param state - Optional filter by PR state (defaults to "all")
   * @returns Array of provider-agnostic pull request objects
   */
  fetchPullRequests: (
    token: string,
    owner: string,
    repo: string,
    state?: "open" | "closed" | "all"
  ) => Promise<PullRequest[]>;
}
