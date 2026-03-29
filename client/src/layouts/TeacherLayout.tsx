import type { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import {
  Home,
  LayoutDashboard,
  FileText,
  HelpCircle,
  ClipboardList,
  BarChart3,
  Bell,
  Sun,
  Moon,
  LogOut,
  GraduationCap,
  Brain,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { RoleSwitcher } from "@/components/layout/RoleSwitcher";

const MENU_ITEMS = [
  { title: "Home", url: "/", icon: Home },
  { title: "Dashboard", url: "/teacher/dashboard", icon: LayoutDashboard },
  { title: "My Materials", url: "/teacher/materials", icon: FileText },
  { title: "Quizzes", url: "/teacher/quizzes", icon: HelpCircle },
  { title: "MCQ Manager", url: "/teacher/mcq-manager", icon: Brain },
  { title: "Assignments", url: "/teacher/assignments", icon: ClipboardList },
  { title: "Analytics", url: "/teacher/analytics", icon: BarChart3 },
  { title: "Announcements", url: "/teacher/announcements", icon: Bell },
];

interface TeacherLayoutProps {
  children: ReactNode;
}

export function TeacherLayout({ children }: TeacherLayoutProps) {
  const [location, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const handleLogout = async () => {
    await logout();
    setLocation('/'); // Redirect to home page after logout
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={sidebarStyle as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <Sidebar>
          <SidebarHeader className="border-b">
            <Link href="/teacher/dashboard" data-testid="link-teacher-logo">
              <div className="flex items-center gap-2 px-2 py-1">
                <GraduationCap className="h-6 w-6" />
                <span className="text-lg font-semibold">ExamsValley</span>
              </div>
            </Link>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Navigation</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {MENU_ITEMS.map((item) => {
                    const isActive = location === item.url || location.startsWith(item.url + "/");
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive}
                          tooltip={item.title}
                        >
                          <Link
                            href={item.url}
                            data-testid={`link-teacher-${item.title.toLowerCase().replace(/\s+/g, "-")}`}
                          >
                            <item.icon className="h-4 w-4" />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="border-t">
            <div className="flex items-center gap-2 p-2">
              <Avatar className="h-8 w-8">
                {user?.avatar && <AvatarImage src={user.avatar} alt={user?.name} />}
                <AvatarFallback>{user ? getInitials(user.name) : "U"}</AvatarFallback>
              </Avatar>
              <div className="flex flex-1 flex-col overflow-hidden group-data-[collapsible=icon]:hidden">
                <span className="truncate text-sm font-medium" data-testid="text-teacher-user-name">
                  {user?.name}
                </span>
                <RoleSwitcher />
              </div>
            </div>
            <div className="px-2 pb-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="w-full justify-start"
                data-testid="button-teacher-logout"
              >
                <LogOut className="h-4 w-4 mr-2" />
                <span className="group-data-[collapsible=icon]:hidden">Logout</span>
              </Button>
            </div>
          </SidebarFooter>
        </Sidebar>
        <div className="flex flex-1 flex-col overflow-hidden">
          <header className="flex h-14 items-center justify-between gap-4 border-b bg-background px-4">
            <SidebarTrigger data-testid="button-teacher-sidebar-toggle" />
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                data-testid="button-teacher-theme-toggle"
              >
                {theme === "light" ? (
                  <Moon className="h-4 w-4" />
                ) : (
                  <Sun className="h-4 w-4" />
                )}
                <span className="sr-only">Toggle theme</span>
              </Button>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
