/**
 * MCQ Stats Page — Student Intelligence Engine Dashboard
 * 
 * Displays topic mastery breakdown, performance analytics,
 * strengths/weaknesses, and study recommendations.
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
    Brain, TrendingUp, Target, Flame, BookOpen,
    BarChart3, Zap, ArrowLeft, Star, AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import {
    Select, SelectContent, SelectItem,
    SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/layout/PageHeader";

interface PerformanceSnapshot {
    overallMastery: number;
    totalQuestionsAnswered: number;
    totalCorrect: number;
    overallAccuracy: number;
    topicBreakdown: TopicBreakdown[];
    strengths: string[];
    weaknesses: string[];
    studyStreak: number;
    recommendedFocus: string[];
}

interface TopicBreakdown {
    topicId: string;
    topicName?: string;
    mastery: number;
    level: string;
    accuracy: number;
    totalAttempted: number;
    avgTimeMs: number | null;
    streak: number;
    confidenceLevel: string;
}

const MASTERY_COLORS: Record<string, { bg: string; text: string; bar: string }> = {
    Mastered: { bg: "bg-blue-500/10", text: "text-blue-600 dark:text-blue-400", bar: "bg-blue-500" },
    Advanced: { bg: "bg-green-500/10", text: "text-green-600 dark:text-green-400", bar: "bg-green-500" },
    Proficient: { bg: "bg-yellow-500/10", text: "text-yellow-600 dark:text-yellow-400", bar: "bg-yellow-500" },
    Developing: { bg: "bg-orange-500/10", text: "text-orange-600 dark:text-orange-400", bar: "bg-orange-500" },
    Beginner: { bg: "bg-red-500/10", text: "text-red-600 dark:text-red-400", bar: "bg-red-500" },
};

export function McqStatsPage() {
    const [, navigate] = useLocation();
    const [subjectId, setSubjectId] = useState<string>("");

    const { data: subjects = [] } = useQuery<any[]>({
        queryKey: ["/api/subjects"],
    });

    // Overall stats
    const { data: overallStats } = useQuery<PerformanceSnapshot>({
        queryKey: ["/api/mcq/stats"],
    });

    // Per-subject stats
    const { data: subjectStats } = useQuery<PerformanceSnapshot & { weakTopics: any[] }>({
        queryKey: [`/api/mcq/stats/subject/${subjectId}`],
        enabled: !!subjectId,
    });

    // Sessions history
    const { data: sessions = [] } = useQuery<any[]>({
        queryKey: ["/api/mcq/sessions"],
    });

    const stats = subjectId ? subjectStats : overallStats;

    return (
        <div className="space-y-6">
            <PageHeader
                title="Performance Dashboard"
                description="Track your mastery and find areas to improve"
                actions={
                    <Button onClick={() => navigate("/student/mcq/practice")}>
                        <BookOpen className="h-4 w-4 mr-2" />
                        Practice
                    </Button>
                }
            />

            {/* Subject Filter */}
            <div className="max-w-xs">
                <Label className="text-xs mb-1 block">Filter by Subject</Label>
                <Select
                    value={subjectId || "__all__"}
                    onValueChange={(v) => setSubjectId(v === "__all__" ? "" : v)}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="All subjects" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="__all__">All Subjects</SelectItem>
                        {subjects.map((s: any) => (
                            <SelectItem key={s.id} value={s.id}>{s.subjectName}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Key Metrics */}
            <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
                <Card>
                    <CardContent className="py-4 text-center">
                        <Brain className="h-6 w-6 mx-auto mb-2 text-purple-500" />
                        <div className="text-3xl font-bold">{stats?.overallMastery ?? 0}%</div>
                        <div className="text-xs text-muted-foreground mt-1">Overall Mastery</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="py-4 text-center">
                        <Target className="h-6 w-6 mx-auto mb-2 text-green-500" />
                        <div className="text-3xl font-bold">{stats?.overallAccuracy ?? 0}%</div>
                        <div className="text-xs text-muted-foreground mt-1">Accuracy</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="py-4 text-center">
                        <BarChart3 className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                        <div className="text-3xl font-bold">{stats?.totalQuestionsAnswered ?? 0}</div>
                        <div className="text-xs text-muted-foreground mt-1">Questions Answered</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="py-4 text-center">
                        <Flame className="h-6 w-6 mx-auto mb-2 text-amber-500" />
                        <div className="text-3xl font-bold">{stats?.studyStreak ?? 0}</div>
                        <div className="text-xs text-muted-foreground mt-1">Day Streak</div>
                    </CardContent>
                </Card>
            </div>

            {/* Mastery Overview Bar */}
            {stats && stats.overallMastery > 0 && (
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base">Mastery Overview</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Overall Mastery</span>
                                <span className="font-medium">{stats.overallMastery}%</span>
                            </div>
                            <div className="h-4 rounded-full bg-muted overflow-hidden">
                                <div
                                    className="h-full rounded-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-1000"
                                    style={{ width: `${stats.overallMastery}%` }}
                                />
                            </div>
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Beginner</span>
                                <span>Developing</span>
                                <span>Proficient</span>
                                <span>Advanced</span>
                                <span>Mastered</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Strengths & Weaknesses */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Star className="h-4 w-4 text-amber-500" />
                            Strengths
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {stats?.strengths && stats.strengths.length > 0 ? (
                            <div className="space-y-2">
                                {stats.topicBreakdown
                                    .filter(t => stats.strengths.includes(t.topicId))
                                    .map(t => (
                                        <div key={t.topicId} className="flex items-center justify-between p-2 rounded-lg bg-green-500/5">
                                            <span className="text-sm">{t.topicName || t.topicId}</span>
                                            <Badge className={MASTERY_COLORS[t.level]?.bg + " " + MASTERY_COLORS[t.level]?.text}>
                                                {t.mastery}%
                                            </Badge>
                                        </div>
                                    ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                Complete more practice sessions to identify your strengths
                            </p>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                            Areas to Improve
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {stats?.weaknesses && stats.weaknesses.length > 0 ? (
                            <div className="space-y-2">
                                {stats.topicBreakdown
                                    .filter(t => stats.weaknesses.includes(t.topicId))
                                    .map(t => (
                                        <div key={t.topicId} className="flex items-center justify-between p-2 rounded-lg bg-red-500/5">
                                            <span className="text-sm">{t.topicName || t.topicId}</span>
                                            <Badge className={MASTERY_COLORS[t.level]?.bg + " " + MASTERY_COLORS[t.level]?.text}>
                                                {t.mastery}%
                                            </Badge>
                                        </div>
                                    ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                No weak areas identified yet — keep practicing!
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Topic Breakdown Table */}
            {stats?.topicBreakdown && stats.topicBreakdown.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Topic Breakdown</CardTitle>
                        <CardDescription>Detailed mastery per topic</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {stats.topicBreakdown.map(topic => {
                                const colors = MASTERY_COLORS[topic.level] || MASTERY_COLORS.Beginner;
                                return (
                                    <div key={topic.topicId} className="space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium">{topic.topicName || topic.topicId}</span>
                                                <Badge variant="outline" className="text-xs">{topic.level}</Badge>
                                            </div>
                                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                <span>{topic.accuracy}% accuracy</span>
                                                <span>{topic.totalAttempted} Qs</span>
                                                {topic.streak > 0 && (
                                                    <span className="flex items-center gap-0.5">
                                                        <Flame className="h-3 w-3 text-amber-500" />
                                                        {topic.streak}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${colors.bar} transition-all duration-500`}
                                                style={{ width: `${topic.mastery}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Recent Sessions */}
            {sessions.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Recent Sessions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {sessions.slice(0, 10).map((s: any) => (
                                <div key={s.id} className="flex items-center justify-between p-3 rounded-lg border">
                                    <div>
                                        <div className="text-sm font-medium capitalize">{s.mode} session</div>
                                        <div className="text-xs text-muted-foreground">
                                            {s.answeredCount}/{s.totalQuestions} questions •{" "}
                                            {new Date(s.startedAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {s.score !== null && s.score !== undefined && (
                                            <Badge
                                                className={
                                                    s.score >= 70
                                                        ? "bg-green-500/20 text-green-700"
                                                        : s.score >= 40
                                                            ? "bg-amber-500/20 text-amber-700"
                                                            : "bg-red-500/20 text-red-700"
                                                }
                                            >
                                                {s.score}%
                                            </Badge>
                                        )}
                                        {!s.completedAt && (
                                            <Badge variant="outline">In Progress</Badge>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Empty State */}
            {(!stats || stats.totalQuestionsAnswered === 0) && (
                <Card>
                    <CardContent className="py-12 text-center">
                        <Brain className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium mb-2">No data yet</h3>
                        <p className="text-muted-foreground mb-4">
                            Complete some practice sessions to see your performance analytics
                        </p>
                        <Button onClick={() => navigate("/student/mcq/practice")}>
                            <Zap className="h-4 w-4 mr-2" />
                            Start Practicing
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
