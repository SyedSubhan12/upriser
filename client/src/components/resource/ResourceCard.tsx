import { Link } from "wouter";
import { ArrowRight, FileText, Notebook, List, BookOpen, Folder, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ResourceCategory } from "@/lib/curriculumData";

// Icon mapping for resource categories
const resourceIcons: Record<string, typeof FileText> = {
    "file-text": FileText,
    notebook: Notebook,
    list: List,
    "book-open": BookOpen,
    folder: Folder,
    calendar: Calendar,
};

interface ResourceCardProps {
    category: ResourceCategory;
    subjectId: string;
    count?: number;
    className?: string;
}

export function ResourceCard({ category, subjectId, count, className }: ResourceCardProps) {
    const Icon = resourceIcons[category.icon] || FileText;

    // Don't render if count is 0 and we want to hide empty
    // The parent can decide to filter based on count

    return (
        <Link href={`/subject/${subjectId}/resource/${category.resourceKey}`}>
            <Card
                className={cn(
                    "group cursor-pointer transition-all duration-200",
                    "hover:border-primary/50 hover:shadow-md hover:-translate-y-0.5",
                    className
                )}
            >
                <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <Icon className="h-5 w-5" />
                        </div>
                        <ArrowRight
                            className={cn(
                                "h-5 w-5 text-muted-foreground opacity-0 transition-all",
                                "group-hover:opacity-100 group-hover:translate-x-1"
                            )}
                        />
                    </div>
                    <h3 className="mt-4 font-semibold">{category.displayName}</h3>
                    {count !== undefined && count > 0 && (
                        <p className="mt-1 text-sm text-muted-foreground">
                            {count} {count === 1 ? "item" : "items"}
                        </p>
                    )}
                </CardContent>
            </Card>
        </Link>
    );
}

interface ResourceCardGridProps {
    categories: ResourceCategory[];
    subjectId: string;
    counts?: Record<string, number>;
    hideEmpty?: boolean;
    className?: string;
}

export function ResourceCardGrid({
    categories,
    subjectId,
    counts,
    hideEmpty = true,
    className,
}: ResourceCardGridProps) {
    // Filter out empty categories if hideEmpty is true
    const visibleCategories = hideEmpty && counts
        ? categories.filter((cat) => (counts[cat.resourceKey] || 0) > 0)
        : categories;

    // Sort by sortOrder
    const sortedCategories = [...visibleCategories].sort((a, b) => a.sortOrder - b.sortOrder);

    return (
        <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-3", className)}>
            {sortedCategories.map((category) => (
                <ResourceCard
                    key={category.resourceKey}
                    category={category}
                    subjectId={subjectId}
                    count={counts?.[category.resourceKey]}
                />
            ))}
        </div>
    );
}

// Compact list version
interface ResourceListItemProps {
    category: ResourceCategory;
    subjectId: string;
    count?: number;
    className?: string;
}

export function ResourceListItem({ category, subjectId, count, className }: ResourceListItemProps) {
    const Icon = resourceIcons[category.icon] || FileText;

    return (
        <Link href={`/subject/${subjectId}/resource/${category.resourceKey}`}>
            <div
                className={cn(
                    "group flex items-center gap-4 rounded-lg border p-4 transition-all",
                    "hover:border-primary/50 hover:bg-muted/50",
                    className
                )}
            >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                    <h3 className="font-medium">{category.displayName}</h3>
                    {count !== undefined && (
                        <p className="text-sm text-muted-foreground">
                            {count} {count === 1 ? "item" : "items"}
                        </p>
                    )}
                </div>
                <ArrowRight
                    className={cn(
                        "h-5 w-5 shrink-0 text-muted-foreground transition-all",
                        "group-hover:translate-x-1 group-hover:text-foreground"
                    )}
                />
            </div>
        </Link>
    );
}
