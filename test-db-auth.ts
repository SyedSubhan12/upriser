import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

async function testConnection() {
    console.log("Testing connection to:", process.env.DATABASE_URL?.replace(/:[^:@]+@/, ":****@"));
    const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
    try {
        const client = await pool.connect();
        console.log("SUCCESS: Connected to database.");
        const res = await client.query('SELECT NOW()');
        console.log("Database time:", res.rows[0]);
        client.release();
    } catch (err) {
        console.error("FAILURE: Could not connect to database.");
        console.error(err);
    } finally {
        await pool.end();
    }
}

testConnection();
