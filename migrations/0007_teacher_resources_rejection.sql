-- Migration: 0007_teacher_resources_rejection.sql
-- Purpose: Add rejection_reason to materials table for teacher resource review workflow

ALTER TABLE "materials" ADD COLUMN "rejection_reason" text;
