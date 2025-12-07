import { useState, useEffect, useMemo } from "react";
import { useParams, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Save,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  GripVertical,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  mockQuizzes,
  mockQuestions,
  mockBoards,
  mockSubjects,
  mockTopics,
} from "@/lib/mockData";

const quizFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  boardId: z.string().min(1, "Board is required"),
  subjectId: z.string().min(1, "Subject is required"),
  topicId: z.string().optional(),
  isTimed: z.boolean().default(false),
  duration: z.coerce.number().optional(),
});

type QuizFormValues = z.infer<typeof quizFormSchema>;

interface QuestionData {
  id: string;
  questionText: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
  marks: number;
  order: number;
}

const questionFormSchema = z.object({
  questionText: z.string().min(1, "Question text is required"),
  option0: z.string().min(1, "Option A is required"),
  option1: z.string().min(1, "Option B is required"),
  option2: z.string().min(1, "Option C is required"),
  option3: z.string().min(1, "Option D is required"),
  correctOptionIndex: z.string(),
  explanation: z.string().optional(),
  marks: z.coerce.number().min(1, "Marks must be at least 1").default(1),
});

type QuestionFormValues = z.infer<typeof questionFormSchema>;

export function QuizBuilderPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const isEditing = id && id !== "new";
  const existingQuiz = isEditing ? mockQuizzes.find((q) => q.id === id) : null;

  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [isQuestionDialogOpen, setIsQuestionDialogOpen] = useState(false);
  const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(
    null
  );

  const quizForm = useForm<QuizFormValues>({
    resolver: zodResolver(quizFormSchema),
    defaultValues: {
      title: "",
      description: "",
      boardId: "",
      subjectId: "",
      topicId: "",
      isTimed: false,
      duration: 30,
    },
  });

  const questionForm = useForm<QuestionFormValues>({
    resolver: zodResolver(questionFormSchema),
    defaultValues: {
      questionText: "",
      option0: "",
      option1: "",
      option2: "",
      option3: "",
      correctOptionIndex: "0",
      explanation: "",
      marks: 1,
    },
  });

  useEffect(() => {
    if (existingQuiz) {
      quizForm.reset({
        title: existingQuiz.title,
        description: existingQuiz.description || "",
        boardId: existingQuiz.boardId,
        subjectId: existingQuiz.subjectId,
        topicId: existingQuiz.topicId || "",
        isTimed: existingQuiz.isTimed,
        duration: existingQuiz.duration || 30,
      });

      const quizQuestions = mockQuestions
        .filter((q) => q.quizId === existingQuiz.id)
        .sort((a, b) => a.order - b.order)
        .map((q) => ({
          id: q.id,
          questionText: q.questionText,
          options: q.options || ["", "", "", ""],
          correctOptionIndex: q.correctOptionIndex,
          explanation: q.explanation || "",
          marks: q.marks,
          order: q.order,
        }));
      setQuestions(quizQuestions);
    }
  }, [existingQuiz, quizForm]);

  const selectedBoardId = quizForm.watch("boardId");
  const selectedSubjectId = quizForm.watch("subjectId");
  const isTimed = quizForm.watch("isTimed");

  const filteredSubjects = useMemo(() => {
    if (!selectedBoardId) return [];
    return mockSubjects.filter((s) => s.boardId === selectedBoardId);
  }, [selectedBoardId]);

  const filteredTopics = useMemo(() => {
    if (!selectedSubjectId) return [];
    return mockTopics.filter((t) => t.subjectId === selectedSubjectId);
  }, [selectedSubjectId]);

  const openAddQuestionDialog = () => {
    setEditingQuestionIndex(null);
    questionForm.reset({
      questionText: "",
      option0: "",
      option1: "",
      option2: "",
      option3: "",
      correctOptionIndex: "0",
      explanation: "",
      marks: 1,
    });
    setIsQuestionDialogOpen(true);
  };

  const openEditQuestionDialog = (index: number) => {
    const question = questions[index];
    setEditingQuestionIndex(index);
    questionForm.reset({
      questionText: question.questionText,
      option0: question.options[0] || "",
      option1: question.options[1] || "",
      option2: question.options[2] || "",
      option3: question.options[3] || "",
      correctOptionIndex: String(question.correctOptionIndex),
      explanation: question.explanation,
      marks: question.marks,
    });
    setIsQuestionDialogOpen(true);
  };

  const handleSaveQuestion = (data: QuestionFormValues) => {
    const newQuestion: QuestionData = {
      id:
        editingQuestionIndex !== null
          ? questions[editingQuestionIndex].id
          : `new-q-${Date.now()}`,
      questionText: data.questionText,
      options: [data.option0, data.option1, data.option2, data.option3],
      correctOptionIndex: parseInt(data.correctOptionIndex),
      explanation: data.explanation || "",
      marks: data.marks,
      order:
        editingQuestionIndex !== null
          ? questions[editingQuestionIndex].order
          : questions.length + 1,
    };

    if (editingQuestionIndex !== null) {
      const updated = [...questions];
      updated[editingQuestionIndex] = newQuestion;
      setQuestions(updated);
    } else {
      setQuestions([...questions, newQuestion]);
    }

    setIsQuestionDialogOpen(false);
  };

  const handleDeleteQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleMoveQuestion = (index: number, direction: "up" | "down") => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === questions.length - 1)
    ) {
      return;
    }

    const newQuestions = [...questions];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    [newQuestions[index], newQuestions[targetIndex]] = [
      newQuestions[targetIndex],
      newQuestions[index],
    ];
    setQuestions(newQuestions);
  };

  const onSubmit = (data: QuizFormValues) => {
    console.log("Quiz data:", data);
    console.log("Questions:", questions);
    toast({
      title: isEditing ? "Quiz updated" : "Quiz created",
      description: `"${data.title}" has been ${isEditing ? "updated" : "created"} with ${questions.length} questions.`,
    });
    navigate("/teacher/quizzes");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={isEditing ? "Edit Quiz" : "Create Quiz"}
        description={
          isEditing
            ? "Update quiz details and questions"
            : "Build a new quiz for your students"
        }
      />

      <Form {...quizForm}>
        <form onSubmit={quizForm.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quiz Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={quizForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter quiz title"
                        {...field}
                        data-testid="input-quiz-title"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={quizForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter quiz description"
                        {...field}
                        data-testid="textarea-quiz-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <FormField
                  control={quizForm.control}
                  name="boardId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Board</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-quiz-board">
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
                  control={quizForm.control}
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
                          <SelectTrigger data-testid="select-quiz-subject">
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
                  control={quizForm.control}
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
                          <SelectTrigger data-testid="select-quiz-topic">
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

              <div className="flex flex-wrap items-center gap-6">
                <FormField
                  control={quizForm.control}
                  name="isTimed"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-quiz-timed"
                        />
                      </FormControl>
                      <FormLabel className="!mt-0">Timed Quiz</FormLabel>
                    </FormItem>
                  )}
                />

                {isTimed && (
                  <FormField
                    control={quizForm.control}
                    name="duration"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-2">
                        <FormLabel className="whitespace-nowrap">
                          Duration (minutes)
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            className="w-24"
                            {...field}
                            data-testid="input-quiz-duration"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <CardTitle>Questions ({questions.length})</CardTitle>
              <Button
                type="button"
                onClick={openAddQuestionDialog}
                data-testid="button-add-question"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Question
              </Button>
            </CardHeader>
            <CardContent>
              {questions.length > 0 ? (
                <div className="space-y-3">
                  {questions.map((question, index) => (
                    <div
                      key={question.id}
                      className="flex items-start gap-3 rounded-md border p-3"
                      data-testid={`question-item-${index}`}
                    >
                      <div className="flex flex-col gap-1 text-muted-foreground">
                        <GripVertical className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {index + 1}. {question.questionText}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {question.marks} mark{question.marks !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleMoveQuestion(index, "up")}
                          disabled={index === 0}
                          data-testid={`button-move-up-${index}`}
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleMoveQuestion(index, "down")}
                          disabled={index === questions.length - 1}
                          data-testid={`button-move-down-${index}`}
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditQuestionDialog(index)}
                          data-testid={`button-edit-question-${index}`}
                        >
                          <span className="sr-only">Edit</span>
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteQuestion(index)}
                          data-testid={`button-delete-question-${index}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">
                    No questions added yet. Click "Add Question" to get started.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/teacher/quizzes")}
              data-testid="button-cancel-quiz"
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button type="submit" data-testid="button-save-quiz">
              <Save className="mr-2 h-4 w-4" />
              {isEditing ? "Update Quiz" : "Create Quiz"}
            </Button>
          </div>
        </form>
      </Form>

      <Dialog open={isQuestionDialogOpen} onOpenChange={setIsQuestionDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingQuestionIndex !== null ? "Edit Question" : "Add Question"}
            </DialogTitle>
          </DialogHeader>
          <Form {...questionForm}>
            <form
              onSubmit={questionForm.handleSubmit(handleSaveQuestion)}
              className="space-y-4"
            >
              <FormField
                control={questionForm.control}
                name="questionText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Question Text</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter the question"
                        {...field}
                        data-testid="textarea-question-text"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-3">
                <Label>Options</Label>
                {[0, 1, 2, 3].map((i) => (
                  <FormField
                    key={i}
                    control={questionForm.control}
                    name={`option${i}` as keyof QuestionFormValues}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium w-8">
                              {String.fromCharCode(65 + i)}.
                            </span>
                            <Input
                              placeholder={`Option ${String.fromCharCode(65 + i)}`}
                              {...field}
                              value={field.value as string}
                              data-testid={`input-option-${i}`}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </div>

              <FormField
                control={questionForm.control}
                name="correctOptionIndex"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Correct Answer</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="flex gap-4"
                      >
                        {[0, 1, 2, 3].map((i) => (
                          <div key={i} className="flex items-center gap-1">
                            <RadioGroupItem
                              value={String(i)}
                              id={`correct-${i}`}
                              data-testid={`radio-correct-${i}`}
                            />
                            <Label htmlFor={`correct-${i}`}>
                              {String.fromCharCode(65 + i)}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={questionForm.control}
                name="explanation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Explanation (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Explain the correct answer"
                        {...field}
                        data-testid="textarea-question-explanation"
                      />
                    </FormControl>
                    <FormDescription>
                      This will be shown to students after they answer.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={questionForm.control}
                name="marks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Marks</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        {...field}
                        data-testid="input-question-marks"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsQuestionDialogOpen(false)}
                  data-testid="button-cancel-question"
                >
                  Cancel
                </Button>
                <Button type="submit" data-testid="button-save-question">
                  {editingQuestionIndex !== null
                    ? "Update Question"
                    : "Add Question"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
