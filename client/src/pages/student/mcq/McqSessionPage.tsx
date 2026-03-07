/**
 * MCQ Session Page — Active quiz session
 * 
 * Shows one question at a time with option selection,
 * immediate feedback with AI explanations, and
 * session completion with score summary.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import {
    CheckCircle2, XCircle, ChevronRight, ChevronLeft,
    Clock, Loader2, Trophy, Brain, ArrowLeft,
    Sparkles, Flag,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface McqOption {
    label: string;
    text: string;
}

interface SessionQuestion {
    id: string;
    questionText: string;
    options: McqOption[];
    difficulty: string;
    marks: number;
    tags: string[];
    bloomsLevel: string;
}

interface AnswerResult {
    isCorrect: boolean;
    correctOptionIndex: number;
    explanation: string;
    aiFeedback?: string;
}

interface SessionData {
    session: {
        id: string;
        mode: string;
        totalQuestions: number;
        answeredCount: number;
        correctCount: number;
        score?: number;
        completedAt?: string;
    };
    questions: SessionQuestion[];
    // Post-completion fields
    totalCorrect?: number;
    totalAnswered?: number;
    attempts?: any[];
}

const DIFFICULTY_COLORS: Record<string, string> = {
    easy: "bg-green-500/20 text-green-700 dark:text-green-400",
    medium: "bg-amber-500/20 text-amber-700 dark:text-amber-400",
    hard: "bg-red-500/20 text-red-700 dark:text-red-400",
};

export function McqSessionPage() {
    const { id } = useParams<{ id: string }>();
    const [, navigate] = useLocation();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const timerRef = useRef<number>(0);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [answerResult, setAnswerResult] = useState<AnswerResult | null>(null);
    const [isComplete, setIsComplete] = useState(false);
    const [answers, setAnswers] = useState<Map<string, AnswerResult>>(new Map());
    const [questionStartTime, setQuestionStartTime] = useState(Date.now());
    const [elapsed, setElapsed] = useState(0);

    // Load session data (questions come from the session start response, stored in query cache)
    const { data: sessionData } = useQuery<SessionData>({
        queryKey: ["/api/mcq/sessions", id],
        enabled: false, // We don't refetch — data is set by the practice page's mutation
    });

    // We store session data in local state since it's passed from navigation
    const [localSession, setLocalSession] = useState<SessionData | null>(null);

    // On mount, check if we have session data in the cache from the start mutation
    useEffect(() => {
        const cached = queryClient.getQueryData<SessionData>(["/api/mcq/sessions", id]);
        if (cached) {
            setLocalSession(cached);
        } else {
            // Fetch from API
            fetch(`/api/mcq/sessions/${id}`, { credentials: "include" })
                .then(r => r.json())
                .then(data => setLocalSession(data))
                .catch(() => navigate("/student/mcq/practice"));
        }
    }, [id]);

    // Timer
    useEffect(() => {
        intervalRef.current = setInterval(() => {
            setElapsed(prev => prev + 1);
        }, 1000);
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, []);

    const questions = localSession?.questions || [];
    const session = localSession?.session;
    const currentQuestion = questions[currentIndex];
    const progress = questions.length > 0 ? ((currentIndex + (answerResult ? 1 : 0)) / questions.length) * 100 : 0;

    // Track time per question
    useEffect(() => {
        setQuestionStartTime(Date.now());
    }, [currentIndex]);

    // Submit answer mutation
    const submitAnswer = useMutation({
        mutationFn: async (optionIndex: number) => {
            const timeSpentMs = Date.now() - questionStartTime;
            const res = await apiRequest("POST", `/api/mcq/sessions/${id}/answer`, {
                questionId: currentQuestion.id,
                selectedOptionIndex: optionIndex,
                timeSpentMs,
            });
            return res.json();
        },
        onSuccess: (data: AnswerResult) => {
            setAnswerResult(data);
            setAnswers(prev => new Map(prev).set(currentQuestion.id, data));
        },
        onError: (err: Error) => {
            toast({
                title: "Error submitting answer",
                description: err.message,
                variant: "destructive",
            });
        },
    });

    // Complete session mutation
    const completeSession = useMutation({
        mutationFn: async () => {
            const res = await apiRequest("POST", `/api/mcq/sessions/${id}/complete`);
            return res.json();
        },
        onSuccess: (data) => {
            setIsComplete(true);
            setLocalSession(prev => prev ? { ...prev, session: { ...prev.session, ...data.session, score: data.score } } : null);
            if (intervalRef.current) clearInterval(intervalRef.current);
        },
    });

    const handleSelectOption = (index: number) => {
        if (answerResult || submitAnswer.isPending) return;
        setSelectedOption(index);
    };

    const handleSubmitAnswer = () => {
        if (selectedOption === null) return;
        submitAnswer.mutate(selectedOption);
    };

    const handleNext = () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setSelectedOption(null);
            setAnswerResult(null);
        } else {
            completeSession.mutate();
        }
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, "0")}`;
    };

    // ========== COMPLETION SCREEN ==========
    if (isComplete && session) {
        const score = session.score ?? 0;
        const isGood = score >= 70;
        return (
            <div className="max-w-2xl mx-auto space-y-6">
                <Card className="text-center">
                    <CardContent className="py-12">
                        <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 ${isGood ? "bg-green-500/20" : "bg-amber-500/20"}`}>
                            <Trophy className={`h-10 w-10 ${isGood ? "text-green-500" : "text-amber-500"}`} />
                        </div>
                        <h2 className="text-2xl font-bold mb-2">
                            {isGood ? "Great Job!" : "Keep Practicing!"}
                        </h2>
                        <p className="text-muted-foreground mb-6">
                            You scored {score}% on this session
                        </p>

                        <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto mb-8">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-green-500">{session.correctCount}</div>
                                <div className="text-xs text-muted-foreground">Correct</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-red-500">{session.answeredCount - session.correctCount}</div>
                                <div className="text-xs text-muted-foreground">Incorrect</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold">{formatTime(elapsed)}</div>
                                <div className="text-xs text-muted-foreground">Time</div>
                            </div>
                        </div>

                        <div className="flex gap-3 justify-center">
                            <Button variant="outline" onClick={() => navigate("/student/mcq/practice")}>
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Practice
                            </Button>
                            <Button onClick={() => navigate("/student/mcq/stats")}>
                                <Brain className="h-4 w-4 mr-2" />
                                View Stats
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Review Answers */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Review Answers</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {questions.map((q, i) => {
                            const result = answers.get(q.id);
                            return (
                                <div key={q.id} className="flex items-start gap-3 p-3 rounded-lg border">
                                    <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                    ${result?.isCorrect ? "bg-green-500/20 text-green-600" : "bg-red-500/20 text-red-600"}`}>
                                        {i + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium line-clamp-2">{q.questionText}</p>
                                        {result && (
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {result.isCorrect ? "✓ Correct" : `✗ Answer: ${q.options[result.correctOptionIndex]?.label}`}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </CardContent>
                </Card>
            </div>
        );
    }

    // ========== LOADING STATE ==========
    if (!currentQuestion || !session) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    // ========== QUESTION VIEW ==========
    return (
        <div className="max-w-3xl mx-auto space-y-4">
            {/* Header Bar */}
            <div className="flex items-center justify-between">
                <Button variant="ghost" size="sm" onClick={() => navigate("/student/mcq/practice")}>
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Exit
                </Button>
                <div className="flex items-center gap-3">
                    <Badge variant="outline" className="gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTime(elapsed)}
                    </Badge>
                    <Badge variant="outline">
                        {currentIndex + 1} / {questions.length}
                    </Badge>
                </div>
            </div>

            {/* Progress Bar */}
            <Progress value={progress} className="h-2" />

            {/* Question Card */}
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center gap-2 mb-2">
                        <Badge className={DIFFICULTY_COLORS[currentQuestion.difficulty] || ""}>
                            {currentQuestion.difficulty}
                        </Badge>
                        {currentQuestion.marks > 1 && (
                            <Badge variant="outline">{currentQuestion.marks} marks</Badge>
                        )}
                    </div>
                    <CardTitle className="text-lg leading-relaxed">
                        {currentQuestion.questionText}
                    </CardTitle>
                </CardHeader>

                <CardContent className="space-y-3">
                    {/* Options */}
                    {currentQuestion.options.map((opt, i) => {
                        let optionStyle = "border hover:bg-accent/50 cursor-pointer";
                        if (selectedOption === i && !answerResult) {
                            optionStyle = "border-2 border-primary bg-primary/5";
                        }
                        if (answerResult) {
                            if (i === answerResult.correctOptionIndex) {
                                optionStyle = "border-2 border-green-500 bg-green-500/10";
                            } else if (selectedOption === i && !answerResult.isCorrect) {
                                optionStyle = "border-2 border-red-500 bg-red-500/10";
                            } else {
                                optionStyle = "border opacity-60";
                            }
                        }

                        return (
                            <button
                                key={i}
                                className={`w-full flex items-center gap-3 p-4 rounded-xl transition-all text-left ${optionStyle}`}
                                onClick={() => handleSelectOption(i)}
                                disabled={!!answerResult}
                            >
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-bold">
                                    {opt.label}
                                </div>
                                <span className="flex-1 text-sm">{opt.text}</span>
                                {answerResult && i === answerResult.correctOptionIndex && (
                                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                                )}
                                {answerResult && selectedOption === i && !answerResult.isCorrect && (
                                    <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                                )}
                            </button>
                        );
                    })}
                </CardContent>
            </Card>

            {/* Feedback */}
            {answerResult && (
                <Card className={answerResult.isCorrect ? "border-green-500/50" : "border-red-500/50"}>
                    <CardContent className="py-4">
                        <div className="flex items-start gap-3">
                            {answerResult.isCorrect ? (
                                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                            ) : (
                                <XCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                            )}
                            <div className="space-y-2">
                                <p className="text-sm font-medium">
                                    {answerResult.isCorrect ? "Correct!" : "Incorrect"}
                                </p>
                                {answerResult.explanation && (
                                    <p className="text-sm text-muted-foreground">{answerResult.explanation}</p>
                                )}
                                {answerResult.aiFeedback && (
                                    <div className="flex items-start gap-2 mt-2 p-2 rounded-lg bg-purple-500/5 border border-purple-500/20">
                                        <Sparkles className="h-4 w-4 text-purple-500 mt-0.5" />
                                        <p className="text-xs text-muted-foreground">{answerResult.aiFeedback}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Action Buttons */}
            <div className="flex justify-between">
                <Button
                    variant="outline"
                    disabled={currentIndex === 0}
                    onClick={() => {
                        setCurrentIndex(prev => prev - 1);
                        const prevResult = answers.get(questions[currentIndex - 1]?.id);
                        setAnswerResult(prevResult || null);
                        setSelectedOption(null);
                    }}
                >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                </Button>

                {!answerResult ? (
                    <Button
                        disabled={selectedOption === null || submitAnswer.isPending}
                        onClick={handleSubmitAnswer}
                    >
                        {submitAnswer.isPending ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                            <Flag className="h-4 w-4 mr-2" />
                        )}
                        Submit Answer
                    </Button>
                ) : (
                    <Button onClick={handleNext}>
                        {currentIndex < questions.length - 1 ? (
                            <>
                                Next
                                <ChevronRight className="h-4 w-4 ml-1" />
                            </>
                        ) : (
                            <>
                                <Trophy className="h-4 w-4 mr-2" />
                                Finish
                            </>
                        )}
                    </Button>
                )}
            </div>
        </div>
    );
}
