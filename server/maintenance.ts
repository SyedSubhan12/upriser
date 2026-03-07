/**
 * Maintenance Script — Supabase Storage Cleanup & Orphan Detection
 * 
 * Usage:
 *   npm run maintenance -- orphan-check   # List orphaned files
 *   npm run maintenance -- cleanup        # Delete orphaned files
 *   npm run maintenance -- stats          # Show storage statistics
 */

import 'dotenv/config';
import { db } from './db.js';
import { fileAssets } from '../shared/schema.js';
import { eq, isNull, sql, count, sum, desc } from 'drizzle-orm';
import { supabaseAdmin } from './supabase.js';
import { deleteFile, listFiles } from './supabase-storage.js';

const BUCKET_NAME = 'content';

// ============================================================================
// Sub-commands
// ============================================================================

/**
 * List all files in Supabase Storage and compare with database records.
 * Reports orphaned files (in storage but not in DB) and missing files (in DB but not in storage).
 */
async function orphanCheck() {
    console.log('🔍 Checking for orphaned files...\n');

    if (!supabaseAdmin) {
        console.error('❌ Supabase not configured. Cannot perform orphan check.');
        return;
    }

    // Get all object_keys from database
    const dbFiles = await db.select({ objectKey: fileAssets.objectKey })
        .from(fileAssets)
        .where(sql`${fileAssets.objectKey} IS NOT NULL`);
    const dbKeys = new Set(dbFiles.map((f: { objectKey: string | null }) => f.objectKey).filter(Boolean));

    console.log(`Database records with object_key: ${dbKeys.size}`);

    // List all files in storage (recursively via top-level folders)
    const { data: topLevel, error } = await supabaseAdmin.storage.from(BUCKET_NAME).list('', { limit: 1000 });
    if (error) {
        console.error('❌ Failed to list storage files:', error.message);
        return;
    }

    const storageKeys = new Set<string>();
    for (const item of topLevel || []) {
        if (item.id) {
            // It's a file
            storageKeys.add(item.name);
        } else {
            // It's a folder, list recursively
            const subFiles = await listFiles(item.name);
            subFiles.forEach(key => storageKeys.add(key));
        }
    }

    console.log(`Storage objects: ${storageKeys.size}\n`);

    // Find orphans (in storage but not in DB)
    const orphans = Array.from(storageKeys).filter(key => !dbKeys.has(key));
    if (orphans.length > 0) {
        console.log(`⚠️  Orphaned files (in storage, not in DB): ${orphans.length}`);
        orphans.forEach(key => console.log(`  📄 ${key}`));
    } else {
        console.log('✅ No orphaned files found in storage.');
    }

    // Find missing (in DB but not in storage)
    const missing = Array.from(dbKeys).filter(key => !storageKeys.has(key as string));
    if (missing.length > 0) {
        console.log(`\n⚠️  Missing files (in DB, not in storage): ${missing.length}`);
        missing.forEach(key => console.log(`  📄 ${key}`));
    } else {
        console.log('✅ No missing files (all DB records have corresponding storage objects).');
    }
}

/**
 * Delete orphaned files from Supabase Storage.
 */
async function cleanup() {
    console.log('🧹 Cleaning up orphaned files...\n');

    if (!supabaseAdmin) {
        console.error('❌ Supabase not configured.');
        return;
    }

    // Get all object_keys from database
    const dbFiles = await db.select({ objectKey: fileAssets.objectKey })
        .from(fileAssets)
        .where(sql`${fileAssets.objectKey} IS NOT NULL`);
    const dbKeys = new Set(dbFiles.map((f: { objectKey: string | null }) => f.objectKey).filter(Boolean));

    // List all storage files
    const { data: topLevel } = await supabaseAdmin.storage.from(BUCKET_NAME).list('', { limit: 1000 });
    const storageKeys: string[] = [];
    for (const item of topLevel || []) {
        if (item.id) {
            storageKeys.push(item.name);
        } else {
            const subFiles = await listFiles(item.name);
            storageKeys.push(...subFiles);
        }
    }

    const orphans = storageKeys.filter(key => !dbKeys.has(key));

    if (orphans.length === 0) {
        console.log('✅ No orphaned files to clean up.');
        return;
    }

    console.log(`Found ${orphans.length} orphaned files. Deleting...`);
    let deleted = 0;
    for (const key of orphans) {
        const success = await deleteFile(key);
        if (success) {
            deleted++;
            console.log(`  🗑️  Deleted: ${key}`);
        } else {
            console.log(`  ❌ Failed to delete: ${key}`);
        }
    }

    console.log(`\n✨ Cleanup complete. Deleted ${deleted}/${orphans.length} files.`);
}

/**
 * Show storage statistics.
 */
async function stats() {
    console.log('📊 Storage Statistics\n');

    // Database stats
    const [totalCount] = await db.select({ value: count() }).from(fileAssets);
    const [withObjectKey] = await db.select({ value: count() })
        .from(fileAssets)
        .where(sql`${fileAssets.objectKey} IS NOT NULL`);
    const [totalSize] = await db.select({ value: sum(fileAssets.fileSize) }).from(fileAssets);
    const [totalDownloads] = await db.select({ value: sum(fileAssets.downloadCount) }).from(fileAssets);

    console.log('Database:');
    console.log(`  Total file records: ${totalCount?.value || 0}`);
    console.log(`  With Supabase object_key: ${withObjectKey?.value || 0}`);
    console.log(`  Total file size: ${((Number(totalSize?.value) || 0) / 1024 / 1024).toFixed(1)} MB`);
    console.log(`  Total downloads: ${totalDownloads?.value || 0}`);

    // Top downloaded files
    const topFiles = await db.select({
        title: fileAssets.title,
        downloadCount: fileAssets.downloadCount,
    })
        .from(fileAssets)
        .orderBy(desc(fileAssets.downloadCount))
        .limit(10);

    if (topFiles.length > 0) {
        console.log('\n🏆 Top 10 Downloaded:');
        topFiles.forEach((f: any, i: number) => {
            console.log(`  ${i + 1}. ${f.title} — ${f.downloadCount || 0} downloads`);
        });
    }
}

// ============================================================================
// Entry Point
// ============================================================================

async function main() {
    const command = process.argv[2];

    switch (command) {
        case 'orphan-check':
            await orphanCheck();
            break;
        case 'cleanup':
            await cleanup();
            break;
        case 'stats':
            await stats();
            break;
        default:
            console.log('Usage: npm run maintenance -- <command>');
            console.log('');
            console.log('Commands:');
            console.log('  orphan-check   List orphaned files (in storage but not in DB)');
            console.log('  cleanup        Delete orphaned files from storage');
            console.log('  stats          Show storage statistics');
            break;
    }

    process.exit(0);
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
