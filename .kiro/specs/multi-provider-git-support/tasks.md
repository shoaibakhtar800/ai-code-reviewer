# Implementation Plan: Multi-Provider Git Support

## Overview

This implementation plan refactors the existing GitHub-only PR review application to support multiple Git providers (GitHub and GitLab). The approach follows a provider abstraction pattern with a common interface, factory pattern for provider instantiation, and normalized data structures. Implementation proceeds incrementally: first establishing the abstraction layer, then refactoring GitHub code, adding GitLab support, updating the database schema, modifying API endpoints, and finally updating frontend components.

## Tasks

- [ ] 1. Set up provider abstraction layer
  - [ ] 1.1 Create provider types and interfaces
    - Create `src/lib/providers/types.ts` with `GitProvider` interface, `ProviderType` enum, and normalized data structures (`NormalizedRepository`, `NormalizedReviewItem`, `NormalizedUser`)
    - Define `ReviewItemState` type and all required interface methods
    - _Requirements: 1.1, 1.2, 1.5_
  
  - [ ] 1.2 Create provider error handling
    - Create `src/lib/providers/errors.ts` with `ProviderError` class
    - Implement helper methods: `isRateLimit()`, `isUnauthorized()`
    - _Requirements: 2.5, 3.5, 10.1, 10.2_
  
  - [ ] 1.3 Create provider factory
    - Create `src/lib/providers/factory.ts` with `ProviderFactory` class
    - Implement `create()`, `getSupportedProviders()`, and `isSupported()` methods
    - _Requirements: 1.3, 1.4_
  
  - [ ]* 1.4 Write property test for provider factory
    - **Property 1: Factory Creates Valid Provider Instances**
    - **Validates: Requirements 1.3**

- [ ] 2. Implement GitHub provider adapter
  - [ ] 2.1 Create GitHub provider implementation
    - Create `src/lib/providers/github.ts` with `GitHubProvider` class implementing `GitProvider` interface
    - Refactor existing code from `src/lib/github.ts` into the new provider structure
    - Implement `fetchRepositories()` with pagination support
    - Implement `fetchReviewItems()` and `fetchReviewItem()` methods
    - Implement `fetchUser()` method
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.6_
  
  - [ ] 2.2 Add GitHub data normalization methods
    - Implement private `normalizeRepository()` method to convert `GitHubRepo` to `NormalizedRepository`
    - Implement private `normalizeReviewItem()` method to convert `GitHubPullRequest` to `NormalizedReviewItem`
    - Implement private `normalizeUser()` method
    - _Requirements: 1.5, 2.3_
  
  - [ ]* 2.3 Write property test for GitHub normalization
    - **Property 2: Provider Normalization Completeness**
    - **Validates: Requirements 1.5, 2.3**
  
  - [ ]* 2.4 Write property test for GitHub error handling
    - **Property 3: Provider Error Context**
    - **Validates: Requirements 2.5, 10.1, 10.2**
  
  - [ ]* 2.5 Write unit tests for GitHub provider
    - Test pagination with multiple pages (100+ repos)
    - Test API error responses (401, 429, 500)
    - Test empty repository lists
    - Test pull request fetching with different states
    - _Requirements: 2.1, 2.2, 2.4, 2.5_

- [ ] 3. Implement GitLab provider adapter
  - [ ] 3.1 Create GitLab provider implementation
    - Create `src/lib/providers/gitlab.ts` with `GitLabProvider` class implementing `GitProvider` interface
    - Implement `fetchRepositories()` using GitLab API v4 with pagination
    - Implement `fetchReviewItems()` and `fetchReviewItem()` methods
    - Implement `fetchUser()` method
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.6_
  
  - [ ] 3.2 Add GitLab data normalization methods
    - Implement private `normalizeRepository()` method to convert `GitLabProject` to `NormalizedRepository`
    - Implement private `normalizeReviewItem()` method to convert `GitLabMergeRequest` to `NormalizedReviewItem`
    - Implement `mapStateToGitLab()` helper to convert common states to GitLab-specific states
    - Handle GitLab-specific terminology (IID, merge request, work_in_progress)
    - _Requirements: 1.5, 3.3, 3.7_
  
  - [ ]* 3.3 Write property test for GitLab normalization
    - **Property 2: Provider Normalization Completeness**
    - **Validates: Requirements 1.5, 3.3, 3.7**
  
  - [ ]* 3.4 Write property test for GitLab error handling
    - **Property 3: Provider Error Context**
    - **Validates: Requirements 3.5, 10.1, 10.2**
  
  - [ ]* 3.5 Write unit tests for GitLab provider
    - Test pagination with multiple pages
    - Test API error responses
    - Test merge request state mapping
    - Test project path encoding
    - _Requirements: 3.1, 3.2, 3.4, 3.5_

- [ ] 4. Update database schema and create migration
  - [ ] 4.1 Update Prisma schema
    - Add `ProviderType` enum with values GITHUB and GITLAB
    - Add `provider` field to `Repository` model with default GITHUB
    - Rename `githubId` field to `externalId` in `Repository` model
    - Update unique constraint to `@@unique([externalId, provider])`
    - Add `@@index([provider])` for query performance
    - _Requirements: 4.1, 4.2, 4.3, 4.5_
  
  - [ ] 4.2 Create and test database migration
    - Generate Prisma migration for schema changes
    - Verify migration creates enum, adds provider column, renames githubId, updates constraints
    - Test migration on a copy of production data structure
    - _Requirements: 4.4, 11.1, 11.2, 11.3, 11.4, 11.5_
  
  - [ ]* 4.3 Write property test for database unique constraint
    - **Property 4: Database Unique Constraint**
    - **Validates: Requirements 4.3**
  
  - [ ]* 4.4 Write property test for repository provider persistence
    - **Property 8: Repository Provider Persistence**
    - **Validates: Requirements 6.4**

- [ ] 5. Checkpoint - Verify core abstractions
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Create authentication manager for multi-provider tokens
  - [ ] 6.1 Create provider authentication utilities
    - Create `src/lib/providers/auth.ts` with `getProviderAccessToken()` function
    - Implement `requireProviderAccessToken()` function that throws descriptive errors
    - Query Account table using both userId and providerId (lowercase provider name)
    - _Requirements: 5.1, 5.2, 5.3, 5.5_
  
  - [ ]* 6.2 Write property test for multiple provider accounts
    - **Property 5: Multiple Provider Accounts Per User**
    - **Validates: Requirements 4.6, 5.1, 5.4**
  
  - [ ]* 6.3 Write property test for missing token errors
    - **Property 6: Missing Token Error Specificity**
    - **Validates: Requirements 5.5**
  
  - [ ]* 6.4 Write unit tests for authentication manager
    - Test token retrieval for different providers
    - Test missing token error messages
    - Test multiple accounts per user
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 7. Update tRPC repository router
  - [ ] 7.1 Update fetchFromGithub endpoint to fetchFromProvider
    - Rename `fetchFromGithub` to `fetchFromProvider` in `src/server/routers/repository.ts`
    - Add provider parameter with Zod validation: `z.enum(["GITHUB", "GITLAB"])`
    - Use `ProviderFactory.isSupported()` for validation
    - Use `requireProviderAccessToken()` to get token for specified provider
    - Use `ProviderFactory.create()` to instantiate correct provider
    - Call provider's `fetchRepositories()` method
    - _Requirements: 6.1, 6.2, 7.1, 7.2, 7.3, 7.5_
  
  - [ ] 7.2 Update connect endpoint for multi-provider support
    - Update `connectRepositorySchema` to include provider field
    - Modify upsert logic to use `externalId_provider` composite unique key
    - Store provider type with repository data
    - _Requirements: 6.3, 6.4, 7.6_
  
  - [ ] 7.3 Add error handling for unsupported providers
    - Return TRPCError with BAD_REQUEST code for invalid providers
    - Include list of supported providers in error message
    - Handle ProviderError instances from provider adapters
    - Map rate limit and unauthorized errors to appropriate TRPC codes
    - _Requirements: 7.4, 10.3, 10.4, 10.5_
  
  - [ ]* 7.4 Write property test for provider adapter selection
    - **Property 7: Correct Provider Adapter Selection**
    - **Validates: Requirements 6.2, 7.5, 9.2**
  
  - [ ]* 7.5 Write property test for provider parameter validation
    - **Property 11: Provider Parameter Validation**
    - **Validates: Requirements 7.3, 7.4, 10.3, 10.4**
  
  - [ ]* 7.6 Write property test for unsupported provider errors
    - **Property 12: Unsupported Provider Error Lists Alternatives**
    - **Validates: Requirements 10.3**
  
  - [ ]* 7.7 Write unit tests for repository router
    - Test fetchFromProvider with both GitHub and GitLab
    - Test connect endpoint with provider parameter
    - Test error handling for invalid providers
    - Test authentication errors
    - _Requirements: 6.1, 6.2, 7.1, 7.2, 7.3, 7.4_

- [ ] 8. Update repository listing and management
  - [ ] 8.1 Update getRepos endpoint
    - Ensure query returns repositories from all providers
    - Verify provider field is included in response
    - _Requirements: 6.5, 6.6_
  
  - [ ]* 8.2 Write property test for cross-provider repository listing
    - **Property 9: Cross-Provider Repository Listing**
    - **Validates: Requirements 6.5**
  
  - [ ]* 8.3 Write unit tests for repository listing
    - Test listing repositories from multiple providers
    - Test empty repository list
    - Test provider field presence in response
    - _Requirements: 6.5, 6.6_

- [ ] 9. Checkpoint - Verify backend implementation
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 10. Create frontend provider selector component
  - [ ] 10.1 Create ProviderSelector component
    - Create reusable provider selector component with GitHub and GitLab options
    - Use shadcn/ui Select component
    - Include provider icons/badges
    - Accept value and onChange props
    - _Requirements: 8.1, 8.2_
  
  - [ ] 10.2 Create ProviderBadge component
    - Create component to display provider-specific icons or badges
    - Support both GITHUB and GITLAB provider types
    - _Requirements: 8.3_
  
  - [ ]* 10.3 Write unit tests for provider selector
    - Test provider selection triggers onChange
    - Test both providers are displayed
    - _Requirements: 8.1, 8.2_

- [ ] 11. Update repository UI components
  - [ ] 11.1 Update repository connection flow
    - Add ProviderSelector to repository connection UI
    - Pass selected provider to fetchFromProvider API call
    - Include provider in connect mutation payload
    - _Requirements: 8.2, 8.5_
  
  - [ ] 11.2 Update repository list display
    - Add ProviderBadge to each repository card
    - Display provider information alongside repository details
    - Update repository links to use provider-specific URLs
    - _Requirements: 8.3, 8.4, 6.6_
  
  - [ ]* 11.3 Write property test for provider selection triggering fetch
    - **Property 13: Provider Selection Triggers Correct Fetch**
    - **Validates: Requirements 8.2, 8.5**
  
  - [ ]* 11.4 Write property test for provider information display
    - **Property 10: Provider Information Display**
    - **Validates: Requirements 6.6, 8.3, 9.5**
  
  - [ ]* 11.5 Write unit tests for repository UI
    - Test provider selector integration
    - Test repository card displays provider badge
    - Test filtering/grouping by provider
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 12. Update review system for multi-provider support
  - [ ] 12.1 Update review fetching logic
    - Identify provider from repository record when fetching reviews
    - Use ProviderFactory to create appropriate adapter based on repository provider
    - Fetch review items using provider-specific adapter
    - _Requirements: 9.1, 9.2_
  
  - [ ] 12.2 Normalize review data storage
    - Ensure Review model stores provider-agnostic data
    - Store prNumber field for both PRs and MRs
    - Store provider-specific URLs in prUrl field
    - _Requirements: 9.3, 9.4_
  
  - [ ] 12.3 Update review display components
    - Show provider-specific links to original PR/MR
    - Display provider context in review UI
    - _Requirements: 9.5_
  
  - [ ]* 12.4 Write property test for review system provider routing
    - **Property 14: Review System Provider Routing**
    - **Validates: Requirements 9.1, 9.2**
  
  - [ ]* 12.5 Write property test for review data provider agnostic
    - **Property 15: Review Data Provider Agnostic**
    - **Validates: Requirements 9.3, 9.4**
  
  - [ ]* 12.6 Write unit tests for review system
    - Test review fetching with GitHub repositories
    - Test review fetching with GitLab repositories
    - Test review data normalization
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 13. Update code organization and cleanup
  - [ ] 13.1 Organize provider files
    - Ensure all provider code is in `src/lib/providers/` directory
    - Verify separation: types.ts, errors.ts, factory.ts, github.ts, gitlab.ts, auth.ts
    - _Requirements: 12.1, 12.2, 12.3, 12.4_
  
  - [ ] 13.2 Update import paths throughout codebase
    - Update all imports referencing old `src/lib/github.ts` to use new provider structure
    - Update router imports to use provider factory and auth utilities
    - Update frontend imports for new provider utilities
    - _Requirements: 12.5_
  
  - [ ] 13.3 Remove or deprecate old GitHub-specific code
    - Mark old `src/lib/github.ts` functions as deprecated or remove if fully migrated
    - Ensure no remaining direct references to GitHub-specific implementations outside provider adapters
    - _Requirements: 1.4, 12.5_

- [ ] 14. Final integration and testing
  - [ ] 14.1 Run full test suite
    - Execute all property-based tests (15 properties)
    - Execute all unit tests
    - Verify test coverage meets goals (80% line coverage, 75% branch coverage)
    - _Requirements: All_
  
  - [ ]* 14.2 Write integration tests
    - Test end-to-end flow: connect GitHub repository, fetch PRs, create review
    - Test end-to-end flow: connect GitLab repository, fetch MRs, create review
    - Test switching between providers in UI
    - _Requirements: All_
  
  - [ ] 14.3 Manual testing checklist
    - Verify existing GitHub repositories still work after migration
    - Test connecting new GitHub repository
    - Test connecting new GitLab repository
    - Test viewing repositories from both providers
    - Test creating reviews for both GitHub PRs and GitLab MRs
    - Verify error messages are clear and provider-specific

- [ ] 15. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties using fast-check with minimum 100 iterations
- Unit tests validate specific examples, edge cases, and error conditions
- The implementation follows an incremental approach: abstraction → GitHub refactor → GitLab addition → database → API → frontend
- Database migration must be tested carefully to ensure backward compatibility with existing GitHub data
- All provider-specific code is isolated in the provider adapters, maintaining clean separation of concerns
