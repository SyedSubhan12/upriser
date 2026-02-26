import 'dotenv/config';
import { db } from './server/db';
import { sql } from 'drizzle-orm';

async function main() {
    console.log('🚀 Starting manual table creation...');

    try {
        // 1. user_profiles
        console.log('Creating user_profiles table...');
        await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "user_profiles" (
        "id" varchar(36) PRIMARY KEY,
        "device_id" varchar(36) NOT NULL UNIQUE,
        "user_agent" text,
        "last_seen_at" timestamp DEFAULT now(),
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS "idx_user_profiles_device_id" ON "user_profiles" ("device_id");
    `);

        // 2. user_preferences
        console.log('Creating user_preferences table...');
        await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "user_preferences" (
        "id" varchar(36) PRIMARY KEY,
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
        "onboarding_completed" boolean NOT NULL DEFAULT false,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now()
      );
      CREATE UNIQUE INDEX IF NOT EXISTS "idx_user_preferences_profile" ON "user_preferences" ("profile_id");
    `);

        // 3. user_subjects
        console.log('Creating user_subjects table...');
        await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "user_subjects" (
        "id" varchar(36) PRIMARY KEY,
        "profile_id" varchar(36) NOT NULL REFERENCES "user_profiles"("id") ON DELETE CASCADE,
        "subject_id" varchar(36) NOT NULL REFERENCES "curriculum_subjects"("id") ON DELETE CASCADE,
        "created_at" timestamp DEFAULT now()
      );
      CREATE UNIQUE INDEX IF NOT EXISTS "idx_user_subjects_profile_subject" ON "user_subjects" ("profile_id", "subject_id");
    `);

        console.log('✅ Tables created successfully!');
    } catch (error) {
        console.error('❌ Error creating tables:', error);
        process.exit(1);
    }

    process.exit(0);
}

main();
