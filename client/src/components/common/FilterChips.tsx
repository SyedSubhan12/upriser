import { cn } from "@/lib/utils";

interface FilterChip {
    key: string;
    label: string;
}

interface FilterChipsProps {
    chips: FilterChip[];
    selectedKey: string | null;
    onSelect: (key: string | null) => void;
    allLabel?: string;
    className?: string;
}

export function FilterChips({
    chips,
    selectedKey,
    onSelect,
    allLabel = "All",
    className,
}: FilterChipsProps) {
    return (
        <div className={cn("flex flex-wrap gap-2", className)}>
            <button
                onClick={() => onSelect(null)}
                className={cn(
                    "inline-flex items-center rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                    selectedKey === null
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                )}
            >
                {allLabel}
            </button>
            {chips.map((chip) => (
                <button
                    key={chip.key}
                    onClick={() => onSelect(chip.key)}
                    className={cn(
                        "inline-flex items-center rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                        selectedKey === chip.key
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                    )}
                >
                    {chip.label}
                </button>
            ))}
        </div>
    );
}

// Horizontal scrollable version for mobile
interface ScrollableFilterChipsProps extends FilterChipsProps {
    showScrollShadows?: boolean;
}

export function ScrollableFilterChips({
    chips,
    selectedKey,
    onSelect,
    allLabel = "All",
    className,
    showScrollShadows = true,
}: ScrollableFilterChipsProps) {
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
                        "inline-flex shrink-0 items-center rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                        selectedKey === null
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                    )}
                >
                    {allLabel}
                </button>
                {chips.map((chip) => (
                    <button
                        key={chip.key}
                        onClick={() => onSelect(chip.key)}
                        className={cn(
                            "inline-flex shrink-0 items-center rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                            selectedKey === chip.key
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                        )}
                    >
                        {chip.label}
                    </button>
                ))}
            </div>
        </div>
    );
}
