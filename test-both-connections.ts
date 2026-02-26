import pg from "pg";

async function testConnection(label: string, connectionString: string) {
    console.log(`\n🔍 Testing ${label}...`);
    console.log(`   Connection: ${connectionString.replace(/:([^@]+)@/, ":****@")}`);

    const pool = new pg.Pool({ connectionString });

    try {
        const res = await pool.query("SELECT version()");
        console.log(`   ✅ SUCCESS! Connected to PostgreSQL`);
        console.log(`   Database version: ${res.rows[0].version.substring(0, 50)}...`);
        return true;
    } catch (err: any) {
        console.log(`   ❌ FAILED: ${err.message}`);
        return false;
    } finally {
        await pool.end();
    }
}

async function main() {
    console.log("=".repeat(70));
    console.log("DATABASE CONNECTION TESTER");
    console.log("=".repeat(70));

    const username = "serprep_upr";
    const password = "Upriserschool";
    const database = "serprep_upriser";
    const port = 5432;

    // Test 1: localhost
    const localhostUrl = `postgresql://${username}:${password}@localhost:${port}/${database}`;
    const test1 = await testConnection("LOCALHOST", localhostUrl);

    // Test 2: serprep.cm
    const remoteUrl = `postgresql://${username}:${password}@serprep.com:${port}/${database}`;
    const test2 = await testConnection("REMOTE (serprep.com)", remoteUrl);

    console.log("\n" + "=".repeat(70));
    console.log("RESULTS:");
    console.log("=".repeat(70));
    console.log(`Localhost:        ${test1 ? "✅ WORKS" : "❌ FAILED"}`);
    console.log(`Remote (serprep.cm): ${test2 ? "✅ WORKS" : "❌ FAILED"}`);

    if (test1) {
        console.log("\n💡 Use: DATABASE_URL=postgresql://serprep_upr:Upriserschool@localhost:5432/serprep_upriser");
    } else if (test2) {
        console.log("\n💡 Use: DATABASE_URL=postgresql://serprep_upr:Upriserschool@serprep.cm:5432/serprep_upriser");
    } else {
        console.log("\n⚠️  Neither connection worked. Please check:");
        console.log("   - Database server is running");
        console.log("   - Username and password are correct");
        console.log("   - Database name exists");
        console.log("   - Firewall allows connections");
    }
    console.log("=".repeat(70));
}

main();
