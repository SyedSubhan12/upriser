import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import type { User, UserRole } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string | null;
  boardIds?: string[] | null;
  subjectIds?: string[] | null;
  password?: string | null;
  googleId?: string | null;
  authProvider?: string;
  isActive?: boolean;
  createdAt?: Date | null;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateUser: (updates: Partial<AuthUser>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(async () => {
    try {
      await apiRequest("POST", "/api/auth/logout");
    } catch {
      // Ignore errors during logout
    }
    setUser(null);
    localStorage.removeItem("upriser_user");
  }, []);

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/me", { credentials: "include" });
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
          localStorage.setItem("upriser_user", JSON.stringify(userData));
        } else {
          // Any non-OK status (401, 403, etc.) should be treated as logged out
          setUser(null);
          localStorage.removeItem("upriser_user");
        }
      } catch {
        const storedUser = localStorage.getItem("upriser_user");
        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser));
          } catch {
            localStorage.removeItem("upriser_user");
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Poll for user status changes (check if account was deactivated)
  useEffect(() => {
    if (!user) return;

    const checkUserStatus = async () => {
      try {
        const response = await fetch("/api/auth/me", { credentials: "include" });

        if (response.status === 403) {
          // Account has been deactivated - force logout
          console.log("Account deactivated, logging out...");
          logout();
        } else if (response.status === 401) {
          // Session expired or invalid
          logout();
        } else if (response.ok) {
          // Update user data if it changed
          const userData = await response.json();
          if (JSON.stringify(userData) !== JSON.stringify(user)) {
            setUser(userData);
            localStorage.setItem("upriser_user", JSON.stringify(userData));
          }
        }
      } catch (error) {
        console.error("Error checking user status:", error);
      }
    };

    // Check every 10 seconds for immediate response when account is deactivated
    const interval = setInterval(checkUserStatus, 10000);

    return () => clearInterval(interval);
  }, [user, logout]);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/auth/login", { email, password });
      const userData = await response.json();
      setUser(userData);
      localStorage.setItem("upriser_user", JSON.stringify(userData));
      setIsLoading(false);
      return { success: true };
    } catch (error) {
      setIsLoading(false);
      const errorMessage = error instanceof Error ? error.message : "Invalid email or password";
      return { success: false, error: errorMessage };
    }
  }, []);

  const updateUser = useCallback((updates: Partial<AuthUser>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...updates };
      localStorage.setItem("upriser_user", JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
