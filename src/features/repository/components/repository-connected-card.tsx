import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRightIcon, GlobeIcon, LockIcon, Trash2Icon } from "lucide-react";
import Link from "next/link";
import { formatDate } from "../utils";

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

export const RepositoryConnectedCard = ({
  repo,
  onDisconnect,
  isDisconnecting,
}: {
  repo: ConnectedProviderRepo;
  onDisconnect: (id: string) => void;
  isDisconnecting: boolean;
}) => {
  return (
    <Card className="group hover:border-primary/30 transition-all hover:shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <Link href={`/repositories/${repo.id}`} className="flex-1 min-w-0">
            <div className="flex items-start gap-3">
              <div className="size-10 rounded-lg flex items-center justify-center shrink-0 transition-colors bg-emerald-500/10 group-hover:bg-emerald-500/15">
                {repo.private ? (
                  <LockIcon className="size-4 text-amber-600 dark:text-amber-400" />
                ) : (
                  <GlobeIcon className="size-4 text-emerald-600 dark:text-emerald-400" />
                )}
              </div>
              <div className="min-w-0">
                <span className="font-medium block truncate group-hover:text-primary transition-colors">
                  {repo.fullName}
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs px-1.5 py-0 h-5">
                    {repo.private ? "Private" : "Public"}
                  </Badge>
                </div>
              </div>
            </div>
          </Link>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                disabled={isDisconnecting}
                className="opcaity-0 group-hover:opacity-100 transition-opacity shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2Icon className="size-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Disconnect Repository</AlertDialogTitle>
                <AlertDialogDescription>
                  Are your sure you want to disconnect{" "}
                  <span className="font-medium text-foreground">
                    {repo.fullName}
                  </span>
                  ? This will remove all review history for this repository.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDisconnect(repo.id)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Disconnect
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <div className="mt-4 pt-4 border-t border-border/60 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Connected {formatDate(repo.createdAt.toISOString())}
          </span>
          <Link href={`/repository/${repo.id}`}>
            <Button
              variant={"ghost"}
              size={"sm"}
              className="h-7 text-xs gap-1.5 -mr-2"
            >
              View PRs
              <ArrowRightIcon className="size-3" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};
