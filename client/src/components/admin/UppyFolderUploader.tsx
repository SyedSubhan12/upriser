/**
 * UppyFolderUploader — a rich folder upload component using Uppy.
 *
 * Supports drag-and-drop of entire folder trees, shows per-file progress,
 * and auto-creates resource-node hierarchy (year → session → file) based
 * on the relative path of each file in the uploaded folder.
 */

import { useEffect, useMemo, useCallback, useRef } from "react";
import Uppy from "@uppy/core";
import Dashboard from "@uppy/dashboard";
import XHRUpload from "@uppy/xhr-upload";

// Uppy styles
import "@uppy/core/css/style.min.css";
import "@uppy/dashboard/css/style.min.css";

import { createResourceNode, type ResourceNode } from "@/api/admin";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export interface UppyFolderUploaderProps {
    /** The subject ID files belong to */
    subjectId: string;
    /** The resource category key (e.g. "past_papers") */
    resourceKey: string;
    /** The parent node ID to upload under (null = root) */
    rootNodeId: string | null;
    /** Board key for building the Supabase object key */
    boardKey?: string;
    /** Qualification key */
    qualKey?: string;
    /** Subject slug */
    subjectSlug?: string;
    /** Called after all uploads finish */
    onComplete?: () => void;
    /** Compact height mode */
    height?: number;
}

export function UppyFolderUploader({
    subjectId,
    resourceKey,
    rootNodeId,
    boardKey,
    qualKey,
    subjectSlug,
    onComplete,
    height = 400,
}: UppyFolderUploaderProps) {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const dashboardRef = useRef<HTMLDivElement>(null);

    // Node cache persists across files in a single batch
    const nodeCacheRef = useRef<Map<string, string>>(new Map());

    /**
     * Ensure the folder hierarchy exists as resource nodes in the database.
     * Returns the node ID of the deepest folder in the path.
     */
    const ensureNodeHierarchy = useCallback(
        async (segments: string[]): Promise<string | null> => {
            if (segments.length === 0) return rootNodeId;

            let parentId = rootNodeId;
            const cache = nodeCacheRef.current;

            for (const segment of segments) {
                const key = `${parentId || "root"}|${segment}`;
                if (cache.has(key)) {
                    parentId = cache.get(key)!;
                    continue;
                }

                // Create the node (backend will de-duplicate if needed)
                const created: ResourceNode = await createResourceNode({
                    subjectId,
                    resourceKey,
                    parentNodeId: parentId,
                    title: segment,
                    nodeType: "folder",
                    sortOrder: 0,
                });

                cache.set(key, created.id);
                parentId = created.id;
            }

            return parentId;
        },
        [subjectId, resourceKey, rootNodeId],
    );

    const uppy = useMemo(() => {
        const instance = new Uppy({
            id: "folder-uploader",
            restrictions: {
                allowedFileTypes: [".pdf", "application/pdf"],
                maxFileSize: 100 * 1024 * 1024, // 100 MB
            },
            autoProceed: false,
            allowMultipleUploadBatches: true,
        });

        // XHR upload — one file at a time so we can set the correct nodeId per file
        instance.use(XHRUpload, {
            endpoint: "/api/curriculum/files/upload",
            fieldName: "file",
            formData: true,
            limit: 2, // Upload 2 concurrently
            withCredentials: true,
            // Override getResponseData to parse our API response
            getResponseData: (xhr: XMLHttpRequest) => {
                try {
                    const parsed = JSON.parse(xhr.responseText);
                    return parsed.details || parsed;
                } catch {
                    return {} as any;
                }
            },
        });

        return instance;
    }, []);

    // Attach the Dashboard UI to the DOM
    useEffect(() => {
        if (!dashboardRef.current) return;

        uppy.use(Dashboard, {
            inline: true,
            target: dashboardRef.current,
            height,
            width: "100%",
            hideProgressDetails: false,
            proudlyDisplayPoweredByUppy: false,
            note: "Drop folders or PDF files here. Folder structure will be preserved as resource nodes.",
            showRemoveButtonAfterComplete: true,
            doneButtonHandler: () => {
                uppy.cancelAll();
                nodeCacheRef.current.clear();
            },
        });

        return () => {
            // Remove Dashboard plugin on unmount
            const dashPlugin = uppy.getPlugin("Dashboard");
            if (dashPlugin) uppy.removePlugin(dashPlugin);
        };
    }, [uppy, height]);

    // Use a pre-processor to ensure the folder hierarchy exists before the upload starts.
    // This is more robust than 'file-added' because Uppy waits for all pre-processors to finish.
    useEffect(() => {
        const preProcessor = async (fileIDs: string[]) => {
            const files = fileIDs.map(id => uppy.getFile(id));

            for (const file of files) {
                // Extract relative path
                const relativePath =
                    (file.meta as any).relativePath ||
                    (file.meta as any).webkitRelativePath ||
                    file.name;

                const parts = relativePath.split(/[/\\]/);
                const folderSegments = parts.slice(0, -1).filter(Boolean);

                try {
                    // Ensure the folder hierarchy exists (backend handles de-duplication)
                    const nodeId = await ensureNodeHierarchy(folderSegments);

                    // Set metadata for this specific file
                    uppy.setFileMeta(file.id, {
                        subjectId,
                        resourceKey,
                        nodeId: nodeId || "",
                        title: (file.name || "").replace(/\.pdf$/i, ""),
                        boardKey: boardKey || "unknown",
                        qualKey: qualKey || "unknown",
                        subjectSlug: subjectSlug || "unknown",
                    });
                } catch (err: any) {
                    console.error("Failed to create node hierarchy for", relativePath, err);
                    // We don't necessarily want to fail the whole batch, but this file will likely fail upload.
                    // Uppy will handle the XHR failure if nodeId is missing.
                }
            }
        };

        uppy.addPreProcessor(preProcessor);
        return () => {
            uppy.removePreProcessor(preProcessor);
        };
    }, [uppy, subjectId, resourceKey, boardKey, qualKey, subjectSlug, ensureNodeHierarchy]);

    // On complete, invalidate queries and notify parent
    useEffect(() => {
        const handler = (result: any) => {
            const successCount = result?.successful?.length ?? 0;
            const failedCount = result?.failed?.length ?? 0;

            if (successCount > 0) {
                // Invalidate resource-node queries so the tree refreshes
                queryClient.invalidateQueries({
                    queryKey: ["resource-nodes", subjectId, resourceKey],
                });

                toast({
                    title: "Upload Complete",
                    description: `${successCount} file${successCount > 1 ? "s" : ""} uploaded successfully${failedCount > 0 ? `, ${failedCount} failed` : ""}.`,
                });
            } else if (failedCount > 0) {
                toast({
                    title: "Upload Failed",
                    description: `${failedCount} file${failedCount > 1 ? "s" : ""} failed to upload.`,
                    variant: "destructive",
                });
            }

            // Clear cache for next batch
            nodeCacheRef.current.clear();
            onComplete?.();
        };

        uppy.on("complete", handler);
        return () => {
            uppy.off("complete", handler);
        };
    }, [uppy, subjectId, resourceKey, queryClient, toast, onComplete]);

    // Cleanup Uppy instance on unmount
    useEffect(() => {
        return () => {
            uppy.destroy();
        };
    }, [uppy]);

    return (
        <div className="uppy-folder-uploader">
            <div ref={dashboardRef} />
        </div>
    );
}
