import { Link, useParams } from "wouter";
import { CurriculumLayout } from "@/layouts/CurriculumLayout";
import { ScreenHeader } from "@/components/navigation/ScreenHeader";
import { ResourceCardGrid } from "@/components/resource/ResourceCard";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import type { Subject, Board, Qualification, Branch, ResourceCategory } from "@/lib/curriculumData";
import { Skeleton } from "@/components/ui/skeleton";

interface SubjectContext {
    subject: Subject;
    board: Board;
    qualification: Qualification;
    branch?: Branch;
    resourceCounts: Record<string, number>;
}

export function SubjectResourceHub() {
    const { subjectId } = useParams<{ subjectId: string }>();

    const { data: context, isLoading: contextLoading } = useQuery<SubjectContext>({
        queryKey: [`/api/curriculum/subjects/${subjectId}/context`],
        enabled: !!subjectId,
    });

    const { data: categories = [], isLoading: categoriesLoading } = useQuery<ResourceCategory[]>({
        queryKey: ["/api/curriculum/resource-categories"],
    });

    const isLoading = contextLoading || categoriesLoading;

    if (!isLoading && !context) {
        return (
            <CurriculumLayout>
                <div className="flex min-h-[50vh] items-center justify-center">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold">Subject Not Found</h1>
                        <p className="mt-2 text-muted-foreground">
                            The requested subject does not exist.
                        </p>
                        <Link href="/subjects" className="mt-4 inline-block text-primary hover:underline">
                            ← Search Subjects
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
                            <Skeleton key={i} className="h-32 rounded-xl" />
                        ))}
                    </div>
                </div>
            </CurriculumLayout>
        );
    }

    const { subject, board, qualification, branch, resourceCounts = {} } = context!;

    // Build breadcrumbs
    const breadcrumbs: { label: string; href?: string }[] = [
        { label: "Curriculum", href: "/curriculum" },
    ];

    if (board) {
        breadcrumbs.push({ label: board.displayName, href: `/curriculum/${board.boardKey}` });
    }

    if (qualification && board) {
        if (branch) {
            breadcrumbs.push({
                label: qualification.displayName,
                href: `/curriculum/${board.boardKey}/${qualification.qualKey}/branch`,
            });
            breadcrumbs.push({
                label: branch.displayName,
                href: `/curriculum/${board.boardKey}/${qualification.qualKey}/${branch.branchKey}/subjects`,
            });
        } else {
            breadcrumbs.push({
                label: qualification.displayName,
                href: `/curriculum/${board.boardKey}/${qualification.qualKey}/subjects`,
            });
        }
    }

    breadcrumbs.push({ label: subject.subjectName });

    // Back href
    const backHref = (() => {
        if (!board || !qualification) return "/subjects";
        if (branch) {
            return `/curriculum/${board.boardKey}/${qualification.qualKey}/${branch.branchKey}/subjects`;
        }
        return `/curriculum/${board.boardKey}/${qualification.qualKey}/subjects`;
    })();

    return (
        <CurriculumLayout>
            <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-12">
                <ScreenHeader
                    title={subject.subjectName}
                    backHref={backHref}
                    breadcrumbs={breadcrumbs}
                />

                {/* Subject Info */}
                <div className="mt-4 flex flex-wrap items-center gap-2">
                    {board && (
                        <Badge variant="default" className="bg-primary/10 text-primary hover:bg-primary/20">
                            {board.displayName}
                        </Badge>
                    )}
                    {qualification && (
                        <Badge variant="secondary">
                            {qualification.displayName}
                        </Badge>
                    )}
                    {subject.subjectCode && (
                        <Badge variant="outline">
                            {subject.subjectCode}
                        </Badge>
                    )}
                    {subject.versionTag && (
                        <Badge variant="outline">
                            {subject.versionTag}
                        </Badge>
                    )}
                </div>

                {subject.description && (
                    <p className="mt-4 max-w-3xl text-muted-foreground">
                        {subject.description}
                    </p>
                )}

                {/* Resource Categories Grid */}
                <section className="mt-10">
                    <h2 className="mb-4 text-lg font-semibold">Resources</h2>
                    <ResourceCardGrid
                        categories={categories}
                        subjectId={subject.id}
                        counts={resourceCounts}
                        hideEmpty={false} // Show all categories even if empty for now
                    />
                </section>

                {/* Quick Stats */}
                <section className="mt-10 rounded-lg border bg-muted/30 p-6">
                    <h3 className="font-semibold">Quick Overview</h3>
                    <div className="mt-4 grid gap-4 sm:grid-cols-3">
                        <div>
                            <p className="text-2xl font-bold text-primary">
                                {Object.values(resourceCounts).reduce((a, b) => a + (b || 0), 0)}
                            </p>
                            <p className="text-sm text-muted-foreground">Total Resources</p>
                        </div>
                        <div>
                            <p className="text-2xl font-bold">
                                {resourceCounts.past_papers || 0}
                            </p>
                            <p className="text-sm text-muted-foreground">Past Papers</p>
                        </div>
                        <div>
                            <p className="text-2xl font-bold">
                                {resourceCounts.notes || 0}
                            </p>
                            <p className="text-sm text-muted-foreground">Study Notes</p>
                        </div>
                    </div>
                </section>
            </div>
        </CurriculumLayout>
    );
}

// Keep old export name for backward compatibility
export { SubjectResourceHub as SubjectDashboard };
