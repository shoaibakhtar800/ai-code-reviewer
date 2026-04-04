"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  AlertCircleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  FileEditIcon,
  FileMinusIcon,
  FilePlusIcon,
  FileTextIcon,
  FolderTreeIcon,
  MinusIcon,
  PlusIcon,
} from "lucide-react";
import React from "react";
import { useState } from "react";

interface DiffFile {
  sha: string;
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  changes: number;
  patch?: string;
  previousFilename?: string;
}

interface DiffViewerProps {
  files: DiffFile[];
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case "added":
      return FilePlusIcon;
    case "modified":
    case "changed":
    case "renamed":
      return FileEditIcon;
    case "removed":
      return FileMinusIcon;
    default:
      return FileTextIcon;
  }
};

const getStatusConfig = (status: string) => {
  switch (status) {
    case "added":
      return {
        color: "text-emerald-600 dark:text-emerald-400",
        bg: "bg-emerald-500/10",
      };
    case "modified":
    case "changed":
      return {
        color: "text-amber-600 dark:text-amber-400",
        bg: "bg-amber-500/10",
      };
    case "renamed":
      return {
        color: "text-blue-600 dark:text-blue-400",
        bg: "bg-blue-500/10",
      };
    case "removed":
      return {
        color: "text-red-600 dark:text-red-400",
        bg: "bg-red-500/10",
      };
    default:
      return {
        color: "text-muted-foreground",
        bg: "bg-muted",
      };
  }
};

export function DiffViewer({ files }: DiffViewerProps) {
  const totalAdditions = files.reduce((acc, file) => acc + file.additions, 0);
  const totalDeletions = files.reduce((acc, file) => acc + file.deletions, 0);

  const [expendedFiles, setExpendedFiles] = useState<Set<string>>(
    new Set(files.slice(0, 3).map((file) => file.sha)),
  );

  const toggleFile = (sha: string) => {
    const next = new Set(expendedFiles);
    if (next.has(sha)) {
      next.delete(sha);
    } else {
      next.add(sha);
    }
    setExpendedFiles(next);
  };

  const toggleAllFiles = () => {
    if (expendedFiles.size === files.length) {
      setExpendedFiles(new Set());
    } else {
      setExpendedFiles(new Set(files.map((file) => file.sha)));
    }
  };

  const collapseAll = () => {
    setExpendedFiles(new Set());
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <FolderTreeIcon className="size-4 text-primary" />
            </div>
            <div>
              <span className="text-base font-medium tabular-nums">
                {files.length}
              </span>
              <span className="text-sm ml-1.5 font-medium text-muted-foreground">
                file{files.length !== 1 ? "s" : ""} changed
              </span>
            </div>
          </div>
          <div className="h-5 w-px bg-border"></div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <PlusIcon className="size-3.5" />
              <span className="tabular-nums">{totalAdditions}</span>
            </span>
            <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
              <MinusIcon className="size-3.5" />
              <span className="tabular-nums">{totalDeletions}</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant={"ghost"} size={"sm"} onClick={toggleAllFiles}>
            <PlusIcon className="size-3.5" />
            Expand all
          </Button>
          <Button variant={"ghost"} size={"sm"} onClick={collapseAll}>
            <MinusIcon className="size-3.5" />
            Collapse all
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {files.map((file) => (
          <DiffFileCard
            key={file.sha}
            file={file}
            expended={expendedFiles.has(file.sha)}
            onToggle={() => toggleFile(file.sha)}
          />
        ))}
      </div>
    </div>
  );
}

function DiffFileCard({
  file,
  expended,
  onToggle,
}: {
  file: DiffFile;
  expended: boolean;
  onToggle: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const StatusIcon = getStatusIcon(file.status);
  const statusConfig = getStatusConfig(file.status);

  const copyFilename = () => {
    navigator.clipboard.writeText(file.filename);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const pathParts = file.filename.split("/");
  const filename = pathParts.pop();
  const directory = pathParts.join("/");

  return (
    <Card className="overflow-hidden">
      <Button
        onClick={onToggle}
        className="flex items-center gap-2 w-full px-4 py-6 justify-start hover:bg-muted/50 transition-colors"
        variant={"ghost"}
        size={"sm"}
      >
        <div className="shrink-0">
          {expended ? (
            <ChevronDownIcon className="size-4 text-muted-foreground" />
          ) : (
            <ChevronRightIcon className="size-4 text-muted-foreground" />
          )}
        </div>

        <div className={cn("p-1.5 rounded-md shrink-0", statusConfig.bg)}>
          {React.createElement(StatusIcon, {
            className: cn("size-4 text-muted-foreground truncate"),
          })}
        </div>

        {pathParts.map((part, index) => (
          <span key={index}>{part}</span>
        ))}
        <div className="flex-1 min-w-0 flex items-center gap-2">
          {directory && (
            <span className="text-sm text-muted-foreground font-mono truncate">
              {directory}
            </span>
          )}
          <span className="text-sm font-medium font-mono truncate">
            {filename}
          </span>
          {file.previousFilename && (
            <Badge variant={"outline"} className="text-xs shrink-0">
              {file.previousFilename}
            </Badge>
          )}
          {file.changes > 300 && (
            <Badge
              variant={"outline"}
              className="text-[10px] shrink-0 gap-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500"
            >
              <AlertCircleIcon className="size-3" />
              Large changes
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden sm:flex items-center gap-0.5">
            {Array.from({ length: Math.min(file.additions, 5) }).map(
              (_, index) => (
                <div
                  key={index}
                  className="size-1.5 rounded-full bg-emerald-500/50"
                ></div>
              ),
            )}
            {file.additions > 5 && (
              <span className="text-xs text-muted-foreground">
                +{file.additions - 5}
              </span>
            )}
          </div>
          <div className="hidden sm:flex items-center gap-0.5">
            {Array.from({ length: Math.min(file.deletions, 5) }).map(
              (_, index) => (
                <div
                  key={index}
                  className="size-1.5 rounded-full bg-red-500/50"
                ></div>
              ),
            )}
            {file.deletions > 5 && (
              <span className="text-xs text-muted-foreground">
                -{file.deletions - 5}
              </span>
            )}
          </div>
        </div>
      </Button>
    </Card>
  );
}
