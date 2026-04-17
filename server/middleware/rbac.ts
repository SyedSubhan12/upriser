/**
 * Role-Based Access Control (RBAC) Middleware
 * 
 * Protects API routes by verifying user authentication and role permissions
 * Used by big tech companies to ensure data security between roles
 */

import { Request, Response, NextFunction } from "express";
import { storage } from "../storage.js";
import { UserRole, isAuthorized } from "../role-manager.js";

/**
 * Extend Express Request to include user
 */
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                email: string;
                name: string;
                role: UserRole;
                isActive: boolean;
                isApproved: boolean;
            };
        }
    }
}

/**
 * Middleware to require authentication
 * Attaches user object to req.user
 */
export async function requireAuth(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        // Check if user is authenticated via session
        if (!req.session.userId) {
            return res.status(401).json({
                error: "Not authenticated",
                message: "Please log in to access this resource"
            });
        }

        // Fetch user from database
        const user = await storage.getUser(req.session.userId);

        if (!user) {
            // User not found - clear invalid session
            req.session.destroy(() => { });
            return res.status(401).json({
                error: "User not found",
                message: "Your session is invalid. Please log in again."
            });
        }

        // Check if user account is active
        if (!user.isActive) {
            // Destroy session for deactivated users
            req.session.destroy(() => { });
            return res.status(403).json({
                error: "Account disabled",
                message: "Your account has been disabled. Please contact an administrator."
            });
        }

        // Attach user to request (without password)
        const { password: _, ...userWithoutPassword } = user;
        req.user = userWithoutPassword as any;

        next();
    } catch (error) {
        console.error("Auth middleware error:", error);
        return res.status(500).json({
            error: "Internal server error",
            message: "An error occurred while verifying authentication"
        });
    }
}

/**
 * Middleware to require account approval (for teachers)
 * Non-teachers (students, admins) are considered approved by default
 */
export async function requireApproved(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        if (!req.user) {
            return res.status(401).json({
                error: "Not authenticated",
                message: "Please log in to access this resource"
            });
        }

        // Only teachers need to check for approval
        if (req.user.role === "teacher" && !req.user.isApproved) {
            return res.status(403).json({
                error: "Approval pending",
                message: "Your teacher account is pending admin approval. You have read-only access for now."
            });
        }

        next();
    } catch (error) {
        console.error("Approval middleware error:", error);
        return res.status(500).json({
            error: "Internal server error",
            message: "An error occurred while verifying account status"
        });
    }
}

/**
 * Middleware factory to require a specific role or higher
 * 
 * @param requiredRole - Minimum role required to access the route
 * @returns Express middleware function
 * 
 * @example
 * // Only teachers and admins can access
 * app.get("/api/grades", requireAuth, requireRole("teacher"), handler);
 * 
 * // Only admins can access
 * app.delete("/api/users/:id", requireAuth, requireRole("admin"), handler);
 */
export function requireRole(requiredRole: UserRole) {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            // User should be attached by requireAuth middleware
            if (!req.user) {
                return res.status(401).json({
                    error: "Not authenticated",
                    message: "Please log in to access this resource"
                });
            }

            // Check if user's role is authorized
            if (!isAuthorized(req.user.role, requiredRole)) {
                return res.status(403).json({
                    error: "Forbidden",
                    message: `This resource requires ${requiredRole} role or higher. Your role: ${req.user.role}`
                });
            }

            next();
        } catch (error) {
            console.error("Role middleware error:", error);
            return res.status(500).json({
                error: "Internal server error",
                message: "An error occurred while verifying permissions"
            });
        }
    };
}

/**
 * Middleware to require specific roles (exact match)
 * 
 * @param allowedRoles - Array of roles that can access the route
 * 
 * @example
 * // Only students can access
 * app.get("/api/student/assignments", requireAuth, requireExactRole(["student"]), handler);
 */
export function requireExactRole(allowedRoles: UserRole[]) {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    error: "Not authenticated",
                    message: "Please log in to access this resource"
                });
            }

            if (!allowedRoles.includes(req.user.role)) {
                return res.status(403).json({
                    error: "Forbidden",
                    message: `This resource is only accessible to: ${allowedRoles.join(", ")}. Your role: ${req.user.role}`
                });
            }

            next();
        } catch (error) {
            console.error("Exact role middleware error:", error);
            return res.status(500).json({
                error: "Internal server error",
                message: "An error occurred while verifying permissions"
            });
        }
    };
}

/**
 * Middleware to check if user owns the resource or is an admin
 * Useful for endpoints like /api/users/:id where users can only access their own data
 * 
 * @param userIdParam - Name of the route parameter containing user ID (default: "userId")
 */
export function requireOwnershipOrAdmin(userIdParam: string = "userId") {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    error: "Not authenticated",
                    message: "Please log in to access this resource"
                });
            }

            const targetUserId = req.params[userIdParam];

            // Allow if user is admin or accessing their own resource
            if (req.user.role === "admin" || req.user.id === targetUserId) {
                next();
            } else {
                return res.status(403).json({
                    error: "Forbidden",
                    message: "You can only access your own resources"
                });
            }
        } catch (error) {
            console.error("Ownership middleware error:", error);
            return res.status(500).json({
                error: "Internal server error",
                message: "An error occurred while verifying permissions"
            });
        }
    };
}
