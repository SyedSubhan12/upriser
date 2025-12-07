import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
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
} from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.use((req, res, next) => {
    res.setHeader('Content-Type', 'application/json');
    next();
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user || user.password !== password) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      if (!user.isActive) {
        return res.status(403).json({ error: "Account is disabled" });
      }

      req.session.userId = user.id;
      const { password: _, ...userWithoutPassword } = user;
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
        req.session.destroy(() => {});
        return res.status(401).json({ error: "User not found" });
      }

      const { password: _, ...userWithoutPassword } = user;
      return res.json(userWithoutPassword);
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  });

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

  app.post("/api/boards", async (req: Request, res: Response) => {
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

  app.patch("/api/boards/:id", async (req: Request, res: Response) => {
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
      return res.json(subjects);
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
      return res.json(subject);
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/subjects", async (req: Request, res: Response) => {
    try {
      const parsed = insertSubjectSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.message });
      }

      const subject = await storage.createSubject(parsed.data);
      return res.status(201).json(subject);
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.patch("/api/subjects/:id", async (req: Request, res: Response) => {
    try {
      const subject = await storage.updateSubject(req.params.id, req.body);
      if (!subject) {
        return res.status(404).json({ error: "Subject not found" });
      }
      return res.json(subject);
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

  app.patch("/api/materials/:id", async (req: Request, res: Response) => {
    try {
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

  return httpServer;
}
