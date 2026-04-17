import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Eye, CheckCircle, XCircle, Loader2, Search } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface PendingTeacher {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  isEmailVerified: boolean;
  createdAt: string;
}

interface PendingTeachersResponse {
  data: PendingTeacher[];
  total: number;
}

async function fetchPendingTeachers(): Promise<PendingTeachersResponse> {
  const res = await fetch("/api/admin/teachers/pending", { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch pending teachers");
  return res.json();
}

async function approveTeacher(id: string) {
  const res = await fetch(`/api/admin/teachers/${id}/approve`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to approve teacher");
  return res.json();
}

async function rejectTeacher(id: string, reason?: string) {
  const res = await fetch(`/api/admin/teachers/${id}/reject`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ reason }),
  });
  if (!res.ok) throw new Error("Failed to reject teacher");
  return res.json();
}

export function TeacherApprovalPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [teacherToApprove, setTeacherToApprove] = useState<PendingTeacher | null>(null);
  const [teacherToReject, setTeacherToReject] = useState<PendingTeacher | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["pending-teachers"],
    queryFn: fetchPendingTeachers,
  });

  const teachers = data?.data ?? [];

  const filteredTeachers = teachers.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const approveMutation = useMutation({
    mutationFn: (id: string) => approveTeacher(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-teachers"] });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setTeacherToApprove(null);
      toast({
        title: "Teacher Approved",
        description: `${teacherToApprove?.name} has been approved and can now log in.`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to approve teacher.",
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => rejectTeacher(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-teachers"] });
      setTeacherToReject(null);
      setRejectionReason("");
      toast({
        title: "Teacher Rejected",
        description: `${teacherToReject?.name}'s application has been rejected.`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reject teacher.",
        variant: "destructive",
      });
    },
  });

  const handleApprove = () => {
    if (teacherToApprove) {
      approveMutation.mutate(teacherToApprove.id);
    }
  };

  const handleReject = () => {
    if (teacherToReject) {
      rejectMutation.mutate({ id: teacherToReject.id, reason: rejectionReason });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Teacher Approvals"
        description="Review and approve pending teacher applications"
      />

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-center">Email Verified</TableHead>
                <TableHead>Applied</TableHead>
                <TableHead className="w-40 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : filteredTeachers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    {searchQuery ? "No matching teachers found." : "No pending teacher applications."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredTeachers.map((teacher) => (
                  <TableRow key={teacher.id}>
                    <TableCell className="font-medium">{teacher.name}</TableCell>
                    <TableCell className="text-muted-foreground">{teacher.email}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={teacher.isEmailVerified ? "default" : "secondary"}>
                        {teacher.isEmailVerified ? "Verified" : "Pending"}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(teacher.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          asChild
                        >
                          <Link href={`/t/${encodeURIComponent(teacher.name)}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setTeacherToApprove(teacher)}
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setTeacherToReject(teacher)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Approve Dialog */}
      <Dialog open={!!teacherToApprove} onOpenChange={() => setTeacherToApprove(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Teacher</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve {teacherToApprove?.name}? They will be able to access the teacher dashboard and upload resources.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTeacherToApprove(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleApprove}
              disabled={approveMutation.isPending}
            >
              {approveMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Approve Teacher
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={!!teacherToReject} onOpenChange={() => { setTeacherToReject(null); setRejectionReason(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Teacher Application</DialogTitle>
            <DialogDescription>
              Are you sure you want to reject {teacherToReject?.name}'s application? This action will deactivate their account.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4">
            <label className="text-sm font-medium" htmlFor="rejection-reason">
              Reason (optional)
            </label>
            <Input
              id="rejection-reason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Provide a reason for rejection..."
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setTeacherToReject(null); setRejectionReason(""); }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={rejectMutation.isPending}
            >
              {rejectMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <XCircle className="h-4 w-4 mr-2" />
              )}
              Reject Application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
