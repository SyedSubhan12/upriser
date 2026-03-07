/**
 * Student Intelligence Engine (SIE)
 * 
 * Inspired by youlearn.ai — adaptive learning system that:
 * 1. Tracks per-topic mastery using weighted scoring
 * 2. Detects weak topics needing review
 * 3. Selects questions adaptively based on performance
 * 4. Implements spaced repetition scheduling
 * 5. Generates personalized study recommendations
 */

import * as mcqStorage from "../mcq-storage";
import type { McqTopicStat, McqQuestion } from "@shared/schema";

// ============================================================================
// MASTERY LEVELS
// ============================================================================

export const MASTERY_LEVELS = {
    BEGINNER: { min: 0, max: 29, label: "Beginner", color: "#ef4444", emoji: "🔴" },
    DEVELOPING: { min: 30, max: 49, label: "Developing", color: "#f97316", emoji: "🟠" },
    PROFICIENT: { min: 50, max: 69, label: "Proficient", color: "#eab308", emoji: "🟡" },
    ADVANCED: { min: 70, max: 89, label: "Advanced", color: "#22c55e", emoji: "🟢" },
    MASTERED: { min: 90, max: 100, label: "Mastered", color: "#3b82f6", emoji: "🔵" },
} as const;

export function getMasteryLevel(score: number): typeof MASTERY_LEVELS[keyof typeof MASTERY_LEVELS] {
    if (score >= 90) return MASTERY_LEVELS.MASTERED;
    if (score >= 70) return MASTERY_LEVELS.ADVANCED;
    if (score >= 50) return MASTERY_LEVELS.PROFICIENT;
    if (score >= 30) return MASTERY_LEVELS.DEVELOPING;
    return MASTERY_LEVELS.BEGINNER;
}

// ============================================================================
// ADAPTIVE DIFFICULTY SELECTION
// ============================================================================

/**
 * Selects the optimal difficulty for a student based on their mastery.
 * Uses a "zone of proximal development" approach:
 * - Low mastery → easy questions to build confidence
 * - Medium mastery → medium questions for growth
 * - High mastery → hard questions for challenge
 * - Mix in some variety to prevent boredom
 */
export function getAdaptiveDifficulty(masteryScore: number): {
    primary: "easy" | "medium" | "hard";
    distribution: { easy: number; medium: number; hard: number };
} {
    if (masteryScore < 30) {
        return {
            primary: "easy",
            distribution: { easy: 0.6, medium: 0.3, hard: 0.1 },
        };
    }
    if (masteryScore < 50) {
        return {
            primary: "easy",
            distribution: { easy: 0.4, medium: 0.4, hard: 0.2 },
        };
    }
    if (masteryScore < 70) {
        return {
            primary: "medium",
            distribution: { easy: 0.2, medium: 0.5, hard: 0.3 },
        };
    }
    if (masteryScore < 90) {
        return {
            primary: "hard",
            distribution: { easy: 0.1, medium: 0.3, hard: 0.6 },
        };
    }
    return {
        primary: "hard",
        distribution: { easy: 0.05, medium: 0.25, hard: 0.7 },
    };
}

// ============================================================================
// SPACED REPETITION SCHEDULER
// ============================================================================

/**
 * Calculates when a topic should next be reviewed based on mastery.
 * Uses a simplified Leitner system:
 * - Mastered topics → review in 14 days
 * - Advanced topics → review in 7 days
 * - Proficient topics → review in 3 days
 * - Developing topics → review in 1 day
 * - Beginner topics → review now
 */
export function getNextReviewDate(stat: McqTopicStat): Date {
    const now = new Date();
    const dayMs = 24 * 60 * 60 * 1000;

    const level = getMasteryLevel(stat.masteryScore);
    let daysUntilReview = 0;

    switch (level.label) {
        case "Mastered": daysUntilReview = 14; break;
        case "Advanced": daysUntilReview = 7; break;
        case "Proficient": daysUntilReview = 3; break;
        case "Developing": daysUntilReview = 1; break;
        default: daysUntilReview = 0; break;
    }

    const lastAttempt = stat.lastAttemptedAt ? new Date(stat.lastAttemptedAt) : now;
    return new Date(lastAttempt.getTime() + daysUntilReview * dayMs);
}

/**
 * Returns topics that are due for review, sorted by urgency.
 */
export function getTopicsDueForReview(stats: McqTopicStat[]): McqTopicStat[] {
    const now = new Date();
    return stats
        .filter(stat => {
            const reviewDate = getNextReviewDate(stat);
            return reviewDate <= now;
        })
        .sort((a, b) => {
            // Prioritize: weak topics first, then longest since last attempt
            const aScore = a.masteryScore;
            const bScore = b.masteryScore;
            if (Math.abs(aScore - bScore) > 10) return aScore - bScore;

            const aTime = a.lastAttemptedAt ? new Date(a.lastAttemptedAt).getTime() : 0;
            const bTime = b.lastAttemptedAt ? new Date(b.lastAttemptedAt).getTime() : 0;
            return aTime - bTime; // Oldest first
        });
}

// ============================================================================
// STUDY RECOMMENDATIONS
// ============================================================================

export interface StudyRecommendation {
    type: "weak_topic" | "review_due" | "streak_risk" | "new_topic" | "challenge";
    topicId: string;
    message: string;
    priority: number; // 1 = highest
    suggestedDifficulty: "easy" | "medium" | "hard";
    suggestedQuestionCount: number;
}

/**
 * Generates personalized study recommendations based on student performance.
 * This is the core "intelligence" — similar to youlearn.ai's adaptive engine.
 */
export function generateRecommendations(
    stats: McqTopicStat[],
    availableTopicIds: string[],
): StudyRecommendation[] {
    const recommendations: StudyRecommendation[] = [];
    const attemptedTopicIds = new Set(stats.map(s => s.topicId));

    // 1. Weak topics that need immediate attention
    const weakTopics = stats
        .filter(s => s.totalAttempted >= 3 && s.masteryScore < 40)
        .sort((a, b) => a.masteryScore - b.masteryScore);

    for (const stat of weakTopics.slice(0, 3)) {
        recommendations.push({
            type: "weak_topic",
            topicId: stat.topicId,
            message: `You're struggling with this topic (${stat.masteryScore}% mastery). Practice with easier questions to build confidence.`,
            priority: 1,
            suggestedDifficulty: "easy",
            suggestedQuestionCount: 10,
        });
    }

    // 2. Topics due for spaced repetition review
    const dueTopics = getTopicsDueForReview(stats);
    for (const stat of dueTopics.slice(0, 3)) {
        const adaptive = getAdaptiveDifficulty(stat.masteryScore);
        recommendations.push({
            type: "review_due",
            topicId: stat.topicId,
            message: `Time to review! Your mastery is ${stat.masteryScore}%. Keep it fresh.`,
            priority: 2,
            suggestedDifficulty: adaptive.primary,
            suggestedQuestionCount: 5,
        });
    }

    // 3. Streak at risk — topics where streak was broken recently
    const streakRisk = stats
        .filter(s => s.streak === 0 && s.longestStreak >= 5 && s.masteryScore >= 50)
        .slice(0, 2);

    for (const stat of streakRisk) {
        recommendations.push({
            type: "streak_risk",
            topicId: stat.topicId,
            message: `Your ${stat.longestStreak}-question streak was broken! Get back on track.`,
            priority: 3,
            suggestedDifficulty: "medium",
            suggestedQuestionCount: 5,
        });
    }

    // 4. New topics not yet attempted
    const newTopics = availableTopicIds.filter(id => !attemptedTopicIds.has(id));
    for (const topicId of newTopics.slice(0, 2)) {
        recommendations.push({
            type: "new_topic",
            topicId,
            message: `You haven't tried this topic yet. Start with easy questions to get familiar.`,
            priority: 4,
            suggestedDifficulty: "easy",
            suggestedQuestionCount: 5,
        });
    }

    // 5. Challenge — push mastered topics further
    const masteredTopics = stats
        .filter(s => s.masteryScore >= 80 && s.totalAttempted < 30)
        .slice(0, 2);

    for (const stat of masteredTopics) {
        recommendations.push({
            type: "challenge",
            topicId: stat.topicId,
            message: `You're doing great (${stat.masteryScore}%)! Challenge yourself with harder questions.`,
            priority: 5,
            suggestedDifficulty: "hard",
            suggestedQuestionCount: 5,
        });
    }

    return recommendations.sort((a, b) => a.priority - b.priority);
}

// ============================================================================
// PERFORMANCE ANALYTICS
// ============================================================================

export interface PerformanceSnapshot {
    overallMastery: number;
    totalQuestionsAnswered: number;
    totalCorrect: number;
    overallAccuracy: number;
    topicBreakdown: {
        topicId: string;
        mastery: number;
        level: string;
        accuracy: number;
        totalAttempted: number;
        avgTimeMs: number | null;
        streak: number;
        confidenceLevel: string;
    }[];
    strengths: string[]; // top 3 topic IDs
    weaknesses: string[]; // bottom 3 topic IDs
    studyStreak: number; // days in a row with activity
    recommendedFocus: string[]; // topic IDs to focus on
}

export function calculatePerformanceSnapshot(stats: McqTopicStat[]): PerformanceSnapshot {
    if (stats.length === 0) {
        return {
            overallMastery: 0,
            totalQuestionsAnswered: 0,
            totalCorrect: 0,
            overallAccuracy: 0,
            topicBreakdown: [],
            strengths: [],
            weaknesses: [],
            studyStreak: 0,
            recommendedFocus: [],
        };
    }

    const totalAnswered = stats.reduce((sum, s) => sum + s.totalAttempted, 0);
    const totalCorrect = stats.reduce((sum, s) => sum + s.totalCorrect, 0);

    // Weighted mastery — weight by number of attempts (topics with more data matter more)
    const weightedMastery = stats.reduce((sum, s) => sum + s.masteryScore * s.totalAttempted, 0);
    const overallMastery = totalAnswered > 0 ? Math.round(weightedMastery / totalAnswered) : 0;

    const topicBreakdown = stats.map(s => ({
        topicId: s.topicId,
        mastery: s.masteryScore,
        level: getMasteryLevel(s.masteryScore).label,
        accuracy: s.totalAttempted > 0 ? Math.round((s.totalCorrect / s.totalAttempted) * 100) : 0,
        totalAttempted: s.totalAttempted,
        avgTimeMs: s.avgTimeMs,
        streak: s.streak,
        confidenceLevel: s.confidenceLevel || "unknown",
    }));

    // Sort by mastery for strengths/weaknesses
    const sorted = [...topicBreakdown].sort((a, b) => b.mastery - a.mastery);
    const strengths = sorted.slice(0, 3).filter(t => t.mastery >= 50).map(t => t.topicId);
    const weaknesses = sorted.slice(-3).filter(t => t.mastery < 50).map(t => t.topicId);

    // Recommended focus: weak topics + review-due topics
    const dueForReview = getTopicsDueForReview(stats).map(s => s.topicId);
    const recommendedFocus = Array.from(new Set([
        ...weaknesses,
        ...dueForReview.slice(0, 3),
    ])).slice(0, 5);

    return {
        overallMastery,
        totalQuestionsAnswered: totalAnswered,
        totalCorrect,
        overallAccuracy: totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0,
        topicBreakdown,
        strengths,
        weaknesses,
        studyStreak: 0, // TODO: calculate from session timestamps
        recommendedFocus,
    };
}
