import { Link } from "wouter";
import { Folder, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ResourceNode } from "@/lib/curriculumData";

interface FolderRowProps {
    node: ResourceNode;
    href: string;
    childCount?: number;
    className?: string;
}

export function FolderRow({ node, href, childCount, className }: FolderRowProps) {
    return (
        <Link href={href}>
            <div
                className={cn(
                    "group flex items-center gap-4 rounded-lg border p-4 transition-all",
                    "hover:border-primary/50 hover:bg-muted/50",
                    className
                )}
            >
                {/* Folder icon */}
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                    <Folder className="h-5 w-5" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{node.title}</h3>
                    {childCount !== undefined && (
                        <p className="text-sm text-muted-foreground">
                            {childCount} {childCount === 1 ? "item" : "items"}
                        </p>
                    )}
                </div>

                {/* Arrow */}
                <ChevronRight
                    className={cn(
                        "h-5 w-5 shrink-0 text-muted-foreground transition-all",
                        "group-hover:translate-x-1 group-hover:text-foreground"
                    )}
                />
            </div>
        </Link>
    );
}

// Compact version for dense lists
interface FolderRowCompactProps {
    node: ResourceNode;
    href: string;
    className?: string;
}

export function FolderRowCompact({ node, href, className }: FolderRowCompactProps) {
    return (
        <Link href={href}>
            <div
                className={cn(
                    "group flex items-center gap-3 rounded-md px-3 py-2.5 transition-all",
                    "hover:bg-muted",
                    className
                )}
            >
                <Folder className="h-5 w-5 shrink-0 text-amber-500" />
                <span className="flex-1 truncate">{node.title}</span>
                <ChevronRight
                    className={cn(
                        "h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-all",
                        "group-hover:opacity-100 group-hover:translate-x-0.5"
                    )}
                />
            </div>
        </Link>
    );
}

// Grid card version
interface FolderCardProps {
    node: ResourceNode;
    href: string;
    childCount?: number;
    className?: string;
}

export function FolderCard({ node, href, childCount, className }: FolderCardProps) {
    return (
        <Link href={href}>
            <div
                className={cn(
                    "group rounded-lg border p-4 transition-all",
                    "hover:border-primary/50 hover:shadow-md hover:-translate-y-0.5",
                    className
                )}
            >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                    <Folder className="h-6 w-6" />
                </div>
                <h3 className="mt-3 font-medium truncate">{node.title}</h3>
                {childCount !== undefined && (
                    <p className="mt-0.5 text-sm text-muted-foreground">
                        {childCount} {childCount === 1 ? "item" : "items"}
                    </p>
                )}
            </div>
        </Link>
    );
}
