-- Create feedback table
CREATE TABLE IF NOT EXISTS "feedback" (
  "id" VARCHAR(36) PRIMARY KEY,
  "user_id" VARCHAR(36) REFERENCES "users"("id") ON DELETE SET NULL,
  "user_name" TEXT,
  "user_email" TEXT,
  "rating" INTEGER NOT NULL,
  "comment" TEXT,
  "created_at" TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "idx_feedback_user_id" ON "feedback"("user_id");
CREATE INDEX IF NOT EXISTS "idx_feedback_created_at" ON "feedback"("created_at");
CREATE INDEX IF NOT EXISTS "idx_feedback_rating" ON "feedback"("rating");
