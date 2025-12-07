import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Bell, Pencil, Trash2, X } from "lucide-react";
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
  FormDescription,
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
import { useAuth } from "@/context/AuthContext";
import {
  mockAnnouncements,
  mockBoards,
  mockSubjects,
  mockUsers,
} from "@/lib/mockData";
import type { AnnouncementScope } from "@shared/schema";

const announcementFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  scope: z.enum(["school", "board", "subject"]),
  boardId: z.string().optional(),
  subjectId: z.string().optional(),
});

type AnnouncementFormValues = z.infer<typeof announcementFormSchema>;

const SCOPE_LABELS: Record<AnnouncementScope, string> = {
  school: "School-wide",
  board: "Board-specific",
  subject: "Subject-specific",
};

export function TeacherAnnouncementsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const currentUser = user || mockUsers.find((u) => u.role === "teacher");

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const form = useForm<AnnouncementFormValues>({
    resolver: zodResolver(announcementFormSchema),
    defaultValues: {
      title: "",
      content: "",
      scope: "school",
      boardId: "",
      subjectId: "",
    },
  });

  const myAnnouncements = mockAnnouncements.filter(
    (a) => a.authorId === currentUser?.id || a.authorId === "teacher-1"
  );

  const scope = form.watch("scope");
  const selectedBoardId = form.watch("boardId");

  const filteredSubjects = selectedBoardId
    ? mockSubjects.filter((s) => s.boardId === selectedBoardId)
    : mockSubjects;

  const openCreateDialog = () => {
    setEditingId(null);
    form.reset({
      title: "",
      content: "",
      scope: "school",
      boardId: "",
      subjectId: "",
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (announcementId: string) => {
    const announcement = mockAnnouncements.find((a) => a.id === announcementId);
    if (announcement) {
      setEditingId(announcementId);
      form.reset({
        title: announcement.title,
        content: announcement.content,
        scope: announcement.scope as AnnouncementScope,
        boardId: announcement.boardId || "",
        subjectId: announcement.subjectId || "",
      });
      setIsDialogOpen(true);
    }
  };

  const onSubmit = (data: AnnouncementFormValues) => {
    console.log("Announcement data:", data);
    toast({
      title: editingId ? "Announcement updated" : "Announcement created",
      description: `"${data.title}" has been ${editingId ? "updated" : "published"} successfully.`,
    });
    setIsDialogOpen(false);
  };

  const handleDelete = () => {
    if (deleteId) {
      console.log("Deleting announcement:", deleteId);
      toast({
        title: "Announcement deleted",
        description: "The announcement has been deleted successfully.",
      });
      setDeleteId(null);
    }
  };

  const getScopeDetails = (announcement: (typeof mockAnnouncements)[0]) => {
    if (announcement.scope === "board" && announcement.boardId) {
      const board = mockBoards.find((b) => b.id === announcement.boardId);
      return board?.name || "Unknown Board";
    }
    if (announcement.scope === "subject" && announcement.subjectId) {
      const subject = mockSubjects.find((s) => s.id === announcement.subjectId);
      return subject?.name || "Unknown Subject";
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Announcements"
        description="Create and manage announcements for students"
        actions={
          <Button onClick={openCreateDialog} data-testid="button-create-announcement">
            <Plus className="mr-2 h-4 w-4" />
            Create Announcement
          </Button>
        }
      />

      {myAnnouncements.length > 0 ? (
        <div className="space-y-4">
          {myAnnouncements.map((announcement) => {
            const scopeDetails = getScopeDetails(announcement);
            return (
              <Card
                key={announcement.id}
                data-testid={`card-announcement-${announcement.id}`}
              >
                <CardHeader className="flex flex-row items-start justify-between gap-4">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Bell className="h-4 w-4" />
                      {announcement.title}
                    </CardTitle>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">
                        {SCOPE_LABELS[announcement.scope as AnnouncementScope]}
                      </Badge>
                      {scopeDetails && (
                        <Badge variant="secondary">{scopeDetails}</Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {announcement.createdAt
                          ? new Date(announcement.createdAt).toLocaleDateString()
                          : "N/A"}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(announcement.id)}
                      data-testid={`button-edit-announcement-${announcement.id}`}
                    >
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteId(announcement.id)}
                      data-testid={`button-delete-announcement-${announcement.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {announcement.content}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-8 text-center">
            <Bell className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">No announcements yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Get started by creating your first announcement.
            </p>
            <Button
              className="mt-4"
              onClick={openCreateDialog}
              data-testid="button-create-first-announcement"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Announcement
            </Button>
          </CardContent>
        </Card>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Announcement" : "Create Announcement"}
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
                        placeholder="Enter announcement title"
                        {...field}
                        data-testid="input-announcement-title"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter announcement content"
                        className="min-h-[120px]"
                        {...field}
                        data-testid="textarea-announcement-content"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="scope"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Scope</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-announcement-scope">
                          <SelectValue placeholder="Select scope" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="school">School-wide</SelectItem>
                        <SelectItem value="board">Board-specific</SelectItem>
                        <SelectItem value="subject">Subject-specific</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Choose who will see this announcement.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {scope === "board" && (
                <FormField
                  control={form.control}
                  name="boardId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Board</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-announcement-board">
                            <SelectValue placeholder="Select board" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {mockBoards.map((board) => (
                            <SelectItem key={board.id} value={board.id}>
                              {board.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {scope === "subject" && (
                <>
                  <FormField
                    control={form.control}
                    name="boardId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Board (Optional)</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-announcement-subject-board">
                              <SelectValue placeholder="Select board to filter" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {mockBoards.map((board) => (
                              <SelectItem key={board.id} value={board.id}>
                                {board.name}
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
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-announcement-subject">
                              <SelectValue placeholder="Select subject" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {filteredSubjects.map((subject) => (
                              <SelectItem key={subject.id} value={subject.id}>
                                {subject.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  data-testid="button-cancel-announcement"
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
                <Button type="submit" data-testid="button-save-announcement">
                  {editingId ? "Update Announcement" : "Publish Announcement"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Announcement</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this announcement? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              data-testid="button-confirm-delete"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
