import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import path from "path";
import fs from "fs";
import multer from "multer";

import { storage } from "./storage";
import { z } from "zod";
import { passport } from "./auth";
import bcrypt from "bcrypt";
import { registerAdminRoutes } from "./admin-routes";
import { requireAuth, requireRole } from "./middleware/rbac";
import { authLimiter, apiLimiter } from "./middleware/rate-limit";
import { uploadPdf, validatePdf, checkDuplicate, buildObjectKey, getPublicUrl, enrichFileWithUrl } from "./supabase-storage";

// Configure multer for file uploads (in-memory storage)
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 100 * 1024 * 1024 } });
import {
  insertUserSchema,
  insertBoardSchema,
  insertSubjectSchema,
  insertTopicSchema,
  insertMaterialSchema,
  insertQuizSchema,
  insertQuestionSchema,
  insertQuizAttemptSchema,
  insertAssignmentSchema,
  insertSubmissionSchema,
  insertAnnouncementSchema,
  insertUserProfileSchema,
  insertUserPreferencesSchema,
  insertUserSubjectSchema,
  insertFeedbackSchema
} from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.use((req, res, next) => {
    res.setHeader('Content-Type', 'application/json');
    next();
  });

  app.post("/api/auth/login", authLimiter, async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Verify password using bcrypt
      const isPasswordValid = user.password ? await bcrypt.compare(password, user.password) : false;
      if (!isPasswordValid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      if (!user.isActive) {
        return res.status(403).json({ error: "Account is disabled" });
      }

      req.session.userId = user.id;

      // Update last login timestamp
      const updated = await storage.updateUser(user.id, {
        lastLoginAt: new Date(),
      });

      const safeUser = updated ?? user;
      const { password: _, ...userWithoutPassword } = safeUser;
      return res.json(userWithoutPassword);
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/auth/logout", async (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Failed to logout" });
      }
      res.clearCookie("connect.sid");
      return res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user) {
        req.session.destroy(() => { });
        return res.status(401).json({ error: "User not found" });
      }

      if (!user.isActive) {
        req.session.destroy(() => { });
        res.clearCookie("connect.sid");
        return res.status(403).json({ error: "Account disabled" });
      }

      const { password: _, ...userWithoutPassword } = user;
      return res.json(userWithoutPassword);
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  });


  // Google OAuth routes
  app.get("/api/auth/google", (req: Request, res: Response, next) => {
    passport.authenticate("google", { scope: ["profile", "email"] })(req, res, next);
  });

  app.get("/api/auth/google/callback", (req: Request, res: Response, next) => {
    passport.authenticate("google", { failureRedirect: "/login?error=auth_failed" })(req, res, () => {
      // User authenticated, set session
      const user = (req as any).user;
      if (user) {
        req.session.userId = user.id;
      }
      // Redirect to appropriate dashboard based on role
      const dashboardMap: Record<string, string> = {
        student: '/student/dashboard',
        teacher: '/teacher/dashboard',
        admin: '/admin/dashboard'
      };
      const redirectPath = user?.role ? dashboardMap[user.role] : '/';
      res.redirect(redirectPath);
    });
  });

  // Email/password registration
  app.post("/api/auth/register", authLimiter, async (req: Request, res: Response) => {
    try {
      const { email, password, name, role } = req.body;
      if (!email || !password || !name) {
        return res.status(400).json({ error: "Email, password, and name are required" });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({ error: "User with this email already exists" });
      }

      // Hash password before storing
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = await storage.createUser({
        email,
        password: hashedPassword,
        name,
        role: role || "student",
        authProvider: "local",
        isActive: true,
      });

      req.session.userId = user.id;
      const { password: _, ...userWithoutPassword } = user;
      return res.status(201).json(userWithoutPassword);
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // ============================================================================
  // ONBOARDING API ROUTES (Anonymous User Support)
  // Big Tech pattern: device-based ID with localStorage + optional server sync
  // ============================================================================

  // Initialize or retrieve anonymous user profile by device ID
  app.post("/api/onboarding/init", async (req: Request, res: Response) => {
    try {
      const { deviceId } = req.body;

      if (!deviceId || typeof deviceId !== "string" || deviceId.length < 20) {
        return res.status(400).json({ error: "Valid deviceId is required" });
      }

      // Check if profile exists
      let profile = await storage.getUserProfileByDeviceId(deviceId);

      if (!profile) {
        // Create new profile
        profile = await storage.createUserProfile({
          deviceId,
          userAgent: req.headers["user-agent"] || null,
        });
      } else {
        // Update last seen
        await storage.updateUserProfile(profile.id, {
          lastSeenAt: new Date(),
          userAgent: req.headers["user-agent"] || null,
        });
      }

      // Get preferences if they exist
      const preferences = await storage.getUserPreferences(profile.id);
      const subjects = await storage.getUserSubjects(profile.id);

      return res.json({
        profileId: profile.id,
        deviceId: profile.deviceId,
        onboardingCompleted: preferences?.onboardingCompleted ?? false,
        preferences: preferences ? {
          boardKey: preferences.boardKey,
          qualKey: preferences.qualKey,
          programKey: preferences.programKey,
          studyMinutesDaily: preferences.studyMinutesDaily,
          difficulty: preferences.difficulty,
          resourceFocus: preferences.resourceFocus,
          examSessionTarget: preferences.examSessionTarget,
        } : null,
        subjectIds: subjects.map(s => s.subjectId),
      });
    } catch (error) {
      console.error("Error in onboarding init:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Complete onboarding - save all preferences
  app.post("/api/onboarding/complete", async (req: Request, res: Response) => {
    try {
      const { deviceId, boardKey, qualKey, programKey, subjectIds, preferences } = req.body;

      if (!deviceId || typeof deviceId !== "string") {
        return res.status(400).json({ error: "deviceId is required" });
      }

      // Get or create profile
      let profile = await storage.getUserProfileByDeviceId(deviceId);
      if (!profile) {
        profile = await storage.createUserProfile({
          deviceId,
          userAgent: req.headers["user-agent"] || null,
        });
      }

      // Save preferences
      await storage.upsertUserPreferences({
        profileId: profile.id,
        boardKey: boardKey || null,
        qualKey: qualKey || null,
        programKey: programKey || null,
        studyMinutesDaily: preferences?.studyMinutesDaily ?? 30,
        difficulty: preferences?.difficulty ?? "medium",
        resourceFocus: preferences?.resourceFocus ?? [],
        examSessionTarget: preferences?.examSessionTarget || null,
        onboardingCompleted: true,
      });

      // Save subjects
      if (Array.isArray(subjectIds)) {
        await storage.setUserSubjects(profile.id, subjectIds);
      }

      return res.json({
        success: true,
        profileId: profile.id,
        message: "Onboarding completed successfully",
      });
    } catch (error) {
      console.error("Error completing onboarding:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get preferences for current device
  app.get("/api/me/preferences", async (req: Request, res: Response) => {
    try {
      const deviceId = req.query.deviceId as string;

      if (!deviceId) {
        return res.status(400).json({ error: "deviceId query parameter is required" });
      }

      const profile = await storage.getUserProfileByDeviceId(deviceId);
      if (!profile) {
        return res.status(404).json({ error: "Profile not found" });
      }

      const preferences = await storage.getUserPreferences(profile.id);
      const subjects = await storage.getUserSubjects(profile.id);

      return res.json({
        profileId: profile.id,
        onboardingCompleted: preferences?.onboardingCompleted ?? false,
        preferences: preferences ? {
          boardKey: preferences.boardKey,
          qualKey: preferences.qualKey,
          programKey: preferences.programKey,
          studyMinutesDaily: preferences.studyMinutesDaily,
          difficulty: preferences.difficulty,
          resourceFocus: preferences.resourceFocus,
          examSessionTarget: preferences.examSessionTarget,
          theme: preferences.theme,
          language: preferences.language,
        } : null,
        subjectIds: subjects.map(s => s.subjectId),
      });
    } catch (error) {
      console.error("Error fetching preferences:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Register admin-specific routes (all protected by requireAuth + requireRole("admin"))
  registerAdminRoutes(app);

  app.get("/api/boards", async (_req: Request, res: Response) => {
    try {
      const boards = await storage.getAllBoards();
      return res.json(boards);
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/boards/:id", async (req: Request, res: Response) => {
    try {
      const board = await storage.getBoard(req.params.id);
      if (!board) {
        return res.status(404).json({ error: "Board not found" });
      }
      return res.json(board);
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/boards", apiLimiter, requireAuth, requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const parsed = insertBoardSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.message });
      }

      const board = await storage.createBoard(parsed.data);
      return res.status(201).json(board);
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.patch("/api/boards/:id", apiLimiter, requireAuth, requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const board = await storage.updateBoard(req.params.id, req.body);
      if (!board) {
        return res.status(404).json({ error: "Board not found" });
      }
      return res.json(board);
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/subjects", async (req: Request, res: Response) => {
    try {
      const { boardId } = req.query;
      let subjects;
      if (boardId && typeof boardId === "string") {
        subjects = await storage.getSubjectsByBoard(boardId);
      } else {
        subjects = await storage.getAllSubjects();
      }
      const data = subjects.map(s => ({
        ...s,
        name: s.subjectName,
        code: s.subjectCode,
        isActive: s.isActive // ensure this is present
      }));
      return res.json(data);
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/subjects/:id", async (req: Request, res: Response) => {
    try {
      const subject = await storage.getSubject(req.params.id);
      if (!subject) {
        return res.status(404).json({ error: "Subject not found" });
      }
      return res.json({
        ...subject,
        name: subject.subjectName,
        code: subject.subjectCode,
        isActive: subject.isActive
      });
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // ============================================================================
  // PAPACAMBRIDGE-STYLE CURRICULUM ROUTES
  // ============================================================================

  app.get("/api/curriculum/boards", async (_req: Request, res: Response) => {
    try {
      const boards = await storage.getAllBoards();
      // Filter out disabled boards for the public site
      return res.json(boards.filter(b => b.isEnabled));
    } catch (error) {
      console.error("Error fetching curriculum boards:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/curriculum/boards/:boardKey/qualifications", async (req: Request, res: Response) => {
    try {
      const board = await storage.getBoardByKey(req.params.boardKey);
      if (!board) return res.status(404).json({ error: "Board not found" });

      const quals = await storage.getQualificationsByBoard(board.id);
      return res.json(quals);
    } catch (error) {
      console.error("Error fetching qualifications:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/curriculum/qualifications/:qualId/subjects", async (req: Request, res: Response) => {
    try {
      const { branchId } = req.query;
      const subjects = await storage.getSubjectsByQualification(
        req.params.qualId,
        branchId as string | undefined
      );
      return res.json(subjects);
    } catch (error) {
      console.error("Error fetching subjects by qualification:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/curriculum/subjects", async (_req: Request, res: Response) => {
    try {
      const subjects = await storage.getAllSubjects();
      return res.json(subjects);
    } catch (error) {
      console.error("Error fetching all subjects:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/curriculum/qualifications/:qualId/branches", async (req: Request, res: Response) => {
    try {
      const branches = await storage.getBranchesByQualification(req.params.qualId);
      return res.json(branches);
    } catch (error) {
      console.error("Error fetching branches:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/curriculum/subject-groups/:programId", async (req: Request, res: Response) => {
    try {
      const groups = await storage.getSubjectGroupsByProgram(req.params.programId);
      return res.json(groups);
    } catch (error) {
      console.error("Error fetching subject groups:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/curriculum/subjects/:subjectId/context", async (req: Request, res: Response) => {
    try {
      const context = await storage.getSubjectWithContext(req.params.subjectId);
      if (!context) return res.status(404).json({ error: "Subject not found" });
      return res.json(context);
    } catch (error) {
      console.error("Error fetching subject context:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/curriculum/subjects/:subjectId/resource-nodes", async (req: Request, res: Response) => {
    try {
      const { resourceKey, parentNodeId } = req.query;
      if (!resourceKey) return res.status(400).json({ error: "resourceKey is required" });

      const nodes = await storage.getResourceNodes(
        req.params.subjectId,
        resourceKey as string,
        parentNodeId as string | undefined
      );
      return res.json(nodes);
    } catch (error) {
      console.error("Error fetching resource nodes:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/curriculum/subjects/:subjectId/resource/:resourceKey/files", async (req: Request, res: Response) => {
    try {
      const files = await storage.getFileAssetsBySubjectAndResource(
        req.params.subjectId,
        req.params.resourceKey
      );
      return res.json(files);
    } catch (error) {
      console.error("Error fetching resource files:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });


  app.get("/api/curriculum/resource-categories", async (_req: Request, res: Response) => {
    try {
      const categories = await storage.getResourceCategories();
      return res.json(categories);
    } catch (error) {
      console.error("Error fetching resource categories:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });


  // Get resource nodes for a subject and resource type
  app.get("/api/curriculum/subjects/:subjectId/resource/:resourceKey/nodes", async (req: Request, res: Response) => {
    try {
      const { parentNodeId } = req.query;
      const nodes = await storage.getResourceNodes(
        req.params.subjectId,
        req.params.resourceKey,
        parentNodeId as string | null | undefined
      );
      return res.json(nodes);
    } catch (error) {
      console.error("Error fetching resource nodes:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get a single resource node by ID
  app.get("/api/curriculum/nodes/:nodeId", async (req: Request, res: Response) => {
    try {
      const node = await storage.getResourceNode(req.params.nodeId);
      if (!node) {
        return res.status(404).json({ error: "Node not found" });
      }
      return res.json(node);
    } catch (error) {
      console.error("Error fetching resource node:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get files for a specific node
  app.get("/api/curriculum/nodes/:nodeId/files", async (req: Request, res: Response) => {
    try {
      const files = await storage.getFileAssets(req.params.nodeId);
      // Enrich each file with Supabase URL if available
      const enrichedFiles = files.map(enrichFileWithUrl);
      return res.json(enrichedFiles);
    } catch (error) {
      console.error("Error fetching files:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });


  // Get a single file by ID
  app.get("/api/curriculum/files/:fileId", async (req: Request, res: Response) => {
    try {
      const file = await storage.getFileAsset(req.params.fileId);
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }

      // Enrich with Supabase URL or fallback to local
      const enrichedFile = enrichFileWithUrl(file);
      return res.json(enrichedFile);
    } catch (error) {
      console.error("Error fetching file:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Serve the raw file content
  app.get("/api/curriculum/files/:fileId/raw", async (req: Request, res: Response) => {
    try {
      const file = await storage.getFileAsset(req.params.fileId);
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }

      const filePath = path.resolve(process.cwd(), "storage", file.fileName);
      if (!fs.existsSync(filePath)) {
        console.error(`File not found on disk: ${filePath}`);
        return res.status(404).json({ error: "File content not found" });
      }

      res.setHeader("Content-Type", file.mimeType || "application/pdf");
      res.setHeader("Content-Disposition", `inline; filename="${file.fileName}"`);
      return res.sendFile(filePath);
    } catch (error) {
      console.error("Error serving raw file:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // ============================================================================
  // SUPABASE FILE MANAGEMENT ROUTES
  // ============================================================================

  // Upload a single PDF file
  app.post("/api/curriculum/files/upload", apiLimiter, upload.single('file'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file provided' });
      }

      // Validate PDF
      const validation = validatePdf(req.file);
      if (!validation.valid) {
        return res.status(400).json({ error: validation.error });
      }

      const { subjectId, resourceKey, nodeId, fileType, year, session, paper, variant, title, boardKey, qualKey, subjectSlug } = req.body;

      if (!subjectId || !resourceKey || !nodeId || !fileType) {
        return res.status(400).json({ error: 'subjectId, resourceKey, nodeId, and fileType are required' });
      }

      // Build object key for Supabase Storage
      const objectKey = buildObjectKey({
        boardKey: boardKey || 'unknown',
        qualKey: qualKey || 'unknown',
        subjectSlug: subjectSlug || 'unknown',
        resourceKey,
        fileName: req.file.originalname,
        year: year ? parseInt(year) : undefined,
        session: session || undefined,
      });

      // Check for duplicates
      const isDuplicate = await checkDuplicate(objectKey);
      if (isDuplicate) {
        return res.status(409).json({ error: 'A file with this path already exists', objectKey });
      }

      // Upload to Supabase Storage
      const uploadResult = await uploadPdf(req.file.buffer, objectKey, req.file.mimetype);
      if (!uploadResult.success) {
        return res.status(500).json({ error: uploadResult.error });
      }

      // Insert metadata into database
      const fileAsset = await storage.createFileAsset({
        subjectId,
        resourceKey,
        nodeId,
        title: title || req.file.originalname,
        fileName: req.file.originalname,
        mimeType: req.file.mimetype,
        fileSize: req.file.size,
        fileType,
        year: year ? parseInt(year) : null,
        session: session || null,
        paper: paper ? parseInt(paper) : null,
        variant: variant ? parseInt(variant) : null,
        objectKey,
        url: uploadResult.publicUrl,
        isPublic: true,
      });

      return res.status(201).json({
        status: 'success',
        details: enrichFileWithUrl(fileAsset),
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Increment download count
  app.post("/api/curriculum/files/:fileId/download", async (req: Request, res: Response) => {
    try {
      const file = await storage.getFileAsset(req.params.fileId);
      if (!file) {
        return res.status(404).json({ error: 'File not found' });
      }

      await storage.incrementDownloadCount(req.params.fileId);
      return res.json({ status: 'success', downloadCount: (file.downloadCount || 0) + 1 });
    } catch (error) {
      console.error('Error incrementing download count:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Paginated file listing with filters
  app.get("/api/curriculum/files", async (req: Request, res: Response) => {
    try {
      const { subjectId, resourceKey, fileType, year, session, page, limit } = req.query;

      const filters: any = {};
      if (subjectId && typeof subjectId === 'string') filters.subjectId = subjectId;
      if (resourceKey && typeof resourceKey === 'string') filters.resourceKey = resourceKey;
      if (fileType && typeof fileType === 'string') filters.fileType = fileType;
      if (year) filters.year = parseInt(year as string);
      if (session && typeof session === 'string') filters.session = session;

      const pageNum = parseInt(page as string) || 1;
      const limitNum = Math.min(parseInt(limit as string) || 20, 100); // Max 100 per page

      const result = await storage.getFileAssetsPaginated(filters, pageNum, limitNum);

      // Enrich files with Supabase URLs
      const enrichedFiles = result.files.map(enrichFileWithUrl);

      return res.json({
        files: enrichedFiles,
        total: result.total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(result.total / limitNum),
      });
    } catch (error) {
      console.error('Error fetching paginated files:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post("/api/subjects", apiLimiter, requireAuth, requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const parsed = insertSubjectSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.message });
      }

      const subject = await storage.createSubject(parsed.data);
      if (!subject) {
        return res.status(500).json({ error: "Failed to create subject" });
      }
      return res.status(201).json({
        ...subject,
        name: subject.subjectName,
        code: subject.subjectCode,
        isActive: subject.isActive
      });
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.patch("/api/subjects/:id", apiLimiter, requireAuth, requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const subject = await storage.updateSubject(req.params.id, req.body);
      if (!subject) {
        return res.status(404).json({ error: "Subject not found" });
      }
      return res.json({
        ...subject,
        name: subject.subjectName,
        code: subject.subjectCode,
        isActive: subject.isActive
      });
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/topics", async (req: Request, res: Response) => {
    try {
      const { subjectId } = req.query;
      if (!subjectId || typeof subjectId !== "string") {
        return res.status(400).json({ error: "subjectId query parameter is required" });
      }
      const topics = await storage.getTopicsBySubject(subjectId);
      return res.json(topics);
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/topics", async (req: Request, res: Response) => {
    try {
      const parsed = insertTopicSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.message });
      }

      const topic = await storage.createTopic(parsed.data);
      return res.status(201).json(topic);
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.patch("/api/topics/:id", async (req: Request, res: Response) => {
    try {
      const topic = await storage.updateTopic(req.params.id, req.body);
      if (!topic) {
        return res.status(404).json({ error: "Topic not found" });
      }
      return res.json(topic);
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/topics/:id", async (req: Request, res: Response) => {
    try {
      const deleted = await storage.deleteTopic(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Topic not found" });
      }
      return res.json({ message: "Topic deleted successfully" });
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/materials", async (req: Request, res: Response) => {
    try {
      const { boardId, subjectId, topicId, type, status } = req.query;
      const filters: Record<string, string> = {};
      if (boardId && typeof boardId === "string") filters.boardId = boardId;
      if (subjectId && typeof subjectId === "string") filters.subjectId = subjectId;
      if (topicId && typeof topicId === "string") filters.topicId = topicId;
      if (type && typeof type === "string") filters.type = type;
      if (status && typeof status === "string") filters.status = status;

      const materials = await storage.getMaterialsByFilters(filters);
      return res.json(materials);
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/materials/:id", async (req: Request, res: Response) => {
    try {
      const material = await storage.getMaterial(req.params.id);
      if (!material) {
        return res.status(404).json({ error: "Material not found" });
      }
      return res.json(material);
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/materials", async (req: Request, res: Response) => {
    try {
      const parsed = insertMaterialSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.message });
      }

      const material = await storage.createMaterial(parsed.data);
      return res.status(201).json(material);
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.patch("/api/materials/:id", apiLimiter, requireAuth, async (req: Request, res: Response) => {
    try {
      // Fetch existing material first
      const existing = await storage.getMaterial(req.params.id);
      if (!existing) {
        return res.status(404).json({ error: "Material not found" });
      }

      // Check ownership - only owner or admin can update
      if (existing.uploaderId !== req.user!.id && req.user!.role !== "admin") {
        return res.status(403).json({ error: "Not authorized to modify this material" });
      }

      const material = await storage.updateMaterial(req.params.id, req.body);
      if (!material) {
        return res.status(404).json({ error: "Material not found" });
      }
      return res.json(material);
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/quizzes", async (req: Request, res: Response) => {
    try {
      const { boardId, subjectId, topicId, type } = req.query;
      const filters: Record<string, string> = {};
      if (boardId && typeof boardId === "string") filters.boardId = boardId;
      if (subjectId && typeof subjectId === "string") filters.subjectId = subjectId;
      if (topicId && typeof topicId === "string") filters.topicId = topicId;
      if (type && typeof type === "string") filters.type = type;

      const quizzes = await storage.getQuizzesByFilters(filters);
      return res.json(quizzes);
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/quizzes/:id", async (req: Request, res: Response) => {
    try {
      const quiz = await storage.getQuiz(req.params.id);
      if (!quiz) {
        return res.status(404).json({ error: "Quiz not found" });
      }

      const questions = await storage.getQuestionsByQuiz(req.params.id);
      return res.json({ ...quiz, questions });
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/quizzes", async (req: Request, res: Response) => {
    try {
      const parsed = insertQuizSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.message });
      }

      const quiz = await storage.createQuiz(parsed.data);
      return res.status(201).json(quiz);
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.patch("/api/quizzes/:id", async (req: Request, res: Response) => {
    try {
      const quiz = await storage.updateQuiz(req.params.id, req.body);
      if (!quiz) {
        return res.status(404).json({ error: "Quiz not found" });
      }
      return res.json(quiz);
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/quizzes/:quizId/questions", async (req: Request, res: Response) => {
    try {
      const questions = await storage.getQuestionsByQuiz(req.params.quizId);
      return res.json(questions);
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/quizzes/:quizId/questions", async (req: Request, res: Response) => {
    try {
      const questionData = { ...req.body, quizId: req.params.quizId };
      const parsed = insertQuestionSchema.safeParse(questionData);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.message });
      }

      const question = await storage.createQuestion(parsed.data);
      return res.status(201).json(question);
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.patch("/api/questions/:id", async (req: Request, res: Response) => {
    try {
      const question = await storage.updateQuestion(req.params.id, req.body);
      if (!question) {
        return res.status(404).json({ error: "Question not found" });
      }
      return res.json(question);
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/questions/:id", async (req: Request, res: Response) => {
    try {
      const deleted = await storage.deleteQuestion(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Question not found" });
      }
      return res.json({ message: "Question deleted successfully" });
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/quiz-attempts", async (req: Request, res: Response) => {
    try {
      const { userId, quizId } = req.query;
      let attempts;
      if (userId && typeof userId === "string") {
        attempts = await storage.getQuizAttemptsByUser(userId);
      } else if (quizId && typeof quizId === "string") {
        attempts = await storage.getQuizAttemptsByQuiz(quizId);
      } else {
        return res.status(400).json({ error: "userId or quizId query parameter is required" });
      }
      return res.json(attempts);
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/quiz-attempts/:id", async (req: Request, res: Response) => {
    try {
      const attempt = await storage.getQuizAttempt(req.params.id);
      if (!attempt) {
        return res.status(404).json({ error: "Quiz attempt not found" });
      }
      return res.json(attempt);
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/quiz-attempts", async (req: Request, res: Response) => {
    try {
      const parsed = insertQuizAttemptSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.message });
      }

      const attempt = await storage.createQuizAttempt(parsed.data);
      return res.status(201).json(attempt);
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.patch("/api/quiz-attempts/:id", async (req: Request, res: Response) => {
    try {
      const attempt = await storage.updateQuizAttempt(req.params.id, req.body);
      if (!attempt) {
        return res.status(404).json({ error: "Quiz attempt not found" });
      }
      return res.json(attempt);
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/assignments", async (_req: Request, res: Response) => {
    try {
      const assignments = await storage.getAllAssignments();
      return res.json(assignments);
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/assignments/:id", async (req: Request, res: Response) => {
    try {
      const assignment = await storage.getAssignment(req.params.id);
      if (!assignment) {
        return res.status(404).json({ error: "Assignment not found" });
      }
      return res.json(assignment);
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/assignments", async (req: Request, res: Response) => {
    try {
      const parsed = insertAssignmentSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.message });
      }

      const assignment = await storage.createAssignment(parsed.data);
      return res.status(201).json(assignment);
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.patch("/api/assignments/:id", async (req: Request, res: Response) => {
    try {
      const assignment = await storage.updateAssignment(req.params.id, req.body);
      if (!assignment) {
        return res.status(404).json({ error: "Assignment not found" });
      }
      return res.json(assignment);
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/assignments/:assignmentId/submissions", async (req: Request, res: Response) => {
    try {
      const submissions = await storage.getSubmissionsByAssignment(req.params.assignmentId);
      return res.json(submissions);
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/submissions/:id", async (req: Request, res: Response) => {
    try {
      const submission = await storage.getSubmission(req.params.id);
      if (!submission) {
        return res.status(404).json({ error: "Submission not found" });
      }
      return res.json(submission);
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/submissions", async (req: Request, res: Response) => {
    try {
      const parsed = insertSubmissionSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.message });
      }

      const submission = await storage.createSubmission(parsed.data);
      return res.status(201).json(submission);
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.patch("/api/submissions/:id", async (req: Request, res: Response) => {
    try {
      const submission = await storage.updateSubmission(req.params.id, req.body);
      if (!submission) {
        return res.status(404).json({ error: "Submission not found" });
      }
      return res.json(submission);
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/announcements", async (_req: Request, res: Response) => {
    try {
      const announcements = await storage.getAllAnnouncements();
      return res.json(announcements);
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/announcements", async (req: Request, res: Response) => {
    try {
      const parsed = insertAnnouncementSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.message });
      }

      const announcement = await storage.createAnnouncement(parsed.data);
      return res.status(201).json(announcement);
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.patch("/api/announcements/:id", async (req: Request, res: Response) => {
    try {
      const announcement = await storage.updateAnnouncement(req.params.id, req.body);
      if (!announcement) {
        return res.status(404).json({ error: "Announcement not found" });
      }
      return res.json(announcement);
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/announcements/:id", async (req: Request, res: Response) => {
    try {
      const deleted = await storage.deleteAnnouncement(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Announcement not found" });
      }
      return res.json({ message: "Announcement deleted successfully" });
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/users", async (req: Request, res: Response) => {
    try {
      const { role, isActive } = req.query;
      const filters: { role?: string; isActive?: boolean } = {};
      if (role && typeof role === "string") filters.role = role;
      if (isActive !== undefined) filters.isActive = isActive === "true";

      const users = await storage.getAllUsers(filters);
      const usersWithoutPasswords = users.map(({ password: _, ...user }) => user);
      return res.json(usersWithoutPasswords);
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/users/:id", async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const { password: _, ...userWithoutPassword } = user;
      return res.json(userWithoutPassword);
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.patch("/api/users/:id", async (req: Request, res: Response) => {
    try {
      const user = await storage.updateUser(req.params.id, req.body);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const { password: _, ...userWithoutPassword } = user;
      return res.json(userWithoutPassword);
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/users", async (req: Request, res: Response) => {
    try {
      const parsed = insertUserSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.message });
      }

      const existingUser = await storage.getUserByEmail(parsed.data.email);
      if (existingUser) {
        return res.status(400).json({ error: "Email already in use" });
      }

      const user = await storage.createUser(parsed.data);
      const { password: _, ...userWithoutPassword } = user;
      return res.status(201).json(userWithoutPassword);
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // ============================================================================
  // SEED TREE EXPORT ENDPOINT
  // ============================================================================

  app.get("/api/seed/tree", async (_req: Request, res: Response) => {
    try {
      const boards = await storage.getAllBoards();

      const tree = await Promise.all(
        boards.filter(b => b.isEnabled).map(async (board) => {
          const qualifications = await storage.getQualificationsByBoard(board.id);

          const qualsWithSubjects = await Promise.all(
            qualifications.map(async (qual) => {
              const subjects = await storage.getSubjectsByQualification(qual.id);
              const branches = await storage.getBranchesByQualification(qual.id);

              return {
                qual_key: qual.qualKey,
                display_name: qual.displayName,
                has_branching: qual.hasBranching,
                branches: branches.map(b => ({
                  branch_key: b.branchKey,
                  display_name: b.displayName,
                })),
                subjects: subjects.map(s => ({
                  subject_name: s.subjectName,
                  subject_code: s.subjectCode,
                  slug: s.slug,
                  is_active: s.isActive,
                })),
              };
            })
          );

          return {
            board_key: board.boardKey,
            display_name: board.displayName,
            qualifications: qualsWithSubjects,
          };
        })
      );

      return res.json({ boards: tree });
    } catch (error) {
      console.error("Error generating seed tree:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // ============================================================================
  // ADMIN CURRICULUM MANAGEMENT ROUTES
  // ============================================================================

  // Get all qualifications (with filters)
  app.get("/api/admin/qualifications", requireAuth, requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { boardId } = req.query;
      let qualifications;

      if (boardId && typeof boardId === "string") {
        qualifications = await storage.getQualificationsByBoard(boardId);
      } else {
        // Get all qualifications across all boards
        const boards = await storage.getAllBoards();
        const allQuals = await Promise.all(
          boards.map(b => storage.getQualificationsByBoard(b.id))
        );
        qualifications = allQuals.flat();
      }

      return res.json(qualifications);
    } catch (error) {
      console.error("Error fetching qualifications:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get admin subjects with pagination and search
  app.get("/api/admin/subjects", requireAuth, requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { boardId, qualId, search, page = "1", pageSize = "50" } = req.query;

      let subjects = await storage.getAllSubjects();

      // Apply filters
      if (boardId && typeof boardId === "string") {
        subjects = subjects.filter(s => s.boardId === boardId);
      }
      if (qualId && typeof qualId === "string") {
        subjects = subjects.filter(s => s.qualId === qualId);
      }
      if (search && typeof search === "string") {
        const searchLower = search.toLowerCase();
        subjects = subjects.filter(s =>
          s.subjectName.toLowerCase().includes(searchLower) ||
          (s.subjectCode?.toLowerCase().includes(searchLower))
        );
      }

      // Pagination
      const pageNum = parseInt(page as string, 10);
      const pageSizeNum = parseInt(pageSize as string, 10);
      const total = subjects.length;
      const start = (pageNum - 1) * pageSizeNum;
      const paged = subjects.slice(start, start + pageSizeNum);

      return res.json({
        data: paged.map(s => ({
          id: s.id,
          name: s.subjectName,
          code: s.subjectCode,
          boardId: s.boardId,
          qualId: s.qualId,
          slug: s.slug,
          isActive: s.isActive,
          createdAt: s.createdAt,
        })),
        pagination: {
          page: pageNum,
          pageSize: pageSizeNum,
          total,
        },
      });
    } catch (error) {
      console.error("Error fetching admin subjects:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get curriculum stats for admin overview
  app.get("/api/admin/curriculum/stats", requireAuth, requireRole("admin"), async (_req: Request, res: Response) => {
    try {
      const boards = await storage.getAllBoards();
      const subjects = await storage.getAllSubjects();

      const activeBoards = boards.filter(b => b.isEnabled).length;
      const totalSubjects = subjects.length;
      const activeSubjects = subjects.filter(s => s.isActive).length;

      // Get subject counts per board
      const subjectsByBoard = boards.map(b => ({
        boardId: b.id,
        boardName: b.displayName,
        count: subjects.filter(s => s.boardId === b.id).length,
      }));

      return res.json({
        totalBoards: boards.length,
        activeBoards,
        totalSubjects,
        activeSubjects,
        subjectsByBoard,
      });
    } catch (error) {
      console.error("Error fetching curriculum stats:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // ============================================================================
  // FEEDBACK ROUTES
  // ============================================================================

  // Submit feedback
  app.post("/api/feedback", async (req: Request, res: Response) => {
    try {
      const parsed = insertFeedbackSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.message });
      }

      // If user is logged in, use their ID
      if (req.user) {
        parsed.data.userId = req.user.id;
        parsed.data.userName = req.user.name;
        parsed.data.userEmail = req.user.email;
      }

      const feedback = await storage.createFeedback(parsed.data);
      return res.status(201).json(feedback);
    } catch (error) {
      console.error("Error submitting feedback:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get all feedback (Admin only)
  app.get("/api/admin/feedback", requireAuth, requireRole("admin"), async (_req: Request, res: Response) => {
    try {
      const feedbackList = await storage.getAllFeedback();
      return res.json(feedbackList);
    } catch (error) {
      console.error("Error fetching feedback:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  return httpServer;
}

