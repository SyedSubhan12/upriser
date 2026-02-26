
import { db } from "./db";
import { sql } from "drizzle-orm";

async function main() {
    console.log("Starting migration for feedback table...");

    try {
        await db.execute(sql`
            CREATE TABLE IF NOT EXISTS "feedback" (
                "id" VARCHAR(36) PRIMARY KEY,
                "user_id" VARCHAR(36) REFERENCES "users"("id") ON DELETE SET NULL,
                "user_name" TEXT,
                "user_email" TEXT,
                "rating" INTEGER NOT NULL,
                "comment" TEXT,
                "created_at" TIMESTAMP DEFAULT NOW()
            );

            CREATE INDEX IF NOT EXISTS "idx_feedback_user_id" ON "feedback"("user_id");
            CREATE INDEX IF NOT EXISTS "idx_feedback_created_at" ON "feedback"("created_at");
            CREATE INDEX IF NOT EXISTS "idx_feedback_rating" ON "feedback"("rating");
        `);

        console.log("Migration completed successfully!");
    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    }

    process.exit(0);
}

main();
