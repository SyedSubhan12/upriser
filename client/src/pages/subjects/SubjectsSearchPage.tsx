import { useState, useMemo } from "react";
import { CurriculumLayout } from "@/layouts/CurriculumLayout";
import { ScreenHeader } from "@/components/navigation/ScreenHeader";
import { SearchBar } from "@/components/common/SearchBar";
import { ScrollableFilterChips } from "@/components/common/FilterChips";
import { SubjectRow } from "@/components/curriculum/SubjectRow";
import { useQuery } from "@tanstack/react-query";
import type { Board, Qualification, Subject } from "@/lib/curriculumData";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getSubjectIcon } from "@/components/curriculum/SubjectRow";
import { cn } from "@/lib/utils";

export function GlobalSubjectsPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);
    const [selectedQualId, setSelectedQualId] = useState<string | null>(null);

    // Fetch data
    const { data: boards = [], isLoading: boardsLoading } = useQuery<Board[]>({
        queryKey: ["/api/curriculum/boards"],
    });

    const { data: qualifications = [], isLoading: qualsLoading } = useQuery<Qualification[]>({
        queryKey: [`/api/curriculum/boards/${selectedBoardId}/qualifications`],
        enabled: !!selectedBoardId,
    });

    const { data: allSubjects = [], isLoading: subjectsLoading } = useQuery<Subject[]>({
        queryKey: ["/api/curriculum/subjects"],
    });

    const isLoading = boardsLoading || (qualsLoading && !!selectedBoardId) || subjectsLoading;

    // Reset qualification when board changes
    const handleBoardChange = (id: string | null) => {
        setSelectedBoardId(id);
        setSelectedQualId(null);
    };

    // Filter subjects
    const filteredSubjects = useMemo(() => {
        let result = allSubjects;

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(
                (s) =>
                    s.subjectName.toLowerCase().includes(query) ||
                    s.subjectCode?.toLowerCase().includes(query) ||
                    s.description?.toLowerCase().includes(query)
            );
        }

        if (selectedBoardId) {
            result = result.filter((s) => s.boardId === selectedBoardId);
        }

        if (selectedQualId) {
            result = result.filter((s) => s.qualId === selectedQualId);
        }

        return result;
    }, [allSubjects, searchQuery, selectedBoardId, selectedQualId]);

    // Build chips
    const boardChips = boards.map((b) => ({
        key: b.id,
        label: b.displayName,
    }));

    const qualChips = qualifications.map((q) => ({
        key: q.id,
        label: q.displayName,
    }));

    return (
        <CurriculumLayout>
            <div className="mx-auto max-w-7xl px-4 py-5 sm:py-8 md:px-6 md:py-12">
                <ScreenHeader
                    title="Search Subjects"
                    subtitle="Find subjects across all boards and qualifications"
                    className="mb-4 space-y-2 md:mb-6 md:space-y-3"
                />

                {/* Search and Filters */}
                <div className="mt-4 space-y-4 md:mt-6">
                    <SearchBar
                        value={searchQuery}
                        onChange={setSearchQuery}
                        placeholder="Search by subject name or code..."
                        autoFocus
                    />

                    {/* Board Filter */}
                    <div>
                        <label className="mb-2 block text-sm font-medium text-muted-foreground">
                            Filter by Board
                        </label>
                        <ScrollableFilterChips
                            chips={boardChips}
                            selectedKey={selectedBoardId}
                            onSelect={handleBoardChange}
                            allLabel="All Boards"
                        />
                    </div>

                    {/* Qualification Filter (only when board selected) */}
                    {selectedBoardId && qualChips.length > 0 && (
                        <div>
                            <label className="mb-2 block text-sm font-medium text-muted-foreground">
                                Filter by Qualification
                            </label>
                            <ScrollableFilterChips
                                chips={qualChips}
                                selectedKey={selectedQualId}
                                onSelect={setSelectedQualId}
                                allLabel="All Qualifications"
                            />
                        </div>
                    )}
                </div>

                {/* Results */}
                <section className="mt-8">
                    {isLoading ? (
                        <div className="space-y-4">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <Skeleton key={i} className="h-16 rounded-lg" />
                            ))}
                        </div>
                    ) : filteredSubjects.length === 0 ? (
                        <div className="rounded-lg border border-dashed p-8 text-center">
                            <p className="text-muted-foreground">
                                {searchQuery || selectedBoardId
                                    ? "No subjects match your search"
                                    : "No subjects available"}
                            </p>
                            {(searchQuery || selectedBoardId) && (
                                <button
                                    onClick={() => {
                                        setSearchQuery("");
                                        setSelectedBoardId(null);
                                        setSelectedQualId(null);
                                    }}
                                    className="mt-2 text-sm text-primary hover:underline"
                                >
                                    Clear all filters
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <p className="text-sm text-muted-foreground">
                                {filteredSubjects.length} subject{filteredSubjects.length !== 1 ? "s" : ""} found
                            </p>
                            <div className="space-y-2">
                                {filteredSubjects.map((subject) => (
                                    <SubjectRowWithContext
                                        key={subject.id}
                                        subject={subject}
                                        boards={boards}
                                        qualifications={qualifications}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </section>
            </div>
        </CurriculumLayout>
    );
}

// Subject row with board/qualification context
function SubjectRowWithContext({
    subject,
    boards,
    qualifications
}: {
    subject: Subject;
    boards: Board[];
    qualifications: Qualification[];
}) {
    const board = boards.find(b => b.id === subject.boardId);
    // Note: qualification might not be in the current filtered list if we searched across all
    // So we might need to fetch it or just display board and version
    const Icon = getSubjectIcon(subject.icon || "book");

    return (
        <Link href={`/subject/${subject.id}`}>
            <div className={cn(
                "group flex items-center gap-4 rounded-lg border p-4 transition-all",
                "hover:border-primary/50 hover:bg-muted/50 hover:shadow-sm"
            )}>
                {/* Icon */}
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium">{subject.subjectName}</h3>
                        {subject.subjectCode && (
                            <Badge variant="secondary" className="text-xs">
                                {subject.subjectCode}
                            </Badge>
                        )}
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-sm text-muted-foreground">
                        {board && <span>{board.displayName}</span>}
                        {subject.versionTag && (
                            <>
                                {board && <span>•</span>}
                                <span>{subject.versionTag}</span>
                            </>
                        )}
                    </div>
                </div>

                {/* Arrow */}
                <ArrowRight className={cn(
                    "h-5 w-5 shrink-0 text-muted-foreground transition-all",
                    "group-hover:translate-x-1 group-hover:text-foreground"
                )} />
            </div>
        </Link>
    );
}

// Export as SubjectsSearchPage for backward compatibility
export { GlobalSubjectsPage as SubjectsSearchPage };
