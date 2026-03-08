# Implementation Plan: Future-Proof Git Architecture

## Overview

This plan refactors the GitHub-only PR review application to use a provider abstraction architecture. The refactoring maintains GitHub as the only implemented provider while establishing an extensible function-based architecture. Key changes include: creating provider folder structure, defining provider-agnostic types, implementing abstraction layer functions, refactoring GitHub implementation, updating database schema (githubId → externalId + provider), and updating all dependent code (validators, routers, hooks).

## Tasks

- [x] 1. Create provider folder structure and type definitions
  - [x] 1.1 Create src/lib/providers/ directory and move github.ts
    - Create src/lib/providers/ directory
    - Move src/lib/github.ts to src/lib/providers/github.ts
    - Verify file moved successfully
    - _Requirements: 2.1, 2.2, 2.5_

  - [x] 1.2 Create provider-agnostic type definitions in types.ts
    - Create src/lib/providers/types.ts
    - Define Provider type as string literal "github"
    - Define Repository interface with externalId (string), name, fullName, private, htmlUrl, description, language, stars, updatedAt
    - Define PullRequest interface with externalId (string), number, title, state, htmlUrl, author, createdAt, updatedAt, mergedAt, draft, sourceBranch, targetBranch, additions, deletions, changedFiles
    - Define ProviderOperations interface with getAccessToken, fetchRepositories, fetchPullRequests function signatures
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 2. Refactor GitHub provider implementation
  - [x] 2.1 Update GitHub provider to export provider-agnostic types
    - Keep existing GitHubRepo and GitHubPullRequest interfaces for internal use
    - Import Repository and PullRequest types from types.ts
    - Update fetchGitHubRepos return type to Promise<Repository[]>
    - Update fetchPullRequests return type to Promise<PullRequest[]>
    - Update fetchPullRequest return type to Promise<PullRequest>
    - _Requirements: 5.2, 5.3, 5.4_

  - [x] 2.2 Implement type mapping functions in GitHub provider
    - Create mapGitHubRepoToRepository helper function
    - Map GitHub id (number) to externalId (string) using String(repo.id)
    - Map stargazers_count to stars
    - Map all other fields directly
    - Create mapGitHubPRToPullRequest helper function
    - Map GitHub id (number) to externalId (string) using String(pr.id)
    - Map head.ref to sourceBranch and base.ref to targetBranch
    - Map user to author with login and avatarUrl (from avatar_url)
    - Map changed_files to changedFiles
    - _Requirements: 5.4, 3.5_

  - [x] 2.3 Update GitHub functions to use type mapping
    - Update fetchGitHubRepos to map each repo using mapGitHubRepoToRepository
    - Update fetchPullRequests to map each PR using mapGitHubPRToPullRequest
    - Update fetchPullRequest to map the PR using mapGitHubPRToPullRequest
    - Maintain existing error handling and pagination logic
    - _Requirements: 5.2, 5.3, 5.5_

  - [x] 2.4 Write property test for GitHub type mapping
    - **Property 1: GitHub Type Mapping Preserves Structure**
    - **Validates: Requirements 3.5, 5.2, 5.3, 5.4**
    - Generate random GitHub API responses using fast-check
    - Map to provider-agnostic types
    - Verify all required fields present with correct types
    - Verify externalId is string representation of numeric GitHub id
    - Run 100+ iterations

- [x] 3. Create provider abstraction layer
  - [x] 3.1 Create provider abstraction functions in index.ts
    - Create src/lib/providers/index.ts
    - Import types from types.ts
    - Import GitHub functions from github.ts
    - Implement getProviderOperations function that returns ProviderOperations for "github"
    - Implement getAccessToken function that delegates to getGitHubAccessToken
    - Implement fetchRepositories function that delegates to fetchGitHubRepos
    - Implement fetchPullRequests function that delegates to GitHub fetchPullRequests
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

  - [x] 3.2 Write property test for provider operations delegation
    - **Property 5: Provider Operations Delegation**
    - **Validates: Requirements 4.2, 4.6**
    - Generate random operation calls (getAccessToken, fetchRepositories, fetchPullRequests)
    - Call through abstraction layer with provider "github"
    - Mock GitHub functions and verify they are called with correct parameters
    - Verify results match direct GitHub function calls
    - Run 100+ iterations

- [x] 4. Update database schema and create migration
  - [x] 4.1 Update Prisma schema for provider abstraction
    - Open prisma/schema.prisma
    - In Repository model, add externalId String field
    - In Repository model, add provider String field with @default("github")
    - In Repository model, add @@unique([externalId, provider]) constraint
    - In Repository model, remove @unique from githubId field (prepare for removal)
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [x] 4.2 Create and test database migration
    - Run `npx prisma migrate dev --name add-provider-abstraction` to generate migration
    - Review generated migration SQL
    - Verify migration adds externalId and provider columns
    - Verify migration copies githubId to externalId as string (CAST)
    - Verify migration sets provider to "github" for existing records
    - Verify migration creates composite unique index
    - Verify migration drops githubId column
    - Test migration on development database
    - _Requirements: 1.5, 9.1, 9.2, 9.3, 9.4, 9.5_

  - [x] 4.3 Write property test for migration data preservation
    - **Property 8: Migration Data Preservation**
    - **Validates: Requirements 1.5, 9.2, 9.3**
    - Generate random repository records with githubId values
    - Run migration on test database
    - Verify externalId equals string representation of githubId
    - Verify provider equals "github"
    - Verify all other fields unchanged
    - Run 100+ iterations

  - [x] 4.4 Write property test for composite unique constraint
    - **Property 6: Composite Unique Constraint Enforcement**
    - **Validates: Requirements 1.3**
    - Generate repository pairs with same externalId, different providers
    - Verify both can be stored in database
    - Generate repository pairs with same externalId and same provider
    - Verify second insertion fails with unique constraint violation
    - Run 100+ iterations

  - [x] 4.5 Write property test for default provider assignment
    - **Property 7: Default Provider Assignment**
    - **Validates: Requirements 1.2**
    - Generate repositories without provider field
    - Create in database
    - Verify provider automatically set to "github"
    - Run 100+ iterations

- [ ] 5. Update validators for provider abstraction
  - [x] 5.1 Refactor connectRepositorySchema validator
    - Open src/lib/validators/repository.ts
    - In connectRepositorySchema, replace githubId field with externalId of type z.string()
    - In connectRepositorySchema, add provider field of type z.enum(["github"]).default("github")
    - Update ConnectRepositoryInput type to reflect schema changes
    - Verify disconnectRepositorySchema remains unchanged
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [x] 5.2 Write property test for validator string acceptance
    - **Property 9: Validator String Acceptance**
    - **Validates: Requirements 6.1, 6.5**
    - Generate valid repository data with string externalId values
    - Verify connectRepositorySchema accepts and validates successfully
    - Generate repository data with numeric externalId values
    - Verify connectRepositorySchema rejects with validation error
    - Run 100+ iterations

  - [x] 5.3 Write property test for provider default in validation
    - **Property 10: Provider Default in Validation**
    - **Validates: Requirements 6.2**
    - Generate repository data without provider field
    - Validate with connectRepositorySchema
    - Verify provider field set to "github" after validation
    - Run 100+ iterations

- [x] 6. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Update repository router for provider abstraction
  - [x] 7.1 Refactor fetchFromGithub to fetchFromProvider
    - Open src/server/routers/repository.ts
    - Import getAccessToken, fetchRepositories from src/lib/providers/index.ts
    - Rename fetchFromGithub endpoint to fetchFromProvider
    - Update implementation to call getAccessToken(ctx.user.id, "github")
    - Update implementation to call fetchRepositories(accessToken, "github")
    - Remove direct imports from src/lib/github.ts
    - _Requirements: 7.1, 7.2, 7.3, 7.6_

  - [x] 7.2 Update connect mutation for composite unique constraint
    - In connect mutation, update upsert where clause to use composite key
    - Change where clause to: { externalId_provider: { externalId: repo.externalId, provider: repo.provider } }
    - Update create and update objects to include externalId and provider fields
    - Remove githubId references
    - _Requirements: 7.4, 7.5_

  - [ ] 7.3 Write property test for router abstraction usage
    - **Property 11: Router Abstraction Usage**
    - **Validates: Requirements 7.2, 7.3, 7.6**
    - Mock provider abstraction layer functions
    - Call fetchFromProvider endpoint
    - Verify getAccessToken called with userId and "github"
    - Verify fetchRepositories called with accessToken and "github"
    - Verify no direct calls to GitHub-specific functions
    - Run 100+ iterations

  - [ ] 7.4 Write property test for upsert composite key usage
    - **Property 12: Upsert Composite Key Usage**
    - **Validates: Requirements 7.4, 7.5**
    - Generate repository data with various externalId and provider combinations
    - Call connect mutation
    - Verify upsert uses composite key {externalId, provider} in where clause
    - Verify same externalId can exist for different providers
    - Verify duplicates prevented for same provider
    - Run 100+ iterations

- [x] 8. Update React hooks for provider abstraction
  - [x] 8.1 Rename and refactor useFetchGithubRepos hook
    - Rename src/features/repository/hooks/use-fetch-github-repos.ts to use-fetch-provider-repos.ts
    - Rename useFetchGithubRepos function to useFetchProviderRepos
    - Update hook to call fetchFromProvider endpoint (renamed from fetchFromGithub)
    - Update error messages to use provider-agnostic language ("Failed to fetch repositories")
    - Export useFetchProviderRepos as the hook name
    - _Requirements: 8.1, 8.2, 8.3, 8.5_

  - [x] 8.2 Update useConnectRepos hook for new validator schema
    - Open src/features/repository/hooks/use-connect-repos.ts (or equivalent)
    - Verify hook works with updated connectRepositorySchema (externalId, provider fields)
    - Update any type references to use ConnectRepositoryInput with new fields
    - _Requirements: 8.4_

  - [x] 8.3 Update all import paths for renamed hook
    - Search for imports of useFetchGithubRepos across the codebase
    - Update imports to use useFetchProviderRepos from use-fetch-provider-repos.ts
    - Update any component usage of the hook
    - _Requirements: 8.1, 8.2_

- [x] 9. Update all import paths for provider folder structure
  - [x] 9.1 Update imports across codebase
    - Search for imports from src/lib/github.ts
    - Update router imports to use src/lib/providers/index.ts for abstraction functions
    - Update any remaining direct GitHub imports to use src/lib/providers/github.ts
    - Verify no broken imports remain
    - Run TypeScript compiler to check for errors
    - _Requirements: 2.5, 7.6, 10.1, 10.2, 10.3_

- [x] 10. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 11. Write comprehensive property-based tests
  - [ ] 11.1 Write property test for error handling resilience
    - **Property 2: Error Handling Resilience**
    - **Validates: Requirements 5.5**
    - Generate random error conditions (network failures, auth errors, rate limits)
    - Call provider functions with mocked errors
    - Verify graceful error handling (no crashes)
    - Verify appropriate error responses or empty arrays returned
    - Run 100+ iterations

  - [ ] 11.2 Write property test for pagination completeness
    - **Property 3: Pagination Completeness**
    - **Validates: Requirements 5.5**
    - Mock GitHub API with >100 repositories across multiple pages
    - Call fetchGitHubRepos
    - Verify all pages fetched and all repositories returned
    - Verify pagination continues until page has <100 items
    - Run 100+ iterations

  - [ ] 11.3 Write property test for backward compatibility
    - **Property 4: Backward Compatibility Preservation**
    - **Validates: Requirements 2.5, 11.1, 11.2, 11.3, 11.4**
    - Generate pre-migration repository data with githubId
    - Run migration
    - Test repository display operations
    - Test fetch pull requests operations
    - Test disconnect operations
    - Verify all operations work correctly with migrated data
    - Run 100+ iterations

- [ ] 12. Write unit tests for edge cases and specific scenarios
  - [ ] 12.1 Write unit tests for GitHub provider
    - Test fetchGitHubRepos with empty repository list
    - Test fetchGitHubRepos with repositories containing null fields
    - Test fetchPullRequests with various state filters
    - Test error handling for invalid access tokens
    - Test error handling for network timeouts
    - Test type mapping with edge case values (very long names, special characters)
    - _Requirements: 5.2, 5.3, 5.4, 5.5_

  - [ ] 12.2 Write unit tests for provider abstraction layer
    - Test getProviderOperations returns correct operations for "github"
    - Test getAccessToken with missing token
    - Test fetchRepositories with invalid provider
    - Test function delegation to GitHub provider
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [ ] 12.3 Write unit tests for validators
    - Test connectRepositorySchema with valid string externalId
    - Test connectRepositorySchema rejects numeric externalId
    - Test provider default applied when not specified
    - Test validation error messages are clear
    - _Requirements: 6.1, 6.2, 6.5_

  - [ ] 12.4 Write unit tests for router
    - Test fetchFromProvider with valid access token
    - Test fetchFromProvider throws UNAUTHORIZED when no token
    - Test connect mutation with composite unique constraint
    - Test connect mutation upsert behavior
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [ ] 12.5 Write unit tests for database operations
    - Test repository creation with default provider
    - Test composite unique constraint allows same externalId for different providers
    - Test composite unique constraint prevents duplicate (externalId, provider) pairs
    - Test migration preserves existing data
    - _Requirements: 1.2, 1.3, 1.5, 9.2, 9.3_

- [ ] 13. Final verification and cleanup
  - [x] 13.1 Run full TypeScript compilation
    - Run `npx tsc --noEmit` to check for type errors
    - Fix any remaining type errors
    - Verify zero TypeScript errors
    - _Requirements: 10.3_

  - [ ] 13.2 Verify backward compatibility with manual testing
    - Start application and verify existing repositories display correctly
    - Test fetching pull requests for existing repositories
    - Test disconnecting existing repositories
    - Verify no user-facing breaking changes
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

  - [ ] 13.3 Final checkpoint - Ensure all tests pass
    - Run all unit tests
    - Run all property-based tests
    - Verify 100% pass rate
    - Ask user if any questions or issues arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property-based tests use fast-check with 100+ iterations
- GitHub is the only provider implementation (no GitLab/Bitbucket)
- Function-based approach used throughout (no classes)
- Focus is on refactoring and reorganizing existing code with abstraction
- Migration must preserve all existing user data
- Composite unique constraint (externalId, provider) is critical for multi-provider support
