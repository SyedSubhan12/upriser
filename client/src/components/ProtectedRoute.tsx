import { useAuth } from "@/context/AuthContext";
import { useLocation } from "wouter";
import { useEffect } from "react";
import type { ReactNode } from "react";

interface ProtectedRouteProps {
    children: ReactNode;
    requiredAuth?: boolean; // If true, user must be logged in
}

/**
 * ProtectedRoute component
 * Protects routes by checking authentication status
 * Redirects to appropriate pages based on auth state
 */
export function ProtectedRoute({ children, requiredAuth = true }: ProtectedRouteProps) {
    const { user, isLoading } = useAuth();
    const [, setLocation] = useLocation();

    useEffect(() => {
        // Wait for auth check to complete
        if (isLoading) return;

        // If route requires auth and user is not logged in, redirect to login
        if (requiredAuth && !user) {
            setLocation("/login");
            return;
        }

        // If route is public (like login/register) and user IS logged in, redirect to their dashboard
        if (!requiredAuth && user) {
            // Redirect to role-specific dashboard
            const dashboardPath = `/${user.role}/dashboard`;
            setLocation(dashboardPath);
        }
    }, [user, isLoading, requiredAuth, setLocation]);

    // Show loading or nothing while checking auth
    if (isLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <div className="text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
                    <p className="mt-4 text-sm text-muted-foreground">Loading...</p>
                </div>
            </div>
        );
    }

    // If route requires auth and user is not logged in, don't render (redirect will happen)
    if (requiredAuth && !user) {
        return null;
    }

    // If route is public and user is logged in, don't render (redirect will happen)
    if (!requiredAuth && user) {
        return null;
    }

    return <>{children}</>;
}
