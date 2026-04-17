import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  FileText,
  Video,
  BookOpen,
  FileSpreadsheet,
  Plus,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { Material, ContentStatus } from "@shared/schema";
import { RESOURCE_TYPE_LABELS, CONTENT_STATUS_LABELS } from "@shared/schema";

type ResourceType = "past_paper" | "notes" | "video" | "worksheet";

const RESOURCE_TYPE_CONFIG: Record<ResourceType, { icon: typeof FileText; color: string }> = {
  past_paper: { icon: FileSpreadsheet, color: "text-blue-600" },
  notes: { icon: FileText, color: "text-green-600" },
  video: { icon: Video, color: "text-purple-600" },
  worksheet: { icon: BookOpen, color: "text-orange-600" },
};

async function fetchTeacherMaterials(): Promise<Material[]> {
  const res = await fetch("/api/teacher/materials", { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch materials");
  return res.json();
}

function MaterialCard({ material }: { material: Material }) {
  const Icon = RESOURCE_TYPE_CONFIG[material.type as ResourceType]?.icon || FileText;
  const color = RESOURCE_TYPE_CONFIG[material.type as ResourceType]?.color || "text-muted-foreground";

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "approved": return "default" as const;
      case "pending": return "secondary" as const;
      case "rejected": return "destructive" as const;
      default: return "secondary" as const;
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="p-4 pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <Icon className={`h-5 w-5 ${color} mt-0.5 flex-shrink-0`} />
            <div className="min-w-0 flex-1">
              <CardTitle className="text-sm font-medium truncate">{material.title}</CardTitle>
              {material.description && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {material.description}
                </p>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {RESOURCE_TYPE_LABELS[material.type as ResourceType] || material.type}
            </Badge>
            <Badge variant={getStatusVariant(material.status)} className="text-xs">
              {CONTENT_STATUS_LABELS[material.status as ContentStatus] || material.status}
            </Badge>
          </div>
          {material.status === "rejected" && material.rejectionReason && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button type="button" className="text-destructive hover:text-destructive/80">
                  <AlertCircle className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs text-xs">Reason: {material.rejectionReason}</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
        <div className="mt-2 text-xs text-muted-foreground">
          {material.createdAt ? new Date(material.createdAt).toLocaleDateString() : "N/A"}
        </div>
      </CardContent>
    </Card>
  );
}

function ResourceGrid({ materials, type }: { materials: Material[]; type: string }) {
  const filteredMaterials = materials.filter((m) => m.type === type);
  const config = RESOURCE_TYPE_CONFIG[type as ResourceType];
  const Icon = config?.icon || FileText;

  if (filteredMaterials.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center">
          <Icon className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="mt-4 text-sm font-medium">No {RESOURCE_TYPE_LABELS[type as ResourceType]?.toLowerCase() || type} yet</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Upload your first {RESOURCE_TYPE_LABELS[type as ResourceType]?.toLowerCase() || type} to get started.
        </p>
        <Link href="/teacher/materials/new">
          <Button className="mt-4" size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add {RESOURCE_TYPE_LABELS[type as ResourceType] || type}
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {filteredMaterials.map((material) => (
        <MaterialCard key={material.id} material={material} />
      ))}
    </div>
  );
}

export function TeacherResourcesPage() {
  const { data: materials, isLoading } = useQuery({
    queryKey: ["teacher-materials"],
    queryFn: fetchTeacherMaterials,
  });

  const resourceTypes: ResourceType[] = ["past_paper", "notes", "video", "worksheet"];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Resources"
        description="Organize and manage your teaching resources by type"
        actions={
          <Link href="/teacher/materials/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Upload Resource
            </Button>
          </Link>
        }
      />

      <Tabs defaultValue="all" className="space-y-4">
        <div className="w-full overflow-x-auto pb-1 scrollbar-hide">
          <TabsList className="inline-flex w-full min-w-max lg:min-w-0 grid grid-cols-5 lg:w-auto">
            <TabsTrigger value="all">All</TabsTrigger>
            {resourceTypes.map((type) => (
              <TabsTrigger key={type} value={type}>
                {RESOURCE_TYPE_LABELS[type]}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="all" className="space-y-4">
          {materials && materials.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {materials.map((material) => (
                <MaterialCard key={material.id} material={material} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">No resources uploaded yet</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Start by uploading your first teaching resource.
              </p>
              <Link href="/teacher/materials/new">
                <Button className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Upload Resource
                </Button>
              </Link>
            </div>
          )}
        </TabsContent>

        {resourceTypes.map((type) => (
          <TabsContent key={type} value={type}>
            <ResourceGrid materials={materials || []} type={type} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
