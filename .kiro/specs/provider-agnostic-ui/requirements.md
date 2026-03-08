# Requirements Document

## Introduction

This feature refactors the UI layer to be provider-agnostic, removing hardcoded GitHub-specific references from components, strings, variable names, and interfaces. The refactoring enables future support for multiple Git providers (GitHub, GitLab, Bitbucket, etc.) while maintaining backward compatibility with the current GitHub implementation.

## Glossary

- **UI_Component**: React components that render user interface elements
- **Provider**: A Git hosting service (GitHub, GitLab, Bitbucket, etc.)
- **Provider_Parameter**: A configuration value that specifies which Git provider is being used
- **Dynamic_String**: Text content that changes based on the active provider
- **Provider_Icon**: A visual symbol representing a specific Git provider
- **Legacy_Component**: Existing GitHub-specific UI components that need refactoring
- **Connect_Component**: The UI component responsible for linking a user's Git provider account
- **Repository_List_Component**: The UI component that displays available and connected repositories
- **Repository_Card_Component**: The UI component that displays individual repository information
- **Interface_Definition**: TypeScript type definitions for component props and data structures
- **Variable_Name**: Identifiers used in code for state, props, and data

## Requirements

### Requirement 1: Provider-Agnostic Component Naming

**User Story:** As a developer, I want component names to be provider-agnostic, so that the codebase can support multiple Git providers without confusion.

#### Acceptance Criteria

1. THE UI_Component SHALL use provider-agnostic names that do not reference specific providers
2. WHEN renaming ConnectGithub component, THE UI_Component SHALL be named ConnectProvider
3. THE Interface_Definition ConnectGithubProps SHALL be renamed to ConnectProviderProps
4. THE Interface_Definition ConnectedGithubRepo SHALL be renamed to ConnectedProviderRepo

### Requirement 2: Dynamic Provider Strings

**User Story:** As a user, I want to see the correct provider name in UI messages, so that the interface accurately reflects which service I'm connecting to.

#### Acceptance Criteria

1. THE Connect_Component SHALL accept a provider parameter to determine which provider name to display
2. WHEN rendering connection messages, THE Connect_Component SHALL display dynamic strings based on the provider parameter
3. THE Connect_Component SHALL replace "Github account not connected" with a dynamic message using the provider name
4. THE Connect_Component SHALL replace "Connect your Github account" with a dynamic message using the provider name
5. THE Connect_Component SHALL replace "Connect GitHub" button text with dynamic text using the provider name
6. THE Connect_Component SHALL replace "Failed to connect GitHub" error message with a dynamic message using the provider name
7. THE Repository_List_Component SHALL replace "Github Repositories" heading with a dynamic heading using the provider name

### Requirement 3: Provider-Agnostic Variable Names

**User Story:** As a developer, I want variable names to be provider-agnostic, so that the code is maintainable and extensible for multiple providers.

#### Acceptance Criteria

1. THE Repository_List_Component SHALL rename showGithubRepos to showProviderRepos
2. THE Repository_List_Component SHALL rename isFetchingGithubRepos to isFetchingProviderRepos
3. THE Repository_List_Component SHALL rename isLoadingGithubRepos to isLoadingProviderRepos
4. THE Repository_List_Component SHALL rename githubReposError to providerReposError
5. THE Repository_List_Component SHALL rename githubRepos to providerRepos

### Requirement 4: Dynamic Provider Icons

**User Story:** As a user, I want to see the correct provider icon in the UI, so that I can visually identify which service I'm working with.

#### Acceptance Criteria

1. THE Connect_Component SHALL accept a provider parameter to determine which icon to display
2. WHEN rendering provider icons, THE Connect_Component SHALL dynamically select the Provider_Icon based on the provider parameter
3. THE Connect_Component SHALL support FaGithub icon for GitHub provider
4. THE Connect_Component SHALL support FaGitlab icon for GitLab provider
5. THE Connect_Component SHALL support FaBitbucket icon for Bitbucket provider
6. WHEN an unsupported provider is specified, THE Connect_Component SHALL display a default Git icon

### Requirement 5: Backward Compatibility

**User Story:** As a developer, I want the refactored components to maintain backward compatibility, so that existing functionality continues to work without breaking changes.

#### Acceptance Criteria

1. THE Connect_Component SHALL default to GitHub provider when no provider parameter is specified
2. THE Repository_List_Component SHALL continue to function with existing API calls without modification
3. WHEN provider parameter is omitted, THE UI_Component SHALL display GitHub-specific strings and icons
4. THE Connect_Component SHALL maintain the same prop interface for title and description overrides

### Requirement 6: Component Props Interface

**User Story:** As a developer, I want components to accept provider configuration through props, so that I can specify which provider to use declaratively.

#### Acceptance Criteria

1. THE ConnectProviderProps interface SHALL include an optional provider field of type string
2. THE ConnectProviderProps interface SHALL include an optional title field for custom messaging
3. THE ConnectProviderProps interface SHALL include an optional description field for custom messaging
4. THE ConnectProviderProps interface SHALL include an optional className field for styling
5. WHEN provider prop is provided, THE Connect_Component SHALL use it to determine strings and icons
6. WHEN title or description props are provided, THE Connect_Component SHALL use them instead of dynamic defaults

### Requirement 7: File Renaming

**User Story:** As a developer, I want file names to reflect their provider-agnostic purpose, so that the codebase structure is clear and maintainable.

#### Acceptance Criteria

1. THE Legacy_Component file connect-github.tsx SHALL be renamed to connect-provider.tsx
2. WHEN renaming files, THE UI_Component SHALL update all import statements in dependent files
3. THE Repository_List_Component SHALL update its import statement to reference connect-provider
4. THE Repository_Card_Component SHALL update the ConnectedGithubRepo interface reference to ConnectedProviderRepo

### Requirement 8: Provider Name Formatting

**User Story:** As a user, I want provider names to be displayed with proper capitalization, so that the UI appears professional and polished.

#### Acceptance Criteria

1. THE Connect_Component SHALL format provider names with proper capitalization in UI strings
2. WHEN provider is "github", THE Connect_Component SHALL display "GitHub" in messages
3. WHEN provider is "gitlab", THE Connect_Component SHALL display "GitLab" in messages
4. WHEN provider is "bitbucket", THE Connect_Component SHALL display "Bitbucket" in messages
5. THE Connect_Component SHALL implement a helper function to map provider identifiers to display names
