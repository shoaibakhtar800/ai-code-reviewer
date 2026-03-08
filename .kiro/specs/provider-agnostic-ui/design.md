# Design Document: Provider-Agnostic UI

## Overview

This design refactors the UI layer to remove hardcoded GitHub-specific references, enabling support for multiple Git providers (GitHub, GitLab, Bitbucket, etc.) while maintaining backward compatibility. The refactoring focuses on component naming, dynamic string generation, provider icon mapping, and variable renaming across the repository management interface.

The design builds on the existing provider abstraction architecture where the backend already supports multiple providers through a `provider` field in the database schema. This refactoring brings the UI layer into alignment with that architecture.

### Key Design Goals

1. **Provider Agnosticism**: Remove all hardcoded provider references from component names, variables, and interfaces
2. **Dynamic Content**: Generate UI strings and icons based on a provider parameter
3. **Backward Compatibility**: Default to GitHub when no provider is specified
4. **Maintainability**: Create clear patterns for adding new providers in the future
5. **Minimal Changes**: Refactor only the UI layer without modifying backend APIs or data structures

## Architecture

### Component Hierarchy

```
RepositoryList (parent)
├── ConnectProvider (refactored from ConnectGithub)
│   ├── Provider icon (dynamic)
│   ├── Dynamic strings
│   └── Connection button
└── RepositoryConnectedCard
    └── Uses ConnectedProviderRepo interface
```

### Provider Configuration Flow

```
Component Props → Provider Parameter → Helper Functions → Dynamic Output
                                      ├── getProviderDisplayName()
                                      └── getProviderIcon()
```

The provider parameter flows from parent components down to child components, where helper functions transform it into display-ready content (formatted names and appropriate icons).

### Data Flow

1. **Component Instantiation**: Parent component passes `provider` prop (defaults to "github")
2. **String Generation**: Helper function maps provider ID to display name
3. **Icon Selection**: Helper function maps provider ID to React icon component
4. **Rendering**: Component renders with provider-specific content

## Components and Interfaces

### ConnectProvider Component

**File**: `src/components/connect-provider.tsx` (renamed from `connect-github.tsx`)

**Purpose**: Display a connection prompt for linking a Git provider account.

**Interface**:

```typescript
interface ConnectProviderProps {
  provider?: string;        // Provider identifier (default: "github")
  title?: string;          // Override default title
  description?: string;    // Override default description
  className?: string;      // Additional CSS classes
}
```

**Key Changes**:
- Renamed from `ConnectGithub` to `ConnectProvider`
- Added `provider` prop with default value "github"
- Dynamic string generation based on provider
- Dynamic icon selection based on provider
- Maintains override capability for title and description

**Dynamic String Examples**:
- Default title: `"{ProviderName} account not connected"`
- Default description: `"Connect your {ProviderName} account to view your repositories."`
- Button text: `"Connect {ProviderName}"`
- Error message: `"Failed to connect {ProviderName}"`

### ConnectedProviderRepo Interface

**File**: `src/features/repository/components/repository-connected-card.tsx`

**Purpose**: Type definition for connected repository data.

**Interface**:

```typescript
interface ConnectedProviderRepo {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  name: string;
  externalId: string;
  provider: string;
  fullName: string;
  private: boolean;
  htmlUrl: string;
}
```

**Key Changes**:
- Renamed from `ConnectedGithubRepo` to `ConnectedProviderRepo`
- No structural changes to fields
- Already contains `provider` field from backend schema

### RepositoryList Component

**File**: `src/features/repository/components/repository-list.tsx`

**Purpose**: Main component for managing repository connections.

**Variable Renaming**:

| Old Name | New Name |
|----------|----------|
| `showGithubRepos` | `showProviderRepos` |
| `isFetchingGithubRepos` | `isFetchingProviderRepos` |
| `isLoadingGithubRepos` | `isLoadingProviderRepos` |
| `githubReposError` | `providerReposError` |
| `githubRepos` | `providerRepos` |

**String Updates**:
- Heading: `"Github Repositories"` → `"{ProviderName} Repositories"`
- Description: `"Connect your Github account to view your repositories."` → `"Connect your {ProviderName} account to view your repositories."`

**Import Updates**:
```typescript
// Old
import { ConnectGithub } from "@/components/connect-github";

// New
import { ConnectProvider } from "@/components/connect-provider";
```

## Data Models

### Provider Configuration

The system uses a simple string-based provider identifier that maps to display names and icons:

```typescript
type ProviderId = "github" | "gitlab" | "bitbucket" | string;

type ProviderDisplayName = "GitHub" | "GitLab" | "Bitbucket";

type ProviderIconComponent = IconType; // from react-icons
```

### Provider Mapping

**Display Name Mapping**:
```typescript
const providerDisplayNames: Record<string, string> = {
  github: "GitHub",
  gitlab: "GitLab",
  bitbucket: "Bitbucket",
};
```

**Icon Mapping**:
```typescript
import { FaGithub, FaGitlab, FaBitbucket, FaGit } from "react-icons/fa";

const providerIcons: Record<string, IconType> = {
  github: FaGithub,
  gitlab: FaGitlab,
  bitbucket: FaBitbucket,
};
```

### Helper Functions

**getProviderDisplayName**:
```typescript
function getProviderDisplayName(provider: string = "github"): string {
  return providerDisplayNames[provider.toLowerCase()] || 
         provider.charAt(0).toUpperCase() + provider.slice(1);
}
```

**Purpose**: Convert provider ID to properly capitalized display name with fallback.

**getProviderIcon**:
```typescript
function getProviderIcon(provider: string = "github"): IconType {
  return providerIcons[provider.toLowerCase()] || FaGit;
}
```

**Purpose**: Map provider ID to appropriate icon component with fallback to generic Git icon.

## Correctness Properties


*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Dynamic String Generation

*For any* provider identifier, when the ConnectProvider component is rendered with that provider, all displayed strings (title, description, button text, error messages) should contain the properly formatted provider display name.

**Validates: Requirements 2.1, 2.2**

### Property 2: Dynamic Icon Selection

*For any* supported provider identifier (github, gitlab, bitbucket), when the ConnectProvider component is rendered with that provider, the component should display the corresponding provider-specific icon.

**Validates: Requirements 4.1, 4.2**

### Property 3: Provider Name Formatting

*For any* provider identifier string, the getProviderDisplayName helper function should return a string with proper capitalization (first letter uppercase, rest as defined in the mapping or title case for unknown providers).

**Validates: Requirements 8.1**

### Property 4: Custom Override Precedence

*For any* provider identifier, when the ConnectProvider component is rendered with custom title or description props, those custom values should be displayed instead of the dynamically generated defaults.

**Validates: Requirements 5.4, 6.6**

## Error Handling

### Provider Parameter Validation

**Invalid Provider Handling**:
- When an unsupported provider is specified, the system falls back to default behavior
- Display name: Uses title case of the provider string
- Icon: Uses generic Git icon (FaGit)
- No errors thrown; graceful degradation

**Missing Provider Handling**:
- When provider prop is omitted, defaults to "github"
- Maintains backward compatibility with existing implementations
- All GitHub-specific strings and icons are displayed

### Component Error States

**Connection Failures**:
- Error messages include provider name for context
- Format: `"Failed to connect {ProviderName}"`
- Error details from auth-client are preserved and displayed

**API Error Handling**:
- PRECONDITION_FAILED error code triggers ConnectProvider display
- Other errors show generic error message with details
- Error state doesn't break component rendering

### Type Safety

**TypeScript Validation**:
- All interfaces properly typed with optional fields
- Provider parameter typed as `string` for extensibility
- Icon components typed as `IconType` from react-icons
- No `any` types used

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests for comprehensive coverage:

**Unit Tests** focus on:
- Specific provider examples (GitHub, GitLab, Bitbucket)
- Edge cases (missing provider, unsupported provider)
- Component integration (imports, rendering)
- Error conditions (connection failures, API errors)

**Property-Based Tests** focus on:
- Universal properties across all provider values
- Dynamic string generation correctness
- Icon mapping consistency
- Override behavior validation

### Property-Based Testing Configuration

**Library**: `@fast-check/vitest` for TypeScript/React testing

**Configuration**:
- Minimum 100 iterations per property test
- Each test tagged with feature name and property reference
- Tag format: `// Feature: provider-agnostic-ui, Property {number}: {property_text}`

**Test Structure**:

```typescript
import { test } from 'vitest';
import fc from 'fast-check';

// Feature: provider-agnostic-ui, Property 1: Dynamic String Generation
test('ConnectProvider displays provider name in all strings', () => {
  fc.assert(
    fc.property(
      fc.constantFrom('github', 'gitlab', 'bitbucket', 'custom'),
      (provider) => {
        const { container } = render(<ConnectProvider provider={provider} />);
        const displayName = getProviderDisplayName(provider);
        const text = container.textContent;
        return text?.includes(displayName) ?? false;
      }
    ),
    { numRuns: 100 }
  );
});
```

### Unit Test Coverage

**ConnectProvider Component**:
- Renders with default GitHub provider
- Renders with GitLab provider and correct icon
- Renders with Bitbucket provider and correct icon
- Falls back to generic icon for unknown provider
- Uses custom title when provided
- Uses custom description when provided
- Displays error message with provider name on failure
- Handles connection state correctly

**Helper Functions**:
- `getProviderDisplayName("github")` returns "GitHub"
- `getProviderDisplayName("gitlab")` returns "GitLab"
- `getProviderDisplayName("bitbucket")` returns "Bitbucket"
- `getProviderDisplayName("unknown")` returns "Unknown"
- `getProviderIcon("github")` returns FaGithub
- `getProviderIcon("gitlab")` returns FaGitlab
- `getProviderIcon("bitbucket")` returns FaBitbucket
- `getProviderIcon("unknown")` returns FaGit

**RepositoryList Component**:
- Imports ConnectProvider correctly
- Passes provider prop to ConnectProvider
- Uses renamed variables throughout
- Displays dynamic heading with provider name

**Integration Tests**:
- ConnectProvider integrates with auth-client
- Error states trigger correct UI updates
- Connection success redirects properly

### Refactoring Validation

**Compilation Tests**:
- TypeScript compilation succeeds after refactoring
- No unused imports remain
- All interface references updated correctly

**Visual Regression Tests** (optional):
- Component appearance unchanged for GitHub provider
- Layout consistent across different providers

## Implementation Plan

### Phase 1: Helper Functions

1. Create `src/lib/provider-utils.ts` with helper functions
2. Implement `getProviderDisplayName` with mapping
3. Implement `getProviderIcon` with icon mapping
4. Write unit tests for helper functions

### Phase 2: Component Refactoring

1. Rename `connect-github.tsx` to `connect-provider.tsx`
2. Update `ConnectGithubProps` to `ConnectProviderProps`
3. Add `provider` prop with default value
4. Replace hardcoded strings with dynamic generation
5. Replace hardcoded icon with dynamic selection
6. Update component tests

### Phase 3: Interface Updates

1. Update `ConnectedGithubRepo` to `ConnectedProviderRepo` in `repository-connected-card.tsx`
2. Update all references to the interface
3. Verify TypeScript compilation

### Phase 4: RepositoryList Updates

1. Update import statement to use `ConnectProvider`
2. Rename all variables (showGithubRepos → showProviderRepos, etc.)
3. Update heading to use dynamic provider name
4. Update ConnectProvider usage with provider prop
5. Update component tests

### Phase 5: Testing

1. Write property-based tests for correctness properties
2. Write unit tests for specific examples and edge cases
3. Run full test suite
4. Verify backward compatibility with GitHub

### Phase 6: Documentation

1. Update component documentation
2. Add JSDoc comments to helper functions
3. Document provider extension process
4. Update README if applicable

## Migration Guide

### For Existing Code

**Before**:
```typescript
import { ConnectGithub } from "@/components/connect-github";

<ConnectGithub 
  title="Custom title"
  description="Custom description"
/>
```

**After**:
```typescript
import { ConnectProvider } from "@/components/connect-provider";

// Backward compatible (defaults to GitHub)
<ConnectProvider 
  title="Custom title"
  description="Custom description"
/>

// Or explicitly specify provider
<ConnectProvider 
  provider="github"
  title="Custom title"
  description="Custom description"
/>
```

### Adding New Providers

To add support for a new provider:

1. **Add display name mapping** in `provider-utils.ts`:
```typescript
const providerDisplayNames: Record<string, string> = {
  github: "GitHub",
  gitlab: "GitLab",
  bitbucket: "Bitbucket",
  gitea: "Gitea", // New provider
};
```

2. **Add icon mapping** in `provider-utils.ts`:
```typescript
import { FaGitea } from "react-icons/fa";

const providerIcons: Record<string, IconType> = {
  github: FaGithub,
  gitlab: FaGitlab,
  bitbucket: FaBitbucket,
  gitea: FaGitea, // New provider
};
```

3. **Use the provider** in components:
```typescript
<ConnectProvider provider="gitea" />
```

No other changes required—the system automatically handles the new provider.

## Future Enhancements

### Potential Improvements

1. **Provider-Specific Styling**: Different color schemes per provider
2. **Provider Capabilities**: Feature flags for provider-specific functionality
3. **Multi-Provider Support**: Connect multiple providers simultaneously
4. **Provider Status**: Display connection status for each provider
5. **Provider Switching**: UI for switching between connected providers

### Extensibility Points

- Helper functions designed for easy extension
- Icon mapping supports any react-icons icon
- Display name mapping supports any string format
- Component props allow full customization

## Dependencies

### New Dependencies

None—uses existing dependencies:
- `react-icons/fa` (already in use)
- `@fast-check/vitest` (for property-based testing)

### Modified Files

1. `src/components/connect-github.tsx` → `src/components/connect-provider.tsx`
2. `src/features/repository/components/repository-list.tsx`
3. `src/features/repository/components/repository-connected-card.tsx`
4. New: `src/lib/provider-utils.ts`

### Import Updates Required

All files importing `ConnectGithub` or `ConnectedGithubRepo` need updates:
- `src/features/repository/components/repository-list.tsx`
- Any other files discovered during implementation

## Risk Assessment

### Low Risk

- **Backward Compatibility**: Default behavior maintains GitHub functionality
- **Type Safety**: TypeScript catches interface mismatches
- **Isolated Changes**: UI-only refactoring, no backend changes

### Mitigation Strategies

- Comprehensive test coverage before deployment
- Gradual rollout with feature flag (optional)
- Monitor error rates after deployment
- Keep old component temporarily for rollback capability

## Success Criteria

1. All tests pass (unit and property-based)
2. TypeScript compilation succeeds with no errors
3. Existing GitHub functionality works identically
4. New providers can be added with minimal code changes
5. No visual regressions for GitHub provider
6. Code review approval from team
7. Documentation complete and accurate
