import { useState, useCallback, useRef, useEffect } from "react";
import { Upload, X, FileText, File, Image as ImageIcon, CheckCircle2, AlertCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface FileDropperProps {
    onFileSelect: (file: File | null) => void;
    allowedTypes?: string[]; // e.g. ["application/pdf", "image/*"]
    maxSizeMB?: number;
    currentFileUrl?: string;
    label?: string;
    description?: string;
    className?: string;
}

export function FileDropper({
    onFileSelect,
    allowedTypes = [],
    maxSizeMB = 10,
    currentFileUrl,
    label = "Upload File",
    description = "Drag and drop or click to upload",
    className,
}: FileDropperProps) {
    const [file, setFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    const validateFile = (selectedFile: File): boolean => {
        setError(null);

        // Type validation
        if (allowedTypes.length > 0) {
            const isAllowed = allowedTypes.some((type) => {
                if (type.endsWith("/*")) {
                    const baseType = type.split("/")[0];
                    return selectedFile.type.startsWith(baseType);
                }
                return selectedFile.type === type;
            });

            if (!isAllowed) {
                const errorMsg = "Invalid file type. Please upload a supported format.";
                setError(errorMsg);
                toast({ title: "Invalid File", description: errorMsg, variant: "destructive" });
                return false;
            }
        }

        // Size validation
        if (selectedFile.size > maxSizeMB * 1024 * 1024) {
            const errorMsg = `File size exceeds ${maxSizeMB}MB limit.`;
            setError(errorMsg);
            toast({ title: "File Too Large", description: errorMsg, variant: "destructive" });
            return false;
        }

        return true;
    };

    const handleFile = (selectedFile: File) => {
        if (validateFile(selectedFile)) {
            setFile(selectedFile);
            onFileSelect(selectedFile);
        }
    };

    const onDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const selectedFile = e.dataTransfer.files?.[0];
        if (selectedFile) handleFile(selectedFile);
    }, []);

    const onDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const onDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleRemove = (e: React.MouseEvent) => {
        e.stopPropagation();
        setFile(null);
        onFileSelect(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const getFileIcon = () => {
        if (!file) return <Upload className="h-10 w-10 text-muted-foreground" />;
        if (file.type.startsWith("image/")) return <ImageIcon className="h-10 w-10 text-primary" />;
        if (file.type === "application/pdf") return <FileText className="h-10 w-10 text-red-500" />;
        return <File className="h-10 w-10 text-muted-foreground" />;
    };

    // Object URL for live preview
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    useEffect(() => {
        if (file) {
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
            return () => URL.revokeObjectURL(url);
        } else {
            setPreviewUrl(null);
        }
    }, [file]);

    return (
        <div className={cn("space-y-4", className)}>
            <div
                className={cn(
                    "relative border-2 border-dashed rounded-xl p-8 transition-all duration-200 cursor-pointer flex flex-col items-center justify-center text-center",
                    isDragging ? "border-primary bg-primary/5 scale-[1.01]" : "border-muted-foreground/25 hover:border-primary/50",
                    file ? "border-primary/50 bg-primary/[0.02]" : "bg-muted/5",
                    error && "border-destructive/50 bg-destructive/[0.02]"
                )}
                onDrop={onDrop}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onClick={() => fileInputRef.current?.click()}
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept={allowedTypes.join(",")}
                    onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                />

                {file ? (
                    <div className="w-full space-y-4 animate-in fade-in zoom-in duration-300">
                        <div className="flex flex-col items-center gap-2">
                            <div className="p-3 rounded-full bg-primary/10 mb-2">
                                {getFileIcon()}
                            </div>
                            <div className="space-y-1">
                                <p className="font-semibold text-foreground truncate max-w-[250px]">{file.name}</p>
                                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                                    {(file.size / 1024 / 1024).toFixed(2)} MB • {file.type.split("/")[1] || "File"}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center justify-center gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-8 text-xs bg-background/50 backdrop-blur-sm"
                                onClick={handleRemove}
                            >
                                <X className="mr-2 h-3.5 w-3.5" />
                                Remove
                            </Button>
                            <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                className="h-8 text-xs bg-background/50 backdrop-blur-sm"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    fileInputRef.current?.click();
                                }}
                            >
                                Change
                            </Button>
                        </div>

                        <div className="flex items-center justify-center gap-1.5 text-green-600 dark:text-green-500 font-medium text-xs">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            File ready for upload
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="p-4 rounded-full bg-secondary/50 mx-auto w-fit border border-secondary transition-transform group-hover:scale-110">
                            <Upload className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                        <div className="space-y-2">
                            <h4 className="font-semibold text-foreground">{label}</h4>
                            <p className="text-sm text-muted-foreground leading-relaxed max-w-[240px] mx-auto">
                                {description}
                            </p>
                        </div>
                        {allowedTypes.length > 0 && (
                            <div className="pt-2">
                                <p className="text-[10px] text-muted-foreground/60 font-medium uppercase tracking-widest">
                                    Accepted formats: {allowedTypes.map(t => t.split("/")[1]?.toUpperCase() || t).join(", ")}
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {error && (
                    <div className="absolute top-4 right-4 flex items-center gap-1.5 text-destructive animate-in slide-in-from-top-2">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">{error}</span>
                    </div>
                )}
            </div>

            {/* Live preview for newly selected file */}
            {file && previewUrl && (
                <div className="rounded-xl border border-primary/20 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300 bg-muted/10">
                    {file.type.startsWith("image/") ? (
                        <div className="relative">
                            <img
                                src={previewUrl}
                                alt="Preview"
                                className="w-full max-h-56 object-contain bg-muted/20"
                            />
                            <div className="absolute top-2 right-2">
                                <Badge variant="outline" className="text-[10px] border-primary/20 text-primary bg-background/80 backdrop-blur-sm">Preview</Badge>
                            </div>
                        </div>
                    ) : file.type === "application/pdf" ? (
                        <div className="flex items-center justify-between p-3">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded bg-red-500/10">
                                    <FileText className="h-4 w-4 text-red-500" />
                                </div>
                                <div>
                                    <p className="text-xs font-semibold">PDF Ready</p>
                                    <p className="text-[10px] text-muted-foreground truncate max-w-[180px]">{file.name}</p>
                                </div>
                            </div>
                            <a
                                href={previewUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="flex items-center gap-1 text-[10px] font-medium text-primary hover:underline"
                            >
                                <ExternalLink className="h-3 w-3" /> View PDF
                            </a>
                        </div>
                    ) : null}
                </div>
            )}

            {/* Current File Preview (if editing, no new file selected) */}
            {currentFileUrl && !file && (
                <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30 border-primary/20 animate-in fade-in duration-300">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded bg-primary/10">
                            <FileText className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                            <p className="text-xs font-medium">Currently Uploaded</p>
                            <p className="text-[10px] text-muted-foreground font-mono truncate max-w-[200px]">
                                {currentFileUrl.split("/").pop()}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] border-primary/20 text-primary">Active</Badge>
                        {currentFileUrl.endsWith(".pdf") || currentFileUrl.includes("/pdf") ? (
                            <a
                                href={currentFileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="flex items-center gap-1 text-[10px] font-medium text-primary hover:underline"
                            >
                                <ExternalLink className="h-3 w-3" /> View
                            </a>
                        ) : null}
                    </div>
                </div>
            )}
        </div>
    );
}
