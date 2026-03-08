import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import {
  getProviderOperations,
  getAccessToken,
  fetchRepositories,
  fetchPullRequests,
} from './index';
import * as github from './github';
import type { Repository, PullRequest } from './types';

/**
 * Feature: future-proof-git-architecture
 * Property 5: Provider Operations Delegation
 * 
 * **Validates: Requirements 4.2, 4.6**
 * 
 * For any provider operation (getAccessToken, fetchRepositories, fetchPullRequests),
 * when called through the abstraction layer with provider "github", the call should
 * delegate to the corresponding GitHub-specific function and return the same result
 * as calling the GitHub function directly.
 */

describe('Property 5: Provider Operations Delegation', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  /**
   * Arbitrary generator for user IDs
   */
  const userIdArbitrary = fc.string({ minLength: 1, maxLength: 50 });

  /**
   * Arbitrary generator for access tokens
   */
  const accessTokenArbitrary = fc.string({ minLength: 20, maxLength: 100 });

  /**
   * Arbitrary generator for repository owner names
   */
  const ownerArbitrary = fc.string({ minLength: 1, maxLength: 39 });

  /**
   * Arbitrary generator for repository names
   */
  const repoNameArbitrary = fc.string({ minLength: 1, maxLength: 100 });

  /**
   * Arbitrary generator for PR state
   */
  const prStateArbitrary = fc.constantFrom(
    'open' as const,
    'closed' as const,
    'all' as const,
    undefined
  );

  /**
   * Arbitrary generator for Repository arrays
   */
  const repositoriesArbitrary = fc.array(
    fc.record({
      externalId: fc.integer({ min: 1, max: 1000000 }).map(n => n.toString()),
      name: fc.string({ minLength: 1, maxLength: 100 }),
      fullName: fc.string({ minLength: 3, maxLength: 200 }),
      private: fc.boolean(),
      htmlUrl: fc.webUrl(),
      description: fc.oneof(fc.constant(null), fc.string({ maxLength: 500 })),
      language: fc.oneof(fc.constant(null), fc.constantFrom('TypeScript', 'JavaScript', 'Python')),
      stars: fc.integer({ min: 0, max: 100000 }),
      updatedAt: fc.date().map(d => d.toISOString()),
    }) as fc.Arbitrary<Repository>,
    { minLength: 0, maxLength: 20 }
  );

  /**
   * Arbitrary generator for PullRequest arrays
   */
  const pullRequestsArbitrary = fc.array(
    fc.record({
      externalId: fc.integer({ min: 1, max: 1000000 }).map(n => n.toString()),
      number: fc.integer({ min: 1, max: 10000 }),
      title: fc.string({ minLength: 1, maxLength: 200 }),
      state: fc.constantFrom('open' as const, 'closed' as const),
      htmlUrl: fc.webUrl(),
      author: fc.record({
        login: fc.string({ minLength: 1, maxLength: 39 }),
        avatarUrl: fc.webUrl(),
      }),
      createdAt: fc.date().map(d => d.toISOString()),
      updatedAt: fc.date().map(d => d.toISOString()),
      mergedAt: fc.oneof(fc.constant(null), fc.date().map(d => d.toISOString())),
      draft: fc.boolean(),
      sourceBranch: fc.string({ minLength: 1, maxLength: 100 }),
      targetBranch: fc.string({ minLength: 1, maxLength: 100 }),
      additions: fc.integer({ min: 0, max: 10000 }),
      deletions: fc.integer({ min: 0, max: 10000 }),
      changedFiles: fc.integer({ min: 0, max: 100 }),
    }) as fc.Arbitrary<PullRequest>,
    { minLength: 0, maxLength: 30 }
  );

  it('should delegate getAccessToken to GitHub provider', async () => {
    await fc.assert(
      fc.asyncProperty(
        userIdArbitrary,
        fc.oneof(accessTokenArbitrary, fc.constant(null)),
        async (userId, expectedToken) => {
          // Mock the GitHub function
          const mockGetGitHubAccessToken = vi.spyOn(github, 'getGitHubAccessToken')
            .mockResolvedValue(expectedToken);

          // Call through abstraction layer
          const result = await getAccessToken(userId, 'github');

          // Verify GitHub function was called with correct parameters
          expect(mockGetGitHubAccessToken).toHaveBeenCalledWith(userId);
          expect(mockGetGitHubAccessToken).toHaveBeenCalledTimes(1);

          // Verify result matches direct GitHub function call
          expect(result).toBe(expectedToken);

          // Cleanup
          mockGetGitHubAccessToken.mockRestore();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should delegate fetchRepositories to GitHub provider', async () => {
    await fc.assert(
      fc.asyncProperty(
        accessTokenArbitrary,
        repositoriesArbitrary,
        async (token, expectedRepos) => {
          // Mock the GitHub function
          const mockFetchGitHubRepos = vi.spyOn(github, 'fetchGitHubRepos')
            .mockResolvedValue(expectedRepos);

          // Call through abstraction layer
          const result = await fetchRepositories(token, 'github');

          // Verify GitHub function was called with correct parameters
          expect(mockFetchGitHubRepos).toHaveBeenCalledWith(token);
          expect(mockFetchGitHubRepos).toHaveBeenCalledTimes(1);

          // Verify result matches direct GitHub function call
          expect(result).toEqual(expectedRepos);
          expect(result.length).toBe(expectedRepos.length);

          // Verify each repository in the result
          result.forEach((repo, index) => {
            expect(repo).toEqual(expectedRepos[index]);
          });

          // Cleanup
          mockFetchGitHubRepos.mockRestore();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should delegate fetchPullRequests to GitHub provider with all parameters', async () => {
    await fc.assert(
      fc.asyncProperty(
        accessTokenArbitrary,
        ownerArbitrary,
        repoNameArbitrary,
        prStateArbitrary,
        pullRequestsArbitrary,
        async (token, owner, repo, state, expectedPRs) => {
          // Mock the GitHub function
          const mockFetchGitHubPullRequests = vi.spyOn(github, 'fetchPullRequests')
            .mockResolvedValue(expectedPRs);

          // Call through abstraction layer
          const result = await fetchPullRequests(token, owner, repo, 'github', state);

          // Verify GitHub function was called with correct parameters
          expect(mockFetchGitHubPullRequests).toHaveBeenCalledWith(token, owner, repo, state);
          expect(mockFetchGitHubPullRequests).toHaveBeenCalledTimes(1);

          // Verify result matches direct GitHub function call
          expect(result).toEqual(expectedPRs);
          expect(result.length).toBe(expectedPRs.length);

          // Verify each pull request in the result
          result.forEach((pr, index) => {
            expect(pr).toEqual(expectedPRs[index]);
          });

          // Cleanup
          mockFetchGitHubPullRequests.mockRestore();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return correct ProviderOperations object for GitHub', () => {
    fc.assert(
      fc.property(fc.constant('github' as const), (provider) => {
        const operations = getProviderOperations(provider);

        // Verify all required operations are present
        expect(operations).toHaveProperty('getAccessToken');
        expect(operations).toHaveProperty('fetchRepositories');
        expect(operations).toHaveProperty('fetchPullRequests');

        // Verify operations are functions
        expect(typeof operations.getAccessToken).toBe('function');
        expect(typeof operations.fetchRepositories).toBe('function');
        expect(typeof operations.fetchPullRequests).toBe('function');

        // Verify operations reference the correct GitHub functions
        expect(operations.getAccessToken).toBe(github.getGitHubAccessToken);
        expect(operations.fetchRepositories).toBe(github.fetchGitHubRepos);
        expect(operations.fetchPullRequests).toBe(github.fetchPullRequests);
      }),
      { numRuns: 100 }
    );
  });

  it('should maintain consistency between direct and delegated calls', async () => {
    await fc.assert(
      fc.asyncProperty(
        userIdArbitrary,
        accessTokenArbitrary,
        ownerArbitrary,
        repoNameArbitrary,
        fc.oneof(accessTokenArbitrary, fc.constant(null)),
        repositoriesArbitrary,
        pullRequestsArbitrary,
        async (userId, token, owner, repo, mockToken, mockRepos, mockPRs) => {
          // Mock all GitHub functions
          const mockGetToken = vi.spyOn(github, 'getGitHubAccessToken')
            .mockResolvedValue(mockToken);
          const mockFetchRepos = vi.spyOn(github, 'fetchGitHubRepos')
            .mockResolvedValue(mockRepos);
          const mockFetchPRs = vi.spyOn(github, 'fetchPullRequests')
            .mockResolvedValue(mockPRs);

          // Get operations through abstraction
          const operations = getProviderOperations('github');

          // Call through operations object
          const tokenResult = await operations.getAccessToken(userId);
          const reposResult = await operations.fetchRepositories(token);
          const prsResult = await operations.fetchPullRequests(token, owner, repo);

          // Call through abstraction layer functions
          const tokenResultDirect = await getAccessToken(userId, 'github');
          const reposResultDirect = await fetchRepositories(token, 'github');
          const prsResultDirect = await fetchPullRequests(token, owner, repo, 'github');

          // Verify both approaches yield the same results
          expect(tokenResult).toBe(tokenResultDirect);
          expect(reposResult).toEqual(reposResultDirect);
          expect(prsResult).toEqual(prsResultDirect);

          // Verify all results match the mocked values
          expect(tokenResult).toBe(mockToken);
          expect(reposResult).toEqual(mockRepos);
          expect(prsResult).toEqual(mockPRs);

          // Cleanup
          mockGetToken.mockRestore();
          mockFetchRepos.mockRestore();
          mockFetchPRs.mockRestore();
        }
      ),
      { numRuns: 100 }
    );
  });
});
