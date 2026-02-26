/**
 * Enterprise Role Management System
 * 
 * This module handles secure role assignment and verification for users
 * based on email patterns, domain rules, and admin whitelists.
 * 
 * Security Principles:
 * 1. Never trust client-side role claims
 * 2. Always verify role from database on each request
 * 3. Use email patterns for automatic role assignment
 * 4. Require admin approval for privileged roles
 */

export type UserRole = "student" | "teacher" | "admin";

export interface RoleConfig {
    // List of admin emails (highest privilege)
    adminEmails: string[];

    // Email patterns for teachers (e.g., @teacher.school.edu)
    teacherDomains: string[];
    teacherEmailPatterns: RegExp[];

    // Email patterns for students (e.g., @student.school.edu)
    studentDomains: string[];
    studentEmailPatterns: RegExp[];

    // Default role for unmatched emails
    defaultRole: UserRole;

    // Whether to require admin approval for teacher role
    requireTeacherApproval: boolean;
}

/**
 * Default role configuration
 * Customize this based on your institution's email structure
 */
const defaultRoleConfig: RoleConfig = {
    // Hardcoded admin emails - these users get admin role automatically
    adminEmails: [
        // Add your admin emails here
        // "admin@school.edu",
        // "principal@school.edu",
    ],

    // Teacher email patterns
    teacherDomains: [
        // "teacher.school.edu",
        // "faculty.school.edu",
    ],
    teacherEmailPatterns: [
        // Uncomment and customize these patterns:
        // /^[a-zA-Z0-9._%+-]+@teacher\./i,
        // /^faculty\./i,
        // /^prof\./i,
    ],

    // Student email patterns
    studentDomains: [
        // "student.school.edu",
        // "students.school.edu",
    ],
    studentEmailPatterns: [
        // Uncomment and customize these patterns:
        // /^[a-zA-Z0-9._%+-]+@student\./i,
        // /^\d{6,}@/i, // Student IDs like 202401@school.edu
    ],

    // Default role for users who don't match any pattern
    defaultRole: "student",

    // If true, teachers need admin approval (role set to 'pending_teacher')
    requireTeacherApproval: false,
};

/**
 * Determine the appropriate role for a user based on their email
 * 
 * Priority order:
 * 1. Admin whitelist (highest priority)
 * 2. Teacher domain/pattern match
 * 3. Student domain/pattern match
 * 4. Default role
 */
export function determineRoleFromEmail(
    email: string,
    config: RoleConfig = defaultRoleConfig
): UserRole {
    const lowercaseEmail = email.toLowerCase();

    // 1. Check admin whitelist (highest priority)
    if (config.adminEmails.some(adminEmail =>
        adminEmail.toLowerCase() === lowercaseEmail
    )) {
        return "admin";
    }

    // 2. Check teacher patterns
    const isTeacher =
        config.teacherDomains.some(domain =>
            lowercaseEmail.endsWith(`@${domain.toLowerCase()}`)
        ) ||
        config.teacherEmailPatterns.some(pattern =>
            pattern.test(lowercaseEmail)
        );

    if (isTeacher) {
        return "teacher";
    }

    // 3. Check student patterns
    const isStudent =
        config.studentDomains.some(domain =>
            lowercaseEmail.endsWith(`@${domain.toLowerCase()}`)
        ) ||
        config.studentEmailPatterns.some(pattern =>
            pattern.test(lowercaseEmail)
        );

    if (isStudent) {
        return "student";
    }

    // 4. Return default role
    return config.defaultRole;
}

/**
 * Check if a user is authorized to access a specific role's resources
 */
export function isAuthorized(
    userRole: UserRole,
    requiredRole: UserRole
): boolean {
    const roleHierarchy: Record<UserRole, number> = {
        student: 1,
        teacher: 2,
        admin: 3,
    };

    return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

/**
 * Get allowed roles that a user can access
 */
export function getAllowedRoles(userRole: UserRole): UserRole[] {
    switch (userRole) {
        case "admin":
            return ["student", "teacher", "admin"];
        case "teacher":
            return ["student", "teacher"];
        case "student":
            return ["student"];
        default:
            return [];
    }
}

/**
 * Validate role transition (for role changes by admins)
 */
export function canChangeRole(
    currentUserRole: UserRole,
    targetRole: UserRole
): boolean {
    // Only admins can change roles
    if (currentUserRole !== "admin") {
        return false;
    }

    // Admins can change anyone to any role
    return true;
}

/**
 * Export the role configuration for use in auth.ts
 */
export { defaultRoleConfig };
