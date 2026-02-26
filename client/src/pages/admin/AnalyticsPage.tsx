import { useQuery } from "@tanstack/react-query";
import {
  Users,
  BookOpen,
  GraduationCap,
  TrendingUp,
  BarChart3,
  LineChart,
  Layers,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getAdminOverview, type AdminOverviewResponse } from "@/api/admin";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  change?: string;
  isLoading?: boolean;
}

function StatCard({ title, value, icon, change, isLoading }: StatCardProps) {
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
        {change && (
          <p className="text-xs text-muted-foreground mt-1">{change}</p>
        )}
      </CardContent>
    </Card>
  );
}

function ChartPlaceholder({ title, icon }: { title: string; icon: React.ReactNode }) {
  return (
    <Card data-testid={`chart-${title.toLowerCase().replace(/\s+/g, "-")}`}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 rounded-md border-2 border-dashed flex items-center justify-center bg-muted/20">
          <p className="text-sm text-muted-foreground">Chart visualization coming soon</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function AnalyticsPage() {
  const { data, isLoading } = useQuery<AdminOverviewResponse>({
    queryKey: ["admin-overview"],
    queryFn: () => getAdminOverview(),
  });

  const stats = data?.stats;

  const totalStudents = stats?.totalStudents ?? 0;
  const totalTeachers = stats?.totalTeachers ?? 0;
  const totalBoards = stats?.totalBoards ?? 0;
  const totalMaterials = stats?.totalMaterials ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Platform usage statistics and insights"
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4" data-testid="stats-grid">
        <StatCard
          title="Total Students"
          value={totalStudents}
          icon={<GraduationCap className="h-4 w-4 text-muted-foreground" />}
          isLoading={isLoading}
        />
        <StatCard
          title="Total Teachers"
          value={totalTeachers}
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
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
          icon={<BookOpen className="h-4 w-4 text-muted-foreground" />}
          isLoading={isLoading}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartPlaceholder
          title="Content Usage by Subject"
          icon={<BarChart3 className="h-5 w-5 text-muted-foreground" />}
        />
        <ChartPlaceholder
          title="Quiz Attempts Over Time"
          icon={<LineChart className="h-5 w-5 text-muted-foreground" />}
        />
      </div>

      <ChartPlaceholder
        title="Active Users Trend"
        icon={<TrendingUp className="h-5 w-5 text-muted-foreground" />}
      />
    </div>
  );
}
