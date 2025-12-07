import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Plus, Pencil, Archive, FileText } from "lucide-react";
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
import { useAuth } from "@/context/AuthContext";
import {
  mockMaterials,
  mockSubjects,
  mockUsers,
} from "@/lib/mockData";
import { RESOURCE_TYPE_LABELS, CONTENT_STATUS_LABELS } from "@shared/schema";
import type { ResourceType, ContentStatus } from "@shared/schema";

export function MyMaterialsPage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const currentUser = user || mockUsers.find((u) => u.role === "teacher");

  const [subjectFilter, setSubjectFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const myMaterials = mockMaterials.filter(
    (m) => m.uploaderId === currentUser?.id || m.uploaderId === "teacher-1"
  );

  const filteredMaterials = myMaterials.filter((m) => {
    if (subjectFilter !== "all" && m.subjectId !== subjectFilter) return false;
    if (typeFilter !== "all" && m.type !== typeFilter) return false;
    return true;
  });

  const uniqueSubjects = Array.from(
    new Set(myMaterials.map((m) => m.subjectId))
  );
  const uniqueTypes = Array.from(new Set(myMaterials.map((m) => m.type)));

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "approved":
        return "default";
      case "pending":
        return "secondary";
      case "rejected":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const handleRowClick = (materialId: string) => {
    navigate(`/teacher/materials/${materialId}`);
  };

  return (
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
              <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                <SelectTrigger data-testid="select-subject-filter">
                  <SelectValue placeholder="Filter by Subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {uniqueSubjects.map((subjectId) => {
                    const subject = mockSubjects.find((s) => s.id === subjectId);
                    return (
                      <SelectItem key={subjectId} value={subjectId}>
                        {subject?.name || subjectId}
                      </SelectItem>
                    );
                  })}
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
        <CardContent className="pt-6">
          {filteredMaterials.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Created Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMaterials.map((material) => {
                  const subject = mockSubjects.find(
                    (s) => s.id === material.subjectId
                  );
                  return (
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
                      <TableCell>{subject?.name || "Unknown"}</TableCell>
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
                        <Badge variant={getStatusVariant(material.status)}>
                          {CONTENT_STATUS_LABELS[material.status as ContentStatus] || material.status}
                        </Badge>
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
                            <span className="sr-only">Edit</span>
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
                            <span className="sr-only">Archive</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">No materials found</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {subjectFilter !== "all" || typeFilter !== "all"
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
  );
}
