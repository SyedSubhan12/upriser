import dotenv from "dotenv";
import pg from "pg";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, ".env"), override: true });

async function testConnection() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        console.error("❌ DATABASE_URL is not set");
        return;
    }

    console.log("Testing connection with:", connectionString.replace(/:([^@]+)@/, ":****@"));

    const pool = new pg.Pool({ connectionString });

    try {
        const res = await pool.query("SELECT 1");
        console.log("✅ Connection successful!");
    } catch (err) {
        console.error("❌ Connection failed:", err.message);
    } finally {
        await pool.end();
    }
}

testConnection();
