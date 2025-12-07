import { Link } from "wouter";
import { ArrowLeft, Clock, Eye, History } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
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
import { useAuth } from "@/context/AuthContext";
import { mockQuizAttempts, mockQuizzes, mockUsers } from "@/lib/mockData";

export function QuizHistoryPage() {
  const { user } = useAuth();
  const currentUser = user || mockUsers.find((u) => u.role === "student");

  const attempts = mockQuizAttempts
    .filter((a) => a.userId === currentUser?.id)
    .sort((a, b) => {
      const dateA = a.completedAt ? new Date(a.completedAt).getTime() : 0;
      const dateB = b.completedAt ? new Date(b.completedAt).getTime() : 0;
      return dateB - dateA;
    });

  const getQuizTitle = (quizId: string) => {
    const quiz = mockQuizzes.find((q) => q.id === quizId);
    return quiz?.title || "Unknown Quiz";
  };

  const getScoreBadgeVariant = (score: number | null, total: number | null) => {
    if (!score || !total) return "secondary";
    const percentage = (score / total) * 100;
    if (percentage >= 80) return "default";
    if (percentage >= 60) return "secondary";
    return "destructive";
  };

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return "-";
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/student/practice">
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <PageHeader
          title="Quiz History"
          description="Review your past quiz attempts"
        />
      </div>

      {attempts.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <Table data-testid="quiz-history-table">
              <TableHeader>
                <TableRow>
                  <TableHead>Quiz Title</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attempts.map((attempt) => (
                  <TableRow
                    key={attempt.id}
                    data-testid={`attempt-row-${attempt.id}`}
                  >
                    <TableCell className="font-medium">
                      {getQuizTitle(attempt.quizId)}
                    </TableCell>
                    <TableCell>
                      {attempt.completedAt
                        ? new Date(attempt.completedAt).toLocaleDateString()
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={getScoreBadgeVariant(
                          attempt.score,
                          attempt.totalMarks
                        )}
                        data-testid={`score-badge-${attempt.id}`}
                      >
                        {attempt.score}/{attempt.totalMarks}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatDuration(attempt.duration)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        data-testid={`button-view-details-${attempt.id}`}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              You haven't attempted any quizzes yet.
            </p>
            <Link href="/student/practice">
              <Button data-testid="button-start-practice">
                Start Practicing
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
