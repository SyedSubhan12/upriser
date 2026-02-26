import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Power, Loader2, RefreshCw, BookOpen } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  listAdminBoards,
  createAdminBoard,
  updateAdminBoard,
  deleteAdminBoard,
  type AdminBoardSummary,
} from "@/api/admin";

export function BoardsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBoard, setEditingBoard] = useState<AdminBoardSummary | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    isActive: true,
  });
  const [errors, setErrors] = useState<{ name?: string; code?: string }>({});

  const { data: boards = [], isLoading, isError, refetch } = useQuery<AdminBoardSummary[]>({
    queryKey: ["admin-boards"],
    queryFn: () => listAdminBoards(),
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

  const toggleBoardMutation = useMutation({
    mutationFn: (board: AdminBoardSummary) =>
      updateAdminBoard(board.id, { isActive: !board.isActive }),
    onSuccess: (updatedBoard) => {
      queryClient.invalidateQueries({ queryKey: ["admin-boards"] });
      toast({
        title: updatedBoard.isActive ? "Board Activated" : "Board Deactivated",
        description: `${updatedBoard.name} has been ${updatedBoard.isActive ? "activated" : "deactivated"}.`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update board status.",
        variant: "destructive",
      });
    },
  });

  const handleToggleActive = (board: AdminBoardSummary) => {
    toggleBoardMutation.mutate(board);
  };

  const saveBoardMutation = useMutation({
    mutationFn: async (values: typeof formData) => {
      if (editingBoard) {
        return updateAdminBoard(editingBoard.id, {
          name: values.name.trim(),
          code: values.code.trim(),
          description: values.description.trim() || null,
          isActive: values.isActive,
        });
      }

      return createAdminBoard({
        name: values.name.trim(),
        code: values.code.trim(),
        description: values.description.trim() || null,
        isActive: values.isActive,
      });
    },
    onSuccess: (savedBoard) => {
      queryClient.invalidateQueries({ queryKey: ["admin-boards"] });
      setIsDialogOpen(false);
      setEditingBoard(null);
      setFormData({ name: "", code: "", description: "", isActive: true });
      setErrors({});

      toast({
        title: editingBoard ? "Board Updated" : "Board Created",
        description: `${savedBoard.name} has been ${editingBoard ? "updated" : "created"} successfully.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to save board.",
        variant: "destructive",
      });
    },
  });

  const deleteBoardMutation = useMutation({
    mutationFn: async (board: AdminBoardSummary) => deleteAdminBoard(board.id),
    onSuccess: (_, board) => {
      queryClient.invalidateQueries({ queryKey: ["admin-boards"] });
      toast({
        title: "Board Archived",
        description: `${board.name} has been archived and marked inactive.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to delete board.",
        variant: "destructive",
      });
    },
  });

  const handleOpenCreate = () => {
    setEditingBoard(null);
    setFormData({ name: "", code: "", description: "", isActive: true });
    setErrors({});
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (board: AdminBoardSummary) => {
    setEditingBoard(board);
    setFormData({
      name: board.name,
      code: board.code,
      description: board.description || "",
      isActive: board.isActive,
    });
    setErrors({});
    setIsDialogOpen(true);
  };

  const handleDeleteBoard = (board: AdminBoardSummary) => {
    const confirmed = window.confirm(
      `Are you sure you want to archive "${board.name}"? It will be marked inactive and hidden from users.`,
    );
    if (!confirmed) return;
    deleteBoardMutation.mutate(board);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    saveBoardMutation.mutate(formData);
  };

  if (isError) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Boards"
          description="Manage educational boards and their configurations"
        />
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">Failed to load boards. Please try again.</p>
            <Button onClick={() => refetch()} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Boards"
        description="Manage educational boards and their configurations"
        actions={
          <Button data-testid="button-add-board" onClick={handleOpenCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Add Board
          </Button>
        }
      />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="w-24 text-center">Status</TableHead>
                <TableHead className="w-32 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                // Loading skeleton rows
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                    <TableCell className="text-center"><Skeleton className="h-5 w-12 mx-auto" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : boards.length > 0 ? (
                boards.map((board) => (
                  <TableRow key={board.id} data-testid={`row-board-${board.id}`}>
                    <TableCell className="font-medium" data-testid={`text-board-name-${board.id}`}>
                      {board.name}
                    </TableCell>
                    <TableCell data-testid={`text-board-code-${board.id}`}>
                      <Badge variant="outline">{board.code}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-xs truncate">
                      {board.description || "No description"}
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={board.isActive}
                        onCheckedChange={() => handleToggleActive(board)}
                        disabled={toggleBoardMutation.isPending}
                        data-testid={`switch-board-active-${board.id}`}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/admin/subjects?boardId=${board.id}`}>
                          <Button
                            variant="ghost"
                            size="icon"
                            data-testid={`button-manage-subjects-${board.id}`}
                          >
                            <BookOpen className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEdit(board)}
                          data-testid={`button-edit-board-${board.id}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleActive(board)}
                          disabled={toggleBoardMutation.isPending}
                          data-testid={`button-toggle-board-${board.id}`}
                        >
                          {toggleBoardMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Power className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteBoard(board)}
                          disabled={deleteBoardMutation.isPending}
                          data-testid={`button-delete-board-${board.id}`}
                        >
                          <Loader2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-12">
                    <div className="flex flex-col items-center gap-3">
                      <p>No boards found. Create your first board to get started.</p>
                      <Link href="/admin/boards/new">
                        <Button size="sm">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Board
                        </Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingBoard ? "Edit Board" : "Add Board"}</DialogTitle>
            <DialogDescription>
              {editingBoard
                ? "Update board information and status."
                : "Create a new educational board that students and teachers can select."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="board-name">Board Name</Label>
              <Input
                id="board-name"
                value={formData.name}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, name: e.target.value }));
                  if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
                }}
                placeholder="e.g., Central Board of Secondary Education"
                className={errors.name ? "border-destructive" : ""}
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="board-code">Board Code</Label>
              <Input
                id="board-code"
                value={formData.code}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, code: e.target.value.toUpperCase() }));
                  if (errors.code) setErrors((prev) => ({ ...prev, code: undefined }));
                }}
                placeholder="e.g., CBSE"
                className={errors.code ? "border-destructive" : ""}
              />
              {errors.code ? (
                <p className="text-xs text-destructive">{errors.code}</p>
              ) : (
                <p className="text-xs text-muted-foreground">A short unique identifier for the board</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="board-description">Description</Label>
              <Textarea
                id="board-description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="Brief description of the board..."
                rows={3}
              />
            </div>

            <div className="flex items-center justify-between rounded-md border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="board-active">Active Status</Label>
                <p className="text-xs text-muted-foreground">
                  Inactive boards won't be visible to users
                </p>
              </div>
              <Switch
                id="board-active"
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, isActive: checked }))
                }
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={saveBoardMutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saveBoardMutation.isPending}>
                {saveBoardMutation.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {editingBoard ? "Save Changes" : "Create Board"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
