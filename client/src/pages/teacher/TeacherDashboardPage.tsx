import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  FileText,
  HelpCircle,
  ClipboardList,
  Clock,
  ArrowRight,
  Plus,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/AuthContext";
import {
  mockMaterials,
  mockQuizzes,
  mockAssignments,
  mockSubmissions,
  mockSubjects,
  mockUsers,
} from "@/lib/mockData";
import { RESOURCE_TYPE_LABELS } from "@shared/schema";
import type { Material, Quiz, Assignment, Submission, Subject } from "@shared/schema";

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

export function TeacherDashboardPage() {
  const { user } = useAuth();
  const currentUser = user || mockUsers.find((u) => u.role === "teacher");

  const { data: materials = [], isLoading: isLoadingMaterials } = useQuery<Material[]>({
    queryKey: ["/api/materials"],
    queryFn: async () => {
      const response = await fetch("/api/materials", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch materials");
      return response.json();
    },
  });

  const { data: quizzes = [], isLoading: isLoadingQuizzes } = useQuery<Quiz[]>({
    queryKey: ["/api/quizzes"],
    queryFn: async () => {
      const response = await fetch("/api/quizzes", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch quizzes");
      return response.json();
    },
  });

  const { data: assignments = [], isLoading: isLoadingAssignments } = useQuery<Assignment[]>({
    queryKey: ["/api/assignments"],
    queryFn: async () => {
      const response = await fetch("/api/assignments", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch assignments");
      return response.json();
    },
  });

  const { data: subjects = [] } = useQuery<Subject[]>({
    queryKey: ["/api/subjects"],
    queryFn: async () => {
      const response = await fetch("/api/subjects", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch subjects");
      return response.json();
    },
  });

  const materialsData = materials;
  const quizzesData = quizzes;
  const assignmentsData = assignments;
  const subjectsData = subjects.length > 0 ? subjects : mockSubjects;

  const myMaterials = materialsData.filter(
    (m) => m.uploaderId === currentUser?.id
  );
  const myQuizzes = quizzesData.filter(
    (q) => q.creatorId === currentUser?.id
  );
  const myAssignments = assignmentsData.filter(
    (a) => a.creatorId === currentUser?.id
  );
  const pendingSubmissions = []; // TODO: Implement real submissions fetching

  const recentMaterials = [...myMaterials]
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    .slice(0, 5);

  const quickActions = [
    {
      title: "Create Material",
      description: "Upload notes, past papers, or videos",
      icon: FileText,
      href: "/teacher/materials/new",
    },
    {
      title: "Create Quiz",
      description: "Build a new quiz for students",
      icon: HelpCircle,
      href: "/teacher/quizzes/new",
    },
    {
      title: "Create Assignment",
      description: "Assign work to your students",
      icon: ClipboardList,
      href: "/teacher/assignments",
    },
  ];

  const isLoading = isLoadingMaterials || isLoadingQuizzes || isLoadingAssignments;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Teacher Dashboard"
        description={`Welcome back, ${currentUser?.name || "Teacher"}!`}
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4" data-testid="metrics-grid">
        <StatCard
          title="Materials Uploaded"
          value={myMaterials.length}
          icon={<FileText className="h-4 w-4 text-muted-foreground" />}
          isLoading={isLoadingMaterials}
        />
        <StatCard
          title="Quizzes Created"
          value={myQuizzes.length}
          icon={<HelpCircle className="h-4 w-4 text-muted-foreground" />}
          isLoading={isLoadingQuizzes}
        />
        <StatCard
          title="Active Assignments"
          value={myAssignments.filter((a) => a.isActive).length}
          icon={<ClipboardList className="h-4 w-4 text-muted-foreground" />}
          isLoading={isLoadingAssignments}
        />
        <StatCard
          title="Pending Submissions"
          value={pendingSubmissions.length}
          icon={<Clock className="h-4 w-4 text-muted-foreground" />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card data-testid="recent-uploads-section">
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <CardTitle className="text-lg">Recent Uploads</CardTitle>
            <Link href="/teacher/materials">
              <Button variant="ghost" size="sm" data-testid="button-view-all-materials">
                View All
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {isLoadingMaterials ? (
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
            ) : recentMaterials.length > 0 ? (
              <div className="space-y-4">
                {recentMaterials.map((material) => {
                  const subject = subjectsData.find(
                    (s) => s.id === material.subjectId
                  );
                  return (
                    <div
                      key={material.id}
                      className="flex items-start gap-3"
                      data-testid={`recent-material-${material.id}`}
                    >
                      <div className="rounded-md bg-muted p-2">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium">{material.title}</p>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span>{subject?.subjectName || "Unknown Subject"}</span>
                          <Badge variant="secondary" className="text-xs">
                            {RESOURCE_TYPE_LABELS[material.type as keyof typeof RESOURCE_TYPE_LABELS] || material.type}
                          </Badge>
                          <Badge
                            variant={
                              material.status === "approved"
                                ? "default"
                                : material.status === "pending"
                                  ? "secondary"
                                  : "destructive"
                            }
                            className="text-xs"
                          >
                            {material.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No materials uploaded yet.
              </p>
            )}
          </CardContent>
        </Card>

        <Card data-testid="quick-actions-section">
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {quickActions.map((action) => (
                <Link key={action.href} href={action.href}>
                  <div
                    className="flex items-center gap-3 rounded-md p-3 hover-elevate cursor-pointer"
                    data-testid={`quick-action-${action.title.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    <div className="rounded-md bg-muted p-2">
                      <action.icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{action.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {action.description}
                      </p>
                    </div>
                    <Plus className="h-4 w-4 text-muted-foreground" />
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
