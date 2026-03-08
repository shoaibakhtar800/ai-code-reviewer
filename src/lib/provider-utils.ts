import { IconType } from "react-icons";
import { FaGithub, FaGitlab, FaBitbucket, FaGit } from "react-icons/fa";

/**
 * Mapping of provider identifiers to their display names with proper capitalization.
 */
const providerDisplayNames: Record<string, string> = {
  github: "GitHub",
  gitlab: "GitLab",
  bitbucket: "Bitbucket",
};

/**
 * Mapping of provider identifiers to their corresponding react-icons components.
 */
const providerIcons: Record<string, IconType> = {
  github: FaGithub,
  gitlab: FaGitlab,
  bitbucket: FaBitbucket,
};

/**
 * Converts a provider identifier to its properly formatted display name.
 * 
 * @param provider - The provider identifier (e.g., "github", "gitlab", "bitbucket")
 * @returns The formatted display name (e.g., "GitHub", "GitLab", "Bitbucket")
 * 
 * @example
 * ```typescript
 * getProviderDisplayName("github") // Returns "GitHub"
 * getProviderDisplayName("gitlab") // Returns "GitLab"
 * getProviderDisplayName("unknown") // Returns "Unknown" (title case fallback)
 * ```
 */
export function getProviderDisplayName(provider: string = "github"): string {
  const normalized = provider.toLowerCase();
  return (
    providerDisplayNames[normalized] ||
    provider.charAt(0).toUpperCase() + provider.slice(1)
  );
}

/**
 * Maps a provider identifier to its corresponding icon component from react-icons.
 * 
 * @param provider - The provider identifier (e.g., "github", "gitlab", "bitbucket")
 * @returns The icon component for the provider, or FaGit as a fallback
 * 
 * @example
 * ```typescript
 * const Icon = getProviderIcon("github"); // Returns FaGithub
 * <Icon className="size-4" />
 * ```
 */
export function getProviderIcon(provider: string = "github"): IconType {
  const normalized = provider.toLowerCase();
  return providerIcons[normalized] || FaGit;
}
