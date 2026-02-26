-- Migration: Add onboarding tables for anonymous user preferences
-- Following Big Tech pattern: device-based ID with server sync

-- User profiles (device ID based)
CREATE TABLE IF NOT EXISTS "user_profiles" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"device_id" varchar(36) NOT NULL UNIQUE,
	"user_agent" text,
	"last_seen_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

-- User study preferences
CREATE TABLE IF NOT EXISTS "user_preferences" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"profile_id" varchar(36) NOT NULL REFERENCES "user_profiles"("id") ON DELETE CASCADE,
	"board_key" text,
	"qual_key" text,
	"program_key" text,
	"theme" text DEFAULT 'system',
	"language" text DEFAULT 'en',
	"study_minutes_daily" integer DEFAULT 30,
	"difficulty" text DEFAULT 'medium',
	"resource_focus" text[],
	"exam_session_target" text,
	"onboarding_completed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

-- User subject selections (many-to-many)
CREATE TABLE IF NOT EXISTS "user_subjects" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"profile_id" varchar(36) NOT NULL REFERENCES "user_profiles"("id") ON DELETE CASCADE,
	"subject_id" varchar(36) NOT NULL REFERENCES "curriculum_subjects"("id") ON DELETE CASCADE,
	"created_at" timestamp DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS "idx_user_profiles_device_id" ON "user_profiles" ("device_id");
CREATE UNIQUE INDEX IF NOT EXISTS "idx_user_preferences_profile" ON "user_preferences" ("profile_id");
CREATE UNIQUE INDEX IF NOT EXISTS "idx_user_subjects_profile_subject" ON "user_subjects" ("profile_id", "subject_id");
