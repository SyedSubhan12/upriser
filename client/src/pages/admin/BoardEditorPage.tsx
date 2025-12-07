import { useState } from "react";
import { useLocation, useRoute } from "wouter";
import { Upload } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { mockBoards } from "@/lib/mockData";

export function BoardEditorPage() {
  const [, navigate] = useLocation();
  const [, params] = useRoute("/admin/boards/:id");
  const boardId = params?.id;
  const isEditing = boardId && boardId !== "new";

  const existingBoard = isEditing
    ? mockBoards.find((b) => b.id === boardId)
    : null;

  const [formData, setFormData] = useState({
    name: existingBoard?.name || "",
    code: existingBoard?.code || "",
    description: existingBoard?.description || "",
    isActive: existingBoard?.isActive ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/admin/boards");
  };

  const handleCancel = () => {
    navigate("/admin/boards");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={isEditing ? "Edit Board" : "Create Board"}
        description={
          isEditing
            ? "Update board information and settings"
            : "Add a new educational board"
        }
      />

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Board Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Board Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="e.g., Central Board of Secondary Education"
                data-testid="input-board-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="code">Board Code</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    code: e.target.value.toUpperCase(),
                  }))
                }
                placeholder="e.g., CBSE"
                data-testid="input-board-code"
              />
              <p className="text-xs text-muted-foreground">
                A short unique identifier for the board
              </p>
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
                className="border-2 border-dashed rounded-md p-6 text-center cursor-pointer hover-elevate"
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

            <div className="flex items-center gap-3 pt-4">
              <Button type="submit" data-testid="button-save-board">
                {isEditing ? "Save Changes" : "Create Board"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                data-testid="button-cancel-board"
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
