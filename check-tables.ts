import 'dotenv/config';
import { db } from './server/db';
import { sql } from 'drizzle-orm';

async function main() {
    const tables = await db.execute(sql`
    SELECT table_name FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name
  `);
    console.log('Existing tables:');
    tables.rows.forEach((r: any) => console.log(' -', r.table_name));

    // Check if onboarding tables exist
    const onboardingTables = ['user_profiles', 'user_preferences', 'user_subjects'];
    for (const t of onboardingTables) {
        const exists = tables.rows.some((r: any) => r.table_name === t);
        console.log(`  ${t}: ${exists ? '✅ EXISTS' : '❌ MISSING'}`);
    }

    process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
