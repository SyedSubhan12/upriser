import { Link } from "wouter";
import { ArrowRight, GraduationCap, BookOpen, Globe, Building2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Board } from "@/lib/curriculumData";

// Icon mapping for boards
const boardIcons: Record<string, typeof GraduationCap> = {
    caie: GraduationCap,
    pearson: BookOpen,
    ib: Globe,
    ocr: Building2,
    aqa: Building2,
    wjec: Building2,
    ccea: Building2,
};

// Color styling for boards
const boardColors: Record<string, { bg: string; text: string; border: string }> = {
    caie: {
        bg: "from-blue-500/10 to-blue-600/5 hover:from-blue-500/20 hover:to-blue-600/10",
        text: "text-blue-600 dark:text-blue-400",
        border: "border-blue-500/20 hover:border-blue-500/40",
    },
    pearson: {
        bg: "from-purple-500/10 to-purple-600/5 hover:from-purple-500/20 hover:to-purple-600/10",
        text: "text-purple-600 dark:text-purple-400",
        border: "border-purple-500/20 hover:border-purple-500/40",
    },
    ib: {
        bg: "from-amber-500/10 to-amber-600/5 hover:from-amber-500/20 hover:to-amber-600/10",
        text: "text-amber-600 dark:text-amber-400",
        border: "border-amber-500/20 hover:border-amber-500/40",
    },
    ocr: {
        bg: "from-green-500/10 to-green-600/5 hover:from-green-500/20 hover:to-green-600/10",
        text: "text-green-600 dark:text-green-400",
        border: "border-green-500/20 hover:border-green-500/40",
    },
    aqa: {
        bg: "from-red-500/10 to-red-600/5 hover:from-red-500/20 hover:to-red-600/10",
        text: "text-red-600 dark:text-red-400",
        border: "border-red-500/20 hover:border-red-500/40",
    },
    wjec: {
        bg: "from-teal-500/10 to-teal-600/5 hover:from-teal-500/20 hover:to-teal-600/10",
        text: "text-teal-600 dark:text-teal-400",
        border: "border-teal-500/20 hover:border-teal-500/40",
    },
    ccea: {
        bg: "from-orange-500/10 to-orange-600/5 hover:from-orange-500/20 hover:to-orange-600/10",
        text: "text-orange-600 dark:text-orange-400",
        border: "border-orange-500/20 hover:border-orange-500/40",
    },
};

const defaultColors = {
    bg: "from-gray-500/10 to-gray-600/5 hover:from-gray-500/20 hover:to-gray-600/10",
    text: "text-gray-600 dark:text-gray-400",
    border: "border-gray-500/20 hover:border-gray-500/40",
};

interface BoardTileProps {
    board: Board;
    className?: string;
}

export function BoardTile({ board, className }: BoardTileProps) {
    const Icon = boardIcons[board.boardKey] || Building2;
    const colors = boardColors[board.boardKey] || defaultColors;

    return (
        <Link href={`/curriculum/${board.boardKey}`}>
            <Card
                className={cn(
                    "group cursor-pointer transition-all duration-300 bg-gradient-to-br border-2",
                    colors.bg,
                    colors.border,
                    "hover:shadow-lg hover:-translate-y-0.5",
                    className
                )}
            >
                <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                        {board.logoUrl ? (
                            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-white p-2 shadow-sm">
                                <img
                                    src={board.logoUrl}
                                    alt={board.displayName}
                                    className="h-full w-full object-contain"
                                />
                            </div>
                        ) : (
                            <div
                                className={cn(
                                    "flex h-12 w-12 items-center justify-center rounded-xl bg-background/80",
                                    colors.text
                                )}
                            >
                                <Icon className="h-6 w-6" />
                            </div>
                        )}
                        <ArrowRight
                            className={cn(
                                "h-5 w-5 text-muted-foreground opacity-0 transition-all",
                                "group-hover:opacity-100 group-hover:translate-x-1"
                            )}
                        />
                    </div>
                    <CardTitle className={cn("mt-4 text-xl", colors.text)}>
                        {board.displayName}
                    </CardTitle>
                    <CardDescription className="text-sm">
                        {board.fullName}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                        {board.description}
                    </p>
                </CardContent>
            </Card>
        </Link>
    );
}

// Compact version for list views
interface BoardTileCompactProps {
    board: Board;
    className?: string;
}

export function BoardTileCompact({ board, className }: BoardTileCompactProps) {
    const Icon = boardIcons[board.boardKey] || Building2;
    const colors = boardColors[board.boardKey] || defaultColors;

    return (
        <Link href={`/curriculum/${board.boardKey}`}>
            <Card
                className={cn(
                    "group cursor-pointer transition-all duration-200",
                    "hover:border-primary/50 hover:shadow-md",
                    className
                )}
            >
                <CardContent className="flex items-center gap-4 p-4">
                    {board.logoUrl ? (
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-white p-1.5 border">
                            <img
                                src={board.logoUrl}
                                alt={board.displayName}
                                className="h-full w-full object-contain"
                            />
                        </div>
                    ) : (
                        <div
                            className={cn(
                                "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted",
                                colors.text
                            )}
                        >
                            <Icon className="h-5 w-5" />
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold">{board.displayName}</h3>
                        <p className="text-sm text-muted-foreground truncate">
                            {board.fullName}
                        </p>
                    </div>
                    <ArrowRight
                        className={cn(
                            "h-5 w-5 shrink-0 text-muted-foreground opacity-0 transition-all",
                            "group-hover:opacity-100 group-hover:translate-x-1"
                        )}
                    />
                </CardContent>
            </Card>
        </Link>
    );
}

// Export helper to get board icon
export function getBoardIcon(boardKey: string) {
    return boardIcons[boardKey] || Building2;
}

// Export helper to get board colors
export function getBoardColors(boardKey: string) {
    return boardColors[boardKey] || defaultColors;
}
