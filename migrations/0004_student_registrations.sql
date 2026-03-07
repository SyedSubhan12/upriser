-- Create student registrations table (detailed student profile)
CREATE TABLE IF NOT EXISTS "student_registrations" (
  "id" varchar(36) PRIMARY KEY NOT NULL,
  "user_id" varchar(36) NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,

  "name" text NOT NULL,
  "father_name" text NOT NULL,
  "age" integer NOT NULL,
  "phone_number" text NOT NULL,

  "board" text NOT NULL,
  "qualifications" text NOT NULL,
  "subject" text NOT NULL,
  "school_name" text NOT NULL,

  "ip_address" text,
  "user_agent" text,
  "registration_completed_at" timestamp DEFAULT now(),

  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "idx_student_registrations_user" ON "student_registrations" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_student_registrations_board" ON "student_registrations" ("board");
CREATE INDEX IF NOT EXISTS "idx_student_registrations_phone" ON "student_registrations" ("phone_number");
