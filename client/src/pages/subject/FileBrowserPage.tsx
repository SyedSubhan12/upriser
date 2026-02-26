import { Link, useParams, useSearch } from "wouter";
import { useState, useMemo } from "react";
import { CurriculumLayout } from "@/layouts/CurriculumLayout";
import { ScreenHeader } from "@/components/navigation/ScreenHeader";
import { Breadcrumbs, type BreadcrumbItem } from "@/components/files/Breadcrumbs";
import { FolderRow } from "@/components/files/FolderRow";
import { FileRow } from "@/components/files/FileRow";
import { ScrollableFileTypeFilterBar } from "@/components/files/FileTypeFilterBar";
import { FileQuestion } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Subject, Board, Qualification, Branch, ResourceCategory, ResourceNode, FileAsset, FileType } from "@/lib/curriculumData";
import { Skeleton } from "@/components/ui/skeleton";

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

    const isLoading = contextLoading || categoriesLoading || folderNodesLoading || (filesLoading && !!folderId) || (currentFolderLoading && !!folderId);

    // Get available file types (must be before early returns)
    const availableFileTypes = useMemo(() => {
        const types = new Set<FileType>();
        files.forEach((f) => types.add(f.fileType));
        return Array.from(types);
    }, [files]);

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

    // Filter files by type (must be before early returns)
    const filteredFiles = useMemo(() => {
        return selectedFileType
            ? files.filter(f => f.fileType === selectedFileType)
            : files;
    }, [files, selectedFileType]);

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
                />

                {/* Breadcrumbs */}
                <Breadcrumbs items={breadcrumbItems} className="mt-4" />

                {/* File Type Filter */}
                {availableFileTypes.length > 0 && (
                    <section className="mt-6">
                        <ScrollableFileTypeFilterBar
                            selectedType={selectedFileType}
                            onSelect={setSelectedFileType}
                            availableTypes={availableFileTypes}
                        />
                    </section>
                )}

                {/* Content */}
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
                                        // We don't have counts easily without fetching everything
                                        // Maybe just omit for now or add a count route
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
                                    <FileRow key={file.id} file={file} />
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
            </div>
        </CurriculumLayout>
    );
}
