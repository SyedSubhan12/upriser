/**
 * Curriculum Schema - Drizzle ORM Schema for PostgreSQL
 * 
 * Tables:
 * - boards: Education boards (CAIE, Pearson, IB, etc.)
 * - qualifications: Qualifications per board (IGCSE, A Level, DP, etc.)
 * - branches: Current/Legacy specification branches
 * - subjects: Subjects with codes and version tags
 * - subject_groups: IB DP subject groups
 * - resource_categories: Resource types (past_papers, notes, syllabus, etc.)
 * - resource_nodes: Folder tree structure
 * - file_assets: Uploaded files with S3 object keys
 */

import { pgTable, varchar, text, integer, boolean, timestamp, jsonb, uniqueIndex, index } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

// ============================================================================
// BOARDS - Education boards (CAIE, Pearson/Edexcel, IB, OCR, AQA, etc.)
// ============================================================================
export const curriculumBoards = pgTable("curriculum_boards", {
    id: varchar("id", { length: 36 }).primaryKey(),
    board_key: text("board_key").notNull().unique(), // slug: caie, pearson, ib
    display_name: text("display_name").notNull(),
    full_name: text("full_name").notNull(),
    description: text("description"),
    logo_url: text("logo_url"),
    sort_order: integer("sort_order").notNull().default(0),
    is_enabled: boolean("is_enabled").notNull().default(true),
    created_at: timestamp("created_at").defaultNow(),
    updated_at: timestamp("updated_at").defaultNow(),
}, (table) => ({
    enabledSortIdx: index("idx_curriculum_boards_enabled_sort").on(table.is_enabled, table.sort_order),
}));

// ============================================================================
// QUALIFICATIONS - Qualifications/programs per board
// ============================================================================
export const curriculumQualifications = pgTable("curriculum_qualifications", {
    id: varchar("id", { length: 36 }).primaryKey(),
    board_id: varchar("board_id", { length: 36 }).notNull().references(() => curriculumBoards.id, { onDelete: "cascade" }),
    qual_key: text("qual_key").notNull(), // slug: igcse, a-level, dp
    display_name: text("display_name").notNull(),
    has_branching: boolean("has_branching").notNull().default(false), // true for current/legacy specs
    sort_order: integer("sort_order").notNull().default(0),
    created_at: timestamp("created_at").defaultNow(),
    updated_at: timestamp("updated_at").defaultNow(),
}, (table) => ({
    boardIdx: index("idx_curriculum_qualifications_board").on(table.board_id),
    boardSortIdx: index("idx_curriculum_qualifications_board_sort").on(table.board_id, table.sort_order),
    boardKeyUnique: uniqueIndex("idx_curriculum_qualifications_board_key").on(table.board_id, table.qual_key),
}));

// ============================================================================
// BRANCHES - Current/Legacy specification branches
// ============================================================================
export const curriculumBranches = pgTable("curriculum_branches", {
    id: varchar("id", { length: 36 }).primaryKey(),
    qual_id: varchar("qual_id", { length: 36 }).notNull().references(() => curriculumQualifications.id, { onDelete: "cascade" }),
    branch_key: text("branch_key").notNull(), // current, legacy
    display_name: text("display_name").notNull(),
    created_at: timestamp("created_at").defaultNow(),
}, (table) => ({
    qualIdx: index("idx_curriculum_branches_qual").on(table.qual_id),
    qualKeyUnique: uniqueIndex("idx_curriculum_branches_qual_key").on(table.qual_id, table.branch_key),
}));

// ============================================================================
// SUBJECTS - Subjects with codes and version tags
// ============================================================================
export const curriculumSubjects = pgTable("curriculum_subjects", {
    id: varchar("id", { length: 36 }).primaryKey(),
    board_id: varchar("board_id", { length: 36 }).notNull().references(() => curriculumBoards.id),
    qual_id: varchar("qual_id", { length: 36 }).notNull().references(() => curriculumQualifications.id),
    branch_id: varchar("branch_id", { length: 36 }).references(() => curriculumBranches.id),
    subject_name: text("subject_name").notNull(),
    subject_code: text("subject_code"), // e.g., 0580, 9709
    version_tag: text("version_tag"), // e.g., 2024, First Teaching 2024
    slug: text("slug").notNull(),
    sort_key: text("sort_key").notNull(),
    description: text("description"),
    icon: text("icon"),
    is_active: boolean("is_active").notNull().default(true),
    created_at: timestamp("created_at").defaultNow(),
    updated_at: timestamp("updated_at").defaultNow(),
}, (table) => ({
    boardIdx: index("idx_curriculum_subjects_board").on(table.board_id),
    qualIdx: index("idx_curriculum_subjects_qual").on(table.qual_id),
    boardQualIdx: index("idx_curriculum_subjects_board_qual").on(table.board_id, table.qual_id),
    slugIdx: index("idx_curriculum_subjects_slug").on(table.slug),
    codeIdx: index("idx_curriculum_subjects_code").on(table.subject_code),
    sortIdx: index("idx_curriculum_subjects_sort").on(table.sort_key),
}));

// ============================================================================
// SUBJECT_GROUPS - IB DP subject groups
// ============================================================================
export const curriculumSubjectGroups = pgTable("curriculum_subject_groups", {
    id: varchar("id", { length: 36 }).primaryKey(),
    program_id: varchar("program_id", { length: 36 }).notNull().references(() => curriculumQualifications.id),
    name: text("name").notNull(),
    description: text("description"),
    sort_order: integer("sort_order").notNull().default(0),
    created_at: timestamp("created_at").defaultNow(),
}, (table) => ({
    programIdx: index("idx_curriculum_subject_groups_program").on(table.program_id),
    programSortIdx: index("idx_curriculum_subject_groups_sort").on(table.program_id, table.sort_order),
}));

// ============================================================================
// RESOURCE_CATEGORIES - Resource types (past_papers, notes, syllabus, etc.)
// ============================================================================
export const curriculumResourceCategories = pgTable("curriculum_resource_categories", {
    id: varchar("id", { length: 36 }).primaryKey(),
    resource_key: text("resource_key").notNull().unique(), // past_papers, notes, syllabus, books, other, timetable
    display_name: text("display_name").notNull(),
    icon: text("icon").notNull(),
    sort_order: integer("sort_order").notNull().default(0),
    created_at: timestamp("created_at").defaultNow(),
}, (table) => ({
    sortIdx: index("idx_curriculum_resource_categories_sort").on(table.sort_order),
}));

// ============================================================================
// RESOURCE_NODES - Folder tree structure per subject/resource
// ============================================================================
export const curriculumResourceNodes = pgTable("curriculum_resource_nodes", {
    id: varchar("id", { length: 36 }).primaryKey(),
    subject_id: varchar("subject_id", { length: 36 }).notNull().references(() => curriculumSubjects.id, { onDelete: "cascade" }),
    resource_key: text("resource_key").notNull().references(() => curriculumResourceCategories.resource_key),
    parent_node_id: varchar("parent_node_id", { length: 36 }), // null for root nodes
    title: text("title").notNull(),
    node_type: text("node_type").notNull(), // folder, list, file
    meta: jsonb("meta"), // flexible metadata (year, session, etc.)
    sort_order: integer("sort_order").notNull().default(0),
    created_at: timestamp("created_at").defaultNow(),
    updated_at: timestamp("updated_at").defaultNow(),
}, (table) => ({
    subjectIdx: index("idx_curriculum_resource_nodes_subject").on(table.subject_id),
    subjectResourceIdx: index("idx_curriculum_resource_nodes_subject_resource").on(table.subject_id, table.resource_key),
    parentIdx: index("idx_curriculum_resource_nodes_parent").on(table.parent_node_id),
    // GIN index for JSONB meta searching is added via raw SQL migration
}));

// ============================================================================
// FILE_ASSETS - Uploaded files with S3 object keys and metadata
// ============================================================================
export const curriculumFileAssets = pgTable("curriculum_file_assets", {
    id: varchar("id", { length: 36 }).primaryKey(),
    subject_id: varchar("subject_id", { length: 36 }).notNull().references(() => curriculumSubjects.id, { onDelete: "cascade" }),
    resource_key: text("resource_key").notNull().references(() => curriculumResourceCategories.resource_key),
    node_id: varchar("node_id", { length: 36 }).notNull().references(() => curriculumResourceNodes.id, { onDelete: "cascade" }),

    // File metadata
    title: text("title").notNull(),
    file_name: text("file_name").notNull(), // original filename
    mime_type: text("mime_type").notNull(), // application/pdf, image/png, etc.
    file_size: integer("file_size"), // size in bytes

    // PapaCambridge-style file type filtering
    file_type: text("file_type").notNull(), // qp, ms, gt, er, in, ir, other

    // Past paper metadata
    year: integer("year"),
    session: text("session"), // m, s, w (March, Summer, Winter)
    paper: integer("paper"),
    variant: integer("variant"),

    // S3 storage
    object_key: text("object_key").notNull(), // S3 object key
    url: text("url"), // public URL (optional, could be generated)

    // Status
    is_public: boolean("is_public").notNull().default(true),
    download_count: integer("download_count").notNull().default(0),

    created_at: timestamp("created_at").defaultNow(),
    updated_at: timestamp("updated_at").defaultNow(),
}, (table) => ({
    nodeIdx: index("idx_curriculum_file_assets_node").on(table.node_id),
    subjectIdx: index("idx_curriculum_file_assets_subject").on(table.subject_id),
    subjectResourceIdx: index("idx_curriculum_file_assets_subject_resource").on(table.subject_id, table.resource_key),
    typeIdx: index("idx_curriculum_file_assets_type").on(table.file_type),
    subjectTypeIdx: index("idx_curriculum_file_assets_subject_type").on(table.subject_id, table.resource_key, table.file_type),
    yearIdx: index("idx_curriculum_file_assets_year").on(table.year),
    browseIdx: index("idx_curriculum_file_assets_browse").on(table.subject_id, table.resource_key, table.file_type, table.year),
}));

// ============================================================================
// ZOD SCHEMAS FOR VALIDATION
// ============================================================================
export const insertCurriculumBoardSchema = createInsertSchema(curriculumBoards);
export const selectCurriculumBoardSchema = createSelectSchema(curriculumBoards);

export const insertCurriculumQualificationSchema = createInsertSchema(curriculumQualifications);
export const selectCurriculumQualificationSchema = createSelectSchema(curriculumQualifications);

export const insertCurriculumBranchSchema = createInsertSchema(curriculumBranches);
export const selectCurriculumBranchSchema = createSelectSchema(curriculumBranches);

export const insertCurriculumSubjectSchema = createInsertSchema(curriculumSubjects);
export const selectCurriculumSubjectSchema = createSelectSchema(curriculumSubjects);

export const insertCurriculumResourceCategorySchema = createInsertSchema(curriculumResourceCategories);
export const selectCurriculumResourceCategorySchema = createSelectSchema(curriculumResourceCategories);

export const insertCurriculumResourceNodeSchema = createInsertSchema(curriculumResourceNodes);
export const selectCurriculumResourceNodeSchema = createSelectSchema(curriculumResourceNodes);

export const insertCurriculumFileAssetSchema = createInsertSchema(curriculumFileAssets);
export const selectCurriculumFileAssetSchema = createSelectSchema(curriculumFileAssets);

// ============================================================================
// TYPE EXPORTS
// ============================================================================
export type CurriculumBoard = typeof curriculumBoards.$inferSelect;
export type InsertCurriculumBoard = typeof curriculumBoards.$inferInsert;

export type CurriculumQualification = typeof curriculumQualifications.$inferSelect;
export type InsertCurriculumQualification = typeof curriculumQualifications.$inferInsert;

export type CurriculumBranch = typeof curriculumBranches.$inferSelect;
export type InsertCurriculumBranch = typeof curriculumBranches.$inferInsert;

export type CurriculumSubject = typeof curriculumSubjects.$inferSelect;
export type InsertCurriculumSubject = typeof curriculumSubjects.$inferInsert;

export type CurriculumResourceCategory = typeof curriculumResourceCategories.$inferSelect;
export type InsertCurriculumResourceCategory = typeof curriculumResourceCategories.$inferInsert;

export type CurriculumResourceNode = typeof curriculumResourceNodes.$inferSelect;
export type InsertCurriculumResourceNode = typeof curriculumResourceNodes.$inferInsert;

export type CurriculumFileAsset = typeof curriculumFileAssets.$inferSelect;
export type InsertCurriculumFileAsset = typeof curriculumFileAssets.$inferInsert;

// File type constants
export const FILE_TYPES = ['qp', 'ms', 'gt', 'er', 'in', 'ir', 'other'] as const;
export type FileType = typeof FILE_TYPES[number];

export const FILE_TYPE_LABELS: Record<FileType, string> = {
    qp: 'Question Paper',
    ms: 'Mark Scheme',
    gt: 'Grade Threshold',
    er: 'Examiner Report',
    in: 'Insert',
    ir: 'Instructions',
    other: 'Other',
};

// Session constants
export const SESSIONS = ['m', 's', 'w'] as const;
export type Session = typeof SESSIONS[number];

export const SESSION_LABELS: Record<Session, string> = {
    m: 'March',
    s: 'May/June (Summer)',
    w: 'Oct/Nov (Winter)',
};
