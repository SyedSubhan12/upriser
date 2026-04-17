import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { GraduationCap, Mail, BookOpen, Clock, Award, Loader2 } from "lucide-react";
import { PublicLayout } from "@/layouts/PublicLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface TeacherProfile {
  id: string;
  name: string;
  username: string;
  avatar: string | null;
  bio: string | null;
  qualifications: string[] | null;
  experienceYears: number | null;
  subjectIds: string[] | null;
}

async function fetchTeacherProfile(username: string): Promise<TeacherProfile> {
  const res = await fetch(`/api/profile/${username}`, { credentials: "include" });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Profile not found" }));
    throw new Error(error.error || "Failed to fetch profile");
  }
  return res.json();
}

export function TeacherProfilePage() {
  const [, params] = useRoute("/t/:username");
  const username = params?.username || "";

  const { data: teacher, isLoading, error } = useQuery({
    queryKey: ["teacher-profile", username],
    queryFn: () => fetchTeacherProfile(username),
    enabled: !!username,
    retry: false,
  });

  if (isLoading) {
    return (
      <PublicLayout>
        <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-32 mt-2" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        </div>
      </PublicLayout>
    );
  }

  if (error) {
    return (
      <PublicLayout>
        <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
          <Card className="w-full max-w-md text-center">
            <CardHeader>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <GraduationCap className="h-6 w-6 text-red-600" />
              </div>
              <CardTitle className="text-2xl">Profile Not Found</CardTitle>
              <CardDescription>
                {error instanceof Error ? error.message : "The teacher profile you're looking for doesn't exist or hasn't been approved yet."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <a href="/">Return Home</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </PublicLayout>
    );
  }

  if (!teacher) return null;

  const initials = teacher.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <PublicLayout>
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src={teacher.avatar || undefined} alt={teacher.name} />
                <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
              </Avatar>
            </div>
            <CardTitle className="text-3xl">{teacher.name}</CardTitle>
            <CardDescription className="flex items-center justify-center gap-2">
              <span className="text-muted-foreground">@{teacher.username}</span>
              <Badge variant="secondary">Teacher</Badge>
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {teacher.bio && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">About</h3>
                <p className="text-base leading-relaxed">{teacher.bio}</p>
              </div>
            )}

            {teacher.qualifications && teacher.qualifications.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                  <Award className="h-4 w-4" /> Qualifications
                </h3>
                <div className="flex flex-wrap gap-2">
                  {teacher.qualifications.map((qual, i) => (
                    <Badge key={i} variant="outline">
                      {qual}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {teacher.experienceYears && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                  <Clock className="h-4 w-4" /> Experience
                </h3>
                <p className="text-base">{teacher.experienceYears}+ years</p>
              </div>
            )}

            {teacher.subjectIds && teacher.subjectIds.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                  <BookOpen className="h-4 w-4" /> Subjects
                </h3>
                <div className="flex flex-wrap gap-2">
                  {teacher.subjectIds.map((subjectId) => (
                    <Badge key={subjectId} variant="secondary">
                      {subjectId}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-4 border-t">
              <Button className="w-full" asChild>
                <a href={`/login`}>
                  <Mail className="mr-2 h-4 w-4" />
                  Contact Teacher
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PublicLayout>
  );
}
