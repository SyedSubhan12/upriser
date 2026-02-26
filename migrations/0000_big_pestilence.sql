CREATE TYPE "public"."assignment_status" AS ENUM('pending', 'submitted', 'graded');--> statement-breakpoint
CREATE TYPE "public"."content_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."file_type" AS ENUM('qp', 'ms', 'gt', 'er', 'in', 'ir', 'other');--> statement-breakpoint
CREATE TYPE "public"."node_type" AS ENUM('folder', 'list', 'file');--> statement-breakpoint
CREATE TYPE "public"."quiz_type" AS ENUM('practice', 'mock');--> statement-breakpoint
CREATE TYPE "public"."resource_type" AS ENUM('past_paper', 'notes', 'video', 'worksheet');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('student', 'teacher', 'admin');--> statement-breakpoint
CREATE TABLE "announcements" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"scope" text DEFAULT 'school' NOT NULL,
	"board_id" varchar(36),
	"subject_id" varchar(36),
	"author_id" varchar(36) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "assignments" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"board_id" varchar(36) NOT NULL,
	"subject_id" varchar(36) NOT NULL,
	"topic_id" varchar(36),
	"due_date" timestamp,
	"total_marks" integer DEFAULT 100 NOT NULL,
	"creator_id" varchar(36) NOT NULL,
	"attachment_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "boards" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"board_key" text NOT NULL,
	"display_name" text NOT NULL,
	"full_name" text NOT NULL,
	"description" text,
	"logo_url" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "boards_board_key_unique" UNIQUE("board_key")
);
--> statement-breakpoint
CREATE TABLE "branches" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"qual_id" varchar(36) NOT NULL,
	"branch_key" text NOT NULL,
	"display_name" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "file_assets" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"subject_id" varchar(36) NOT NULL,
	"resource_key" text NOT NULL,
	"node_id" varchar(36) NOT NULL,
	"title" text NOT NULL,
	"file_type" text NOT NULL,
	"year" integer,
	"session" text,
	"paper" integer,
	"variant" integer,
	"url" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "materials" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"type" text NOT NULL,
	"board_id" varchar(36) NOT NULL,
	"subject_id" varchar(36) NOT NULL,
	"topic_id" varchar(36),
	"year" integer,
	"difficulty" text,
	"file_url" text,
	"video_url" text,
	"uploader_id" varchar(36) NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"view_count" integer DEFAULT 0 NOT NULL,
	"download_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "qualifications" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"board_id" varchar(36) NOT NULL,
	"qual_key" text NOT NULL,
	"display_name" text NOT NULL,
	"has_branching" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "questions" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"quiz_id" varchar(36) NOT NULL,
	"question_text" text NOT NULL,
	"options" text[] NOT NULL,
	"correct_option_index" integer NOT NULL,
	"explanation" text,
	"order" integer DEFAULT 0 NOT NULL,
	"marks" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "quiz_attempts" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"quiz_id" varchar(36) NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"answers" text[],
	"score" integer,
	"total_marks" integer,
	"started_at" timestamp DEFAULT now(),
	"completed_at" timestamp,
	"duration" integer
);
--> statement-breakpoint
CREATE TABLE "quizzes" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"board_id" varchar(36) NOT NULL,
	"subject_id" varchar(36) NOT NULL,
	"topic_id" varchar(36),
	"type" text DEFAULT 'practice' NOT NULL,
	"duration" integer,
	"is_timed" boolean DEFAULT false NOT NULL,
	"creator_id" varchar(36) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "resource_categories" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"resource_key" text NOT NULL,
	"display_name" text NOT NULL,
	"icon" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "resource_categories_resource_key_unique" UNIQUE("resource_key")
);
--> statement-breakpoint
CREATE TABLE "resource_nodes" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"subject_id" varchar(36) NOT NULL,
	"resource_key" text NOT NULL,
	"parent_node_id" varchar(36),
	"title" text NOT NULL,
	"node_type" text NOT NULL,
	"meta" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "subject_groups" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"program_id" varchar(36) NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "subjects" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"board_id" varchar(36) NOT NULL,
	"qual_id" varchar(36) NOT NULL,
	"branch_id" varchar(36),
	"subject_name" text NOT NULL,
	"subject_code" text,
	"version_tag" text,
	"slug" text NOT NULL,
	"sort_key" text NOT NULL,
	"description" text,
	"icon" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "submissions" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"assignment_id" varchar(36) NOT NULL,
	"student_id" varchar(36) NOT NULL,
	"file_url" text,
	"content" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"grade" integer,
	"feedback" text,
	"submitted_at" timestamp DEFAULT now(),
	"graded_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "system_events" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"message" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"meta" jsonb
);
--> statement-breakpoint
CREATE TABLE "topics" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"subject_id" varchar(36) NOT NULL,
	"parent_id" varchar(36),
	"order" integer DEFAULT 0 NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password" text,
	"google_id" text,
	"auth_provider" text DEFAULT 'local' NOT NULL,
	"name" text NOT NULL,
	"role" text DEFAULT 'student' NOT NULL,
	"avatar" text,
	"board_ids" text[],
	"subject_ids" text[],
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"last_login_at" timestamp,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_google_id_unique" UNIQUE("google_id")
);
