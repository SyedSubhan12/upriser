import { useParams, useLocation, useRoute } from "wouter";
import { useState } from "react";
import { Download, X, Maximize, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import type { FileAsset } from "@/lib/curriculumData";

export function PDFViewerPage() {
  const [, params] = useRoute("/view/file/:fileId");
  const fileId = params?.fileId;
  const [, navigate] = useLocation();
  const [isDark, setIsDark] = useState(false);

  // Fetch file details
  const { data: file, isLoading } = useQuery<FileAsset>({
    queryKey: [`/api/curriculum/files/${fileId}`],
    enabled: !!fileId,
  });

  const handleDownload = () => {
    if (file?.url) {
      const link = document.createElement("a");
      link.href = file.url;
      // Use the subject-friendly title as the download name
      link.download = file.title;
      link.click();
    }
  };

  const handleFullscreen = () => {
    const iframe = document.getElementById("pdf-iframe") as HTMLIFrameElement;
    if (iframe) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        iframe.requestFullscreen();
      }
    }
  };

  const handleClose = () => {
    window.history.back();
  };

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  if (isLoading || !file) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading document...</p>
        </div>
      </div>
    );
  }

  // Build the viewing URL
  // On localhost, we use the raw URL directly in the iframe to leverage the browser's native PDF viewer.
  // Google Docs Viewer (used previously) requires a publicly accessible URL, which won't work for local development.
  const origin = window.location.origin;
  const fileUrl = file.url
    ? (file.url.startsWith("http") ? file.url : `${origin}${file.url}`)
    : null;

  return (
    <div className={cn("flex h-screen flex-col", isDark ? "bg-gray-900" : "bg-gray-100")}>
      {/* Top Control Bar */}
      <div className={cn(
        "flex items-center justify-between px-4 py-3 shadow-md",
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
            <h1 className="font-semibold text-sm truncate max-w-md">{file?.title}</h1>
            <p className="text-xs text-muted-foreground">{file?.fileName}</p>
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
          <Button
            variant="ghost"
            size="icon"
            onClick={handleFullscreen}
            className="h-9 w-9"
            title="Fullscreen"
          >
            <Maximize className="h-4 w-4" />
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleDownload}
            className="gap-2"
            title="Download"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Download</span>
          </Button>
        </div>
      </div>

      {/* PDF Viewer */}
      <div className="flex-1 overflow-hidden">
        {fileUrl ? (
          <iframe
            id="pdf-iframe"
            src={fileUrl}
            className="h-full w-full border-0"
            title={file.title}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center space-y-4 p-8 text-center">
            <div className="rounded-full bg-muted p-6">
              <Download className="h-12 w-12 text-muted-foreground" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Preview not available</h2>
              <p className="mt-2 text-muted-foreground">
                This document cannot be previewed directly. Please download it to view the content.
              </p>
            </div>
            <Button onClick={handleDownload} size="lg" className="mt-4">
              <Download className="mr-2 h-4 w-4" />
              Download {file.fileName}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
