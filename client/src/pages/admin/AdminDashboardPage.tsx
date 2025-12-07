import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  Users,
  GraduationCap,
  Layers,
  FileText,
  TrendingUp,
  UserPlus,
  Upload,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  mockUsers,
  mockBoards,
  mockMaterials,
} from "@/lib/mockData";
import type { User, Board, Material } from "@shared/schema";

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

interface SystemEvent {
  id: string;
  type: "registration" | "upload" | "flagged";
  title: string;
  description: string;
  date: Date;
}

export function AdminDashboardPage() {
  const { data: users = [], isLoading: isLoadingUsers } = useQuery<Omit<User, 'password'>[]>({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const response = await fetch("/api/users", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch users");
      return response.json();
    },
  });

  const { data: boards = [], isLoading: isLoadingBoards } = useQuery<Board[]>({
    queryKey: ["/api/boards"],
    queryFn: async () => {
      const response = await fetch("/api/boards", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch boards");
      return response.json();
    },
  });

  const { data: materials = [], isLoading: isLoadingMaterials } = useQuery<Material[]>({
    queryKey: ["/api/materials"],
    queryFn: async () => {
      const response = await fetch("/api/materials", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch materials");
      return response.json();
    },
  });

  const usersData = users.length > 0 ? users : mockUsers;
  const boardsData = boards.length > 0 ? boards : mockBoards;
  const materialsData = materials.length > 0 ? materials : mockMaterials;

  const totalStudents = usersData.filter((u) => u.role === "student").length;
  const totalTeachers = usersData.filter((u) => u.role === "teacher").length;
  const totalBoards = boardsData.length;
  const totalMaterials = materialsData.length;
  const pendingContent = materialsData.filter((m) => m.status === "pending").length;

  const recentEvents: SystemEvent[] = [
    {
      id: "event-1",
      type: "registration",
      title: "New Student Registration",
      description: "Emma Wilson joined as a student",
      date: new Date(Date.now() - 3600000),
    },
    {
      id: "event-2",
      type: "upload",
      title: "New Content Upload",
      description: "Dr. Sarah Smith uploaded Physics Mid-Term 2022",
      date: new Date(Date.now() - 7200000),
    },
    {
      id: "event-3",
      type: "flagged",
      title: "Content Pending Review",
      description: "2022 Physics Mid-Term needs moderation",
      date: new Date(Date.now() - 14400000),
    },
    {
      id: "event-4",
      type: "registration",
      title: "New Teacher Registration",
      description: "Prof. Michael Brown joined as a teacher",
      date: new Date(Date.now() - 28800000),
    },
  ];

  const getEventIcon = (type: SystemEvent["type"]) => {
    switch (type) {
      case "registration":
        return <UserPlus className="h-4 w-4" />;
      case "upload":
        return <Upload className="h-4 w-4" />;
      case "flagged":
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getEventBadge = (type: SystemEvent["type"]) => {
    switch (type) {
      case "registration":
        return <Badge variant="secondary">New User</Badge>;
      case "upload":
        return <Badge variant="secondary">Upload</Badge>;
      case "flagged":
        return <Badge variant="destructive">Pending</Badge>;
    }
  };

  const isLoading = isLoadingUsers || isLoadingBoards || isLoadingMaterials;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Dashboard"
        description="System overview and recent activity"
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5" data-testid="stats-grid">
        <StatCard
          title="Total Students"
          value={totalStudents}
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
          isLoading={isLoadingUsers}
        />
        <StatCard
          title="Total Teachers"
          value={totalTeachers}
          icon={<GraduationCap className="h-4 w-4 text-muted-foreground" />}
          isLoading={isLoadingUsers}
        />
        <StatCard
          title="Total Boards"
          value={totalBoards}
          icon={<Layers className="h-4 w-4 text-muted-foreground" />}
          isLoading={isLoadingBoards}
        />
        <StatCard
          title="Total Materials"
          value={totalMaterials}
          icon={<FileText className="h-4 w-4 text-muted-foreground" />}
          isLoading={isLoadingMaterials}
        />
        <StatCard
          title="Daily Active Users"
          value="--"
          icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
          description="Coming soon"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card data-testid="recent-events-section">
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <CardTitle className="text-lg">Recent System Events</CardTitle>
            {isLoadingMaterials ? (
              <Skeleton className="h-6 w-20" />
            ) : (
              <Badge variant="secondary">{pendingContent} pending</Badge>
            )}
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Skeleton className="h-10 w-10 rounded-md" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {recentEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-start gap-3"
                    data-testid={`event-item-${event.id}`}
                  >
                    <div className="rounded-md bg-muted p-2">
                      {getEventIcon(event.type)}
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">{event.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {event.description}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span>
                          {event.date.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        {getEventBadge(event.type)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="quick-actions-section">
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Link href="/admin/users">
                <div
                  className="flex items-center gap-3 rounded-md p-3 hover-elevate cursor-pointer"
                  data-testid="quick-action-manage-users"
                >
                  <div className="rounded-md bg-muted p-2">
                    <Users className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Manage Users</p>
                    <p className="text-xs text-muted-foreground">
                      View and manage all users
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </Link>
              <Link href="/admin/moderation">
                <div
                  className="flex items-center gap-3 rounded-md p-3 hover-elevate cursor-pointer"
                  data-testid="quick-action-content-moderation"
                >
                  <div className="rounded-md bg-muted p-2">
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Content Moderation</p>
                    <p className="text-xs text-muted-foreground">
                      Review pending content
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </Link>
              <Link href="/admin/boards">
                <div
                  className="flex items-center gap-3 rounded-md p-3 hover-elevate cursor-pointer"
                  data-testid="quick-action-manage-boards"
                >
                  <div className="rounded-md bg-muted p-2">
                    <Layers className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Manage Boards</p>
                    <p className="text-xs text-muted-foreground">
                      Configure boards and subjects
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
