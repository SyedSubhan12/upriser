-- Migration: 0006_teacher_email_verification_and_profiles.sql
-- Purpose: Add email verification, teacher approval, and public profile fields to users table

ALTER TABLE "users" ADD COLUMN "is_email_verified" boolean NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN "email_verification_token" text;
ALTER TABLE "users" ADD COLUMN "email_verification_expires" timestamp;
ALTER TABLE "users" ADD COLUMN "is_approved" boolean NOT NULL DEFAULT true;
ALTER TABLE "users" ADD COLUMN "approved_by" varchar(36);
ALTER TABLE "users" ADD COLUMN "approved_at" timestamp;
ALTER TABLE "users" ADD COLUMN "username" text;
ALTER TABLE "users" ADD COLUMN "bio" text;
ALTER TABLE "users" ADD COLUMN "qualifications" text[];
ALTER TABLE "users" ADD COLUMN "experience_years" integer;

-- Add foreign key for approved_by
ALTER TABLE "users" ADD CONSTRAINT "users_approved_by_fkey" 
  FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL;

-- Add unique constraint for username
ALTER TABLE "users" ADD CONSTRAINT "users_username_unique" UNIQUE ("username");

-- Preserve access for existing accounts that predate email verification
UPDATE "users" SET "is_email_verified" = true;

-- Update existing teachers to be approved by default
UPDATE "users" SET "is_approved" = true WHERE "role" = 'teacher';
