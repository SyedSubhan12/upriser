import { useState, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    FolderOpen,
    Upload,
    Trash2,
    Plus,
    ChevronRight,
    FileText,
    Loader2,
    RefreshCw,
    Download,
    FolderPlus,
    ArrowLeft,
    FolderSearch,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
    listAdminBoards,
    fetchQualifications,
    fetchSubjectsByQualification,
    fetchResourceCategories,
    fetchResourceNodes,
    fetchFilesByNode,
    createResourceNode,
    deleteResourceNode,
    deleteFileAsset,
    uploadFileAsset,
    type AdminBoardSummary,
    type ResourceCategory,
    type ResourceNode,
    type FileAsset,
} from "@/api/admin";
import { CAIEBulkUploadDialog } from "@/components/admin/CAIEBulkUploadDialog";

// =============================================
// Breadcrumb Component
// =============================================

interface BreadcrumbItem {
    label: string;
    onClick?: () => void;
}

function AdminBreadcrumb({ items }: { items: BreadcrumbItem[] }) {
    return (
        <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-4 flex-wrap">
            {items.map((item, i) => (
                <span key={i} className="flex items-center gap-1">
                    {i > 0 && <ChevronRight className="h-3 w-3 shrink-0" />}
                    {item.onClick ? (
                        <button
                            onClick={item.onClick}
                            className="hover:text-foreground transition-colors underline-offset-4 hover:underline"
                        >
                            {item.label}
                        </button>
                    ) : (
                        <span className="text-foreground font-medium">{item.label}</span>
                    )}
                </span>
            ))}
        </nav>
    );
}

// =============================================
// File Upload Panel
// =============================================

function FileUploadPanel({
    nodeId,
    subjectId,
    resourceKey,
}: {
    nodeId: string;
    subjectId: string;
    resourceKey: string;
}) {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { data: files = [], isLoading } = useQuery<FileAsset[]>({
        queryKey: ["node-files", nodeId],
        queryFn: () => fetchFilesByNode(nodeId),
    });

    const uploadMutation = useMutation({
        mutationFn: async (file: File) => {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("subjectId", subjectId);
            formData.append("resourceKey", resourceKey);
            formData.append("nodeId", nodeId);
            formData.append("title", file.name.replace(/\.pdf$/i, ""));
            return uploadFileAsset(formData);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["node-files", nodeId] });
            toast({ title: "File Uploaded", description: "File uploaded successfully." });
        },
        onError: (e: Error) => {
            toast({ title: "Upload Failed", description: e.message, variant: "destructive" });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: deleteFileAsset,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["node-files", nodeId] });
            toast({ title: "File Deleted", description: "File removed successfully." });
        },
        onError: () => {
            toast({ title: "Error", description: "Failed to delete file.", variant: "destructive" });
        },
    });

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            uploadMutation.mutate(file);
        }
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleDelete = (file: FileAsset) => {
        if (window.confirm(`Delete "${file.title}"? This cannot be undone.`)) {
            deleteMutation.mutate(file.id);
        }
    };

    const formatSize = (bytes: number | null) => {
        if (!bytes) return "—";
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                />
                <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadMutation.isPending}
                    size="sm"
                >
                    {uploadMutation.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                        <Upload className="h-4 w-4 mr-2" />
                    )}
                    Upload PDF
                </Button>
            </div>

            {isLoading ? (
                <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                    ))}
                </div>
            ) : files.length === 0 ? (
                <div className="text-sm text-muted-foreground py-8 text-center border-2 border-dashed rounded-lg">
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No files yet. Upload a PDF to get started.</p>
                </div>
            ) : (
                <div className="space-y-1">
                    {files.map((file) => (
                        <div
                            key={file.id}
                            className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <FileText className="h-5 w-5 text-red-500 shrink-0" />
                                <div className="min-w-0">
                                    <p className="text-sm font-medium truncate">{file.title}</p>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <span>{formatSize(file.fileSize)}</span>
                                        {file.year && <span>• {file.year}</span>}
                                        {file.session && <span>• {file.session}</span>}
                                        {file.paper && <span>• P{file.paper}</span>}
                                        <span>• {file.downloadCount ?? 0} downloads</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                                {file.url && (
                                    <a href={file.url} target="_blank" rel="noopener noreferrer">
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <Download className="h-4 w-4" />
                                        </Button>
                                    </a>
                                )}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                    onClick={() => handleDelete(file)}
                                    disabled={deleteMutation.isPending}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// =============================================
// Main Page Component
// =============================================

export function AdminResourceManagerPage() {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // Selection state
    const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);
    const [selectedQualId, setSelectedQualId] = useState<string | null>(null);
    const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
    const [selectedResourceKey, setSelectedResourceKey] = useState<string | null>(null);
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

    // Labels for breadcrumb
    const [selectedBoardName, setSelectedBoardName] = useState("");
    const [selectedQualName, setSelectedQualName] = useState("");
    const [selectedSubjectName, setSelectedSubjectName] = useState("");
    const [selectedResourceLabel, setSelectedResourceLabel] = useState("");
    const [selectedNodeTitle, setSelectedNodeTitle] = useState("");

    // Node navigation stack for breadcrumb-based folder drill
    const [nodeStack, setNodeStack] = useState<{ id: string; title: string }[]>([]);

    // Subject search within a qualification
    const [subjectSearch, setSubjectSearch] = useState("");

    // Bulk folder upload state
    const folderInputRef = useRef<HTMLInputElement | null>(null);
    const [isBulkUploading, setIsBulkUploading] = useState(false);
    const [showCAIEUploadDialog, setShowCAIEUploadDialog] = useState(false);

    // Dialog for creating nodes
    const [showNewNodeDialog, setShowNewNodeDialog] = useState(false);
    const [newNodeTitle, setNewNodeTitle] = useState("");
    const [newNodeType, setNewNodeType] = useState("folder");

    // =============================================
    // Data Queries
    // =============================================

    const { data: boards = [], isLoading: loadingBoards } = useQuery<AdminBoardSummary[]>({
        queryKey: ["admin-boards"],
        queryFn: listAdminBoards,
    });

    const { data: qualifications = [], isLoading: loadingQuals } = useQuery({
        queryKey: ["qualifications", selectedBoardId],
        queryFn: () => fetchQualifications(selectedBoardId!),
        enabled: !!selectedBoardId,
    });

    const { data: subjects = [], isLoading: loadingSubjects } = useQuery({
        queryKey: ["qual-subjects", selectedQualId],
        queryFn: () => fetchSubjectsByQualification(selectedQualId!),
        enabled: !!selectedQualId,
    });

    const { data: categories = [] } = useQuery<ResourceCategory[]>({
        queryKey: ["resource-categories"],
        queryFn: fetchResourceCategories,
        enabled: !!selectedSubjectId,
    });

    // Current node's parent (for fetching children)
    const currentParentNodeId = nodeStack.length > 0 ? nodeStack[nodeStack.length - 1].id : null;

    const { data: nodes = [], isLoading: loadingNodes } = useQuery<ResourceNode[]>({
        queryKey: ["resource-nodes", selectedSubjectId, selectedResourceKey, currentParentNodeId],
        queryFn: () => fetchResourceNodes(selectedSubjectId!, selectedResourceKey!, currentParentNodeId),
        enabled: !!selectedSubjectId && !!selectedResourceKey,
    });

    // =============================================
    // Mutations
    // =============================================

    const createNodeMutation = useMutation({
        mutationFn: createResourceNode,
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["resource-nodes", selectedSubjectId, selectedResourceKey],
            });
            setShowNewNodeDialog(false);
            setNewNodeTitle("");
            toast({ title: "Folder Created", description: "New folder created successfully." });
        },
        onError: () => {
            toast({ title: "Error", description: "Failed to create folder.", variant: "destructive" });
        },
    });

    const deleteNodeMutation = useMutation({
        mutationFn: deleteResourceNode,
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["resource-nodes", selectedSubjectId, selectedResourceKey],
            });
            toast({ title: "Folder Deleted", description: "Folder and its files removed." });
        },
        onError: () => {
            toast({ title: "Error", description: "Failed to delete folder.", variant: "destructive" });
        },
    });

    // =============================================
    // Handlers
    // =============================================

    const handleSelectBoard = useCallback((board: AdminBoardSummary) => {
        setSelectedBoardId(board.id);
        setSelectedBoardName(board.displayName);
        setSelectedQualId(null);
        setSelectedSubjectId(null);
        setSelectedResourceKey(null);
        setSelectedNodeId(null);
        setNodeStack([]);
    }, []);

    const handleSelectQual = useCallback((qual: any) => {
        setSelectedQualId(qual.id);
        setSelectedQualName(qual.qualName || qual.name || qual.qualKey);
        setSelectedSubjectId(null);
        setSelectedResourceKey(null);
        setSelectedNodeId(null);
        setNodeStack([]);
    }, []);

    const handleSelectSubject = useCallback((subject: any) => {
        setSelectedSubjectId(subject.id);
        setSelectedSubjectName(subject.subjectName || subject.name || subject.slug);
        setSelectedResourceKey(null);
        setSelectedNodeId(null);
        setNodeStack([]);
    }, []);

    const handleSelectCategory = useCallback((cat: ResourceCategory) => {
        setSelectedResourceKey(cat.resourceKey);
        setSelectedResourceLabel(cat.label);
        setSelectedNodeId(null);
        setNodeStack([]);
    }, []);

    const handleDrillIntoNode = useCallback((node: ResourceNode) => {
        setNodeStack((prev) => [...prev, { id: node.id, title: node.title }]);
        setSelectedNodeId(node.id);
    }, []);

    const handleNavigateToNodeStackLevel = useCallback((index: number) => {
        if (index < 0) {
            // Go back to root
            setNodeStack([]);
            setSelectedNodeId(null);
        } else {
            const newStack = nodeStack.slice(0, index + 1);
            setNodeStack(newStack);
            setSelectedNodeId(newStack[newStack.length - 1].id);
        }
    }, [nodeStack]);

    const handleCreateNode = () => {
        if (!newNodeTitle.trim() || !selectedSubjectId || !selectedResourceKey) return;
        createNodeMutation.mutate({
            subjectId: selectedSubjectId,
            resourceKey: selectedResourceKey,
            parentNodeId: currentParentNodeId,
            title: newNodeTitle.trim(),
            nodeType: newNodeType,
            sortOrder: nodes.length,
        });
    };

    const handleDeleteNode = (node: ResourceNode) => {
        if (window.confirm(`Delete folder "${node.title}" and all its files? This cannot be undone.`)) {
            deleteNodeMutation.mutate(node.id);
        }
    };

    // =============================================
    // Breadcrumb
    // =============================================

    const buildBreadcrumb = (): BreadcrumbItem[] => {
        const items: BreadcrumbItem[] = [
            {
                label: "Resources",
                onClick: () => {
                    setSelectedBoardId(null);
                    setSelectedQualId(null);
                    setSelectedSubjectId(null);
                    setSelectedResourceKey(null);
                    setSelectedNodeId(null);
                    setNodeStack([]);
                },
            },
        ];

        if (selectedBoardId) {
            items.push({
                label: selectedBoardName,
                onClick: selectedQualId ? () => handleSelectBoard({ id: selectedBoardId, name: selectedBoardName } as any) : undefined,
            });
        }

        if (selectedQualId) {
            items.push({
                label: selectedQualName,
                onClick: selectedSubjectId ? () => handleSelectQual({ id: selectedQualId, qualName: selectedQualName }) : undefined,
            });
        }

        if (selectedSubjectId) {
            items.push({
                label: selectedSubjectName,
                onClick: selectedResourceKey ? () => handleSelectSubject({ id: selectedSubjectId, subjectName: selectedSubjectName }) : undefined,
            });
        }

        if (selectedResourceKey) {
            items.push({
                label: selectedResourceLabel,
                onClick: nodeStack.length > 0 ? () => handleSelectCategory({ resourceKey: selectedResourceKey, label: selectedResourceLabel } as any) : undefined,
            });
        }

        nodeStack.forEach((ns, i) => {
            const isLast = i === nodeStack.length - 1;
            items.push({
                label: ns.title,
                onClick: isLast ? undefined : () => handleNavigateToNodeStackLevel(i),
            });
        });

        return items;
    };

    // =============================================
    // Render Helpers
    // =============================================

    const renderBoardPicker = () => (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {loadingBoards
                ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24" />)
                : boards
                    .filter((b) => b.isEnabled)
                    .map((board) => (
                        <Card
                            key={board.id}
                            className="cursor-pointer hover:border-primary/50 hover:shadow-md transition-all"
                            onClick={() => handleSelectBoard(board)}
                        >
                            <CardContent className="p-4 flex items-center gap-3">
                                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <FolderOpen className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="font-medium">{board.displayName}</p>
                                    <p className="text-xs text-muted-foreground">{board.boardKey}</p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
        </div>
    );

    const renderQualPicker = () => (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {loadingQuals
                ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24" />)
                : qualifications.map((qual: any) => (
                    <Card
                        key={qual.id}
                        className="cursor-pointer hover:border-primary/50 hover:shadow-md transition-all"
                        onClick={() => handleSelectQual(qual)}
                    >
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                <FolderOpen className="h-5 w-5 text-blue-500" />
                            </div>
                            <div>
                                <p className="font-medium">{qual.qualName || qual.qualKey}</p>
                                {qual.description && (
                                    <p className="text-xs text-muted-foreground truncate">{qual.description}</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            {!loadingQuals && qualifications.length === 0 && (
                <p className="text-sm text-muted-foreground col-span-full text-center py-8">
                    No qualifications found for this board.
                </p>
            )}
        </div>
    );

    const renderSubjectPicker = () => {
        const searchTerm = subjectSearch.trim().toLowerCase();
        const filteredSubjects = subjects.filter((subject: any) => {
            if (!searchTerm) return true;
            const name = (subject.subjectName || subject.name || "").toLowerCase();
            const code = (subject.subjectCode || "").toLowerCase();
            return name.includes(searchTerm) || code.includes(searchTerm);
        });

        return (
            <div className="space-y-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-muted-foreground">
                        Select a subject to manage its resources.
                    </p>
                    <div className="w-full sm:w-72">
                        <Input
                            placeholder="Search subjects by name or code..."
                            value={subjectSearch}
                            onChange={(e) => setSubjectSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {loadingSubjects
                        ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20" />)
                        : filteredSubjects.map((subject: any) => (
                            <Card
                                key={subject.id}
                                className="cursor-pointer hover:border-primary/50 hover:shadow-md transition-all"
                                onClick={() => handleSelectSubject(subject)}
                            >
                                <CardContent className="p-3 flex items-center gap-3">
                                    <div className="h-9 w-9 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                                        <FileText className="h-4 w-4 text-green-500" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium truncate">
                                            {subject.subjectName}
                                        </p>
                                        {subject.subjectCode && (
                                            <p className="text-xs text-muted-foreground">{subject.subjectCode}</p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    {!loadingSubjects && filteredSubjects.length === 0 && (
                        <p className="text-sm text-muted-foreground col-span-full text-center py-8">
                            No subjects match your search.
                        </p>
                    )}
                </div>
            </div>
        );
    };

    const renderCategoryPicker = () => (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((cat) => (
                <Card
                    key={cat.resourceKey}
                    className="cursor-pointer hover:border-primary/50 hover:shadow-md transition-all"
                    onClick={() => handleSelectCategory(cat)}
                >
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                            <FolderOpen className="h-5 w-5 text-orange-500" />
                        </div>
                        <div>
                            <p className="font-medium">{cat.label}</p>
                            <p className="text-xs text-muted-foreground">{cat.resourceKey}</p>
                        </div>
                    </CardContent>
                </Card>
            ))}
            {categories.length === 0 && (
                <p className="text-sm text-muted-foreground col-span-full text-center py-8">
                    No resource categories configured.
                </p>
            )}
        </div>
    );

    const handleBulkFolderSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const fileList = e.target.files;
        if (!fileList || fileList.length === 0) return;
        if (!selectedSubjectId || !selectedResourceKey) {
            toast({
                title: "Select subject and category first",
                description: "Choose a subject and resource category before uploading a folder.",
                variant: "destructive",
            });
            return;
        }

        setIsBulkUploading(true);

        try {
            const files = Array.from(fileList);
            const nodeCache = new Map<string, string>();

            const baseParentId = nodeStack.length > 0 ? nodeStack[nodeStack.length - 1].id : null;

            const ensureNodeForPath = async (segments: string[]): Promise<string> => {
                let parentId = baseParentId;

                for (const segment of segments) {
                    const key = `${parentId || "root"}|${segment}`;
                    if (nodeCache.has(key)) {
                        parentId = nodeCache.get(key)!;
                        continue;
                    }

                    // Try to find existing node matching this segment under current parent
                    const existing = nodes.find(
                        (n) =>
                            n.title === segment &&
                            ((parentId === null && (n.parentNodeId === null || n.parentNodeId === "node-pp-root")) ||
                                n.parentNodeId === parentId)
                    );

                    if (existing) {
                        nodeCache.set(key, existing.id);
                        parentId = existing.id;
                        continue;
                    }

                    const created = await createResourceNode({
                        subjectId: selectedSubjectId,
                        resourceKey: selectedResourceKey,
                        parentNodeId: parentId,
                        title: segment,
                        nodeType: "folder",
                        sortOrder: nodes.length,
                    });

                    nodeCache.set(key, created.id);
                    parentId = created.id;
                }

                if (!parentId) {
                    throw new Error("Failed to resolve node for folder path");
                }

                return parentId;
            };

            for (const file of files) {
                const relativePath = (file as any).webkitRelativePath || file.name;
                const parts = relativePath.split(/[/\\]/);
                const folderSegments = parts.slice(0, -1).filter(Boolean);

                const targetNodeId =
                    folderSegments.length > 0 ? await ensureNodeForPath(folderSegments) : baseParentId;

                if (!targetNodeId) {
                    // If we still don't have a node, fall back to creating a single folder with file's parent name
                    const fallbackTitle = folderSegments[folderSegments.length - 1] || "Uploaded Files";
                    const created = await createResourceNode({
                        subjectId: selectedSubjectId,
                        resourceKey: selectedResourceKey,
                        parentNodeId: baseParentId,
                        title: fallbackTitle,
                        nodeType: "folder",
                        sortOrder: nodes.length,
                    });
                    nodeCache.set(`${baseParentId || "root"}|${fallbackTitle}`, created.id);
                    await uploadFileAsset(
                        (() => {
                            const fd = new FormData();
                            fd.append("file", file);
                            fd.append("subjectId", selectedSubjectId);
                            fd.append("resourceKey", selectedResourceKey);
                            fd.append("nodeId", created.id);
                            fd.append("title", file.name.replace(/\.pdf$/i, ""));
                            return fd;
                        })()
                    );
                    continue;
                }

                const formData = new FormData();
                formData.append("file", file);
                formData.append("subjectId", selectedSubjectId);
                formData.append("resourceKey", selectedResourceKey);
                formData.append("nodeId", targetNodeId);
                formData.append("title", file.name.replace(/\.pdf$/i, ""));

                await uploadFileAsset(formData);
            }

            queryClient.invalidateQueries({
                queryKey: ["resource-nodes", selectedSubjectId, selectedResourceKey],
            });

            toast({
                title: "Folder Upload Complete",
                description: "All files have been uploaded and organized into folders.",
            });
        } catch (error: any) {
            toast({
                title: "Folder Upload Failed",
                description: error?.message || "Something went wrong while uploading the folder.",
                variant: "destructive",
            });
        } finally {
            setIsBulkUploading(false);
            if (folderInputRef.current) {
                folderInputRef.current.value = "";
            }
        }
    };

    const renderNodeExplorer = () => (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {nodeStack.length > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleNavigateToNodeStackLevel(nodeStack.length - 2)}
                        >
                            <ArrowLeft className="h-4 w-4 mr-1" />
                            Back
                        </Button>
                    )}
                    <span className="text-sm text-muted-foreground">
                        {nodes.length} item{nodes.length !== 1 ? "s" : ""}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <input
                        ref={folderInputRef}
                        type="file"
                        multiple
                        className="hidden"
                        onChange={handleBulkFolderSelect}
                        {...({ webkitdirectory: "true" } as any)}
                    />
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => folderInputRef.current?.click()}
                        disabled={isBulkUploading}
                    >
                        {isBulkUploading ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Uploading...
                            </>
                        ) : (
                            <>
                                <Upload className="h-4 w-4 mr-2" />
                                Upload Folder
                            </>
                        )}
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowCAIEUploadDialog(true)}
                        disabled={isBulkUploading}
                        className="border-primary/50 text-primary hover:bg-primary/5"
                    >
                        <FolderSearch className="h-4 w-4 mr-2" />
                        CAIE Intelligent Upload
                    </Button>
                    <Button size="sm" onClick={() => setShowNewNodeDialog(true)}>
                        <FolderPlus className="h-4 w-4 mr-2" />
                        New Folder
                    </Button>
                </div>
            </div>

            {loadingNodes ? (
                <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-14" />
                    ))}
                </div>
            ) : (
                <div className="space-y-1">
                    {nodes.map((node) => (
                        <div
                            key={node.id}
                            className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors group"
                        >
                            <button
                                className="flex items-center gap-3 min-w-0 flex-1 text-left"
                                onClick={() => handleDrillIntoNode(node)}
                            >
                                <FolderOpen className="h-5 w-5 text-yellow-500 shrink-0" />
                                <div className="min-w-0">
                                    <p className="text-sm font-medium truncate">{node.title}</p>
                                    <p className="text-xs text-muted-foreground">{node.nodeType}</p>
                                </div>
                            </button>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteNode(node);
                                    }}
                                    disabled={deleteNodeMutation.isPending}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))}

                    {nodes.length === 0 && !loadingNodes && (
                        <div className="text-center py-8 text-sm text-muted-foreground border-2 border-dashed rounded-lg">
                            <FolderOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p>No folders yet. Create one to organize files.</p>
                        </div>
                    )}
                </div>
            )}

            {/* File panel — show files at current node level */}
            {selectedSubjectId && selectedResourceKey && (
                <div className="mt-6">
                    <Separator className="mb-4" />
                    <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Files in {nodeStack.length > 0 ? nodeStack[nodeStack.length - 1].title : selectedResourceLabel}
                    </h3>
                    {currentParentNodeId ? (
                        <FileUploadPanel
                            nodeId={currentParentNodeId}
                            subjectId={selectedSubjectId}
                            resourceKey={selectedResourceKey}
                        />
                    ) : nodes.length > 0 ? (
                        <p className="text-xs text-muted-foreground">Select a folder above to manage its files.</p>
                    ) : (
                        <p className="text-xs text-muted-foreground">Create a folder first, then upload files to it.</p>
                    )}
                </div>
            )}
        </div>
    );

    // =============================================
    // Determine current view
    // =============================================

    const getCurrentView = () => {
        if (!selectedBoardId) return "boards";
        if (!selectedQualId) return "qualifications";
        if (!selectedSubjectId) return "subjects";
        if (!selectedResourceKey) return "categories";
        return "nodes";
    };

    const currentView = getCurrentView();

    return (
        <div className="space-y-6">
            <PageHeader
                title="Resource Manager"
                description="Manage curriculum resources: boards → qualifications → subjects → categories → files"
            />

            <AdminBreadcrumb items={buildBreadcrumb()} />

            <Card>
                <CardContent className="p-6">
                    {currentView === "boards" && renderBoardPicker()}
                    {currentView === "qualifications" && renderQualPicker()}
                    {currentView === "subjects" && renderSubjectPicker()}
                    {currentView === "categories" && renderCategoryPicker()}
                    {currentView === "nodes" && renderNodeExplorer()}
                </CardContent>
            </Card>

            {/* New Folder Dialog */}
            <Dialog open={showNewNodeDialog} onOpenChange={setShowNewNodeDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create New Folder</DialogTitle>
                        <DialogDescription>
                            Add a new folder to organize resources.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="node-title">Folder Name</Label>
                            <Input
                                id="node-title"
                                value={newNodeTitle}
                                onChange={(e) => setNewNodeTitle(e.target.value)}
                                placeholder="e.g., 2024, May/June, Paper 1"
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") handleCreateNode();
                                }}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="node-type">Type</Label>
                            <Select value={newNodeType} onValueChange={setNewNodeType}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="folder">Folder</SelectItem>
                                    <SelectItem value="year">Year</SelectItem>
                                    <SelectItem value="session">Session</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowNewNodeDialog(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleCreateNode}
                            disabled={!newNodeTitle.trim() || createNodeMutation.isPending}
                        >
                            {createNodeMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Create
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* CAIE Bulk Upload Dialog */}
            {selectedSubjectId && selectedResourceKey && (
                <CAIEBulkUploadDialog
                    open={showCAIEUploadDialog}
                    onOpenChange={setShowCAIEUploadDialog}
                    subjectId={selectedSubjectId}
                    resourceKey={selectedResourceKey}
                    rootNodeId={currentParentNodeId}
                    boardKey={boards.find(b => b.id === selectedBoardId)?.code}
                    qualKey={qualifications.find((q: any) => q.id === selectedQualId)?.qualKey}
                    subjectSlug={subjects.find((s: any) => s.id === selectedSubjectId)?.slug || subjects.find((s: any) => s.id === selectedSubjectId)?.subjectName?.toLowerCase().replace(/\s+/g, '-')}
                />
            )}
        </div>
    );
}
