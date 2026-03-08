# Requirements Document

## Introduction

This document specifies the requirements for refactoring the existing GitHub-only PR review application to support multiple Git providers (GitHub and GitLab). The system currently has GitHub-specific implementations tightly coupled throughout the codebase. This refactoring will introduce a provider-agnostic architecture that allows the application to work with both GitHub Pull Requests and GitLab Merge Requests, while maintaining extensibility for future providers.

## Glossary

- **Git_Provider**: An external service that hosts Git repositories (e.g., GitHub, GitLab)
- **Provider_Adapter**: An abstraction layer that implements provider-specific API calls
- **Repository_Manager**: The system component that manages repository connections
- **Review_System**: The system component that handles PR/MR review operations
- **Provider_Factory**: A component that creates appropriate provider adapters based on provider type
- **Database_Schema**: The Prisma schema defining data models
- **API_Router**: The tRPC router handling API endpoints
- **Authentication_Manager**: The system component managing OAuth tokens for different providers
- **Pull_Request**: GitHub's code review mechanism (abbreviated as PR)
- **Merge_Request**: GitLab's code review mechanism (abbreviated as MR)
- **Review_Item**: A generic term for either a Pull Request or Merge Request

## Requirements

### Requirement 1: Provider Abstraction Layer

**User Story:** As a developer, I want a provider-agnostic abstraction layer, so that the application can support multiple Git providers without code duplication.

#### Acceptance Criteria

1. THE Provider_Adapter SHALL define a common interface for all Git provider operations
2. THE Provider_Adapter SHALL include methods for fetching repositories, fetching review items, and retrieving user information
3. THE Provider_Factory SHALL create the appropriate provider adapter based on the provider type
4. WHEN a new provider is added, THE Provider_Adapter SHALL require only a new implementation without modifying existing code
5. THE Provider_Adapter SHALL normalize provider-specific data structures into common internal formats

### Requirement 2: GitHub Provider Implementation

**User Story:** As a user, I want to continue using GitHub PR reviews, so that existing functionality remains available after the refactoring.

#### Acceptance Criteria

1. THE GitHub_Provider_Adapter SHALL implement all methods defined in the Provider_Adapter interface
2. THE GitHub_Provider_Adapter SHALL fetch repositories using the GitHub REST API v3
3. THE GitHub_Provider_Adapter SHALL fetch pull requests with their metadata (number, title, state, author, timestamps, diff stats)
4. WHEN fetching GitHub data, THE GitHub_Provider_Adapter SHALL handle pagination for repositories with more than 100 items
5. WHEN API errors occur, THE GitHub_Provider_Adapter SHALL return descriptive error messages
6. THE GitHub_Provider_Adapter SHALL use OAuth access tokens for authentication

### Requirement 3: GitLab Provider Implementation

**User Story:** As a user, I want to review GitLab merge requests, so that I can use the application with my GitLab repositories.

#### Acceptance Criteria

1. THE GitLab_Provider_Adapter SHALL implement all methods defined in the Provider_Adapter interface
2. THE GitLab_Provider_Adapter SHALL fetch repositories using the GitLab REST API v4
3. THE GitLab_Provider_Adapter SHALL fetch merge requests with their metadata (IID, title, state, author, timestamps, diff stats)
4. WHEN fetching GitLab data, THE GitLab_Provider_Adapter SHALL handle pagination for repositories with more than 100 items
5. WHEN API errors occur, THE GitLab_Provider_Adapter SHALL return descriptive error messages
6. THE GitLab_Provider_Adapter SHALL use OAuth access tokens for authentication
7. THE GitLab_Provider_Adapter SHALL normalize GitLab-specific terminology (merge request, IID) to the common interface

### Requirement 4: Database Schema Extension

**User Story:** As a developer, I want the database to store provider-specific information, so that the system can manage repositories from multiple providers.

#### Acceptance Criteria

1. THE Database_Schema SHALL add a provider field to the Repository model to identify the Git provider
2. THE Database_Schema SHALL rename githubId to externalId to support multiple providers
3. THE Database_Schema SHALL add a unique constraint on the combination of externalId and provider
4. THE Database_Schema SHALL maintain backward compatibility with existing GitHub repository data
5. THE Database_Schema SHALL store provider type as an enum with values GITHUB and GITLAB
6. THE Account model SHALL support multiple provider accounts per user through the existing providerId field

### Requirement 5: Authentication Token Management

**User Story:** As a user, I want to authenticate with multiple Git providers, so that I can connect repositories from different services.

#### Acceptance Criteria

1. THE Authentication_Manager SHALL retrieve access tokens based on both userId and providerId
2. WHEN a user connects a GitHub account, THE Authentication_Manager SHALL store the token with providerId "github"
3. WHEN a user connects a GitLab account, THE Authentication_Manager SHALL store the token with providerId "gitlab"
4. THE Authentication_Manager SHALL support multiple OAuth providers simultaneously for the same user
5. WHEN an access token is missing, THE Authentication_Manager SHALL return a descriptive error indicating which provider requires authentication

### Requirement 6: Repository Management Refactoring

**User Story:** As a user, I want to connect repositories from different Git providers, so that I can manage all my repositories in one place.

#### Acceptance Criteria

1. THE Repository_Manager SHALL accept a provider parameter when fetching repositories
2. WHEN fetching repositories, THE Repository_Manager SHALL use the appropriate Provider_Adapter based on the provider parameter
3. THE Repository_Manager SHALL support connecting repositories from both GitHub and GitLab
4. WHEN connecting a repository, THE Repository_Manager SHALL store the provider type along with repository metadata
5. THE Repository_Manager SHALL list all connected repositories regardless of provider
6. WHEN displaying repositories, THE Repository_Manager SHALL indicate which provider each repository belongs to

### Requirement 7: API Router Updates

**User Story:** As a developer, I want provider-aware API endpoints, so that the frontend can request data from specific providers.

#### Acceptance Criteria

1. THE API_Router SHALL accept a provider parameter in the fetchFromGithub endpoint (to be renamed)
2. THE API_Router SHALL rename fetchFromGithub to fetchFromProvider for provider-agnostic naming
3. WHEN the fetchFromProvider endpoint is called, THE API_Router SHALL validate the provider parameter
4. THE API_Router SHALL return an error when an unsupported provider is specified
5. THE API_Router SHALL use the Provider_Factory to obtain the correct adapter for the requested provider
6. THE connect endpoint SHALL accept provider information in the repository data

### Requirement 8: Frontend Component Updates

**User Story:** As a user, I want to select which Git provider to connect, so that I can choose between GitHub and GitLab.

#### Acceptance Criteria

1. THE Repository_UI SHALL display a provider selector with options for GitHub and GitLab
2. WHEN a provider is selected, THE Repository_UI SHALL fetch repositories from that provider
3. THE Repository_UI SHALL display provider-specific icons or badges for each repository
4. THE Repository_UI SHALL show connected repositories grouped or filtered by provider
5. WHEN connecting repositories, THE Repository_UI SHALL include the selected provider in the request

### Requirement 9: Review System Provider Support

**User Story:** As a user, I want to review both GitHub PRs and GitLab MRs, so that I can use AI-powered reviews across providers.

#### Acceptance Criteria

1. THE Review_System SHALL identify the provider from the repository record
2. WHEN fetching review items, THE Review_System SHALL use the appropriate Provider_Adapter
3. THE Review_System SHALL normalize PR and MR data into a common Review_Item format
4. THE Review_System SHALL store provider-agnostic review data in the Review model
5. WHEN displaying reviews, THE Review_System SHALL show provider-specific links to the original PR/MR

### Requirement 10: Error Handling and Validation

**User Story:** As a user, I want clear error messages when provider operations fail, so that I can understand and resolve issues.

#### Acceptance Criteria

1. WHEN a provider API call fails, THE Provider_Adapter SHALL return a structured error with provider context
2. WHEN authentication fails, THE System SHALL indicate which provider requires re-authentication
3. WHEN an unsupported provider is requested, THE System SHALL return an error listing supported providers
4. THE System SHALL validate provider parameters before making external API calls
5. WHEN rate limits are exceeded, THE System SHALL return an error indicating the provider and retry time

### Requirement 11: Migration Strategy

**User Story:** As a developer, I want a safe migration path for existing data, so that current GitHub repositories continue working after the refactoring.

#### Acceptance Criteria

1. THE Migration_Script SHALL add the provider field with default value "GITHUB" to existing Repository records
2. THE Migration_Script SHALL rename the githubId column to externalId
3. THE Migration_Script SHALL create the provider enum type before altering the Repository table
4. THE Migration_Script SHALL preserve all existing repository connections and relationships
5. WHEN the migration completes, THE System SHALL verify that all existing repositories have provider set to GITHUB

### Requirement 12: Code Organization

**User Story:** As a developer, I want a clear folder structure for provider implementations, so that the codebase remains maintainable and extensible.

#### Acceptance Criteria

1. THE System SHALL organize provider adapters in a dedicated directory structure (e.g., src/lib/providers/)
2. THE System SHALL place the common Provider_Adapter interface in a shared location
3. THE System SHALL place provider-specific implementations in separate files (github.ts, gitlab.ts)
4. THE System SHALL place the Provider_Factory in a central location accessible to all features
5. THE System SHALL update import paths throughout the codebase to reference the new structure
