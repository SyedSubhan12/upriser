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

export const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,                    // Reduced pool size for serverless
    idleTimeoutMillis: 30000,   // Close idle connections after 30s
    connectionTimeoutMillis: 5000, // Fail fast if can't connect in 5s
    ssl: {
        rejectUnauthorized: false
    }
});

// Log pool errors to prevent unhandled rejections
pool.on('error', (err) => {
    console.error('Unexpected database pool error:', err);
});

export const db = drizzle(pool, { schema });
