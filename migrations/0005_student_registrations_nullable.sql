-- Make student registration profile fields nullable to allow progressive completion
-- The frontend form allows saving with empty/partial data
ALTER TABLE "student_registrations" ALTER COLUMN "father_name" DROP NOT NULL;
ALTER TABLE "student_registrations" ALTER COLUMN "age" DROP NOT NULL;
ALTER TABLE "student_registrations" ALTER COLUMN "phone_number" DROP NOT NULL;
ALTER TABLE "student_registrations" ALTER COLUMN "board" DROP NOT NULL;
ALTER TABLE "student_registrations" ALTER COLUMN "qualifications" DROP NOT NULL;
ALTER TABLE "student_registrations" ALTER COLUMN "subject" DROP NOT NULL;
ALTER TABLE "student_registrations" ALTER COLUMN "school_name" DROP NOT NULL;
