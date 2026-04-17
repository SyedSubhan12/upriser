import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ChevronRight,
  ChevronDown,
  Plus,
  Pencil,
  Trash2,
  BookOpen,
  Loader2,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  listAdminBoards,
  listSubjects,
  createSubject,
  updateSubject,
  listTopics,
  createTopic,
  updateTopic,
  deleteTopic as deleteTopicApi,
  type AdminBoardSummary,
  type AdminSubject,
  type AdminTopic,
} from "@/api/admin";

interface TopicNodeProps {
  topic: AdminTopic;
  topics: AdminTopic[];
  level: number;
  expandedTopics: Set<string>;
  onToggle: (id: string) => void;
  onEdit: (topic: AdminTopic) => void;
  onDelete: (topic: AdminTopic) => void;
  onAddChild: (parentId: string) => void;
}

function TopicNode({
  topic,
  topics,
  level,
  expandedTopics,
  onToggle,
  onEdit,
  onDelete,
  onAddChild,
}: TopicNodeProps) {
  const children = topics.filter((t) => t.parentId === topic.id);
  const hasChildren = children.length > 0;
  const isExpanded = expandedTopics.has(topic.id);

  return (
    <div>
      <div
        className="group flex items-center gap-2 py-2 px-3 rounded-md hover-elevate"
        style={{ paddingLeft: `${level * 16 + 12}px` }}
        data-testid={`topic-item-${topic.id}`}
      >
        {hasChildren ? (
          <button
            onClick={() => onToggle(topic.id)}
            className="p-0.5"
            data-testid={`button-toggle-topic-${topic.id}`}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        ) : (
          <div className="w-5" />
        )}
        <BookOpen className="h-4 w-4 text-muted-foreground" />
        <span className="flex-1 text-sm">{topic.name}</span>
        <div className="invisible group-hover:visible flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onAddChild(topic.id)}
            data-testid={`button-add-child-${topic.id}`}
          >
            <Plus className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onEdit(topic)}
            data-testid={`button-edit-topic-${topic.id}`}
          >
            <Pencil className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onDelete(topic)}
            data-testid={`button-delete-topic-${topic.id}`}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
      {isExpanded &&
        children.map((child) => (
          <TopicNode
            key={child.id}
            topic={child}
            topics={topics}
            level={level + 1}
            expandedTopics={expandedTopics}
            onToggle={onToggle}
            onEdit={onEdit}
            onDelete={onDelete}
            onAddChild={onAddChild}
          />
        ))}
    </div>
  );
}

export function SubjectsTopicsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [location] = useLocation();

  const [selectedBoardId, setSelectedBoardId] = useState<string>("");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<AdminTopic | null>(null);
  const [parentTopicId, setParentTopicId] = useState<string | null>(null);
  const [topicForm, setTopicForm] = useState({ name: "", description: "" });
  const [deleteConfirmTopic, setDeleteConfirmTopic] = useState<AdminTopic | null>(null);

  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<AdminSubject | null>(null);
  const [subjectForm, setSubjectForm] = useState({
    name: "",
    code: "",
    description: "",
    isActive: true,
  });

  // Fetch boards
  const { data: boards = [], isLoading: isLoadingBoards } = useQuery<AdminBoardSummary[]>({
    queryKey: ["admin-boards"],
    queryFn: () => listAdminBoards(),
  });

  // Fetch subjects for selected board
  const { data: subjects = [], isLoading: isLoadingSubjects } = useQuery<AdminSubject[]>({
    queryKey: ["admin-subjects", selectedBoardId],
    queryFn: () => listSubjects(selectedBoardId),
    enabled: !!selectedBoardId,
  });

  // Fetch topics for selected subject
  const { data: topics = [], isLoading: isLoadingTopics } = useQuery<AdminTopic[]>({
    queryKey: ["admin-topics", selectedSubjectId],
    queryFn: () => listTopics(selectedSubjectId),
    enabled: !!selectedSubjectId,
  });

  const rootTopics = topics.filter((t) => !t.parentId);

  // Preselect board from query param on first load (e.g., /admin/subjects?boardId=...) 
  useEffect(() => {
    const [, search = ""] = location.split("?");
    const params = new URLSearchParams(search);
    const boardIdFromQuery = params.get("boardId");
    if (boardIdFromQuery) {
      setSelectedBoardId((prev) => prev || boardIdFromQuery);
      setSelectedSubjectId("");
    }
  }, [location]);

  // Subject mutations
  const createSubjectMutation = useMutation({
    mutationFn: (body: { name: string; code: string; boardId: string; description?: string | null }) =>
      createSubject(body),
    onSuccess: (subject) => {
      queryClient.invalidateQueries({ queryKey: ["admin-subjects", selectedBoardId] });
      setIsSubjectModalOpen(false);
      setEditingSubject(null);
      setSubjectForm({ name: "", code: "", description: "", isActive: true });
      toast({
        title: "Subject created",
        description: `${subject.subjectName} has been created successfully.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to create subject.",
        variant: "destructive",
      });
    },
  });

  const updateSubjectMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<{ name: string; code: string; description: string | null; isActive: boolean }> }) =>
      updateSubject(id, data),
    onSuccess: (subject, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-subjects", selectedBoardId] });
      setIsSubjectModalOpen(false);
      setEditingSubject(null);
      setSubjectForm({ name: "", code: "", description: "", isActive: true });

      const isStatusChange = Object.prototype.hasOwnProperty.call(variables.data, "isActive");
      toast({
        title: isStatusChange ? (subject.isActive ? "Subject activated" : "Subject deactivated") : "Subject updated",
        description: isStatusChange
          ? `${subject.subjectName} has been ${subject.isActive ? "activated" : "deactivated"}.`
          : `${subject.subjectName} has been updated successfully.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to update subject.",
        variant: "destructive",
      });
    },
  });

  // Create topic mutation
  const createTopicMutation = useMutation({
    mutationFn: (data: { name: string; subjectId: string; parentId?: string | null; description?: string | null }) =>
      createTopic(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-topics", selectedSubjectId] });
      toast({ title: "Topic created", description: "The topic has been created successfully." });
      setIsTopicModalOpen(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create topic.", variant: "destructive" });
    },
  });

  // Update topic mutation
  const updateTopicMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; description?: string | null } }) =>
      updateTopic(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-topics", selectedSubjectId] });
      toast({ title: "Topic updated", description: "The topic has been updated successfully." });
      setIsTopicModalOpen(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update topic.", variant: "destructive" });
    },
  });

  // Delete topic mutation
  const deleteTopicMutation = useMutation({
    mutationFn: (id: string) => deleteTopicApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-topics", selectedSubjectId] });
      toast({ title: "Topic deleted", description: "The topic has been deleted successfully." });
      setDeleteConfirmTopic(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete topic.", variant: "destructive" });
    },
  });

  const handleToggleTopic = (id: string) => {
    setExpandedTopics((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleAddTopic = (parentId: string | null = null) => {
    setEditingTopic(null);
    setParentTopicId(parentId);
    setTopicForm({ name: "", description: "" });
    setIsTopicModalOpen(true);
  };

  const handleEditTopic = (topic: AdminTopic) => {
    setEditingTopic(topic);
    setParentTopicId(topic.parentId);
    setTopicForm({ name: topic.name, description: topic.description || "" });
    setIsTopicModalOpen(true);
  };

  const handleDeleteTopic = (topic: AdminTopic) => {
    setDeleteConfirmTopic(topic);
  };

  const handleConfirmDelete = () => {
    if (deleteConfirmTopic) {
      deleteTopicMutation.mutate(deleteConfirmTopic.id);
    }
  };

  const handleSaveTopic = () => {
    if (!topicForm.name.trim()) {
      toast({ title: "Error", description: "Topic name is required.", variant: "destructive" });
      return;
    }

    if (editingTopic) {
      updateTopicMutation.mutate({
        id: editingTopic.id,
        data: {
          name: topicForm.name,
          description: topicForm.description || null,
        },
      });
    } else {
      createTopicMutation.mutate({
        name: topicForm.name,
        subjectId: selectedSubjectId,
        parentId: parentTopicId,
        description: topicForm.description || null,
      });
    }
  };

  const isSaving = createTopicMutation.isPending || updateTopicMutation.isPending;

  const handleOpenCreateSubject = () => {
    setEditingSubject(null);
    setSubjectForm({ name: "", code: "", description: "", isActive: true });
    setIsSubjectModalOpen(true);
  };

  const handleOpenEditSubject = (subject: AdminSubject) => {
    setEditingSubject(subject);
    setSubjectForm({
      name: subject.name,
      code: subject.code,
      description: subject.description || "",
      isActive: subject.isActive,
    });
    setIsSubjectModalOpen(true);
  };

  const handleToggleSubjectActive = (subject: AdminSubject) => {
    updateSubjectMutation.mutate({
      id: subject.id,
      data: { isActive: !subject.isActive },
    });
  };

  const handleSaveSubject = () => {
    if (!selectedBoardId) {
      toast({ title: "Select a board", description: "Please select a board first.", variant: "destructive" });
      return;
    }

    if (!subjectForm.name.trim()) {
      toast({ title: "Error", description: "Subject name is required.", variant: "destructive" });
      return;
    }

    if (!subjectForm.code.trim()) {
      toast({ title: "Error", description: "Subject code is required.", variant: "destructive" });
      return;
    }

    if (editingSubject) {
      updateSubjectMutation.mutate({
        id: editingSubject.id,
        data: {
          name: subjectForm.name.trim(),
          code: subjectForm.code.trim(),
          description: subjectForm.description.trim() || null,
          isActive: subjectForm.isActive,
        },
      });
    } else {
      createSubjectMutation.mutate({
        name: subjectForm.name.trim(),
        code: subjectForm.code.trim(),
        boardId: selectedBoardId,
        description: subjectForm.description.trim() || null,
      });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Subjects & Topics"
        description="Manage subject curriculum and topic hierarchy"
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Select Subject</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="board">Board</Label>
              <Select
                value={selectedBoardId}
                onValueChange={(value) => {
                  setSelectedBoardId(value);
                  setSelectedSubjectId("");
                }}
              >
                <SelectTrigger id="board" data-testid="select-board">
                  <SelectValue placeholder={isLoadingBoards ? "Loading..." : "Select a board"} />
                </SelectTrigger>
                <SelectContent>
                  {boards.filter(b => b.isEnabled).map((board) => (
                    <SelectItem key={board.id} value={board.id}>
                      {board.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Select
                value={selectedSubjectId}
                onValueChange={setSelectedSubjectId}
                disabled={!selectedBoardId || isLoadingSubjects}
              >
                <SelectTrigger id="subject" data-testid="select-subject">
                  <SelectValue placeholder={isLoadingSubjects ? "Loading..." : "Select a subject"} />
                </SelectTrigger>
                <SelectContent>
                  {subjects.filter(s => s.isActive).map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.subjectName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedBoardId && (
              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Manage Subjects</Label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleOpenCreateSubject}
                    data-testid="button-add-subject"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Subject
                  </Button>
                </div>
                <div className="space-y-1 max-h-64 overflow-auto pr-1">
                  {subjects.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      No subjects found for this board. Add your first subject.
                    </p>
                  ) : (
                    subjects.map((subject) => (
                      <div
                        key={subject.id}
                        className="flex items-center justify-between rounded-md border px-2 py-1.5 text-xs"
                        data-testid={`subject-row-${subject.id}`}
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">{subject.subjectName}</span>
                          <span className="text-[11px] text-muted-foreground">{subject.subjectCode}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleOpenEditSubject(subject)}
                            data-testid={`button-edit-subject-${subject.id}`}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleToggleSubjectActive(subject)}
                            disabled={updateSubjectMutation.isPending}
                            data-testid={`button-toggle-subject-${subject.id}`}
                          >
                            {subject.isActive ? (
                              <span className="text-[11px]">Hide</span>
                            ) : (
                              <span className="text-[11px]">Show</span>
                            )}
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <CardTitle className="text-lg">Topic Tree</CardTitle>
            {selectedSubjectId && (
              <Button
                size="sm"
                onClick={() => handleAddTopic(null)}
                data-testid="button-add-root-topic"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Topic
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {isLoadingTopics ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : selectedSubjectId ? (
              rootTopics.length > 0 ? (
                <div className="space-y-1">
                  {rootTopics.map((topic) => (
                    <TopicNode
                      key={topic.id}
                      topic={topic}
                      topics={topics}
                      level={0}
                      expandedTopics={expandedTopics}
                      onToggle={handleToggleTopic}
                      onEdit={handleEditTopic}
                      onDelete={handleDeleteTopic}
                      onAddChild={handleAddTopic}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No topics found. Add your first topic to get started.
                </p>
              )
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                Select a board and subject to view topics.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isTopicModalOpen} onOpenChange={setIsTopicModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingTopic ? "Edit Topic" : "Add Topic"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="topic-name">Topic Name</Label>
              <Input
                id="topic-name"
                value={topicForm.name}
                onChange={(e) =>
                  setTopicForm((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="e.g., Linear Equations"
                data-testid="input-topic-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="topic-description">Description</Label>
              <Textarea
                id="topic-description"
                value={topicForm.description}
                onChange={(e) =>
                  setTopicForm((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="Brief description of the topic..."
                rows={3}
                data-testid="input-topic-description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsTopicModalOpen(false)}
              data-testid="button-cancel-topic"
            >
              Cancel
            </Button>
            <Button onClick={handleSaveTopic} disabled={isSaving} data-testid="button-save-topic">
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingTopic ? "Save Changes" : "Add Topic"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isSubjectModalOpen} onOpenChange={setIsSubjectModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSubject ? "Edit Subject" : "Add Subject"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="subject-name">Subject Name</Label>
              <Input
                id="subject-name"
                value={subjectForm.name}
                onChange={(e) =>
                  setSubjectForm((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="e.g., Mathematics"
                data-testid="input-subject-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject-code">Subject Code</Label>
              <Input
                id="subject-code"
                value={subjectForm.code}
                onChange={(e) =>
                  setSubjectForm((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))
                }
                placeholder="e.g., MATH"
                data-testid="input-subject-code"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject-description">Description</Label>
              <Textarea
                id="subject-description"
                value={subjectForm.description}
                onChange={(e) =>
                  setSubjectForm((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="Brief description of the subject..."
                rows={3}
                data-testid="input-subject-description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsSubjectModalOpen(false)}
              disabled={createSubjectMutation.isPending || updateSubjectMutation.isPending}
              data-testid="button-cancel-subject"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveSubject}
              disabled={createSubjectMutation.isPending || updateSubjectMutation.isPending}
              data-testid="button-save-subject"
            >
              {(createSubjectMutation.isPending || updateSubjectMutation.isPending) && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {editingSubject ? "Save Changes" : "Add Subject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteConfirmTopic} onOpenChange={(open) => !open && setDeleteConfirmTopic(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Topic</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteConfirmTopic?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleteTopicMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
