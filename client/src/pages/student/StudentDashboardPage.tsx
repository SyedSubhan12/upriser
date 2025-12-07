import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  ClipboardCheck,
  TrendingUp,
  BookOpen,
  Clock,
  ArrowRight,
  FileText,
  GraduationCap,
  ClipboardList,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/AuthContext";
import {
  mockQuizAttempts,
  mockQuizzes,
  mockMaterials,
  mockAssignments,
  mockUsers,
} from "@/lib/mockData";
import type { QuizAttempt, Assignment, Quiz } from "@shared/schema";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  isLoading?: boolean;
}

function StatCard({ title, value, icon, description, isLoading }: StatCardProps) {
  return (
    <Card data-testid={`stat-card-${title.toLowerCase().replace(/\s+/g, "-")}`}>
      <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-16" />
        ) : (
          <div className="text-2xl font-bold" data-testid={`stat-value-${title.toLowerCase().replace(/\s+/g, "-")}`}>
            {value}
          </div>
        )}
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

type ActivityItem = {
  id: string;
  type: "quiz" | "material";
  title: string;
  date: Date;
  meta: string;
};

export function StudentDashboardPage() {
  const { user } = useAuth();
  const currentUser = user || mockUsers.find((u) => u.role === "student");

  const { data: quizAttempts = [], isLoading: isLoadingAttempts } = useQuery<QuizAttempt[]>({
    queryKey: ["/api/quiz-attempts", { userId: currentUser?.id }],
    queryFn: async () => {
      if (!currentUser?.id) return [];
      const response = await fetch(`/api/quiz-attempts?userId=${currentUser.id}`, { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch quiz attempts");
      return response.json();
    },
    enabled: !!currentUser?.id,
  });

  const { data: assignments = [], isLoading: isLoadingAssignments } = useQuery<Assignment[]>({
    queryKey: ["/api/assignments"],
    queryFn: async () => {
      const response = await fetch("/api/assignments", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch assignments");
      return response.json();
    },
  });

  const { data: quizzes = [] } = useQuery<Quiz[]>({
    queryKey: ["/api/quizzes"],
    queryFn: async () => {
      const response = await fetch("/api/quizzes", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch quizzes");
      return response.json();
    },
  });

  const attemptsData = quizAttempts.length > 0 ? quizAttempts : mockQuizAttempts.filter((a) => a.userId === currentUser?.id);
  const assignmentsData = assignments.length > 0 ? assignments : mockAssignments;
  const quizzesData = quizzes.length > 0 ? quizzes : mockQuizzes;

  const totalAttempts = attemptsData.length;

  const averageScore =
    totalAttempts > 0
      ? Math.round(
          (attemptsData.reduce((sum, a) => sum + (a.score || 0), 0) /
            attemptsData.reduce((sum, a) => sum + (a.totalMarks || 1), 0)) *
            100
        )
      : 0;

  const activeSubjects = currentUser?.subjectIds?.length || 0;

  const pendingAssignments = assignmentsData.filter((a) => {
    if (!a.dueDate) return false;
    return new Date(a.dueDate) > new Date();
  }).length;

  const recentActivity: ActivityItem[] = [
    ...attemptsData
      .filter((a) => a.completedAt)
      .map((attempt) => {
        const quiz = quizzesData.find((q) => q.id === attempt.quizId);
        return {
          id: attempt.id,
          type: "quiz" as const,
          title: quiz?.title || "Unknown Quiz",
          date: attempt.completedAt!,
          meta: `Score: ${attempt.score}/${attempt.totalMarks}`,
        };
      }),
    ...mockMaterials.slice(0, 2).map((material) => ({
      id: material.id,
      type: "material" as const,
      title: material.title,
      date: material.createdAt || new Date(),
      meta: material.type,
    })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3);

  const quickLinks = [
    {
      title: "Study Materials",
      description: "Access notes, videos, and past papers",
      icon: BookOpen,
      href: "/student/materials",
    },
    {
      title: "Practice Quizzes",
      description: "Test your knowledge with quizzes",
      icon: GraduationCap,
      href: "/student/practice",
    },
    {
      title: "Assignments",
      description: "View and submit your assignments",
      icon: ClipboardList,
      href: "/student/assignments",
    },
  ];

  const isLoading = isLoadingAttempts || isLoadingAssignments;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description={`Welcome back, ${currentUser?.name || "Student"}!`}
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4" data-testid="metrics-grid">
        <StatCard
          title="Quizzes Attempted"
          value={totalAttempts}
          icon={<ClipboardCheck className="h-4 w-4 text-muted-foreground" />}
          isLoading={isLoadingAttempts}
        />
        <StatCard
          title="Average Score"
          value={`${averageScore}%`}
          icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
          isLoading={isLoadingAttempts}
        />
        <StatCard
          title="Active Subjects"
          value={activeSubjects}
          icon={<BookOpen className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard
          title="Assignments Due"
          value={pendingAssignments}
          icon={<Clock className="h-4 w-4 text-muted-foreground" />}
          isLoading={isLoadingAssignments}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card data-testid="recent-activity-section">
          <CardHeader>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Skeleton className="h-10 w-10 rounded-md" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3"
                    data-testid={`activity-item-${activity.id}`}
                  >
                    <div className="rounded-md bg-muted p-2">
                      {activity.type === "quiz" ? (
                        <GraduationCap className="h-4 w-4" />
                      ) : (
                        <FileText className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">{activity.title}</p>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span>{new Date(activity.date).toLocaleDateString()}</span>
                        <Badge variant="secondary" className="text-xs">
                          {activity.meta}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No recent activity to show.
              </p>
            )}
          </CardContent>
        </Card>

        <Card data-testid="quick-links-section">
          <CardHeader>
            <CardTitle className="text-lg">Quick Links</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {quickLinks.map((link) => (
                <Link key={link.href} href={link.href}>
                  <div
                    className="flex items-center gap-3 rounded-md p-3 hover-elevate cursor-pointer"
                    data-testid={`quick-link-${link.title.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    <div className="rounded-md bg-muted p-2">
                      <link.icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{link.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {link.description}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
