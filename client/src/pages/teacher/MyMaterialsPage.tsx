import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Plus, Pencil, Archive, FileText, Loader2, AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { RESOURCE_TYPE_LABELS, CONTENT_STATUS_LABELS } from "@shared/schema";
import type { ResourceType, ContentStatus, Material } from "@shared/schema";

async function fetchTeacherMaterials(status?: string, type?: string): Promise<Material[]> {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (type) params.set("type", type);
  const res = await fetch(`/api/teacher/materials?${params.toString()}`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch materials");
  return res.json();
}

export function MyMaterialsPage() {
  const [, navigate] = useLocation();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const { data: materials, isLoading } = useQuery({
    queryKey: ["teacher-materials", statusFilter, typeFilter],
    queryFn: () => fetchTeacherMaterials(
      statusFilter !== "all" ? statusFilter.toLowerCase() : undefined,
      typeFilter !== "all" ? typeFilter : undefined
    ),
  });

  const uniqueTypes = Array.from(new Set((materials || []).map((m) => m.type)));

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "approved":
        return "default" as const;
      case "pending":
        return "secondary" as const;
      case "rejected":
        return "destructive" as const;
      default:
        return "secondary" as const;
    }
  };

  const handleRowClick = (materialId: string) => {
    navigate(`/teacher/materials/${materialId}`);
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <PageHeader
          title="My Materials"
          description="Manage your uploaded study materials"
          actions={
            <Link href="/teacher/materials/new">
              <Button data-testid="button-add-material">
                <Plus className="mr-2 h-4 w-4" />
                Add Material
              </Button>
            </Link>
          }
        />

        <Card data-testid="filter-bar">
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4">
              <div className="w-full sm:w-48">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger data-testid="select-status-filter">
                    <SelectValue placeholder="Filter by Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full sm:w-48">
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger data-testid="select-type-filter">
                    <SelectValue placeholder="Filter by Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {uniqueTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {RESOURCE_TYPE_LABELS[type as ResourceType] || type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="materials-table-card">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (materials && materials.length > 0) ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Created Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {materials.map((material) => (
                    <TableRow
                      key={material.id}
                      className="cursor-pointer"
                      onClick={() => handleRowClick(material.id)}
                      data-testid={`row-material-${material.id}`}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          {material.title}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {RESOURCE_TYPE_LABELS[material.type as ResourceType] || material.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {material.createdAt
                          ? new Date(material.createdAt).toLocaleDateString()
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant={getStatusVariant(material.status)}>
                            {CONTENT_STATUS_LABELS[material.status as ContentStatus] || material.status}
                          </Badge>
                          {material.status === "rejected" && material.rejectionReason && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button type="button" className="text-destructive hover:text-destructive/80">
                                  <AlertCircle className="h-4 w-4" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">Reason: {material.rejectionReason}</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/teacher/materials/${material.id}`);
                            }}
                            data-testid={`button-edit-material-${material.id}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                            }}
                            data-testid={`button-archive-material-${material.id}`}
                          >
                            <Archive className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">No materials found</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {statusFilter !== "all" || typeFilter !== "all"
                    ? "Try adjusting your filters."
                    : "Get started by uploading your first material."}
                </p>
                <Link href="/teacher/materials/new">
                  <Button className="mt-4" data-testid="button-add-first-material">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Material
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}
