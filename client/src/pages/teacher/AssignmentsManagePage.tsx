import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Plus,
  ClipboardList,
  Users,
  Calendar,
  Pencil,
  Eye,
  Upload,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import {
  mockAssignments,
  mockBoards,
  mockSubjects,
  mockTopics,
  mockSubmissions,
  mockUsers,
} from "@/lib/mockData";

const assignmentFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  boardId: z.string().min(1, "Board is required"),
  subjectId: z.string().min(1, "Subject is required"),
  topicId: z.string().optional(),
  dueDate: z.string().min(1, "Due date is required"),
  totalMarks: z.coerce.number().min(1, "Marks must be at least 1").default(100),
  attachmentUrl: z.string().optional(),
});

type AssignmentFormValues = z.infer<typeof assignmentFormSchema>;

export function AssignmentsManagePage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const currentUser = user || mockUsers.find((u) => u.role === "teacher");

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const form = useForm<AssignmentFormValues>({
    resolver: zodResolver(assignmentFormSchema),
    defaultValues: {
      title: "",
      description: "",
      boardId: "",
      subjectId: "",
      topicId: "",
      dueDate: "",
      totalMarks: 100,
      attachmentUrl: "",
    },
  });

  const myAssignments = mockAssignments.filter(
    (a) => a.creatorId === currentUser?.id || a.creatorId === "teacher-1"
  );

  const selectedBoardId = form.watch("boardId");
  const selectedSubjectId = form.watch("subjectId");

  const filteredSubjects = useMemo(() => {
    if (!selectedBoardId) return [];
    return mockSubjects.filter((s) => s.boardId === selectedBoardId);
  }, [selectedBoardId]);

  const filteredTopics = useMemo(() => {
    if (!selectedSubjectId) return [];
    return mockTopics.filter((t) => t.subjectId === selectedSubjectId);
  }, [selectedSubjectId]);

  const getSubmissionStats = (assignmentId: string) => {
    const submissions = mockSubmissions.filter(
      (s) => s.assignmentId === assignmentId
    );
    return {
      total: submissions.length,
      pending: submissions.filter((s) => s.status === "submitted").length,
      graded: submissions.filter((s) => s.status === "graded").length,
    };
  };

  const openCreateDialog = () => {
    setEditingId(null);
    form.reset({
      title: "",
      description: "",
      boardId: "",
      subjectId: "",
      topicId: "",
      dueDate: "",
      totalMarks: 100,
      attachmentUrl: "",
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (assignmentId: string) => {
    const assignment = mockAssignments.find((a) => a.id === assignmentId);
    if (assignment) {
      setEditingId(assignmentId);
      form.reset({
        title: assignment.title,
        description: assignment.description || "",
        boardId: assignment.boardId,
        subjectId: assignment.subjectId,
        topicId: assignment.topicId || "",
        dueDate: assignment.dueDate
          ? new Date(assignment.dueDate).toISOString().split("T")[0]
          : "",
        totalMarks: assignment.totalMarks,
        attachmentUrl: assignment.attachmentUrl || "",
      });
      setIsDialogOpen(true);
    }
  };

  const onSubmit = (data: AssignmentFormValues) => {
    console.log("Assignment data:", data);
    toast({
      title: editingId ? "Assignment updated" : "Assignment created",
      description: `"${data.title}" has been ${editingId ? "updated" : "created"} successfully.`,
    });
    setIsDialogOpen(false);
  };

  const getStatusBadge = (dueDate: Date | null) => {
    if (!dueDate) return <Badge variant="secondary">No Due Date</Badge>;
    const now = new Date();
    const due = new Date(dueDate);
    if (due < now) {
      return <Badge variant="destructive">Overdue</Badge>;
    }
    const daysLeft = Math.ceil(
      (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysLeft <= 3) {
      return <Badge variant="secondary">Due Soon</Badge>;
    }
    return <Badge variant="default">Active</Badge>;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assignments"
        description="Create and manage student assignments"
        actions={
          <Button onClick={openCreateDialog} data-testid="button-create-assignment">
            <Plus className="mr-2 h-4 w-4" />
            Create Assignment
          </Button>
        }
      />

      <Card data-testid="assignments-table-card">
        <CardContent className="pt-6">
          {myAssignments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Marks</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submissions</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {myAssignments.map((assignment) => {
                  const subject = mockSubjects.find(
                    (s) => s.id === assignment.subjectId
                  );
                  const stats = getSubmissionStats(assignment.id);
                  return (
                    <TableRow
                      key={assignment.id}
                      data-testid={`row-assignment-${assignment.id}`}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <ClipboardList className="h-4 w-4 text-muted-foreground" />
                          {assignment.title}
                        </div>
                      </TableCell>
                      <TableCell>{subject?.subjectName || "Unknown"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {assignment.dueDate
                            ? new Date(assignment.dueDate).toLocaleDateString()
                            : "N/A"}
                        </div>
                      </TableCell>
                      <TableCell>{assignment.totalMarks}</TableCell>
                      <TableCell>{getStatusBadge(assignment.dueDate)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {stats.graded}/{stats.total} graded
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(assignment.id)}
                            data-testid={`button-edit-assignment-${assignment.id}`}
                          >
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              navigate(
                                `/teacher/assignments/${assignment.id}/submissions`
                              )
                            }
                            data-testid={`button-view-submissions-${assignment.id}`}
                          >
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">View Submissions</span>
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
              <ClipboardList className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">No assignments yet</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Get started by creating your first assignment.
              </p>
              <Button
                className="mt-4"
                onClick={openCreateDialog}
                data-testid="button-create-first-assignment"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Assignment
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Assignment" : "Create Assignment"}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter assignment title"
                        {...field}
                        data-testid="input-assignment-title"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter assignment description"
                        {...field}
                        data-testid="textarea-assignment-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="boardId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Board</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-assignment-board">
                            <SelectValue placeholder="Select board" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {mockBoards.map((board) => (
                            <SelectItem key={board.id} value={board.id}>
                              {board.displayName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="subjectId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={!selectedBoardId}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-assignment-subject">
                            <SelectValue placeholder="Select subject" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {filteredSubjects.map((subject) => (
                            <SelectItem key={subject.id} value={subject.id}>
                              {subject.subjectName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="topicId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Topic (Optional)</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || ""}
                      disabled={!selectedSubjectId}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-assignment-topic">
                          <SelectValue placeholder="Select topic" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {filteredTopics.map((topic) => (
                          <SelectItem key={topic.id} value={topic.id}>
                            {topic.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Due Date</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          data-testid="input-assignment-due-date"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="totalMarks"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Marks</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          {...field}
                          data-testid="input-assignment-marks"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="attachmentUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Attachment (Optional)</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-4">
                        <Input
                          placeholder="File path or URL"
                          {...field}
                          data-testid="input-assignment-attachment"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          data-testid="button-upload-attachment"
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          Upload
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  data-testid="button-cancel-assignment"
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
                <Button type="submit" data-testid="button-save-assignment">
                  {editingId ? "Update Assignment" : "Create Assignment"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
