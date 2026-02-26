import { Link, useParams } from "wouter";
import { useState, useMemo } from "react";
import { CurriculumLayout } from "@/layouts/CurriculumLayout";
import { ScreenHeader } from "@/components/navigation/ScreenHeader";
import { FolderRow } from "@/components/files/FolderRow";
import { FileRow, getUniqueFileTypes } from "@/components/files/FileRow";
import { ScrollableFileTypeFilterBar } from "@/components/files/FileTypeFilterBar";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Calendar, ListTree, CheckCircle, FileQuestion } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import type { Subject, Board, Qualification, Branch, ResourceCategory, ResourceNode, FileAsset, FileType } from "@/lib/curriculumData";
import { Skeleton } from "@/components/ui/skeleton";

interface SubjectContext {
    subject: Subject;
    board: Board;
    qualification: Qualification;
    branch?: Branch;
}

// Past papers modes
const pastPapersModes = [
    { key: "yearly", label: "Yearly", icon: Calendar, description: "Papers organized by year and session" },
    { key: "topical", label: "Topical", icon: ListTree, description: "Papers organized by topic" },
    { key: "solved_yearly", label: "Solved Yearly", icon: CheckCircle, description: "Yearly papers with worked solutions" },
    { key: "solved_topical", label: "Solved Topical", icon: CheckCircle, description: "Topical papers with worked solutions" },
];

export function ResourceListPage() {
    const { subjectId, resourceKey } = useParams<{ subjectId: string; resourceKey: string }>();
    const [selectedFileType, setSelectedFileType] = useState<FileType | null>(null);

    // Fetch context
    const { data: context, isLoading: contextLoading } = useQuery<SubjectContext>({
        queryKey: [`/api/curriculum/subjects/${subjectId}/context`],
        enabled: !!subjectId,
    });

    const { data: categories = [], isLoading: categoriesLoading } = useQuery<ResourceCategory[]>({
        queryKey: ["/api/curriculum/resource-categories"],
    });
    const category = categories.find(c => c.resourceKey === resourceKey);

    // Fetch root nodes
    const { data: rootNodes = [], isLoading: rootNodesLoading } = useQuery<ResourceNode[]>({
        queryKey: [`/api/curriculum/subjects/${subjectId}/resource-nodes`, { resourceKey, parentNodeId: null }],
        enabled: !!subjectId && !!resourceKey,
    });

    // Fetch all files for this resource category
    const { data: allFiles = [], isLoading: filesLoading } = useQuery<FileAsset[]>({
        queryKey: [`/api/curriculum/subjects/${subjectId}/resource/${resourceKey}/files`],
        enabled: !!subjectId && !!resourceKey,
    });

    const isLoading = contextLoading || categoriesLoading || rootNodesLoading || filesLoading;

    if (!isLoading && (!context || !category)) {
        return (
            <CurriculumLayout>
                <div className="flex min-h-[50vh] items-center justify-center">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold">Not Found</h1>
                        <p className="mt-2 text-muted-foreground">
                            The requested resource does not exist.
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
                    <div className="mt-10 space-y-4">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <Skeleton key={i} className="h-16 rounded-lg" />
                        ))}
                    </div>
                </div>
            </CurriculumLayout>
        );
    }

    const { subject } = context!;

    // Get available file types for filtering
    const availableFileTypes = getUniqueFileTypes(allFiles);

    // Filter files by type
    const filteredFiles = selectedFileType
        ? allFiles.filter(f => f.fileType === selectedFileType)
        : allFiles;

    // Check if this is past papers (special modes)
    const isPastPapers = resourceKey === "past_papers";

    // Build breadcrumbs
    const breadcrumbs = [
        { label: subject.subjectName, href: `/subject/${subject.id}` },
        { label: category!.displayName },
    ];

    return (
        <CurriculumLayout>
            <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-12">
                <ScreenHeader
                    title={category!.displayName}
                    subtitle={subject.subjectName}
                    backHref={`/subject/${subject.id}`}
                    breadcrumbs={breadcrumbs}
                />

                {/* Past Papers Modes */}
                {isPastPapers && (
                    <section className="mt-6">
                        <h2 className="mb-4 text-lg font-semibold">Browse Mode</h2>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            {pastPapersModes.map((mode) => (
                                <PastPapersModeCard
                                    key={mode.key}
                                    mode={mode}
                                    subjectId={subject.id}
                                    resourceKey={resourceKey!}
                                />
                            ))}
                        </div>
                    </section>
                )}

                {/* File Type Filter */}
                {availableFileTypes.length > 0 && (
                    <section className="mt-8">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold">Filter by Type</h2>
                        </div>
                        <ScrollableFileTypeFilterBar
                            selectedType={selectedFileType}
                            onSelect={setSelectedFileType}
                            availableTypes={availableFileTypes}
                            className="mt-3"
                        />
                    </section>
                )}

                {/* Folders */}
                {rootNodes.length > 0 && (
                    <section className="mt-8">
                        <h2 className="mb-4 text-lg font-semibold">Folders</h2>
                        <div className="space-y-2">
                            {rootNodes.map((node) => {
                                return (
                                    <FolderRow
                                        key={node.id}
                                        node={node}
                                        href={`/subject/${subject.id}/files?resource=${resourceKey}&folder=${node.id}`}
                                    // We don't have child counts easily without fetching everything
                                    />
                                );
                            })}
                        </div>
                    </section>
                )}

                {/* Direct Files */}
                {filteredFiles.length > 0 && (
                    <section className="mt-8">
                        <h2 className="mb-4 text-lg font-semibold">
                            Files {selectedFileType && `(${selectedFileType.toUpperCase()})`}
                        </h2>
                        <div className="space-y-2">
                            {filteredFiles.map((file) => (
                                <FileRow key={file.id} file={file} />
                            ))}
                        </div>
                    </section>
                )}

                {/* Empty State */}
                {rootNodes.length === 0 && allFiles.length === 0 && (
                    <div className="mt-8 rounded-lg border border-dashed p-8 text-center">
                        <FileQuestion className="mx-auto h-12 w-12 text-muted-foreground" />
                        <p className="mt-4 text-muted-foreground">
                            No resources available yet
                        </p>
                    </div>
                )}
            </div>
        </CurriculumLayout>
    );
}

// Past papers mode card
function PastPapersModeCard({
    mode,
    subjectId,
    resourceKey,
}: {
    mode: typeof pastPapersModes[0];
    subjectId: string;
    resourceKey: string;
}) {
    const href = `/subject/${subjectId}/files?resource=${resourceKey}&mode=${mode.key}`;

    return (
        <Link href={href}>
            <Card className={cn(
                "group cursor-pointer transition-all duration-200",
                "hover:border-primary/50 hover:shadow-md hover:-translate-y-0.5"
            )}>
                <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <mode.icon className="h-5 w-5" />
                        </div>
                        <ArrowRight className={cn(
                            "h-5 w-5 text-muted-foreground opacity-0 transition-all",
                            "group-hover:opacity-100 group-hover:translate-x-1"
                        )} />
                    </div>
                    <h3 className="mt-3 font-medium">{mode.label}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{mode.description}</p>
                </CardContent>
            </Card>
        </Link>
    );
}
