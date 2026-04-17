/**
 * Teacher MCQ Manager — Full CRUD + PDF Import + AI Generation
 *
 * Features:
 * - Question bank table with filters (subject, topic, difficulty, source)
 * - Create / Edit question dialog
 * - PDF drag-and-drop upload → AI extraction → preview + save
 * - AI-generate questions from parameters
 * - Bulk JSON import
 * - Delete with confirmation
 */

import { useState, useCallback, useRef, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import {
    Brain, Plus, Upload, Wand2, Trash2, Edit, FileUp,
    Search, Filter, ChevronLeft, ChevronRight, Check,
    X, Loader2, AlertTriangle, Eye, Save, Download,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select, SelectContent, SelectItem,
    SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
    DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
    Table, TableBody, TableCell, TableHead,
    TableHeader, TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/layout/PageHeader";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// ============================================================================
// Types
// ============================================================================

interface McqQuestion {
    id: string;
    subjectId: string;
    topicId?: string;
    boardId?: string;
    questionText: string;
    options: { label: string; text: string }[];
    correctOptionIndex: number;
    explanation?: string;
    difficulty: string;
    source: string;
    tags: string[];
    bloomsLevel?: string;
    marks: number;
    isVerified: boolean;
    createdAt: string;
}

interface ExtractionResult {
    questions: any[];
    metadata: {
        totalChunks: number;
        chunksProcessed: number;
        rawQuestionsGenerated: number;
        afterValidation: number;
        afterDedup: number;
        extractedTextLength: number;
        processingTimeMs: number;
    };
}

// ============================================================================
// Component
// ============================================================================

export function McqManagerPage() {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { user } = useAuth();
    // Filters
    const [searchTerm, setSearchTerm] = useState("");
    const [filterSubject, setFilterSubject] = useState("");
    const [filterDifficulty, setFilterDifficulty] = useState("");
    const [filterSource, setFilterSource] = useState("");
    const [filterMyQuestions, setFilterMyQuestions] = useState(false);
    const [page, setPage] = useState(1);
    const limit = 20;

    // Dialogs
    const [createOpen, setCreateOpen] = useState(false);
    const [editQuestion, setEditQuestion] = useState<McqQuestion | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<McqQuestion | null>(null);
    const [pdfUploadOpen, setPdfUploadOpen] = useState(false);
    const [aiGenerateOpen, setAiGenerateOpen] = useState(false);
    const [previewQuestions, setPreviewQuestions] = useState<any[] | null>(null);

    // Form state for create/edit
    const [formData, setFormData] = useState({
        questionText: "",
        optionA: "",
        optionB: "",
        optionC: "",
        optionD: "",
        correctOptionIndex: 0,
        explanation: "",
        difficulty: "medium" as string,
        subjectId: "",
        topicId: "",
        tags: "",
        bloomsLevel: "",
        marks: 1,
    });

    // PDF upload state
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [pdfOptions, setPdfOptions] = useState({
        subjectId: "",
        topicId: "",
        subject: "",
        topic: "",
        difficulty: "mixed",
        maxQuestions: "10",
    });
    const [extractionResult, setExtractionResult] = useState<ExtractionResult | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // AI generate state
    const [aiOptions, setAiOptions] = useState({
        subject: "",
        topic: "",
        subjectId: "",
        topicId: "",
        difficulty: "medium",
        count: "5",
        board: "",
    });

    // Data Queries
    const { data: subjects = [] } = useQuery<any[]>({ queryKey: ["/api/subjects"] });

    const queryString = useMemo(() => {
        const params = new URLSearchParams({
            ...(filterSubject && { subjectId: filterSubject }),
            ...(filterDifficulty && { difficulty: filterDifficulty }),
            ...(filterSource && { source: filterSource }),
            ...(searchTerm && { search: searchTerm }),
            ...(filterMyQuestions && user?.id && { createdBy: user.id }),
            page: page.toString(),
            limit: limit.toString(),
        });
        return params.toString();
    }, [filterSubject, filterDifficulty, filterSource, searchTerm, filterMyQuestions, user?.id, page, limit]);

    const { data: questionsData, isLoading } = useQuery<{ questions: McqQuestion[]; total: number }>({
        queryKey: [`/api/mcq/questions?${queryString}`],
    });

    const { data: topics = [] } = useQuery<any[]>({
        queryKey: [`/api/topics?subjectId=${filterSubject || formData.subjectId || pdfOptions.subjectId || aiOptions.subjectId}`],
        enabled: !!(filterSubject || formData.subjectId || pdfOptions.subjectId || aiOptions.subjectId),
    });

    const questions = questionsData?.questions || [];
    const total = questionsData?.total || 0;
    const totalPages = Math.ceil(total / limit);

    // ========================================================================
    // Mutations
    // ========================================================================

    const createMutation = useMutation({
        mutationFn: async (data: any) => {
            const res = await apiRequest("POST", "/api/mcq/questions", data);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/mcq/questions"] });
            toast({ title: "Question created", description: "MCQ question added to the bank" });
            setCreateOpen(false);
            resetForm();
        },
        onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: any }) => {
            const res = await apiRequest("PATCH", `/api/mcq/questions/${id}`, data);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/mcq/questions"] });
            toast({ title: "Question updated" });
            setEditQuestion(null);
            resetForm();
        },
        onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await apiRequest("DELETE", `/api/mcq/questions/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/mcq/questions"] });
            toast({ title: "Question deleted" });
            setDeleteTarget(null);
        },
        onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
    });

    const extractMutation = useMutation({
        mutationFn: async (formData: FormData) => {
            const res = await fetch("/api/mcq/extract-from-pdf", {
                method: "POST",
                body: formData,
                credentials: "include",
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Extraction failed");
            }
            return res.json();
        },
        onSuccess: (data: ExtractionResult) => {
            setExtractionResult(data);
            toast({
                title: "Extraction complete",
                description: `${data.questions.length} questions extracted in ${(data.metadata.processingTimeMs / 1000).toFixed(1)}s`,
            });
        },
        onError: (err: Error) => toast({ title: "Extraction failed", description: err.message, variant: "destructive" }),
    });

    const saveExtractedMutation = useMutation({
        mutationFn: async (questions: any[]) => {
            const saved = [];
            for (const q of questions) {
                const res = await apiRequest("POST", "/api/mcq/questions", {
                    subjectId: pdfOptions.subjectId,
                    topicId: pdfOptions.topicId || undefined,
                    questionText: q.questionText,
                    options: q.options,
                    correctOptionIndex: q.correctOptionIndex,
                    explanation: q.explanation,
                    difficulty: q.difficulty || "medium",
                    source: "extracted",
                    tags: q.tags || [],
                    bloomsLevel: q.bloomsLevel,
                    marks: 1,
                    isVerified: false,
                });
                saved.push(await res.json());
            }
            return saved;
        },
        onSuccess: (saved) => {
            queryClient.invalidateQueries({ queryKey: ["/api/mcq/questions"] });
            toast({ title: "Saved!", description: `${saved.length} questions saved to question bank` });
            setExtractionResult(null);
            setPdfUploadOpen(false);
            setPdfFile(null);
        },
        onError: (err: Error) => toast({ title: "Save failed", description: err.message, variant: "destructive" }),
    });

    const aiGenerateMutation = useMutation({
        mutationFn: async (opts: any) => {
            const res = await apiRequest("POST", "/api/mcq/ai/generate", opts);
            return res.json();
        },
        onSuccess: (data: any) => {
            setPreviewQuestions(data.questions || []);
            toast({ title: "Generated!", description: `${(data.questions || []).length} questions generated by AI` });
        },
        onError: (err: Error) => toast({ title: "Generation failed", description: err.message, variant: "destructive" }),
    });

    const saveGeneratedMutation = useMutation({
        mutationFn: async (questions: any[]) => {
            const saved = [];
            for (const q of questions) {
                const res = await apiRequest("POST", "/api/mcq/questions", {
                    subjectId: aiOptions.subjectId,
                    questionText: q.questionText,
                    options: q.options,
                    correctOptionIndex: q.correctOptionIndex,
                    explanation: q.explanation,
                    difficulty: q.difficulty || "medium",
                    source: "ai_generated",
                    tags: q.tags || [],
                    bloomsLevel: q.bloomsLevel,
                    marks: 1,
                    isVerified: false,
                });
                saved.push(await res.json());
            }
            return saved;
        },
        onSuccess: (saved) => {
            queryClient.invalidateQueries({ queryKey: ["/api/mcq/questions"] });
            toast({ title: "Saved!", description: `${saved.length} AI-generated questions saved` });
            setPreviewQuestions(null);
            setAiGenerateOpen(false);
        },
        onError: (err: Error) => toast({ title: "Save failed", description: err.message, variant: "destructive" }),
    });

    // ========================================================================
    // Helpers
    // ========================================================================

    function resetForm() {
        setFormData({
            questionText: "",
            optionA: "",
            optionB: "",
            optionC: "",
            optionD: "",
            correctOptionIndex: 0,
            explanation: "",
            difficulty: "medium",
            subjectId: "",
            topicId: "",
            tags: "",
            bloomsLevel: "",
            marks: 1,
        });
    }

    function openEditDialog(q: McqQuestion) {
        setFormData({
            questionText: q.questionText,
            optionA: q.options[0]?.text || "",
            optionB: q.options[1]?.text || "",
            optionC: q.options[2]?.text || "",
            optionD: q.options[3]?.text || "",
            correctOptionIndex: q.correctOptionIndex,
            explanation: q.explanation || "",
            difficulty: q.difficulty,
            subjectId: q.subjectId,
            topicId: q.topicId || "",
            tags: (q.tags || []).join(", "),
            bloomsLevel: q.bloomsLevel || "",
            marks: q.marks,
        });
        setEditQuestion(q);
    }

    function buildQuestionPayload() {
        return {
            questionText: formData.questionText,
            options: [
                { label: "A", text: formData.optionA },
                { label: "B", text: formData.optionB },
                { label: "C", text: formData.optionC },
                { label: "D", text: formData.optionD },
            ],
            correctOptionIndex: formData.correctOptionIndex,
            explanation: formData.explanation,
            difficulty: formData.difficulty,
            subjectId: formData.subjectId,
            topicId: formData.topicId || undefined,
            tags: formData.tags.split(",").map((t) => t.trim()).filter(Boolean),
            bloomsLevel: formData.bloomsLevel || undefined,
            marks: formData.marks,
            source: "teacher",
            isVerified: true,
        };
    }

    function handlePdfExtract() {
        if (!pdfFile || !pdfOptions.subjectId) {
            toast({ title: "Missing fields", description: "Please select a PDF and subject", variant: "destructive" });
            return;
        }
        const fd = new FormData();
        fd.append("pdf", pdfFile);
        fd.append("subjectId", pdfOptions.subjectId);
        if (pdfOptions.topicId) fd.append("topicId", pdfOptions.topicId);
        if (pdfOptions.subject) fd.append("subject", pdfOptions.subject);
        if (pdfOptions.topic) fd.append("topic", pdfOptions.topic);
        fd.append("difficulty", pdfOptions.difficulty);
        fd.append("maxQuestions", pdfOptions.maxQuestions);
        extractMutation.mutate(fd);
    }

    const onDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file && file.type === "application/pdf") {
            setPdfFile(file);
        }
    }, []);

    const difficultyColor = (d: string) => {
        switch (d) {
            case "easy": return "bg-green-500/20 text-green-700";
            case "medium": return "bg-amber-500/20 text-amber-700";
            case "hard": return "bg-red-500/20 text-red-700";
            default: return "";
        }
    };

    const sourceColor = (s: string) => {
        switch (s) {
            case "teacher": return "bg-blue-500/20 text-blue-700";
            case "extracted": return "bg-purple-500/20 text-purple-700";
            case "ai_generated": return "bg-cyan-500/20 text-cyan-700";
            default: return "bg-gray-500/20 text-gray-700";
        }
    };

    // ========================================================================
    // Render
    // ========================================================================

    return (
        <div className="space-y-6">
            <PageHeader
                title="MCQ Question Manager"
                description="Create, import, and manage question bank"
                actions={
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setPdfUploadOpen(true)}>
                            <Upload className="h-4 w-4 mr-2" />
                            Import PDF
                        </Button>
                        <Button variant="outline" onClick={() => setAiGenerateOpen(true)}>
                            <Wand2 className="h-4 w-4 mr-2" />
                            AI Generate
                        </Button>
                        <Button onClick={() => { resetForm(); setCreateOpen(true); }}>
                            <Plus className="h-4 w-4 mr-2" />
                            Create Question
                        </Button>
                    </div>
                }
            />

            {/* Filters */}
            <Card>
                <CardContent className="pt-4">
                    <div className="flex flex-wrap gap-3 items-end">
                        <div className="flex-1 min-w-[200px]">
                            <Label className="text-xs">Search</Label>
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search questions..."
                                    value={searchTerm}
                                    onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                                    className="pl-8"
                                />
                            </div>
                        </div>
                        <div className="min-w-[150px]">
                            <Label className="text-xs">Subject</Label>
                            <Select value={filterSubject} onValueChange={(v) => { setFilterSubject(v); setPage(1); }}>
                                <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">All Subjects</SelectItem>
                                    {subjects.map((s: any) => (
                                        <SelectItem key={s.id} value={s.id}>{s.subjectName}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="min-w-[120px]">
                            <Label className="text-xs">Difficulty</Label>
                            <Select value={filterDifficulty} onValueChange={(v) => { setFilterDifficulty(v); setPage(1); }}>
                                <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">All</SelectItem>
                                    <SelectItem value="easy">Easy</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="hard">Hard</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="min-w-[120px]">
                            <Label className="text-xs">Source</Label>
                            <Select value={filterSource} onValueChange={(v) => { setFilterSource(v); setPage(1); }}>
                                <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">All</SelectItem>
                                    <SelectItem value="teacher">Teacher</SelectItem>
                                    <SelectItem value="extracted">PDF Extracted</SelectItem>
                                    <SelectItem value="ai_generated">AI Generated</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center gap-2 mb-1">
                            <input
                                type="checkbox"
                                id="my-questions"
                                checked={filterMyQuestions}
                                onChange={(e) => { setFilterMyQuestions(e.target.checked); setPage(1); }}
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <Label htmlFor="my-questions" className="text-xs cursor-pointer">My Questions Only</Label>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Questions Table */}
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[40%]">Question</TableHead>
                                <TableHead>Difficulty</TableHead>
                                <TableHead>Source</TableHead>
                                <TableHead>Verified</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8">
                                        <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                                    </TableCell>
                                </TableRow>
                            ) : questions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                        No questions found. Create one or import from PDF.
                                    </TableCell>
                                </TableRow>
                            ) : questions.map((q) => (
                                <TableRow key={q.id}>
                                    <TableCell className="max-w-[400px]">
                                        <p className="text-sm line-clamp-2">{q.questionText}</p>
                                        {q.tags && q.tags.length > 0 && (
                                            <div className="flex gap-1 mt-1">
                                                {q.tags.slice(0, 3).map((tag: string, i: number) => (
                                                    <Badge key={i} variant="outline" className="text-xs">{tag}</Badge>
                                                ))}
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={difficultyColor(q.difficulty)}>{q.difficulty}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={sourceColor(q.source)}>{q.source}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        {q.isVerified ? (
                                            <Check className="h-4 w-4 text-green-500" />
                                        ) : (
                                            <X className="h-4 w-4 text-muted-foreground" />
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-1">
                                            <Button size="icon" variant="ghost" onClick={() => openEditDialog(q)}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button size="icon" variant="ghost" onClick={() => setDeleteTarget(q)}>
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between px-4 py-3 border-t">
                            <p className="text-sm text-muted-foreground">
                                Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
                            </p>
                            <div className="flex gap-1">
                                <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* ================================================================
          CREATE / EDIT DIALOG
          ================================================================ */}
            <Dialog open={createOpen || !!editQuestion} onOpenChange={(open) => {
                if (!open) { setCreateOpen(false); setEditQuestion(null); resetForm(); }
            }}>
                <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editQuestion ? "Edit Question" : "Create Question"}</DialogTitle>
                        <DialogDescription>
                            {editQuestion ? "Update the question details below" : "Add a new MCQ to the question bank"}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div>
                            <Label>Question Text *</Label>
                            <Textarea
                                value={formData.questionText}
                                onChange={(e) => setFormData({ ...formData, questionText: e.target.value })}
                                placeholder="Enter the question text..."
                                rows={3}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            {["A", "B", "C", "D"].map((label, i) => (
                                <div key={label}>
                                    <Label className="flex items-center gap-2">
                                        Option {label}
                                        {formData.correctOptionIndex === i && (
                                            <Badge className="bg-green-500/20 text-green-700 text-xs">Correct</Badge>
                                        )}
                                    </Label>
                                    <div className="flex gap-1">
                                        <Input
                                            value={(formData as any)[`option${label}`]}
                                            onChange={(e) => setFormData({ ...formData, [`option${label}`]: e.target.value })}
                                            placeholder={`Option ${label}`}
                                        />
                                        <Button
                                            size="icon"
                                            variant={formData.correctOptionIndex === i ? "default" : "outline"}
                                            onClick={() => setFormData({ ...formData, correctOptionIndex: i })}
                                            title="Mark as correct"
                                        >
                                            <Check className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div>
                            <Label>Explanation</Label>
                            <Textarea
                                value={formData.explanation}
                                onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                                placeholder="Explain why the correct answer is right..."
                                rows={2}
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <Label>Subject *</Label>
                                <Select value={formData.subjectId} onValueChange={(v) => setFormData({ ...formData, subjectId: v, topicId: "" })}>
                                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                                    <SelectContent>
                                        {subjects.map((s: any) => (
                                            <SelectItem key={s.id} value={s.id}>{s.subjectName}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Topic</Label>
                                <Select value={formData.topicId} onValueChange={(v) => setFormData({ ...formData, topicId: v })} disabled={!formData.subjectId}>
                                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                                    <SelectContent>
                                        {topics.map((t: any) => (
                                            <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Difficulty</Label>
                                <Select value={formData.difficulty} onValueChange={(v) => setFormData({ ...formData, difficulty: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="easy">Easy</SelectItem>
                                        <SelectItem value="medium">Medium</SelectItem>
                                        <SelectItem value="hard">Hard</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Marks</Label>
                                <Input
                                    type="number"
                                    min={1}
                                    max={10}
                                    value={formData.marks}
                                    onChange={(e) => setFormData({ ...formData, marks: parseInt(e.target.value) || 1 })}
                                />
                            </div>
                        </div>

                        <div>
                            <Label>Tags (comma-separated)</Label>
                            <Input
                                value={formData.tags}
                                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                                placeholder="e.g. photosynthesis, biology, cell structure"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => { setCreateOpen(false); setEditQuestion(null); resetForm(); }}>
                            Cancel
                        </Button>
                        <Button
                            onClick={() => {
                                const payload = buildQuestionPayload();
                                if (editQuestion) {
                                    updateMutation.mutate({ id: editQuestion.id, data: payload });
                                } else {
                                    createMutation.mutate(payload);
                                }
                            }}
                            disabled={!formData.questionText || !formData.optionA || !formData.subjectId}
                        >
                            {(createMutation.isPending || updateMutation.isPending) && (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            )}
                            {editQuestion ? "Update" : "Create"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ================================================================
          DELETE CONFIRMATION
          ================================================================ */}
            <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-destructive" />
                            Delete Question
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure? This will permanently delete this question.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="p-3 rounded-lg bg-muted text-sm line-clamp-3">
                        {deleteTarget?.questionText}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
                        <Button
                            variant="destructive"
                            onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
                            disabled={deleteMutation.isPending}
                        >
                            {deleteMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ================================================================
          PDF UPLOAD DIALOG
          ================================================================ */}
            <Dialog open={pdfUploadOpen} onOpenChange={(open) => {
                if (!open) { setPdfUploadOpen(false); setPdfFile(null); setExtractionResult(null); }
            }}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FileUp className="h-5 w-5" />
                            Import MCQs from PDF
                        </DialogTitle>
                        <DialogDescription>
                            Upload a PDF document and AI will extract MCQ questions from its content
                        </DialogDescription>
                    </DialogHeader>

                    {!extractionResult ? (
                        <div className="space-y-4">
                            {/* Drop zone */}
                            <div
                                onDrop={onDrop}
                                onDragOver={(e) => e.preventDefault()}
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="application/pdf"
                                    className="hidden"
                                    onChange={(e) => e.target.files?.[0] && setPdfFile(e.target.files[0])}
                                />
                                {pdfFile ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <FileUp className="h-6 w-6 text-green-500" />
                                        <span className="font-medium">{pdfFile.name}</span>
                                        <Badge>{(pdfFile.size / 1024 / 1024).toFixed(1)} MB</Badge>
                                    </div>
                                ) : (
                                    <>
                                        <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                                        <p className="font-medium">Drop PDF here or click to browse</p>
                                        <p className="text-sm text-muted-foreground mt-1">Max 20MB</p>
                                    </>
                                )}
                            </div>

                            {/* Options */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label>Subject *</Label>
                                    <Select value={pdfOptions.subjectId} onValueChange={(v) => {
                                        const subj = subjects.find((s: any) => s.id === v);
                                        setPdfOptions({ ...pdfOptions, subjectId: v, subject: subj?.subjectName || "" });
                                    }}>
                                        <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                                        <SelectContent>
                                            {subjects.map((s: any) => (
                                                <SelectItem key={s.id} value={s.id}>{s.subjectName}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label>Topic (optional)</Label>
                                    <Input
                                        value={pdfOptions.topic}
                                        onChange={(e) => setPdfOptions({ ...pdfOptions, topic: e.target.value })}
                                        placeholder="e.g. Photosynthesis"
                                    />
                                </div>
                                <div>
                                    <Label>Difficulty</Label>
                                    <Select value={pdfOptions.difficulty} onValueChange={(v) => setPdfOptions({ ...pdfOptions, difficulty: v })}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="mixed">Mixed</SelectItem>
                                            <SelectItem value="easy">Easy</SelectItem>
                                            <SelectItem value="medium">Medium</SelectItem>
                                            <SelectItem value="hard">Hard</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label>Max Questions</Label>
                                    <Input
                                        type="number"
                                        min={1}
                                        max={30}
                                        value={pdfOptions.maxQuestions}
                                        onChange={(e) => setPdfOptions({ ...pdfOptions, maxQuestions: e.target.value })}
                                    />
                                </div>
                            </div>

                            <Button onClick={handlePdfExtract} disabled={!pdfFile || !pdfOptions.subjectId || extractMutation.isPending} className="w-full">
                                {extractMutation.isPending ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Extracting MCQs... This may take a minute
                                    </>
                                ) : (
                                    <>
                                        <Brain className="h-4 w-4 mr-2" />
                                        Extract MCQs from PDF
                                    </>
                                )}
                            </Button>
                        </div>
                    ) : (
                        /* Extraction Result — Preview */
                        <div className="space-y-4">
                            {/* Stats */}
                            <div className="grid grid-cols-3 gap-2 text-center">
                                <div className="p-2 rounded-lg bg-muted">
                                    <div className="text-2xl font-bold">{extractionResult.questions.length}</div>
                                    <div className="text-xs text-muted-foreground">Questions</div>
                                </div>
                                <div className="p-2 rounded-lg bg-muted">
                                    <div className="text-2xl font-bold">{extractionResult.metadata.chunksProcessed}</div>
                                    <div className="text-xs text-muted-foreground">Chunks Processed</div>
                                </div>
                                <div className="p-2 rounded-lg bg-muted">
                                    <div className="text-2xl font-bold">{(extractionResult.metadata.processingTimeMs / 1000).toFixed(1)}s</div>
                                    <div className="text-xs text-muted-foreground">Processing Time</div>
                                </div>
                            </div>

                            {/* Questions Preview */}
                            <div className="space-y-3 max-h-[400px] overflow-y-auto">
                                {extractionResult.questions.map((q, idx) => (
                                    <div key={idx} className="p-3 border rounded-lg space-y-2">
                                        <p className="text-sm font-medium">Q{idx + 1}. {q.questionText}</p>
                                        <div className="grid grid-cols-2 gap-1">
                                            {q.options.map((opt: any, oi: number) => (
                                                <div
                                                    key={oi}
                                                    className={`text-xs p-1.5 rounded ${oi === q.correctOptionIndex
                                                        ? "bg-green-500/10 text-green-700 font-medium"
                                                        : "bg-muted"
                                                        }`}
                                                >
                                                    {opt.label}. {opt.text}
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex gap-1">
                                            <Badge className={difficultyColor(q.difficulty)}>{q.difficulty}</Badge>
                                            {q.bloomsLevel && <Badge variant="outline" className="text-xs">{q.bloomsLevel}</Badge>}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={() => { setExtractionResult(null); setPdfFile(null); }} className="flex-1">
                                    Re-extract
                                </Button>
                                <Button
                                    onClick={() => saveExtractedMutation.mutate(extractionResult.questions)}
                                    disabled={saveExtractedMutation.isPending}
                                    className="flex-1"
                                >
                                    {saveExtractedMutation.isPending ? (
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    ) : (
                                        <Save className="h-4 w-4 mr-2" />
                                    )}
                                    Save All ({extractionResult.questions.length})
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* ================================================================
          AI GENERATE DIALOG
          ================================================================ */}
            <Dialog open={aiGenerateOpen} onOpenChange={(open) => {
                if (!open) { setAiGenerateOpen(false); setPreviewQuestions(null); }
            }}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Wand2 className="h-5 w-5" />
                            AI Generate Questions
                        </DialogTitle>
                        <DialogDescription>
                            Generate MCQ questions from a subject and topic using AI
                        </DialogDescription>
                    </DialogHeader>

                    {!previewQuestions ? (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label>Subject *</Label>
                                    <Select
                                        value={aiOptions.subjectId}
                                        onValueChange={(v) => {
                                            const s = subjects.find((s: any) => s.id === v);
                                            setAiOptions({ ...aiOptions, subjectId: v, subject: s?.subjectName || "" });
                                        }}
                                    >
                                        <SelectTrigger><SelectValue placeholder="Select curriculum subject" /></SelectTrigger>
                                        <SelectContent>
                                            {subjects.map((s: any) => (
                                                <SelectItem key={s.id} value={s.id}>{s.subjectName}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label>Topic *</Label>
                                    <Select
                                        value={aiOptions.topicId}
                                        onValueChange={(v) => {
                                            const t = topics.find((t: any) => t.id === v);
                                            setAiOptions({ ...aiOptions, topicId: v, topic: t?.name || "" });
                                        }}
                                        disabled={!aiOptions.subjectId}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder={aiOptions.subjectId ? "Select topic" : "Select subject first"} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {topics.map((t: any) => (
                                                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label>Difficulty</Label>
                                    <Select value={aiOptions.difficulty} onValueChange={(v) => setAiOptions({ ...aiOptions, difficulty: v })}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="easy">Easy</SelectItem>
                                            <SelectItem value="medium">Medium</SelectItem>
                                            <SelectItem value="hard">Hard</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label>Count</Label>
                                    <Input
                                        type="number"
                                        min={1}
                                        max={20}
                                        value={aiOptions.count}
                                        onChange={(e) => setAiOptions({ ...aiOptions, count: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <Label>Board / Curriculum (optional)</Label>
                                <Input
                                    value={aiOptions.board}
                                    onChange={(e) => setAiOptions({ ...aiOptions, board: e.target.value })}
                                    placeholder="e.g. CAIE, Pearson, IB"
                                />
                            </div>
                            <Button
                                onClick={() => {
                                    if (!aiOptions.subjectId) {
                                        toast({ title: "Missing subject", description: "Please select a subject from the curriculum", variant: "destructive" });
                                        return;
                                    }
                                    aiGenerateMutation.mutate({
                                        subject: aiOptions.subject,
                                        topic: aiOptions.topic,
                                        difficulty: aiOptions.difficulty,
                                        count: parseInt(aiOptions.count),
                                        board: aiOptions.board || undefined,
                                    });
                                }}
                                disabled={!aiOptions.subjectId || !aiOptions.topicId || aiGenerateMutation.isPending}
                                className="w-full"
                            >
                                {aiGenerateMutation.isPending ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <Wand2 className="h-4 w-4 mr-2" />
                                        Generate Questions
                                    </>
                                )}
                            </Button>
                        </div>
                    ) : (
                        /* Preview Generated Questions */
                        <div className="space-y-4">
                            <div className="text-sm text-muted-foreground">
                                {previewQuestions.length} question(s) generated. Review and save.
                            </div>
                            <div className="space-y-3 max-h-[400px] overflow-y-auto">
                                {previewQuestions.map((q, idx) => (
                                    <div key={idx} className="p-3 border rounded-lg space-y-2">
                                        <p className="text-sm font-medium">Q{idx + 1}. {q.questionText}</p>
                                        <div className="grid grid-cols-2 gap-1">
                                            {q.options.map((opt: any, oi: number) => (
                                                <div
                                                    key={oi}
                                                    className={`text-xs p-1.5 rounded ${oi === q.correctOptionIndex
                                                        ? "bg-green-500/10 text-green-700 font-medium"
                                                        : "bg-muted"
                                                        }`}
                                                >
                                                    {opt.label}. {opt.text}
                                                </div>
                                            ))}
                                        </div>
                                        {q.explanation && (
                                            <p className="text-xs text-muted-foreground">{q.explanation}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={() => setPreviewQuestions(null)} className="flex-1">
                                    Re-generate
                                </Button>
                                <Button
                                    onClick={() => saveGeneratedMutation.mutate(previewQuestions)}
                                    disabled={saveGeneratedMutation.isPending}
                                    className="flex-1"
                                >
                                    {saveGeneratedMutation.isPending ? (
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    ) : (
                                        <Save className="h-4 w-4 mr-2" />
                                    )}
                                    Save All ({previewQuestions.length})
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
