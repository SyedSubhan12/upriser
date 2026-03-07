import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList, Calendar, Filter } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/context/AuthContext";
import {
  mockAssignments,
  mockSubmissions,
  mockSubjects,
  mockUsers,
  getAssignmentsByStudent,
} from "@/lib/mockData";
import { ASSIGNMENT_STATUS_LABELS } from "@shared/schema";
import type { Assignment, Submission, Subject } from "@shared/schema";

interface AssignmentCardProps {
  assignment: Assignment;
  submission?: Submission;
  subjects: Subject[];
}

function AssignmentCard({ assignment, submission, subjects }: AssignmentCardProps) {
  const subject = subjects.find((s) => s.id === assignment.subjectId);

  const getStatus = (): "pending" | "submitted" | "graded" => {
    if (!submission) return "pending";
    return submission.status as "pending" | "submitted" | "graded";
  };

  const status = getStatus();

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "graded":
        return "default";
      case "submitted":
        return "secondary";
      default:
        return "outline";
    }
  };

  const isOverdue =
    assignment.dueDate &&
    new Date(assignment.dueDate) < new Date() &&
    status === "pending";

  return (
    <Link href={`/student/assignments/${assignment.id}`}>
      <Card
        className="hover-elevate cursor-pointer h-full"
        data-testid={`assignment-card-${assignment.id}`}
      >
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <Badge variant={getStatusBadgeVariant(status)}>
              {ASSIGNMENT_STATUS_LABELS[status]}
            </Badge>
            {isOverdue && <Badge variant="destructive">Overdue</Badge>}
          </div>
          <CardTitle className="text-base mt-2 line-clamp-2">
            {assignment.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {subject && (
            <p className="text-sm text-muted-foreground">{subject.subjectName}</p>
          )}
          {assignment.dueDate && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                Due: {new Date(assignment.dueDate).toLocaleDateString()}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total Marks</span>
            <span className="font-medium">{assignment.totalMarks}</span>
          </div>
          {status === "graded" && submission?.grade !== null && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Your Grade</span>
              <span className="font-medium text-green-600 dark:text-green-400">
                {submission.grade}/{assignment.totalMarks}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

export function AssignmentsPage() {
  const { user } = useAuth();
  const currentUser = user || mockUsers.find((u) => u.role === "student");
  const [statusFilter, setStatusFilter] = useState<string>("all");

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

  const mockData = getAssignmentsByStudent(currentUser?.id || "");
  const assignmentsData = assignments.length > 0 ? assignments : mockData.map(item => item);
  const subjectsData = subjects.length > 0 ? subjects : mockSubjects;

  const getSubmissionForAssignment = (assignmentId: string) => {
    return mockSubmissions.find(
      (s) => s.assignmentId === assignmentId && s.studentId === currentUser?.id
    );
  };

  const assignmentsWithSubmissions = assignmentsData.map((assignment) => ({
    ...assignment,
    submission: getSubmissionForAssignment(assignment.id),
  }));

  const filteredAssignments = assignmentsWithSubmissions.filter((item) => {
    if (statusFilter === "all") return true;
    const status = item.submission?.status || "pending";
    return status === statusFilter;
  });

  const pendingCount = assignmentsWithSubmissions.filter(
    (a) => !a.submission || a.submission.status === "pending"
  ).length;
  const submittedCount = assignmentsWithSubmissions.filter(
    (a) => a.submission?.status === "submitted"
  ).length;
  const gradedCount = assignmentsWithSubmissions.filter(
    (a) => a.submission?.status === "graded"
  ).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assignments"
        description="View and submit your assignments"
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card data-testid="stat-pending">
          <CardContent className="py-4">
            <div className="text-center">
              {isLoadingAssignments ? (
                <Skeleton className="h-8 w-8 mx-auto" />
              ) : (
                <p className="text-2xl font-bold">{pendingCount}</p>
              )}
              <p className="text-sm text-muted-foreground">Pending</p>
            </div>
          </CardContent>
        </Card>
        <Card data-testid="stat-submitted">
          <CardContent className="py-4">
            <div className="text-center">
              {isLoadingAssignments ? (
                <Skeleton className="h-8 w-8 mx-auto" />
              ) : (
                <p className="text-2xl font-bold">{submittedCount}</p>
              )}
              <p className="text-sm text-muted-foreground">Submitted</p>
            </div>
          </CardContent>
        </Card>
        <Card data-testid="stat-graded">
          <CardContent className="py-4">
            <div className="text-center">
              {isLoadingAssignments ? (
                <Skeleton className="h-8 w-8 mx-auto" />
              ) : (
                <p className="text-2xl font-bold">{gradedCount}</p>
              )}
              <p className="text-sm text-muted-foreground">Graded</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filter by Status:</span>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]" data-testid="filter-status">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="graded">Graded</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {isLoadingAssignments ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" data-testid="assignments-grid">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-5 w-full mt-2" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredAssignments.length > 0 ? (
        <div
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          data-testid="assignments-grid"
        >
          {filteredAssignments.map((item) => (
            <AssignmentCard
              key={item.id}
              assignment={item}
              submission={item.submission}
              subjects={subjectsData}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              No assignments found matching your filter.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
