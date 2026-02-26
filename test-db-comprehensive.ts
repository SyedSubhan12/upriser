import dotenv from "dotenv";
import pg from "pg";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, ".env"), override: true });

// Step 1: Parse and validate URL components
function validateUrlComponents(url: string) {
    console.log("\n📋 STEP 1: VALIDATE URL COMPONENTS");
    console.log("=".repeat(70));

    try {
        const parsed = new URL(url);
        const components = {
            protocol: parsed.protocol.replace(":", ""),
            username: parsed.username,
            password: parsed.password,
            hostname: parsed.hostname,
            port: parsed.port || "5432",
            database: parsed.pathname.substring(1),
        };

        console.log(`✅ Protocol:  ${components.protocol}`);
        console.log(`✅ Username:  ${components.username}`);
        console.log(`✅ Password:  ${"*".repeat(components.password.length)} chars`);
        console.log(`✅ Hostname:  ${components.hostname}`);
        console.log(`✅ Port:      ${components.port}`);
        console.log(`✅ Database:  ${components.database}`);

        return { valid: true, components };
    } catch (err: any) {
        console.log(`❌ Failed to parse URL: ${err.message}`);
        return { valid: false };
    }
}

// Step 2: Test connection with detailed error handling
async function testConnection(url: string) {
    console.log("\n🔌 STEP 2: TEST DATABASE CONNECTION");
    console.log("=".repeat(70));

    const pool = new pg.Pool({
        connectionString: url,
        connectionTimeoutMillis: 5000, // 5 second timeout
    });

    try {
        console.log("Attempting to connect...");
        const client = await pool.connect();
        console.log("✅ Connection established!");

        console.log("\nRunning test query...");
        const result = await client.query("SELECT version(), current_database(), current_user");

        console.log("\n📊 CONNECTION INFO:");
        console.log("-".repeat(70));
        console.log(`Database: ${result.rows[0].current_database}`);
        console.log(`User:     ${result.rows[0].current_user}`);
        console.log(`Version:  ${result.rows[0].version.substring(0, 60)}...`);

        client.release();
        return { success: true };

    } catch (err: any) {
        console.log(`❌ Connection failed!`);
        console.log("\n🔍 ERROR DETAILS:");
        console.log("-".repeat(70));
        console.log(`Error Code:    ${err.code || "N/A"}`);
        console.log(`Error Message: ${err.message}`);

        // Provide specific guidance based on error
        console.log("\n💡 TROUBLESHOOTING:");
        console.log("-".repeat(70));

        if (err.code === "ECONNREFUSED") {
            console.log("• PostgreSQL server is not running or not accepting connections");
            console.log("• Check if PostgreSQL is running: sudo systemctl status postgresql");
            console.log("• Or start it: sudo systemctl start postgresql");
        } else if (err.code === "ENOTFOUND") {
            console.log("• Hostname could not be resolved");
            console.log("• Check if the hostname is correct");
        } else if (err.code === "28P01") {
            console.log("• Authentication failed - username or password is incorrect");
            console.log("• Verify credentials in .env file");
        } else if (err.code === "3D000") {
            console.log("• Database does not exist");
            console.log("• Create the database or check the database name");
        } else if (err.message.includes("timeout")) {
            console.log("• Connection timed out");
            console.log("• Server may be unreachable or firewall is blocking");
        } else {
            console.log(`• Unexpected error: ${err.message}`);
        }

        return { success: false, error: err };
    } finally {
        await pool.end();
    }
}

// Step 3: Test database permissions
async function testPermissions(url: string) {
    console.log("\n🔐 STEP 3: TEST DATABASE PERMISSIONS");
    console.log("=".repeat(70));

    const pool = new pg.Pool({ connectionString: url });

    try {
        // Test CREATE TABLE permission
        console.log("Testing CREATE TABLE permission...");
        await pool.query(`
            CREATE TABLE IF NOT EXISTS _connection_test (
                id SERIAL PRIMARY KEY,
                test_value TEXT
            )
        `);
        console.log("✅ Can create tables");

        // Test INSERT permission
        console.log("Testing INSERT permission...");
        await pool.query("INSERT INTO _connection_test (test_value) VALUES ('test')");
        console.log("✅ Can insert data");

        // Test SELECT permission
        console.log("Testing SELECT permission...");
        const result = await pool.query("SELECT * FROM _connection_test");
        console.log(`✅ Can select data (found ${result.rows.length} rows)`);

        // Test UPDATE permission
        console.log("Testing UPDATE permission...");
        await pool.query("UPDATE _connection_test SET test_value = 'updated' WHERE test_value = 'test'");
        console.log("✅ Can update data");

        // Test DELETE permission
        console.log("Testing DELETE permission...");
        await pool.query("DELETE FROM _connection_test");
        console.log("✅ Can delete data");

        // Clean up
        await pool.query("DROP TABLE _connection_test");
        console.log("✅ Can drop tables");

        console.log("\n🎉 All permissions verified!");
        return { success: true };

    } catch (err: any) {
        console.log(`❌ Permission test failed: ${err.message}`);
        return { success: false, error: err };
    } finally {
        await pool.end();
    }
}

async function main() {
    console.log("=".repeat(70));
    console.log("COMPREHENSIVE DATABASE CONNECTION TEST");
    console.log("=".repeat(70));

    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
        console.log("\n❌ DATABASE_URL environment variable is not set!");
        process.exit(1);
    }

    // Step 1: Validate URL
    const validation = validateUrlComponents(databaseUrl);
    if (!validation.valid) {
        console.log("\n❌ URL validation failed. Cannot proceed.");
        process.exit(1);
    }

    // Step 2: Test connection
    const connection = await testConnection(databaseUrl);
    if (!connection.success) {
        console.log("\n❌ Connection test failed. Cannot proceed to permission tests.");
        console.log("=".repeat(70));
        process.exit(1);
    }

    // Step 3: Test permissions
    const permissions = await testPermissions(databaseUrl);

    // Final summary
    console.log("\n" + "=".repeat(70));
    console.log("📊 FINAL SUMMARY");
    console.log("=".repeat(70));
    console.log(`URL Validation: ${validation.valid ? "✅ PASSED" : "❌ FAILED"}`);
    console.log(`Connection:     ${connection.success ? "✅ PASSED" : "❌ FAILED"}`);
    console.log(`Permissions:    ${permissions.success ? "✅ PASSED" : "❌ FAILED"}`);

    if (validation.valid && connection.success && permissions.success) {
        console.log("\n🎉 ALL TESTS PASSED! Database is ready to use.");
    } else {
        console.log("\n⚠️  Some tests failed. Please review the errors above.");
    }
    console.log("=".repeat(70));
}

main();
