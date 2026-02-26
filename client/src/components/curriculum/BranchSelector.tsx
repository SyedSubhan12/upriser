import { Link } from "wouter";
import { ArrowRight, Clock, History } from "lucide-react";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Branch } from "@/lib/curriculumData";

interface BranchSelectorProps {
    branches: Branch[];
    boardKey: string;
    qualKey: string;
    className?: string;
}

export function BranchSelector({ branches, boardKey, qualKey, className }: BranchSelectorProps) {
    return (
        <div className={cn("grid gap-4 sm:grid-cols-2", className)}>
            {branches.map((branch) => (
                <BranchCard
                    key={branch.id}
                    branch={branch}
                    boardKey={boardKey}
                    qualKey={qualKey}
                />
            ))}
        </div>
    );
}

interface BranchCardProps {
    branch: Branch;
    boardKey: string;
    qualKey: string;
    className?: string;
}

export function BranchCard({ branch, boardKey, qualKey, className }: BranchCardProps) {
    const isCurrent = branch.branchKey === "current";
    const Icon = isCurrent ? Clock : History;

    return (
        <Link href={`/curriculum/${boardKey}/${qualKey}/${branch.branchKey}/subjects`}>
            <Card
                className={cn(
                    "group cursor-pointer transition-all duration-200",
                    "hover:shadow-md hover:-translate-y-0.5",
                    isCurrent
                        ? "border-primary/30 hover:border-primary/50 bg-primary/5"
                        : "hover:border-muted-foreground/30",
                    className
                )}
            >
                <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                        <div
                            className={cn(
                                "flex h-12 w-12 items-center justify-center rounded-xl",
                                isCurrent
                                    ? "bg-primary/10 text-primary"
                                    : "bg-muted text-muted-foreground"
                            )}
                        >
                            <Icon className="h-6 w-6" />
                        </div>
                        <ArrowRight
                            className={cn(
                                "h-5 w-5 text-muted-foreground opacity-0 transition-all",
                                "group-hover:opacity-100 group-hover:translate-x-1"
                            )}
                        />
                    </div>
                    <CardTitle className="mt-4 text-lg">{branch.displayName}</CardTitle>
                    <CardDescription className="mt-2">
                        {isCurrent
                            ? "Latest specification with current exam formats"
                            : "Previous specification for reference and practice"}
                    </CardDescription>
                    {isCurrent && (
                        <div className="mt-3 inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                            Recommended
                        </div>
                    )}
                </CardContent>
            </Card>
        </Link>
    );
}

// Simple inline version for smaller spaces
interface BranchToggleProps {
    branches: Branch[];
    selectedBranchKey: string | null;
    onSelect: (branchKey: string) => void;
    className?: string;
}

export function BranchToggle({ branches, selectedBranchKey, onSelect, className }: BranchToggleProps) {
    return (
        <div className={cn("inline-flex rounded-lg border p-1", className)}>
            {branches.map((branch) => {
                const isSelected = selectedBranchKey === branch.branchKey;
                return (
                    <button
                        key={branch.id}
                        onClick={() => onSelect(branch.branchKey)}
                        className={cn(
                            "rounded-md px-4 py-2 text-sm font-medium transition-colors",
                            isSelected
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        {branch.displayName}
                    </button>
                );
            })}
        </div>
    );
}
