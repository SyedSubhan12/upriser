
import { useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Upload, FileCheck, FileWarning, Trash2, FolderSearch, FileUp, MousePointerClick } from "lucide-react";
import { parseCAIEFilename, formatPaperVariant, type CAIEParsedFilename, CAIE_FILE_TYPE_MAP } from "@shared/caie-utils";
import { useToast } from "@/hooks/use-toast";
import { uploadFileAsset, createResourceNode, type ResourceNode } from "@/api/admin";
import { useQueryClient } from "@tanstack/react-query";

interface CAIEFileItem {
    file: File;
    parsed: CAIEParsedFilename;
    status: 'pending' | 'uploading' | 'success' | 'error';
    error?: string;
}

interface CAIEBulkUploadDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    subjectId: string;
    resourceKey: string;
    rootNodeId: string | null;
    boardKey?: string;
    qualKey?: string;
    subjectSlug?: string;
}

export function CAIEBulkUploadDialog({
    open,
    onOpenChange,
    subjectId,
    resourceKey,
    rootNodeId,
    boardKey,
    qualKey,
    subjectSlug
}: CAIEBulkUploadDialogProps) {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const folderInputRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [files, setFiles] = useState<CAIEFileItem[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    const processFiles = useCallback((fileList: File[] | FileList) => {
        const fileArray = Array.from(fileList);
        const newFiles: CAIEFileItem[] = fileArray
            .filter(f => f.name.toLowerCase().endsWith('.pdf'))
            .map(f => ({
                file: f,
                parsed: parseCAIEFilename(f.name),
                status: 'pending',
            }));

        setFiles(prev => {
            // Filter out exact duplicates (same name and size) to avoid accidental double-clicks
            const existingKeys = new Set(prev.map(p => `${p.file.name}-${p.file.size}`));
            const filteredNew = newFiles.filter(n => !existingKeys.has(`${n.file.name}-${n.file.size}`));
            return [...prev, ...filteredNew];
        });
    }, []);

    const handleFolderSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            processFiles(e.target.files);
            e.target.value = "";
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            processFiles(e.target.files);
            e.target.value = "";
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isUploading) setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (isUploading) return;

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            processFiles(e.dataTransfer.files);
        }
    };

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const clearFiles = () => {
        setFiles([]);
    };

    const handleUpload = async () => {
        if (files.length === 0) return;
        setIsUploading(true);

        // Map to store promises for node creation to prevent race conditions
        const nodeCache = new Map<string, Promise<string>>();

        // Function to ensure a node exists and return its ID
        const getOrCreateNode = (key: string, creator: () => Promise<ResourceNode>): Promise<string> => {
            if (!nodeCache.has(key)) {
                nodeCache.set(key, creator().then(node => node.id));
            }
            return nodeCache.get(key)!;
        };

        // Root node for the current category if not provided
        const currentRootId = rootNodeId;

        // Create a queue of indices to process
        const queue = files
            .map((f, i) => f.status === 'success' ? -1 : i)
            .filter(i => i !== -1);

        const CONCURRENCY_LIMIT = 3;
        let activeCount = 0;
        let completedCount = 0;
        const totalToUpload = queue.length;

        return new Promise<void>((resolve) => {
            if (totalToUpload === 0) {
                setIsUploading(false);
                resolve();
                return;
            }

            const processNext = async () => {
                if (queue.length === 0) {
                    if (activeCount === 0) {
                        toast({
                            title: "Upload finished",
                            description: `Processed ${totalToUpload} files. Check the list for details.`,
                        });
                        queryClient.invalidateQueries({ queryKey: ["resource-nodes", subjectId, resourceKey] });
                        queryClient.invalidateQueries({ queryKey: ["node-files"] });
                        setIsUploading(false);
                        resolve();
                    }
                    return;
                }

                const i = queue.shift()!;
                activeCount++;

                setFiles(prev => {
                    const next = [...prev];
                    next[i] = { ...next[i], status: 'uploading' };
                    return next;
                });

                try {
                    const item = files[i];
                    const { parsed, file } = item;

                    let targetNodeId = currentRootId;

                    if (parsed.year && parsed.session) {
                        // Consolidate into single level "Year Session" (e.g., "2024 May/June")
                        const combinedTitle = `${parsed.year} ${parsed.session}`;
                        const combinedKey = `caie-${parsed.year}-${parsed.sessionCode || parsed.session}`;

                        targetNodeId = await getOrCreateNode(combinedKey, () => createResourceNode({
                            subjectId,
                            resourceKey,
                            parentNodeId: currentRootId,
                            title: combinedTitle,
                            nodeType: 'folder', // Use folder instead of list for better organization
                        }));
                    } else if (!targetNodeId) {
                        const unsortedKey = 'unsorted';
                        targetNodeId = await getOrCreateNode(unsortedKey, () => createResourceNode({
                            subjectId,
                            resourceKey,
                            title: 'Unsorted',
                            nodeType: 'folder',
                        }));
                    }

                    // Upload File
                    const formData = new FormData();
                    formData.append("file", file);
                    formData.append("subjectId", subjectId);
                    formData.append("resourceKey", resourceKey);
                    formData.append("nodeId", targetNodeId!);
                    formData.append("title", file.name.replace(/\.pdf$/i, "").toUpperCase().replace(/_/g, " "));
                    formData.append("fileType", parsed.fileType);
                    if (parsed.year) formData.append("year", String(parsed.year));
                    if (parsed.session) formData.append("session", parsed.session);
                    if (parsed.paper) formData.append("paper", String(parsed.paper));
                    if (parsed.variant) formData.append("variant", String(parsed.variant));

                    if (boardKey) formData.append("boardKey", boardKey);
                    if (qualKey) formData.append("qualKey", qualKey);
                    if (subjectSlug) formData.append("subjectSlug", subjectSlug);

                    await uploadFileAsset(formData);

                    setFiles(prev => {
                        const next = [...prev];
                        next[i] = { ...next[i], status: 'success' };
                        return next;
                    });
                } catch (err: any) {
                    console.error(`Error uploading file ${i}:`, err);
                    setFiles(prev => {
                        const next = [...prev];
                        next[i] = { ...next[i], status: 'error', error: err.message };
                        return next;
                    });
                } finally {
                    activeCount--;
                    completedCount++;
                    processNext(); // Start next one
                }
            };

            // Initial burst
            for (let j = 0; j < Math.min(CONCURRENCY_LIMIT, totalToUpload); j++) {
                processNext();
            }
        });
    };

    const validCount = files.filter(f => f.parsed.isValid).length;
    const invalidCount = files.length - validCount;

    return (
        <Dialog open={open} onOpenChange={(val) => !isUploading && onOpenChange(val)}>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle className="text-2xl flex items-center gap-2">
                        <FolderSearch className="h-6 w-6 text-primary" />
                        CAIE Intelligent Bulk Upload
                    </DialogTitle>
                    <DialogDescription>
                        Select a folder containing CAIE past papers. The system will automatically detect subject codes, years, sessions, and document types.
                    </DialogDescription>
                </DialogHeader>

                <div
                    className={cn(
                        "flex-1 overflow-hidden px-6 pb-4 flex flex-col transition-colors",
                        isDragging && "bg-primary/5"
                    )}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex gap-2">
                            <input
                                ref={folderInputRef}
                                type="file"
                                className="hidden"
                                onChange={handleFolderSelect}
                                {...({ webkitdirectory: "true" } as any)}
                            />
                            <input
                                ref={fileInputRef}
                                type="file"
                                className="hidden"
                                multiple
                                onChange={handleFileSelect}
                            />
                            <Button
                                onClick={() => folderInputRef.current?.click()}
                                variant="outline"
                                size="sm"
                                disabled={isUploading}
                            >
                                <Upload className="h-4 w-4 mr-2" />
                                Add Folder
                            </Button>
                            <Button
                                onClick={() => fileInputRef.current?.click()}
                                variant="outline"
                                size="sm"
                                disabled={isUploading}
                            >
                                <FileUp className="h-4 w-4 mr-2" />
                                Add Files
                            </Button>
                            {files.length > 0 && (
                                <Button
                                    onClick={clearFiles}
                                    variant="ghost"
                                    size="sm"
                                    className="text-destructive"
                                    disabled={isUploading}
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Clear
                                </Button>
                            )}
                        </div>
                        <div className="flex gap-4 text-sm">
                            <div className="flex items-center gap-1.5">
                                <Badge variant="outline" className="text-green-600 bg-green-50 border-green-200">
                                    {validCount} Detected
                                </Badge>
                            </div>
                            {invalidCount > 0 && (
                                <div className="flex items-center gap-1.5">
                                    <Badge variant="outline" className="text-amber-600 bg-amber-50 border-amber-200">
                                        {invalidCount} Unknown
                                    </Badge>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className={cn(
                        "flex-1 border-2 border-dashed rounded-md overflow-hidden bg-muted/20 flex flex-col",
                        isDragging ? "border-primary bg-primary/10" : "border-transparent"
                    )}>
                        {files.length === 0 && !isDragging ? (
                            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                                    <MousePointerClick className="h-8 w-8" />
                                </div>
                                <p className="font-medium text-foreground">Build your upload queue</p>
                                <p className="text-sm mt-1">Drag and drop CAIE PDF files here, or use the buttons above to select folders and files.</p>
                            </div>
                        ) : (
                            <div className="flex flex-col h-full">
                                <Table>
                                    <TableHeader className="bg-muted/50 sticky top-0 z-10">
                                        <TableRow>
                                            <TableHead className="w-[300px]">Filename</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Year/Session</TableHead>
                                            <TableHead>Paper</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="w-[50px]"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                </Table>
                                <ScrollArea className="flex-1">
                                    <Table>
                                        <TableBody>
                                            {files.map((item, i) => (
                                                <TableRow key={`${item.file.name}-${i}`}>
                                                    <TableCell className="font-mono text-xs max-w-[300px] truncate">
                                                        {item.file.name}
                                                    </TableCell>
                                                    <TableCell>
                                                        {item.parsed.isValid ? (
                                                            <Badge variant="secondary" className="font-normal">
                                                                {CAIE_FILE_TYPE_MAP[item.parsed.fileType] || item.parsed.fileType}
                                                            </Badge>
                                                        ) : (
                                                            <span className="text-xs text-muted-foreground italic">Other</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-sm">
                                                        {item.parsed.year ? (
                                                            <span>{item.parsed.year} {item.parsed.session}</span>
                                                        ) : (
                                                            <span className="text-muted-foreground">—</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <code className="text-xs bg-muted px-1 rounded">
                                                            {formatPaperVariant(item.parsed.paper, item.parsed.variant) || '—'}
                                                        </code>
                                                    </TableCell>
                                                    <TableCell>
                                                        {item.status === 'pending' && (
                                                            item.parsed.isValid ? (
                                                                <FileCheck className="h-4 w-4 text-green-500" />
                                                            ) : (
                                                                <FileWarning className="h-4 w-4 text-amber-500" />
                                                            )
                                                        )}
                                                        {item.status === 'uploading' && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                                                        {item.status === 'success' && <div className="h-2 w-2 rounded-full bg-green-500" />}
                                                        {item.status === 'error' && (
                                                            <div className="h-2 w-2 rounded-full bg-destructive" title={item.error} />
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7 opacity-50 hover:opacity-100"
                                                            onClick={() => removeFile(i)}
                                                            disabled={isUploading}
                                                        >
                                                            <Trash2 className="h-3 w-3" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </ScrollArea>
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter className="p-6 pt-2 bg-muted/30 border-t">
                    <Button
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        disabled={isUploading}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleUpload}
                        disabled={files.length === 0 || isUploading}
                        className="min-w-[120px]"
                    >
                        {isUploading ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Uploading ({files.filter(f => f.status === 'success' || f.status === 'error').length}/{files.length})
                            </>
                        ) : (
                            <>
                                <Upload className="h-4 w-4 mr-2" />
                                Start Upload
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
