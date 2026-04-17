import { useEffect, useMemo, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Save, X, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { FileDropper } from "@/components/ui/file-dropper";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { RESOURCE_TYPE_LABELS, DIFFICULTY_LEVELS } from "@shared/schema";
import type { ResourceType, DifficultyLevel, Material, Board, Subject, Topic, Qualification } from "@shared/schema";

const materialFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  boardId: z.string().min(1, "Board is required"),
  qualId: z.string().min(1, "Qualification is required"),
  subjectId: z.string().min(1, "Subject is required"),
  topicId: z.string().optional(),
  type: z.enum(["past_paper", "notes", "video", "worksheet", "ebook"]),
  year: z.coerce.number().optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
  fileUrl: z.string().optional(),
  videoUrl: z.string().optional(),
  status: z.enum(["pending", "approved", "rejected"]).optional(),
});

type MaterialFormValues = z.infer<typeof materialFormSchema>;

export function MaterialEditorPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const isEditing = !!(id && id !== "new");

  // Data Queries
  const { data: existingMaterial, isLoading: isLoadingMaterial } = useQuery<Material>({
    queryKey: ["/api/materials", id],
    enabled: isEditing,
  });

  const { data: boards = [], isLoading: isLoadingBoards } = useQuery<Board[]>({
    queryKey: ["/api/curriculum/boards"],
  });

  const form = useForm<MaterialFormValues>({
    resolver: zodResolver(materialFormSchema),
    defaultValues: {
      title: "",
      description: "",
      boardId: "",
      qualId: "",
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
        qualId: (existingMaterial as any).qualId || "",
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
  const selectedQualId = form.watch("qualId");
  const selectedSubjectId = form.watch("subjectId");
  const selectedType = form.watch("type");

  const { data: qualifications = [], isLoading: isLoadingQuals } = useQuery<Qualification[]>({
    queryKey: ["/api/curriculum/boards", selectedBoardId, "qualifications"],
    enabled: !!selectedBoardId,
    queryFn: async ({ queryKey }) => {
      const [, boardId] = queryKey as [string, string];
      const res = await fetch(`/api/curriculum/boards/${boardId}/qualifications`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch qualifications");
      return res.json();
    }
  });

  const { data: subjects = [], isLoading: isLoadingSubjects } = useQuery<Subject[]>({
    queryKey: ["/api/curriculum/qualifications", selectedQualId, "subjects"],
    enabled: !!selectedQualId,
    queryFn: async ({ queryKey }) => {
      const [, qualId] = queryKey as [string, string];
      const res = await fetch(`/api/curriculum/qualifications/${qualId}/subjects`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch subjects");
      return res.json();
    }
  });

  const { data: topics = [], isLoading: isLoadingTopics } = useQuery<Topic[]>({
    queryKey: ["/api/topics", selectedSubjectId],
    enabled: !!selectedSubjectId,
    queryFn: async ({ queryKey }) => {
      const [, subjectId] = queryKey as [string, string];
      const res = await fetch(`/api/topics?subjectId=${subjectId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch topics");
      return res.json();
    }
  });

  // Mutations
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/teacher/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Upload failed");
      }
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/materials", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/materials"] });
      toast({ title: "Material created successfully" });
      navigate("/teacher/materials");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await apiRequest("PATCH", `/api/materials/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/materials"] });
      toast({ title: "Material updated successfully" });
      navigate("/teacher/materials");
    },
  });

  const onSubmit = async (data: MaterialFormValues) => {
    try {
      let finalFileUrl = data.fileUrl;

      if (selectedFile) {
        const uploadResult = await uploadMutation.mutateAsync(selectedFile);
        finalFileUrl = uploadResult.url;
      }

      const payload = { ...data, fileUrl: finalFileUrl };

      if (isEditing) {
        updateMutation.mutate({ id: id!, data: payload });
      } else {
        createMutation.mutate(payload);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    }
  };

  if (isLoadingMaterial && isEditing) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card className="border-primary/10 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Material Information</CardTitle>
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
                            placeholder="e.g. Introduction to Organic Chemistry"
                            {...field}
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
                            placeholder="A brief overview of what students will learn..."
                            rows={4}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="boardId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Board</FormLabel>
                          <Select
                            onValueChange={(val) => {
                              field.onChange(val);
                              form.setValue("qualId", "");
                              form.setValue("subjectId", "");
                              form.setValue("topicId", "");
                            }}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={isLoadingBoards ? "Loading..." : "Select Board"} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {boards.map((board) => (
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
                      name="qualId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Qualification</FormLabel>
                          <Select
                            onValueChange={(val) => {
                              field.onChange(val);
                              form.setValue("subjectId", "");
                              form.setValue("topicId", "");
                            }}
                            value={field.value}
                            disabled={!selectedBoardId || isLoadingQuals}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={isLoadingQuals ? "Loading..." : "Select Qualification"} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {qualifications.map((qual) => (
                                <SelectItem key={qual.id} value={qual.id}>
                                  {qual.displayName}
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
                            onValueChange={(val) => {
                              field.onChange(val);
                              form.setValue("topicId", "");
                            }}
                            value={field.value}
                            disabled={!selectedQualId || isLoadingSubjects}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={isLoadingSubjects ? "Loading..." : "Select Subject"} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {subjects.map((subject) => (
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

                    <FormField
                      control={form.control}
                      name="topicId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Topic (Optional)</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value || ""}
                            disabled={!selectedSubjectId || isLoadingTopics}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={isLoadingTopics ? "Loading..." : "Select Topic"} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {topics.map((topic) => (
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
                </CardContent>
              </Card>

              <Card className="border-primary/10 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Classification</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Resource Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {(Object.keys(RESOURCE_TYPE_LABELS) as ResourceType[]).map((type) => (
                              <SelectItem key={type} value={type}>
                                {RESOURCE_TYPE_LABELS[type]}
                              </SelectItem>
                            ))}
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
                            <Input type="number" placeholder="e.g. 2024" {...field} />
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
                        <Select onValueChange={field.onChange} value={field.value || "medium"}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
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
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="border-primary/10 shadow-sm overflow-hidden">
                <CardHeader className="bg-muted/30">
                  <CardTitle className="text-lg">Media & Content</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {selectedType === "video" ? (
                    <FormField
                      control={form.control}
                      name="videoUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Video URL</FormLabel>
                          <FormControl>
                            <Input placeholder="YouTube, Vimeo, or direct link" {...field} />
                          </FormControl>
                          <FormDescription className="text-[10px]">
                            Paste the link to your video lesson.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ) : (
                    <div className="space-y-4">
                      <FormLabel>File Attachment</FormLabel>
                      <FileDropper
                        onFileSelect={setSelectedFile}
                        allowedTypes={
                          selectedType === "past_paper" || selectedType === "ebook"
                            ? ["application/pdf"]
                            : ["application/pdf", "image/jpeg", "image/png", "image/webp"]
                        }
                        currentFileUrl={form.watch("fileUrl")}
                        label={
                          selectedType === "past_paper"
                            ? "Upload Past Paper (PDF)"
                            : selectedType === "ebook"
                              ? "Upload eBook (PDF)"
                              : "Upload Content"
                        }
                        description={
                          selectedType === "past_paper" || selectedType === "ebook"
                            ? "Direct learning materials must be in PDF format"
                            : "Upload notes, images, or documents"
                        }
                      />
                    </div>
                  )}
                  {form.watch("fileUrl") && (
                    <div className="pt-4 border-t">
                      <FormLabel className="text-xs text-muted-foreground uppercase tracking-wider">Content Preview</FormLabel>
                      <div className="mt-2 rounded-lg border border-primary/10 overflow-hidden bg-white/50 dark:bg-black/20 aspect-video flex items-center justify-center relative group">
                        {form.watch("fileUrl").match(/\.(pdf)$/i) ? (
                          <div className="text-center p-4">
                            <FileText className="h-10 w-10 text-primary mx-auto mb-2 opacity-50" />
                            <p className="text-xs font-medium text-muted-foreground">PDF Document Attached</p>
                            <Button variant="ghost" size="sm" className="mt-2 text-[10px]" asChild>
                              <a href={form.watch("fileUrl")} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-3 w-3 mr-1" /> Open in New Tab
                              </a>
                            </Button>
                          </div>
                        ) : (
                          <img
                            src={form.watch("fileUrl")}
                            alt="Preview"
                            className="w-full h-full object-contain"
                          />
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Badge className="bg-white text-black pointer-events-none">Current File</Badge>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-primary/[0.03] border-primary/10 shadow-sm">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <Button
                      type="submit"
                      className="w-full shadow-lg shadow-primary/20 h-12 text-lg font-semibold"
                      disabled={createMutation.isPending || updateMutation.isPending || uploadMutation.isPending}
                    >
                      {(createMutation.isPending || updateMutation.isPending || uploadMutation.isPending) && (
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      )}
                      <Save className="mr-2 h-5 w-5" />
                      {isEditing ? "Update Material" : "Create Material"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-11"
                      onClick={() => navigate("/teacher/materials")}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
