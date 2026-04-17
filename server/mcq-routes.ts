/**
 * MCQ System API Routes
 * 
 * Endpoints for the MCQ question bank, practice sessions,
 * AI solver/generator, and Student Intelligence Engine.
 */

import { Router, type Request, type Response } from "express";
import { z } from "zod";
import multer from "multer";
import * as mcqStorage from "./mcq-storage.js";
import * as mcqAI from "./services/mcq-ai.js";
import * as mcqExtractor from "./services/mcq-extractor.js";
import * as SIE from "./services/student-intelligence.js";
import { requireAuth, requireRole, requireApproved } from "./middleware/rbac.js";
import { apiLimiter } from "./middleware/rate-limit.js";
import { storage } from "./storage.js";
import { parseCambridgeMcq, validateMcqQuestions } from "./services/mcq-cambridge-parser.js";

// Multer in-memory storage for PDF uploads (max 20MB)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 20 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed'));
        }
    },
});

export function registerMcqRoutes(router: Router): void {

    // ========================================================================
    // MCQ QUESTIONS — CRUD
    // ========================================================================

    // List questions (paginated, filterable)
    router.get("/api/mcq/questions", requireAuth, apiLimiter, async (req: Request, res: Response) => {
        try {
            const { subjectId, topicId, boardId, difficulty, source, search, page, limit, createdBy } = req.query;
            const result = await mcqStorage.getMcqQuestions({
                subjectId: subjectId as string,
                topicId: topicId as string,
                boardId: boardId as string,
                difficulty: difficulty as string,
                qualId: req.query.qualId as string,
                source: source as string,
                search: search as string,
                createdBy: createdBy as string,
                page: page ? parseInt(page as string) : 1,
                limit: limit ? parseInt(limit as string) : 20,
            });
            return res.json(result);
        } catch (err) {
            console.error("Error listing MCQ questions:", err);
            return res.status(500).json({ error: "Failed to list questions" });
        }
    });

    // Get single question
    router.get("/api/mcq/questions/:id", requireAuth, async (req: Request, res: Response) => {
        try {
            const question = await mcqStorage.getMcqQuestion(req.params.id);
            if (!question) return res.status(404).json({ error: "Question not found" });
            return res.json(question);
        } catch (err) {
            console.error("Error getting MCQ question:", err);
            return res.status(500).json({ error: "Failed to get question" });
        }
    });

    // Create question (teacher+)
    router.post("/api/mcq/questions", requireAuth, requireRole("teacher"), requireApproved, apiLimiter, async (req: Request, res: Response) => {
        try {
            const schema = z.object({
                subjectId: z.string().min(1),
                topicId: z.string().optional(),
                boardId: z.string().optional(),
                qualId: z.string().optional(),
                questionText: z.string().min(5),
                options: z.array(z.object({ label: z.string(), text: z.string() })).length(4),
                correctOptionIndex: z.number().min(0).max(3),
                explanation: z.string().optional(),
                difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
                tags: z.array(z.string()).optional(),
                bloomsLevel: z.string().optional(),
                marks: z.number().min(1).default(1),
            });

            const data = schema.parse(req.body);
            const userId = (req.session as any).userId;

            const question = await mcqStorage.createMcqQuestion({
                ...data,
                source: "manual",
                createdBy: userId,
            });

            return res.status(201).json(question);
        } catch (err: any) {
            if (err.name === "ZodError") return res.status(400).json({ error: "Validation failed", details: err.errors });
            console.error("Error creating MCQ question:", err);
            return res.status(500).json({ error: "Failed to create question" });
        }
    });

    // Update question (teacher+)
    router.patch("/api/mcq/questions/:id", requireAuth, requireRole("teacher"), requireApproved, async (req: Request, res: Response) => {
        try {
            const existing = await mcqStorage.getMcqQuestion(req.params.id);
            if (!existing) return res.status(404).json({ error: "Question not found" });

            // Check ownership - only creator or admin can update
            const userId = (req.session as any).userId;
            const userRole = (req.user as any)?.role;
            if (existing.createdBy !== userId && userRole !== "admin") {
                return res.status(403).json({ error: "Not authorized to update this question" });
            }

            const question = await mcqStorage.updateMcqQuestion(req.params.id, req.body);
            return res.json(question);
        } catch (err) {
            console.error("Error updating MCQ question:", err);
            return res.status(500).json({ error: "Failed to update question" });
        }
    });

    // Delete question (teacher owns or admin)
    router.delete("/api/mcq/questions/:id", requireAuth, requireRole("teacher"), requireApproved, async (req: Request, res: Response) => {
        try {
            const existing = await mcqStorage.getMcqQuestion(req.params.id);
            if (!existing) return res.status(404).json({ error: "Question not found" });

            // Check ownership - only creator or admin can delete
            const userId = (req.session as any).userId;
            const userRole = (req.user as any)?.role;
            if (existing.createdBy !== userId && userRole !== "admin") {
                return res.status(403).json({ error: "Not authorized to delete this question" });
            }

            const deleted = await mcqStorage.deleteMcqQuestion(req.params.id);
            if (!deleted) return res.status(404).json({ error: "Question not found" });
            return res.json({ success: true });
        } catch (err) {
            console.error("Error deleting MCQ question:", err);
            return res.status(500).json({ error: "Failed to delete question" });
        }
    });

    // Bulk import questions (admin)
    router.post("/api/mcq/questions/bulk", requireAuth, requireRole("admin"), async (req: Request, res: Response) => {
        try {
            const schema = z.object({
                questions: z.array(z.object({
                    subjectId: z.string().min(1),
                    topicId: z.string().optional(),
                    boardId: z.string().optional(),
                    questionText: z.string().min(5),
                    options: z.array(z.object({ label: z.string(), text: z.string() })).length(4),
                    correctOptionIndex: z.number().min(0).max(3),
                    explanation: z.string().optional(),
                    difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
                    tags: z.array(z.string()).optional(),
                    marks: z.number().min(1).default(1),
                })),
            });

            const { questions } = schema.parse(req.body);
            const userId = (req.session as any).userId;

            const withMeta = questions.map(q => ({
                ...q,
                source: "manual" as const,
                createdBy: userId,
            }));

            const created = await mcqStorage.createMcqQuestionsBulk(withMeta);
            return res.status(201).json({ created: created.length, questions: created });
        } catch (err: any) {
            if (err.name === "ZodError") return res.status(400).json({ error: "Validation failed", details: err.errors });
            console.error("Error bulk importing MCQ questions:", err);
            return res.status(500).json({ error: "Failed to bulk import questions" });
        }
    });

    // Upload Cambridge format MCQs (teacher+)
    router.post("/api/mcq/questions/cambridge-upload", requireAuth, requireRole("teacher"), requireApproved, apiLimiter, async (req: Request, res: Response) => {
        try {
            const schema = z.object({
                text: z.string().min(10, "Question text is required"),
                subjectId: z.string().min(1),
                topicId: z.string().optional(),
                boardId: z.string().optional(),
                qualId: z.string().optional(),
                year: z.number().optional(),
                session: z.string().optional(),
                paper: z.number().optional(),
                variant: z.number().optional(),
            });

            const parsed = schema.parse(req.body);
            const userId = (req.session as any).userId;

            // Parse Cambridge format
            const parsedMcq = parseCambridgeMcq(parsed.text);

            // Validate
            const validation = validateMcqQuestions(parsedMcq);
            if (!validation.valid) {
                return res.status(400).json({
                    error: "Invalid MCQ format",
                    details: validation.errors,
                });
            }

            // Merge metadata
            const metadataYear = parsedMcq.year || parsed.year;
            const metadataSession = parsedMcq.session || parsed.session;
            const metadataPaper = parsedMcq.paper || parsed.paper;
            const metadataVariant = parsedMcq.variant || parsed.variant;
            const metadataDifficulty = parsedMcq.difficulty || "medium";

            // Convert to database format
            const questionsToCreate = parsedMcq.questions.map((q) => {
                const correctOptionIndex = q.options.findIndex((o) => o.label === q.correctAnswer);
                return {
                    subjectId: parsed.subjectId,
                    topicId: parsed.topicId,
                    boardId: parsed.boardId,
                    qualId: parsed.qualId,
                    questionText: q.questionText,
                    options: q.options,
                    correctOptionIndex: correctOptionIndex >= 0 ? correctOptionIndex : 0,
                    explanation: q.explanation,
                    difficulty: metadataDifficulty,
                    source: "manual" as const,
                    year: metadataYear,
                    session: metadataSession,
                    paper: metadataPaper,
                    variant: metadataVariant,
                    createdBy: userId,
                };
            });

            const created = await mcqStorage.createMcqQuestionsBulk(questionsToCreate);

            return res.status(201).json({
                success: true,
                imported: created.length,
                total: parsedMcq.questions.length,
                metadata: {
                    subject: parsedMcq.subject,
                    topic: parsedMcq.topic,
                    year: metadataYear,
                    session: metadataSession,
                    paper: metadataPaper,
                    variant: metadataVariant,
                },
                questions: created,
            });
        } catch (err: any) {
            if (err.name === "ZodError") {
                return res.status(400).json({ error: "Validation failed", details: err.errors });
            }
            console.error("Error uploading Cambridge format MCQs:", err);
            return res.status(500).json({ error: "Failed to upload Cambridge format MCQs" });
        }
    });

    // Upload Cambridge format MCQs via file (teacher+)
    router.post("/api/mcq/questions/cambridge-upload-file", requireAuth, requireRole("teacher"), requireApproved, apiLimiter, upload.single("file"), async (req: Request, res: Response) => {
        try {
            if (!req.file) {
                return res.status(400).json({ error: "No file uploaded" });
            }

            const { subjectId, topicId, boardId, qualId, year, session, paper, variant } = req.body;

            if (!subjectId) {
                return res.status(400).json({ error: "subjectId is required" });
            }

            const userId = (req.session as any).userId;

            // Read file content (supports .txt, .md, .csv)
            const fileContent = req.file.buffer.toString("utf-8");

            // Prepend metadata if provided in form fields
            let textWithMetadata = "";
            if (boardId) textWithMetadata += `// Board: ${boardId}\n`;
            if (qualId) textWithMetadata += `// Qualification: ${qualId}\n`;
            if (topicId) textWithMetadata += `// Topic: ${topicId}\n`;
            if (year) textWithMetadata += `// Year: ${year}\n`;
            if (session) textWithMetadata += `// Session: ${session}\n`;
            if (paper) textWithMetadata += `// Paper: ${paper}\n`;
            if (variant) textWithMetadata += `// Variant: ${variant}\n`;
            textWithMetadata += "\n" + fileContent;

            // Parse Cambridge format
            const parsedMcq = parseCambridgeMcq(textWithMetadata);

            // Validate
            const validation = validateMcqQuestions(parsedMcq);
            if (!validation.valid) {
                return res.status(400).json({
                    error: "Invalid MCQ format",
                    details: validation.errors,
                });
            }

            const metadataYear = parsedMcq.year || (year ? parseInt(year) : undefined);
            const metadataSession = parsedMcq.session || session;
            const metadataPaper = parsedMcq.paper || (paper ? parseInt(paper) : undefined);
            const metadataVariant = parsedMcq.variant || (variant ? parseInt(variant) : undefined);
            const metadataDifficulty = parsedMcq.difficulty || "medium";

            // Convert to database format
            const questionsToCreate = parsedMcq.questions.map((q) => {
                const correctOptionIndex = q.options.findIndex((o) => o.label === q.correctAnswer);
                return {
                    subjectId,
                    topicId: topicId || undefined,
                    boardId: boardId || undefined,
                    qualId: qualId || undefined,
                    questionText: q.questionText,
                    options: q.options,
                    correctOptionIndex: correctOptionIndex >= 0 ? correctOptionIndex : 0,
                    explanation: q.explanation,
                    difficulty: metadataDifficulty,
                    source: "manual" as const,
                    year: metadataYear,
                    session: metadataSession,
                    paper: metadataPaper,
                    variant: metadataVariant,
                    createdBy: userId,
                };
            });

            const created = await mcqStorage.createMcqQuestionsBulk(questionsToCreate);

            return res.status(201).json({
                success: true,
                imported: created.length,
                total: parsedMcq.questions.length,
                metadata: {
                    subject: parsedMcq.subject,
                    topic: parsedMcq.topic,
                    year: metadataYear,
                    session: metadataSession,
                    paper: metadataPaper,
                    variant: metadataVariant,
                },
                questions: created,
            });
        } catch (err: any) {
            if (err.name === "ZodError") {
                return res.status(400).json({ error: "Validation failed", details: err.errors });
            }
            console.error("Error uploading Cambridge format MCQ file:", err);
            return res.status(500).json({ error: "Failed to upload Cambridge format MCQ file" });
        }
    });

    // ========================================================================
    // MCQ PRACTICE SESSIONS
    // ========================================================================

    // Start a practice session
    router.post("/api/mcq/sessions/start", requireAuth, apiLimiter, async (req: Request, res: Response) => {
        try {
            const schema = z.object({
                subjectId: z.string().min(1),
                topicId: z.string().optional(),
                mode: z.enum(["practice", "timed", "exam", "adaptive"]).default("practice"),
                questionCount: z.number().min(1).max(50).default(10),
                difficulty: z.enum(["easy", "medium", "hard"]).optional(),
                year: z.number().optional(),
                session: z.string().optional(),
                paper: z.number().optional(),
                variant: z.number().optional(),
                qualId: z.string().optional(),
                branchId: z.string().optional(),
            });

            const data = schema.parse(req.body);
            const userId = (req.session as any).userId;

            // For adaptive mode, use SIE to determine difficulty
            let difficulty = data.difficulty;
            if (data.mode === "adaptive" && data.topicId) {
                const stats = await mcqStorage.getUserTopicStats(userId, data.subjectId);
                const topicStat = stats.find(s => s.topicId === data.topicId);
                if (topicStat) {
                    const adaptive = SIE.getAdaptiveDifficulty(topicStat.masteryScore);
                    difficulty = adaptive.primary;
                }
            }

            // Fetch random questions
            const questions = await mcqStorage.getRandomMcqQuestions({
                subjectId: data.subjectId,
                topicId: data.topicId,
                difficulty,
                year: data.year,
                session: data.session,
                paper: data.paper,
                variant: data.variant,
                qualId: data.qualId,
                branchId: data.branchId,
                count: data.questionCount,
            });

            if (questions.length === 0) {
                return res.status(404).json({ error: "No questions available for the selected filters" });
            }

            // Create session
            const session = await mcqStorage.createMcqSession({
                userId,
                subjectId: data.subjectId,
                topicId: data.topicId,
                mode: data.mode,
                totalQuestions: questions.length,
                answeredCount: 0,
                correctCount: 0,
                settings: { difficulty, questionCount: data.questionCount },
                startedAt: new Date(),
            });

            // Return session with questions (hide correct answers for practice)
            const sanitizedQuestions = questions.map(q => ({
                id: q.id,
                questionText: q.questionText,
                options: q.options,
                difficulty: q.difficulty,
                marks: q.marks,
                tags: q.tags,
                bloomsLevel: q.bloomsLevel,
                // DO NOT include: correctOptionIndex, explanation
            }));

            return res.status(201).json({
                session,
                questions: sanitizedQuestions,
            });
        } catch (err: any) {
            if (err.name === "ZodError") return res.status(400).json({ error: "Validation failed", details: err.errors });
            console.error("Error starting MCQ session:", err);
            return res.status(500).json({ error: "Failed to start session" });
        }
    });

    // Submit answer for a question in a session
    router.post("/api/mcq/sessions/:id/answer", requireAuth, async (req: Request, res: Response) => {
        try {
            const schema = z.object({
                questionId: z.string().min(1),
                selectedOptionIndex: z.number().min(0).max(3),
                timeSpentMs: z.number().optional(),
            });

            const data = schema.parse(req.body);
            const userId = (req.session as any).userId;
            const sessionId = req.params.id;

            // Verify session belongs to user
            const session = await mcqStorage.getMcqSession(sessionId);
            if (!session) return res.status(404).json({ error: "Session not found" });
            if (session.userId !== userId) return res.status(403).json({ error: "Not your session" });
            if (session.completedAt) return res.status(400).json({ error: "Session already completed" });

            // Get the question
            const question = await mcqStorage.getMcqQuestion(data.questionId);
            if (!question) return res.status(404).json({ error: "Question not found" });

            const isCorrect = data.selectedOptionIndex === question.correctOptionIndex;

            // Create attempt record
            const attempt = await mcqStorage.createMcqAttempt({
                userId,
                questionId: data.questionId,
                sessionId,
                selectedOptionIndex: data.selectedOptionIndex,
                isCorrect,
                timeSpentMs: data.timeSpentMs,
            });

            // Update session counters
            await mcqStorage.updateMcqSession(sessionId, {
                answeredCount: session.answeredCount + 1,
                correctCount: session.correctCount + (isCorrect ? 1 : 0),
            });

            // Update topic stats (SIE)
            if (question.topicId) {
                await mcqStorage.updateTopicStats(
                    userId,
                    question.subjectId,
                    question.topicId,
                    isCorrect,
                    data.timeSpentMs,
                );
            }

            // Generate AI feedback if configured
            let aiFeedback: string | undefined;
            if (mcqAI.isAIConfigured()) {
                try {
                    const feedback = await mcqAI.getQuestionFeedback(
                        question.questionText,
                        question.options as { label: string; text: string }[],
                        question.correctOptionIndex,
                        data.selectedOptionIndex,
                        { subject: question.subjectId, topic: question.topicId || undefined },
                    );
                    aiFeedback = feedback.feedback;

                    // Save AI feedback to attempt
                    // (we'd need an update method, but for now include in response)
                } catch (aiErr) {
                    console.warn("AI feedback generation failed:", aiErr);
                }
            }

            return res.json({
                attempt,
                isCorrect,
                correctOptionIndex: question.correctOptionIndex,
                explanation: question.explanation,
                aiFeedback,
            });
        } catch (err: any) {
            if (err.name === "ZodError") return res.status(400).json({ error: "Validation failed", details: err.errors });
            console.error("Error submitting MCQ answer:", err);
            return res.status(500).json({ error: "Failed to submit answer" });
        }
    });

    // Complete a session
    router.post("/api/mcq/sessions/:id/complete", requireAuth, async (req: Request, res: Response) => {
        try {
            const userId = (req.session as any).userId;
            const session = await mcqStorage.getMcqSession(req.params.id);

            if (!session) return res.status(404).json({ error: "Session not found" });
            if (session.userId !== userId) return res.status(403).json({ error: "Not your session" });
            if (session.completedAt) return res.status(400).json({ error: "Session already completed" });

            const score = session.answeredCount > 0
                ? Math.round((session.correctCount / session.answeredCount) * 100)
                : 0;

            const updated = await mcqStorage.updateMcqSession(req.params.id, {
                completedAt: new Date(),
                score,
            });

            // Get all attempts for the session
            const attempts = await mcqStorage.getMcqAttemptsBySession(req.params.id);

            return res.json({
                session: updated,
                score,
                totalCorrect: session.correctCount,
                totalAnswered: session.answeredCount,
                attempts,
            });
        } catch (err) {
            console.error("Error completing MCQ session:", err);
            return res.status(500).json({ error: "Failed to complete session" });
        }
    });

    // Get session details + results
    router.get("/api/mcq/sessions/:id", requireAuth, async (req: Request, res: Response) => {
        try {
            const userId = (req.session as any).userId;
            const session = await mcqStorage.getMcqSession(req.params.id);

            if (!session) return res.status(404).json({ error: "Session not found" });
            if (session.userId !== userId) return res.status(403).json({ error: "Not your session" });

            const attempts = await mcqStorage.getMcqAttemptsBySession(req.params.id);
            return res.json({ session, attempts });
        } catch (err) {
            console.error("Error getting MCQ session:", err);
            return res.status(500).json({ error: "Failed to get session" });
        }
    });

    // List user's sessions
    router.get("/api/mcq/sessions", requireAuth, async (req: Request, res: Response) => {
        try {
            const userId = (req.session as any).userId;
            const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
            const sessions = await mcqStorage.getUserMcqSessions(userId, limit);
            return res.json(sessions);
        } catch (err) {
            console.error("Error listing MCQ sessions:", err);
            return res.status(500).json({ error: "Failed to list sessions" });
        }
    });

    // ========================================================================
    // AI SERVICES — Solver + Generator
    // ========================================================================

    // Check if AI is available
    router.get("/api/mcq/ai/status", requireAuth, async (_req: Request, res: Response) => {
        return res.json({ available: mcqAI.isAIConfigured() });
    });

    // Solve a question using AI
    router.post("/api/mcq/ai/solve", requireAuth, apiLimiter, async (req: Request, res: Response) => {
        try {
            if (!mcqAI.isAIConfigured()) {
                return res.status(503).json({ error: "AI service not configured. Set GEMINI_API_KEY or OPENAI_API_KEY." });
            }

            const schema = z.object({
                questionText: z.string().min(5),
                options: z.array(z.object({ label: z.string(), text: z.string() })).length(4),
                context: z.object({
                    subject: z.string().optional(),
                    topic: z.string().optional(),
                    board: z.string().optional(),
                }).optional(),
            });

            const data = schema.parse(req.body);
            const result = await mcqAI.solveMcq(data.questionText, data.options, data.context);
            return res.json(result);
        } catch (err: any) {
            if (err.name === "ZodError") return res.status(400).json({ error: "Validation failed", details: err.errors });
            console.error("Error solving MCQ:", err);
            return res.status(500).json({ error: "Failed to solve question" });
        }
    });

    // Generate new MCQ questions using AI
    router.post("/api/mcq/ai/generate", requireAuth, requireRole("teacher"), requireApproved, apiLimiter, async (req: Request, res: Response) => {
        try {
            if (!mcqAI.isAIConfigured()) {
                return res.status(503).json({ error: "AI service not configured. Set GEMINI_API_KEY or OPENAI_API_KEY." });
            }

            const schema = z.object({
                subject: z.string().min(1),
                topic: z.string().min(1),
                difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
                count: z.number().min(1).max(20).default(5),
                board: z.string().optional(),
                bloomsLevel: z.string().optional(),
                style: z.string().optional(),
                subjectId: z.string().optional(), // for auto-saving to DB
                topicId: z.string().optional(),
                boardId: z.string().optional(),
                autoSave: z.boolean().default(false),
            });

            const data = schema.parse(req.body);
            const userId = (req.session as any).userId;

            const generated = await mcqAI.generateMcqs({
                subject: data.subject,
                topic: data.topic,
                difficulty: data.difficulty,
                count: data.count,
                board: data.board,
                bloomsLevel: data.bloomsLevel,
                style: data.style,
            });

            // Auto-save to database if requested
            let saved: any[] = [];
            if (data.autoSave && data.subjectId) {
                const toSave = generated.map(q => ({
                    subjectId: data.subjectId!,
                    topicId: data.topicId,
                    boardId: data.boardId,
                    questionText: q.questionText,
                    options: q.options,
                    correctOptionIndex: q.correctOptionIndex,
                    explanation: q.explanation,
                    difficulty: q.difficulty as "easy" | "medium" | "hard",
                    tags: q.tags,
                    bloomsLevel: q.bloomsLevel,
                    source: "ai_generated" as const,
                    createdBy: userId,
                    confidenceScore: 85, // Default confidence for AI-generated
                }));
                saved = await mcqStorage.createMcqQuestionsBulk(toSave);
            }

            return res.json({
                generated,
                saved: saved.length > 0 ? saved : undefined,
                count: generated.length,
            });
        } catch (err: any) {
            if (err.name === "ZodError") return res.status(400).json({ error: "Validation failed", details: err.errors });
            console.error("Error generating MCQs:", err);
            return res.status(500).json({ error: "Failed to generate questions" });
        }
    });

    // ========================================================================
    // STUDENT INTELLIGENCE ENGINE — Stats & Recommendations
    // ========================================================================

    // Get user's overall stats
    router.get("/api/mcq/stats", requireAuth, async (req: Request, res: Response) => {
        try {
            const userId = (req.session as any).userId;
            const subjectId = req.query.subjectId as string | undefined;
            const stats = await mcqStorage.getUserTopicStats(userId, subjectId);
            const snapshot = SIE.calculatePerformanceSnapshot(stats);
            return res.json(snapshot);
        } catch (err) {
            console.error("Error getting MCQ stats:", err);
            return res.status(500).json({ error: "Failed to get stats" });
        }
    });

    // Get per-subject stats breakdown
    router.get("/api/mcq/stats/subject/:subjectId", requireAuth, async (req: Request, res: Response) => {
        try {
            const userId = (req.session as any).userId;
            const stats = await mcqStorage.getUserTopicStats(userId, req.params.subjectId);
            const snapshot = SIE.calculatePerformanceSnapshot(stats);

            // Get weak topics
            const weakTopics = await mcqStorage.getWeakTopics(userId, req.params.subjectId);

            // Get topic names for context
            const topicIds = stats.map(s => s.topicId);
            const topics = await Promise.all(
                Array.from(new Set(topicIds)).map(id => storage.getTopic(id)),
            );
            const topicMap = Object.fromEntries(
                topics.filter(Boolean).map(t => [t!.id, t!.name]),
            );

            return res.json({
                ...snapshot,
                topicBreakdown: snapshot.topicBreakdown.map(t => ({
                    ...t,
                    topicName: topicMap[t.topicId] || "Unknown Topic",
                })),
                weakTopics: weakTopics.map(w => ({
                    ...w,
                    topicName: topicMap[w.topicId] || "Unknown Topic",
                })),
            });
        } catch (err) {
            console.error("Error getting subject stats:", err);
            return res.status(500).json({ error: "Failed to get subject stats" });
        }
    });

    // Get study recommendations (SIE)
    router.get("/api/mcq/recommendations", requireAuth, async (req: Request, res: Response) => {
        try {
            const userId = (req.session as any).userId;
            const subjectId = req.query.subjectId as string;
            if (!subjectId) return res.status(400).json({ error: "subjectId is required" });

            const stats = await mcqStorage.getUserTopicStats(userId, subjectId);

            // Get all available topics for this subject
            const allTopics = await storage.getTopicsBySubject(subjectId);
            const availableTopicIds = allTopics.map(t => t.id);

            const recommendations = SIE.generateRecommendations(stats, availableTopicIds);

            // Enrich with topic names
            const topicMap = Object.fromEntries(allTopics.map(t => [t.id, t.name]));
            const enriched = recommendations.map(r => ({
                ...r,
                topicName: topicMap[r.topicId] || "Unknown Topic",
            }));

            return res.json(enriched);
        } catch (err) {
            console.error("Error getting recommendations:", err);
            return res.status(500).json({ error: "Failed to get recommendations" });
        }
    });

    // Get question count metadata
    router.get("/api/mcq/meta", requireAuth, async (req: Request, res: Response) => {
        try {
            const subjectId = req.query.subjectId as string | undefined;
            const totalQuestions = await mcqStorage.getMcqQuestionCount(subjectId);
            const aiAvailable = mcqAI.isAIConfigured();
            return res.json({ totalQuestions, aiAvailable });
        } catch (err) {
            console.error("Error getting MCQ meta:", err);
            return res.status(500).json({ error: "Failed to get metadata" });
        }
    });

    // ========================================================================
    // PDF MCQ EXTRACTION — youlearn.ai-style RAG pipeline
    // ========================================================================

    // Extract MCQs from PDF — preview only (don't save)
    router.post("/api/mcq/extract-from-pdf", requireAuth, upload.single('pdf'), async (req: Request, res: Response) => {
        try {
            if (!mcqAI.isAIConfigured()) {
                return res.status(503).json({ error: "AI not configured. Set GEMINI_API_KEY or OPENAI_API_KEY." });
            }
            if (!req.file) {
                return res.status(400).json({ error: "No PDF file uploaded" });
            }

            const options: mcqExtractor.ExtractionOptions = {
                subjectId: req.body.subjectId,
                topicId: req.body.topicId,
                boardId: req.body.boardId,
                subject: req.body.subject,
                topic: req.body.topic,
                difficulty: req.body.difficulty as any,
                maxQuestions: Math.min(parseInt(req.body.maxQuestions || '10'), 30),
                questionsPerChunk: parseInt(req.body.questionsPerChunk || '3'),
            };

            const result = await mcqExtractor.extractMcqsFromPdf(req.file.buffer, options);
            return res.json(result);
        } catch (err: any) {
            console.error("Error extracting MCQs from PDF:", err);
            return res.status(500).json({ error: err.message || "Failed to extract MCQs" });
        }
    });

    // Extract MCQs from PDF and save to database
    router.post("/api/mcq/extract-and-save", requireAuth, requireRole('teacher'), upload.single('pdf'), async (req: Request, res: Response) => {
        try {
            if (!mcqAI.isAIConfigured()) {
                return res.status(503).json({ error: "AI not configured. Set GEMINI_API_KEY or OPENAI_API_KEY." });
            }
            if (!req.file) {
                return res.status(400).json({ error: "No PDF file uploaded" });
            }

            const subjectId = req.body.subjectId;
            if (!subjectId) {
                return res.status(400).json({ error: "subjectId is required for saving questions" });
            }

            const options: mcqExtractor.ExtractionOptions = {
                subjectId,
                topicId: req.body.topicId,
                boardId: req.body.boardId,
                subject: req.body.subject,
                topic: req.body.topic,
                difficulty: req.body.difficulty as any,
                maxQuestions: Math.min(parseInt(req.body.maxQuestions || '10'), 30),
                questionsPerChunk: parseInt(req.body.questionsPerChunk || '3'),
            };

            const result = await mcqExtractor.extractMcqsFromPdf(req.file.buffer, options);

            // Save extracted questions to DB
            const saved = [];
            for (const q of result.questions) {
                const question = await mcqStorage.createMcqQuestion({
                    subjectId,
                    topicId: req.body.topicId || null,
                    boardId: req.body.boardId || null,
                    questionText: q.questionText,
                    options: q.options,
                    correctOptionIndex: q.correctOptionIndex,
                    explanation: q.explanation,
                    difficulty: (q.difficulty || 'medium') as 'easy' | 'medium' | 'hard',
                    source: 'extracted',
                    tags: q.tags || [],
                    bloomsLevel: q.bloomsLevel,
                    marks: 1,
                    isVerified: false,
                    createdBy: (req as any).session?.userId,
                });
                saved.push(question);
            }

            return res.json({
                ...result,
                savedCount: saved.length,
                savedQuestions: saved,
            });
        } catch (err: any) {
            console.error("Error in extract-and-save:", err);
            return res.status(500).json({ error: err.message || "Failed to extract and save MCQs" });
        }
    });

    // Extract MCQs from raw text (no PDF needed)
    router.post("/api/mcq/extract-from-text", requireAuth, apiLimiter, async (req: Request, res: Response) => {
        try {
            if (!mcqAI.isAIConfigured()) {
                return res.status(503).json({ error: "AI not configured" });
            }

            const { text, subjectId, topicId, subject, topic, difficulty, maxQuestions } = req.body;
            if (!text || text.length < 50) {
                return res.status(400).json({ error: "Text must be at least 50 characters" });
            }

            const result = await mcqExtractor.extractMcqsFromText(text, {
                subjectId,
                topicId,
                subject,
                topic,
                difficulty,
                maxQuestions: Math.min(maxQuestions || 10, 30),
            });

            return res.json(result);
        } catch (err: any) {
            console.error("Error extracting from text:", err);
            return res.status(500).json({ error: err.message || "Failed to extract MCQs" });
        }
    });
}
