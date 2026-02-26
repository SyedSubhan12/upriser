import 'dotenv/config';
import { supabaseAdmin } from './server/supabase';

async function main() {
    const BUCKET_NAME = 'content';
    const objectKey = 'caie/as-a-level/chemistry-9701/books/asal_chemistry_cb_executive_preview_digital.pdf';

    console.log(`Checking file exists in Supabase: ${objectKey}`);

    if (!supabaseAdmin) {
        console.error('❌ Supabase Admin client is null! Check your environment variables.');
        process.exit(1);
    }

    // 1. Check bucket
    console.log(`Checking bucket: ${BUCKET_NAME}...`);
    const { data: buckets, error: bError } = await supabaseAdmin.storage.listBuckets();
    if (bError) {
        console.error('❌ Error listing buckets:', bError.message);
    } else {
        const bucket = buckets.find(b => b.name === BUCKET_NAME);
        if (!bucket) {
            console.error(`❌ Bucket "${BUCKET_NAME}" NOT FOUND!`);
        } else {
            console.log(`✅ Bucket "${BUCKET_NAME}" exists. Public: ${bucket.public}`);
        }
    }

    // 2. Check file
    const parts = objectKey.split('/');
    const fileName = parts.pop();
    const folderPath = parts.join('/');

    console.log(`Listing files in folder: ${folderPath}...`);
    const { data: files, error: fError } = await supabaseAdmin.storage.from(BUCKET_NAME).list(folderPath);

    if (fError) {
        console.error('❌ Error listing files:', fError.message);
    } else {
        const file = files.find(f => f.name === fileName);
        if (file) {
            console.log(`✅ File found! Size: ${file.metadata?.size || 'unknown'}`);
        } else {
            console.error('❌ File NOT FOUND in storage at specified path.');
            console.log('Available files in that folder:', files.map(f => f.name).join(', '));
        }
    }

    process.exit(0);
}

main();
