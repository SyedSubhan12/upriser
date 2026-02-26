import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Mail, Calendar, Power } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import {
  getAdminUser,
  updateAdminUser,
  listAdminBoards,
  listSubjects,
  type AdminUserSummary,
  type AdminBoardSummary,
  type AdminSubject,
  type UpdateAdminUserBody,
} from "@/api/admin";

export function UserDetailPage() {
  const [, navigate] = useLocation();
  const [, params] = useRoute("/admin/users/:id");
  const userId = params?.id;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const {
    data: user,
    isLoading,
    isError,
  } = useQuery<AdminUserSummary | null>({
    queryKey: ["admin-user", userId],
    queryFn: async () => {
      if (!userId) return null;
      return getAdminUser(userId);
    },
    enabled: !!userId,
  });

  const { data: boards = [] } = useQuery<AdminBoardSummary[]>({
    queryKey: ["admin-boards"],
    queryFn: () => listAdminBoards(),
  });

  const { data: subjects = [] } = useQuery<AdminSubject[]>({
    queryKey: ["admin-subjects"],
    queryFn: () => listSubjects(),
  });

  const [role, setRole] = useState<AdminUserSummary["role"]>("student");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (user) {
      setRole(user.role);
      setIsActive(user.status === "ACTIVE");
    }
  }, [user]);

  const updateUserMutation = useMutation({
    mutationFn: (body: UpdateAdminUserBody) => {
      if (!userId) throw new Error("Missing userId");
      return updateAdminUser(userId, body);
    },
    onSuccess: (updated, variables) => {
      queryClient.setQueryData(["admin-user", userId], updated);
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });

      setRole(updated.role);
      setIsActive(updated.status === "ACTIVE");

      let title = "User updated";
      let description = "User details have been saved.";

      if (variables?.status) {
        const activated = variables.status === "ACTIVE";
        title = activated ? "User Activated" : "User Deactivated";
        description = `User has been ${activated ? "activated" : "deactivated"}.`;
      } else if (variables?.role) {
        title = "Role Updated";
        description = `User role has been changed to ${updated.role}.`;
      }

      toast({
        title,
        description,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to update user.",
        variant: "destructive",
      });
    },
  });

  if (!userId) {
    return (
      <div className="space-y-6">
        <PageHeader title="User Not Found" />
        <p className="text-muted-foreground">No user ID provided.</p>
        <Button onClick={() => navigate("/admin/users")} data-testid="button-back-to-users">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Users
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Loading user..." />
      </div>
    );
  }

  if (isError || !user) {
    return (
      <div className="space-y-6">
        <PageHeader title="User Not Found" />
        <p className="text-muted-foreground">
          The requested user could not be found.
        </p>
        <Button onClick={() => navigate("/admin/users")} data-testid="button-back-to-users">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Users
        </Button>
      </div>
    );
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const userBoards = boards.filter((b) => user.boardIds?.includes(b.id));
  const userSubjects = subjects.filter((s) => user.subjectIds?.includes(s.id));

  const activityHistory = [
    { id: "1", action: "Logged in", date: new Date(Date.now() - 3600000) },
    { id: "2", action: "Completed Quiz: Algebra Fundamentals", date: new Date(Date.now() - 86400000) },
    { id: "3", action: "Submitted Assignment", date: new Date(Date.now() - 172800000) },
    { id: "4", action: "Viewed Material: Quadratic Equations Notes", date: new Date(Date.now() - 259200000) },
  ];

  const handleToggleActive = () => {
    const newStatus: UpdateAdminUserBody["status"] = isActive ? "INACTIVE" : "ACTIVE";
    updateUserMutation.mutate({ status: newStatus });
  };

  const handleRoleChange = (newRole: AdminUserSummary["role"]) => {
    setRole(newRole);
    updateUserMutation.mutate({ role: newRole });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/admin/users")}
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader title="User Details" description={`Manage user: ${user.name}`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center text-center">
              <Avatar className="h-20 w-20 mb-4">
                {user.avatar && <AvatarImage src={user.avatar} alt={user.name} />}
                <AvatarFallback className="text-lg">{getInitials(user.name)}</AvatarFallback>
              </Avatar>
              <h3 className="font-semibold text-lg" data-testid="text-user-name">
                {user.name}
              </h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <Mail className="h-4 w-4" />
                <span data-testid="text-user-email">{user.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <Calendar className="h-4 w-4" />
                <span>
                  Joined {new Date(user.createdAt).toLocaleDateString()}
                </span>
              </div>
              <Badge
                variant={isActive ? "default" : "secondary"}
                className="mt-3"
                data-testid="badge-user-status"
              >
                {isActive ? "Active" : "Inactive"}
              </Badge>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">User Role</Label>
              <Select value={role} onValueChange={handleRoleChange}>
                <SelectTrigger id="role" data-testid="select-user-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="teacher">Teacher</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              variant={isActive ? "destructive" : "default"}
              className="w-full"
              onClick={handleToggleActive}
              data-testid="button-toggle-status"
            >
              <Power className="h-4 w-4 mr-2" />
              {isActive ? "Deactivate User" : "Activate User"}
            </Button>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Board & Subject Assignments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Assigned Boards</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {userBoards.length > 0 ? (
                    userBoards.map((board) => (
                      <Badge key={board.id} variant="secondary" data-testid={`badge-board-${board.id}`}>
                        {board.name}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">No boards assigned</span>
                  )}
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Assigned Subjects</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {userSubjects.length > 0 ? (
                    userSubjects.map((subject) => (
                      <Badge key={subject.id} variant="outline" data-testid={`badge-subject-${subject.id}`}>
                        {subject.name}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">No subjects assigned</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Activity History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activityHistory.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                    data-testid={`activity-item-${activity.id}`}
                  >
                    <span className="text-sm">{activity.action}</span>
                    <span className="text-xs text-muted-foreground">
                      {activity.date.toLocaleDateString()} {activity.date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
