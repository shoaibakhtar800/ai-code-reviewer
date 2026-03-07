import { GitHubRepo } from "@/features/repositories/types";
import { languageColors } from "../constants";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { LockIcon, StarIcon } from "lucide-react";

interface RepositorySelectItemProps {
  repo: GitHubRepo;
  selected: boolean;
  onToggle: () => void;
}

export const RepositorySelectItem = ({
  repo,
  selected,
  onToggle,
}: RepositorySelectItemProps) => {
  const languageColor = repo.language ? languageColors[repo.language] : "";

  return (
    <Label
      className={cn(
        "flex cursor-pointer items-center gap-4 px-6 py-4 transition-colors",
        selected ? "bg-primary/5" : "hover:bg-muted/50",
      )}
    >
      <Checkbox
        checked={selected}
        onCheckedChange={onToggle}
        className="shrink-0"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="truncate font-medium">{repo.fullName}</span>
          {repo.private && (
            <LockIcon className="size-3 text-muted-foreground shrink-0" />
          )}
        </div>
        {repo.description && (
          <p className="text-sm text-muted-foreground truncate mt-0.5">
            {repo.description}
          </p>
        )}
      </div>
      <div className="flex items-center gap-4 shrink-0">
        {repo.stars > 0 && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <StarIcon className="size-3" />
            <span className="tabular-nums">{repo.stars}</span>
          </span>
        )}
        {repo.language && (
          <div className="flex items-center gap-1.5">
            <span
              className={cn("size-2.5 rounded-full shrink-0", languageColor)}
            />
            <span className="text-xs text-muted-foreground">
              {repo.language}
            </span>
          </div>
        )}
      </div>
    </Label>
  );
};
