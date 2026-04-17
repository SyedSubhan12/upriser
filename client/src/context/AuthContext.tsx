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

interface LoginResult {
  success: boolean;
  error?: string;
  needsEmailVerification?: boolean;
  email?: string;
  maskedEmail?: string;
  needsApproval?: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
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
    localStorage.removeItem("ExamsValley_user");
  }, []);

  // Check authentication status
  useEffect(() => {
    const controller = new AbortController();
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/me", { 
          credentials: "include",
          signal: controller.signal
        });
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
          localStorage.setItem("ExamsValley_user", JSON.stringify(userData));
        } else {
          // Any non-OK status (401, 403, etc.) should be treated as logged out
          setUser(null);
          localStorage.removeItem("ExamsValley_user");
        }
      } catch (error: any) {
        if (error.name === 'AbortError') return;
        
        const storedUser = localStorage.getItem("ExamsValley_user");
        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser));
          } catch {
            localStorage.removeItem("ExamsValley_user");
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
    return () => controller.abort();
  }, []);

  // Poll for user status changes (check if account was deactivated)
  useEffect(() => {
    if (!user) return;

    const controller = new AbortController();
    const checkUserStatus = async () => {
      try {
        const response = await fetch("/api/auth/me", { 
          credentials: "include",
          signal: controller.signal
        });

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
            localStorage.setItem("ExamsValley_user", JSON.stringify(userData));
          }
        }
      } catch (error: any) {
        if (error.name === 'AbortError') return;
        console.error("Error checking user status:", error);
      }
    };

    // Check every 10 seconds for immediate response when account is deactivated
    const interval = setInterval(checkUserStatus, 10000);

    return () => {
      clearInterval(interval);
      controller.abort();
    };
  }, [user, logout]);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        setIsLoading(false);
        return {
          success: false,
          error: payload?.message || payload?.error || "Invalid email or password",
          needsEmailVerification: payload?.needsEmailVerification,
          email: payload?.email,
          maskedEmail: payload?.maskedEmail,
          needsApproval: payload?.needsApproval,
        };
      }

      const userData = payload;
      setUser(userData);
      localStorage.setItem("ExamsValley_user", JSON.stringify(userData));
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
      localStorage.setItem("ExamsValley_user", JSON.stringify(updated));
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
