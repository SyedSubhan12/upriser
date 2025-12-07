import { useParams, Link } from "wouter";
import { ArrowLeft, Users, TrendingUp, CheckCircle, Eye } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  mockQuizzes,
  mockQuizAttempts,
  mockUsers,
  mockSubjects,
} from "@/lib/mockData";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
}

function StatCard({ title, value, icon }: StatCardProps) {
  return (
    <Card data-testid={`stat-card-${title.toLowerCase().replace(/\s+/g, "-")}`}>
      <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

export function QuizResultsPage() {
  const { quizId } = useParams<{ quizId: string }>();

  const quiz = mockQuizzes.find((q) => q.id === quizId);
  const subject = quiz ? mockSubjects.find((s) => s.id === quiz.subjectId) : null;

  const attempts = mockQuizAttempts.filter((a) => a.quizId === quizId);

  const completedAttempts = attempts.filter((a) => a.completedAt);

  const totalAttempts = completedAttempts.length;

  const averageScore =
    totalAttempts > 0
      ? Math.round(
          (completedAttempts.reduce(
            (sum, a) => sum + ((a.score || 0) / (a.totalMarks || 1)) * 100,
            0
          ) /
            totalAttempts)
        )
      : 0;

  const passRate =
    totalAttempts > 0
      ? Math.round(
          (completedAttempts.filter(
            (a) => ((a.score || 0) / (a.totalMarks || 1)) * 100 >= 50
          ).length /
            totalAttempts) *
            100
        )
      : 0;

  if (!quiz) {
    return (
      <div className="space-y-6">
        <PageHeader title="Quiz Not Found" />
        <p className="text-muted-foreground">
          The quiz you're looking for doesn't exist.
        </p>
        <Link href="/teacher/quizzes">
          <Button variant="outline" data-testid="button-back-to-quizzes">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Quizzes
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quiz Results"
        description={`${quiz.title} - ${subject?.name || "Unknown Subject"}`}
        actions={
          <Link href="/teacher/quizzes">
            <Button variant="outline" data-testid="button-back-to-quizzes">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Quizzes
            </Button>
          </Link>
        }
      />

      <div className="grid gap-4 md:grid-cols-3" data-testid="quiz-stats-grid">
        <StatCard
          title="Total Attempts"
          value={totalAttempts}
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard
          title="Average Score"
          value={`${averageScore}%`}
          icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard
          title="Pass Rate"
          value={`${passRate}%`}
          icon={<CheckCircle className="h-4 w-4 text-muted-foreground" />}
        />
      </div>

      <Card data-testid="attempts-table-card">
        <CardHeader>
          <CardTitle>Student Attempts</CardTitle>
        </CardHeader>
        <CardContent>
          {completedAttempts.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {completedAttempts.map((attempt) => {
                  const student = mockUsers.find((u) => u.id === attempt.userId);
                  const scorePercent = Math.round(
                    ((attempt.score || 0) / (attempt.totalMarks || 1)) * 100
                  );
                  return (
                    <TableRow
                      key={attempt.id}
                      data-testid={`row-attempt-${attempt.id}`}
                    >
                      <TableCell className="font-medium">
                        {student?.name || "Unknown Student"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>
                            {attempt.score}/{attempt.totalMarks}
                          </span>
                          <Badge
                            variant={scorePercent >= 50 ? "default" : "destructive"}
                          >
                            {scorePercent}%
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        {attempt.duration ? `${attempt.duration} min` : "N/A"}
                      </TableCell>
                      <TableCell>
                        {attempt.completedAt
                          ? new Date(attempt.completedAt).toLocaleDateString()
                          : "N/A"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          data-testid={`button-view-attempt-${attempt.id}`}
                        >
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">View Details</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">No attempts yet</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                No students have completed this quiz yet.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
