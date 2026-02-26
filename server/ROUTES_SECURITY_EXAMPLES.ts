/**
 * EXAMPLE: How to Secure Your Existing Routes
 * 
 * This file shows how to add role-based protection to your routes.ts
 * Copy these patterns to secure your API endpoints.
 */

import { Express } from "express";
import { requireAuth, requireRole, requireExactRole } from "./middleware/rbac";

// ============================================================================
// AUTHENTICATION ROUTES (Public - No Protection Needed)
// ============================================================================

app.post("/api/auth/login", authHandler);          // Public
app.post("/api/auth/register", authHandler);       // Public
app.get("/api/auth/google", googleAuthHandler);    // Public
app.get("/api/auth/google/callback", callbackHandler); // Public
app.post("/api/auth/logout", logoutHandler);       // Public

// ============================================================================
// USER PROFILE (Authenticated Users Only)
// ============================================================================

// Get current user - all authenticated users
app.get("/api/auth/me", requireAuth, (req, res) => {
    res.json(req.user);
});

// ============================================================================
// BOARDS (Admin can create/edit, Everyone can view)
// ============================================================================

// View all boards - anyone can view
app.get("/api/boards", async (req, res) => {
    const boards = await storage.getAllBoards();
    res.json(boards);
});

// Create board - ADMIN ONLY
app.post("/api/boards",
    requireAuth,
    requireRole("admin"),
    async (req, res) => {
        const board = await storage.createBoard(req.body);
        res.json(board);
    }
);

// Update board - ADMIN ONLY
app.patch("/api/boards/:id",
    requireAuth,
    requireRole("admin"),
    async (req, res) => {
        const board = await storage.updateBoard(req.params.id, req.body);
        res.json(board);
    }
);

// ============================================================================
// SUBJECTS (Admin can create/edit, Everyone can view)
// ============================================================================

app.get("/api/subjects", async (req, res) => {
    // Public - all users can view subjects
});

app.post("/api/subjects",
    requireAuth,
    requireRole("admin"),
    async (req, res) => {
        // ADMIN ONLY
    }
);

app.patch("/api/subjects/:id",
    requireAuth,
    requireRole("admin"),
    async (req, res) => {
        // ADMIN ONLY
    }
);

// ============================================================================
// MATERIALS (Teachers can create, Students can view)
// ============================================================================

// View materials - ALL authenticated users
app.get("/api/materials",
    requireAuth,
    async (req, res) => {
        const materials = await storage.getMaterialsByFilters(req.query);
        res.json(materials);
    }
);

// Create material - TEACHERS and ADMINS
app.post("/api/materials",
    requireAuth,
    requireRole("teacher"),
    async (req, res) => {
        const material = await storage.createMaterial(req.body);
        res.json(material);
    }
);

// Update material - TEACHERS and ADMINS
app.patch("/api/materials/:id",
    requireAuth,
    requireRole("teacher"),
    async (req, res) => {
        // TODO: Add check that teacher owns this material
        const material = await storage.updateMaterial(req.params.id, req.body);
        res.json(material);
    }
);

// ============================================================================
// QUIZZES (Teachers create, Students take)
// ============================================================================

// View all quizzes - ALL authenticated users
app.get("/api/quizzes",
    requireAuth,
    async (req, res) => {
        const quizzes = await storage.getQuizzesByFilters(req.query);
        res.json(quizzes);
    }
);

// Create quiz - TEACHERS and ADMINS ONLY
app.post("/api/quizzes",
    requireAuth,
    requireRole("teacher"),
    async (req, res) => {
        const quiz = await storage.createQuiz(req.body);
        res.json(quiz);
    }
);

// Update quiz - TEACHERS and ADMINS ONLY
app.patch("/api/quizzes/:id",
    requireAuth,
    requireRole("teacher"),
    async (req, res) => {
        const quiz = await storage.updateQuiz(req.params.id, req.body);
        res.json(quiz);
    }
);

// ============================================================================
// QUIZ ATTEMPTS (Students submit, Teachers can view all)
// ============================================================================

// Submit quiz attempt - STUDENTS can submit
app.post("/api/quiz-attempts",
    requireAuth,
    async (req, res) => {
        // Ensure student is submitting their own attempt
        const attempt = await storage.createQuizAttempt({
            ...req.body,
            userId: req.user!.id, // Force to be current user
        });
        res.json(attempt);
    }
);

// View all attempts - TEACHERS and ADMINS can view all, STUDENTS only their own
app.get("/api/quiz-attempts",
    requireAuth,
    async (req, res) => {
        const { userId, quizId } = req.query;

        // If student, force them to only see their own attempts
        if (req.user!.role === "student") {
            const attempts = await storage.getQuizAttemptsByUser(req.user!.id);
            return res.json(attempts);
        }

        // Teachers/Admins can view all
        if (userId) {
            const attempts = await storage.getQuizAttemptsByUser(userId as string);
            return res.json(attempts);
        }
        if (quizId) {
            const attempts = await storage.getQuizAttemptsByQuiz(quizId as string);
            return res.json(attempts);
        }

        return res.status(400).json({ error: "userId or quizId required" });
    }
);

// ============================================================================
// ASSIGNMENTS (Teachers create, Students submit)
// ============================================================================

// View all assignments - ALL authenticated users
app.get("/api/assignments",
    requireAuth,
    async (req, res) => {
        const assignments = await storage.getAllAssignments();
        res.json(assignments);
    }
);

// Create assignment - TEACHERS and ADMINS ONLY
app.post("/api/assignments",
    requireAuth,
    requireRole("teacher"),
    async (req, res) => {
        const assignment = await storage.createAssignment(req.body);
        res.json(assignment);
    }
);

// Update assignment - TEACHERS and ADMINS ONLY
app.patch("/api/assignments/:id",
    requireAuth,
    requireRole("teacher"),
    async (req, res) => {
        const assignment = await storage.updateAssignment(req.params.id, req.body);
        res.json(assignment);
    }
);

// ============================================================================
// SUBMISSIONS (Students submit, Teachers grade)
// ============================================================================

// Create submission - STUDENTS (their own work)
app.post("/api/submissions",
    requireAuth,
    requireExactRole(["student"]),
    async (req, res) => {
        const submission = await storage.createSubmission({
            ...req.body,
            userId: req.user!.id, // Force to be current user
            submittedAt: new Date(),
        });
        res.json(submission);
    }
);

// Update submission (grade it) - TEACHERS and ADMINS ONLY
app.patch("/api/submissions/:id",
    requireAuth,
    requireRole("teacher"),
    async (req, res) => {
        const submission = await storage.updateSubmission(req.params.id, req.body);
        res.json(submission);
    }
);

// ============================================================================
// ANNOUNCEMENTS (Admin/Teachers create, Everyone views)
// ============================================================================

// View announcements - ALL authenticated users
app.get("/api/announcements",
    requireAuth,
    async (req, res) => {
        const announcements = await storage.getAllAnnouncements();
        res.json(announcements);
    }
);

// Create announcement - TEACHERS and ADMINS
app.post("/api/announcements",
    requireAuth,
    requireRole("teacher"),
    async (req, res) => {
        const announcement = await storage.createAnnouncement(req.body);
        res.json(announcement);
    }
);

// Update announcement - TEACHERS and ADMINS
app.patch("/api/announcements/:id",
    requireAuth,
    requireRole("teacher"),
    async (req, res) => {
        const announcement = await storage.updateAnnouncement(req.params.id, req.body);
        res.json(announcement);
    }
);

// Delete announcement - ADMINS ONLY
app.delete("/api/announcements/:id",
    requireAuth,
    requireRole("admin"),
    async (req, res) => {
        await storage.deleteAnnouncement(req.params.id);
        res.json({ success: true });
    }
);

// ============================================================================
// USER MANAGEMENT (ADMIN ONLY)
// ============================================================================

// List all users - ADMIN ONLY
app.get("/api/users",
    requireAuth,
    requireRole("admin"),
    async (req, res) => {
        const users = await storage.getAllUsers(req.query);
        res.json(users);
    }
);

// Create user - ADMIN ONLY
app.post("/api/users",
    requireAuth,
    requireRole("admin"),
    async (req, res) => {
        const user = await storage.createUser(req.body);
        res.json(user);
    }
);

// Update user (including role changes) - ADMIN ONLY
app.patch("/api/users/:id",
    requireAuth,
    requireRole("admin"),
    async (req, res) => {
        const user = await storage.updateUser(req.params.id, req.body);
        res.json(user);
    }
);

// View single user - User can view themselves, Admin can view anyone
app.get("/api/users/:id",
    requireAuth,
    async (req, res) => {
        const requestedUserId = req.params.id;
        const currentUserId = req.user!.id;

        // Check if user is viewing their own profile or is admin
        if (requestedUserId !== currentUserId && req.user!.role !== "admin") {
            return res.status(403).json({
                error: "Forbidden",
                message: "You can only view your own profile"
            });
        }

        const user = await storage.getUser(requestedUserId);
        res.json(user);
    }
);

// ============================================================================
// SUMMARY OF PERMISSIONS
// ============================================================================

/**
 * BOARDS & SUBJECTS:
 *   - View: Public (no auth required)
 *   - Create/Edit: Admin only
 * 
 * MATERIALS:
 *   - View: All authenticated users
 *   - Create/Edit: Teachers and Admins
 * 
 * QUIZZES:
 *   - View: All authenticated users
 *   - Create/Edit: Teachers and Admins
 *   - Take: Students
 * 
 * ASSIGNMENTS:
 *   - View: All authenticated users
 *   - Create/Edit: Teachers and Admins
 *   - Submit: Students
 *   - Grade: Teachers and Admins
 * 
 * ANNOUNCEMENTS:
 *   - View: All authenticated users
 *   - Create/Edit: Teachers and Admins
 *   - Delete: Admins only
 * 
 * USER MANAGEMENT:
 *   - View All: Admins only
 *   - Create: Admins only
 *   - Update: Admins only (including role changes)
 *   - View Own Profile: All authenticated users
 */
