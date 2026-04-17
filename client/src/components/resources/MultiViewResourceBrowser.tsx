import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  FileText,
  Video,
  BookOpen,
  FileSpreadsheet,
  Grid3X3,
  List,
  Columns,
  Loader2,
  Search,
  Filter,
  ChevronDown,
  Download,
  Eye,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

type ResourceType = "past_paper" | "notes" | "video" | "ebook";
type ViewMode = "grid" | "list" | "split";

interface Resource {
  id: string;
  title: string;
  type: string;
  subject: string;
  year?: number;
  session?: string;
  paper?: number;
  fileSize?: number;
  downloadCount: number;
  createdAt: string;
  thumbnailUrl?: string;
}

const RESOURCE_TYPE_CONFIG: Record<ResourceType, { icon: typeof FileText; label: string; color: string }> = {
  past_paper: { icon: FileSpreadsheet, label: "Past Paper", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  notes: { icon: FileText, label: "Notes", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  video: { icon: Video, label: "Video", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
  ebook: { icon: BookOpen, label: "E-Book", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
};

// Mock data - replace with real API call
async function fetchResources(type?: string, subject?: string, year?: number): Promise<Resource[]> {
  // TODO: Replace with real API endpoint
  await new Promise((resolve) => setTimeout(resolve, 500));
  return [
    {
      id: "1",
      title: "Mathematics Paper 2 - May/June 2023",
      type: "past_paper",
      subject: "Mathematics",
      year: 2023,
      session: "May/June",
      paper: 2,
      fileSize: 2500000,
      downloadCount: 145,
      createdAt: "2024-01-15",
    },
    {
      id: "2",
      title: "Physics Chapter 5: Thermodynamics Notes",
      type: "notes",
      subject: "Physics",
      fileSize: 1200000,
      downloadCount: 89,
      createdAt: "2024-02-10",
    },
    {
      id: "3",
      title: "Chemistry Organic Reactions Video",
      type: "video",
      subject: "Chemistry",
      fileSize: 150000000,
      downloadCount: 234,
      createdAt: "2024-03-05",
    },
    {
      id: "4",
      title: "Biology Complete Textbook",
      type: "ebook",
      subject: "Biology",
      fileSize: 25000000,
      downloadCount: 567,
      createdAt: "2024-01-20",
    },
    {
      id: "5",
      title: "English Literature Paper 1 - Oct/Nov 2022",
      type: "past_paper",
      subject: "English",
      year: 2022,
      session: "Oct/Nov",
      paper: 1,
      fileSize: 1800000,
      downloadCount: 98,
      createdAt: "2023-12-01",
    },
    {
      id: "6",
      title: "Computer Science Programming Notes",
      type: "notes",
      subject: "Computer Science",
      fileSize: 800000,
      downloadCount: 156,
      createdAt: "2024-04-12",
    },
  ].filter((r) => {
    if (type && r.type !== type) return false;
    if (subject && r.subject !== subject) return false;
    if (year && r.year !== year) return false;
    return true;
  });
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function GridCard({ resource }: { resource: Resource }) {
  const config = RESOURCE_TYPE_CONFIG[resource.type as ResourceType] || RESOURCE_TYPE_CONFIG.notes;
  const Icon = config.icon;

  return (
    <Card className="group hover:shadow-lg transition-all cursor-pointer border-2 hover:border-primary/20">
      <CardContent className="p-4">
        <div className="aspect-video bg-muted rounded-lg mb-3 flex items-center justify-center">
          <Icon className="h-12 w-12 text-muted-foreground/50" />
        </div>
        <h3 className="font-medium text-sm line-clamp-2 mb-2">{resource.title}</h3>
        <div className="flex flex-wrap gap-1.5 mb-3">
          <Badge variant="outline" className="text-xs">
            {config.label}
          </Badge>
          {resource.year && (
            <Badge variant="secondary" className="text-xs">
              {resource.year}
            </Badge>
          )}
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{resource.fileSize ? formatFileSize(resource.fileSize) : "N/A"}</span>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1">
              <Download className="h-3 w-3" />
              {resource.downloadCount}
            </span>
          </div>
        </div>
        <div className="mt-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Link href={`/view/file/${resource.id}`}>
            <Button size="sm" variant="outline" className="flex-1 h-8">
              <Eye className="h-3 w-3 mr-1" />
              View
            </Button>
          </Link>
          <Button size="sm" className="flex-1 h-8">
            <Download className="h-3 w-3 mr-1" />
            Download
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ListItem({ resource }: { resource: Resource }) {
  const config = RESOURCE_TYPE_CONFIG[resource.type as ResourceType] || RESOURCE_TYPE_CONFIG.notes;
  const Icon = config.icon;

  return (
    <Card className="hover:shadow-md transition-all cursor-pointer">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0 h-12 w-12 bg-muted rounded-lg flex items-center justify-center">
            <Icon className="h-6 w-6 text-muted-foreground/50" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium truncate">{resource.title}</h3>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs">
                {config.label}
              </Badge>
              <span className="text-xs text-muted-foreground">{resource.subject}</span>
              {resource.year && (
                <Badge variant="secondary" className="text-xs">
                  {resource.year}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground flex-shrink-0">
            <span>{resource.fileSize ? formatFileSize(resource.fileSize) : "N/A"}</span>
            <span className="flex items-center gap-1">
              <Download className="h-4 w-4" />
              {resource.downloadCount}
            </span>
            <Link href={`/view/file/${resource.id}`}>
              <Button size="sm" variant="ghost">
                <Eye className="h-4 w-4" />
              </Button>
            </Link>
            <Button size="sm">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SplitView({ resources }: { resources: Resource[] }) {
  const [selectedId1, setSelectedId1] = useState<string | null>(resources[0]?.id || null);
  const [selectedId2, setSelectedId2] = useState<string | null>(null);

  const selected1 = resources.find((r) => r.id === selectedId1);
  const selected2 = resources.find((r) => r.id === selectedId2);

  const config1 = selected1 ? RESOURCE_TYPE_CONFIG[selected1.type as ResourceType] : null;
  const config2 = selected2 ? RESOURCE_TYPE_CONFIG[selected2.type as ResourceType] : null;

  return (
    <div className="flex flex-col gap-4 h-[calc(100vh-18rem)]">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
        {/* List Panel */}
        <Card className="lg:col-span-1 overflow-hidden flex flex-col">
          <div className="p-3 border-b bg-muted/30">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Select two files to compare</p>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {resources.map((resource) => {
                const isSelected1 = selectedId1 === resource.id;
                const isSelected2 = selectedId2 === resource.id;
                const config = RESOURCE_TYPE_CONFIG[resource.type as ResourceType] || RESOURCE_TYPE_CONFIG.notes;

                return (
                  <button
                    key={resource.id}
                    onClick={() => {
                      if (isSelected1) {
                        // Swap or deselect? Usually just keep it as primary.
                      } else if (isSelected2) {
                        setSelectedId2(null);
                      } else {
                        // If no second slot, use it. If slot 2 is full, maybe rotate?
                        if (!selectedId2) setSelectedId2(resource.id);
                        else setSelectedId1(resource.id);
                      }
                    }}
                    className={cn(
                      "w-full text-left p-2 rounded-md transition-all border",
                      isSelected1 ? "bg-primary/10 border-primary/30" :
                        isSelected2 ? "bg-secondary border-secondary" :
                          "hover:bg-muted border-transparent"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "h-6 w-6 rounded flex items-center justify-center shrink-0",
                        isSelected1 ? "bg-primary text-primary-foreground" :
                          isSelected2 ? "bg-blue-600 text-white" : "bg-muted text-muted-foreground"
                      )}>
                        <config.icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-xs truncate">{resource.title}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {isSelected1 && <Badge variant="default" className="h-4 px-1 text-[8px] uppercase">Slot 1</Badge>}
                          {isSelected2 && <Badge className="h-4 px-1 text-[8px] uppercase bg-blue-600">Slot 2</Badge>}
                          <span className="text-[10px] text-muted-foreground">{resource.subject}</span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </Card>

        {/* Dual Preview Panel */}
        <Card className="lg:col-span-2 overflow-hidden flex flex-col bg-muted/20">
          <div className="flex-1 p-4 grid grid-cols-2 gap-4">
            {/* Slot 1 */}
            <div className="border rounded-lg bg-background flex flex-col overflow-hidden shadow-sm">
              <div className="p-2 border-b bg-muted/10 flex items-center justify-between">
                <Badge variant="outline" className="text-[10px]">SLOT 1</Badge>
                {selected1 && <button onClick={() => setSelectedId1(null)} className="text-muted-foreground hover:text-foreground"><X className="h-3 w-3" /></button>}
              </div>
              <div className="flex-1 flex flex-col items-center justify-center p-4">
                {selected1 ? (
                  <>
                    <config1.icon className="h-16 w-16 text-primary/20 mb-3" />
                    <p className="text-sm font-medium text-center line-clamp-2">{selected1.title}</p>
                    <Link href={`/view/file/${selected1.id}`} className="mt-4">
                      <Button variant="outline" size="sm" className="h-8">
                        <Eye className="h-3 w-3 mr-2" />
                        Quick View
                      </Button>
                    </Link>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground">Select primary file</p>
                )}
              </div>
            </div>

            {/* Slot 2 */}
            <div className="border rounded-lg bg-background flex flex-col overflow-hidden shadow-sm">
              <div className="p-2 border-b bg-muted/10 flex items-center justify-between">
                <Badge variant="outline" className="text-[10px]">SLOT 2</Badge>
                {selected2 && <button onClick={() => setSelectedId2(null)} className="text-muted-foreground hover:text-foreground"><X className="h-3 w-3" /></button>}
              </div>
              <div className="flex-1 flex flex-col items-center justify-center p-4">
                {selected2 ? (
                  <>
                    <config2.icon className="h-16 w-16 text-blue-600/20 mb-3" />
                    <p className="text-sm font-medium text-center line-clamp-2">{selected2.title}</p>
                    <Link href={`/view/file/${selected2.id}`} className="mt-4">
                      <Button variant="outline" size="sm" className="h-8">
                        <Eye className="h-3 w-3 mr-2" />
                        Quick View
                      </Button>
                    </Link>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground">Select secondary file (e.g. Marking Scheme)</p>
                )}
              </div>
            </div>
          </div>

          <div className="p-4 border-t bg-background flex justify-center">
            <Link href={selectedId1 && selectedId2 ? `/view/multiview/${selectedId1}/${selectedId2}` : '#'}>
              <Button
                disabled={!selectedId1 || !selectedId2}
                className="gap-2 px-8 py-6 text-lg shadow-lg font-bold"
              >
                <Split className="h-5 w-5" />
                Launch Side-by-Side Multi-view
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}

export function MultiViewResourceBrowser({ resources, isLoading = false }: { resources: Resource[]; isLoading?: boolean }) {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    type: "all",
    subject: "all",
    year: "all",
  });

  const filteredResources = (resources || []).filter((r) => {
    // Apply local filters if type/subject/year are selected
    if (filters.type !== "all" && r.type !== filters.type) return false;
    if (filters.subject !== "all" && r.subject !== filters.subject) return false;
    if (filters.year !== "all" && r.year !== parseInt(filters.year)) return false;

    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.title.toLowerCase().includes(q) ||
      r.subject.toLowerCase().includes(q)
    );
  });

  // Mobile: force list view, hide split view
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const effectiveViewMode = isMobile ? "list" : viewMode === "split" ? "split" : viewMode;

  const FilterContent = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Resource Type</label>
        <Select value={filters.type} onValueChange={(v) => setFilters((f) => ({ ...f, type: v }))}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="past_paper">Past Papers</SelectItem>
            <SelectItem value="notes">Notes</SelectItem>
            <SelectItem value="video">Videos</SelectItem>
            <SelectItem value="ebook">E-Books</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Separator />
      <div className="space-y-2">
        <label className="text-sm font-medium">Subject</label>
        <Select value={filters.subject} onValueChange={(v) => setFilters((f) => ({ ...f, subject: v }))}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Subjects</SelectItem>
            <SelectItem value="Mathematics">Mathematics</SelectItem>
            <SelectItem value="Physics">Physics</SelectItem>
            <SelectItem value="Chemistry">Chemistry</SelectItem>
            <SelectItem value="Biology">Biology</SelectItem>
            <SelectItem value="English">English</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Separator />
      <div className="space-y-2">
        <label className="text-sm font-medium">Year</label>
        <Select value={filters.year} onValueChange={(v) => setFilters((f) => ({ ...f, year: v }))}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Years</SelectItem>
            <SelectItem value="2024">2024</SelectItem>
            <SelectItem value="2023">2023</SelectItem>
            <SelectItem value="2022">2022</SelectItem>
            <SelectItem value="2021">2021</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button
        variant="outline"
        className="w-full"
        onClick={() => setFilters({ type: "all", subject: "all", year: "all" })}
      >
        Clear Filters
      </Button>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search resources..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Mobile: Sheet filter */}
            <div className="sm:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80">
                  <SheetHeader>
                    <SheetTitle>Filters</SheetTitle>
                  </SheetHeader>
                  <div className="mt-4">
                    <FilterContent />
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {/* Desktop: Inline filter button */}
            <div className="hidden sm:block">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                    <ChevronDown className="h-3 w-3 ml-1" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80">
                  <SheetHeader>
                    <SheetTitle>Filters</SheetTitle>
                  </SheetHeader>
                  <div className="mt-4">
                    <FilterContent />
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {/* View mode selector */}
            {!isMobile && (
              <div className="flex items-center gap-1 border rounded-md p-1">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="h-8 w-8 p-0"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="h-8 w-8 p-0"
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "split" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("split")}
                  className="h-8 w-8 p-0"
                >
                  <Columns className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Active filters */}
          {(filters.type !== "all" || filters.subject !== "all" || filters.year !== "all") && (
            <div className="flex flex-wrap gap-2 mt-3">
              {filters.type !== "all" && (
                <Badge variant="secondary" className="gap-1">
                  Type: {RESOURCE_TYPE_CONFIG[filters.type as ResourceType]?.label || filters.type}
                  <button
                    onClick={() => setFilters((f) => ({ ...f, type: "all" }))}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {filters.subject !== "all" && (
                <Badge variant="secondary" className="gap-1">
                  Subject: {filters.subject}
                  <button
                    onClick={() => setFilters((f) => ({ ...f, subject: "all" }))}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {filters.year !== "all" && (
                <Badge variant="secondary" className="gap-1">
                  Year: {filters.year}
                  <button
                    onClick={() => setFilters((f) => ({ ...f, year: "all" }))}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : effectiveViewMode === "split" ? (
        <SplitView resources={filteredResources} />
      ) : effectiveViewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredResources.map((resource) => (
            <GridCard key={resource.id} resource={resource} />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredResources.map((resource) => (
            <ListItem key={resource.id} resource={resource} />
          ))}
        </div>
      )}

      {filteredResources.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">No resources found</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Try adjusting your search or filters.
          </p>
        </div>
      )}
    </div>
  );
}
