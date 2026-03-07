import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { Board } from "@/lib/curriculumData";

// Color themes for each board
const boardThemes: Record<
    string,
    {
        gradient: string;
        iconBg: string;
        accent: string;
        glow: string;
    }
> = {
    caie: {
        gradient:
            "from-blue-500/10 via-blue-400/5 to-transparent dark:from-blue-500/20 dark:via-blue-400/10 dark:to-transparent",
        iconBg: "bg-blue-100 dark:bg-blue-900/40",
        accent: "text-blue-600 dark:text-blue-400",
        glow: "group-hover/bento:shadow-blue-500/20",
    },
    pearson: {
        gradient:
            "from-purple-500/10 via-purple-400/5 to-transparent dark:from-purple-500/20 dark:via-purple-400/10 dark:to-transparent",
        iconBg: "bg-purple-100 dark:bg-purple-900/40",
        accent: "text-purple-600 dark:text-purple-400",
        glow: "group-hover/bento:shadow-purple-500/20",
    },
    ib: {
        gradient:
            "from-amber-500/10 via-amber-400/5 to-transparent dark:from-amber-500/20 dark:via-amber-400/10 dark:to-transparent",
        iconBg: "bg-amber-100 dark:bg-amber-900/40",
        accent: "text-amber-600 dark:text-amber-400",
        glow: "group-hover/bento:shadow-amber-500/20",
    },
};

const defaultTheme = {
    gradient:
        "from-gray-500/10 via-gray-400/5 to-transparent dark:from-gray-500/20 dark:via-gray-400/10 dark:to-transparent",
    iconBg: "bg-gray-100 dark:bg-gray-900/40",
    accent: "text-gray-600 dark:text-gray-400",
    glow: "group-hover/bento:shadow-gray-500/20",
};

// Board header with gradient and animated elements
function BoardHeader({
    board,
    theme,
}: {
    board: Board;
    theme: (typeof boardThemes)[string];
}) {
    return (
        <div
            className={cn(
                "relative flex h-full min-h-[8rem] items-center justify-center rounded-xl bg-gradient-to-br overflow-hidden",
                theme.gradient
            )}
        >
            {/* Subtle animated pattern */}
            <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]">
                <div
                    className="h-full w-full"
                    style={{
                        backgroundImage:
                            "radial-gradient(circle at 25% 25%, currentColor 1px, transparent 1px), radial-gradient(circle at 75% 75%, currentColor 1px, transparent 1px)",
                        backgroundSize: "24px 24px",
                    }}
                />
            </div>

            {/* Logo */}
            {board.logoUrl ? (
                <div className="relative z-10 flex h-20 w-20 items-center justify-center rounded-2xl bg-white/90 dark:bg-white/10 backdrop-blur-sm p-3 shadow-lg transition-transform duration-300 group-hover/bento:scale-110">
                    <img
                        src={board.logoUrl}
                        alt={board.displayName}
                        className="h-full w-full object-contain"
                    />
                </div>
            ) : (
                <div
                    className={cn(
                        "relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl text-2xl font-bold backdrop-blur-sm shadow-lg transition-transform duration-300 group-hover/bento:scale-110",
                        theme.iconBg,
                        theme.accent
                    )}
                >
                    {board.displayName[0]}
                </div>
            )}

            {/* Floating accent orb */}
            <div
                className={cn(
                    "absolute -top-6 -right-6 h-24 w-24 rounded-full blur-2xl opacity-30 transition-opacity duration-300 group-hover/bento:opacity-50",
                    theme.iconBg
                )}
            />
        </div>
    );
}

interface FeatureBoardSectionProps {
    boards: Board[];
    isLoading: boolean;
}

export function FeatureBoardSection({
    boards,
    isLoading,
}: FeatureBoardSectionProps) {
    const mainBoards = boards.filter((b) =>
        ["caie", "pearson", "ib"].includes(b.boardKey)
    );

    return (
        <section className="py-12 md:py-20 bg-background/60 backdrop-blur-sm">
            <div className="mx-auto max-w-7xl px-4 md:px-6">
                {/* Section header */}
                <div className="text-center mb-10">
                    <h2 className="text-2xl font-bold md:text-3xl">
                        Choose Your Board
                    </h2>
                    <p className="mt-2 text-muted-foreground max-w-2xl mx-auto">
                        Select your education board to access comprehensive study materials,
                        past papers, and revision resources
                    </p>
                </div>

                {/* Bento Grid */}
                {isLoading ? (
                    <BentoGrid>
                        {Array.from({ length: 3 }).map((_, i) => (
                            <Skeleton key={i} className="h-[18rem] rounded-xl" />
                        ))}
                    </BentoGrid>
                ) : (
                    <BentoGrid className="md:auto-rows-[20rem]">
                        {mainBoards.map((board) => {
                            const theme = boardThemes[board.boardKey] || defaultTheme;
                            return (
                                <Link key={board.id} href={`/curriculum/${board.boardKey}`}>
                                    <BentoGridItem
                                        className={cn(
                                            "cursor-pointer transition-all duration-300 hover:-translate-y-1",
                                            "bg-card dark:bg-card border-border/50",
                                            theme.glow
                                        )}
                                        header={<BoardHeader board={board} theme={theme} />}
                                        title={
                                            <span className={cn("text-lg", theme.accent)}>
                                                {board.displayName}
                                            </span>
                                        }
                                        description={
                                            <div className="space-y-1">
                                                <p className="text-sm font-medium text-muted-foreground">
                                                    {board.fullName}
                                                </p>
                                                <p className="text-xs text-muted-foreground/80 line-clamp-2">
                                                    {board.description}
                                                </p>
                                            </div>
                                        }
                                        icon={
                                            <ArrowRight
                                                className={cn(
                                                    "h-4 w-4 transition-transform duration-200 group-hover/bento:translate-x-1",
                                                    theme.accent
                                                )}
                                            />
                                        }
                                    />
                                </Link>
                            );
                        })}
                    </BentoGrid>
                )}

                {/* View all boards link */}
                <div className="mt-8 text-center">
                    <Link href="/curriculum">
                        <Button variant="ghost" className="text-muted-foreground">
                            View all boards
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </Link>
                </div>
            </div>
        </section>
    );
}
