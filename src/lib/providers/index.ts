/**
 * Provider abstraction layer
 *
 * This module provides a unified interface for working with different Git hosting providers.
 * It delegates operations to provider-specific implementations while maintaining a
 * provider-agnostic API for the rest of the application.
 */

import type {
  Provider,
  ProviderOperations,
  Repository,
  PullRequest,
  PullRequestFile,
} from "./types";
import {
  getGitHubAccessToken,
  fetchGitHubRepos,
  fetchPullRequests as fetchGitHubPullRequests,
  fetchPullRequest as fetchGitHubPullRequest,
  fetchPullRequestFiles as fetchGitHubPullRequestFiles,
} from "./github";

/**
 * Get provider-specific operations for the given provider
 *
 * @param provider - The Git hosting provider ("github", etc.)
 * @returns ProviderOperations object containing provider-specific functions
 * @throws Error if provider is not supported
 */
export function getProviderOperations(provider: Provider): ProviderOperations {
  switch (provider) {
    case "github":
      return {
        getAccessToken: getGitHubAccessToken,
        fetchRepositories: fetchGitHubRepos,
        fetchPullRequests: fetchGitHubPullRequests,
        fetchPullRequest: fetchGitHubPullRequest,
        fetchPullRequestFiles: fetchGitHubPullRequestFiles,
      };
    case "gitlab":
    case "bitbucket":
      throw new Error(`Provider ${provider} not yet implemented`);
    default:
      // TypeScript exhaustiveness check - should never reach here
      const _exhaustive: never = provider;
      throw new Error(`Unsupported provider: ${_exhaustive}`);
  }
}

/**
 * Get access token for a user and provider
 * @param userId - User's unique identifier
 * @param provider - The Git hosting provider
 * @returns Access token string or null if not found
 */
export async function getAccessToken(
  userId: string,
  provider: Provider,
): Promise<string | null> {
  const operations = getProviderOperations(provider);
  return operations.getAccessToken(userId);
}

/**
 * Fetch repositories from the specified provider
 * @param token - Provider access token
 * @param provider - The Git hosting provider
 * @returns Array of provider-agnostic repository objects with provider field
 */
export async function fetchRepositories(
  token: string,
  provider: Provider,
): Promise<(Repository & { provider: Provider })[]> {
  const operations = getProviderOperations(provider);
  const repos = await operations.fetchRepositories(token);
  return repos.map((repo) => ({ ...repo, provider }));
}

/**
 * Fetch pull requests for a specific repository
 * @param token - Provider access token
 * @param owner - Repository owner username/organization
 * @param repo - Repository name
 * @param provider - The Git hosting provider
 * @param state - Optional filter by PR state (defaults to "open")
 * @returns Array of provider-agnostic pull request objects
 */
export async function fetchPullRequests(
  token: string,
  owner: string,
  repo: string,
  provider: Provider,
  state?: "open" | "closed" | "all",
): Promise<PullRequest[]> {
  const operations = getProviderOperations(provider);
  return operations.fetchPullRequests(token, owner, repo, state);
}

/**
 * Fetch a single pull request by number
 * @param token - Provider access token
 * @param owner - Repository owner username/organization
 * @param repo - Repository name
 * @param provider - The Git hosting provider
 * @param prNumber - Pull request number
 * @returns Provider-agnostic pull request object
 */
export async function fetchPullRequest(
  token: string,
  owner: string,
  repo: string,
  provider: Provider,
  prNumber: number,
): Promise<PullRequest> {
  const operations = getProviderOperations(provider);
  return operations.fetchPullRequest(token, owner, repo, prNumber);
}

/**
 * Fetch all files in a pull request
 * @param token - Provider access token
 * @param owner - Repository owner username/organization
 * @param repo - Repository name
 * @param provider - The Git hosting provider
 * @param prNumber - Pull request number
 * @returns Array of provider-agnostic pull request file objects
 */
export async function fetchPullRequestFiles(
  token: string,
  owner: string,
  repo: string,
  provider: Provider,
  prNumber: number,
): Promise<PullRequestFile[]> {
  const operations = getProviderOperations(provider);
  return operations.fetchPullRequestFiles(token, owner, repo, prNumber);
}
