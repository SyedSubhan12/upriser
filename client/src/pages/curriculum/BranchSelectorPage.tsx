import { Link, useParams } from "wouter";
import { CurriculumLayout } from "@/layouts/CurriculumLayout";
import { ScreenHeader } from "@/components/navigation/ScreenHeader";
import { BranchSelector } from "@/components/curriculum/BranchSelector";
import { useQuery } from "@tanstack/react-query";
import type { Board, Qualification, Branch } from "@/lib/curriculumData";
import { Skeleton } from "@/components/ui/skeleton";

export function BranchSelectorPage() {
    const { boardKey, qualKey } = useParams<{ boardKey: string; qualKey: string }>();

    // Fetch all boards to find the current one
    const { data: boards = [], isLoading: boardsLoading } = useQuery<Board[]>({
        queryKey: ["/api/curriculum/boards"],
    });
    const board = boards.find(b => b.boardKey === boardKey);

    // Fetch qualifications for the board to find the current one
    const { data: qualifications = [], isLoading: qualsLoading } = useQuery<Qualification[]>({
        queryKey: [`/api/curriculum/boards/${boardKey}/qualifications`],
        enabled: !!boardKey,
    });
    const qualification = qualifications.find(q => q.qualKey === qualKey);

    // Fetch branches for the qualification
    const { data: branches = [], isLoading: branchesLoading } = useQuery<Branch[]>({
        queryKey: [`/api/curriculum/qualifications/${qualification?.id}/branches`],
        enabled: !!qualification?.id,
    });

    const isLoading = boardsLoading || qualsLoading || (branchesLoading && !!qualification);

    if (!isLoading && (!board || !qualification)) {
        return (
            <CurriculumLayout>
                <div className="flex min-h-[50vh] items-center justify-center">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold">Not Found</h1>
                        <p className="mt-2 text-muted-foreground">
                            The requested qualification does not exist.
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
                        <Skeleton className="h-32 rounded-xl" />
                        <Skeleton className="h-32 rounded-xl" />
                    </div>
                </div>
            </CurriculumLayout>
        );
    }

    // If no branching, redirect to subjects directly
    if (!qualification!.hasBranching || branches.length === 0) {
        return (
            <CurriculumLayout>
                <div className="flex min-h-[50vh] items-center justify-center">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold">No Branches Available</h1>
                        <p className="mt-2 text-muted-foreground">
                            This qualification doesn't have Current/Legacy branches.
                        </p>
                        <Link
                            href={`/curriculum/${boardKey}/${qualKey}/subjects`}
                            className="mt-4 inline-block text-primary hover:underline"
                        >
                            View Subjects →
                        </Link>
                    </div>
                </div>
            </CurriculumLayout>
        );
    }

    return (
        <CurriculumLayout>
            <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-12">
                <ScreenHeader
                    title={qualification!.displayName}
                    subtitle={`${board!.displayName} • Choose specification version`}
                    backHref={`/curriculum/${boardKey}`}
                    breadcrumbs={[
                        { label: "Curriculum", href: "/curriculum" },
                        { label: board!.displayName, href: `/curriculum/${boardKey}` },
                        { label: qualification!.displayName },
                    ]}
                />

                {/* Branch Selection */}
                <section className="mt-8">
                    <h2 className="mb-2 text-lg font-semibold">Select Specification</h2>
                    <p className="mb-6 text-muted-foreground">
                        Choose between the current specification or legacy materials
                    </p>

                    <BranchSelector
                        branches={branches}
                        boardKey={boardKey || ""}
                        qualKey={qualKey || ""}
                    />
                </section>

                {/* Info about branches */}
                <section className="mt-10 rounded-lg border bg-muted/30 p-6">
                    <h3 className="font-semibold">What's the difference?</h3>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <div>
                            <h4 className="font-medium text-primary">Current Specification</h4>
                            <p className="mt-1 text-sm text-muted-foreground">
                                The latest syllabus and exam format. Use this if you're
                                currently studying or will be taking exams in upcoming sessions.
                            </p>
                        </div>
                        <div>
                            <h4 className="font-medium">Legacy Specification</h4>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Previous syllabus materials. Useful for additional practice
                                or if you're completing a qualification under the old format.
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </CurriculumLayout>
    );
}
