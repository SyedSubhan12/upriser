/**
 * Password Migration Script
 * 
 * Migrates existing plain text passwords to bcrypt hashed passwords.
 * Run this ONCE after implementing bcrypt password hashing.
 * 
 * Usage:
 *   tsx server/migrate-passwords.ts
 */

import "dotenv/config";
import { db, pool } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

async function migratePasswords() {
  try {
    console.log("🔐 Starting password migration...");
    console.log("=".repeat(60));

    if (!db) {
      console.error("❌ Database not connected. Check your DATABASE_URL env variable.");
      process.exit(1);
    }

    // Fetch all users
    const allUsers = await db.select().from(users);
    console.log(`📊 Found ${allUsers.length} total users in database`);

    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const user of allUsers) {
      try {
        // Check if password is already hashed (bcrypt hashes start with $2b$)
        if (!user.password) {
          console.log(`⏭️  Skipping ${user.email} - No password (OAuth user)`);
          skippedCount++;
          continue;
        }

        if (user.password.startsWith("$2b$") || user.password.startsWith("$2a$")) {
          console.log(`✓ Skipping ${user.email} - Already hashed`);
          skippedCount++;
          continue;
        }

        // Password is plain text, hash it
        console.log(`🔄 Migrating ${user.email}...`);
        const hashedPassword = await bcrypt.hash(user.password, 10);

        // Update in database
        await db
          .update(users)
          .set({ 
            password: hashedPassword,
            updatedAt: new Date()
          })
          .where(eq(users.id, user.id));

        console.log(`   ✅ Migrated: ${user.email} (${user.role})`);
        migratedCount++;

      } catch (error) {
        console.error(`   ❌ Error migrating ${user.email}:`, error);
        errorCount++;
      }
    }

    console.log("");
    console.log("=".repeat(60));
    console.log("📈 Migration Summary:");
    console.log(`   ✅ Migrated: ${migratedCount} users`);
    console.log(`   ⏭️  Skipped:  ${skippedCount} users (already hashed or OAuth)`);
    console.log(`   ❌ Errors:   ${errorCount} users`);
    console.log("=".repeat(60));
    
    if (migratedCount > 0) {
      console.log("");
      console.log("✨ Migration completed successfully!");
      console.log("ℹ️  Users can now login with their original passwords.");
      console.log("ℹ️  Passwords are now securely hashed with bcrypt.");
    } else if (skippedCount > 0 && migratedCount === 0) {
      console.log("");
      console.log("✨ No migration needed - all passwords already hashed!");
    }

  } catch (error) {
    console.error("❌ Fatal error during migration:", error);
    process.exit(1);
  } finally {
    // Close database connection
    if (pool) {
      await pool.end();
    }
    process.exit(0);
  }
}

// Run the migration
migratePasswords();
