import 'dotenv/config';
import { db } from './server/db';
import { fileAssets } from './shared/schema';

async function main() {
    const files = await db.select().from(fileAssets).limit(10);
    console.log('Recent file assets:');
    files.forEach((f: any) => {
        console.log(`- ID: ${f.id}`);
        console.log(`  Title: ${f.title}`);
        console.log(`  URL: ${f.url}`);
        console.log(`  ObjectKey: ${f.objectKey}`);
        console.log(`  FileName: ${f.fileName}`);
    });
    process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
