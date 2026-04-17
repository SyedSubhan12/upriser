import React from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { OnboardingGate } from "@/components/onboarding";
import { RegistrationGate } from "@/components/RegistrationGate";
import { FeedbackPopup } from "@/components/FeedbackPopup";
import NotFound from "@/pages/not-found";

// PapaCambridge-Style Curriculum Navigation Pages
import { HomePage } from "@/pages/curriculum/HomePage";
import { BoardsListPage } from "@/pages/curriculum/BoardsListPage";
import { BoardDetailPage } from "@/pages/curriculum/BoardDetailPage";
import { BranchSelectorPage } from "@/pages/curriculum/BranchSelectorPage";
import { SubjectListPage } from "@/pages/curriculum/SubjectListPage";
import { IBSubjectGroupPage } from "@/pages/curriculum/IBSubjectGroupPage";
import { GlobalSubjectsPage } from "@/pages/subjects/SubjectsSearchPage";
import { SubjectResourceHub } from "@/pages/subject/SubjectResourceHub";
import { ResourceListPage } from "@/pages/subject/ResourceListPage";
import { FileBrowserPage } from "@/pages/subject/FileBrowserPage";
import { PDFViewerPage } from "@/pages/files/PDFViewerPage";
import { MultiViewPage } from "@/pages/files/MultiViewPage";
import { HelpPage } from "@/pages/help/HelpPage";

// Legacy Auth Pages (kept for backward compatibility)
import { LoginPage } from "@/pages/public/LoginPage";
import { RegisterPage } from "@/pages/public/RegisterPage";
import { TeacherEmailVerificationPage } from "@/pages/public/TeacherEmailVerificationPage";
import { BecomeTutorPage } from "@/pages/public/BecomeTutorPage";
import { BoardSelectionPage } from "@/pages/public/BoardSelectionPage";
import { TeacherProfilePage } from "@/pages/public/TeacherProfilePage";
import { TeacherPortfolioPage } from "@/pages/public/TeacherPortfolioPage";
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
import { StudentRegistrationPage } from "@/pages/student/StudentRegistrationPage";
import { McqPracticePage } from "@/pages/student/mcq/McqPracticePage";
import { McqSessionPage } from "@/pages/student/mcq/McqSessionPage";
import { McqStatsPage } from "@/pages/student/mcq/McqStatsPage";
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
import { McqManagerPage } from "@/pages/teacher/McqManagerPage";
import { TutorRegistrationPage } from "@/pages/teacher/TutorRegistrationPage";
import { TeacherResourcesPage } from "@/pages/teacher/TeacherResourcesPage";
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
import { FeedbackPage } from "@/pages/admin/FeedbackPage";
import { AdminResourceManagerPage } from "@/pages/admin/AdminResourceManagerPage";
import { TeacherApprovalPage } from "@/pages/admin/TeacherApprovalPage";
import { TeacherDetailPage } from "@/pages/admin/TeacherDetailPage";

function StudentRoutes() {
  return (
    <ProtectedRoute requiredAuth={true}>
      <StudentLayout>
        <Switch>
          <Route path="/student/registration" component={StudentRegistrationPage} />
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
          <Route path="/student/mcq/practice" component={McqPracticePage} />
          <Route path="/student/mcq/session/:id" component={McqSessionPage} />
          <Route path="/student/mcq/stats" component={McqStatsPage} />
          <Route component={NotFound} />
        </Switch>
      </StudentLayout>
    </ProtectedRoute>
  );
}

function TeacherLayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredAuth={true}>
      <TeacherLayout>
        {children}
      </TeacherLayout>
    </ProtectedRoute>
  );
}

function AdminLayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredAuth={true}>
      <AdminLayout>
        {children}
      </AdminLayout>
    </ProtectedRoute>
  );
}

function AppRouter() {
  return (
    <Switch>
      {/* ========================================= */}
      {/* PAPACAMBRIDGE-STYLE CURRICULUM NAVIGATION */}
      {/* Board → Qualification → Subject → Resources */}
      {/* ========================================= */}

      {/* Home - Entry point with board tiles */}
      <Route path="/" component={HomePage} />
      <Route path="/home" component={HomePage} />

      {/* Curriculum - Boards list */}
      <Route path="/curriculum" component={BoardsListPage} />

      {/* IB DP Subject Groups (must be before generic :boardKey route) */}
      <Route path="/curriculum/ib/dp/groups" component={IBSubjectGroupPage} />
      <Route path="/curriculum/ib/:programId/:groupId" component={SubjectListPage} />

      {/* Board Detail - Qualification/Program picker */}
      <Route path="/curriculum/:boardKey" component={BoardDetailPage} />

      {/* Branch Selector - Current vs Legacy (only when needed) */}
      <Route path="/curriculum/:boardKey/:qualKey/branch" component={BranchSelectorPage} />

      {/* Subject List - No branch */}
      <Route path="/curriculum/:boardKey/:qualKey/subjects" component={SubjectListPage} />

      {/* Subject List - With branch */}
      <Route path="/curriculum/:boardKey/:qualKey/:branchKey/subjects" component={SubjectListPage} />

      {/* Global Subjects Search */}
      <Route path="/subjects" component={GlobalSubjectsPage} />

      {/* Subject Resource Hub */}
      <Route path="/subject/:subjectId" component={SubjectResourceHub} />

      {/* Resource List (Past Papers, Notes, etc.) */}
      <Route path="/subject/:subjectId/resource/:resourceKey" component={ResourceListPage} />

      {/* File Browser */}
      <Route path="/subject/:subjectId/files" component={FileBrowserPage} />

      {/* PDF/File Viewer */}
      <Route path="/view/file/:fileId">
        <PDFViewerPage />
      </Route>
      <Route path="/view/multiview/:fileId1/:fileId2">
        <MultiViewPage />
      </Route>

      {/* Help page */}
      <Route path="/help" component={HelpPage} />

      {/* Become a Tutor Landing Page */}
      <Route path="/become-a-tutor" component={BecomeTutorPage} />

      {/* Public teacher profile (e.g., examsvalley.com/yasir) - MUST be before generic catch-alls */}
      <Route path="/t/:username" component={TeacherPortfolioPage} />

      {/* ========================================= */}
      {/* LEGACY AUTH ROUTES (Backward Compat)     */}
      {/* ========================================= */}

      {/* Auth routes - redirect to dashboard if already logged in */}
      <Route path="/login">
        <ProtectedRoute requiredAuth={false}>
          <LoginPage />
        </ProtectedRoute>
      </Route>
      <Route path="/register">
        <ProtectedRoute requiredAuth={false}>
          <RegisterPage />
        </ProtectedRoute>
      </Route>
      <Route path="/verify-teacher-email">
        <ProtectedRoute requiredAuth={false}>
          <TeacherEmailVerificationPage />
        </ProtectedRoute>
      </Route>

      {/* Board selection (legacy) */}
      <Route path="/boards" component={BoardSelectionPage} />

      {/* Protected routes - require authentication */}
      {/* Student Routes */}
      <Route path="/student/:rest*">
        <StudentRoutes />
      </Route>

      {/* Flat Teacher Routes */}
      <Route path="/teacher/dashboard"><TeacherLayoutWrapper><TeacherDashboardPage /></TeacherLayoutWrapper></Route>
      <Route path="/teacher/materials/new"><TeacherLayoutWrapper><MaterialEditorPage /></TeacherLayoutWrapper></Route>
      <Route path="/teacher/materials/:id"><TeacherLayoutWrapper><MaterialEditorPage /></TeacherLayoutWrapper></Route>
      <Route path="/teacher/materials"><TeacherLayoutWrapper><MyMaterialsPage /></TeacherLayoutWrapper></Route>
      <Route path="/teacher/resources"><TeacherLayoutWrapper><TeacherResourcesPage /></TeacherLayoutWrapper></Route>
      <Route path="/teacher/quizzes/new"><TeacherLayoutWrapper><QuizBuilderPage /></TeacherLayoutWrapper></Route>
      <Route path="/teacher/quizzes/:id"><TeacherLayoutWrapper><QuizBuilderPage /></TeacherLayoutWrapper></Route>
      <Route path="/teacher/quizzes/:quizId/results"><TeacherLayoutWrapper><QuizResultsPage /></TeacherLayoutWrapper></Route>
      <Route path="/teacher/quizzes"><TeacherLayoutWrapper><QuizListPage /></TeacherLayoutWrapper></Route>
      <Route path="/teacher/assignments/:assignmentId/submissions"><TeacherLayoutWrapper><AssignmentSubmissionsPage /></TeacherLayoutWrapper></Route>
      <Route path="/teacher/assignments"><TeacherLayoutWrapper><AssignmentsManagePage /></TeacherLayoutWrapper></Route>
      <Route path="/teacher/announcements"><TeacherLayoutWrapper><TeacherAnnouncementsPage /></TeacherLayoutWrapper></Route>
      <Route path="/teacher/mcq-manager"><TeacherLayoutWrapper><McqManagerPage /></TeacherLayoutWrapper></Route>
      <Route path="/teacher/registration"><TeacherLayoutWrapper><TutorRegistrationPage /></TeacherLayoutWrapper></Route>

      {/* Public teacher portfolio page — /teacher/:username (catch-all AFTER specific routes) */}
      <Route path="/teacher/:username">
        <TeacherPortfolioPage />
      </Route>

      {/* Flat Admin Routes */}
      <Route path="/admin/dashboard"><AdminLayoutWrapper><AdminDashboardPage /></AdminLayoutWrapper></Route>
      <Route path="/admin/boards/new"><AdminLayoutWrapper><BoardEditorPage /></AdminLayoutWrapper></Route>
      <Route path="/admin/boards/:id"><AdminLayoutWrapper><BoardEditorPage /></AdminLayoutWrapper></Route>
      <Route path="/admin/boards"><AdminLayoutWrapper><BoardsPage /></AdminLayoutWrapper></Route>
      <Route path="/admin/subjects"><AdminLayoutWrapper><SubjectsTopicsPage /></AdminLayoutWrapper></Route>
      <Route path="/admin/users/:id"><AdminLayoutWrapper><UserDetailPage /></AdminLayoutWrapper></Route>
      <Route path="/admin/users"><AdminLayoutWrapper><UsersPage /></AdminLayoutWrapper></Route>
      <Route path="/admin/teachers/:id"><AdminLayoutWrapper><TeacherDetailPage /></AdminLayoutWrapper></Route>
      <Route path="/admin/teachers"><AdminLayoutWrapper><TeacherApprovalPage /></AdminLayoutWrapper></Route>
      <Route path="/admin/moderation"><AdminLayoutWrapper><ContentModerationPage /></AdminLayoutWrapper></Route>
      <Route path="/admin/analytics"><AdminLayoutWrapper><AnalyticsPage /></AdminLayoutWrapper></Route>
      <Route path="/admin/settings"><AdminLayoutWrapper><SystemSettingsPage /></AdminLayoutWrapper></Route>
      <Route path="/admin/feedback"><AdminLayoutWrapper><FeedbackPage /></AdminLayoutWrapper></Route>
      <Route path="/admin/resources"><AdminLayoutWrapper><AdminResourceManagerPage /></AdminLayoutWrapper></Route>

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
            <FeedbackPopup delayMinutes={2} />
            <OnboardingGate>
              <RegistrationGate>
                <AppRouter />
              </RegistrationGate>
            </OnboardingGate>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
