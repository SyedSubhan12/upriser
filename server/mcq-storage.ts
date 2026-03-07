import {
    type McqQuestion, type InsertMcqQuestion,
    type McqAttempt, type InsertMcqAttempt,
    type McqSession, type InsertMcqSession,
    type McqTopicStat, type InsertMcqTopicStat,
    mcqQuestions, mcqAttempts, mcqSessions, mcqTopicStats,
} from "@shared/schema";
import viteConfig from "../vite.config.js";
import { db } from "./db.js";
import { eq, and, desc, sql, count, inArray, ilike, asc } from "drizzle-orm";
import { randomUUID } from "crypto";

const mcqQuestionSelect = {
    id: mcqQuestions.id,
    subjectId: mcqQuestions.subjectId,
    topicId: mcqQuestions.topicId,
    boardId: mcqQuestions.boardId,
    qualId: mcqQuestions.qualId,
    questionText: mcqQuestions.questionText,
    options: mcqQuestions.options,
    correctOptionIndex: mcqQuestions.correctOptionIndex,
    explanation: mcqQuestions.explanation,
    difficulty: mcqQuestions.difficulty,
    source: mcqQuestions.source,
    year: mcqQuestions.year,
    session: mcqQuestions.session,
    paper: mcqQuestions.paper,
    variant: mcqQuestions.variant,
    tags: mcqQuestions.tags,
    bloomsLevel: mcqQuestions.bloomsLevel,
    marks: mcqQuestions.marks,
    isVerified: mcqQuestions.isVerified,
    verifiedBy: mcqQuestions.verifiedBy,
    confidenceScore: mcqQuestions.confidenceScore,
    createdBy: mcqQuestions.createdBy,
    createdAt: mcqQuestions.createdAt,
    updatedAt: mcqQuestions.updatedAt,
} as const;

// =============================================================================
// MCQ QUESTIONS CRUD
// =============================================================================

export async function getMcqQuestion(id: string): Promise<McqQuestion | undefined> {
    const [question] = await db.select(mcqQuestionSelect).from(mcqQuestions).where(eq(mcqQuestions.id, id));
    return question as McqQuestion | undefined;
}

export async function getMcqQuestions(filters: {
    subjectId?: string;
    topicId?: string;
    boardId?: string;
    difficulty?: string;
    source?: string;
    isVerified?: boolean;
    tags?: string[];
    search?: string;
    year?: number;
    session?: string;
    paper?: number;
    variant?: number;
    qualId?: string;
    branchId?: string;
    page?: number;
    limit?: number;
}): Promise<{ questions: McqQuestion[]; total: number }> {
    const conditions = [];

    if (filters.subjectId) conditions.push(eq(mcqQuestions.subjectId, filters.subjectId));
    if (filters.topicId) conditions.push(eq(mcqQuestions.topicId, filters.topicId));
    if (filters.boardId) conditions.push(eq(mcqQuestions.boardId, filters.boardId));
    if (filters.difficulty) conditions.push(eq(mcqQuestions.difficulty, filters.difficulty as any));
    if (filters.source) conditions.push(eq(mcqQuestions.source, filters.source as any));
    if (filters.isVerified !== undefined) conditions.push(eq(mcqQuestions.isVerified, filters.isVerified));
    if (filters.search) conditions.push(ilike(mcqQuestions.questionText, `%${filters.search}%`));
    if (filters.year) conditions.push(eq(mcqQuestions.year, filters.year));
    if (filters.session) conditions.push(eq(mcqQuestions.session, filters.session));
    if (filters.paper) conditions.push(eq(mcqQuestions.paper, filters.paper));
    if (filters.variant) conditions.push(eq(mcqQuestions.variant, filters.variant));
    if (filters.qualId) conditions.push(eq(mcqQuestions.qualId, filters.qualId));
    if (filters.branchId) conditions.push(eq(mcqQuestions.branchId, filters.branchId));

    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 20, 100);
    const offset = (page - 1) * limit;

    const [totalResult] = await db.select({ count: count() }).from(mcqQuestions).where(where);
    const questions = await db.select(mcqQuestionSelect).from(mcqQuestions)
        .where(where)
        .orderBy(desc(mcqQuestions.createdAt))
        .limit(limit)
        .offset(offset);

    return { questions: questions as McqQuestion[], total: totalResult?.count || 0 };
}

export async function getRandomMcqQuestions(opts: {
    subjectId: string;
    topicId?: string;
    difficulty?: string;
    year?: number;
    session?: string;
    paper?: number;
    variant?: number;
    qualId?: string;
    branchId?: string;
    count: number;
    excludeIds?: string[];
}): Promise<McqQuestion[]> {
    const conditions = [eq(mcqQuestions.subjectId, opts.subjectId)];
    if (opts.topicId) conditions.push(eq(mcqQuestions.topicId, opts.topicId));
    if (opts.difficulty) conditions.push(eq(mcqQuestions.difficulty, opts.difficulty as any));
    if (opts.year) conditions.push(eq(mcqQuestions.year, opts.year));
    if (opts.session) conditions.push(eq(mcqQuestions.session, opts.session));
    if (opts.paper) conditions.push(eq(mcqQuestions.paper, opts.paper));
    if (opts.variant) conditions.push(eq(mcqQuestions.variant, opts.variant));
    if (opts.qualId) conditions.push(eq(mcqQuestions.qualId, opts.qualId));
    if (opts.branchId) conditions.push(eq(mcqQuestions.branchId, opts.branchId));
    if (opts.excludeIds && opts.excludeIds.length > 0) {
        conditions.push(sql`${mcqQuestions.id} NOT IN (${sql.join(opts.excludeIds.map(id => sql`${id}`), sql`, `)})`);
    }

    const questions = await db.select(mcqQuestionSelect).from(mcqQuestions)
        .where(and(...conditions))
        .orderBy(sql`RANDOM()`)
        .limit(opts.count);

    return questions as McqQuestion[];
}

export async function createMcqQuestion(data: InsertMcqQuestion): Promise<McqQuestion> {
    const id = randomUUID();
    const [question] = await db.insert(mcqQuestions).values({ ...data, id }).returning();
    return question;
}

export async function createMcqQuestionsBulk(questions: InsertMcqQuestion[]): Promise<McqQuestion[]> {
    const withIds = questions.map(q => ({ ...q, id: randomUUID() }));
    return db.insert(mcqQuestions).values(withIds).returning();
}

export async function updateMcqQuestion(id: string, data: Partial<InsertMcqQuestion>): Promise<McqQuestion | undefined> {
    const [question] = await db.update(mcqQuestions)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(mcqQuestions.id, id))
        .returning();
    return question;
}

export async function deleteMcqQuestion(id: string): Promise<boolean> {
    const result = await db.delete(mcqQuestions).where(eq(mcqQuestions.id, id)).returning();
    return result.length > 0;
}

export async function getMcqQuestionCount(subjectId?: string): Promise<number> {
    const where = subjectId ? eq(mcqQuestions.subjectId, subjectId) : undefined;
    const [result] = await db.select({ count: count() }).from(mcqQuestions).where(where);
    return result?.count || 0;
}

// =============================================================================
// MCQ ATTEMPTS CRUD
// =============================================================================

export async function createMcqAttempt(data: InsertMcqAttempt): Promise<McqAttempt> {
    const id = randomUUID();
    const [attempt] = await db.insert(mcqAttempts).values({ ...data, id }).returning();
    return attempt;
}

export async function getMcqAttemptsBySession(sessionId: string): Promise<McqAttempt[]> {
    return db.select().from(mcqAttempts)
        .where(eq(mcqAttempts.sessionId, sessionId))
        .orderBy(asc(mcqAttempts.createdAt));
}

export async function getMcqAttemptsByUser(userId: string, limit = 50): Promise<McqAttempt[]> {
    return db.select().from(mcqAttempts)
        .where(eq(mcqAttempts.userId, userId))
        .orderBy(desc(mcqAttempts.createdAt))
        .limit(limit);
}

export async function getUserQuestionHistory(userId: string, questionIds: string[]): Promise<McqAttempt[]> {
    if (questionIds.length === 0) return [];
    return db.select().from(mcqAttempts)
        .where(and(
            eq(mcqAttempts.userId, userId),
            inArray(mcqAttempts.questionId, questionIds),
        ));
}

// =============================================================================
// MCQ SESSIONS CRUD
// =============================================================================

export async function createMcqSession(data: InsertMcqSession): Promise<McqSession> {
    const id = randomUUID();
    const [session] = await db.insert(mcqSessions).values({ ...data, id }).returning();
    return session;
}

export async function getMcqSession(id: string): Promise<McqSession | undefined> {
    const [session] = await db.select().from(mcqSessions).where(eq(mcqSessions.id, id));
    return session;
}

export async function updateMcqSession(id: string, data: Partial<McqSession>): Promise<McqSession | undefined> {
    const [session] = await db.update(mcqSessions)
        .set(data)
        .where(eq(mcqSessions.id, id))
        .returning();
    return session;
}

export async function getUserMcqSessions(userId: string, limit = 20): Promise<McqSession[]> {
    return db.select().from(mcqSessions)
        .where(eq(mcqSessions.userId, userId))
        .orderBy(desc(mcqSessions.startedAt))
        .limit(limit);
}

// =============================================================================
// MCQ TOPIC STATS (Student Intelligence Engine Foundation)
// =============================================================================

export async function getOrCreateTopicStats(
    userId: string,
    subjectId: string,
    topicId: string,
): Promise<McqTopicStat> {
    const [existing] = await db.select().from(mcqTopicStats).where(
        and(
            eq(mcqTopicStats.userId, userId),
            eq(mcqTopicStats.subjectId, subjectId),
            eq(mcqTopicStats.topicId, topicId),
        ),
    );

    if (existing) return existing;

    const id = randomUUID();
    const [created] = await db.insert(mcqTopicStats).values({
        id, userId, subjectId, topicId,
        totalAttempted: 0, totalCorrect: 0, masteryScore: 0, streak: 0, longestStreak: 0,
    }).returning();
    return created;
}

export async function updateTopicStats(
    userId: string,
    subjectId: string,
    topicId: string,
    isCorrect: boolean,
    timeSpentMs?: number,
): Promise<McqTopicStat> {
    const stats = await getOrCreateTopicStats(userId, subjectId, topicId);

    const newTotal = stats.totalAttempted + 1;
    const newCorrect = stats.totalCorrect + (isCorrect ? 1 : 0);
    const newStreak = isCorrect ? stats.streak + 1 : 0;
    const newLongestStreak = Math.max(stats.longestStreak, newStreak);

    // Calculate mastery score using weighted algorithm
    // Recent performance weighted higher + streak bonus
    const accuracy = newTotal > 0 ? (newCorrect / newTotal) * 100 : 0;
    const streakBonus = Math.min(newStreak * 2, 20); // Max 20 points from streak
    const recencyFactor = Math.min(newTotal, 20) / 20; // Ramp up confidence with more attempts
    const masteryScore = Math.round(Math.min(accuracy * recencyFactor + streakBonus, 100));

    // Confidence level based on mastery + total attempts
    let confidenceLevel = "unknown";
    if (newTotal >= 5) {
        if (masteryScore >= 80) confidenceLevel = "high";
        else if (masteryScore >= 50) confidenceLevel = "medium";
        else confidenceLevel = "low";
    }

    // Update avg time
    const avgTimeMs = timeSpentMs
        ? Math.round(((stats.avgTimeMs || 0) * stats.totalAttempted + timeSpentMs) / newTotal)
        : stats.avgTimeMs;

    const [updated] = await db.update(mcqTopicStats)
        .set({
            totalAttempted: newTotal,
            totalCorrect: newCorrect,
            streak: newStreak,
            longestStreak: newLongestStreak,
            masteryScore,
            confidenceLevel,
            avgTimeMs,
            lastAttemptedAt: new Date(),
            updatedAt: new Date(),
        })
        .where(eq(mcqTopicStats.id, stats.id))
        .returning();

    return updated;
}

export async function getUserTopicStats(userId: string, subjectId?: string): Promise<McqTopicStat[]> {
    const conditions = [eq(mcqTopicStats.userId, userId)];
    if (subjectId) conditions.push(eq(mcqTopicStats.subjectId, subjectId));

    return db.select().from(mcqTopicStats)
        .where(and(...conditions))
        .orderBy(desc(mcqTopicStats.lastAttemptedAt));
}

export async function getWeakTopics(userId: string, subjectId: string, limit = 5): Promise<McqTopicStat[]> {
    return db.select().from(mcqTopicStats)
        .where(and(
            eq(mcqTopicStats.userId, userId),
            eq(mcqTopicStats.subjectId, subjectId),
            sql`${mcqTopicStats.totalAttempted} >= 3`, // At least 3 attempts to judge
        ))
        .orderBy(asc(mcqTopicStats.masteryScore))
        .limit(limit);
}
