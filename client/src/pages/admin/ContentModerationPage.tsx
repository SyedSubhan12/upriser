import { useState, useMemo } from "react";
import { Eye, Check, X, FileText, Video, BookOpen, ClipboardList } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { mockMaterials, mockUsers, mockSubjects } from "@/lib/mockData";
import { RESOURCE_TYPE_LABELS, CONTENT_STATUS_LABELS } from "@shared/schema";
import type { Material, ContentStatus } from "@shared/schema";

export function ContentModerationPage() {
  const [materials, setMaterials] = useState<Material[]>(mockMaterials);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [previewMaterial, setPreviewMaterial] = useState<Material | null>(null);

  const filteredMaterials = useMemo(() => {
    if (statusFilter === "all") return materials;
    return materials.filter((m) => m.status === statusFilter);
  }, [materials, statusFilter]);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "approved":
        return "default";
      case "pending":
        return "secondary";
      case "rejected":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "video":
        return <Video className="h-4 w-4" />;
      case "notes":
        return <BookOpen className="h-4 w-4" />;
      case "worksheet":
        return <ClipboardList className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getUploaderName = (uploaderId: string) => {
    const user = mockUsers.find((u) => u.id === uploaderId);
    return user?.name || "Unknown";
  };

  const getSubjectName = (subjectId: string) => {
    const subject = mockSubjects.find((s) => s.id === subjectId);
    return subject?.name || "Unknown";
  };

  const handleApprove = (materialId: string) => {
    setMaterials((prev) =>
      prev.map((m) =>
        m.id === materialId ? { ...m, status: "approved" as ContentStatus } : m
      )
    );
  };

  const handleReject = (materialId: string) => {
    setMaterials((prev) =>
      prev.map((m) =>
        m.id === materialId ? { ...m, status: "rejected" as ContentStatus } : m
      )
    );
  };

  const statusCounts = {
    all: materials.length,
    pending: materials.filter((m) => m.status === "pending").length,
    approved: materials.filter((m) => m.status === "approved").length,
    rejected: materials.filter((m) => m.status === "rejected").length,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Content Moderation"
        description="Review and approve uploaded content"
      />

      <Tabs value={statusFilter} onValueChange={setStatusFilter}>
        <TabsList data-testid="tabs-status-filter">
          <TabsTrigger value="all" data-testid="tab-all">
            All ({statusCounts.all})
          </TabsTrigger>
          <TabsTrigger value="pending" data-testid="tab-pending">
            Pending ({statusCounts.pending})
          </TabsTrigger>
          <TabsTrigger value="approved" data-testid="tab-approved">
            Approved ({statusCounts.approved})
          </TabsTrigger>
          <TabsTrigger value="rejected" data-testid="tab-rejected">
            Rejected ({statusCounts.rejected})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={statusFilter} className="mt-6">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Uploader</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="w-32 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMaterials.map((material) => (
                    <TableRow key={material.id} data-testid={`row-content-${material.id}`}>
                      <TableCell className="font-medium" data-testid={`text-content-title-${material.id}`}>
                        <div className="flex items-center gap-2">
                          {getTypeIcon(material.type)}
                          {material.title}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" data-testid={`badge-content-type-${material.id}`}>
                          {RESOURCE_TYPE_LABELS[material.type as keyof typeof RESOURCE_TYPE_LABELS] || material.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {getUploaderName(material.uploaderId)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {getSubjectName(material.subjectId)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={getStatusBadgeVariant(material.status)}
                          data-testid={`badge-content-status-${material.id}`}
                        >
                          {CONTENT_STATUS_LABELS[material.status as keyof typeof CONTENT_STATUS_LABELS] || material.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setPreviewMaterial(material)}
                            data-testid={`button-view-content-${material.id}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {material.status === "pending" && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleApprove(material.id)}
                                data-testid={`button-approve-content-${material.id}`}
                              >
                                <Check className="h-4 w-4 text-green-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleReject(material.id)}
                                data-testid={`button-reject-content-${material.id}`}
                              >
                                <X className="h-4 w-4 text-red-600" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredMaterials.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No content found in this category.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!previewMaterial} onOpenChange={() => setPreviewMaterial(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{previewMaterial?.title}</DialogTitle>
          </DialogHeader>
          {previewMaterial && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Type:</span>
                  <span className="ml-2">
                    {RESOURCE_TYPE_LABELS[previewMaterial.type as keyof typeof RESOURCE_TYPE_LABELS] || previewMaterial.type}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Subject:</span>
                  <span className="ml-2">{getSubjectName(previewMaterial.subjectId)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Uploader:</span>
                  <span className="ml-2">{getUploaderName(previewMaterial.uploaderId)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Difficulty:</span>
                  <span className="ml-2 capitalize">{previewMaterial.difficulty || "Not specified"}</span>
                </div>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Description:</span>
                <p className="mt-1 text-sm">{previewMaterial.description || "No description provided."}</p>
              </div>
              <div className="rounded-md border p-4 bg-muted/50">
                <p className="text-sm text-muted-foreground text-center">
                  Content preview would be displayed here
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            {previewMaterial?.status === "pending" && (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    handleReject(previewMaterial.id);
                    setPreviewMaterial(null);
                  }}
                  data-testid="button-reject-preview"
                >
                  <X className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button
                  onClick={() => {
                    handleApprove(previewMaterial.id);
                    setPreviewMaterial(null);
                  }}
                  data-testid="button-approve-preview"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Approve
                </Button>
              </>
            )}
            {previewMaterial?.status !== "pending" && (
              <Button variant="outline" onClick={() => setPreviewMaterial(null)} data-testid="button-close-preview">
                Close
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
