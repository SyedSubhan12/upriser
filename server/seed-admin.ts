/**
 * Database Seed Script - Create Admin User
 * 
 * This script creates a hardcoded admin user in the database.
 * Run this once to set up your initial admin account.
 * 
 * Usage:
 *   tsx server/seed-admin.ts
 */

import "dotenv/config"; // Load environment variables first
import { db, pool } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import bcrypt from "bcrypt";

// ⚠️ CHANGE THESE VALUES TO YOUR ADMIN CREDENTIALS
const ADMIN_EMAIL = "admin@upriser.com";  // <-- Change this to your email
const ADMIN_PASSWORD = "admin123";        // <-- Change this to a secure password
const ADMIN_NAME = "System Administrator"; // <-- Change this to your name

async function seedAdmin() {
    try {
        console.log("🌱 Seeding admin user...");
        console.log("=".repeat(50));

        if (!db) {
            console.error("❌ Database not connected. Check your DATABASE_URL env variable.");
            process.exit(1);
        }

        // Check if admin already exists
        const existingAdmin = await db
            .select()
            .from(users)
            .where(eq(users.email, ADMIN_EMAIL))
            .limit(1);

        if (existingAdmin.length > 0) {
            console.log(`⚠️  Admin user already exists: ${ADMIN_EMAIL}`);
            console.log(`   User ID: ${existingAdmin[0].id}`);
            console.log(`   Role: ${existingAdmin[0].role}`);

            // Update role to admin if it's not already
            if (existingAdmin[0].role !== "admin") {
                await db
                    .update(users)
                    .set({ role: "admin", isActive: true })
                    .where(eq(users.id, existingAdmin[0].id));
                console.log(`✅ Updated user role to admin`);
            }
        } else {
            // Create new admin user with generated ID
            const adminId = randomUUID();
            
            // Hash the password before storing
            const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

            const [newAdmin] = await db
                .insert(users)
                .values({
                    id: adminId,
                    email: ADMIN_EMAIL,
                    password: hashedPassword,
                    name: ADMIN_NAME,
                    role: "admin",
                    authProvider: "local",
                    isActive: true,
                    createdAt: new Date(),
                })
                .returning();

            console.log("✅ Admin user created successfully!");
            console.log("=".repeat(50));
            console.log(`📧 Email: ${newAdmin.email}`);
            console.log(`👤 Name: ${newAdmin.name}`);
            console.log(`🔑 Role: ${newAdmin.role}`);
            console.log(`🆔 ID: ${newAdmin.id}`);
            console.log("=".repeat(50));
            console.log("");
            console.log("⚠️  IMPORTANT: Change your password after first login!");
        }

        console.log("");
        console.log("✨ Seeding completed!");
    } catch (error) {
        console.error("❌ Error seeding admin user:", error);
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
seedAdmin();
