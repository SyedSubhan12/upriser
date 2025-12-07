import type { ReactNode } from "react";
import { Link } from "wouter";
import { GraduationCap, Sun, Moon } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";

interface PublicLayoutProps {
  children: ReactNode;
}

export function PublicLayout({ children }: PublicLayoutProps) {
  const { theme, toggleTheme } = useTheme();
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-50 flex h-14 items-center justify-between gap-4 border-b bg-background px-4 md:px-6">
        <Link href="/" data-testid="link-public-logo">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-foreground" />
            <span className="text-lg font-semibold">Upriser</span>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            data-testid="button-public-theme-toggle"
          >
            {theme === "light" ? (
              <Moon className="h-4 w-4" />
            ) : (
              <Sun className="h-4 w-4" />
            )}
            <span className="sr-only">Toggle theme</span>
          </Button>

          {isAuthenticated && user ? (
            <Link href={`/${user.role}/dashboard`}>
              <Button data-testid="button-go-to-dashboard">Dashboard</Button>
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" data-testid="button-public-login">
                  Login
                </Button>
              </Link>
              <Link href="/register">
                <Button data-testid="button-public-register">Register</Button>
              </Link>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t bg-background px-4 py-6 md:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Upriser Educational Platform
              </span>
            </div>
            <p className="text-sm text-muted-foreground" data-testid="text-copyright">
              {new Date().getFullYear()} Upriser. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
