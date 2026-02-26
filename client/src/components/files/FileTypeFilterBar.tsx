import { cn } from "@/lib/utils";
import { FILE_TYPE_SHORT_LABELS, type FileType } from "@/lib/curriculumData";

const fileTypes: FileType[] = ["qp", "ms", "gt", "er", "in", "ir"];

interface FileTypeFilterBarProps {
    selectedType: FileType | null;
    onSelect: (type: FileType | null) => void;
    className?: string;
    availableTypes?: FileType[];
}

export function FileTypeFilterBar({
    selectedType,
    onSelect,
    className,
    availableTypes,
}: FileTypeFilterBarProps) {
    // Filter to only show types that are available, if provided
    const typesToShow = availableTypes
        ? fileTypes.filter((t) => availableTypes.includes(t))
        : fileTypes;

    // Don't show the filter bar if there are no types to filter
    if (typesToShow.length === 0) {
        return null;
    }

    return (
        <div className={cn("flex flex-wrap gap-2", className)}>
            {/* All button */}
            <button
                onClick={() => onSelect(null)}
                className={cn(
                    "inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                    "border",
                    selectedType === null
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
            >
                All
            </button>

            {/* Type filter buttons */}
            {typesToShow.map((type) => (
                <button
                    key={type}
                    onClick={() => onSelect(type)}
                    className={cn(
                        "inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                        "border",
                        selectedType === type
                            ? getTypeButtonStyle(type)
                            : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                >
                    {FILE_TYPE_SHORT_LABELS[type]}
                </button>
            ))}
        </div>
    );
}

// Scrollable horizontal version for mobile
interface ScrollableFileTypeFilterBarProps extends FileTypeFilterBarProps {
    showScrollShadows?: boolean;
}

export function ScrollableFileTypeFilterBar({
    selectedType,
    onSelect,
    className,
    availableTypes,
    showScrollShadows = true,
}: ScrollableFileTypeFilterBarProps) {
    const typesToShow = availableTypes
        ? fileTypes.filter((t) => availableTypes.includes(t))
        : fileTypes;

    if (typesToShow.length === 0) {
        return null;
    }

    return (
        <div className={cn("relative", className)}>
            {showScrollShadows && (
                <>
                    <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-4 bg-gradient-to-r from-background to-transparent" />
                    <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-4 bg-gradient-to-l from-background to-transparent" />
                </>
            )}
            <div className="flex gap-2 overflow-x-auto px-1 py-1 scrollbar-hide">
                <button
                    onClick={() => onSelect(null)}
                    className={cn(
                        "inline-flex shrink-0 items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                        "border",
                        selectedType === null
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                >
                    All
                </button>

                {typesToShow.map((type) => (
                    <button
                        key={type}
                        onClick={() => onSelect(type)}
                        className={cn(
                            "inline-flex shrink-0 items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                            "border",
                            selectedType === type
                                ? getTypeButtonStyle(type)
                                : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                    >
                        {FILE_TYPE_SHORT_LABELS[type]}
                    </button>
                ))}
            </div>
        </div>
    );
}

// Get colored button style for selected type
function getTypeButtonStyle(type: FileType): string {
    const styles: Record<FileType, string> = {
        qp: "border-blue-500 bg-blue-500 text-white",
        ms: "border-green-500 bg-green-500 text-white",
        gt: "border-amber-500 bg-amber-500 text-white",
        er: "border-purple-500 bg-purple-500 text-white",
        in: "border-cyan-500 bg-cyan-500 text-white",
        ir: "border-orange-500 bg-orange-500 text-white",
        other: "border-gray-500 bg-gray-500 text-white",
    };
    return styles[type];
}

// Type badge for file rows
interface FileTypeBadgeProps {
    type: FileType;
    className?: string;
}

export function FileTypeBadge({ type, className }: FileTypeBadgeProps) {
    const badgeStyles: Record<FileType, string> = {
        qp: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
        ms: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
        gt: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
        er: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
        in: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
        ir: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
        other: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
    };

    return (
        <span
            className={cn(
                "inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium",
                badgeStyles[type],
                className
            )}
        >
            {FILE_TYPE_SHORT_LABELS[type]}
        </span>
    );
}
