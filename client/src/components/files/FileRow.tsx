import { FileText, Download, ExternalLink, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FileTypeBadge } from "./FileTypeFilterBar";
import { FILE_TYPE_LABELS, type FileAsset, type FileType } from "@/lib/curriculumData";
import { Link } from "wouter";

interface FileRowProps {
    file: FileAsset;
    onView?: (file: FileAsset) => void;
    onDownload?: (file: FileAsset) => void;
    className?: string;
}

export function FileRow({ file, onView, onDownload, className }: FileRowProps) {
    const viewHref = `/view/file/${file.id}`;

    const handleView = () => {
        if (onView) {
            onView(file);
        }
        // Link component will handle navigation
    };

    const handleDownload = () => {
        if (onDownload) {
            onDownload(file);
        } else {
            // Track download count
            fetch(`/api/curriculum/files/${file.id}/download`, { method: 'POST' }).catch(() => { });
            // Trigger download
            const link = document.createElement("a");
            link.href = file.url;
            link.download = file.title;
            link.click();
        }
    };

    return (
        <div
            className={cn(
                "group flex items-center gap-4 rounded-lg border p-4 transition-all",
                "hover:border-primary/30 hover:bg-muted/50",
                className
            )}
        >
            {/* File icon */}
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <FileText className="h-5 w-5" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <h3 className="font-medium truncate">{file.title}</h3>
                    <FileTypeBadge type={file.fileType} />
                </div>
                <p className="mt-0.5 text-sm text-muted-foreground">
                    {FILE_TYPE_LABELS[file.fileType]}
                    {file.paper && ` • Paper ${file.paper}`}
                    {file.variant && ` Variant ${file.variant}`}
                </p>
            </div>

            {/* Actions */}
            <div className="flex shrink-0 items-center gap-2">
                <Link href={viewHref}>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="View"
                    >
                        <Eye className="h-4 w-4" />
                    </Button>
                </Link>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={handleDownload}
                    title="Download"
                >
                    <Download className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}

// Compact version
interface FileRowCompactProps {
    file: FileAsset;
    onView?: (file: FileAsset) => void;
    className?: string;
}

export function FileRowCompact({ file, onView, className }: FileRowCompactProps) {
    const handleClick = () => {
        if (onView) {
            onView(file);
        } else {
            window.open(file.url, "_blank");
        }
    };

    return (
        <button
            onClick={handleClick}
            className={cn(
                "group flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition-all",
                "hover:bg-muted",
                className
            )}
        >
            <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
            <span className="flex-1 truncate text-sm">{file.title}</span>
            <FileTypeBadge type={file.fileType} className="shrink-0" />
            <ExternalLink
                className={cn(
                    "h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity",
                    "group-hover:opacity-100"
                )}
            />
        </button>
    );
}

// Card version for grid layouts
interface FileCardProps {
    file: FileAsset;
    onView?: (file: FileAsset) => void;
    className?: string;
}

export function FileCard({ file, onView, className }: FileCardProps) {
    const handleClick = () => {
        if (onView) {
            onView(file);
        } else {
            window.open(file.url, "_blank");
        }
    };

    return (
        <button
            onClick={handleClick}
            className={cn(
                "group rounded-lg border p-4 text-left transition-all w-full",
                "hover:border-primary/50 hover:shadow-md hover:-translate-y-0.5",
                className
            )}
        >
            <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <FileText className="h-5 w-5" />
                </div>
                <FileTypeBadge type={file.fileType} />
            </div>
            <h3 className="mt-3 font-medium text-sm truncate">{file.title}</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
                {FILE_TYPE_LABELS[file.fileType]}
            </p>
        </button>
    );
}

// Helper: Group files by type for display
export function groupFilesByType(files: FileAsset[]): Map<FileType, FileAsset[]> {
    const groups = new Map<FileType, FileAsset[]>();

    files.forEach((file) => {
        const existing = groups.get(file.fileType) || [];
        existing.push(file);
        groups.set(file.fileType, existing);
    });

    return groups;
}

// Helper: Get unique file types from a list of files
export function getUniqueFileTypes(files: FileAsset[]): FileType[] {
    const types = new Set<FileType>();
    files.forEach((file) => types.add(file.fileType));
    return Array.from(types);
}
