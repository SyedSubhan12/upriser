import type { Express, Request, Response } from "express";
import { z } from "zod";
import { storage } from "./storage";
import { requireAuth, requireRole } from "./middleware/rbac";
import { createSystemEvent, getRecentSystemEvents } from "./system-events";
import type { User, Board, Material } from "@shared/schema";
import bcrypt from "bcrypt";
import crypto from "crypto";

const listUsersQuerySchema = z.object({
  q: z.string().optional(),
  role: z.enum(["student", "teacher", "admin"]).optional(),
  boardId: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  role: z.enum(["student", "teacher", "admin"]),
  boardId: z.string().optional().nullable(),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
});

const updateUserSchema = z
  .object({
    name: z.string().min(1).optional(),
    role: z.enum(["student", "teacher", "admin"]).optional(),
    boardId: z.string().optional().nullable(),
    status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

const createBoardSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  description: z.string().optional().nullable(),
  isEnabled: z.boolean().optional().default(true),
});

const updateBoardSchema = z
  .object({
    name: z.string().min(1).optional(),
    code: z.string().min(1).optional(),
    description: z.string().optional().nullable(),
    isEnabled: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

const listMaterialsQuerySchema = z.object({
  status: z.enum(["ALL", "PENDING", "APPROVED", "REJECTED"]).optional().default("ALL"),
  boardId: z.string().optional(),
  subject: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

function mapUserToAdminDto(user: User, boardsById: Map<string, Board>) {
  const primaryBoardId = user.boardIds && user.boardIds.length > 0 ? user.boardIds[0] : null;
  const board = primaryBoardId ? boardsById.get(primaryBoardId) ?? null : null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar ?? null,
    board: board ? { id: board.id, name: board.displayName } : null,
    status: user.isActive ? "ACTIVE" : "INACTIVE",
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt ?? null,
    boardIds: user.boardIds ?? [],
    subjectIds: user.subjectIds ?? [],
  };
}

function mapMaterialStatusToApi(status: string) {
  if (status === "approved") return "APPROVED";
  if (status === "rejected") return "REJECTED";
  return "PENDING";
}

export function registerAdminRoutes(app: Express) {
  app.get(
    "/api/admin/users",
    requireAuth,
    requireRole("admin"),
    async (req: Request, res: Response) => {
      const parsed = listUsersQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid query", details: parsed.error.flatten() });
      }

      const { q, role, boardId, status, page, pageSize } = parsed.data;

      const filters: { role?: string; isActive?: boolean } = {};
      if (role) filters.role = role;
      if (status) filters.isActive = status === "ACTIVE";

      const allUsers = await storage.getAllUsers(filters);
      const boards = await storage.getAllBoards();
      const boardsById = new Map<string, Board>(boards.map((b) => [b.id, b]));

      let filtered: User[] = allUsers;

      if (q) {
        const query = q.toLowerCase();
        filtered = filtered.filter((u) =>
          u.name.toLowerCase().includes(query) || u.email.toLowerCase().includes(query),
        );
      }

      if (boardId) {
        filtered = filtered.filter((u) => u.boardIds && u.boardIds.includes(boardId));
      }

      const total = filtered.length;
      const start = (page - 1) * pageSize;
      const paged = filtered.slice(start, start + pageSize);

      const data = paged.map((u) => mapUserToAdminDto(u, boardsById));

      return res.json({
        data,
        pagination: {
          page,
          pageSize,
          total,
        },
      });
    },
  );

  app.post(
    "/api/admin/users",
    requireAuth,
    requireRole("admin"),
    async (req: Request, res: Response) => {
      const parsed = createUserSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid body", details: parsed.error.flatten() });
      }

      const { name, email, role, boardId, status } = parsed.data;

      const existing = await storage.getUserByEmail(email);
      if (existing) {
        return res.status(409).json({ error: "User with this email already exists" });
      }

      const boardIds = boardId ? [boardId] : null;

      // Generate secure random password
      const tempPassword = crypto.randomBytes(12).toString('base64').slice(0, 16);
      const hashedPassword = await bcrypt.hash(tempPassword, 10);

      const user = await storage.createUser({
        email,
        password: hashedPassword,
        name,
        role,
        authProvider: "local",
        isActive: status === "ACTIVE",
        boardIds,
      });

      // TODO: Send email to user with temporary password
      // For now, log it (in production, send email instead)
      console.log(`[ADMIN] New user created: ${email} with temporary password: ${tempPassword}`);
      console.log(`[ADMIN] Please implement email service to send this password to the user.`);

      await createSystemEvent("NEW_USER", `${user.name} joined as a ${user.role}`, {
        userId: user.id,
        role: user.role,
      });

      const boards = await storage.getAllBoards();
      const boardsById = new Map<string, Board>(boards.map((b) => [b.id, b]));

      // Return user info with temporary password (only on creation)
      // In production, this should be emailed instead
      return res.status(201).json({
        ...mapUserToAdminDto(user, boardsById),
        tempPassword: tempPassword, // Include temp password in response for admin to share
      });
    },
  );

  app.get(
    "/api/admin/users/:id",
    requireAuth,
    requireRole("admin"),
    async (req: Request, res: Response) => {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const boards = await storage.getAllBoards();
      const boardsById = new Map<string, Board>(boards.map((b) => [b.id, b]));

      return res.json(mapUserToAdminDto(user, boardsById));
    },
  );

  app.patch(
    "/api/admin/users/:id",
    requireAuth,
    requireRole("admin"),
    async (req: Request, res: Response) => {
      const parsed = updateUserSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid body", details: parsed.error.flatten() });
      }

      const existing = await storage.getUser(req.params.id);
      if (!existing) {
        return res.status(404).json({ error: "User not found" });
      }

      const { name, role, boardId, status } = parsed.data;
      const updateData: any = {};

      if (name !== undefined) updateData.name = name;
      if (role !== undefined) updateData.role = role;
      if (boardId !== undefined) updateData.boardIds = boardId ? [boardId] : null;
      if (status !== undefined) updateData.isActive = status === "ACTIVE";
      updateData.updatedAt = new Date();

      const updated = await storage.updateUser(req.params.id, updateData);
      if (!updated) {
        return res.status(500).json({ error: "Failed to update user" });
      }

      const previousStatus = existing.isActive ? "ACTIVE" : "INACTIVE";
      const newStatus = updated.isActive ? "ACTIVE" : "INACTIVE";

      if (previousStatus === "ACTIVE" && newStatus === "INACTIVE") {
        await createSystemEvent("USER_DEACTIVATED", `User ${updated.name} was deactivated`, {
          userId: updated.id,
        });
      }

      const boards = await storage.getAllBoards();
      const boardsById = new Map<string, Board>(boards.map((b) => [b.id, b]));

      return res.json(mapUserToAdminDto(updated, boardsById));
    },
  );

  app.delete(
    "/api/admin/users/:id",
    requireAuth,
    requireRole("admin"),
    async (req: Request, res: Response) => {
      const existing = await storage.getUser(req.params.id);
      if (!existing) {
        return res.status(404).json({ error: "User not found" });
      }

      if (!existing.isActive) {
        const boards = await storage.getAllBoards();
        const boardsById = new Map<string, Board>(boards.map((b) => [b.id, b]));
        return res.json(mapUserToAdminDto(existing, boardsById));
      }

      const updated = await storage.updateUser(req.params.id, {
        isActive: false,
        updatedAt: new Date(),
      });

      if (!updated) {
        return res.status(500).json({ error: "Failed to delete user" });
      }

      await createSystemEvent("USER_DELETED", `User ${updated.name} was deleted`, {
        userId: updated.id,
      });

      const boards = await storage.getAllBoards();
      const boardsById = new Map<string, Board>(boards.map((b) => [b.id, b]));

      return res.json(mapUserToAdminDto(updated, boardsById));
    },
  );

  app.get(
    "/api/admin/boards",
    requireAuth,
    requireRole("admin"),
    async (_req: Request, res: Response) => {
      const boards = await storage.getAllBoards();
      const data = boards.map((b) => ({
        id: b.id,
        name: b.displayName,
        code: b.boardKey,
        description: b.description,
        isActive: b.isEnabled,
      }));

      return res.json(data);
    },
  );

  app.post(
    "/api/admin/boards",
    requireAuth,
    requireRole("admin"),
    async (req: Request, res: Response) => {
      const parsed = createBoardSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid body", details: parsed.error.flatten() });
      }

      const { name, code, description, isEnabled } = parsed.data;

      const existingBoards = await storage.getAllBoards();
      if (existingBoards.some((b) => b.code === code)) {
        return res.status(409).json({ error: "Board with this code already exists" });
      }

      const board = await storage.createBoard({
        displayName: name,
        boardKey: code,
        description: description ?? null,
        isEnabled,
      });

      await createSystemEvent("NEW_BOARD", `Board ${board.displayName} was created`, {
        boardId: board.id,
      });

      return res.status(201).json({
        id: board.id,
        name: board.displayName,
        code: board.boardKey,
        description: board.description,
        isActive: board.isEnabled,
      });
    },
  );

  app.patch(
    "/api/admin/boards/:id",
    requireAuth,
    requireRole("admin"),
    async (req: Request, res: Response) => {
      const parsed = updateBoardSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid body", details: parsed.error.flatten() });
      }

      const existing = await storage.getBoard(req.params.id);
      if (!existing) {
        return res.status(404).json({ error: "Board not found" });
      }

      const { name, code, description, isEnabled } = parsed.data;
      const updateData: any = {};
      if (name !== undefined) updateData.displayName = name;
      if (code !== undefined) updateData.boardKey = code;
      if (description !== undefined) updateData.description = description;
      if (isEnabled !== undefined) updateData.isEnabled = isEnabled;
      updateData.updatedAt = new Date();

      const updated = await storage.updateBoard(req.params.id, updateData);
      if (!updated) {
        return res.status(500).json({ error: "Failed to update board" });
      }

      if (isEnabled !== undefined && existing.isEnabled !== updated.isEnabled) {
        await createSystemEvent(
          updated.isEnabled ? "BOARD_ACTIVATED" : "BOARD_DEACTIVATED",
          `Board ${updated.displayName} was ${updated.isEnabled ? "activated" : "deactivated"}`,
          { boardId: updated.id },
        );
      }

      return res.json({
        id: updated.id,
        name: updated.displayName,
        code: updated.boardKey,
        description: updated.description,
        isActive: updated.isEnabled,
      });
    },
  );

  app.delete(
    "/api/admin/boards/:id",
    requireAuth,
    requireRole("admin"),
    async (req: Request, res: Response) => {
      const existing = await storage.getBoard(req.params.id);
      if (!existing) {
        return res.status(404).json({ error: "Board not found" });
      }

      if (!existing.isEnabled) {
        return res.json({
          id: existing.id,
          name: existing.displayName,
          code: existing.boardKey,
          description: existing.description,
          isActive: existing.isEnabled,
        });
      }

      const updated = await storage.updateBoard(req.params.id, {
        isEnabled: false,
        updatedAt: new Date(),
      });

      if (!updated) {
        return res.status(500).json({ error: "Failed to delete board" });
      }

      await createSystemEvent("BOARD_DELETED", `Board ${updated.displayName} was deleted`, {
        boardId: updated.id,
      });

      return res.json({
        id: updated.id,
        name: updated.displayName,
        code: updated.boardKey,
        description: updated.description,
        isActive: updated.isEnabled,
      });
    },
  );

  app.get(
    "/api/admin/materials",
    requireAuth,
    requireRole("admin"),
    async (req: Request, res: Response) => {
      const parsed = listMaterialsQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid query", details: parsed.error.flatten() });
      }

      const { status, boardId, subject, page, pageSize } = parsed.data;

      const filters: { boardId?: string; subjectId?: string; status?: string } = {};
      if (boardId) filters.boardId = boardId;
      if (subject) filters.subjectId = subject;
      if (status !== "ALL") filters.status = status.toLowerCase();

      const materials: Material[] =
        Object.keys(filters).length > 0 ? await storage.getMaterialsByFilters(filters) : await storage.getAllMaterials();

      const boards = await storage.getAllBoards();
      const users = await storage.getAllUsers();
      const subjects = await storage.getAllSubjects();

      const boardsById = new Map<string, Board>(boards.map((b) => [b.id, b]));
      const usersById = new Map<string, User>(users.map((u) => [u.id, u]));
      const subjectsById = new Map<string, any>(subjects.map((s) => [s.id, s]));

      let list = materials;

      const total = list.length;
      const start = (page - 1) * pageSize;
      list = list.slice(start, start + pageSize);

      const data = list.map((m) => {
        const uploader = usersById.get(m.uploaderId) ?? null;
        const board = boardsById.get(m.boardId) ?? null;
        const subjectRow = subjectsById.get(m.subjectId) ?? null;

        return {
          id: m.id,
          title: m.title,
          type: m.type,
          uploaderName: uploader ? uploader.name : null,
          subject: subjectRow ? subjectRow.name : null,
          board: board ? board.name : null,
          status: mapMaterialStatusToApi(m.status),
          createdAt: m.createdAt,
        };
      });

      return res.json({
        data,
        pagination: {
          page,
          pageSize,
          total,
        },
      });
    },
  );

  app.post(
    "/api/admin/materials/:id/approve",
    requireAuth,
    requireRole("admin"),
    async (req: Request, res: Response) => {
      const material = await storage.getMaterial(req.params.id);
      if (!material) {
        return res.status(404).json({ error: "Material not found" });
      }

      const updated = await storage.updateMaterial(req.params.id, { status: "approved" });
      if (!updated) {
        return res.status(500).json({ error: "Failed to update material" });
      }

      await createSystemEvent("CONTENT_APPROVED", `${updated.title} was approved`, {
        materialId: updated.id,
      });

      return res.json({
        id: updated.id,
        status: mapMaterialStatusToApi(updated.status),
      });
    },
  );

  app.post(
    "/api/admin/materials/:id/reject",
    requireAuth,
    requireRole("admin"),
    async (req: Request, res: Response) => {
      const material = await storage.getMaterial(req.params.id);
      if (!material) {
        return res.status(404).json({ error: "Material not found" });
      }

      const updated = await storage.updateMaterial(req.params.id, { status: "rejected" });
      if (!updated) {
        return res.status(500).json({ error: "Failed to update material" });
      }

      await createSystemEvent("CONTENT_REJECTED", `${updated.title} was rejected`, {
        materialId: updated.id,
      });

      return res.json({
        id: updated.id,
        status: mapMaterialStatusToApi(updated.status),
      });
    },
  );

  app.get(
    "/api/admin/overview",
    requireAuth,
    requireRole("admin"),
    async (_req: Request, res: Response) => {
      const users = await storage.getAllUsers();
      const boards = await storage.getAllBoards();
      const materials = await storage.getAllMaterials();

      const totalStudents = users.filter((u) => u.role === "student" && u.isActive).length;
      const totalTeachers = users.filter((u) => u.role === "teacher" && u.isActive).length;
      const totalBoards = boards.filter((b) => b.isEnabled).length;
      const totalMaterials = materials.length;
      const pendingMaterials = materials.filter((m) => m.status === "pending").length;

      const recentEvents = await getRecentSystemEvents(10);

      return res.json({
        stats: {
          totalStudents,
          totalTeachers,
          totalBoards,
          totalMaterials,
          dailyActiveUsers: 0,
          pendingMaterials,
        },
        recentEvents: recentEvents.map((e) => ({
          id: e.id,
          type: e.type,
          message: e.message,
          createdAt: e.createdAt,
        })),
      });
    },
  );
}
