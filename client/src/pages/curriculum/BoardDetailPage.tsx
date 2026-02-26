import { Link, useParams } from "wouter";
import { CurriculumLayout } from "@/layouts/CurriculumLayout";
import { ScreenHeader } from "@/components/navigation/ScreenHeader";
import { QualificationCard } from "@/components/curriculum/QualificationCard";
import { getSubjectGroupsByProgram, isIBDP } from "@/lib/curriculumData";
import { getBoardIcon, getBoardColors } from "@/components/curriculum/BoardTile";
import { Card, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import type { Board, Qualification } from "@/lib/curriculumData";
import { Skeleton } from "@/components/ui/skeleton";

export function BoardDetailPage() {
    const { boardKey } = useParams<{ boardKey: string }>();

    // Fetch all boards to find the current one (could be optimized with a single board route)
    const { data: boards = [], isLoading: boardsLoading } = useQuery<Board[]>({
        queryKey: ["/api/curriculum/boards"],
    });

    const board = boards.find(b => b.boardKey === boardKey);

    const { data: qualifications = [], isLoading: qualsLoading } = useQuery<Qualification[]>({
        queryKey: [`/api/curriculum/boards/${boardKey}/qualifications`],
        enabled: !!boardKey,
    });

    const isLoading = boardsLoading || (qualsLoading && !!boardKey);

    if (!isLoading && !board) {
        return (
            <CurriculumLayout>
                <div className="flex min-h-[50vh] items-center justify-center">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold">Board Not Found</h1>
                        <p className="mt-2 text-muted-foreground">
                            The requested board does not exist.
                        </p>
                        <Link href="/curriculum" className="mt-4 inline-block text-primary hover:underline">
                            ← Back to Curriculum
                        </Link>
                    </div>
                </div>
            </CurriculumLayout>
        );
    }

    if (isLoading) {
        return (
            <CurriculumLayout>
                <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-12">
                    <Skeleton className="h-12 w-1/3" />
                    <Skeleton className="mt-4 h-6 w-1/2" />
                    <div className="mt-10 grid gap-4 sm:grid-cols-2">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <Skeleton key={i} className="h-24 rounded-xl" />
                        ))}
                    </div>
                </div>
            </CurriculumLayout>
        );
    }

    const Icon = getBoardIcon(board!.boardKey);
    const colors = getBoardColors(board!.boardKey);

    return (
        <CurriculumLayout>
            <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-12">
                <ScreenHeader
                    title={board!.displayName}
                    subtitle={board!.fullName}
                    backHref="/curriculum"
                    breadcrumbs={[
                        { label: "Curriculum", href: "/curriculum" },
                        { label: board!.displayName },
                    ]}
                />

                {/* Board Header Card */}
                <div className={cn(
                    "mt-6 rounded-xl border-2 bg-gradient-to-br p-6",
                    colors.bg, colors.border
                )}>
                    <div className="flex items-start gap-4">
                        <div className={cn(
                            "flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-background/80",
                            colors.text
                        )}>
                            <Icon className="h-7 w-7" />
                        </div>
                        <div>
                            <h2 className={cn("text-xl font-bold", colors.text)}>
                                {board!.displayName}
                            </h2>
                            <p className="mt-1 text-muted-foreground">
                                {board!.description}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Qualifications List */}
                <section className="mt-10">
                    <h2 className="mb-4 text-lg font-semibold">
                        Select {board!.boardKey === 'ib' ? 'Programme' : 'Qualification'}
                    </h2>
                    <div className="grid gap-4 sm:grid-cols-2">
                        {qualifications.map((qual) => {
                            // Special handling for IB DP - goes to subject groups
                            if (isIBDP(qual.id)) {
                                return (
                                    <IBDPCard key={qual.id} boardKey={board!.boardKey} />
                                );
                            }

                            return (
                                <QualificationCard
                                    key={qual.id}
                                    qualification={qual}
                                    boardKey={board!.boardKey}
                                />
                            );
                        })}
                    </div>
                </section>
            </div>
        </CurriculumLayout>
    );
}

// Special card for IB DP that goes to subject groups
function IBDPCard({ boardKey }: { boardKey: string }) {
    const subjectGroups = getSubjectGroupsByProgram('ib-dp');

    return (
        <Link href={`/curriculum/${boardKey}/dp/groups`}>
            <Card className="group cursor-pointer p-5 transition-all duration-200 hover:border-primary/50 hover:shadow-md hover:-translate-y-0.5">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg">DP (Diploma Programme)</CardTitle>
                        <CardDescription className="mt-1.5">
                            Ages 16–19 • {subjectGroups.length} Subject Groups
                        </CardDescription>
                    </div>
                    <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-1" />
                </div>
            </Card>
        </Link>
    );
}

// Legacy export for backward compatibility
export { BoardDetailPage as LevelSelectorPage };
