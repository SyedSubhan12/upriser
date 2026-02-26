import pg from "pg";

async function testConnection(label: string, connectionString: string) {
    console.log(`\n🔍 Testing ${label}...`);
    console.log(`   Connection: ${connectionString.replace(/:([^@]+)@/, ":****@")}`);

    const pool = new pg.Pool({
        connectionString,
        connectionTimeoutMillis: 10000, // 10 second timeout for remote connections
    });

    try {
        const res = await pool.query("SELECT version(), current_database(), current_user");
        console.log(`   ✅ SUCCESS! Connected to PostgreSQL`);
        console.log(`   Database: ${res.rows[0].current_database}`);
        console.log(`   User: ${res.rows[0].current_user}`);
        console.log(`   Version: ${res.rows[0].version.substring(0, 50)}...`);
        return true;
    } catch (err: any) {
        console.log(`   ❌ FAILED: ${err.message}`);
        if (err.code) {
            console.log(`   Error Code: ${err.code}`);
        }
        return false;
    } finally {
        await pool.end();
    }
}

async function main() {
    console.log("=".repeat(70));
    console.log("CPANEL DATABASE CONNECTION TESTER");
    console.log("=".repeat(70));

    const username = "serprep_upr";
    const password = "Upriserschool";
    const database = "serprep_upriser";

    // cPanel server details
    const serverIP = "206.168.149.74";
    const serverDomain = "serprep.com";

    console.log("\n📋 Testing with cPanel server credentials:");
    console.log(`   Server IP: ${serverIP}`);
    console.log(`   Server Domain: ${serverDomain}`);
    console.log(`   Database User: ${username}`);
    console.log(`   Database Name: ${database}`);

    const tests = [
        // Standard PostgreSQL port
        { label: "Server IP (port 5432)", url: `postgresql://${username}:${password}@${serverIP}:5432/${database}` },
        { label: "Server Domain (port 5432)", url: `postgresql://${username}:${password}@${serverDomain}:5432/${database}` },

        // Common cPanel PostgreSQL ports
        { label: "Server IP (port 5433)", url: `postgresql://${username}:${password}@${serverIP}:5433/${database}` },
        { label: "Server IP (port 5434)", url: `postgresql://${username}:${password}@${serverIP}:5434/${database}` },

        // Try with localhost (in case remote access is disabled)
        { label: "Localhost via SSH tunnel", url: `postgresql://${username}:${password}@localhost:5432/${database}` },
    ];

    const results = [];
    for (const test of tests) {
        const success = await testConnection(test.label, test.url);
        results.push({ ...test, success });
    }

    console.log("\n" + "=".repeat(70));
    console.log("📊 RESULTS SUMMARY:");
    console.log("=".repeat(70));

    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    if (successful.length > 0) {
        console.log("\n✅ SUCCESSFUL CONNECTIONS:");
        successful.forEach(r => {
            console.log(`   • ${r.label}`);
            console.log(`     ${r.url.replace(/:([^@]+)@/, ":****@")}`);
        });

        console.log("\n💡 RECOMMENDED DATABASE_URL:");
        console.log(`   ${successful[0].url.replace(/:([^@]+)@/, ":****@")}`);
        console.log("\n   Add this to your .env file:");
        console.log(`   DATABASE_URL=${successful[0].url}`);
    }

    if (failed.length > 0) {
        console.log("\n❌ FAILED CONNECTIONS:");
        failed.forEach(r => {
            console.log(`   • ${r.label}`);
        });
    }

    if (successful.length === 0) {
        console.log("\n⚠️  NO CONNECTIONS SUCCEEDED");
        console.log("\n💡 POSSIBLE ISSUES:");
        console.log("   1. Remote PostgreSQL access may be disabled in cPanel");
        console.log("   2. Firewall may be blocking PostgreSQL port (5432)");
        console.log("   3. PostgreSQL may not be configured to accept remote connections");
        console.log("   4. Username/password may be incorrect");
        console.log("\n📝 NEXT STEPS:");
        console.log("   1. Log into cPanel (http://206.168.149.74:2082/)");
        console.log("   2. Go to 'Remote PostgreSQL' or 'PostgreSQL Databases'");
        console.log("   3. Add your IP address to the remote access whitelist");
        console.log("   4. Verify the database username and password");
        console.log("   5. Check if PostgreSQL is running on a non-standard port");
    }

    console.log("=".repeat(70));
}

main();
