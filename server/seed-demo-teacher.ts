/**
 * Database Seed Script - Create Demo Teacher User
 *
 * This script creates a hardcoded teacher user in the database.
 * Run this once to set up your demo teacher account for testing.
 *
 * Usage:
 *   tsx server/seed-demo-teacher.ts
 */

import "dotenv/config"; // Load environment variables first
import { db, pool } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import bcrypt from "bcrypt";

// Demo teacher credentials (development only)
const TEACHER_EMAIL = "teacher@upriser.com";
const TEACHER_PASSWORD = "teacher123";
const TEACHER_NAME = "Demo Teacher";

async function seedDemoTeacher() {
  try {
    console.log("🌱 Seeding demo teacher user...");
    console.log("=".repeat(50));

    if (!db) {
      console.error("❌ Database not connected. Check your DATABASE_URL env variable.");
      process.exit(1);
    }

    // Check if demo teacher already exists
    const existingTeacher = await db
      .select()
      .from(users)
      .where(eq(users.email, TEACHER_EMAIL))
      .limit(1);

    if (existingTeacher.length > 0) {
      console.log(`⚠️  Demo teacher user already exists: ${TEACHER_EMAIL}`);
      console.log(`   User ID: ${existingTeacher[0].id}`);
      console.log(`   Role: ${existingTeacher[0].role}`);

      // Ensure role is teacher and account is active
      if (existingTeacher[0].role !== "teacher" || !existingTeacher[0].isActive) {
        await db
          .update(users)
          .set({ role: "teacher", isActive: true })
          .where(eq(users.id, existingTeacher[0].id));
        console.log("✅ Updated user to active teacher");
      }
    } else {
      // Create new demo teacher user with generated ID
      const teacherId = randomUUID();
      
      // Hash the password before storing
      const hashedPassword = await bcrypt.hash(TEACHER_PASSWORD, 10);

      const [newTeacher] = await db
        .insert(users)
        .values({
          id: teacherId,
          email: TEACHER_EMAIL,
          password: hashedPassword,
          name: TEACHER_NAME,
          role: "teacher",
          authProvider: "local",
          isActive: true,
          createdAt: new Date(),
        })
        .returning();

      console.log("✅ Demo teacher user created successfully!");
      console.log("=".repeat(50));
      console.log(`📧 Email: ${newTeacher.email}`);
      console.log(`👤 Name: ${newTeacher.name}`);
      console.log(`🔑 Role: ${newTeacher.role}`);
      console.log(`🆔 ID: ${newTeacher.id}`);
      console.log("=".repeat(50));
      console.log("");
      console.log("You can now log in with this demo teacher account.");
    }

    console.log("");
    console.log("✨ Seeding completed!");
  } catch (error) {
    console.error("❌ Error seeding demo teacher user:", error);
    process.exit(1);
  } finally {
    // Close database connection
    if (pool) {
      await pool.end();
    }
    process.exit(0);
  }
}

// Run the seed function
seedDemoTeacher();
