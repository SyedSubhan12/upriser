/**
 * Upload Past Papers Script
 *
 * Scans the `School_Files/` directory and uploads all PDFs to Supabase Storage,
 * creating corresponding metadata rows in the `curriculum_file_assets` table.
 *
 * Usage:
 *   npx tsx server/upload-past-papers.ts              # Upload all files
 *   npx tsx server/upload-past-papers.ts --dry-run    # Preview without uploading
 *   npx tsx server/upload-past-papers.ts --subject 7707  # Filter by subject code
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { db } from './db.js';
import { boards, qualifications, subjects, resourceCategories, resourceNodes, fileAssets } from '../shared/schema.js';
import { eq, and, sql } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { uploadPdf, checkDuplicate, getPublicUrl, sanitizeFilename } from './supabase-storage.js';

// ============================================================================
// Configuration
// ============================================================================

const SCHOOL_FILES_DIR = path.resolve(process.cwd(), 'School_Files');
const PAST_PAPERS_ROOT = path.join(SCHOOL_FILES_DIR, 'Past Papers');
const CONCURRENCY_LIMIT = 5;
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
    fileName: string;
    fileSize: number;
    // Parsed from folder structure
    qualification: string;    // e.g. "O Level"
    subjectName: string;      // e.g. "Accounting"
    subjectCode: string;      // e.g. "7707"
    year: number | null;
    sessionLabel: string;     // e.g. "Oct-Nov" | "May-June" | "Topical"
    // Parsed from filename
    fileType: 'qp' | 'ms' | 'gt' | 'er' | 'in' | 'ir' | 'other';
    paper: number | null;
    variant: number | null;
}

interface UploadReport {
    total: number;
    uploaded: number;
    skipped: number;
    failed: number;
    errors: { file: string; error: string }[];
}

// ============================================================================
// Parsing Helpers
// ============================================================================

/**
 * Parse subject folder name e.g. "Accounting (7707)" → { name, code }
 */
function parseSubjectFolder(name: string): { subjectName: string; subjectCode: string } {
    const match = name.match(/^(.+?)\s*\((\d{4,5})\)$/);
    if (match) {
        return { subjectName: match[1].trim(), subjectCode: match[2].trim() };
    }
    return { subjectName: name.trim(), subjectCode: '' };
}

/**
 * Parse session folder name e.g. "2020-Oct-Nov" → { year: 2020, session: "Oct-Nov" }
 * Also handles "Topical Past Paper".
 */
function parseSessionFolder(name: string): { year: number | null; sessionLabel: string } {
    const yearSessionMatch = name.match(/^(\d{4})[-_\s](.+)$/);
    if (yearSessionMatch) {
        return { year: parseInt(yearSessionMatch[1]), sessionLabel: yearSessionMatch[2] };
    }
    if (name.toLowerCase().includes('topical')) {
        return { year: null, sessionLabel: 'Topical' };
    }
    return { year: null, sessionLabel: name };
}

/**
 * Parse a Cambridge past paper filename e.g. "7707_w20_qp_12.pdf"
 * Code letter: w = Oct-Nov, s = May-June, m = March, y = ???
 * File type segment: qp, ms, gt, er, in, ir
 * Paper+variant: "12" → paper=1, variant=2
 */
function parseFilename(fileName: string): {
    fileType: 'qp' | 'ms' | 'gt' | 'er' | 'in' | 'ir' | 'other';
    paper: number | null;
    variant: number | null;
} {
    const baseName = fileName.replace(/\.[^.]+$/, '').toLowerCase(); // strip extension
    const parts = baseName.split('_');

    // File type is usually 3rd or 4th segment
    let fileType: 'qp' | 'ms' | 'gt' | 'er' | 'in' | 'ir' | 'other' = 'other';
    let paper: number | null = null;
    let variant: number | null = null;

    for (let i = 0; i < parts.length; i++) {
        const p = parts[i];
        if (['qp', 'ms', 'gt', 'er', 'in', 'ir'].includes(p)) {
            fileType = p as typeof fileType;
            // Next segment may be paper+variant e.g. "12", "23", "11"
            const pv = parts[i + 1];
            if (pv && /^\d{2}$/.test(pv)) {
                paper = parseInt(pv[0]);
                variant = parseInt(pv[1]);
            }
            break;
        }
    }

    return { fileType, paper, variant };
}

// ============================================================================
// Directory Scanner
// ============================================================================

function scanDirectory(): ScannedFile[] {
    const files: ScannedFile[] = [];

    if (!fs.existsSync(PAST_PAPERS_ROOT)) {
        console.error(`❌ Past Papers directory not found: ${PAST_PAPERS_ROOT}`);
        return files;
    }

    // Structure:
    //   Past Papers/
    //     {Qualification} Past Papers/          e.g. "O Level Past Papers"
    //       {SubjectName} ({Code})/             e.g. "Accounting (7707)"
    //         {Subject} {Qual} Past Papers/     (ignore this intermediate folder)
    //           {Year}-{Session}/               e.g. "2020-Oct-Nov" | "Topical Past Paper"
    //             {Year} {Session} ... /        (ignore this intermediate folder)
    //               *.pdf

    const qualDirs = fs.readdirSync(PAST_PAPERS_ROOT, { withFileTypes: true })
        .filter(d => d.isDirectory());

    for (const qualDir of qualDirs) {
        // e.g. "O Level Past Papers" → qualification = "o-level"
        const qualName = qualDir.name; // raw
        const qualPath = path.join(PAST_PAPERS_ROOT, qualDir.name);

        const subjectDirs = fs.readdirSync(qualPath, { withFileTypes: true })
            .filter(d => d.isDirectory());

        for (const subjectDir of subjectDirs) {
            const { subjectName, subjectCode } = parseSubjectFolder(subjectDir.name);

            if (SUBJECT_FILTER && subjectCode !== SUBJECT_FILTER) continue;

            // Inside subject folder there may be an intermediate folder
            // e.g. "Accounting (7707) O Level Past Papers/"
            const subjectPath = path.join(qualPath, subjectDir.name);
            const innerDirs = fs.readdirSync(subjectPath, { withFileTypes: true })
                .filter(d => d.isDirectory());

            for (const innerDir of innerDirs) {
                const innerPath = path.join(subjectPath, innerDir.name);
                // Session folders live here: "2020-Oct-Nov", "Topical Past Paper"
                const sessionDirs = fs.readdirSync(innerPath, { withFileTypes: true })
                    .filter(d => d.isDirectory());

                for (const sessionDir of sessionDirs) {
                    const { year, sessionLabel } = parseSessionFolder(sessionDir.name);
                    const sessionPath = path.join(innerPath, sessionDir.name);

                    // Files may be directly in sessionDir or in one more sub-folder
                    collectPdfs(sessionPath, qualName, subjectName, subjectCode, year, sessionLabel, files);
                }
            }
        }
    }

    return files;
}

function collectPdfs(
    dirPath: string,
    qualName: string,
    subjectName: string,
    subjectCode: string,
    year: number | null,
    sessionLabel: string,
    files: ScannedFile[]
): void {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
            // One more level of nesting allowed
            collectPdfs(fullPath, qualName, subjectName, subjectCode, year, sessionLabel, files);
        } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.pdf')) {
            const stats = fs.statSync(fullPath);
            const { fileType, paper, variant } = parseFilename(entry.name);
            files.push({
                absolutePath: fullPath,
                fileName: entry.name,
                fileSize: stats.size,
                qualification: qualName,
                subjectName,
                subjectCode,
                year,
                sessionLabel,
                fileType,
                paper,
                variant,
            });
        }
    }
}

// ============================================================================
// Concurrency Limiter
// ============================================================================

async function pLimit<T>(tasks: (() => Promise<T>)[], limit: number): Promise<T[]> {
    const results: T[] = [];
    let index = 0;
    async function runNext(): Promise<void> {
        while (index < tasks.length) {
            const i = index++;
            results[i] = await tasks[i]();
        }
    }
    const workers = Array.from({ length: Math.min(limit, tasks.length) }, () => runNext());
    await Promise.all(workers);
    return results;
}

// ============================================================================
// Database Helpers
// ============================================================================

/** Map qualification folder name to qualKey */
function qualKeyFromName(qualName: string): string {
    const lower = qualName.toLowerCase();
    if (lower.includes('o level') || lower.includes('o-level')) return 'o-level';
    if (lower.includes('a level') || lower.includes('a-level')) return 'a-level';
    if (lower.includes('igcse')) return 'igcse';
    return lower.replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

/** Find CAIE board in DB */
async function findCaieBoard(): Promise<any | null> {
    const boardKeys = ['caie', 'cambridge', 'cie'];
    for (const key of boardKeys) {
        const [board] = await db.select().from(boards)
            .where(eq(boards.boardKey, key)).limit(1);
        if (board) return board;
    }
    // Fuzzy match
    const [board] = await db.select().from(boards)
        .where(sql`LOWER(${boards.boardKey}) LIKE '%caie%' OR LOWER(${boards.fullName}) LIKE '%cambridge%'`)
        .limit(1);
    return board || null;
}

/** Find qualification row in DB */
async function findQualification(boardId: string, qualKey: string): Promise<any | null> {
    const [qual] = await db.select().from(qualifications)
        .where(and(eq(qualifications.boardId, boardId), eq(qualifications.qualKey, qualKey)))
        .limit(1);
    if (qual) return qual;
    // Fuzzy match by displayName
    const [qualFuzzy] = await db.select().from(qualifications)
        .where(and(
            eq(qualifications.boardId, boardId),
            sql`LOWER(${qualifications.displayName}) LIKE ${'%' + qualKey.replace('-', ' ') + '%'}`
        ))
        .limit(1);
    return qualFuzzy || null;
}

/** Find subject by code (direct or fuzzy) */
async function findSubject(subjectCode: string, subjectName: string): Promise<any | null> {
    // Direct code match
    const [byCode] = await db.select().from(subjects)
        .where(eq(subjects.subjectCode, subjectCode)).limit(1);
    if (byCode) return byCode;

    // Fuzzy name match
    const [byName] = await db.select().from(subjects)
        .where(sql`LOWER(${subjects.subjectName}) LIKE LOWER(${'%' + subjectName + '%'})`)
        .limit(1);
    return byName || null;
}

/** Ensure a resource category exists (safe for concurrent inserts) */
async function ensureResourceCategory(resourceKey: string, displayName: string, icon: string, sortOrder: number): Promise<void> {
    try {
        await db.insert(resourceCategories).values({
            id: randomUUID(),
            resourceKey,
            displayName,
            icon,
            sortOrder,
        }).onConflictDoNothing();
    } catch {
        // Already exists — ignore
    }
}

/** Get or create a resource node */
async function getOrCreateNode(
    subjectId: string,
    resourceKey: string,
    title: string,
    nodeType: string,
    parentNodeId?: string
): Promise<string> {
    const conditions: any[] = [
        eq(resourceNodes.subjectId, subjectId),
        eq(resourceNodes.resourceKey, resourceKey),
        eq(resourceNodes.title, title),
    ];
    if (parentNodeId) {
        conditions.push(eq(resourceNodes.parentNodeId, parentNodeId));
    }

    const [existing] = await db.select().from(resourceNodes)
        .where(and(...conditions)).limit(1);
    if (existing) return existing.id;

    const id = randomUUID();
    await db.insert(resourceNodes).values({
        id,
        subjectId,
        resourceKey,
        parentNodeId: parentNodeId || null,
        title,
        nodeType,
        sortOrder: 0,
    });
    return id;
}

// ============================================================================
// Main Upload Logic
// ============================================================================

async function processFile(file: ScannedFile, report: UploadReport): Promise<void> {
    try {
        // Find subject
        const subject = await findSubject(file.subjectCode, file.subjectName);
        if (!subject) {
            report.skipped++;
            console.log(`⏭️  Skipped (subject not found: ${file.subjectCode} "${file.subjectName}"): ${file.fileName}`);
            return;
        }

        // Determine board & qual keys for path
        const board = await db.select().from(boards).where(eq(boards.id, subject.boardId)).limit(1).then(r => r[0]);
        const qual = await db.select().from(qualifications).where(eq(qualifications.id, subject.qualId)).limit(1).then(r => r[0]);

        const boardKey = board?.boardKey || 'caie';
        const qualKey = qual?.qualKey || qualKeyFromName(file.qualification);
        const subjectSlug = subject.slug || `${file.subjectName.toLowerCase().replace(/\s+/g, '-')}-${file.subjectCode}`;

        // Build session path segment
        const sessionSegment = file.year
            ? `${file.year}/${file.sessionLabel.toLowerCase().replace(/\s+/g, '-')}`
            : 'topical';

        // Build object key
        const objectKey = [
            boardKey,
            qualKey,
            subjectSlug,
            'past-papers',
            sessionSegment,
            sanitizeFilename(file.fileName),
        ].filter(Boolean).join('/');

        // Duplicate check
        const isDuplicate = await checkDuplicate(objectKey);
        if (isDuplicate) {
            report.skipped++;
            console.log(`⏭️  Skipped (duplicate): ${file.fileName}`);
            return;
        }

        if (DRY_RUN) {
            console.log(`🔍 [DRY RUN] ${file.fileName}`);
            console.log(`   → Object key: ${objectKey}`);
            console.log(`   → Subject: ${subject.subjectName} (${file.subjectCode}) | ${file.fileType}${file.year ? ` | ${file.year} ${file.sessionLabel}` : ''}`);
            report.uploaded++;
            return;
        }

        // Read + upload
        const fileBuffer = fs.readFileSync(file.absolutePath);
        const uploadResult = await uploadPdf(fileBuffer, objectKey, 'application/pdf');
        if (!uploadResult.success) {
            report.failed++;
            report.errors.push({ file: file.fileName, error: uploadResult.error || 'Unknown' });
            console.error(`❌ Upload failed: ${file.fileName} — ${uploadResult.error}`);
            return;
        }

        // Ensure resource category
        await ensureResourceCategory('past_papers', 'Past Papers', 'FileText', 1);

        // Build node tree: root → year → session
        const rootNodeId = await getOrCreateNode(subject.id, 'past_papers', 'Past Papers', 'folder');
        let nodeId = rootNodeId;

        if (file.year) {
            const yearNodeId = await getOrCreateNode(subject.id, 'past_papers', String(file.year), 'folder', rootNodeId);
            nodeId = await getOrCreateNode(subject.id, 'past_papers', file.sessionLabel, 'list', yearNodeId);
        } else {
            // Topical
            nodeId = await getOrCreateNode(subject.id, 'past_papers', 'Topical', 'folder', rootNodeId);
        }

        // Build a human-readable title
        const title = file.fileName
            .replace(/\.pdf$/i, '')
            .replace(/_/g, ' ')
            .toUpperCase();

        // Insert metadata
        await db.insert(fileAssets).values({
            id: randomUUID(),
            subjectId: subject.id,
            resourceKey: 'past_papers',
            nodeId,
            title,
            fileName: file.fileName,
            mimeType: 'application/pdf',
            fileSize: file.fileSize,
            fileType: file.fileType,
            year: file.year,
            session: file.sessionLabel,
            paper: file.paper,
            variant: file.variant,
            objectKey,
            url: uploadResult.publicUrl || getPublicUrl(objectKey),
            isPublic: true,
            downloadCount: 0,
        });

        report.uploaded++;
        console.log(`✅ Uploaded: ${file.fileName} → ${objectKey}`);
    } catch (error: any) {
        report.failed++;
        report.errors.push({ file: file.fileName, error: error.message });
        console.error(`❌ Error processing ${file.fileName}:`, error.message);
    }
}

// ============================================================================
// Entry Point
// ============================================================================

async function main() {
    console.log('='.repeat(60));
    console.log('📚 Past Papers Upload Script — Supabase Storage');
    console.log('='.repeat(60));
    console.log(`Directory: ${PAST_PAPERS_ROOT}`);
    console.log(`Mode: ${DRY_RUN ? '🔍 DRY RUN (no actual uploads)' : '🚀 LIVE UPLOAD'}`);
    if (SUBJECT_FILTER) console.log(`Subject filter: ${SUBJECT_FILTER}`);
    console.log('');

    // Scan
    console.log('Scanning School_Files/Past Papers directory...');
    const files = scanDirectory();
    console.log(`Found ${files.length} PDF files\n`);

    if (files.length === 0) {
        console.log('No PDF files found. Exiting.');
        process.exit(0);
    }

    // Summary
    const bySubject = new Map<string, number>();
    for (const f of files) {
        const key = `${f.subjectName} (${f.subjectCode}) — ${f.qualification}`;
        bySubject.set(key, (bySubject.get(key) || 0) + 1);
    }
    console.log('Files by subject:');
    for (const [subject, count] of bySubject.entries()) {
        console.log(`  📁 ${subject}: ${count} files`);
    }
    console.log('');

    const bySession = new Map<string, number>();
    for (const f of files) {
        const key = f.year ? `${f.year} ${f.sessionLabel}` : 'Topical';
        bySession.set(key, (bySession.get(key) || 0) + 1);
    }
    console.log('Files by session:');
    for (const [session, count] of [...bySession.entries()].sort()) {
        console.log(`  📅 ${session}: ${count} files`);
    }
    console.log('');

    const report: UploadReport = { total: files.length, uploaded: 0, skipped: 0, failed: 0, errors: [] };

    const tasks = files.map(file => () => processFile(file, report));
    await pLimit(tasks, CONCURRENCY_LIMIT);

    console.log('\n' + '='.repeat(60));
    console.log('📊 Upload Report');
    console.log('='.repeat(60));
    console.log(`Total files:  ${report.total}`);
    console.log(`Uploaded:     ${report.uploaded}`);
    console.log(`Skipped:      ${report.skipped}`);
    console.log(`Failed:       ${report.failed}`);

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
