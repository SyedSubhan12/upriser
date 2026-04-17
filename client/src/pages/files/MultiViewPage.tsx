import { useParams, useLocation } from "wouter";
import { useState, useMemo } from "react";
import { Download, X, Maximize, Sun, Moon, Split, ChevronLeft, ChevronRight, Search, FileText, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import type { FileAsset } from "@/lib/curriculumData";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export function MultiViewPage() {
    const { fileId1, fileId2 } = useParams<{ fileId1: string, fileId2: string }>();
    const isSelecting = fileId2 === 'select';

    const [, navigate] = useLocation();
    const [isDark, setIsDark] = useState(false);
    const [splitRatio, setSplitRatio] = useState(isSelecting ? 30 : 50); // percentage for left pane
    const [searchQuery, setSearchQuery] = useState("");

    // Fetch file1 details
    const { data: file1, isLoading: isLoading1 } = useQuery<FileAsset>({
        queryKey: [`/api/curriculum/files/${fileId1}`],
        enabled: !!fileId1,
    });

    // Fetch file2 details (only if not selecting)
    const { data: file2, isLoading: isLoading2 } = useQuery<FileAsset>({
        queryKey: [`/api/curriculum/files/${fileId2}`],
        enabled: !!fileId2 && !isSelecting,
    });

    // Fetch sibling files for selection
    const { data: siblingFiles = [], isLoading: isLoadingSiblings } = useQuery<FileAsset[]>({
        queryKey: [`/api/curriculum/subjects/${file1?.subjectId}/resource/${file1?.resourceKey}/files`],
        enabled: !!file1?.subjectId && !!file1?.resourceKey && isSelecting,
    });

    // Group siblings by Year and Session
    const groupedSiblings = useMemo(() => {
        const filtered = siblingFiles.filter(s =>
            s.id !== fileId1 && (
                s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                s.fileName?.toLowerCase().includes(searchQuery.toLowerCase())
            )
        );

        const groups: Record<number, Record<string, FileAsset[]>> = {};

        filtered.forEach(s => {
            const year = s.year || 0;
            const session = s.session || 'Other';

            if (!groups[year]) groups[year] = {};
            if (!groups[year][session]) groups[year][session] = [];
            groups[year][session].push(s);
        });

        // Sort years descending
        return Object.entries(groups)
            .sort(([a], [b]) => Number(b) - Number(a))
            .map(([year, sessions]) => ({
                year: Number(year),
                sessions: Object.entries(sessions).sort(([a], [b]) => a.localeCompare(b))
            }));
    }, [siblingFiles, fileId1, searchQuery]);

    // Find a "matching" related file for highlight
    const relatedFile = useMemo(() => {
        if (!file1) return null;
        return siblingFiles.find(s =>
            s.id !== fileId1 &&
            s.year === file1.year &&
            s.session === file1.session &&
            s.paper === file1.paper &&
            s.variant === file1.variant &&
            ((file1.fileType === 'qp' && s.fileType === 'ms') || (file1.fileType === 'ms' && s.fileType === 'qp'))
        );
    }, [siblingFiles, file1, fileId1]);

    const handleClose = () => {
        window.history.back();
    };

    const toggleTheme = () => {
        setIsDark(!isDark);
    };

    const handleSelectFile = (id: string) => {
        navigate(`/view/multiview/${fileId1}/${id}`);
    };

    if (isLoading1 || (isLoading2 && !isSelecting)) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <div className="text-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
                    <p className="mt-4 text-muted-foreground">Loading documents...</p>
                </div>
            </div>
        );
    }

    const origin = window.location.origin;
    const getFileUrl = (file?: FileAsset) => {
        if (!file?.url) return null;
        return file.url.startsWith("http") ? file.url : `${origin}${file.url}`;
    };

    const url1 = getFileUrl(file1);
    const url2 = getFileUrl(file2);

    return (
        <div className={cn("flex h-screen flex-col", isDark ? "bg-gray-900" : "bg-gray-100")}>
            {/* Top Control Bar */}
            <div className={cn(
                "flex items-center justify-between px-4 py-3 shadow-md z-10",
                isDark ? "bg-gray-800 text-white" : "bg-white text-gray-900"
            )}>
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleClose}
                        className="h-9 w-9 rounded-full hover:bg-destructive/10"
                        title="Close"
                    >
                        <X className="h-5 w-5" />
                    </Button>
                    <div className="hidden sm:block">
                        <h1 className="font-semibold text-sm">Multi-view Explorer</h1>
                        <p className="text-xs text-muted-foreground">
                            {file1?.title} {isSelecting ? "" : `vs ${file2?.title || "..."}`}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleTheme}
                        className="h-9 w-9"
                        title="Toggle theme"
                    >
                        {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                    </Button>
                    <div className="h-6 w-px bg-border mx-1" />
                    <Button variant="outline" size="sm" onClick={() => setSplitRatio(50)}>50:50</Button>
                    <Button variant="outline" size="sm" onClick={() => setSplitRatio(30)}>30:70</Button>
                    <Button variant="outline" size="sm" onClick={() => setSplitRatio(70)}>70:30</Button>
                    {!isSelecting && (
                        <Button
                            variant="default"
                            size="sm"
                            onClick={() => navigate(`/view/multiview/${fileId1}/select`)}
                            className="bg-blue-600 hover:bg-blue-700 ml-2"
                        >
                            Change File 2
                        </Button>
                    )}
                </div>
            </div>

            {/* Side-by-Side Viewers */}
            <div className="flex-1 flex overflow-hidden relative">
                {/* Left Pane */}
                <div
                    style={{ width: `${splitRatio}%` }}
                    className="h-full border-r relative"
                >
                    {url1 ? (
                        <iframe src={url1} className="h-full w-full border-0" title={file1?.title} />
                    ) : (
                        <div className="flex h-full items-center justify-center p-8 text-center text-muted-foreground">
                            No content for file 1
                        </div>
                    )}
                    <div className="absolute top-2 left-2 px-2 py-1 bg-black/50 text-white text-[10px] rounded uppercase tracking-wider font-bold">
                        Left Pane
                    </div>
                </div>

                {/* Divider Handle */}
                <div className="w-1 bg-border hover:bg-primary cursor-col-resize transition-colors" />

                {/* Right Pane */}
                <div
                    style={{ width: `${100 - splitRatio}%` }}
                    className="h-full relative bg-background flex flex-col overflow-hidden"
                >
                    {isSelecting ? (
                        <div className="flex h-full flex-col overflow-hidden">
                            <div className="p-4 border-b bg-muted/30">
                                <h2 className="font-semibold text-sm mb-3">Select second file for Multi-view</h2>
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search papers..."
                                        className="pl-9 h-9"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 select-none">
                                {isLoadingSiblings ? (
                                    <div className="py-8 text-center text-muted-foreground text-sm">Loading files...</div>
                                ) : (
                                    <>
                                        {relatedFile && !searchQuery && (
                                            <div className="mb-6">
                                                <p className="text-[10px] font-bold uppercase tracking-wider text-primary mb-2">Recommended Matching Paper</p>
                                                <button
                                                    onClick={() => handleSelectFile(relatedFile.id)}
                                                    className="w-full text-left p-3 rounded-lg border-2 border-primary bg-primary/5 hover:bg-primary/10 transition-all flex items-start gap-3"
                                                >
                                                    <FileText className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <p className="font-bold text-sm truncate">{relatedFile.title}</p>
                                                            <Badge variant="default" className="text-[9px] h-3.5 px-1 uppercase leading-none">Match</Badge>
                                                        </div>
                                                        <p className="text-xs text-muted-foreground mt-0.5">{relatedFile.fileName}</p>
                                                    </div>
                                                </button>
                                            </div>
                                        )}

                                        <div className="w-full space-y-2 pb-8">
                                            {groupedSiblings.map((group) => (
                                                <details key={group.year} open={group.year !== 0} className="border rounded-md bg-muted/10 overflow-hidden group">
                                                    <summary className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-muted/20 transition-colors list-none outline-none">
                                                        <span className="font-semibold text-sm">Year {group.year === 0 ? "Other" : group.year}</span>
                                                        <ChevronDown className="h-4 w-4 transition-transform duration-200 group-open:rotate-180" />
                                                    </summary>
                                                    <div className="p-2 pt-1 border-t border-muted/20">
                                                        {group.sessions.map(([session, files]) => (
                                                            <div key={session} className="mt-2 first:mt-0">
                                                                <p className="text-[10px] uppercase font-bold text-muted-foreground px-2 mb-1">{session}</p>
                                                                <div className="space-y-1">
                                                                    {files.map(f => (
                                                                        <button
                                                                            key={f.id}
                                                                            onClick={() => handleSelectFile(f.id)}
                                                                            className={cn(
                                                                                "w-full text-left px-2 py-1.5 rounded text-sm hover:bg-accent transition-colors flex items-center gap-2",
                                                                                f.id === relatedFile?.id && "text-primary font-medium"
                                                                            )}
                                                                        >
                                                                            <FileText className="h-3.5 w-3.5 shrink-0 opacity-60" />
                                                                            <span className="truncate">{f.title}</span>
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </details>
                                            ))}
                                        </div>

                                        {groupedSiblings.length === 0 && (
                                            <div className="py-12 text-center">
                                                <p className="text-sm text-muted-foreground">No matching files found.</p>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="h-full relative overflow-hidden flex flex-col">
                            {url2 ? (
                                <iframe src={url2} className="h-full w-full border-0" title={file2?.title} />
                            ) : (
                                <div className="flex h-full items-center justify-center p-8 text-center text-muted-foreground">
                                    No content for file 2
                                </div>
                            )}
                            <div className="absolute top-2 right-2 px-2 py-1 bg-black/50 text-white text-[10px] rounded uppercase tracking-wider font-bold">
                                Right Pane
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
