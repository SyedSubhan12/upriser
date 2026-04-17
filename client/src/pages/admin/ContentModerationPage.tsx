import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { RESOURCE_TYPE_LABELS, CONTENT_STATUS_LABELS } from "@shared/schema";
import {
  listAdminMaterials,
  approveAdminMaterial,
  rejectAdminMaterial,
  type AdminMaterialListResponse,
  type AdminMaterialSummary,
} from "@/api/admin";

export function ContentModerationPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [previewMaterial, setPreviewMaterial] = useState<AdminMaterialSummary | null>(null);

  const effectiveStatus =
    statusFilter === "all" ? "ALL" : (statusFilter.toUpperCase() as "PENDING" | "APPROVED" | "REJECTED");

  const { data, isLoading } = useQuery<AdminMaterialListResponse>({
    queryKey: ["admin-materials", effectiveStatus],
    queryFn: () => listAdminMaterials({ status: effectiveStatus }),
  });

  const materials = data?.data ?? [];

  const filteredMaterials = useMemo(() => {
    if (statusFilter === "all") return materials;
    return materials.filter((m) => m.status.toLowerCase() === statusFilter);
  }, [materials, statusFilter]);

  const getStatusBadgeVariant = (status: string) => {
    const normalized = status.toLowerCase();
    switch (normalized) {
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
      case "ebook":
        return <BookOpen className="h-4 w-4" />;
      case "worksheet":
        return <ClipboardList className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const approveMutation = useMutation({
    mutationFn: (id: string) => approveAdminMaterial(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-materials"] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => rejectAdminMaterial(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-materials"] });
    },
  });

  const handleApprove = (materialId: string) => {
    approveMutation.mutate(materialId);
  };

  const handleReject = (materialId: string) => {
    rejectMutation.mutate(materialId);
  };

  const statusCounts = {
    all: materials.length,
    pending: materials.filter((m) => m.status === "PENDING").length,
    approved: materials.filter((m) => m.status === "APPROVED").length,
    rejected: materials.filter((m) => m.status === "REJECTED").length,
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
                        {material.uploaderName ?? "Unknown"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {material.subject ?? "Unknown"}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={getStatusBadgeVariant(material.status)}
                          data-testid={`badge-content-status-${material.id}`}
                        >
                          {CONTENT_STATUS_LABELS[material.status.toLowerCase() as keyof typeof CONTENT_STATUS_LABELS] || material.status}
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
                          {material.status === "PENDING" && (
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
                  <span className="ml-2">{previewMaterial.subject ?? "Unknown"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Uploader:</span>
                  <span className="ml-2">{previewMaterial.uploaderName ?? "Unknown"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Description:</span>
                  <span className="ml-2">N/A</span>
                </div>
              </div>
              <div className="rounded-md border bg-muted/50 overflow-hidden min-h-[400px] flex items-center justify-center">
                {previewMaterial.type === "video" && previewMaterial.videoUrl ? (
                  <video
                    src={previewMaterial.videoUrl}
                    controls
                    className="w-full h-full max-h-[500px]"
                  />
                ) : previewMaterial.fileUrl ? (
                  <iframe
                    src={previewMaterial.fileUrl}
                    className="w-full h-[500px] border-0"
                    title={previewMaterial.title}
                  />
                ) : (
                  <div className="text-center p-8">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-3 opacity-20" />
                    <p className="text-sm text-muted-foreground">
                      No preview available for this {previewMaterial.type}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      URL might be missing or invalid
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            {previewMaterial?.status === "PENDING" && (
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
            {previewMaterial?.status !== "PENDING" && (
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
