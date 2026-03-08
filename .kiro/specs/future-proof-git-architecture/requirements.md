# Requirements Document

## Introduction

This document specifies requirements for refactoring the current GitHub-only PR review application to use a future-proof provider abstraction architecture. The refactoring will maintain GitHub as the only implemented provider while establishing an extensible architecture that allows adding GitLab, Bitbucket, or other Git providers in the future without breaking changes.

The current implementation has GitHub-specific naming and structure throughout the codebase (githubId, GitHub-specific functions, direct GitHub API calls). This refactoring will introduce a provider abstraction layer using a function-based approach with proper folder organization, making the codebase provider-agnostic while keeping GitHub as the sole implementation.

## Glossary

- **Provider**: A Git hosting service (GitHub, GitLab, Bitbucket, etc.)
- **Repository_Model**: The Prisma database model representing a connected repository
- **Provider_Abstraction**: The interface layer that defines provider-agnostic operations
- **External_ID**: The unique identifier assigned by the provider to a repository
- **Repository_Service**: Functions that perform repository operations using the provider abstraction
- **GitHub_Provider**: The GitHub-specific implementation of provider operations
- **Validator**: Zod schema for input validation
- **Router**: tRPC router handling API endpoints
- **Hook**: React Query hook for data fetching and mutations

## Requirements

### Requirement 1: Database Schema Refactoring

**User Story:** As a developer, I want the database schema to support multiple providers, so that adding new Git providers doesn't require breaking schema changes.

#### Acceptance Criteria

1. THE Repository_Model SHALL replace the githubId field with an externalId field of type String
2. THE Repository_Model SHALL add a provider field of type String with default value "github"
3. THE Repository_Model SHALL define a composite unique constraint on externalId and provider fields using @@unique([externalId, provider])
4. THE Repository_Model SHALL remove the @unique constraint from the githubId field before replacement
5. WHEN the schema migration is applied, THE Database SHALL preserve existing GitHub repository data by converting githubId integers to externalId strings

### Requirement 2: Provider Folder Structure

**User Story:** As a developer, I want a clear folder structure for provider implementations, so that the codebase is organized and extensible.

#### Acceptance Criteria

1. THE Codebase SHALL create a src/lib/providers/ directory structure
2. THE Codebase SHALL move github.ts to src/lib/providers/github.ts
3. THE Codebase SHALL create src/lib/providers/types.ts for provider-agnostic type definitions
4. THE Codebase SHALL create src/lib/providers/index.ts for provider abstraction functions
5. THE Codebase SHALL maintain all existing GitHub functionality after the file reorganization

### Requirement 3: Provider-Agnostic Type Definitions

**User Story:** As a developer, I want provider-agnostic type definitions, so that the application code doesn't depend on provider-specific types.

#### Acceptance Criteria

1. THE types.ts file SHALL define a Repository interface with externalId, name, fullName, private, htmlUrl, description, language, stars, and updatedAt fields
2. THE types.ts file SHALL define a PullRequest interface with externalId, number, title, state, htmlUrl, author, createdAt, updatedAt, mergedAt, draft, sourceBranch, targetBranch, additions, deletions, and changedFiles fields
3. THE types.ts file SHALL define a Provider type as a string literal union containing "github"
4. THE types.ts file SHALL define a ProviderOperations interface specifying function signatures for getAccessToken, fetchRepositories, and fetchPullRequests
5. WHEN GitHub-specific types are needed internally, THE GitHub_Provider SHALL map between provider-agnostic types and GitHub API types

### Requirement 4: Provider Abstraction Layer

**User Story:** As a developer, I want a provider abstraction layer, so that application code can work with any provider without knowing implementation details.

#### Acceptance Criteria

1. THE index.ts file SHALL export a getProviderOperations function that accepts a Provider parameter and returns ProviderOperations
2. WHEN getProviderOperations is called with "github", THE Function SHALL return GitHub provider operations
3. THE index.ts file SHALL export a getAccessToken function that accepts userId and provider parameters
4. THE index.ts file SHALL export a fetchRepositories function that accepts accessToken and provider parameters
5. THE index.ts file SHALL export a fetchPullRequests function that accepts accessToken, owner, repo, provider, and optional state parameters
6. THE Abstraction_Layer SHALL use function composition to delegate to provider-specific implementations

### Requirement 5: GitHub Provider Implementation

**User Story:** As a developer, I want the GitHub provider implementation to work through the abstraction layer, so that it serves as a reference implementation for future providers.

#### Acceptance Criteria

1. THE GitHub_Provider SHALL export a getGitHubAccessToken function that queries accounts with providerId "github"
2. THE GitHub_Provider SHALL export a fetchGitHubRepos function that calls the GitHub API and returns Repository[] using provider-agnostic types
3. THE GitHub_Provider SHALL export a fetchGitHubPullRequests function that calls the GitHub API and returns PullRequest[] using provider-agnostic types
4. THE GitHub_Provider SHALL map GitHub API responses to provider-agnostic types with externalId set to the GitHub repository or PR id converted to string
5. THE GitHub_Provider SHALL maintain all existing error handling and pagination logic

### Requirement 6: Validator Refactoring

**User Story:** As a developer, I want validators to use provider-agnostic field names, so that validation logic works for any provider.

#### Acceptance Criteria

1. THE connectRepositorySchema SHALL replace githubId field with externalId of type z.string()
2. THE connectRepositorySchema SHALL add a provider field of type z.enum(["github"]) with default value "github"
3. THE ConnectRepositoryInput type SHALL reflect the updated schema with externalId and provider fields
4. THE disconnectRepositorySchema SHALL remain unchanged as it uses provider-agnostic id field
5. WHEN validation is performed, THE Validator SHALL accept string externalId values instead of numeric githubId values

### Requirement 7: Router Refactoring

**User Story:** As a developer, I want the repository router to use the provider abstraction, so that endpoints work independently of the provider implementation.

#### Acceptance Criteria

1. THE fetchFromGithub endpoint SHALL be renamed to fetchFromProvider
2. THE fetchFromProvider endpoint SHALL call getAccessToken with userId and "github" provider
3. THE fetchFromProvider endpoint SHALL call fetchRepositories with accessToken and "github" provider
4. THE connect mutation SHALL use externalId and provider fields when upserting repositories
5. THE connect mutation SHALL use composite unique constraint @@unique([externalId, provider]) in the upsert where clause
6. THE Router SHALL import provider functions from src/lib/providers/index.ts instead of src/lib/github.ts

### Requirement 8: Hook Refactoring

**User Story:** As a developer, I want React hooks to use provider-agnostic naming, so that hook names reflect their generic purpose.

#### Acceptance Criteria

1. THE use-fetch-github-repos.ts file SHALL be renamed to use-fetch-provider-repos.ts
2. THE useFetchGithubRepos hook SHALL be renamed to useFetchProviderRepos
3. THE useFetchProviderRepos hook SHALL call the renamed fetchFromProvider endpoint
4. THE useConnectRepos hook SHALL work with the updated validator schema containing externalId and provider fields
5. THE Hook error messages SHALL use provider-agnostic language instead of "GitHub repositories"

### Requirement 9: Migration Strategy

**User Story:** As a developer, I want a safe migration path, so that existing data is preserved during the refactoring.

#### Acceptance Criteria

1. THE Migration SHALL create externalId and provider columns before dropping githubId
2. THE Migration SHALL copy githubId values to externalId as strings using CAST or equivalent
3. THE Migration SHALL set provider to "github" for all existing records
4. THE Migration SHALL create the composite unique index on externalId and provider
5. THE Migration SHALL drop the githubId column only after data is successfully migrated

### Requirement 10: Type Safety Preservation

**User Story:** As a developer, I want TypeScript type safety maintained throughout the refactoring, so that type errors are caught at compile time.

#### Acceptance Criteria

1. WHEN provider-agnostic types are used, THE TypeScript_Compiler SHALL enforce correct field names and types
2. WHEN provider operations are called, THE TypeScript_Compiler SHALL enforce that required parameters are provided
3. THE Codebase SHALL have zero TypeScript errors after refactoring is complete
4. THE Codebase SHALL maintain strict type checking without using any or unknown types unnecessarily
5. WHEN externalId is used, THE TypeScript_Compiler SHALL enforce string type instead of number type

### Requirement 11: Backward Compatibility

**User Story:** As a user, I want my existing connected repositories to continue working, so that I don't need to reconnect them after the refactoring.

#### Acceptance Criteria

1. WHEN the application starts after migration, THE Application SHALL display all previously connected repositories
2. WHEN a user views pull requests for an existing repository, THE Application SHALL fetch and display them correctly
3. WHEN a user disconnects an existing repository, THE Application SHALL remove it from the database successfully
4. THE Application SHALL maintain all existing functionality for repository operations
5. THE Application SHALL not require users to re-authenticate or reconnect repositories

### Requirement 12: Function-Based Architecture

**User Story:** As a developer, I want a function-based architecture instead of classes, so that the code follows functional programming principles and is easier to test.

#### Acceptance Criteria

1. THE Provider_Abstraction SHALL use pure functions instead of class methods
2. THE Provider_Abstraction SHALL use function composition for combining operations
3. THE Provider_Abstraction SHALL avoid stateful objects and mutable state
4. THE GitHub_Provider SHALL implement all operations as exported functions
5. WHEN provider operations are tested, THE Tests SHALL mock functions instead of class instances
