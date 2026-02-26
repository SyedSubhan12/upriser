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
import { getAdminOverview, type AdminOverviewResponse } from "@/api/admin";

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

export function AdminDashboardPage() {
  const { data, isLoading } = useQuery<AdminOverviewResponse>({
    queryKey: ["admin-overview"],
    queryFn: () => getAdminOverview(),
  });

  const stats = data?.stats;
  const recentEvents = data?.recentEvents ?? [];

  const totalStudents = stats?.totalStudents ?? 0;
  const totalTeachers = stats?.totalTeachers ?? 0;
  const totalBoards = stats?.totalBoards ?? 0;
  const totalMaterials = stats?.totalMaterials ?? 0;
  const pendingContent = stats?.pendingMaterials ?? 0;

  const mapEventType = (type: string): "registration" | "upload" | "flagged" | "status" => {
    // New user signups
    if (type === "NEW_USER") return "registration";

    // New resources being created (boards, materials, etc.)
    if (type.startsWith("NEW_")) return "upload";

    // Content moderation related events
    if (type.startsWith("CONTENT_")) return "flagged";

    // Everything else (board/user status changes, deletions, etc.)
    return "status";
  };

  const getEventIcon = (type: string) => {
    const mapped = mapEventType(type);
    switch (mapped) {
      case "registration":
        return <UserPlus className="h-4 w-4" />;
      case "upload":
        return <Upload className="h-4 w-4" />;
      case "flagged":
        return <AlertTriangle className="h-4 w-4" />;
      case "status":
        return <Layers className="h-4 w-4" />;
    }
  };

  const getEventBadge = (type: string) => {
    const mapped = mapEventType(type);
    switch (mapped) {
      case "registration":
        return <Badge variant="secondary">New User</Badge>;
      case "upload":
        return <Badge variant="secondary">Upload</Badge>;
      case "flagged":
        return <Badge variant="destructive">Moderation</Badge>;
      case "status":
        return <Badge variant="outline">Status Change</Badge>;
    }
  };

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
          isLoading={isLoading}
        />
        <StatCard
          title="Total Teachers"
          value={totalTeachers}
          icon={<GraduationCap className="h-4 w-4 text-muted-foreground" />}
          isLoading={isLoading}
        />
        <StatCard
          title="Total Boards"
          value={totalBoards}
          icon={<Layers className="h-4 w-4 text-muted-foreground" />}
          isLoading={isLoading}
        />
        <StatCard
          title="Total Materials"
          value={totalMaterials}
          icon={<FileText className="h-4 w-4 text-muted-foreground" />}
          isLoading={isLoading}
        />
        <StatCard
          title="Daily Active Users"
          value={stats?.dailyActiveUsers ?? "--"}
          icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
          description="Coming soon"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card data-testid="recent-events-section">
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <CardTitle className="text-lg">Recent System Events</CardTitle>
            {isLoading ? (
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
                      <p className="text-sm font-medium">{event.type}</p>
                      <p className="text-xs text-muted-foreground">
                        {event.message}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span>
                          {new Date(event.createdAt).toLocaleTimeString([], {
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
