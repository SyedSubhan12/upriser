import { Link, useLocation } from "wouter";
import { Plus, Pencil, BarChart2, HelpCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import type { Quiz, Subject, QuizAttempt } from "@shared/schema";

export function QuizListPage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();

  const { data: quizzes = [], isLoading: isLoadingQuizzes } = useQuery<Quiz[]>({
    queryKey: ["/api/teacher/quizzes"],
    queryFn: async () => {
      const response = await fetch("/api/teacher/quizzes");
      if (!response.ok) throw new Error("Failed to fetch quizzes");
      return response.json();
    },
  });

  const { data: subjects = [] } = useQuery<Subject[]>({
    queryKey: ["/api/subjects"],
    queryFn: async () => {
      const response = await fetch("/api/subjects");
      if (!response.ok) throw new Error("Failed to fetch subjects");
      return response.json();
    },
  });

  const { data: allAttempts = [] } = useQuery<QuizAttempt[]>({
    queryKey: ["/api/quiz-attempts/all"],
    queryFn: async () => {
      return [];
    },
  });

  const myQuizzes = quizzes;

  const getAttemptsCount = (quizId: string) => {
    return allAttempts.filter((a) => a.quizId === quizId).length;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quizzes"
        description="Create and manage your quizzes"
        actions={
          <Link href="/teacher/quizzes/new">
            <Button data-testid="button-create-quiz">
              <Plus className="mr-2 h-4 w-4" />
              Create Quiz
            </Button>
          </Link>
        }
      />

      <Card data-testid="quizzes-table-card">
        <CardContent className="pt-6">
          {myQuizzes.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Created Date</TableHead>
                  <TableHead>Attempts</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {myQuizzes.map((quiz) => {
                  const subject = subjects.find(
                    (s: Subject) => s.id === quiz.subjectId
                  );
                  const attemptsCount = getAttemptsCount(quiz.id);
                  return (
                    <TableRow key={quiz.id} data-testid={`row-quiz-${quiz.id}`}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <HelpCircle className="h-4 w-4 text-muted-foreground" />
                          {quiz.title}
                        </div>
                      </TableCell>
                      <TableCell>{subject?.subjectName || "Unknown"}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {quiz.type === "practice" ? "Practice" : "Mock"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {quiz.isTimed ? `${quiz.duration} min` : "Untimed"}
                      </TableCell>
                      <TableCell>
                        {quiz.createdAt
                          ? new Date(quiz.createdAt).toLocaleDateString()
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{attemptsCount}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(`/teacher/quizzes/${quiz.id}`)}
                            data-testid={`button-edit-quiz-${quiz.id}`}
                          >
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              navigate(`/teacher/quizzes/${quiz.id}/results`)
                            }
                            data-testid={`button-view-results-${quiz.id}`}
                          >
                            <BarChart2 className="h-4 w-4" />
                            <span className="sr-only">View Results</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <HelpCircle className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">No quizzes yet</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Get started by creating your first quiz.
              </p>
              <Link href="/teacher/quizzes/new">
                <Button className="mt-4" data-testid="button-create-first-quiz">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Quiz
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
