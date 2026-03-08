# Implementation Plan: Provider-Agnostic UI

## Overview

This implementation refactors the UI layer to remove hardcoded GitHub-specific references, enabling support for multiple Git providers. The work involves creating helper functions for provider mapping, refactoring the ConnectGithub component to ConnectProvider, updating interfaces, renaming variables in RepositoryList, and updating all import statements. The implementation maintains backward compatibility by defaulting to GitHub when no provider is specified.

## Tasks

- [x] 1. Create provider utility helper functions
  - Create `src/lib/provider-utils.ts` file
  - Implement `getProviderDisplayName` function with mapping for github, gitlab, bitbucket
  - Implement `getProviderIcon` function with icon mapping using react-icons
  - Add proper TypeScript types and JSDoc comments
  - _Requirements: 8.5, 8.2, 8.3, 8.4_

- [ ]* 1.1 Write unit tests for provider utility functions
  - Test `getProviderDisplayName` for known providers (github, gitlab, bitbucket)
  - Test `getProviderDisplayName` fallback for unknown providers
  - Test `getProviderIcon` for known providers
  - Test `getProviderIcon` fallback to FaGit for unknown providers
  - _Requirements: 8.5_

- [x] 2. Refactor ConnectGithub component to ConnectProvider
  - [x] 2.1 Rename file from `connect-github.tsx` to `connect-provider.tsx`
    - Rename the component file
    - _Requirements: 7.1_
  
  - [x] 2.2 Update component interface and implementation
    - Rename `ConnectGithubProps` interface to `ConnectProviderProps`
    - Add optional `provider` prop with default value "github"
    - Import helper functions from `provider-utils.ts`
    - Replace hardcoded "GitHub" strings with dynamic `getProviderDisplayName(provider)` calls
    - Replace hardcoded FaGithub icon with dynamic `getProviderIcon(provider)` call
    - Update all string templates: title, description, button text, error messages
    - _Requirements: 1.2, 1.3, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 4.1, 4.2, 5.1, 6.1, 6.5_
  
  - [ ]* 2.3 Write property test for dynamic string generation
    - **Property 1: Dynamic String Generation**
    - **Validates: Requirements 2.1, 2.2**
    - Test that all displayed strings contain the properly formatted provider display name
    - Use @fast-check/vitest with providers: github, gitlab, bitbucket, custom
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_
  
  - [ ]* 2.4 Write property test for dynamic icon selection
    - **Property 2: Dynamic Icon Selection**
    - **Validates: Requirements 4.1, 4.2**
    - Test that supported providers render their corresponding icon component
    - Use @fast-check/vitest with providers: github, gitlab, bitbucket
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_
  
  - [ ]* 2.5 Write property test for custom override precedence
    - **Property 4: Custom Override Precedence**
    - **Validates: Requirements 5.4, 6.6**
    - Test that custom title/description props override dynamic defaults
    - Use @fast-check/vitest with various provider and custom prop combinations
    - _Requirements: 5.4, 6.2, 6.3, 6.6_
  
  - [ ]* 2.6 Write unit tests for ConnectProvider component
    - Test rendering with default GitHub provider
    - Test rendering with GitLab provider and correct icon
    - Test rendering with Bitbucket provider and correct icon
    - Test fallback to generic icon for unknown provider
    - Test custom title override
    - Test custom description override
    - Test error message includes provider name
    - _Requirements: 1.2, 2.1, 4.1, 5.1, 5.3, 6.2, 6.3, 6.6_

- [x] 3. Update ConnectedGithubRepo interface
  - Open `src/features/repository/components/repository-connected-card.tsx`
  - Rename `ConnectedGithubRepo` interface to `ConnectedProviderRepo`
  - Verify all interface fields remain unchanged (id, createdAt, updatedAt, userId, name, externalId, provider, fullName, private, htmlUrl)
  - _Requirements: 1.4_

- [x] 4. Refactor RepositoryList component
  - [x] 4.1 Update imports and variable names
    - Update import from `connect-github` to `connect-provider`
    - Update import from `ConnectGithub` to `ConnectProvider`
    - Rename `showGithubRepos` to `showProviderRepos`
    - Rename `isFetchingGithubRepos` to `isFetchingProviderRepos`
    - Rename `isLoadingGithubRepos` to `isLoadingProviderRepos`
    - Rename `githubReposError` to `providerReposError`
    - Rename `githubRepos` to `providerRepos`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 7.2, 7.3_
  
  - [x] 4.2 Update UI strings to be dynamic
    - Replace "Github Repositories" heading with dynamic string using provider name
    - Update ConnectProvider component usage to pass provider prop (default to "github")
    - _Requirements: 2.7, 5.1, 5.3_
  
  - [ ]* 4.3 Write unit tests for RepositoryList updates
    - Test that ConnectProvider is imported correctly
    - Test that provider prop is passed to ConnectProvider
    - Test that all renamed variables are used correctly
    - Test that heading displays dynamic provider name
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 7.3_

- [x] 5. Update all import statements across codebase
  - Search for all files importing from `connect-github` or using `ConnectedGithubRepo`
  - Update import paths to `connect-provider`
  - Update interface references to `ConnectedProviderRepo`
  - Verify no broken imports remain
  - _Requirements: 7.2, 7.4_

- [x] 6. Checkpoint - Verify compilation and backward compatibility
  - Run TypeScript compilation to ensure no type errors
  - Verify all tests pass
  - Test that default behavior (no provider prop) shows GitHub strings and icons
  - Ensure all tests pass, ask the user if questions arise.
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ]* 7. Write property test for provider name formatting
  - **Property 3: Provider Name Formatting**
  - **Validates: Requirements 8.1**
  - Test that getProviderDisplayName returns properly capitalized strings
  - Use @fast-check/vitest with various provider identifier strings
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 8. Final integration and validation
  - Run full test suite (unit tests and property-based tests)
  - Verify TypeScript compilation succeeds with no errors
  - Test ConnectProvider with github, gitlab, and bitbucket providers
  - Verify backward compatibility: component works without provider prop
  - Ensure all tests pass, ask the user if questions arise.
  - _Requirements: 1.1, 5.1, 5.2, 5.3, 5.4_

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- The implementation uses TypeScript and React as specified in the design
- Backward compatibility is maintained by defaulting provider to "github"
- Property-based tests use @fast-check/vitest with minimum 100 iterations
- Helper functions provide extensibility for adding new providers in the future
