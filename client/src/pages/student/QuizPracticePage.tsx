import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { GraduationCap, Clock, Play, Filter } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  mockSubjects,
  mockTopics,
  mockQuizzes,
  getTopicsBySubject,
} from "@/lib/mockData";
import type { Quiz, Subject, Topic } from "@shared/schema";

interface QuizCardProps {
  quiz: Quiz;
  subjects: Subject[];
  topics: Topic[];
}

function QuizCard({ quiz, subjects, topics }: QuizCardProps) {
  const subject = subjects.find((s) => s.id === quiz.subjectId);
  const topic = quiz.topicId
    ? topics.find((t) => t.id === quiz.topicId)
    : null;

  return (
    <Card className="hover-elevate" data-testid={`quiz-card-${quiz.id}`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <Badge variant={quiz.type === "mock" ? "default" : "secondary"}>
            {quiz.type === "mock" ? "Mock Test" : "Practice"}
          </Badge>
          {quiz.isTimed && (
            <Badge variant="outline" className="gap-1">
              <Clock className="h-3 w-3" />
              {quiz.duration} min
            </Badge>
          )}
        </div>
        <CardTitle className="text-base mt-2">{quiz.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
          {subject && <span>{subject.subjectName}</span>}
          {topic && (
            <>
              <span>/</span>
              <span>{topic.name}</span>
            </>
          )}
        </div>
        {quiz.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {quiz.description}
          </p>
        )}
        <Link href={`/student/practice/quiz/${quiz.id}`}>
          <Button className="w-full" data-testid={`button-start-quiz-${quiz.id}`}>
            <Play className="h-4 w-4 mr-2" />
            Start Quiz
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

export function QuizPracticePage() {
  const [subjectFilter, setSubjectFilter] = useState<string>("all");
  const [topicFilter, setTopicFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [timedOnly, setTimedOnly] = useState(false);
  const [questionCount, setQuestionCount] = useState([10]);

  const { data: subjects = [], isLoading: isLoadingSubjects } = useQuery<Subject[]>({
    queryKey: ["/api/subjects"],
    queryFn: async () => {
      const response = await fetch("/api/subjects", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch subjects");
      return response.json();
    },
  });

  const { data: topics = [] } = useQuery<Topic[]>({
    queryKey: ["/api/topics", { subjectId: subjectFilter }],
    queryFn: async () => {
      if (subjectFilter === "all") return [];
      const response = await fetch(`/api/topics?subjectId=${subjectFilter}`, { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch topics");
      return response.json();
    },
    enabled: subjectFilter !== "all",
  });

  const buildQuizzesUrl = () => {
    const params = new URLSearchParams();
    if (subjectFilter !== "all") params.append("subjectId", subjectFilter);
    if (topicFilter !== "all") params.append("topicId", topicFilter);
    if (typeFilter !== "all") params.append("type", typeFilter);
    return `/api/quizzes?${params.toString()}`;
  };

  const { data: quizzes = [], isLoading: isLoadingQuizzes } = useQuery<Quiz[]>({
    queryKey: ["/api/quizzes", subjectFilter, topicFilter, typeFilter],
    queryFn: async () => {
      const response = await fetch(buildQuizzesUrl(), { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch quizzes");
      return response.json();
    },
  });

  const subjectsData = subjects.length > 0 ? subjects : mockSubjects;
  const topicsData = topics.length > 0 ? topics : (subjectFilter !== "all" ? getTopicsBySubject(subjectFilter) : mockTopics);
  const quizzesData = quizzes.length > 0 ? quizzes : mockQuizzes;

  const filteredQuizzes = quizzesData.filter((quiz) => {
    if (subjectFilter !== "all" && quiz.subjectId !== subjectFilter) return false;
    if (topicFilter !== "all" && quiz.topicId !== topicFilter) return false;
    if (typeFilter !== "all" && quiz.type !== typeFilter) return false;
    if (timedOnly && !quiz.isTimed) return false;
    return quiz.isActive;
  });

  const handleSubjectChange = (value: string) => {
    setSubjectFilter(value);
    setTopicFilter("all");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Practice"
        description="Test your knowledge with quizzes and mock tests"
        actions={
          <Link href="/student/practice/history">
            <Button variant="outline" data-testid="button-view-history">
              View History
            </Button>
          </Link>
        }
      />

      <Card data-testid="quiz-filters">
        <CardContent className="py-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filters</span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="subject-filter">Subject</Label>
                <Select value={subjectFilter} onValueChange={handleSubjectChange}>
                  <SelectTrigger id="subject-filter" data-testid="filter-subject">
                    <SelectValue placeholder="All Subjects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Subjects</SelectItem>
                    {subjectsData.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {subject.subjectName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="topic-filter">Topic</Label>
                <Select
                  value={topicFilter}
                  onValueChange={setTopicFilter}
                  disabled={subjectFilter === "all"}
                >
                  <SelectTrigger id="topic-filter" data-testid="filter-topic">
                    <SelectValue placeholder="All Topics" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Topics</SelectItem>
                    {topicsData.map((topic) => (
                      <SelectItem key={topic.id} value={topic.id}>
                        {topic.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="type-filter">Quiz Type</Label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger id="type-filter" data-testid="filter-type">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="practice">Practice</SelectItem>
                    <SelectItem value="mock">Mock Test</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Timed Quizzes Only</Label>
                <div className="flex items-center gap-2 h-9">
                  <Switch
                    checked={timedOnly}
                    onCheckedChange={setTimedOnly}
                    data-testid="switch-timed-only"
                  />
                  <span className="text-sm text-muted-foreground">
                    {timedOnly ? "Yes" : "No"}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2 max-w-sm">
              <Label>Questions per Quiz: {questionCount[0]}</Label>
              <Slider
                value={questionCount}
                onValueChange={setQuestionCount}
                min={5}
                max={50}
                step={5}
                data-testid="slider-question-count"
              />
              <p className="text-xs text-muted-foreground">
                Preference for quiz length (when available)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoadingQuizzes ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" data-testid="quizzes-grid">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="hover-elevate">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-6 w-16" />
                </div>
                <Skeleton className="h-5 w-full mt-2" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredQuizzes.length > 0 ? (
        <div
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          data-testid="quizzes-grid"
        >
          {filteredQuizzes.map((quiz) => (
            <QuizCard key={quiz.id} quiz={quiz} subjects={subjectsData} topics={topicsData} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              No quizzes found matching your filters.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
