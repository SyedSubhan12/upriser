import { useState } from "react";
import { useParams, Link } from "wouter";
import {
  ArrowLeft,
  Calendar,
  Upload,
  CheckCircle,
  FileText,
  Clock,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import {
  mockAssignments,
  mockSubmissions,
  mockSubjects,
  mockTopics,
  mockUsers,
} from "@/lib/mockData";
import { ASSIGNMENT_STATUS_LABELS } from "@shared/schema";

export function AssignmentDetailPage() {
  const params = useParams<{ id: string }>();
  const { user } = useAuth();
  const currentUser = user || mockUsers.find((u) => u.role === "student");
  const assignmentId = params.id;

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const assignment = mockAssignments.find((a) => a.id === assignmentId);
  const submission = mockSubmissions.find(
    (s) => s.assignmentId === assignmentId && s.studentId === currentUser?.id
  );
  const subject = assignment
    ? mockSubjects.find((s) => s.id === assignment.subjectId)
    : null;
  const topic = assignment?.topicId
    ? mockTopics.find((t) => t.id === assignment.topicId)
    : null;

  if (!assignment) {
    return (
      <div className="space-y-6">
        <PageHeader title="Assignment Not Found" />
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              The requested assignment could not be found.
            </p>
            <Link href="/student/assignments">
              <Button data-testid="button-back-to-assignments">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Assignments
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const status = submission?.status || "pending";
  const isOverdue =
    assignment.dueDate &&
    new Date(assignment.dueDate) < new Date() &&
    status === "pending";

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleSubmit = () => {
    if (selectedFile) {
      console.log("Submitting file:", selectedFile.name);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/student/assignments">
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <PageHeader title={assignment.title} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card data-testid="assignment-description">
            <CardHeader>
              <CardTitle className="text-lg">Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {assignment.description || "No description provided."}
              </p>
            </CardContent>
          </Card>

          {status === "pending" && !isOverdue && (
            <Card data-testid="submission-form">
              <CardHeader>
                <CardTitle className="text-lg">Submit Assignment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="file-upload">Upload File</Label>
                  <div className="border-2 border-dashed rounded-md p-6 text-center">
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground mb-2">
                      Drag and drop your file here, or click to browse
                    </p>
                    <Input
                      id="file-upload"
                      type="file"
                      className="max-w-xs mx-auto"
                      onChange={handleFileChange}
                      data-testid="input-file-upload"
                    />
                  </div>
                  {selectedFile && (
                    <p className="text-sm text-muted-foreground">
                      Selected: {selectedFile.name}
                    </p>
                  )}
                </div>
                <Button
                  onClick={handleSubmit}
                  disabled={!selectedFile}
                  data-testid="button-submit-assignment"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Submit Assignment
                </Button>
              </CardContent>
            </Card>
          )}

          {status === "submitted" && submission && (
            <Card data-testid="submission-details">
              <CardHeader>
                <CardTitle className="text-lg">Your Submission</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="font-medium">Submitted Successfully</span>
                </div>
                {submission.submittedAt && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>
                      Submitted on{" "}
                      {new Date(submission.submittedAt).toLocaleString()}
                    </span>
                  </div>
                )}
                {submission.fileUrl && (
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4" />
                    <span className="text-muted-foreground">
                      File: {submission.fileUrl.split("/").pop()}
                    </span>
                  </div>
                )}
                <p className="text-sm text-muted-foreground">
                  Awaiting grading...
                </p>
              </CardContent>
            </Card>
          )}

          {status === "graded" && submission && (
            <Card data-testid="grading-details">
              <CardHeader>
                <CardTitle className="text-lg">Grading</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Your Grade</span>
                  <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {submission.grade}/{assignment.totalMarks}
                  </span>
                </div>
                {submission.feedback && (
                  <div className="space-y-2">
                    <span className="font-medium">Feedback</span>
                    <p className="text-muted-foreground p-4 bg-muted rounded-md">
                      {submission.feedback}
                    </p>
                  </div>
                )}
                {submission.gradedAt && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Graded on{" "}
                      {new Date(submission.gradedAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {isOverdue && (
            <Card data-testid="overdue-notice">
              <CardContent className="py-6 text-center">
                <Badge variant="destructive" className="mb-4">
                  Overdue
                </Badge>
                <p className="text-muted-foreground">
                  This assignment is past its due date. Please contact your
                  teacher for assistance.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card data-testid="assignment-metadata">
            <CardHeader>
              <CardTitle className="text-lg">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant={getStatusBadgeVariant(status)}>
                  {ASSIGNMENT_STATUS_LABELS[status as keyof typeof ASSIGNMENT_STATUS_LABELS]}
                </Badge>
                {isOverdue && <Badge variant="destructive">Overdue</Badge>}
              </div>

              <div className="space-y-3 text-sm">
                {subject && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subject</span>
                    <span className="font-medium" data-testid="text-subject">
                      {subject.subjectName}
                    </span>
                  </div>
                )}
                {topic && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Topic</span>
                    <span className="font-medium" data-testid="text-topic">
                      {topic.name}
                    </span>
                  </div>
                )}
                {assignment.dueDate && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Due Date</span>
                    <span className="font-medium" data-testid="text-due-date">
                      {new Date(assignment.dueDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Marks</span>
                  <span className="font-medium" data-testid="text-total-marks">
                    {assignment.totalMarks}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {assignment.attachmentUrl && (
            <Card data-testid="assignment-attachment">
              <CardHeader>
                <CardTitle className="text-lg">Attachment</CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  className="w-full"
                  data-testid="button-download-attachment"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Download Attachment
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
