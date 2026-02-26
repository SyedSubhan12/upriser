import { Link } from "wouter";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
    label: string;
    href?: string;
}

interface BreadcrumbsProps {
    items: BreadcrumbItem[];
    homeHref?: string;
    showHome?: boolean;
    className?: string;
}

export function Breadcrumbs({
    items,
    homeHref = "/",
    showHome = false,
    className,
}: BreadcrumbsProps) {
    return (
        <nav
            className={cn(
                "flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground",
                className
            )}
            aria-label="Breadcrumb"
        >
            {showHome && (
                <>
                    <Link href={homeHref}>
                        <span className="flex items-center gap-1 hover:text-foreground transition-colors">
                            <Home className="h-4 w-4" />
                            <span className="sr-only">Home</span>
                        </span>
                    </Link>
                    {items.length > 0 && <ChevronRight className="h-3.5 w-3.5" />}
                </>
            )}

            {items.map((item, index) => (
                <span key={index} className="flex items-center gap-1.5">
                    {index > 0 && <ChevronRight className="h-3.5 w-3.5" />}
                    {item.href ? (
                        <Link href={item.href}>
                            <span className="hover:text-foreground transition-colors max-w-[150px] truncate">
                                {item.label}
                            </span>
                        </Link>
                    ) : (
                        <span className="text-foreground font-medium max-w-[200px] truncate">
                            {item.label}
                        </span>
                    )}
                </span>
            ))}
        </nav>
    );
}

// Compact breadcrumbs for mobile with ellipsis
interface CollapsibleBreadcrumbsProps extends BreadcrumbsProps {
    maxVisible?: number;
}

export function CollapsibleBreadcrumbs({
    items,
    homeHref = "/",
    showHome = false,
    maxVisible = 3,
    className,
}: CollapsibleBreadcrumbsProps) {
    // If we have more items than maxVisible, collapse the middle ones
    const shouldCollapse = items.length > maxVisible;

    let displayItems: (BreadcrumbItem | { isEllipsis: true })[];

    if (shouldCollapse) {
        // Show first, ellipsis, and last (maxVisible - 1) items
        const firstItem = items[0];
        const lastItems = items.slice(-(maxVisible - 1));
        displayItems = [firstItem, { isEllipsis: true }, ...lastItems];
    } else {
        displayItems = items;
    }

    return (
        <nav
            className={cn(
                "flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground",
                className
            )}
            aria-label="Breadcrumb"
        >
            {showHome && (
                <>
                    <Link href={homeHref}>
                        <span className="flex items-center gap-1 hover:text-foreground transition-colors">
                            <Home className="h-4 w-4" />
                        </span>
                    </Link>
                    {displayItems.length > 0 && <ChevronRight className="h-3.5 w-3.5" />}
                </>
            )}

            {displayItems.map((item, index) => (
                <span key={index} className="flex items-center gap-1.5">
                    {index > 0 && <ChevronRight className="h-3.5 w-3.5" />}
                    {"isEllipsis" in item ? (
                        <span className="text-muted-foreground">...</span>
                    ) : item.href ? (
                        <Link href={item.href}>
                            <span className="hover:text-foreground transition-colors max-w-[120px] truncate">
                                {item.label}
                            </span>
                        </Link>
                    ) : (
                        <span className="text-foreground font-medium max-w-[150px] truncate">
                            {item.label}
                        </span>
                    )}
                </span>
            ))}
        </nav>
    );
}
