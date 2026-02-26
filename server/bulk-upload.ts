/**
 * Bulk Upload Script
 * 
 * Scans the `ebooks/` directory and uploads all PDFs to Supabase Storage,
 * creating corresponding metadata rows in the `curriculum_file_assets` table.
 * 
 * Usage:
 *   npm run bulk-upload                   # Upload all ebooks
 *   npm run bulk-upload -- --dry-run      # Preview without uploading
 *   npm run bulk-upload -- --subject 9709 # Upload specific subject only
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { db } from './db';
import { boards, qualifications, subjects, resourceCategories, resourceNodes, fileAssets } from '@shared/schema';
import { eq, and, sql } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { uploadPdf, checkDuplicate, getPublicUrl, sanitizeFilename } from './supabase-storage';

// ============================================================================
// Configuration
// ============================================================================

const EBOOKS_DIR = path.resolve(process.cwd(), 'ebooks');
const CONCURRENCY_LIMIT = 10;
const DRY_RUN = process.argv.includes('--dry-run');
const SUBJECT_FILTER = (() => {
    const idx = process.argv.indexOf('--subject');
    return idx !== -1 ? process.argv[idx + 1] : null;
})();

// ============================================================================
// Types
// ============================================================================

interface ScannedFile {
    absolutePath: string;
    relativePath: string;
    fileName: string;
    folderName: string;     // e.g. "Mathematics -9709"
    subFolderName: string;  // e.g. "Statistics" or "" if root level
    subjectCode: string;    // e.g. "9709"
    subjectName: string;    // e.g. "Mathematics"
    fileSize: number;
}

interface UploadReport {
    total: number;
    uploaded: number;
    skipped: number;
    failed: number;
    errors: { file: string; error: string }[];
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Parse a folder name like "Mathematics -9709" into subject name and code.
 */
function parseFolderName(folderName: string): { subjectName: string; subjectCode: string } {
    // Patterns: "Mathematics -9709", "Biology 9700", "Arts&design-9479", "IT 9626"
    const match = folderName.match(/^(.+?)[\s-]+(\d{4,5})$/);
    if (match) {
        return {
            subjectName: match[1].trim().replace(/[-&]/g, ' ').replace(/\s+/g, ' '),
            subjectCode: match[2],
        };
    }
    return { subjectName: folderName, subjectCode: '' };
}

/**
 * Scan `ebooks/` directory recursively for PDF files.
 */
function scanEbooksDirectory(): ScannedFile[] {
    const files: ScannedFile[] = [];

    if (!fs.existsSync(EBOOKS_DIR)) {
        console.error(`❌ ebooks directory not found: ${EBOOKS_DIR}`);
        return files;
    }

    const topLevelDirs = fs.readdirSync(EBOOKS_DIR, { withFileTypes: true })
        .filter(d => d.isDirectory());

    for (const dir of topLevelDirs) {
        const { subjectName, subjectCode } = parseFolderName(dir.name);

        // Apply subject filter
        if (SUBJECT_FILTER && subjectCode !== SUBJECT_FILTER) {
            continue;
        }

        const dirPath = path.join(EBOOKS_DIR, dir.name);
        scanDirectory(dirPath, dir.name, '', subjectName, subjectCode, files);
    }

    return files;
}

function scanDirectory(
    dirPath: string,
    folderName: string,
    subFolderName: string,
    subjectName: string,
    subjectCode: string,
    files: ScannedFile[]
): void {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);

        if (entry.isDirectory()) {
            // Recurse into subdirectory
            const newSubFolder = subFolderName ? `${subFolderName}/${entry.name}` : entry.name;
            scanDirectory(fullPath, folderName, newSubFolder, subjectName, subjectCode, files);
        } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.pdf')) {
            const stats = fs.statSync(fullPath);
            files.push({
                absolutePath: fullPath,
                relativePath: path.relative(EBOOKS_DIR, fullPath),
                fileName: entry.name,
                folderName,
                subFolderName,
                subjectCode,
                subjectName,
                fileSize: stats.size,
            });
        }
    }
}

/**
 * Simple concurrency limiter.
 */
async function pLimit<T>(tasks: (() => Promise<T>)[], limit: number): Promise<T[]> {
    const results: T[] = [];
    let index = 0;

    async function runNext(): Promise<void> {
        while (index < tasks.length) {
            const currentIndex = index++;
            results[currentIndex] = await tasks[currentIndex]();
        }
    }

    const workers = Array.from({ length: Math.min(limit, tasks.length) }, () => runNext());
    await Promise.all(workers);
    return results;
}

// ============================================================================
// Database Helpers
// ============================================================================

// Manual mapping for ebook folder codes that don't match DB subject codes directly.
// Maps ebook folder subject code → DB subject code or subject name for fuzzy lookup.
const CODE_FALLBACK_MAP: Record<string, { altCodes: string[]; nameSearch: string }> = {
    '9709': { altCodes: ['9231'], nameSearch: 'Mathematics' },        // A Level Mathematics
    '9700': { altCodes: ['9184', '5090', '0438'], nameSearch: 'Biology' },  // A Level Biology
    '9479': { altCodes: ['9704', '0400', '6090'], nameSearch: 'Art and Design' },
    '9069': { altCodes: ['9609', '9707', '7115', '0450'], nameSearch: 'Business' },
    '9093': { altCodes: ['1123', '8274'], nameSearch: 'English Language' },
    '9695': { altCodes: ['9276', '2010'], nameSearch: 'English Literature' },
    '9489': { altCodes: ['9279', '0416', '2147'], nameSearch: 'History' },
    '9389': { altCodes: ['9279', '0416', '2147', '2158'], nameSearch: 'History' },
    '9990': { altCodes: ['9698'], nameSearch: 'Psychology' },
};

/**
 * Find the subject in the database by subject code.
 * Falls back to alternate code mapping, then fuzzy name match.
 */
async function findSubjectByCode(code: string): Promise<any | null> {
    if (!code) return null;

    // 1. Direct code match
    const [subject] = await db.select()
        .from(subjects)
        .where(eq(subjects.subjectCode, code))
        .limit(1);
    if (subject) return subject;

    // 2. Try alternate codes from fallback map
    const fallback = CODE_FALLBACK_MAP[code];
    if (fallback) {
        for (const altCode of fallback.altCodes) {
            const [alt] = await db.select()
                .from(subjects)
                .where(eq(subjects.subjectCode, altCode))
                .limit(1);
            if (alt) return alt;
        }

        // 3. Fuzzy name match (case-insensitive ILIKE)
        const [byName] = await db.select()
            .from(subjects)
            .where(sql`LOWER(${subjects.subjectName}) LIKE LOWER(${'%' + fallback.nameSearch + '%'})`)
            .limit(1);
        if (byName) return byName;
    }

    return null;
}

/**
 * Get or create a resource node for "books" or "notes" resource category.
 */
async function getOrCreateResourceNode(
    subjectId: string,
    resourceKey: string,
    title: string,
    parentNodeId?: string
): Promise<string> {
    // Check if node already exists
    const conditions = [
        eq(resourceNodes.subjectId, subjectId),
        eq(resourceNodes.resourceKey, resourceKey),
        eq(resourceNodes.title, title),
    ];

    const [existing] = await db.select()
        .from(resourceNodes)
        .where(and(...conditions))
        .limit(1);

    if (existing) return existing.id;

    // Create new node
    const id = randomUUID();
    await db.insert(resourceNodes).values({
        id,
        subjectId,
        resourceKey,
        parentNodeId: parentNodeId || null,
        title,
        nodeType: parentNodeId ? 'list' : 'folder',
        sortOrder: 0,
    });

    return id;
}

/**
 * Ensure the "books" resource category exists.
 */
async function ensureBooksCategory(): Promise<void> {
    const [existing] = await db.select()
        .from(resourceCategories)
        .where(eq(resourceCategories.resourceKey, 'books'))
        .limit(1);

    if (!existing) {
        await db.insert(resourceCategories).values({
            id: randomUUID(),
            resourceKey: 'books',
            displayName: 'Books & Coursebooks',
            icon: 'BookOpen',
            sortOrder: 4,
        });
        console.log('📚 Created "books" resource category');
    }
}

// ============================================================================
// Main Upload Logic
// ============================================================================

async function processFile(file: ScannedFile, report: UploadReport): Promise<void> {
    try {
        // Find subject in database
        const subject = await findSubjectByCode(file.subjectCode);
        if (!subject) {
            report.skipped++;
            console.log(`⏭️  Skipped (no subject found for code ${file.subjectCode}): ${file.fileName}`);
            return;
        }

        // Get board context for the object key
        const [board] = await db.select().from(boards).where(eq(boards.id, subject.boardId)).limit(1);
        const [qual] = await db.select().from(qualifications).where(eq(qualifications.id, subject.qualId)).limit(1);

        const boardKey = board?.boardKey || 'unknown';
        const qualKey = qual?.qualKey || 'unknown';

        // Build object key — sanitize each segment to strip invalid characters
        const objectKey = [
            boardKey,
            qualKey,
            subject.slug || `${file.subjectName.toLowerCase().replace(/\s+/g, '-')}-${file.subjectCode}`,
            'books',
            file.subFolderName ? sanitizeFilename(file.subFolderName.toLowerCase()) : '',
            sanitizeFilename(file.fileName),
        ].filter(Boolean).join('/');

        // Check for duplicate
        const isDuplicate = await checkDuplicate(objectKey);
        if (isDuplicate) {
            report.skipped++;
            console.log(`⏭️  Skipped (duplicate): ${file.fileName}`);
            return;
        }

        if (DRY_RUN) {
            console.log(`🔍 [DRY RUN] Would upload: ${file.relativePath}`);
            console.log(`   → Object key: ${objectKey}`);
            console.log(`   → Subject: ${subject.subjectName} (${file.subjectCode})`);
            console.log(`   → Board: ${boardKey}, Qual: ${qualKey}`);
            report.uploaded++;
            return;
        }

        // Read file
        const fileBuffer = fs.readFileSync(file.absolutePath);

        // Upload to Supabase Storage
        const uploadResult = await uploadPdf(fileBuffer, objectKey, 'application/pdf');
        if (!uploadResult.success) {
            report.failed++;
            report.errors.push({ file: file.relativePath, error: uploadResult.error || 'Unknown error' });
            console.error(`❌ Upload failed: ${file.fileName} — ${uploadResult.error}`);
            return;
        }

        // Get or create resource node
        const rootNodeId = await getOrCreateResourceNode(subject.id, 'books', 'Books & Coursebooks');
        let nodeId = rootNodeId;

        // If there's a subfolder, create a child node
        if (file.subFolderName) {
            nodeId = await getOrCreateResourceNode(subject.id, 'books', file.subFolderName, rootNodeId);
        }

        // Insert file asset metadata
        const id = randomUUID();
        await db.insert(fileAssets).values({
            id,
            subjectId: subject.id,
            resourceKey: 'books',
            nodeId,
            title: file.fileName.replace('.pdf', '').replace(/_/g, ' '),
            fileName: file.fileName,
            mimeType: 'application/pdf',
            fileSize: file.fileSize,
            fileType: 'other',
            objectKey,
            url: uploadResult.publicUrl || getPublicUrl(objectKey),
            isPublic: true,
            downloadCount: 0,
        });

        report.uploaded++;
        console.log(`✅ Uploaded: ${file.fileName} → ${objectKey}`);
    } catch (error: any) {
        report.failed++;
        report.errors.push({ file: file.relativePath, error: error.message });
        console.error(`❌ Error processing ${file.fileName}:`, error.message);
    }
}

// ============================================================================
// Entry Point
// ============================================================================

async function main() {
    console.log('='.repeat(60));
    console.log('📦 Bulk Upload Script — Supabase Storage');
    console.log('='.repeat(60));
    console.log(`Directory: ${EBOOKS_DIR}`);
    console.log(`Mode: ${DRY_RUN ? '🔍 DRY RUN (no actual uploads)' : '🚀 LIVE UPLOAD'}`);
    if (SUBJECT_FILTER) console.log(`Subject filter: ${SUBJECT_FILTER}`);
    console.log('');

    // Ensure books resource category exists
    await ensureBooksCategory();

    // Scan ebooks directory
    console.log('Scanning ebooks directory...');
    const files = scanEbooksDirectory();
    console.log(`Found ${files.length} PDF files\n`);

    if (files.length === 0) {
        console.log('No PDF files found. Exiting.');
        process.exit(0);
    }

    // Show summary by subject
    const bySubject = new Map<string, number>();
    for (const f of files) {
        const key = `${f.subjectName} (${f.subjectCode})`;
        bySubject.set(key, (bySubject.get(key) || 0) + 1);
    }
    console.log('Files by subject:');
    Array.from(bySubject.entries()).forEach(([subject, count]) => {
        console.log(`  📁 ${subject}: ${count} files`);
    });
    console.log('');

    // Initialize report
    const report: UploadReport = { total: files.length, uploaded: 0, skipped: 0, failed: 0, errors: [] };

    // Process files with concurrency limit
    const tasks = files.map(file => () => processFile(file, report));
    await pLimit(tasks, CONCURRENCY_LIMIT);

    // Print final report
    console.log('\n' + '='.repeat(60));
    console.log('📊 Upload Report');
    console.log('='.repeat(60));
    console.log(`Total files: ${report.total}`);
    console.log(`Uploaded:    ${report.uploaded}`);
    console.log(`Skipped:     ${report.skipped}`);
    console.log(`Failed:      ${report.failed}`);

    if (report.errors.length > 0) {
        console.log('\n❌ Errors:');
        for (const err of report.errors) {
            console.log(`  ${err.file}: ${err.error}`);
        }
    }

    console.log('\n✨ Done!');
    process.exit(0);
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
