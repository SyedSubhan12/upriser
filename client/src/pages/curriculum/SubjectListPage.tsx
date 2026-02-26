import { Link, useParams } from "wouter";
import { useState, useMemo } from "react";
import { CurriculumLayout } from "@/layouts/CurriculumLayout";
import { ScreenHeader } from "@/components/navigation/ScreenHeader";
import { SearchBar } from "@/components/common/SearchBar";
import { ScrollableFilterChips } from "@/components/common/FilterChips";
import { SubjectRow } from "@/components/curriculum/SubjectRow";
import { useQuery } from "@tanstack/react-query";
import type { Board, Qualification, Branch, Subject } from "@/lib/curriculumData";
import { Skeleton } from "@/components/ui/skeleton";

export function SubjectListPage() {
    const { boardKey, qualKey, branchKey } = useParams<{
        boardKey: string;
        qualKey: string;
        branchKey?: string;
    }>();

    const [searchQuery, setSearchQuery] = useState("");
    const [selectedVersionTag, setSelectedVersionTag] = useState<string | null>(null);

    // Fetch context data
    const { data: boards = [], isLoading: boardsLoading } = useQuery<Board[]>({
        queryKey: ["/api/curriculum/boards"],
    });
    const board = boards.find(b => b.boardKey === boardKey);

    const { data: qualifications = [], isLoading: qualsLoading } = useQuery<Qualification[]>({
        queryKey: [`/api/curriculum/boards/${boardKey}/qualifications`],
        enabled: !!boardKey,
    });
    const qualification = qualifications.find(q => q.qualKey === qualKey);

    const { data: branches = [], isLoading: branchesLoading } = useQuery<Branch[]>({
        queryKey: [`/api/curriculum/qualifications/${qualification?.id}/branches`],
        enabled: !!qualification?.id && qualification.hasBranching,
    });
    const branch = branches.find(b => b.branchKey === branchKey);

    // Fetch subjects
    const { data: subjects = [], isLoading: subjectsLoading } = useQuery<Subject[]>({
        queryKey: [
            `/api/curriculum/qualifications/${qualification?.id}/subjects`,
            { branchId: branch?.id }
        ],
        enabled: !!qualification?.id,
    });

    const isLoading = boardsLoading || qualsLoading || (branchesLoading && !!qualification?.hasBranching) || subjectsLoading;

    // Filter subjects by search and version tag
    const filteredSubjects = useMemo(() => {
        let result = subjects;

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(
                (s) =>
                    s.subjectName.toLowerCase().includes(query) ||
                    s.subjectCode?.toLowerCase().includes(query) ||
                    s.description?.toLowerCase().includes(query)
            );
        }

        if (selectedVersionTag) {
            result = result.filter((s) => s.versionTag === selectedVersionTag);
        }

        return result;
    }, [subjects, searchQuery, selectedVersionTag]);

    // Available version tags for filtering
    const versionTags = useMemo(() => {
        return Array.from(new Set(subjects.map(s => s.versionTag).filter(Boolean) as string[]));
    }, [subjects]);

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
                    <div className="mt-10 space-y-4">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <Skeleton key={i} className="h-16 rounded-lg" />
                        ))}
                    </div>
                </div>
            </CurriculumLayout>
        );
    }

    // Build breadcrumbs
    const breadcrumbs: { label: string; href?: string }[] = [
        { label: "Curriculum", href: "/curriculum" },
        { label: board!.displayName, href: `/curriculum/${boardKey}` },
    ];

    if (branch) {
        breadcrumbs.push({
            label: qualification!.displayName,
            href: `/curriculum/${boardKey}/${qualKey}/branch`,
        });
        breadcrumbs.push({ label: branch.displayName });
    } else {
        breadcrumbs.push({ label: qualification!.displayName });
    }

    // Version tag chips
    const versionChips = versionTags.map((tag) => ({
        key: tag,
        label: tag,
    }));

    return (
        <CurriculumLayout>
            <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-12">
                <ScreenHeader
                    title={`${qualification!.displayName} Subjects`}
                    subtitle={`${board!.displayName}${branch ? ` • ${branch.displayName}` : ""}`}
                    backHref={
                        branch
                            ? `/curriculum/${boardKey}/${qualKey}/branch`
                            : `/curriculum/${boardKey}`
                    }
                    breadcrumbs={breadcrumbs}
                />

                {/* Search and Filters */}
                <div className="mt-6 space-y-4">
                    <SearchBar
                        value={searchQuery}
                        onChange={setSearchQuery}
                        placeholder="Search subjects by name or code..."
                    />

                    {versionChips.length > 1 && (
                        <ScrollableFilterChips
                            chips={versionChips}
                            selectedKey={selectedVersionTag}
                            onSelect={setSelectedVersionTag}
                            allLabel="All Versions"
                        />
                    )}
                </div>

                {/* Subjects List */}
                <section className="mt-8">
                    {filteredSubjects.length === 0 ? (
                        <div className="rounded-lg border border-dashed p-8 text-center">
                            <p className="text-muted-foreground">
                                {searchQuery || selectedVersionTag
                                    ? "No subjects match your filters"
                                    : "No subjects available"}
                            </p>
                            {(searchQuery || selectedVersionTag) && (
                                <button
                                    onClick={() => {
                                        setSearchQuery("");
                                        setSelectedVersionTag(null);
                                    }}
                                    className="mt-2 text-sm text-primary hover:underline"
                                >
                                    Clear filters
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <p className="text-sm text-muted-foreground">
                                {filteredSubjects.length} subject{filteredSubjects.length !== 1 ? "s" : ""}
                            </p>
                            <div className="space-y-2">
                                {filteredSubjects.map((subject) => (
                                    <SubjectRow key={subject.id} subject={subject} />
                                ))}
                            </div>
                        </div>
                    )}
                </section>
            </div>
        </CurriculumLayout>
    );
}
