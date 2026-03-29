import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from "../shared/schema.js";

if (!process.env.DATABASE_URL) {
    throw new Error(
        "FATAL: DATABASE_URL environment variable is required. " +
        "Cannot start without a database connection. " +
        "Set DATABASE_URL in your .env file."
    );
}

const isServerless = process.env.VERCEL === "1";

export const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    // In serverless (Vercel), each lambda is isolated — use a single connection
    // to avoid exhausting Supabase's connection pool limit.
    max: isServerless ? 1 : 10,
    idleTimeoutMillis: isServerless ? 10000 : 30000,
    connectionTimeoutMillis: 30000, // Increased for stability
    keepAlive: true,
    ssl: {
        rejectUnauthorized: false
    }
});

// Log pool errors to prevent unhandled rejections
pool.on('error', (err) => {
    console.error('Unexpected database pool error:', err);
});

// prepare: false is required when using Supabase Transaction mode (port 6543)
// because PgBouncer does not support prepared statements in transaction mode.
export const db = drizzle(pool, { schema, logger: false });
