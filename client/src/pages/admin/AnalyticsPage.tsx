import {
  Users,
  BookOpen,
  GraduationCap,
  TrendingUp,
  BarChart3,
  LineChart,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mockUsers, mockMaterials, mockQuizAttempts, mockSubjects } from "@/lib/mockData";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  change?: string;
}

function StatCard({ title, value, icon, change }: StatCardProps) {
  return (
    <Card data-testid={`stat-card-${title.toLowerCase().replace(/\s+/g, "-")}`}>
      <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold" data-testid={`stat-value-${title.toLowerCase().replace(/\s+/g, "-")}`}>
          {value}
        </div>
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
  const totalUsers = mockUsers.length;
  const totalStudents = mockUsers.filter((u) => u.role === "student").length;
  const totalMaterials = mockMaterials.length;
  const totalQuizAttempts = mockQuizAttempts.length;

  const averageQuizScore =
    mockQuizAttempts.length > 0
      ? Math.round(
          (mockQuizAttempts.reduce((sum, a) => sum + (a.score || 0), 0) /
            mockQuizAttempts.reduce((sum, a) => sum + (a.totalMarks || 1), 0)) *
            100
        )
      : 0;

  const subjectUsage = mockSubjects.slice(0, 5).map((subject) => ({
    name: subject.name,
    materials: mockMaterials.filter((m) => m.subjectId === subject.id).length,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Platform usage statistics and insights"
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4" data-testid="stats-grid">
        <StatCard
          title="Total Users"
          value={totalUsers}
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
          change="+12% from last month"
        />
        <StatCard
          title="Active Students"
          value={totalStudents}
          icon={<GraduationCap className="h-4 w-4 text-muted-foreground" />}
          change="+8% from last month"
        />
        <StatCard
          title="Content Items"
          value={totalMaterials}
          icon={<BookOpen className="h-4 w-4 text-muted-foreground" />}
          change="+5 new this week"
        />
        <StatCard
          title="Avg. Quiz Score"
          value={`${averageQuizScore}%`}
          icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
          change="+3% from last month"
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
        icon={<LineChart className="h-5 w-5 text-muted-foreground" />}
      />

      <Card data-testid="subject-usage-table">
        <CardHeader>
          <CardTitle className="text-lg">Content by Subject</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {subjectUsage.map((subject, index) => (
              <div key={subject.name} className="flex items-center gap-4" data-testid={`subject-usage-${index}`}>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{subject.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {subject.materials} items
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{
                        width: `${Math.min((subject.materials / 5) * 100, 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
