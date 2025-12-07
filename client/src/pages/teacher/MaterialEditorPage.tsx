import { useEffect, useMemo } from "react";
import { useParams, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Save, X, Upload } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  mockMaterials,
  mockBoards,
  mockSubjects,
  mockTopics,
} from "@/lib/mockData";
import { RESOURCE_TYPE_LABELS, DIFFICULTY_LEVELS } from "@shared/schema";
import type { ResourceType, DifficultyLevel } from "@shared/schema";

const materialFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  boardId: z.string().min(1, "Board is required"),
  subjectId: z.string().min(1, "Subject is required"),
  topicId: z.string().optional(),
  type: z.enum(["past_paper", "notes", "video", "worksheet"]),
  year: z.coerce.number().optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
  fileUrl: z.string().optional(),
  videoUrl: z.string().optional(),
});

type MaterialFormValues = z.infer<typeof materialFormSchema>;

export function MaterialEditorPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const isEditing = id && id !== "new";
  const existingMaterial = isEditing
    ? mockMaterials.find((m) => m.id === id)
    : null;

  const form = useForm<MaterialFormValues>({
    resolver: zodResolver(materialFormSchema),
    defaultValues: {
      title: "",
      description: "",
      boardId: "",
      subjectId: "",
      topicId: "",
      type: "notes",
      year: undefined,
      difficulty: "medium",
      fileUrl: "",
      videoUrl: "",
    },
  });

  useEffect(() => {
    if (existingMaterial) {
      form.reset({
        title: existingMaterial.title,
        description: existingMaterial.description || "",
        boardId: existingMaterial.boardId,
        subjectId: existingMaterial.subjectId,
        topicId: existingMaterial.topicId || "",
        type: existingMaterial.type as ResourceType,
        year: existingMaterial.year || undefined,
        difficulty: (existingMaterial.difficulty as DifficultyLevel) || "medium",
        fileUrl: existingMaterial.fileUrl || "",
        videoUrl: existingMaterial.videoUrl || "",
      });
    }
  }, [existingMaterial, form]);

  const selectedBoardId = form.watch("boardId");
  const selectedSubjectId = form.watch("subjectId");
  const selectedType = form.watch("type");

  const filteredSubjects = useMemo(() => {
    if (!selectedBoardId) return [];
    return mockSubjects.filter((s) => s.boardId === selectedBoardId);
  }, [selectedBoardId]);

  const filteredTopics = useMemo(() => {
    if (!selectedSubjectId) return [];
    return mockTopics.filter((t) => t.subjectId === selectedSubjectId);
  }, [selectedSubjectId]);

  useEffect(() => {
    if (selectedBoardId && !existingMaterial) {
      const currentSubjectId = form.getValues("subjectId");
      const isValidSubject = filteredSubjects.some(
        (s) => s.id === currentSubjectId
      );
      if (!isValidSubject) {
        form.setValue("subjectId", "");
        form.setValue("topicId", "");
      }
    }
  }, [selectedBoardId, filteredSubjects, form, existingMaterial]);

  useEffect(() => {
    if (selectedSubjectId && !existingMaterial) {
      const currentTopicId = form.getValues("topicId");
      const isValidTopic = filteredTopics.some((t) => t.id === currentTopicId);
      if (!isValidTopic) {
        form.setValue("topicId", "");
      }
    }
  }, [selectedSubjectId, filteredTopics, form, existingMaterial]);

  const onSubmit = (data: MaterialFormValues) => {
    console.log("Material data:", data);
    toast({
      title: isEditing ? "Material updated" : "Material created",
      description: `"${data.title}" has been ${isEditing ? "updated" : "created"} successfully.`,
    });
    navigate("/teacher/materials");
  };

  const handleCancel = () => {
    navigate("/teacher/materials");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={isEditing ? "Edit Material" : "Create Material"}
        description={
          isEditing
            ? "Update the details of your study material"
            : "Add a new study material for students"
        }
      />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Material Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter material title"
                        {...field}
                        data-testid="input-material-title"
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
                        placeholder="Enter a description of this material"
                        {...field}
                        data-testid="textarea-material-description"
                      />
                    </FormControl>
                    <FormDescription>
                      A brief description to help students understand what this
                      material covers.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <FormField
                  control={form.control}
                  name="boardId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Board</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-material-board">
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
                          <SelectTrigger data-testid="select-material-subject">
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
                          <SelectTrigger data-testid="select-material-topic">
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
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-material-type">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(Object.keys(RESOURCE_TYPE_LABELS) as ResourceType[]).map(
                            (type) => (
                              <SelectItem key={type} value={type}>
                                {RESOURCE_TYPE_LABELS[type]}
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {selectedType === "past_paper" && (
                  <FormField
                    control={form.control}
                    name="year"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Year</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="e.g. 2023"
                            {...field}
                            value={field.value || ""}
                            data-testid="input-material-year"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="difficulty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Difficulty</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || "medium"}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-material-difficulty">
                            <SelectValue placeholder="Select difficulty" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {DIFFICULTY_LEVELS.map((level) => (
                            <SelectItem key={level} value={level}>
                              {level.charAt(0).toUpperCase() + level.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>File Upload</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedType === "video" ? (
                <FormField
                  control={form.control}
                  name="videoUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Video URL</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://example.com/video"
                          {...field}
                          data-testid="input-material-video-url"
                        />
                      </FormControl>
                      <FormDescription>
                        Enter the URL of the video (YouTube, Vimeo, etc.)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <FormField
                  control={form.control}
                  name="fileUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>File</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-4">
                          <Input
                            placeholder="File path or URL"
                            {...field}
                            data-testid="input-material-file-url"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            data-testid="button-upload-file"
                          >
                            <Upload className="mr-2 h-4 w-4" />
                            Upload
                          </Button>
                        </div>
                      </FormControl>
                      <FormDescription>
                        Upload a PDF, document, or other file.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              data-testid="button-cancel-material"
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button type="submit" data-testid="button-save-material">
              <Save className="mr-2 h-4 w-4" />
              {isEditing ? "Update Material" : "Create Material"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
