import { Link, useParams, useSearch } from "wouter";
import { useState, useMemo } from "react";
import { CurriculumLayout } from "@/layouts/CurriculumLayout";
import { ScreenHeader } from "@/components/navigation/ScreenHeader";
import { Breadcrumbs, type BreadcrumbItem } from "@/components/files/Breadcrumbs";
import { FolderRow } from "@/components/files/FolderRow";
import { FileRow } from "@/components/files/FileRow";
import { ScrollableFileTypeFilterBar } from "@/components/files/FileTypeFilterBar";
import { FileQuestion, LayoutGrid, List as ListIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Subject, Board, Qualification, Branch, ResourceCategory, ResourceNode, FileAsset, FileType } from "@/lib/curriculumData";
import { Skeleton } from "@/components/ui/skeleton";
import { MultiViewResourceBrowser } from "@/components/resources/MultiViewResourceBrowser";
import { Button } from "@/components/ui/button";
import { parseCAIEFilename } from "@shared/caie-utils";
import { cn } from "@/lib/utils";

interface SubjectContext {
    subject: Subject;
    board: Board;
    qualification: Qualification;
    branch?: Branch;
}

export function FileBrowserPage() {
    const { subjectId } = useParams<{ subjectId: string }>();
    const searchString = useSearch();
    const searchParams = new URLSearchParams(searchString);

    const resourceKey = searchParams.get("resource") || "past_papers";
    const folderId = searchParams.get("folder");
    const mode = searchParams.get("mode"); // yearly, topical, etc.

    const [selectedFileType, setSelectedFileType] = useState<FileType | null>(null);
    const [selectedPaper, setSelectedPaper] = useState<number | null>(null);
    const [selectedVariant, setSelectedVariant] = useState<number | null>(null);
    const [isMultiView, setIsMultiView] = useState(false);

    // Fetch context
    const { data: context, isLoading: contextLoading } = useQuery<SubjectContext>({
        queryKey: [`/api/curriculum/subjects/${subjectId}/context`],
        enabled: !!subjectId,
    });

    const { data: categories = [], isLoading: categoriesLoading } = useQuery<ResourceCategory[]>({
        queryKey: ["/api/curriculum/resource-categories"],
    });
    const category = categories.find(c => c.resourceKey === resourceKey);

    // Fetch current folder if exists
    const { data: folderNodes = [], isLoading: folderNodesLoading } = useQuery<ResourceNode[]>({
        queryKey: [`/api/curriculum/subjects/${subjectId}/resource/${resourceKey}/nodes`, { parentNodeId: folderId }],
        enabled: !!subjectId && !!resourceKey,
    });

    // Fetch files for the current folder
    const { data: files = [], isLoading: filesLoading } = useQuery<FileAsset[]>({
        queryKey: [`/api/curriculum/nodes/${folderId}/files`],
        enabled: !!folderId,
    });

    // Fetch all files for this resource category (for multi-view)
    const { data: allFiles = [], isLoading: allFilesLoading } = useQuery<FileAsset[]>({
        queryKey: [`/api/curriculum/subjects/${subjectId}/resource/${resourceKey}/files`],
        enabled: !!subjectId && !!resourceKey,
    });

    // Enrich files with CAIE metadata if missing
    const enrichedFiles = useMemo(() => {
        return files.map(file => {
            if (file.fileType !== 'other') return file;

            const parsed = parseCAIEFilename(file.title || file.fileName || "");
            if (parsed.isValid) {
                return {
                    ...file,
                    fileType: parsed.fileType,
                    year: file.year || parsed.year || undefined,
                    session: file.session || parsed.sessionCode || undefined,
                    paper: file.paper || parsed.paper || undefined,
                    variant: file.variant || parsed.variant || undefined,
                };
            }
            return file;
        });
    }, [files]);

    // Fetch all nodes if we need to find the current folder title (if folderId is set)
    // Actually, we might need a route to get a single node by ID.
    // Let's assume for now that logic will handle it or we can add it.
    // But wait, the list of nodes from parent usually contains the current node's info if we are browsing?
    // No, if we are AT folderId, we are looking at its CHILDREN.
    // We need the TITLE of folderId.
    const { data: currentFolder, isLoading: currentFolderLoading } = useQuery<ResourceNode>({
        queryKey: [`/api/curriculum/nodes/${folderId}`],
        enabled: !!folderId,
    });

    const isLoading = contextLoading || categoriesLoading || folderNodesLoading || (filesLoading && !!folderId) || (currentFolderLoading && !!folderId) || (allFilesLoading && isMultiView);

    // Get available file types (must be before early returns)
    const availableFileTypes = useMemo(() => {
        const types = new Set<FileType>();
        enrichedFiles.forEach((f) => types.add(f.fileType));
        return Array.from(types).sort();
    }, [enrichedFiles]);

    const availablePapers = useMemo(() => {
        const papers = new Set<number>();
        enrichedFiles.forEach((f) => {
            if (f.paper !== undefined && f.paper !== null) papers.add(f.paper);
        });
        return Array.from(papers).sort((a, b) => a - b);
    }, [enrichedFiles]);

    const availableVariants = useMemo(() => {
        const variants = new Set<number>();
        enrichedFiles.forEach((f) => {
            if (f.variant !== undefined && f.variant !== null) {
                // Only show variants for the selected paper if one is selected
                if (selectedPaper === null || f.paper === selectedPaper) {
                    variants.add(f.variant);
                }
            }
        });
        return Array.from(variants).sort((a, b) => a - b);
    }, [enrichedFiles, selectedPaper]);

    // Build breadcrumb trail (must be before early returns)
    const breadcrumbItems: BreadcrumbItem[] = useMemo(() => {
        if (!context || !category) return [];

        const items: BreadcrumbItem[] = [
            {
                label: category.displayName,
                href: `/subject/${context.subject.id}/resource/${resourceKey}`
            },
        ];

        if (currentFolder) {
            items.push({ label: currentFolder.title });
        }

        return items;
    }, [context, category, currentFolder, resourceKey]);

    // Filter files by type, paper, and variant (must be before early returns)
    const filteredFiles = useMemo(() => {
        return enrichedFiles.filter(f => {
            const typeMatch = !selectedFileType || f.fileType === selectedFileType;
            const paperMatch = selectedPaper === null || f.paper === selectedPaper;
            const variantMatch = selectedVariant === null || f.variant === selectedVariant;
            return typeMatch && paperMatch && variantMatch;
        });
    }, [enrichedFiles, selectedFileType, selectedPaper, selectedVariant]);

    // Find matching MS/QP pairs for multi-view redirection
    const matchingPairs = useMemo(() => {
        const pairs = new Map<string, string>(); // fileId -> relatedFileId

        enrichedFiles.forEach(f => {
            if (f.fileType !== 'qp' && f.fileType !== 'ms') return;

            const targetType = f.fileType === 'qp' ? 'ms' : 'qp';
            const related = enrichedFiles.find(other =>
                other.id !== f.id &&
                other.fileType === targetType &&
                other.year === f.year &&
                other.session === f.session &&
                other.paper === f.paper &&
                other.variant === f.variant
            );

            if (related) {
                pairs.set(f.id, related.id);
            }
        });

        return pairs;
    }, [enrichedFiles]);

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

    // Build folder href with current resource context
    const getFolderHref = (nodeId: string) => {
        const params = new URLSearchParams();
        params.set("resource", resourceKey);
        params.set("folder", nodeId);
        if (mode) params.set("mode", mode);
        return `/subject/${subject.id}/files?${params.toString()}`;
    };

    const backHref = folderId
        ? `/subject/${subject.id}/resource/${resourceKey}`
        : `/subject/${subject.id}`;

    const title = currentFolder?.title || category!.displayName;

    return (
        <CurriculumLayout>
            <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-12">
                <ScreenHeader
                    title={title}
                    subtitle={subject.subjectName}
                    backHref={backHref}
                    rightContent={
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsMultiView(!isMultiView)}
                            className="gap-2"
                        >
                            {isMultiView ? (
                                <>
                                    <ListIcon className="h-4 w-4" />
                                    <span>Standard View</span>
                                </>
                            ) : (
                                <>
                                    <LayoutGrid className="h-4 w-4" />
                                    <span>Multi-view</span>
                                </>
                            )}
                        </Button>
                    }
                />

                {/* Breadcrumbs */}
                <Breadcrumbs items={breadcrumbItems} className="mt-4" />

                {/* Filters */}
                <section className="mt-6 flex flex-col gap-4">
                    {availableFileTypes.length > 0 && (
                        <ScrollableFileTypeFilterBar
                            selectedType={selectedFileType}
                            onSelect={(type) => {
                                setSelectedFileType(type);
                                // Optional: Reset paper/variant when type changes? 
                                // Usually better to keep them if they might still apply.
                            }}
                            availableTypes={availableFileTypes}
                        />
                    )}

                    <div className="flex flex-wrap gap-4">
                        {availablePapers.length > 0 && (
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-muted-foreground mr-1">Paper:</span>
                                <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                                    <button
                                        onClick={() => setSelectedPaper(null)}
                                        className={cn(
                                            "inline-flex shrink-0 items-center justify-center rounded px-2.5 py-1 text-xs font-medium transition-colors border",
                                            selectedPaper === null
                                                ? "border-primary bg-primary text-primary-foreground"
                                                : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
                                        )}
                                    >
                                        All
                                    </button>
                                    {availablePapers.map(paper => (
                                        <button
                                            key={paper}
                                            onClick={() => {
                                                setSelectedPaper(paper);
                                                setSelectedVariant(null); // Reset variant when paper changes
                                            }}
                                            className={cn(
                                                "inline-flex shrink-0 items-center justify-center rounded px-2.5 py-1 text-xs font-medium transition-colors border",
                                                selectedPaper === paper
                                                    ? "border-primary bg-primary text-primary-foreground"
                                                    : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
                                            )}
                                        >
                                            {paper}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {availableVariants.length > 0 && (
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-muted-foreground mr-1">Variant:</span>
                                <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                                    <button
                                        onClick={() => setSelectedVariant(null)}
                                        className={cn(
                                            "inline-flex shrink-0 items-center justify-center rounded px-2.5 py-1 text-xs font-medium transition-colors border",
                                            selectedVariant === null
                                                ? "border-primary bg-primary text-primary-foreground"
                                                : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
                                        )}
                                    >
                                        All
                                    </button>
                                    {availableVariants.map(variant => (
                                        <button
                                            key={variant}
                                            onClick={() => setSelectedVariant(variant)}
                                            className={cn(
                                                "inline-flex shrink-0 items-center justify-center rounded px-2.5 py-1 text-xs font-medium transition-colors border",
                                                selectedVariant === variant
                                                    ? "border-primary bg-primary text-primary-foreground"
                                                    : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
                                            )}
                                        >
                                            {variant}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {(selectedFileType || selectedPaper || selectedVariant) && (
                            <button
                                onClick={() => {
                                    setSelectedFileType(null);
                                    setSelectedPaper(null);
                                    setSelectedVariant(null);
                                }}
                                className="text-xs text-primary hover:underline ml-auto"
                            >
                                Reset all filters
                            </button>
                        )}
                    </div>
                </section>

                {/* Content */}
                {isMultiView ? (
                    <div className="mt-8">
                        <MultiViewResourceBrowser
                            resources={allFiles.map(f => ({
                                id: f.id,
                                title: f.title || f.fileName || "Untitled Resource",
                                type: (f.fileType as string) === 'qp' || (f.fileType as string) === 'ms' ? 'past_paper' : 'notes',
                                subject: subject.subjectName,
                                year: f.year || undefined,
                                session: f.session || undefined,
                                paper: f.paper || undefined,
                                downloadCount: f.downloadCount || 0,
                                createdAt: f.createdAt || new Date().toISOString(),
                                fileSize: f.fileSize || undefined,
                            }))}
                            isLoading={isLoading}
                        />
                    </div>
                ) : (
                    <section className="mt-6 space-y-6">
                        {/* Folders */}
                        {folderNodes.length > 0 && (
                            <div>
                                <h2 className="mb-3 text-sm font-medium text-muted-foreground">
                                    Folders
                                </h2>
                                <div className="space-y-2">
                                    {folderNodes.map((node) => {
                                        return (
                                            <FolderRow
                                                key={node.id}
                                                node={node}
                                                href={getFolderHref(node.id)}
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Files */}
                        {filteredFiles.length > 0 && (
                            <div>
                                <h2 className="mb-3 text-sm font-medium text-muted-foreground">
                                    Files {selectedFileType && `(${selectedFileType.toUpperCase()})`}
                                </h2>
                                <div className="space-y-2">
                                    {filteredFiles.map((file) => (
                                        <FileRow
                                            key={file.id}
                                            file={file}
                                            relatedFileId={matchingPairs.get(file.id)}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Empty State */}
                        {folderNodes.length === 0 && files.length === 0 && (
                            <div className="rounded-lg border border-dashed p-8 text-center">
                                <FileQuestion className="mx-auto h-12 w-12 text-muted-foreground" />
                                <p className="mt-4 text-muted-foreground">
                                    This folder is empty
                                </p>
                                <Link
                                    href={`/subject/${subject.id}/resource/${resourceKey}`}
                                    className="mt-2 inline-block text-sm text-primary hover:underline"
                                >
                                    ← Back to {category!.displayName}
                                </Link>
                            </div>
                        )}
                    </section>
                )}
            </div>
        </CurriculumLayout>
    );
}
