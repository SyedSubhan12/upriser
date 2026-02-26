import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, ".env"), override: true });

function parsePostgresUrl(url: string) {
    console.log("\n🔍 PARSING DATABASE URL");
    console.log("=".repeat(70));

    // Show masked URL
    const maskedUrl = url.replace(/:([^@]+)@/, ":****@");
    console.log(`Full URL (masked): ${maskedUrl}`);

    try {
        // Parse using URL constructor
        const parsed = new URL(url);

        console.log("\n📋 URL COMPONENTS:");
        console.log("-".repeat(70));
        console.log(`Protocol:   ${parsed.protocol}`);
        console.log(`Username:   ${parsed.username}`);
        console.log(`Password:   ${"*".repeat(parsed.password.length)} (${parsed.password.length} chars)`);
        console.log(`Hostname:   ${parsed.hostname}`);
        console.log(`Port:       ${parsed.port || "(default)"}`);
        console.log(`Database:   ${parsed.pathname.substring(1)}`);

        // Validation checks
        console.log("\n✅ VALIDATION CHECKS:");
        console.log("-".repeat(70));

        const checks = {
            "Protocol is postgresql": parsed.protocol === "postgresql:",
            "Username is not empty": parsed.username.length > 0,
            "Password is not empty": parsed.password.length > 0,
            "Hostname is not empty": parsed.hostname.length > 0,
            "Port is valid": parsed.port === "" || (!isNaN(parseInt(parsed.port)) && parseInt(parsed.port) > 0),
            "Database name is not empty": parsed.pathname.length > 1,
        };

        let allPassed = true;
        for (const [check, passed] of Object.entries(checks)) {
            console.log(`${passed ? "✅" : "❌"} ${check}`);
            if (!passed) allPassed = false;
        }

        console.log("\n" + "=".repeat(70));

        if (allPassed) {
            console.log("✅ ALL VALIDATION CHECKS PASSED");
            console.log("\nExtracted components:");
            return {
                valid: true,
                protocol: parsed.protocol.replace(":", ""),
                username: parsed.username,
                password: parsed.password,
                hostname: parsed.hostname,
                port: parsed.port || "5432",
                database: parsed.pathname.substring(1),
            };
        } else {
            console.log("❌ SOME VALIDATION CHECKS FAILED");
            return { valid: false };
        }

    } catch (err: any) {
        console.log(`\n❌ ERROR PARSING URL: ${err.message}`);
        return { valid: false, error: err.message };
    }
}

function main() {
    console.log("=".repeat(70));
    console.log("DATABASE URL COMPONENT VALIDATOR");
    console.log("=".repeat(70));

    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
        console.log("\n❌ DATABASE_URL environment variable is not set!");
        console.log("\nPlease set DATABASE_URL in your .env file");
        process.exit(1);
    }

    const result = parsePostgresUrl(databaseUrl);

    if (result.valid) {
        console.log("\n🎉 URL is properly formatted and ready for connection testing!");
        console.log("\nYou can now proceed to test the actual database connection.");
    } else {
        console.log("\n⚠️  Please fix the URL format before attempting to connect.");
    }

    console.log("=".repeat(70));
}

main();
