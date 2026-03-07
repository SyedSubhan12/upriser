/**
 * MCQ Practice Page — Start a new MCQ practice session
 * 
 * Students select subject, topic, difficulty, and mode
 * to begin a personalized MCQ practice session.
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
    Brain, Play, Zap, Clock, Target, Sparkles,
    BookOpen, TrendingUp, ChevronRight, Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
    Select, SelectContent, SelectItem,
    SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/layout/PageHeader";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface McqMeta {
    totalQuestions: number;
    aiAvailable: boolean;
}

interface Recommendation {
    type: string;
    topicId: string;
    topicName: string;
    message: string;
    suggestedDifficulty: string;
    suggestedQuestionCount: number;
    priority: number;
}

const MODE_INFO = {
    practice: {
        icon: BookOpen,
        label: "Practice",
        description: "Untimed, learn at your own pace",
        color: "text-blue-500",
        bg: "bg-blue-500/10",
    },
    timed: {
        icon: Clock,
        label: "Timed",
        description: "Race against the clock",
        color: "text-amber-500",
        bg: "bg-amber-500/10",
    },
    adaptive: {
        icon: Zap,
        label: "Adaptive",
        description: "AI picks difficulty based on your level",
        color: "text-purple-500",
        bg: "bg-purple-500/10",
    },
    exam: {
        icon: Target,
        label: "Exam Mode",
        description: "Simulate real exam conditions",
        color: "text-red-500",
        bg: "bg-red-500/10",
    },
} as const;

const DIFFICULTY_COLORS = {
    easy: "bg-green-500/20 text-green-700 dark:text-green-400",
    medium: "bg-amber-500/20 text-amber-700 dark:text-amber-400",
    hard: "bg-red-500/20 text-red-700 dark:text-red-400",
};

export function McqPracticePage() {
    const [, navigate] = useLocation();
    const { toast } = useToast();
    const [boardId, setBoardId] = useState<string>("");
    const [qualId, setQualId] = useState<string>("");
    const [branchId, setBranchId] = useState<string>("");
    const [subjectId, setSubjectId] = useState<string>("");
    const [topicId, setTopicId] = useState<string>("");
    const [mode, setMode] = useState<keyof typeof MODE_INFO>("practice");
    const [difficulty, setDifficulty] = useState<string>("medium");
    const [questionCount, setQuestionCount] = useState([10]);
    const [year, setYear] = useState<string>("");
    const [session, setSession] = useState<string>("");
    const [paper, setPaper] = useState<string>("");
    const [variant, setVariant] = useState<string>("");

    // Fetch boards
    const { data: boards = [] } = useQuery<any[]>({
        queryKey: ["/api/curriculum/boards"],
    });

    // Fetch qualifications for selected board
    const { data: qualifications = [] } = useQuery<any[]>({
        queryKey: ["/api/curriculum/qualifications", { boardId: boardId || undefined }],
        enabled: !!boardId,
    });

    // Fetch branches for selected qualification
    const { data: branches = [] } = useQuery<any[]>({
        queryKey: ["/api/curriculum/branches", { qualId: qualId || undefined }],
        enabled: !!qualId,
    });

    // Fetch subjects
    const { data: subjects = [] } = useQuery<any[]>({
        queryKey: ["/api/subjects", { boardId: boardId || undefined, qualId: qualId || undefined, branchId: branchId || undefined }],
    });

    // Fetch topics for selected subject
    const { data: topics = [] } = useQuery<any[]>({
        queryKey: ["/api/topics", { subjectId }],
        enabled: !!subjectId,
    });

    // Fetch MCQ metadata
    const { data: meta } = useQuery<McqMeta>({
        queryKey: ["/api/mcq/meta", { subjectId: subjectId || undefined }],
        enabled: true,
    });

    // Fetch SIE recommendations
    const { data: recommendations = [] } = useQuery<Recommendation[]>({
        queryKey: ["/api/mcq/recommendations", { subjectId }],
        enabled: !!subjectId,
    });

    // Start session mutation
    const startSession = useMutation({
        mutationFn: async () => {
            const body: any = {
                subjectId,
                mode,
                questionCount: questionCount[0],
            };
            if (topicId) body.topicId = topicId;
            if (mode !== "adaptive") body.difficulty = difficulty;
            if (year) body.year = parseInt(year);
            if (session) body.session = session;
            if (paper) body.paper = parseInt(paper);
            if (variant) body.variant = parseInt(variant);
            if (qualId) body.qualId = qualId;
            if (branchId) body.branchId = branchId;

            const res = await apiRequest("POST", "/api/mcq/sessions/start", body);
            return res.json();
        },
        onSuccess: (data) => {
            navigate(`/student/mcq/session/${data.session.id}`);
        },
        onError: (err: Error) => {
            toast({
                title: "Could not start session",
                description: err.message,
                variant: "destructive",
            });
        },
    });

    return (
        <div className="space-y-6">
            <PageHeader
                title="MCQ Practice"
                description="Sharpen your knowledge with AI-powered MCQ practice"
                actions={
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => navigate("/student/mcq/stats")}
                        >
                            <TrendingUp className="h-4 w-4 mr-2" />
                            My Stats
                        </Button>
                    </div>
                }
            />

            {/* Quick Stats Banner */}
            <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
                <Card>
                    <CardContent className="py-4 text-center">
                        <BookOpen className="h-5 w-5 mx-auto mb-1 text-blue-500" />
                        <div className="text-2xl font-bold">{meta?.totalQuestions ?? "—"}</div>
                        <div className="text-xs text-muted-foreground">Questions Available</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="py-4 text-center">
                        <Sparkles className="h-5 w-5 mx-auto mb-1 text-purple-500" />
                        <div className="text-2xl font-bold">{meta?.aiAvailable ? "✓" : "✗"}</div>
                        <div className="text-xs text-muted-foreground">AI Powered</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="py-4 text-center">
                        <Target className="h-5 w-5 mx-auto mb-1 text-green-500" />
                        <div className="text-2xl font-bold">{subjects.length}</div>
                        <div className="text-xs text-muted-foreground">Subjects</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="py-4 text-center">
                        <Brain className="h-5 w-5 mx-auto mb-1 text-amber-500" />
                        <div className="text-2xl font-bold">{recommendations.length || "—"}</div>
                        <div className="text-xs text-muted-foreground">Recommendations</div>
                    </CardContent>
                </Card>
            </div>

            {/* SIE Recommendations */}
            {recommendations.length > 0 && (
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-purple-500" />
                            Recommended For You
                        </CardTitle>
                        <CardDescription>Based on your performance and study patterns</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {recommendations.slice(0, 3).map((rec, i) => (
                                <button
                                    key={i}
                                    className="w-full flex items-center gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors text-left"
                                    onClick={() => {
                                        setTopicId(rec.topicId);
                                        setDifficulty(rec.suggestedDifficulty);
                                        setQuestionCount([rec.suggestedQuestionCount]);
                                    }}
                                >
                                    <div className="flex-1">
                                        <div className="text-sm font-medium">{rec.topicName}</div>
                                        <div className="text-xs text-muted-foreground">{rec.message}</div>
                                    </div>
                                    <Badge className={DIFFICULTY_COLORS[rec.suggestedDifficulty as keyof typeof DIFFICULTY_COLORS]}>
                                        {rec.suggestedDifficulty}
                                    </Badge>
                                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                </button>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Session Configuration */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Subject & Topic Selection */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Subject & Topic</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Board</Label>
                            <Select
                                value={boardId || "__all__"}
                                onValueChange={(v) => {
                                    const nextBoardId = v === "__all__" ? "" : v;
                                    setBoardId(nextBoardId);
                                    setQualId("");
                                    setBranchId("");
                                    setSubjectId("");
                                    setTopicId("");
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select board" />
                                </SelectTrigger>
                                <SelectContent>
                                    {boards.map((b: any) => (
                                        <SelectItem key={b.id} value={b.id}>{b.displayName || b.fullName || b.boardKey}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Level / Qualification</Label>
                            <Select
                                value={qualId || "__all__"}
                                onValueChange={(v) => {
                                    setQualId(v === "__all__" ? "" : v);
                                    setBranchId("");
                                    setSubjectId("");
                                    setTopicId("");
                                }}
                                disabled={!boardId}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={boardId ? "Select level" : "Select a board first"} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__all__">All Levels</SelectItem>
                                    {qualifications.map((q: any) => (
                                        <SelectItem key={q.id} value={q.id}>{q.displayName}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {branches.length > 0 && (
                            <div className="space-y-2">
                                <Label>Curriculum / Branch</Label>
                                <Select
                                    value={branchId || "__all__"}
                                    onValueChange={(v) => {
                                        setBranchId(v === "__all__" ? "" : v);
                                        setSubjectId("");
                                        setTopicId("");
                                    }}
                                    disabled={!qualId}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={qualId ? "Select branch" : "Select a level first"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__all__">All Branches</SelectItem>
                                        {branches.map((b: any) => (
                                            <SelectItem key={b.id} value={b.id}>{b.displayName}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label>Subject</Label>
                            <Select value={subjectId} onValueChange={(v) => { setSubjectId(v); setTopicId(""); }}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a subject" />
                                </SelectTrigger>
                                <SelectContent>
                                    {subjects.map((s: any) => (
                                        <SelectItem key={s.id} value={s.id}>{s.subjectName}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Topic (optional)</Label>
                            <Select
                                value={topicId || "__all__"}
                                onValueChange={(v) => setTopicId(v === "__all__" ? "" : v)}
                                disabled={!subjectId}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="All topics" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__all__">All Topics</SelectItem>
                                    {topics.map((t: any) => (
                                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Past Paper Filters - Visible if Board/Subject selected */}
                        <div className="pt-4 border-t space-y-4">
                            <h3 className="text-sm font-semibold flex items-center gap-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                Past Paper Filters (Optional)
                            </h3>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <Label className="text-xs">Year</Label>
                                    <Select value={year || "__all__"} onValueChange={(v) => setYear(v === "__all__" ? "" : v)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Year" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="__all__">All</SelectItem>
                                            {Array.from({ length: 15 }, (_, i) => 2024 - i).map(y => (
                                                <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs">Session</Label>
                                    <Select value={session || "__all__"} onValueChange={(v) => setSession(v === "__all__" ? "" : v)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Session" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="__all__">All</SelectItem>
                                            <SelectItem value="May/June">May/June</SelectItem>
                                            <SelectItem value="Oct/Nov">Oct/Nov</SelectItem>
                                            <SelectItem value="Feb/March">Feb/March</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs">Paper</Label>
                                    <Select value={paper || "__all__"} onValueChange={(v) => setPaper(v === "__all__" ? "" : v)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Paper" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="__all__">All</SelectItem>
                                            <SelectItem value="1">Paper 1</SelectItem>
                                            <SelectItem value="2">Paper 2</SelectItem>
                                            <SelectItem value="3">Paper 3</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs">Variant</Label>
                                    <Select value={variant || "__all__"} onValueChange={(v) => setVariant(v === "__all__" ? "" : v)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Variant" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="__all__">All</SelectItem>
                                            <SelectItem value="1">1</SelectItem>
                                            <SelectItem value="2">2</SelectItem>
                                            <SelectItem value="3">3</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Difficulty</Label>
                            <div className="flex gap-2">
                                {(["easy", "medium", "hard"] as const).map((d) => (
                                    <Button
                                        key={d}
                                        variant={difficulty === d ? "default" : "outline"}
                                        size="sm"
                                        className="flex-1 capitalize"
                                        onClick={() => setDifficulty(d)}
                                        disabled={mode === "adaptive"}
                                    >
                                        {d}
                                    </Button>
                                ))}
                            </div>
                            {mode === "adaptive" && (
                                <p className="text-xs text-muted-foreground">
                                    Adaptive mode selects difficulty automatically
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label>Questions: {questionCount[0]}</Label>
                            <Slider
                                value={questionCount}
                                onValueChange={setQuestionCount}
                                min={5}
                                max={50}
                                step={5}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Mode Selection */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Practice Mode</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-3 grid-cols-2">
                            {(Object.entries(MODE_INFO) as [keyof typeof MODE_INFO, typeof MODE_INFO[keyof typeof MODE_INFO]][]).map(
                                ([key, info]) => {
                                    const Icon = info.icon;
                                    return (
                                        <button
                                            key={key}
                                            className={`p-4 rounded-xl border-2 transition-all text-left
                        ${mode === key
                                                    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                                                    : "border-transparent bg-muted/50 hover:bg-muted"
                                                }`}
                                            onClick={() => setMode(key)}
                                        >
                                            <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg ${info.bg} mb-2`}>
                                                <Icon className={`h-5 w-5 ${info.color}`} />
                                            </div>
                                            <div className="font-medium text-sm">{info.label}</div>
                                            <div className="text-xs text-muted-foreground mt-0.5">
                                                {info.description}
                                            </div>
                                        </button>
                                    );
                                },
                            )}
                        </div>

                        {/* Start Button */}
                        <Button
                            className="w-full mt-6 h-12 text-base"
                            disabled={!subjectId || startSession.isPending}
                            onClick={() => startSession.mutate()}
                        >
                            {startSession.isPending ? (
                                <>
                                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                    Starting...
                                </>
                            ) : (
                                <>
                                    <Play className="h-5 w-5 mr-2" />
                                    Start Practice
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
