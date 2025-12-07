import { useState } from "react";
import { User, Mail, BookOpen, GraduationCap, Camera, Save } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { mockBoards, mockSubjects, mockUsers } from "@/lib/mockData";

export function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const currentUser = user || mockUsers.find((u) => u.role === "student");

  const [name, setName] = useState(currentUser?.name || "");
  const [isEditing, setIsEditing] = useState(false);

  const enrolledBoards = currentUser?.boardIds
    ? mockBoards.filter((b) => currentUser.boardIds?.includes(b.id))
    : [];

  const enrolledSubjects = currentUser?.subjectIds
    ? mockSubjects.filter((s) => currentUser.subjectIds?.includes(s.id))
    : [];

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSave = () => {
    toast({
      title: "Profile Updated",
      description: "Your profile has been successfully updated.",
    });
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profile"
        description="Manage your account settings"
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card data-testid="profile-info">
            <CardHeader>
              <CardTitle className="text-lg">Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <Avatar className="h-24 w-24">
                    {currentUser?.avatar && (
                      <AvatarImage
                        src={currentUser.avatar}
                        alt={currentUser?.name}
                      />
                    )}
                    <AvatarFallback className="text-2xl">
                      {currentUser ? getInitials(currentUser.name) : "U"}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute -bottom-2 -right-2 rounded-full"
                    data-testid="button-upload-avatar"
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
                <div>
                  <h3 className="font-semibold text-lg" data-testid="text-user-name">
                    {currentUser?.name}
                  </h3>
                  <p className="text-sm text-muted-foreground capitalize">
                    {currentUser?.role}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    <span className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Name
                    </span>
                  </Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setIsEditing(true);
                    }}
                    data-testid="input-name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">
                    <span className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email
                    </span>
                  </Label>
                  <Input
                    id="email"
                    value={currentUser?.email || ""}
                    disabled
                    className="bg-muted"
                    data-testid="input-email"
                  />
                  <p className="text-xs text-muted-foreground">
                    Email cannot be changed
                  </p>
                </div>
              </div>

              <Button
                onClick={handleSave}
                disabled={!isEditing}
                data-testid="button-save-changes"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card data-testid="enrolled-boards">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Enrolled Boards
              </CardTitle>
            </CardHeader>
            <CardContent>
              {enrolledBoards.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {enrolledBoards.map((board) => (
                    <Badge
                      key={board.id}
                      variant="secondary"
                      data-testid={`badge-board-${board.id}`}
                    >
                      {board.name}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No boards enrolled
                </p>
              )}
            </CardContent>
          </Card>

          <Card data-testid="enrolled-subjects">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Enrolled Subjects
              </CardTitle>
            </CardHeader>
            <CardContent>
              {enrolledSubjects.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {enrolledSubjects.map((subject) => (
                    <Badge
                      key={subject.id}
                      variant="outline"
                      data-testid={`badge-subject-${subject.id}`}
                    >
                      {subject.name}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No subjects enrolled
                </p>
              )}
            </CardContent>
          </Card>

          <Card data-testid="account-stats">
            <CardHeader>
              <CardTitle className="text-lg">Account</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Member Since</span>
                <span className="font-medium">
                  {currentUser?.createdAt
                    ? new Date(currentUser.createdAt).toLocaleDateString()
                    : "Unknown"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge variant={currentUser?.isActive ? "default" : "secondary"}>
                  {currentUser?.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
