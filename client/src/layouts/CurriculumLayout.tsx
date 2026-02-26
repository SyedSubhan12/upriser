import type { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { GraduationCap, Sun, Moon, LogIn, UserPlus } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

interface CurriculumLayoutProps {
    children: ReactNode;
}

export function CurriculumLayout({ children }: CurriculumLayoutProps) {
    const { theme, toggleTheme } = useTheme();
    const { user } = useAuth();
    const [location] = useLocation();

    const navItems = [
        { name: "Home", href: "/" },
        { name: "Curriculum", href: "/curriculum" },
        { name: "Subjects", href: "/subjects" },
        { name: "Help", href: "/help" },
    ];

    const isActive = (href: string) => {
        if (href === "/") return location === "/" || location === "/home";
        return location.startsWith(href);
    };

    return (
        <div className="flex min-h-screen flex-col">
            {/* Top Navigation Bar */}
            <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
                    {/* Logo */}
                    <Link href="/">
                        <div className="flex cursor-pointer items-center gap-2">
                            <GraduationCap className="h-6 w-6 text-primary" />
                            <span className="text-xl font-semibold tracking-tight">Upriser</span>
                        </div>
                    </Link>

                    {/* Navigation Links */}
                    <nav className="hidden md:flex items-center gap-6">
                        {navItems.map((item) => (
                            <Link key={item.name} href={item.href}>
                                <span
                                    className={`text-sm font-medium transition-colors hover:text-primary ${isActive(item.href)
                                        ? "text-foreground"
                                        : "text-muted-foreground"
                                        }`}
                                >
                                    {item.name}
                                </span>
                            </Link>
                        ))}
                    </nav>

                    {/* Right Side Actions */}
                    <div className="flex items-center gap-2">
                        {/* Theme Toggle */}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={toggleTheme}
                            className="h-9 w-9"
                        >
                            {theme === "light" ? (
                                <Moon className="h-4 w-4" />
                            ) : (
                                <Sun className="h-4 w-4" />
                            )}
                            <span className="sr-only">Toggle theme</span>
                        </Button>

                        {/* Auth Buttons (only show if not logged in) */}
                        {!user && (
                            <>
                                <Link href="/login">
                                    <Button variant="ghost" size="sm" className="hidden sm:flex">
                                        <LogIn className="mr-2 h-4 w-4" />
                                        Login
                                    </Button>
                                </Link>
                                <Link href="/register">
                                    <Button size="sm" className="hidden sm:flex">
                                        <UserPlus className="mr-2 h-4 w-4" />
                                        Sign Up
                                    </Button>
                                </Link>
                            </>
                        )}

                        {/* User Dashboard Link (if logged in) */}
                        {user && (
                            <Link href={`/${user.role}/dashboard`}>
                                <Button size="sm">
                                    Dashboard
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>

                {/* Mobile Navigation */}
                <div className="flex md:hidden border-t">
                    <nav className="mx-auto flex w-full max-w-lg items-center justify-around py-2">
                        {navItems.map((item) => (
                            <Link key={item.name} href={item.href}>
                                <span
                                    className={`text-xs font-medium transition-colors hover:text-primary px-3 py-2 ${isActive(item.href)
                                        ? "text-foreground"
                                        : "text-muted-foreground"
                                        }`}
                                >
                                    {item.name}
                                </span>
                            </Link>
                        ))}
                    </nav>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1">{children}</main>

            {/* Footer */}
            <footer className="border-t bg-background/80 backdrop-blur-sm px-4 py-6 md:px-6">
                <div className="mx-auto max-w-7xl">
                    <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                        <div className="flex items-center gap-2">
                            <GraduationCap className="h-5 w-5 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                                Upriser Educational Platform
                            </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            © {new Date().getFullYear()} Upriser. All rights reserved.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
