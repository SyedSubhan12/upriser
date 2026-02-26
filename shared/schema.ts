import { pgTable, text, varchar, integer, boolean, timestamp, pgEnum, jsonb, uniqueIndex, index, customType } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Custom type for Postgres bytea
export const bytea = customType<{ data: Buffer; driverParam: string | Buffer }>({
  dataType() {
    return "bytea";
  },
  toDriver(value: Buffer) {
    return value;
  },
  fromDriver(value: unknown) {
    if (Buffer.isBuffer(value)) return value;
    return Buffer.from(value as string, "hex");
  },
});

// ===========================================
// ENUM TYPES
// ===========================================
export const userRoleEnum = pgEnum("user_role", ["student", "teacher", "admin"]);
export const resourceTypeEnum = pgEnum("resource_type", ["past_paper", "notes", "video", "worksheet"]);
export const contentStatusEnum = pgEnum("content_status", ["pending", "approved", "rejected"]);
export const assignmentStatusEnum = pgEnum("assignment_status", ["pending", "submitted", "graded"]);
export const quizTypeEnum = pgEnum("quiz_type", ["practice", "mock"]);

// ===========================================
// USERS - User accounts and roles
// ===========================================
export const users = pgTable("users", {
  id: varchar("id", { length: 36 }).primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password"), // Nullable for OAuth
  googleId: text("google_id").unique(),
  authProvider: text("auth_provider").notNull().default("local"),
  name: text("name").notNull(),
  role: text("role").notNull().default("student"),
  avatar: text("avatar"),
  boardIds: text("board_ids").array(),
  subjectIds: text("subject_ids").array(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  lastLoginAt: timestamp("last_login_at"),
});

// ===========================================
// SYSTEM EVENTS - Tracking platform activities
// ===========================================
export const systemEvents = pgTable("system_events", {
  id: varchar("id", { length: 36 }).primaryKey(),
  type: text("type").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  meta: jsonb("meta"),
});

// ============================================================================
// CURRICULUM TABLES - PapaCambridge-style organization
// ============================================================================

// Education boards (CAIE, Pearson, IB, etc.)
export const boards = pgTable("curriculum_boards", {
  id: varchar("id", { length: 36 }).primaryKey(),
  boardKey: text("board_key").notNull().unique(),
  displayName: text("display_name").notNull(),
  fullName: text("full_name").notNull(),
  description: text("description"),
  logoUrl: text("logo_url"),
  sortOrder: integer("sort_order").notNull().default(0),
  isEnabled: boolean("is_enabled").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  enabledSortIdx: index("idx_curriculum_boards_enabled_sort").on(table.isEnabled, table.sortOrder),
  keyIdx: index("idx_curriculum_boards_key").on(table.boardKey),
}));

// Qualifications per board
export const qualifications = pgTable("curriculum_qualifications", {
  id: varchar("id", { length: 36 }).primaryKey(),
  boardId: varchar("board_id", { length: 36 }).notNull().references(() => boards.id, { onDelete: "cascade" }),
  qualKey: text("qual_key").notNull(),
  displayName: text("display_name").notNull(),
  hasBranching: boolean("has_branching").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  boardIdx: index("idx_curriculum_qualifications_board").on(table.boardId),
  boardSortIdx: index("idx_curriculum_qualifications_board_sort").on(table.boardId, table.sortOrder),
  boardKeyUnique: uniqueIndex("idx_curriculum_qualifications_board_key").on(table.boardId, table.qualKey),
}));

// Current/Legacy branches
export const branches = pgTable("curriculum_branches", {
  id: varchar("id", { length: 36 }).primaryKey(),
  qualId: varchar("qual_id", { length: 36 }).notNull().references(() => qualifications.id, { onDelete: "cascade" }),
  branchKey: text("branch_key").notNull(),
  displayName: text("display_name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  qualIdx: index("idx_curriculum_branches_qual").on(table.qualId),
  qualKeyUnique: uniqueIndex("idx_curriculum_branches_qual_key").on(table.qualId, table.branchKey),
}));

// Subjects within qualifications
export const subjects = pgTable("curriculum_subjects", {
  id: varchar("id", { length: 36 }).primaryKey(),
  boardId: varchar("board_id", { length: 36 }).notNull().references(() => boards.id),
  qualId: varchar("qual_id", { length: 36 }).notNull().references(() => qualifications.id),
  branchId: varchar("branch_id", { length: 36 }).references(() => branches.id),
  subjectName: text("subject_name").notNull(),
  subjectCode: text("subject_code"),
  versionTag: text("version_tag"),
  slug: text("slug").notNull(),
  sortKey: text("sort_key").notNull(),
  description: text("description"),
  icon: text("icon"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  boardIdx: index("idx_curriculum_subjects_board").on(table.boardId),
  qualIdx: index("idx_curriculum_subjects_qual").on(table.qualId),
  slugIdx: index("idx_curriculum_subjects_slug").on(table.slug),
  codeIdx: index("idx_curriculum_subjects_code").on(table.subjectCode),
}));

// IB DP Subject Groups
export const subjectGroups = pgTable("curriculum_subject_groups", {
  id: varchar("id", { length: 36 }).primaryKey(),
  programId: varchar("program_id", { length: 36 }).notNull().references(() => qualifications.id),
  name: text("name").notNull(),
  description: text("description"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Resource categories (Past Papers, Notes, etc.)
export const resourceCategories = pgTable("curriculum_resource_categories", {
  id: varchar("id", { length: 36 }).primaryKey(),
  resourceKey: text("resource_key").notNull().unique(),
  displayName: text("display_name").notNull(),
  icon: text("icon").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Folder tree structure
export const resourceNodes = pgTable("curriculum_resource_nodes", {
  id: varchar("id", { length: 36 }).primaryKey(),
  subjectId: varchar("subject_id", { length: 36 }).notNull().references(() => subjects.id, { onDelete: "cascade" }),
  resourceKey: text("resource_key").notNull().references(() => resourceCategories.resourceKey),
  parentNodeId: varchar("parent_node_id", { length: 36 }),
  title: text("title").notNull(),
  nodeType: text("node_type").notNull(),
  meta: jsonb("meta"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Uploaded file assets
export const fileAssets = pgTable("curriculum_file_assets", {
  id: varchar("id", { length: 36 }).primaryKey(),
  subjectId: varchar("subject_id", { length: 36 }).notNull().references(() => subjects.id, { onDelete: "cascade" }),
  resourceKey: text("resource_key").notNull().references(() => resourceCategories.resourceKey),
  nodeId: varchar("node_id", { length: 36 }).notNull().references(() => resourceNodes.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  fileName: text("file_name").notNull(),
  mimeType: text("mime_type").notNull(),
  fileSize: integer("file_size"),
  fileType: text("file_type").notNull(), // qp, ms, gt, er, in, ir, other
  year: integer("year"),
  session: text("session"),
  paper: integer("paper"),
  variant: integer("variant"),
  objectKey: text("object_key"), // Now nullable as we might use DB storage
  url: text("url"),
  isPublic: boolean("is_public").notNull().default(true),
  downloadCount: integer("download_count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ===========================================
// APP TABLES - Topics, Materials, Quizzes
// ===========================================
export const topics = pgTable("topics", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: text("name").notNull(),
  subjectId: varchar("subject_id", { length: 36 }).notNull(),
  parentId: varchar("parent_id", { length: 36 }),
  order: integer("order").notNull().default(0),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const materials = pgTable("materials", {
  id: varchar("id", { length: 36 }).primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  type: text("type").notNull(),
  boardId: varchar("board_id", { length: 36 }).notNull(),
  subjectId: varchar("subject_id", { length: 36 }).notNull(),
  topicId: varchar("topic_id", { length: 36 }),
  year: integer("year"),
  difficulty: text("difficulty"),
  fileUrl: text("file_url"),
  videoUrl: text("video_url"),
  uploaderId: varchar("uploader_id", { length: 36 }).notNull(),
  status: text("status").notNull().default("pending"),
  viewCount: integer("view_count").notNull().default(0),
  downloadCount: integer("download_count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const quizzes = pgTable("quizzes", {
  id: varchar("id", { length: 36 }).primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  boardId: varchar("board_id", { length: 36 }).notNull(),
  subjectId: varchar("subject_id", { length: 36 }).notNull(),
  topicId: varchar("topic_id", { length: 36 }),
  type: text("type").notNull().default("practice"),
  duration: integer("duration"),
  isTimed: boolean("is_timed").notNull().default(false),
  creatorId: varchar("creator_id", { length: 36 }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const questions = pgTable("questions", {
  id: varchar("id", { length: 36 }).primaryKey(),
  quizId: varchar("quiz_id", { length: 36 }).notNull(),
  questionText: text("question_text").notNull(),
  options: text("options").array().notNull(),
  correctOptionIndex: integer("correct_option_index").notNull(),
  explanation: text("explanation"),
  order: integer("order").notNull().default(0),
  marks: integer("marks").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow(),
});

export const quizAttempts = pgTable("quiz_attempts", {
  id: varchar("id", { length: 36 }).primaryKey(),
  quizId: varchar("quiz_id", { length: 36 }).notNull(),
  userId: varchar("user_id", { length: 36 }).notNull(),
  answers: text("answers").array(),
  score: integer("score"),
  totalMarks: integer("total_marks"),
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  duration: integer("duration"),
});

export const assignments = pgTable("assignments", {
  id: varchar("id", { length: 36 }).primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  boardId: varchar("board_id", { length: 36 }).notNull(),
  subjectId: varchar("subject_id", { length: 36 }).notNull(),
  topicId: varchar("topic_id", { length: 36 }),
  dueDate: timestamp("due_date"),
  totalMarks: integer("total_marks").notNull().default(100),
  creatorId: varchar("creator_id", { length: 36 }).notNull(),
  attachmentUrl: text("attachment_url"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const submissions = pgTable("submissions", {
  id: varchar("id", { length: 36 }).primaryKey(),
  assignmentId: varchar("assignment_id", { length: 36 }).notNull(),
  studentId: varchar("student_id", { length: 36 }).notNull(),
  fileUrl: text("file_url"),
  content: text("content"),
  status: text("status").notNull().default("pending"),
  grade: integer("grade"),
  feedback: text("feedback"),
  submittedAt: timestamp("submitted_at").defaultNow(),
  gradedAt: timestamp("graded_at"),
});

export const announcements = pgTable("announcements", {
  id: varchar("id", { length: 36 }).primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  scope: text("scope").notNull().default("school"),
  boardId: varchar("board_id", { length: 36 }),
  subjectId: varchar("subject_id", { length: 36 }),
  authorId: varchar("author_id", { length: 36 }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// ===========================================
// ANONYMOUS USER ONBOARDING TABLES
// Big Tech pattern: device-based ID with optional server sync
// ===========================================

// Anonymous user profiles (device ID based - like Google/Amazon pattern)
export const userProfiles = pgTable("user_profiles", {
  id: varchar("id", { length: 36 }).primaryKey(),
  deviceId: varchar("device_id", { length: 36 }).notNull().unique(), // Client-generated UUID
  userAgent: text("user_agent"), // For device fingerprinting
  lastSeenAt: timestamp("last_seen_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  deviceIdIdx: index("idx_user_profiles_device_id").on(table.deviceId),
}));

// User study preferences (linked to profile)
export const userPreferences = pgTable("user_preferences", {
  id: varchar("id", { length: 36 }).primaryKey(),
  profileId: varchar("profile_id", { length: 36 }).notNull().references(() => userProfiles.id, { onDelete: "cascade" }),
  boardKey: text("board_key"),
  qualKey: text("qual_key"),
  programKey: text("program_key"),
  theme: text("theme").default("system"),
  language: text("language").default("en"),
  studyMinutesDaily: integer("study_minutes_daily").default(30),
  difficulty: text("difficulty").default("medium"),
  resourceFocus: text("resource_focus").array(),
  examSessionTarget: text("exam_session_target"),
  onboardingCompleted: boolean("onboarding_completed").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  profileIdIdx: uniqueIndex("idx_user_preferences_profile").on(table.profileId),
}));

// User subject selections (many-to-many)
export const userSubjects = pgTable("user_subjects", {
  id: varchar("id", { length: 36 }).primaryKey(),
  profileId: varchar("profile_id", { length: 36 }).notNull().references(() => userProfiles.id, { onDelete: "cascade" }),
  subjectId: varchar("subject_id", { length: 36 }).notNull().references(() => subjects.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  profileSubjectUnique: uniqueIndex("idx_user_subjects_profile_subject").on(table.profileId, table.subjectId),
}));

// ===========================================
// FEEDBACK - User feedback and ratings
// ===========================================
export const feedback = pgTable("feedback", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).references(() => users.id, { onDelete: "set null" }), // Nullable if user deletes account
  userName: text("user_name"), // Store name at time of feedback
  userEmail: text("user_email"), // Store email at time of feedback
  rating: integer("rating").notNull(), // 1-5
  comment: text("comment"), // Optional feedback text
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("idx_feedback_user_id").on(table.userId),
  createdAtIdx: index("idx_feedback_created_at").on(table.createdAt),
  ratingIdx: index("idx_feedback_rating").on(table.rating),
}));

// ===========================================
// ZOD SCHEMAS FOR VALIDATION
// ===========================================
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertBoardSchema = createInsertSchema(boards).omit({ id: true, createdAt: true });
export const insertSubjectSchema = createInsertSchema(subjects).omit({ id: true, createdAt: true });
export const insertTopicSchema = createInsertSchema(topics).omit({ id: true, createdAt: true });
export const insertMaterialSchema = createInsertSchema(materials).omit({ id: true, createdAt: true });
export const insertQuizSchema = createInsertSchema(quizzes).omit({ id: true, createdAt: true });
export const insertQuestionSchema = createInsertSchema(questions).omit({ id: true, createdAt: true });
export const insertQuizAttemptSchema = createInsertSchema(quizAttempts).omit({ id: true });
export const insertAssignmentSchema = createInsertSchema(assignments).omit({ id: true, createdAt: true });
export const insertSubmissionSchema = createInsertSchema(submissions).omit({ id: true });
export const insertAnnouncementSchema = createInsertSchema(announcements).omit({ id: true, createdAt: true });

export const insertSystemEventSchema = createInsertSchema(systemEvents).omit({ id: true, createdAt: true });
export const insertQualificationSchema = createInsertSchema(qualifications);
export const insertBranchSchema = createInsertSchema(branches);
export const insertResourceCategorySchema = createInsertSchema(resourceCategories);
export const insertResourceNodeSchema = createInsertSchema(resourceNodes);
export const insertFileAssetSchema = createInsertSchema(fileAssets);

// Onboarding schemas
export const insertUserProfileSchema = createInsertSchema(userProfiles).omit({ id: true, createdAt: true });
export const insertUserPreferencesSchema = createInsertSchema(userPreferences).omit({ id: true, createdAt: true });
export const insertUserSubjectSchema = createInsertSchema(userSubjects).omit({ id: true, createdAt: true });

// Feedback schema
export const insertFeedbackSchema = createInsertSchema(feedback).omit({ id: true, createdAt: true });

// ===========================================
// TYPE EXPORTS
// ===========================================
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Board = typeof boards.$inferSelect;
export type InsertBoard = z.infer<typeof insertBoardSchema>;
export type Subject = typeof subjects.$inferSelect;
export type InsertSubject = z.infer<typeof insertSubjectSchema>;
export type Topic = typeof topics.$inferSelect;
export type InsertTopic = z.infer<typeof insertTopicSchema>;
export type Material = typeof materials.$inferSelect;
export type InsertMaterial = z.infer<typeof insertMaterialSchema>;
export type Quiz = typeof quizzes.$inferSelect;
export type InsertQuiz = z.infer<typeof insertQuizSchema>;
export type Question = typeof questions.$inferSelect;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type QuizAttempt = typeof quizAttempts.$inferSelect;
export type InsertQuizAttempt = z.infer<typeof insertQuizAttemptSchema>;
export type Assignment = typeof assignments.$inferSelect;
export type InsertAssignment = z.infer<typeof insertAssignmentSchema>;
export type Submission = typeof submissions.$inferSelect;
export type InsertSubmission = z.infer<typeof insertSubmissionSchema>;
export type Announcement = typeof announcements.$inferSelect;
export type InsertAnnouncement = z.infer<typeof insertAnnouncementSchema>;

export type SystemEvent = typeof systemEvents.$inferSelect;
export type Qualification = typeof qualifications.$inferSelect;
export type Branch = typeof branches.$inferSelect;
export type ResourceCategory = typeof resourceCategories.$inferSelect;
export type ResourceNode = typeof resourceNodes.$inferSelect;
export type FileAsset = typeof fileAssets.$inferSelect;

// Onboarding types
export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;
export type UserPreference = typeof userPreferences.$inferSelect;
export type InsertUserPreferences = z.infer<typeof insertUserPreferencesSchema>;
export type UserSubject = typeof userSubjects.$inferSelect;
export type InsertUserSubject = z.infer<typeof insertUserSubjectSchema>;

// Feedback types
export type Feedback = typeof feedback.$inferSelect;
export type InsertFeedback = z.infer<typeof insertFeedbackSchema>;

export type UserRole = "student" | "teacher" | "admin";
export type ResourceType = "past_paper" | "notes" | "video" | "worksheet";
export type ContentStatus = "pending" | "approved" | "rejected";
export type AssignmentStatus = "pending" | "submitted" | "graded";
export type QuizType = "practice" | "mock";
export type AnnouncementScope = "school" | "board" | "subject";
export type FileType = "qp" | "ms" | "gt" | "er" | "in" | "ir" | "other";

export const RESOURCE_TYPE_LABELS: Record<ResourceType, string> = {
  past_paper: "Past Paper",
  notes: "Notes",
  video: "Video",
  worksheet: "Worksheet",
};

export const CONTENT_STATUS_LABELS: Record<ContentStatus, string> = {
  pending: "Pending Review",
  approved: "Approved",
  rejected: "Rejected",
};

export const ASSIGNMENT_STATUS_LABELS: Record<AssignmentStatus, string> = {
  pending: "Pending",
  submitted: "Submitted",
  graded: "Graded",
};

export const DIFFICULTY_LEVELS = ["easy", "medium", "hard"] as const;
export type DifficultyLevel = typeof DIFFICULTY_LEVELS[number];

