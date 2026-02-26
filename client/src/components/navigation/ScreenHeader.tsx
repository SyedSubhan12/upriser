import { Link } from "wouter";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Breadcrumb {
    label: string;
    href?: string;
}

interface ScreenHeaderProps {
    title: string;
    subtitle?: string;
    backHref?: string;
    breadcrumbs?: Breadcrumb[];
    rightContent?: React.ReactNode;
    className?: string;
}

export function ScreenHeader({
    title,
    subtitle,
    backHref,
    breadcrumbs,
    rightContent,
    className,
}: ScreenHeaderProps) {
    return (
        <header className={cn("mb-6 space-y-3", className)}>
            {/* Breadcrumbs */}
            {breadcrumbs && breadcrumbs.length > 0 && (
                <nav className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
                    {breadcrumbs.map((crumb, index) => (
                        <span key={index} className="flex items-center gap-1.5">
                            {index > 0 && <ChevronRight className="h-3.5 w-3.5" />}
                            {crumb.href ? (
                                <Link
                                    href={crumb.href}
                                    className="hover:text-foreground transition-colors"
                                >
                                    {crumb.label}
                                </Link>
                            ) : (
                                <span className="text-foreground font-medium">
                                    {crumb.label}
                                </span>
                            )}
                        </span>
                    ))}
                </nav>
            )}

            {/* Title Row */}
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                    {backHref && (
                        <Link href={backHref}>
                            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                                <ChevronLeft className="h-4 w-4" />
                                <span className="sr-only">Go back</span>
                            </Button>
                        </Link>
                    )}
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                            {title}
                        </h1>
                        {subtitle && (
                            <p className="mt-1 text-muted-foreground">{subtitle}</p>
                        )}
                    </div>
                </div>
                {rightContent && <div className="shrink-0">{rightContent}</div>}
            </div>
        </header>
    );
}
