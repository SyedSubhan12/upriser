import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import NotFound from "@/pages/not-found";
import { LandingPage } from "@/pages/public/LandingPage";
import { LoginPage } from "@/pages/public/LoginPage";
import { RegisterPage } from "@/pages/public/RegisterPage";
import { BoardSelectionPage } from "@/pages/public/BoardSelectionPage";
import { StudentLayout } from "@/layouts/StudentLayout";
import { StudentDashboardPage } from "@/pages/student/StudentDashboardPage";
import { StudyMaterialsPage } from "@/pages/student/StudyMaterialsPage";
import { MaterialDetailPage } from "@/pages/student/MaterialDetailPage";
import { QuizPracticePage } from "@/pages/student/QuizPracticePage";
import { QuizAttemptPage } from "@/pages/student/QuizAttemptPage";
import { QuizHistoryPage } from "@/pages/student/QuizHistoryPage";
import { AssignmentsPage } from "@/pages/student/AssignmentsPage";
import { AssignmentDetailPage } from "@/pages/student/AssignmentDetailPage";
import { AnnouncementsPage } from "@/pages/student/AnnouncementsPage";
import { ProfilePage } from "@/pages/student/ProfilePage";
import { TeacherLayout } from "@/layouts/TeacherLayout";
import { TeacherDashboardPage } from "@/pages/teacher/TeacherDashboardPage";
import { MyMaterialsPage } from "@/pages/teacher/MyMaterialsPage";
import { MaterialEditorPage } from "@/pages/teacher/MaterialEditorPage";
import { QuizListPage } from "@/pages/teacher/QuizListPage";
import { QuizBuilderPage } from "@/pages/teacher/QuizBuilderPage";
import { QuizResultsPage } from "@/pages/teacher/QuizResultsPage";
import { AssignmentsManagePage } from "@/pages/teacher/AssignmentsManagePage";
import { AssignmentSubmissionsPage } from "@/pages/teacher/AssignmentSubmissionsPage";
import { TeacherAnnouncementsPage } from "@/pages/teacher/TeacherAnnouncementsPage";
import { AdminLayout } from "@/layouts/AdminLayout";
import { AdminDashboardPage } from "@/pages/admin/AdminDashboardPage";
import { BoardsPage } from "@/pages/admin/BoardsPage";
import { BoardEditorPage } from "@/pages/admin/BoardEditorPage";
import { SubjectsTopicsPage } from "@/pages/admin/SubjectsTopicsPage";
import { UsersPage } from "@/pages/admin/UsersPage";
import { UserDetailPage } from "@/pages/admin/UserDetailPage";
import { ContentModerationPage } from "@/pages/admin/ContentModerationPage";
import { AnalyticsPage } from "@/pages/admin/AnalyticsPage";
import { SystemSettingsPage } from "@/pages/admin/SystemSettingsPage";

function StudentRoutes() {
  return (
    <StudentLayout>
      <Switch>
        <Route path="/student/dashboard" component={StudentDashboardPage} />
        <Route path="/student/materials" component={StudyMaterialsPage} />
        <Route path="/student/materials/:id" component={MaterialDetailPage} />
        <Route path="/student/practice" component={QuizPracticePage} />
        <Route path="/student/practice/quiz/:quizId" component={QuizAttemptPage} />
        <Route path="/student/practice/history" component={QuizHistoryPage} />
        <Route path="/student/assignments" component={AssignmentsPage} />
        <Route path="/student/assignments/:id" component={AssignmentDetailPage} />
        <Route path="/student/announcements" component={AnnouncementsPage} />
        <Route path="/student/profile" component={ProfilePage} />
        <Route component={NotFound} />
      </Switch>
    </StudentLayout>
  );
}

function TeacherRoutes() {
  return (
    <TeacherLayout>
      <Switch>
        <Route path="/teacher/dashboard" component={TeacherDashboardPage} />
        <Route path="/teacher/materials" component={MyMaterialsPage} />
        <Route path="/teacher/materials/new" component={MaterialEditorPage} />
        <Route path="/teacher/materials/:id" component={MaterialEditorPage} />
        <Route path="/teacher/quizzes" component={QuizListPage} />
        <Route path="/teacher/quizzes/new" component={QuizBuilderPage} />
        <Route path="/teacher/quizzes/:id" component={QuizBuilderPage} />
        <Route path="/teacher/quizzes/:quizId/results" component={QuizResultsPage} />
        <Route path="/teacher/assignments" component={AssignmentsManagePage} />
        <Route path="/teacher/assignments/:assignmentId/submissions" component={AssignmentSubmissionsPage} />
        <Route path="/teacher/announcements" component={TeacherAnnouncementsPage} />
        <Route component={NotFound} />
      </Switch>
    </TeacherLayout>
  );
}

function AdminRoutes() {
  return (
    <AdminLayout>
      <Switch>
        <Route path="/admin/dashboard" component={AdminDashboardPage} />
        <Route path="/admin/boards" component={BoardsPage} />
        <Route path="/admin/boards/new" component={BoardEditorPage} />
        <Route path="/admin/boards/:id" component={BoardEditorPage} />
        <Route path="/admin/subjects" component={SubjectsTopicsPage} />
        <Route path="/admin/users" component={UsersPage} />
        <Route path="/admin/users/:id" component={UserDetailPage} />
        <Route path="/admin/moderation" component={ContentModerationPage} />
        <Route path="/admin/analytics" component={AnalyticsPage} />
        <Route path="/admin/settings" component={SystemSettingsPage} />
        <Route component={NotFound} />
      </Switch>
    </AdminLayout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
      <Route path="/boards" component={BoardSelectionPage} />
      <Route path="/student/:rest*" component={StudentRoutes} />
      <Route path="/teacher/:rest*" component={TeacherRoutes} />
      <Route path="/admin/:rest*" component={AdminRoutes} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
