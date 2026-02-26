import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { CurriculumLayout } from "@/layouts/CurriculumLayout";
import { ScreenHeader } from "@/components/navigation/ScreenHeader";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import type { Board, SubjectGroup } from "@/lib/curriculumData";
import { Skeleton } from "@/components/ui/skeleton";

export function IBSubjectGroupPage() {
    // Fetch board and groups
    const { data: boards = [], isLoading: boardsLoading } = useQuery<Board[]>({
        queryKey: ["/api/curriculum/boards"],
    });
    const board = boards.find(b => b.boardKey === "ib");

    const { data: subjectGroups = [], isLoading: groupsLoading } = useQuery<SubjectGroup[]>({
        queryKey: ["/api/curriculum/subject-groups/ib-dp"],
    });

    const isLoading = boardsLoading || groupsLoading;

    if (!isLoading && !board) {
        return (
            <CurriculumLayout>
                <div className="flex min-h-[50vh] items-center justify-center">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold">Not Found</h1>
                        <p className="mt-2 text-muted-foreground">
                            The IB board could not be found.
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
                    <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <Skeleton key={i} className="h-40 rounded-xl" />
                        ))}
                    </div>
                </div>
            </CurriculumLayout>
        );
    }

    return (
        <CurriculumLayout>
            <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-12">
                <ScreenHeader
                    title="Diploma Programme"
                    subtitle="IB • Select a subject group"
                    backHref="/curriculum/ib"
                    breadcrumbs={[
                        { label: "Curriculum", href: "/curriculum" },
                        { label: "IB", href: "/curriculum/ib" },
                        { label: "Diploma Programme" },
                    ]}
                />

                {/* Subject Groups Info */}
                <div className="mt-6 rounded-lg border bg-muted/30 p-6">
                    <h2 className="font-semibold">About IB DP Subject Groups</h2>
                    <p className="mt-2 text-muted-foreground">
                        The IB Diploma Programme requires students to choose one subject from
                        each of the first five groups, plus either a subject from Group 6 or
                        a second subject from Groups 1-4.
                    </p>
                </div>

                {/* Subject Groups Grid */}
                <section className="mt-8">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {subjectGroups.map((group) => (
                            <SubjectGroupCard key={group.id} group={group} />
                        ))}
                    </div>
                </section>
            </div>
        </CurriculumLayout>
    );
}

function SubjectGroupCard({ group }: { group: SubjectGroup }) {
    // Group colors based on order
    const groupColors: Record<number, string> = {
        1: "border-blue-500/30 bg-blue-500/5 hover:border-blue-500/50",
        2: "border-green-500/30 bg-green-500/5 hover:border-green-500/50",
        3: "border-amber-500/30 bg-amber-500/5 hover:border-amber-500/50",
        4: "border-purple-500/30 bg-purple-500/5 hover:border-purple-500/50",
        5: "border-red-500/30 bg-red-500/5 hover:border-red-500/50",
        6: "border-pink-500/30 bg-pink-500/5 hover:border-pink-500/50",
    };

    const colorClass = groupColors[group.sortOrder] || "";

    return (
        <Link href={`/curriculum/ib/dp/${group.id}`}>
            <Card className={cn(
                "group cursor-pointer transition-all duration-200",
                "hover:shadow-md hover:-translate-y-0.5",
                colorClass
            )}>
                <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                        <Badge variant="outline" className="mb-3">
                            Group {group.sortOrder}
                        </Badge>
                        <ArrowRight className={cn(
                            "h-5 w-5 text-muted-foreground opacity-0 transition-all",
                            "group-hover:opacity-100 group-hover:translate-x-1"
                        )} />
                    </div>
                    <CardTitle className="text-lg">{group.name}</CardTitle>
                    <CardDescription className="mt-2">
                        {group.description}
                    </CardDescription>
                </CardContent>
            </Card>
        </Link>
    );
}
