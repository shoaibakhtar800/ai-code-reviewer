# Design Document: Future-Proof Git Architecture

## Overview

This design refactors the current GitHub-only PR review application to use a provider abstraction architecture that is extensible for future Git hosting providers (GitLab, Bitbucket, etc.) while maintaining GitHub as the only implemented provider. The refactoring follows functional programming principles using pure functions instead of classes.

### Goals

1. Create a provider-agnostic architecture that supports multiple Git hosting providers
2. Maintain GitHub as the sole implementation without breaking existing functionality
3. Use function-based architecture following functional programming principles
4. Organize provider code in a clear folder structure (src/lib/providers/)
5. Ensure type safety throughout the refactoring
6. Preserve all existing user data during migration

### Non-Goals

1. Implementing GitLab, Bitbucket, or other providers (future work)
2. Changing the UI/UX of the application
3. Modifying authentication flows
4. Adding new features beyond the abstraction layer

### Key Design Decisions

1. **Function-based over class-based**: Use pure functions and function composition instead of classes for better testability and functional programming alignment
2. **String-based external IDs**: Convert numeric GitHub IDs to strings to support providers with non-numeric identifiers
3. **Composite unique constraint**: Use (externalId, provider) as the unique identifier to support the same repository ID across different providers
4. **Provider operations as records**: Define provider operations as objects containing functions rather than class instances
5. **Minimal breaking changes**: Maintain backward compatibility for existing users

## Architecture

### High-Level Architecture

The architecture introduces a three-layer approach:

```
Application Layer (Routers, Hooks, Components)
           ↓
Provider Abstraction Layer (src/lib/providers/index.ts)
           ↓
Provider Implementation Layer (src/lib/providers/github.ts)
```

### Folder Structure

```
src/lib/providers/
├── index.ts          # Provider abstraction functions
├── types.ts          # Provider-agnostic type definitions
└── github.ts         # GitHub provider implementation
```

### Data Flow

1. **Fetching Repositories**:
   - Router calls `fetchRepositories(token, "github")`
   - Abstraction layer calls `getProviderOperations("github").fetchRepositories(token)`
   - GitHub provider fetches from GitHub API and maps to provider-agnostic types
   - Data flows back through layers to the client

2. **Connecting Repositories**:
   - Client submits repository data with `externalId` and `provider`
   - Router validates input and upserts to database using composite unique constraint
   - Database stores with provider-specific external ID

3. **Provider Selection**:
   - Currently hardcoded to "github"
   - Future: Can be extended to support user-selected providers

### Function Composition Pattern

The abstraction layer uses function composition to delegate operations:

```typescript
export const fetchRepositories = (token: string, provider: Provider) => {
  const operations = getProviderOperations(provider);
  return operations.fetchRepositories(token);
};
```

This pattern allows:
- Easy testing by mocking provider operations
- Clear separation of concerns
- Type-safe provider selection
- Simple addition of new providers

## Components and Interfaces

### Core Types (src/lib/providers/types.ts)

#### Provider Type
```typescript
export type Provider = "github";
```

A string literal union representing supported providers. Currently only "github", but designed to extend to "gitlab" | "bitbucket" | etc.

#### Repository Interface
```typescript
export interface Repository {
  externalId: string;      // Provider's unique ID (converted to string)
  name: string;            // Repository name
  fullName: string;        // Full name (owner/repo)
  private: boolean;        // Visibility status
  htmlUrl: string;         // Web URL
  description: string | null;
  language: string | null;
  stars: number;
  updatedAt: string;       // ISO 8601 timestamp
}
```

Provider-agnostic representation of a repository. Maps from provider-specific types.

#### PullRequest Interface
```typescript
export interface PullRequest {
  externalId: string;      // Provider's unique PR ID
  number: number;          // PR number
  title: string;
  state: "open" | "closed";
  htmlUrl: string;
  author: {
    login: string;
    avatarUrl: string;
  };
  createdAt: string;
  updatedAt: string;
  mergedAt: string | null;
  draft: boolean;
  sourceBranch: string;
  targetBranch: string;
  additions: number;
  deletions: number;
  changedFiles: number;
}
```

Provider-agnostic representation of a pull request.

#### ProviderOperations Interface
```typescript
export interface ProviderOperations {
  getAccessToken: (userId: string) => Promise<string | null>;
  fetchRepositories: (token: string) => Promise<Repository[]>;
  fetchPullRequests: (
    token: string,
    owner: string,
    repo: string,
    state?: "open" | "closed" | "all"
  ) => Promise<PullRequest[]>;
}
```

Defines the contract that all provider implementations must fulfill. Each operation is a function signature.

### Provider Abstraction Layer (src/lib/providers/index.ts)

#### getProviderOperations Function
```typescript
export function getProviderOperations(provider: Provider): ProviderOperations
```

Factory function that returns provider-specific operations. Uses a switch statement to select the appropriate provider implementation.

**Input**: Provider type ("github")
**Output**: ProviderOperations object containing provider-specific functions
**Purpose**: Central point for provider selection and delegation

#### getAccessToken Function
```typescript
export async function getAccessToken(
  userId: string,
  provider: Provider
): Promise<string | null>
```

Retrieves the access token for a user and provider.

**Input**: User ID and provider type
**Output**: Access token string or null if not found
**Purpose**: Abstract token retrieval across providers

#### fetchRepositories Function
```typescript
export async function fetchRepositories(
  token: string,
  provider: Provider
): Promise<Repository[]>
```

Fetches repositories from the specified provider.

**Input**: Access token and provider type
**Output**: Array of provider-agnostic Repository objects
**Purpose**: Unified interface for fetching repositories

#### fetchPullRequests Function
```typescript
export async function fetchPullRequests(
  token: string,
  owner: string,
  repo: string,
  provider: Provider,
  state?: "open" | "closed" | "all"
): Promise<PullRequest[]>
```

Fetches pull requests for a specific repository.

**Input**: Access token, repository identifiers, provider type, optional state filter
**Output**: Array of provider-agnostic PullRequest objects
**Purpose**: Unified interface for fetching pull requests

### GitHub Provider Implementation (src/lib/providers/github.ts)

#### getGitHubAccessToken Function
```typescript
export async function getGitHubAccessToken(
  userId: string
): Promise<string | null>
```

Queries the database for GitHub access token.

**Implementation**:
- Queries Account table with userId and providerId "github"
- Returns accessToken or null
- Handles errors gracefully

#### fetchGitHubRepos Function
```typescript
export async function fetchGitHubRepos(token: string): Promise<Repository[]>
```

Fetches repositories from GitHub API and maps to provider-agnostic types.

**Implementation**:
- Calls GitHub API with pagination (100 per page)
- Maps GitHubRepo to Repository interface
- Converts numeric id to string for externalId
- Maintains existing error handling

#### fetchGitHubPullRequests Function
```typescript
export async function fetchGitHubPullRequests(
  token: string,
  owner: string,
  repo: string,
  state?: "open" | "closed" | "all"
): Promise<PullRequest[]>
```

Fetches pull requests from GitHub API and maps to provider-agnostic types.

**Implementation**:
- Calls GitHub API with state filter
- Maps GitHubPullRequest to PullRequest interface
- Converts numeric id to string for externalId
- Extracts branch names from head.ref and base.ref

#### Type Mapping Functions

Internal helper functions for mapping GitHub-specific types to provider-agnostic types:

```typescript
function mapGitHubRepoToRepository(repo: GitHubRepo): Repository
function mapGitHubPRToPullRequest(pr: GitHubPullRequest): PullRequest
```

### Router Layer (src/server/routers/repository.ts)

#### fetchFromProvider Endpoint
```typescript
fetchFromProvider: protectedProcedure.query(async ({ ctx }) => {
  const accessToken = await getAccessToken(ctx.user.id, "github");
  if (!accessToken) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "No access token found",
    });
  }
  return await fetchRepositories(accessToken, "github");
})
```

Renamed from `fetchFromGithub`. Uses provider abstraction layer.

#### connect Mutation
```typescript
connect: protectedProcedure
  .input(connectRepositorySchema)
  .mutation(async ({ ctx, input }) => {
    const result = await Promise.all(
      input.repos.map(async (repo) => {
        return ctx.db.repository.upsert({
          where: {
            externalId_provider: {
              externalId: repo.externalId,
              provider: repo.provider,
            },
          },
          update: { /* fields */ },
          create: { /* fields */ },
        });
      }),
    );
    return { connected: result };
  })
```

Updated to use composite unique constraint with externalId and provider.

### Validator Layer (src/lib/validators/repository.ts)

#### connectRepositorySchema
```typescript
export const connectRepositorySchema = z.object({
  repos: z.array(
    z.object({
      externalId: z.string(),
      name: z.string(),
      fullName: z.string(),
      private: z.boolean(),
      htmlUrl: z.string(),
      provider: z.enum(["github"]).default("github"),
    }),
  ),
});
```

Updated to use externalId (string) and provider fields.

### Hook Layer (src/features/repository/hooks/)

#### useFetchProviderRepos Hook
```typescript
export const useFetchProviderRepos = (enabled: boolean) => {
  const trpc = useTRPC();
  const query = useQuery({
    ...trpc.repository.fetchFromProvider.queryOptions(),
    enabled,
  });
  
  useEffect(() => {
    if (query.isError) {
      toast.error("Failed to fetch repositories");
    }
  }, [query.isError]);
  
  return { ...query };
};
```

Renamed from `useFetchGithubRepos` with provider-agnostic error messages.

## Data Models

### Database Schema Changes

#### Repository Model (Before)
```prisma
model Repository {
  id        String   @id @default(cuid())
  userId    String
  githubId  Int      @unique
  name      String
  fullName  String
  private   Boolean  @default(false)
  htmlUrl   String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user    User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  reviews Review[]

  @@map("repository")
}
```

#### Repository Model (After)
```prisma
model Repository {
  id         String   @id @default(cuid())
  userId     String
  externalId String
  provider   String   @default("github")
  name       String
  fullName   String
  private    Boolean  @default(false)
  htmlUrl    String
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  user    User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  reviews Review[]

  @@unique([externalId, provider])
  @@map("repository")
}
```

#### Key Changes

1. **githubId → externalId**: Changed from Int to String to support non-numeric IDs
2. **provider field**: Added String field with default "github"
3. **Composite unique constraint**: @@unique([externalId, provider]) replaces @unique on githubId
4. **No breaking changes**: Existing relations and other fields remain unchanged

### Migration Strategy

The migration follows a safe, non-destructive approach:

1. **Add new columns**: Add externalId (String) and provider (String) columns
2. **Migrate data**: Copy githubId to externalId using CAST to string, set provider to "github"
3. **Create constraint**: Add @@unique([externalId, provider]) constraint
4. **Drop old column**: Remove githubId column after verification

#### Migration SQL (Conceptual)
```sql
-- Step 1: Add new columns
ALTER TABLE repository ADD COLUMN "externalId" TEXT;
ALTER TABLE repository ADD COLUMN "provider" TEXT DEFAULT 'github';

-- Step 2: Migrate data
UPDATE repository SET "externalId" = CAST("githubId" AS TEXT);

-- Step 3: Make externalId non-nullable
ALTER TABLE repository ALTER COLUMN "externalId" SET NOT NULL;

-- Step 4: Create composite unique constraint
CREATE UNIQUE INDEX "repository_externalId_provider_key" 
  ON repository("externalId", "provider");

-- Step 5: Drop old column
ALTER TABLE repository DROP COLUMN "githubId";
```

### Data Integrity Considerations

1. **Uniqueness**: The composite constraint ensures no duplicate (externalId, provider) pairs
2. **Backward compatibility**: Existing githubId values are preserved as externalId strings
3. **Default provider**: All existing records get provider="github" automatically
4. **Foreign keys**: User and Review relations remain intact
5. **Cascading deletes**: onDelete: Cascade behavior is preserved


## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: GitHub Type Mapping Preserves Structure

For any GitHub API response (repository or pull request), when mapped to provider-agnostic types, the resulting object should contain all required fields with correct types, and the externalId field should be the string representation of the GitHub numeric ID.

**Validates: Requirements 3.5, 5.2, 5.3, 5.4**

### Property 2: Error Handling Resilience

For any error condition that could occur during GitHub API calls (network failures, authentication errors, rate limits), the provider functions should handle the error gracefully and return appropriate error responses or empty arrays without crashing.

**Validates: Requirements 5.5**

### Property 3: Pagination Completeness

For any GitHub user with more than 100 repositories, when fetching repositories, the function should paginate through all pages and return the complete set of repositories, not just the first page.

**Validates: Requirements 5.5**

### Property 4: Backward Compatibility Preservation

For any repository that existed before the migration (with a githubId), after the migration and refactoring, all repository operations (display, fetch PRs, disconnect) should continue to work correctly using the migrated externalId and provider fields.

**Validates: Requirements 2.5, 11.1, 11.2, 11.3, 11.4**

### Property 5: Provider Operations Delegation

For any provider operation (getAccessToken, fetchRepositories, fetchPullRequests), when called through the abstraction layer with provider "github", the call should delegate to the corresponding GitHub-specific function and return the same result as calling the GitHub function directly.

**Validates: Requirements 4.2, 4.6**

### Property 6: Composite Unique Constraint Enforcement

For any two repositories with the same externalId but different providers, the database should allow both to be stored. For any two repositories with the same externalId and the same provider, the database should reject the second insertion as a unique constraint violation.

**Validates: Requirements 1.3**

### Property 7: Default Provider Assignment

For any repository created without explicitly specifying a provider field, the database should automatically assign "github" as the default provider value.

**Validates: Requirements 1.2**

### Property 8: Migration Data Preservation

For any repository record that existed before migration with a githubId value N, after migration the record should have externalId equal to the string representation of N, and provider equal to "github", with all other fields unchanged.

**Validates: Requirements 1.5, 9.2, 9.3**

### Property 9: Validator String Acceptance

For any valid repository data with externalId as a string value, the connectRepositorySchema validator should accept the input and pass validation, whereas numeric externalId values should be rejected.

**Validates: Requirements 6.1, 6.5**

### Property 10: Provider Default in Validation

For any repository data submitted without a provider field, the connectRepositorySchema validator should apply the default value "github" during validation.

**Validates: Requirements 6.2**

### Property 11: Router Abstraction Usage

For any call to the fetchFromProvider endpoint, the router should invoke getAccessToken and fetchRepositories from the provider abstraction layer (src/lib/providers/index.ts) with provider "github", not directly call GitHub-specific functions.

**Validates: Requirements 7.2, 7.3**

### Property 12: Upsert Composite Key Usage

For any repository being connected, the upsert operation should use the composite key {externalId, provider} in the where clause, allowing the same externalId to exist for different providers while preventing duplicates for the same provider.

**Validates: Requirements 7.4, 7.5**

## Error Handling

### Error Categories

1. **Provider API Errors**
   - Network failures
   - Authentication failures (invalid/expired tokens)
   - Rate limiting
   - Invalid repository/PR identifiers
   - API response format changes

2. **Database Errors**
   - Unique constraint violations
   - Foreign key violations
   - Connection failures
   - Transaction failures

3. **Validation Errors**
   - Invalid input format
   - Missing required fields
   - Type mismatches

4. **Migration Errors**
   - Data type conversion failures
   - Constraint creation failures
   - Data loss during migration

### Error Handling Strategies

#### Provider API Errors

**Network Failures**:
- Catch fetch errors and return empty arrays
- Log errors for debugging
- Return null for access token failures
- Throw TRPCError with appropriate code for router endpoints

**Authentication Failures**:
- Return null from getAccessToken if no token found
- Throw UNAUTHORIZED TRPCError in router endpoints
- Provide clear error messages to users

**Rate Limiting**:
- Respect GitHub API rate limits
- Return partial results if rate limit hit during pagination
- Log rate limit errors

**Invalid Identifiers**:
- Validate owner/repo format before API calls
- Return empty arrays for invalid identifiers
- Throw descriptive errors in router layer

#### Database Errors

**Unique Constraint Violations**:
- Use upsert operations to handle existing records
- Update existing records instead of failing
- Return success with updated record

**Connection Failures**:
- Let Prisma handle connection retries
- Propagate errors to router layer
- Return appropriate TRPCError codes

**Transaction Failures**:
- Use Prisma transactions for multi-record operations
- Rollback on failure
- Return partial success information if needed

#### Validation Errors

**Invalid Input**:
- Use Zod schemas for validation
- Return clear validation error messages
- Prevent invalid data from reaching database

**Type Mismatches**:
- Enforce types at TypeScript compile time
- Use Zod runtime validation
- Convert types where necessary (e.g., number to string)

#### Migration Errors

**Data Type Conversion**:
- Use database CAST functions for type conversion
- Verify conversion success before dropping old columns
- Maintain backup of data before migration

**Constraint Creation**:
- Create constraints after data migration
- Verify no constraint violations exist
- Handle constraint creation failures gracefully

### Error Response Format

All errors should follow consistent format:

```typescript
{
  code: "ERROR_CODE",
  message: "Human-readable error message",
  details?: any // Optional additional context
}
```

### Logging Strategy

- Log all provider API errors with context (userId, provider, operation)
- Log database errors with query context
- Log validation errors with input data (sanitized)
- Use structured logging for easy debugging
- Include timestamps and request IDs

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests to ensure comprehensive coverage:

- **Unit tests**: Verify specific examples, edge cases, and error conditions
- **Property-based tests**: Verify universal properties across all inputs

Both approaches are complementary and necessary. Unit tests catch concrete bugs and verify specific scenarios, while property-based tests verify general correctness across a wide range of inputs.

### Property-Based Testing

**Library Selection**: Use `fast-check` for TypeScript/JavaScript property-based testing.

**Configuration**:
- Minimum 100 iterations per property test (due to randomization)
- Each property test must reference its design document property
- Tag format: `// Feature: future-proof-git-architecture, Property {number}: {property_text}`

**Property Test Implementation**:

Each correctness property listed above should be implemented as a property-based test:

1. **Property 1 - GitHub Type Mapping**: Generate random GitHub API responses, map them, verify all fields present and externalId is string
2. **Property 2 - Error Handling**: Generate random error conditions, verify graceful handling
3. **Property 3 - Pagination**: Generate users with varying repository counts, verify all repos fetched
4. **Property 4 - Backward Compatibility**: Generate pre-migration data, run migration, verify operations work
5. **Property 5 - Provider Delegation**: Generate random operation calls, verify delegation to correct provider
6. **Property 6 - Composite Unique Constraint**: Generate repository pairs with same/different externalId and provider, verify constraint behavior
7. **Property 7 - Default Provider**: Generate repositories without provider field, verify default applied
8. **Property 8 - Migration Data Preservation**: Generate pre-migration records, run migration, verify data integrity
9. **Property 9 - Validator String Acceptance**: Generate string and numeric externalId values, verify validation behavior
10. **Property 10 - Provider Default in Validation**: Generate input without provider, verify default applied
11. **Property 11 - Router Abstraction Usage**: Mock abstraction layer, verify router calls it correctly
12. **Property 12 - Upsert Composite Key**: Generate repository data, verify upsert uses composite key

### Unit Testing

**Focus Areas**:

1. **Specific Examples**:
   - Test with known GitHub repository data
   - Test with specific error scenarios
   - Test migration with sample data

2. **Edge Cases**:
   - Empty repository lists
   - Repositories with null/missing fields
   - Very long repository names
   - Special characters in repository names
   - Repositories with zero stars

3. **Error Conditions**:
   - Missing access token
   - Invalid access token
   - Network timeout
   - Malformed API responses
   - Database connection failures

4. **Integration Points**:
   - Router to abstraction layer
   - Abstraction layer to provider
   - Provider to GitHub API
   - Database operations

**Unit Test Examples**:

```typescript
// Example: Test default provider assignment
test('repository created without provider defaults to github', async () => {
  const repo = await db.repository.create({
    data: {
      externalId: '123',
      name: 'test-repo',
      fullName: 'user/test-repo',
      private: false,
      htmlUrl: 'https://github.com/user/test-repo',
      userId: 'user-id',
    },
  });
  expect(repo.provider).toBe('github');
});

// Example: Test composite unique constraint
test('allows same externalId for different providers', async () => {
  await db.repository.create({
    data: {
      externalId: '123',
      provider: 'github',
      name: 'test-repo',
      fullName: 'user/test-repo',
      private: false,
      htmlUrl: 'https://github.com/user/test-repo',
      userId: 'user-id',
    },
  });
  
  // This should succeed (different provider)
  await expect(
    db.repository.create({
      data: {
        externalId: '123',
        provider: 'gitlab', // Different provider
        name: 'test-repo',
        fullName: 'user/test-repo',
        private: false,
        htmlUrl: 'https://gitlab.com/user/test-repo',
        userId: 'user-id',
      },
    })
  ).resolves.toBeDefined();
});

// Example: Test error handling
test('fetchRepositories returns empty array on network error', async () => {
  const mockFetch = jest.fn().mockRejectedValue(new Error('Network error'));
  global.fetch = mockFetch;
  
  const repos = await fetchGitHubRepos('token');
  expect(repos).toEqual([]);
});
```

### Test Organization

```
tests/
├── unit/
│   ├── providers/
│   │   ├── github.test.ts
│   │   └── index.test.ts
│   ├── validators/
│   │   └── repository.test.ts
│   └── routers/
│       └── repository.test.ts
└── property/
    ├── type-mapping.property.test.ts
    ├── error-handling.property.test.ts
    ├── backward-compatibility.property.test.ts
    └── validation.property.test.ts
```

### Testing Priorities

1. **High Priority**:
   - Migration data preservation (Property 8)
   - Backward compatibility (Property 4)
   - Type mapping correctness (Property 1)
   - Composite unique constraint (Property 6)

2. **Medium Priority**:
   - Provider delegation (Property 5)
   - Error handling (Property 2)
   - Validation behavior (Properties 9, 10)

3. **Low Priority**:
   - Pagination (Property 3)
   - Router abstraction usage (Property 11)
   - Default assignments (Property 7)

### Mocking Strategy

- Mock GitHub API responses for provider tests
- Mock database operations for router tests
- Mock provider operations for abstraction layer tests
- Use test database for integration tests
- Mock fetch for network error scenarios

### Test Data Generation

For property-based tests, generate:
- Random repository data with valid GitHub ID ranges
- Random user IDs
- Random access tokens
- Random error conditions
- Random API response structures
- Random provider selections (currently only "github")

### Continuous Integration

- Run all tests on every commit
- Require 100% pass rate for merges
- Run property tests with increased iterations (1000+) in CI
- Include migration tests in CI pipeline
- Test against actual test database in CI
