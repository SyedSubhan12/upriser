import { useState } from "react";
import { useParams, Link } from "wouter";
import { ArrowLeft, FileText, Clock, Check, Save } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { useToast } from "@/hooks/use-toast";
import {
  mockAssignments,
  mockSubmissions,
  mockUsers,
  mockSubjects,
} from "@/lib/mockData";
import { ASSIGNMENT_STATUS_LABELS } from "@shared/schema";
import type { AssignmentStatus } from "@shared/schema";

interface GradeData {
  [submissionId: string]: {
    grade: string;
    feedback: string;
  };
}

export function AssignmentSubmissionsPage() {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const { toast } = useToast();

  const assignment = mockAssignments.find((a) => a.id === assignmentId);
  const subject = assignment
    ? mockSubjects.find((s) => s.id === assignment.subjectId)
    : null;

  const submissions = mockSubmissions.filter(
    (s) => s.assignmentId === assignmentId
  );

  const [gradeData, setGradeData] = useState<GradeData>(() => {
    const initial: GradeData = {};
    submissions.forEach((s) => {
      initial[s.id] = {
        grade: s.grade?.toString() || "",
        feedback: s.feedback || "",
      };
    });
    return initial;
  });

  const handleGradeChange = (submissionId: string, value: string) => {
    setGradeData((prev) => ({
      ...prev,
      [submissionId]: {
        ...prev[submissionId],
        grade: value,
      },
    }));
  };

  const handleFeedbackChange = (submissionId: string, value: string) => {
    setGradeData((prev) => ({
      ...prev,
      [submissionId]: {
        ...prev[submissionId],
        feedback: value,
      },
    }));
  };

  const handleSaveGrade = (submissionId: string) => {
    const data = gradeData[submissionId];
    console.log("Saving grade for submission:", submissionId, data);
    toast({
      title: "Grade saved",
      description: "The grade and feedback have been saved successfully.",
    });
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "graded":
        return "default";
      case "submitted":
        return "secondary";
      default:
        return "outline";
    }
  };

  if (!assignment) {
    return (
      <div className="space-y-6">
        <PageHeader title="Assignment Not Found" />
        <p className="text-muted-foreground">
          The assignment you're looking for doesn't exist.
        </p>
        <Link href="/teacher/assignments">
          <Button variant="outline" data-testid="button-back-to-assignments">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Assignments
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Submissions"
        description={`${assignment.title} - ${subject?.subjectName || "Unknown Subject"}`}
        actions={
          <Link href="/teacher/assignments">
            <Button variant="outline" data-testid="button-back-to-assignments">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Assignments
            </Button>
          </Link>
        }
      />

      <Card data-testid="assignment-details-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Assignment Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Marks</p>
              <p className="text-lg font-medium">{assignment.totalMarks}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Due Date</p>
              <p className="text-lg font-medium flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {assignment.dueDate
                  ? new Date(assignment.dueDate).toLocaleDateString()
                  : "No due date"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Submissions</p>
              <p className="text-lg font-medium">{submissions.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Graded</p>
              <p className="text-lg font-medium">
                {submissions.filter((s) => s.status === "graded").length}
              </p>
            </div>
          </div>
          {assignment.description && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground">Description</p>
              <p className="mt-1">{assignment.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card data-testid="submissions-table-card">
        <CardHeader>
          <CardTitle>Student Submissions</CardTitle>
        </CardHeader>
        <CardContent>
          {submissions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Submitted At</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Feedback</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map((submission) => {
                  const student = mockUsers.find(
                    (u) => u.id === submission.studentId
                  );
                  const data = gradeData[submission.id] || {
                    grade: "",
                    feedback: "",
                  };
                  return (
                    <TableRow
                      key={submission.id}
                      data-testid={`row-submission-${submission.id}`}
                    >
                      <TableCell className="font-medium">
                        {student?.name || "Unknown Student"}
                      </TableCell>
                      <TableCell>
                        {submission.submittedAt
                          ? new Date(submission.submittedAt).toLocaleString()
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(submission.status)}>
                          {ASSIGNMENT_STATUS_LABELS[submission.status as AssignmentStatus] ||
                            submission.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={0}
                          max={assignment.totalMarks}
                          placeholder="Grade"
                          className="w-20"
                          value={data.grade}
                          onChange={(e) =>
                            handleGradeChange(submission.id, e.target.value)
                          }
                          data-testid={`input-grade-${submission.id}`}
                        />
                      </TableCell>
                      <TableCell>
                        <Textarea
                          placeholder="Add feedback..."
                          className="min-w-[200px] min-h-[60px]"
                          value={data.feedback}
                          onChange={(e) =>
                            handleFeedbackChange(submission.id, e.target.value)
                          }
                          data-testid={`textarea-feedback-${submission.id}`}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          onClick={() => handleSaveGrade(submission.id)}
                          data-testid={`button-save-grade-${submission.id}`}
                        >
                          <Save className="mr-2 h-4 w-4" />
                          Save
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">No submissions yet</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                No students have submitted this assignment yet.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
