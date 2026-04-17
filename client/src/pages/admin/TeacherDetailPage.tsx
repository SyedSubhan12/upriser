import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { ArrowLeft, Save, Loader2, CheckCircle, XCircle } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

interface TeacherDetails {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  username: string | null;
  bio: string | null;
  qualifications: string[] | null;
  experienceYears: number | null;
  boardIds: string[] | null;
  subjectIds: string[] | null;
  isEmailVerified: boolean;
  isApproved: boolean;
  approvedAt: string | null;
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  boards: { id: string; display_name: string; board_key: string }[];
}

async function fetchTeacherDetails(id: string): Promise<TeacherDetails> {
  const res = await fetch(`/api/admin/teachers/${id}`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch teacher details");
  return res.json();
}

async function updateTeacherDetails(id: string, data: Partial<TeacherDetails>) {
  const res = await fetch(`/api/admin/teachers/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update teacher");
  return res.json();
}

export function TeacherDetailPage() {
  const { id: teacherId } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: teacher, isLoading } = useQuery({
    queryKey: ["admin-teacher", teacherId],
    queryFn: () => fetchTeacherDetails(teacherId),
    enabled: !!teacherId,
  });

  const [formData, setFormData] = useState({
    name: "",
    username: "",
    bio: "",
    qualifications: "",
    experienceYears: "",
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<TeacherDetails>) => updateTeacherDetails(teacherId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-teacher", teacherId] });
      toast({
        title: "Teacher Updated",
        description: `${teacher?.name}'s profile has been updated.`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update teacher profile.",
        variant: "destructive",
      });
    },
  });

  const approveMutation = useMutation({
    mutationFn: () => fetch(`/api/admin/teachers/${teacherId}/approve`, {
      method: "POST",
      credentials: "include",
    }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-teacher", teacherId] });
      queryClient.invalidateQueries({ queryKey: ["pending-teachers"] });
      toast({ title: "Teacher Approved", description: `${teacher?.name} has been approved.` });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to approve teacher.", variant: "destructive" });
    },
  });

  // Sync form data when teacher loads
  useEffect(() => {
    if (teacher) {
      setFormData({
        name: teacher.name,
        username: teacher.username || "",
        bio: teacher.bio || "",
        qualifications: (teacher.qualifications || []).join(", "),
        experienceYears: teacher.experienceYears?.toString() || "",
      });
    }
  }, [teacher]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      name: formData.name.trim(),
      username: formData.username.trim() || null,
      bio: formData.bio.trim() || null,
      qualifications: formData.qualifications
        .split(",")
        .map((q) => q.trim())
        .filter(Boolean),
      experienceYears: formData.experienceYears ? parseInt(formData.experienceYears, 10) : null,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Card>
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="space-y-6">
        <PageHeader title="Teacher Not Found" description="The teacher you're looking for doesn't exist." />
      </div>
    );
  }

  const initials = teacher.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Teacher Details"
        description={`Managing ${teacher.name}'s profile`}
        actions={
          <Button variant="outline" asChild>
            <Link href="/admin/teachers">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Teachers
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Summary */}
        <Card>
          <CardHeader className="text-center">
            <Avatar className="h-24 w-24 mx-auto">
              <AvatarImage src={teacher.avatar || undefined} alt={teacher.name} />
              <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
            </Avatar>
            <CardTitle className="text-xl">{teacher.name}</CardTitle>
            <CardDescription>{teacher.email}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2 justify-center">
              <Badge variant={teacher.isActive ? "default" : "secondary"}>
                {teacher.isActive ? "Active" : "Inactive"}
              </Badge>
              <Badge variant={teacher.isApproved ? "default" : "secondary"}>
                {teacher.isApproved ? "Approved" : "Pending"}
              </Badge>
              <Badge variant={teacher.isEmailVerified ? "default" : "secondary"}>
                {teacher.isEmailVerified ? "Verified" : "Unverified"}
              </Badge>
            </div>

            <Separator />

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Username:</span>
                <span className="font-mono">@{teacher.username || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Experience:</span>
                <span>{teacher.experienceYears ? `${teacher.experienceYears}+ years` : "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Joined:</span>
                <span>{new Date(teacher.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Login:</span>
                <span>{teacher.lastLoginAt ? new Date(teacher.lastLoginAt).toLocaleDateString() : "Never"}</span>
              </div>
            </div>

            {!teacher.isApproved && (
              <Button
                className="w-full"
                onClick={() => approveMutation.mutate()}
                disabled={approveMutation.isPending}
              >
                {approveMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Approve Teacher
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Edit Form */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Edit Profile</CardTitle>
            <CardDescription>Update teacher's public profile information</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="teacher-name">Full Name</Label>
                  <Input
                    id="teacher-name"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="teacher-username">Username (for public profile)</Label>
                  <Input
                    id="teacher-username"
                    value={formData.username}
                    onChange={(e) => setFormData((prev) => ({ ...prev, username: e.target.value }))}
                    placeholder="e.g., yasir"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="teacher-bio">Bio</Label>
                <Textarea
                  id="teacher-bio"
                  value={formData.bio}
                  onChange={(e) => setFormData((prev) => ({ ...prev, bio: e.target.value }))}
                  placeholder="Brief biography..."
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="teacher-qualifications">Qualifications (comma-separated)</Label>
                  <Input
                    id="teacher-qualifications"
                    value={formData.qualifications}
                    onChange={(e) => setFormData((prev) => ({ ...prev, qualifications: e.target.value }))}
                    placeholder="e.g., PhD Physics, MSc Mathematics"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="teacher-experience">Years of Experience</Label>
                  <Input
                    id="teacher-experience"
                    type="number"
                    min="0"
                    value={formData.experienceYears}
                    onChange={(e) => setFormData((prev) => ({ ...prev, experienceYears: e.target.value }))}
                  />
                </div>
              </div>

              {teacher.boards && teacher.boards.length > 0 && (
                <div className="space-y-2">
                  <Label>Boards</Label>
                  <div className="flex flex-wrap gap-2">
                    {teacher.boards.map((board) => (
                      <Badge key={board.id} variant="outline">
                        {board.display_name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Changes
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
