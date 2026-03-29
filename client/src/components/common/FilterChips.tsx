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
        <div className={cn("flex flex-wrap gap-1.5 sm:gap-2", className)}>
            <button
                onClick={() => onSelect(null)}
                className={cn(
                    "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium transition-colors sm:px-3 sm:py-1.5 sm:text-sm",
                    selectedKey === null
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                )}
            >
                <span className="max-w-[10rem] truncate whitespace-nowrap sm:max-w-none">{allLabel}</span>
            </button>
            {chips.map((chip) => (
                <button
                    key={chip.key}
                    onClick={() => onSelect(chip.key)}
                    className={cn(
                        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium transition-colors sm:px-3 sm:py-1.5 sm:text-sm",
                        selectedKey === chip.key
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                    )}
                >
                    <span className="max-w-[10rem] truncate whitespace-nowrap sm:max-w-none">{chip.label}</span>
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
            <div className="flex gap-1.5 overflow-x-auto px-1 py-1 scrollbar-hide sm:gap-2">
                <button
                    onClick={() => onSelect(null)}
                    className={cn(
                        "inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-medium transition-colors sm:px-3 sm:py-1.5 sm:text-sm",
                        selectedKey === null
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                    )}
                >
                    <span className="max-w-[10rem] truncate whitespace-nowrap sm:max-w-none">{allLabel}</span>
                </button>
                {chips.map((chip) => (
                    <button
                        key={chip.key}
                        onClick={() => onSelect(chip.key)}
                        className={cn(
                            "inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-medium transition-colors sm:px-3 sm:py-1.5 sm:text-sm",
                            selectedKey === chip.key
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                        )}
                    >
                        <span className="max-w-[10rem] truncate whitespace-nowrap sm:max-w-none">{chip.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
