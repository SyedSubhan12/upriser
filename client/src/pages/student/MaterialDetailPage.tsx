import { useParams, Link } from "wouter";
import {
  ArrowLeft,
  Eye,
  Download,
  Heart,
  Play,
  FileText,
  Video,
  ClipboardList,
  BookOpen,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  mockMaterials,
  mockBoards,
  mockSubjects,
  mockTopics,
} from "@/lib/mockData";
import { RESOURCE_TYPE_LABELS, DIFFICULTY_LEVELS } from "@shared/schema";

export function MaterialDetailPage() {
  const params = useParams<{ id: string }>();
  const materialId = params.id;

  const material = mockMaterials.find((m) => m.id === materialId);
  const board = material ? mockBoards.find((b) => b.id === material.boardId) : null;
  const subject = material
    ? mockSubjects.find((s) => s.id === material.subjectId)
    : null;
  const topic = material?.topicId
    ? mockTopics.find((t) => t.id === material.topicId)
    : null;

  if (!material) {
    return (
      <div className="space-y-6">
        <PageHeader title="Material Not Found" />
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              The requested material could not be found.
            </p>
            <Link href="/student/materials">
              <Button data-testid="button-back-to-materials">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Materials
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "video":
        return <Video className="h-5 w-5" />;
      case "past_paper":
        return <ClipboardList className="h-5 w-5" />;
      case "notes":
        return <FileText className="h-5 w-5" />;
      default:
        return <BookOpen className="h-5 w-5" />;
    }
  };

  const getDifficultyColor = (difficulty: string | null) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "hard":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/student/materials">
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <PageHeader title={material.title} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {material.type === "video" && material.videoUrl && (
            <Card data-testid="video-player-container">
              <CardContent className="p-0">
                <div className="relative aspect-video bg-muted rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="rounded-full bg-background/80 p-4 mb-2 mx-auto w-fit">
                      <Play className="h-8 w-8" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Video Player Placeholder
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card data-testid="material-description">
            <CardHeader>
              <CardTitle className="text-lg">Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {material.description || "No description available."}
              </p>
            </CardContent>
          </Card>

          <Card data-testid="material-actions">
            <CardContent className="py-4">
              <div className="flex flex-wrap gap-3">
                {material.fileUrl && (
                  <>
                    <Button data-testid="button-view-material">
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                    <Button variant="outline" data-testid="button-download-material">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </>
                )}
                {material.type === "video" && material.videoUrl && (
                  <Button data-testid="button-watch-video">
                    <Play className="h-4 w-4 mr-2" />
                    Watch Video
                  </Button>
                )}
                <Button variant="outline" data-testid="button-add-favorite">
                  <Heart className="h-4 w-4 mr-2" />
                  Add to Favorites
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card data-testid="material-metadata">
            <CardHeader>
              <CardTitle className="text-lg">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                {getTypeIcon(material.type)}
                <Badge variant="outline">
                  {RESOURCE_TYPE_LABELS[material.type as keyof typeof RESOURCE_TYPE_LABELS] ||
                    material.type}
                </Badge>
              </div>

              <div className="space-y-3 text-sm">
                {board && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Board</span>
                    <span className="font-medium" data-testid="text-board">{board.name}</span>
                  </div>
                )}
                {subject && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subject</span>
                    <span className="font-medium" data-testid="text-subject">{subject.name}</span>
                  </div>
                )}
                {topic && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Topic</span>
                    <span className="font-medium" data-testid="text-topic">{topic.name}</span>
                  </div>
                )}
                {material.year && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Year</span>
                    <span className="font-medium" data-testid="text-year">{material.year}</span>
                  </div>
                )}
                {material.difficulty && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Difficulty</span>
                    <Badge
                      className={getDifficultyColor(material.difficulty)}
                      data-testid="badge-difficulty"
                    >
                      {material.difficulty.charAt(0).toUpperCase() +
                        material.difficulty.slice(1)}
                    </Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card data-testid="material-stats">
            <CardHeader>
              <CardTitle className="text-lg">Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                    <Eye className="h-4 w-4" />
                  </div>
                  <p className="text-2xl font-bold" data-testid="text-view-count">
                    {material.viewCount}
                  </p>
                  <p className="text-xs text-muted-foreground">Views</p>
                </div>
                <div>
                  <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                    <Download className="h-4 w-4" />
                  </div>
                  <p className="text-2xl font-bold" data-testid="text-download-count">
                    {material.downloadCount}
                  </p>
                  <p className="text-xs text-muted-foreground">Downloads</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
