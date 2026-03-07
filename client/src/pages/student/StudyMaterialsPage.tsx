import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronRight,
  FileText,
  Video,
  ClipboardList,
  BookOpen,
  Eye,
  Download,
  Filter,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  mockBoards,
  mockSubjects,
  mockTopics,
  mockMaterials,
  getMaterialsByFilters,
  getSubjectsByBoard,
  getTopicsBySubject,
} from "@/lib/mockData";
import type { Board, Subject, Topic, Material } from "@shared/schema";
import { RESOURCE_TYPE_LABELS, DIFFICULTY_LEVELS } from "@shared/schema";

interface StudyTreeSidebarProps {
  boards: Board[];
  subjects: Subject[];
  topics: Topic[];
  onSelect: (filters: { boardId?: string; subjectId?: string; topicId?: string }) => void;
  selectedFilters: { boardId?: string; subjectId?: string; topicId?: string };
  isLoading?: boolean;
}

function StudyTreeSidebar({ boards, subjects, topics, onSelect, selectedFilters, isLoading }: StudyTreeSidebarProps) {
  const [openBoards, setOpenBoards] = useState<string[]>([boards[0]?.id || ""]);
  const [openSubjects, setOpenSubjects] = useState<string[]>([]);

  const toggleBoard = (boardId: string) => {
    setOpenBoards((prev) =>
      prev.includes(boardId)
        ? prev.filter((id) => id !== boardId)
        : [...prev, boardId]
    );
  };

  const toggleSubject = (subjectId: string) => {
    setOpenSubjects((prev) =>
      prev.includes(subjectId)
        ? prev.filter((id) => id !== subjectId)
        : [...prev, subjectId]
    );
  };

  const handleSelectBoard = (boardId: string) => {
    onSelect({ boardId, subjectId: undefined, topicId: undefined });
  };

  const handleSelectSubject = (boardId: string, subjectId: string) => {
    onSelect({ boardId, subjectId, topicId: undefined });
  };

  const handleSelectTopic = (boardId: string, subjectId: string, topicId: string) => {
    onSelect({ boardId, subjectId, topicId });
  };

  if (isLoading) {
    return (
      <div className="space-y-2" data-testid="study-tree-sidebar">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-1" data-testid="study-tree-sidebar">
      {boards.map((board) => {
        const boardSubjects = subjects.filter((s) => s.boardId === board.id);
        const isBoardOpen = openBoards.includes(board.id);
        const isBoardSelected = selectedFilters.boardId === board.id && !selectedFilters.subjectId;

        return (
          <Collapsible
            key={board.id}
            open={isBoardOpen}
            onOpenChange={() => toggleBoard(board.id)}
          >
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className={`w-full justify-start gap-2 ${isBoardSelected ? "bg-muted" : ""}`}
                data-testid={`tree-board-${board.id}`}
                onClick={() => handleSelectBoard(board.id)}
              >
                <ChevronRight
                  className={`h-4 w-4 transition-transform ${isBoardOpen ? "rotate-90" : ""}`}
                />
                <span className="truncate">{board.displayName}</span>
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pl-4">
              {boardSubjects.map((subject) => {
                const subjectTopics = topics.filter((t) => t.subjectId === subject.id && !t.parentId);
                const isSubjectOpen = openSubjects.includes(subject.id);
                const isSubjectSelected =
                  selectedFilters.subjectId === subject.id && !selectedFilters.topicId;

                return (
                  <Collapsible
                    key={subject.id}
                    open={isSubjectOpen}
                    onOpenChange={() => toggleSubject(subject.id)}
                  >
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        className={`w-full justify-start gap-2 ${isSubjectSelected ? "bg-muted" : ""}`}
                        data-testid={`tree-subject-${subject.id}`}
                        onClick={() => handleSelectSubject(board.id, subject.id)}
                      >
                        <ChevronRight
                          className={`h-4 w-4 transition-transform ${isSubjectOpen ? "rotate-90" : ""}`}
                        />
                        <span className="truncate">{subject.subjectName}</span>
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pl-4">
                      {subjectTopics.map((topic) => {
                        const isTopicSelected = selectedFilters.topicId === topic.id;
                        return (
                          <Button
                            key={topic.id}
                            variant="ghost"
                            className={`w-full justify-start text-sm ${isTopicSelected ? "bg-muted" : ""}`}
                            data-testid={`tree-topic-${topic.id}`}
                            onClick={() =>
                              handleSelectTopic(board.id, subject.id, topic.id)
                            }
                          >
                            {topic.name}
                          </Button>
                        );
                      })}
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </CollapsibleContent>
          </Collapsible>
        );
      })}
    </div>
  );
}

interface ResourceCardProps {
  material: Material;
  subjects: Subject[];
}

function ResourceCard({ material, subjects }: ResourceCardProps) {
  const subject = subjects.find((s) => s.id === material.subjectId);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "video":
        return <Video className="h-4 w-4" />;
      case "past_paper":
        return <ClipboardList className="h-4 w-4" />;
      case "notes":
        return <FileText className="h-4 w-4" />;
      default:
        return <BookOpen className="h-4 w-4" />;
    }
  };

  return (
    <Link href={`/student/materials/${material.id}`}>
      <Card
        className="hover-elevate cursor-pointer h-full"
        data-testid={`material-card-${material.id}`}
      >
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <Badge variant="outline" className="gap-1">
              {getTypeIcon(material.type)}
              {RESOURCE_TYPE_LABELS[material.type as keyof typeof RESOURCE_TYPE_LABELS] ||
                material.type}
            </Badge>
            {material.year && (
              <Badge variant="secondary">{material.year}</Badge>
            )}
          </div>
          <CardTitle className="text-base mt-2 line-clamp-2">
            {material.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {subject && (
            <p className="text-sm text-muted-foreground">{subject.subjectName}</p>
          )}
          {material.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {material.description}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {material.viewCount}
            </span>
            <span className="flex items-center gap-1">
              <Download className="h-3 w-3" />
              {material.downloadCount}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export function StudyMaterialsPage() {
  const [treeFilters, setTreeFilters] = useState<{
    boardId?: string;
    subjectId?: string;
    topicId?: string;
  }>({});

  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");

  const { data: boards = [], isLoading: isLoadingBoards } = useQuery<Board[]>({
    queryKey: ["/api/boards"],
    queryFn: async () => {
      const response = await fetch("/api/boards", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch boards");
      return response.json();
    },
  });

  const { data: subjects = [], isLoading: isLoadingSubjects } = useQuery<Subject[]>({
    queryKey: ["/api/subjects"],
    queryFn: async () => {
      const response = await fetch("/api/subjects", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch subjects");
      return response.json();
    },
  });

  const { data: topics = [], isLoading: isLoadingTopics } = useQuery<Topic[]>({
    queryKey: ["/api/topics", { subjectId: treeFilters.subjectId }],
    queryFn: async () => {
      if (!treeFilters.subjectId) return [];
      const response = await fetch(`/api/topics?subjectId=${treeFilters.subjectId}`, { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch topics");
      return response.json();
    },
    enabled: !!treeFilters.subjectId,
  });

  const buildMaterialsUrl = () => {
    const params = new URLSearchParams();
    if (treeFilters.boardId) params.append("boardId", treeFilters.boardId);
    if (treeFilters.subjectId) params.append("subjectId", treeFilters.subjectId);
    if (treeFilters.topicId) params.append("topicId", treeFilters.topicId);
    if (typeFilter !== "all") params.append("type", typeFilter);
    return `/api/materials?${params.toString()}`;
  };

  const { data: materials = [], isLoading: isLoadingMaterials } = useQuery<Material[]>({
    queryKey: ["/api/materials", treeFilters, typeFilter],
    queryFn: async () => {
      const response = await fetch(buildMaterialsUrl(), { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch materials");
      return response.json();
    },
  });

  const boardsData = boards.length > 0 ? boards : mockBoards;
  const subjectsData = subjects.length > 0 ? subjects : mockSubjects;
  const topicsData = topics.length > 0 ? topics : (treeFilters.subjectId ? getTopicsBySubject(treeFilters.subjectId) : mockTopics);

  const materialsData = materials.length > 0 ? materials : getMaterialsByFilters(treeFilters);
  const filteredMaterials = materialsData.filter((m) => {
    if (typeFilter !== "all" && m.type !== typeFilter) return false;
    if (yearFilter !== "all" && m.year?.toString() !== yearFilter) return false;
    if (difficultyFilter !== "all" && m.difficulty !== difficultyFilter) return false;
    return true;
  });

  const years = Array.from(
    new Set(mockMaterials.filter((m) => m.year).map((m) => m.year))
  ).sort((a, b) => (b || 0) - (a || 0));

  const isTreeLoading = isLoadingBoards || isLoadingSubjects;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Study Materials"
        description="Browse notes, videos, past papers, and worksheets"
      />

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="w-full lg:w-64 shrink-0">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Browse</CardTitle>
            </CardHeader>
            <CardContent>
              <StudyTreeSidebar
                boards={boardsData}
                subjects={subjectsData}
                topics={topicsData}
                onSelect={setTreeFilters}
                selectedFilters={treeFilters}
                isLoading={isTreeLoading}
              />
            </CardContent>
          </Card>
        </div>

        <div className="flex-1 space-y-4">
          <Card>
            <CardContent className="py-4">
              <div
                className="flex flex-wrap items-center gap-4"
                data-testid="filter-bar"
              >
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Filters:</span>
                </div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger
                    className="w-[140px]"
                    data-testid="filter-type"
                  >
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="past_paper">Past Paper</SelectItem>
                    <SelectItem value="notes">Notes</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="worksheet">Worksheet</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={yearFilter} onValueChange={setYearFilter}>
                  <SelectTrigger className="w-[120px]" data-testid="filter-year">
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Years</SelectItem>
                    {years.map((year) => (
                      <SelectItem key={year} value={year?.toString() || ""}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={difficultyFilter}
                  onValueChange={setDifficultyFilter}
                >
                  <SelectTrigger
                    className="w-[130px]"
                    data-testid="filter-difficulty"
                  >
                    <SelectValue placeholder="Difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    {DIFFICULTY_LEVELS.map((level) => (
                      <SelectItem key={level} value={level}>
                        {level.charAt(0).toUpperCase() + level.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {isLoadingMaterials ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" data-testid="materials-grid">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i}>
                  <CardHeader className="pb-2">
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-5 w-full mt-2" />
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-16" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredMaterials.length > 0 ? (
            <div
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
              data-testid="materials-grid"
            >
              {filteredMaterials.map((material) => (
                <ResourceCard key={material.id} material={material} subjects={subjectsData} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  No materials found matching your filters.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
