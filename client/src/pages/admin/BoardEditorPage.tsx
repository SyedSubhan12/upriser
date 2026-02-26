import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Upload, Loader2, ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  listAdminBoards,
  createAdminBoard,
  updateAdminBoard,
  type AdminBoardSummary,
} from "@/api/admin";

export function BoardEditorPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [, params] = useRoute("/admin/boards/:id");
  const boardId = params?.id;
  const isEditing = !!boardId && boardId !== "new";

  const { data: boards = [], isLoading: isLoadingBoards } = useQuery<AdminBoardSummary[]>({
    queryKey: ["admin-boards"],
    queryFn: () => listAdminBoards(),
    enabled: isEditing,
  });

  const existingBoard = isEditing ? boards.find((b) => b.id === boardId) ?? null : null;

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    isActive: true,
  });

  const [errors, setErrors] = useState<{ name?: string; code?: string }>({});

  useEffect(() => {
    if (isEditing && existingBoard) {
      setFormData({
        name: existingBoard.name,
        code: existingBoard.code,
        description: existingBoard.description || "",
        isActive: existingBoard.isActive,
      });
    }
  }, [isEditing, existingBoard]);

  const saveBoardMutation = useMutation({
    mutationFn: (values: typeof formData) => {
      if (isEditing && boardId) {
        return updateAdminBoard(boardId, {
          name: values.name,
          code: values.code,
          description: values.description || null,
          isActive: values.isActive,
        });
      }
      return createAdminBoard({
        name: values.name,
        code: values.code,
        description: values.description || null,
        isActive: values.isActive,
      });
    },
    onSuccess: (savedBoard) => {
      queryClient.invalidateQueries({ queryKey: ["admin-boards"] });
      toast({
        title: isEditing ? "Board Updated" : "Board Created",
        description: `${savedBoard.name} has been ${isEditing ? "updated" : "created"} successfully.`,
      });
      navigate("/admin/boards");
    },
    onError: (error: any) => {
      const message = error?.message || "Failed to save board. Please try again.";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    },
  });

  const validateForm = (): boolean => {
    const newErrors: { name?: string; code?: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = "Board name is required";
    }

    if (!formData.code.trim()) {
      newErrors.code = "Board code is required";
    } else if (formData.code.length < 2) {
      newErrors.code = "Code must be at least 2 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      saveBoardMutation.mutate(formData);
    }
  };

  const handleCancel = () => {
    navigate("/admin/boards");
  };

  const isLoading = isEditing && isLoadingBoards;
  const isSaving = saveBoardMutation.isPending;

  return (
    <div className="space-y-6">
      <PageHeader
        title={isEditing ? "Edit Board" : "Create Board"}
        description={
          isEditing
            ? "Update board information and settings"
            : "Add a new educational board"
        }
        actions={
          <Button variant="ghost" onClick={handleCancel}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Boards
          </Button>
        }
      />

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Board Information</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-6">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-24 w-full" />
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Board Name <span className="text-destructive">*</span></Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, name: e.target.value }));
                    if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
                  }}
                  placeholder="e.g., Central Board of Secondary Education"
                  className={errors.name ? "border-destructive" : ""}
                  data-testid="input-board-name"
                />
                {errors.name && (
                  <p className="text-xs text-destructive">{errors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="code">Board Code <span className="text-destructive">*</span></Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => {
                    setFormData((prev) => ({
                      ...prev,
                      code: e.target.value.toUpperCase(),
                    }));
                    if (errors.code) setErrors((prev) => ({ ...prev, code: undefined }));
                  }}
                  placeholder="e.g., CBSE"
                  className={errors.code ? "border-destructive" : ""}
                  data-testid="input-board-code"
                />
                {errors.code ? (
                  <p className="text-xs text-destructive">{errors.code}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    A short unique identifier for the board
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="Brief description of the board..."
                  rows={3}
                  data-testid="input-board-description"
                />
              </div>

              <div className="space-y-2">
                <Label>Board Logo</Label>
                <div
                  className="border-2 border-dashed rounded-md p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                  data-testid="upload-board-logo"
                >
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PNG, JPG up to 2MB
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-md border p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="active">Active Status</Label>
                  <p className="text-xs text-muted-foreground">
                    Inactive boards won't be visible to users
                  </p>
                </div>
                <Switch
                  id="active"
                  checked={formData.isActive}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, isActive: checked }))
                  }
                  data-testid="switch-board-active"
                />
              </div>

              <div className="flex items-center gap-3 pt-4 border-t">
                <Button type="submit" disabled={isSaving} data-testid="button-save-board">
                  {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {isEditing ? "Save Changes" : "Create Board"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isSaving}
                  data-testid="button-cancel-board"
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
