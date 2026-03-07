import { useState, useEffect } from "react";
import { useParams, useLocation, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  CheckCircle,
  XCircle,
  Trophy,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/AuthContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { mockQuizzes, getQuestionsByQuiz } from "@/lib/mockData";
import type { Question, Quiz, QuizAttempt } from "@shared/schema";

interface QuizWithQuestions extends Quiz {
  questions: Question[];
}

interface QuizQuestionCardProps {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  selectedAnswer: string | null;
  onAnswerSelect: (answer: string) => void;
  showResult?: boolean;
}

function QuizQuestionCard({
  question,
  questionNumber,
  totalQuestions,
  selectedAnswer,
  onAnswerSelect,
  showResult,
}: QuizQuestionCardProps) {
  const isCorrect =
    showResult && selectedAnswer === question.correctOptionIndex.toString();
  const correctAnswer = question.correctOptionIndex.toString();

  return (
    <Card data-testid={`question-card-${question.id}`}>
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <Badge variant="outline">
            Question {questionNumber} of {totalQuestions}
          </Badge>
          <Badge variant="secondary">{question.marks} marks</Badge>
        </div>
        <CardTitle className="text-lg mt-4">{question.questionText}</CardTitle>
      </CardHeader>
      <CardContent>
        <RadioGroup
          value={selectedAnswer || ""}
          onValueChange={onAnswerSelect}
          disabled={showResult}
          className="space-y-3"
        >
          {question.options?.map((option, index) => {
            const isSelected = selectedAnswer === index.toString();
            const isOptionCorrect = index.toString() === correctAnswer;

            let optionClass = "";
            if (showResult) {
              if (isOptionCorrect) {
                optionClass =
                  "border-green-500 bg-green-50 dark:bg-green-950";
              } else if (isSelected && !isOptionCorrect) {
                optionClass = "border-red-500 bg-red-50 dark:bg-red-950";
              }
            }

            return (
              <div
                key={index}
                className={`flex items-center space-x-3 rounded-md border p-4 ${optionClass}`}
              >
                <RadioGroupItem
                  value={index.toString()}
                  id={`option-${question.id}-${index}`}
                  data-testid={`option-${question.id}-${index}`}
                />
                <Label
                  htmlFor={`option-${question.id}-${index}`}
                  className="flex-1 cursor-pointer"
                >
                  {option}
                </Label>
                {showResult && isOptionCorrect && (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                )}
                {showResult && isSelected && !isOptionCorrect && (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
              </div>
            );
          })}
        </RadioGroup>

        {showResult && question.explanation && (
          <div className="mt-4 p-4 rounded-md bg-muted">
            <p className="text-sm font-medium mb-1">Explanation:</p>
            <p className="text-sm text-muted-foreground">
              {question.explanation}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function QuizAttemptPage() {
  const params = useParams<{ quizId: string }>();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const quizId = params.quizId;

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [attemptId, setAttemptId] = useState<string | null>(null);

  const { data: quizData, isLoading: isLoadingQuiz } = useQuery<QuizWithQuestions>({
    queryKey: ["/api/quizzes", quizId],
    queryFn: async () => {
      const response = await fetch(`/api/quizzes/${quizId}`, { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch quiz");
      return response.json();
    },
    enabled: !!quizId,
  });

  const mockQuiz = mockQuizzes.find((q) => q.id === quizId);
  const mockQuestions = mockQuiz ? getQuestionsByQuiz(mockQuiz.id) : [];
  
  const quiz = quizData || (mockQuiz ? { ...mockQuiz, questions: mockQuestions } : null);
  const questions = quiz?.questions || [];

  useEffect(() => {
    if (quiz?.isTimed && quiz?.duration && !isSubmitted) {
      setTimeRemaining(quiz.duration * 60);
    }
  }, [quiz?.isTimed, quiz?.duration, isSubmitted]);

  const createAttemptMutation = useMutation({
    mutationFn: async (data: { quizId: string; userId: string }) => {
      const response = await apiRequest("POST", "/api/quiz-attempts", {
        ...data,
        answers: [],
        score: 0,
        totalMarks: 0,
        startedAt: new Date(),
      });
      return response.json();
    },
    onSuccess: (data: QuizAttempt) => {
      setAttemptId(data.id);
    },
  });

  const submitAttemptMutation = useMutation({
    mutationFn: async (data: { score: number; totalMarks: number; answers: string[] }) => {
      if (!attemptId) throw new Error("No attempt ID");
      const response = await apiRequest("PATCH", `/api/quiz-attempts/${attemptId}`, {
        ...data,
        completedAt: new Date(),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quiz-attempts"] });
    },
  });

  useEffect(() => {
    if (quiz && user && !attemptId && !isSubmitted) {
      createAttemptMutation.mutate({ quizId: quiz.id, userId: user.id });
    }
  }, [quiz, user, attemptId, isSubmitted]);

  useEffect(() => {
    if (!quiz?.isTimed || isSubmitted || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [quiz?.isTimed, isSubmitted, timeRemaining]);

  if (isLoadingQuiz) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-32 mt-2" />
          </div>
        </div>
        <Skeleton className="h-4 w-full" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-6 w-full mt-4" />
          </CardHeader>
          <CardContent className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!quiz || questions.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Quiz Not Found" />
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              The requested quiz could not be found or has no questions.
            </p>
            <Link href="/student/practice">
              <Button data-testid="button-back-to-practice">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Practice
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleAnswerSelect = (answer: string) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: answer,
    }));
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const calculateScore = () => {
    let score = 0;
    let totalMarks = 0;
    questions.forEach((q) => {
      totalMarks += q.marks;
      if (answers[q.id] === q.correctOptionIndex.toString()) {
        score += q.marks;
      }
    });
    return { score, totalMarks };
  };

  const handleSubmit = () => {
    const { score, totalMarks } = calculateScore();
    const answersArray = Object.entries(answers).map(([questionId, answer]) =>
      JSON.stringify({ questionId, answer }),
    );
    submitAttemptMutation.mutate({ score, totalMarks, answers: answersArray });
    setIsSubmitted(true);
    setCurrentQuestionIndex(0);
  };

  const { score, totalMarks } = calculateScore();
  const percentage = totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0;

  if (isSubmitted) {
    return (
      <div className="space-y-6">
        <PageHeader title="Quiz Results" />

        <Card data-testid="quiz-result-summary">
          <CardContent className="py-8 text-center">
            <Trophy className="h-16 w-16 mx-auto text-yellow-500 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Quiz Completed!</h2>
            <p className="text-muted-foreground mb-6">{quiz.title}</p>

            <div className="grid gap-4 sm:grid-cols-3 max-w-md mx-auto mb-6">
              <div className="text-center">
                <p className="text-3xl font-bold" data-testid="text-score">
                  {score}/{totalMarks}
                </p>
                <p className="text-sm text-muted-foreground">Score</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold" data-testid="text-percentage">
                  {percentage}%
                </p>
                <p className="text-sm text-muted-foreground">Percentage</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold" data-testid="text-answered">
                  {Object.keys(answers).length}/{questions.length}
                </p>
                <p className="text-sm text-muted-foreground">Answered</p>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/student/practice">
                <Button variant="outline" data-testid="button-back-to-practice">
                  Back to Practice
                </Button>
              </Link>
              <Link href="/student/practice/history">
                <Button data-testid="button-view-history">View History</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Review Answers</h3>
          {questions.map((question, index) => (
            <QuizQuestionCard
              key={question.id}
              question={question}
              questionNumber={index + 1}
              totalQuestions={questions.length}
              selectedAnswer={answers[question.id] || null}
              onAnswerSelect={() => {}}
              showResult
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-quiz-title">
            {quiz.title}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Question {currentQuestionIndex + 1} of {questions.length}
          </p>
        </div>
        {quiz.isTimed && (
          <Badge
            variant={timeRemaining < 60 ? "destructive" : "outline"}
            className="gap-2 text-lg px-4 py-2"
            data-testid="timer-badge"
          >
            <Clock className="h-4 w-4" />
            {formatTime(timeRemaining)}
          </Badge>
        )}
      </div>

      <Progress value={progress} data-testid="quiz-progress" />

      <QuizQuestionCard
        question={currentQuestion}
        questionNumber={currentQuestionIndex + 1}
        totalQuestions={questions.length}
        selectedAnswer={answers[currentQuestion.id] || null}
        onAnswerSelect={handleAnswerSelect}
      />

      <div className="flex items-center justify-between gap-4">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0}
          data-testid="button-previous"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>

        <div className="flex gap-3">
          {currentQuestionIndex < questions.length - 1 ? (
            <Button onClick={handleNext} data-testid="button-next">
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button 
              onClick={handleSubmit} 
              data-testid="button-submit-quiz"
              disabled={submitAttemptMutation.isPending}
            >
              {submitAttemptMutation.isPending ? "Submitting..." : "Submit Quiz"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
