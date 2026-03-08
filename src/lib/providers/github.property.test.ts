import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  mapGitHubRepoToRepository,
  mapGitHubPRToPullRequest,
  type GitHubRepo,
  type GitHubPullRequest,
} from './github';
import type { Repository, PullRequest } from './types';

/**
 * Feature: future-proof-git-architecture
 * Property 1: GitHub Type Mapping Preserves Structure
 * 
 * **Validates: Requirements 3.5, 5.2, 5.3, 5.4**
 * 
 * For any GitHub API response (repository or pull request), when mapped to 
 * provider-agnostic types, the resulting object should contain all required 
 * fields with correct types, and the externalId field should be the string 
 * representation of the GitHub numeric ID.
 */

describe('Property 1: GitHub Type Mapping Preserves Structure', () => {
  /**
   * Arbitrary generator for GitHub repository objects
   */
  const githubRepoArbitrary = fc.record({
    id: fc.integer({ min: 1, max: Number.MAX_SAFE_INTEGER }),
    name: fc.string({ minLength: 1, maxLength: 100 }),
    full_name: fc.string({ minLength: 3, maxLength: 200 }).map(s => {
      // Ensure format is "owner/repo"
      const parts = s.split('/');
      if (parts.length < 2) return `owner/${s}`;
      return s;
    }),
    private: fc.boolean(),
    html_url: fc.webUrl(),
    description: fc.oneof(fc.constant(null), fc.string({ maxLength: 500 })),
    language: fc.oneof(
      fc.constant(null),
      fc.constantFrom('TypeScript', 'JavaScript', 'Python', 'Go', 'Rust', 'Java')
    ),
    stargazers_count: fc.integer({ min: 0, max: 1000000 }),
    updated_at: fc.date({ min: new Date('2000-01-01'), max: new Date('2030-12-31') }).map(d => d.toISOString()),
  }) as fc.Arbitrary<GitHubRepo>;

  /**
   * Arbitrary generator for GitHub pull request objects
   */
  const githubPRArbitrary = fc.record({
    id: fc.integer({ min: 1, max: Number.MAX_SAFE_INTEGER }),
    number: fc.integer({ min: 1, max: 100000 }),
    title: fc.string({ minLength: 1, maxLength: 200 }),
    state: fc.constantFrom('open' as const, 'closed' as const),
    html_url: fc.webUrl(),
    user: fc.record({
      login: fc.string({ minLength: 1, maxLength: 39 }),
      avatar_url: fc.webUrl(),
    }),
    created_at: fc.date({ min: new Date('2000-01-01'), max: new Date('2030-12-31') }).map(d => d.toISOString()),
    updated_at: fc.date({ min: new Date('2000-01-01'), max: new Date('2030-12-31') }).map(d => d.toISOString()),
    merged_at: fc.oneof(fc.constant(null), fc.date({ min: new Date('2000-01-01'), max: new Date('2030-12-31') }).map(d => d.toISOString())),
    draft: fc.boolean(),
    head: fc.record({
      ref: fc.string({ minLength: 1, maxLength: 100 }),
      sha: fc.string({ minLength: 40, maxLength: 40 }).map(s => 
        s.split('').map(c => '0123456789abcdef'[c.charCodeAt(0) % 16]).join('')
      ),
    }),
    base: fc.record({
      ref: fc.string({ minLength: 1, maxLength: 100 }),
    }),
    additions: fc.integer({ min: 0, max: 100000 }),
    deletions: fc.integer({ min: 0, max: 100000 }),
    changed_files: fc.integer({ min: 0, max: 1000 }),
  }) as fc.Arbitrary<GitHubPullRequest>;

  it('should preserve all repository fields with correct types', () => {
    fc.assert(
      fc.property(githubRepoArbitrary, (githubRepo) => {
        const mapped: Repository = mapGitHubRepoToRepository(githubRepo);

        // Verify all required fields are present
        expect(mapped).toHaveProperty('externalId');
        expect(mapped).toHaveProperty('name');
        expect(mapped).toHaveProperty('fullName');
        expect(mapped).toHaveProperty('private');
        expect(mapped).toHaveProperty('htmlUrl');
        expect(mapped).toHaveProperty('description');
        expect(mapped).toHaveProperty('language');
        expect(mapped).toHaveProperty('stars');
        expect(mapped).toHaveProperty('updatedAt');

        // Verify field types
        expect(typeof mapped.externalId).toBe('string');
        expect(typeof mapped.name).toBe('string');
        expect(typeof mapped.fullName).toBe('string');
        expect(typeof mapped.private).toBe('boolean');
        expect(typeof mapped.htmlUrl).toBe('string');
        expect(mapped.description === null || typeof mapped.description === 'string').toBe(true);
        expect(mapped.language === null || typeof mapped.language === 'string').toBe(true);
        expect(typeof mapped.stars).toBe('number');
        expect(typeof mapped.updatedAt).toBe('string');

        // Verify externalId is string representation of numeric GitHub id
        expect(mapped.externalId).toBe(githubRepo.id.toString());

        // Verify field mappings are correct
        expect(mapped.name).toBe(githubRepo.name);
        expect(mapped.fullName).toBe(githubRepo.full_name);
        expect(mapped.private).toBe(githubRepo.private);
        expect(mapped.htmlUrl).toBe(githubRepo.html_url);
        expect(mapped.description).toBe(githubRepo.description);
        expect(mapped.language).toBe(githubRepo.language);
        expect(mapped.stars).toBe(githubRepo.stargazers_count);
        expect(mapped.updatedAt).toBe(githubRepo.updated_at);
      }),
      { numRuns: 100 }
    );
  });

  it('should preserve all pull request fields with correct types', () => {
    fc.assert(
      fc.property(githubPRArbitrary, (githubPR) => {
        const mapped: PullRequest = mapGitHubPRToPullRequest(githubPR);

        // Verify all required fields are present
        expect(mapped).toHaveProperty('externalId');
        expect(mapped).toHaveProperty('number');
        expect(mapped).toHaveProperty('title');
        expect(mapped).toHaveProperty('state');
        expect(mapped).toHaveProperty('htmlUrl');
        expect(mapped).toHaveProperty('author');
        expect(mapped).toHaveProperty('createdAt');
        expect(mapped).toHaveProperty('updatedAt');
        expect(mapped).toHaveProperty('mergedAt');
        expect(mapped).toHaveProperty('draft');
        expect(mapped).toHaveProperty('sourceBranch');
        expect(mapped).toHaveProperty('targetBranch');
        expect(mapped).toHaveProperty('additions');
        expect(mapped).toHaveProperty('deletions');
        expect(mapped).toHaveProperty('changedFiles');

        // Verify field types
        expect(typeof mapped.externalId).toBe('string');
        expect(typeof mapped.number).toBe('number');
        expect(typeof mapped.title).toBe('string');
        expect(['open', 'closed']).toContain(mapped.state);
        expect(typeof mapped.htmlUrl).toBe('string');
        expect(typeof mapped.author).toBe('object');
        expect(typeof mapped.author.login).toBe('string');
        expect(typeof mapped.author.avatarUrl).toBe('string');
        expect(typeof mapped.createdAt).toBe('string');
        expect(typeof mapped.updatedAt).toBe('string');
        expect(mapped.mergedAt === null || typeof mapped.mergedAt === 'string').toBe(true);
        expect(typeof mapped.draft).toBe('boolean');
        expect(typeof mapped.sourceBranch).toBe('string');
        expect(typeof mapped.targetBranch).toBe('string');
        expect(typeof mapped.additions).toBe('number');
        expect(typeof mapped.deletions).toBe('number');
        expect(typeof mapped.changedFiles).toBe('number');

        // Verify externalId is string representation of numeric GitHub id
        expect(mapped.externalId).toBe(githubPR.id.toString());

        // Verify field mappings are correct
        expect(mapped.number).toBe(githubPR.number);
        expect(mapped.title).toBe(githubPR.title);
        expect(mapped.state).toBe(githubPR.state);
        expect(mapped.htmlUrl).toBe(githubPR.html_url);
        expect(mapped.author.login).toBe(githubPR.user.login);
        expect(mapped.author.avatarUrl).toBe(githubPR.user.avatar_url);
        expect(mapped.createdAt).toBe(githubPR.created_at);
        expect(mapped.updatedAt).toBe(githubPR.updated_at);
        expect(mapped.mergedAt).toBe(githubPR.merged_at);
        expect(mapped.draft).toBe(githubPR.draft);
        expect(mapped.sourceBranch).toBe(githubPR.head.ref);
        expect(mapped.targetBranch).toBe(githubPR.base.ref);
        expect(mapped.additions).toBe(githubPR.additions);
        expect(mapped.deletions).toBe(githubPR.deletions);
        expect(mapped.changedFiles).toBe(githubPR.changed_files);
      }),
      { numRuns: 100 }
    );
  });

  it('should handle edge cases for repository mapping', () => {
    fc.assert(
      fc.property(githubRepoArbitrary, (githubRepo) => {
        const mapped = mapGitHubRepoToRepository(githubRepo);

        // externalId should always be a non-empty string
        expect(mapped.externalId.length).toBeGreaterThan(0);

        // externalId should be parseable back to the original id
        expect(parseInt(mapped.externalId, 10)).toBe(githubRepo.id);

        // Null values should be preserved
        if (githubRepo.description === null) {
          expect(mapped.description).toBe(null);
        }
        if (githubRepo.language === null) {
          expect(mapped.language).toBe(null);
        }

        // Stars should be non-negative
        expect(mapped.stars).toBeGreaterThanOrEqual(0);
      }),
      { numRuns: 100 }
    );
  });

  it('should handle edge cases for pull request mapping', () => {
    fc.assert(
      fc.property(githubPRArbitrary, (githubPR) => {
        const mapped = mapGitHubPRToPullRequest(githubPR);

        // externalId should always be a non-empty string
        expect(mapped.externalId.length).toBeGreaterThan(0);

        // externalId should be parseable back to the original id
        expect(parseInt(mapped.externalId, 10)).toBe(githubPR.id);

        // Null mergedAt should be preserved
        if (githubPR.merged_at === null) {
          expect(mapped.mergedAt).toBe(null);
        }

        // Numeric fields should be non-negative
        expect(mapped.number).toBeGreaterThan(0);
        expect(mapped.additions).toBeGreaterThanOrEqual(0);
        expect(mapped.deletions).toBeGreaterThanOrEqual(0);
        expect(mapped.changedFiles).toBeGreaterThanOrEqual(0);

        // Branch names should be non-empty
        expect(mapped.sourceBranch.length).toBeGreaterThan(0);
        expect(mapped.targetBranch.length).toBeGreaterThan(0);
      }),
      { numRuns: 100 }
    );
  });
});
