/**
 * Supabase Storage Helper
 * 
 * Handles PDF upload/download operations via Supabase Storage.
 * Uses the server-side admin client (service role key) for all operations.
 */

import { supabaseAdmin, getSupabaseUrl } from './supabase';
import { db } from './db';
import { fileAssets } from '@shared/schema';
import { eq } from 'drizzle-orm';

const BUCKET_NAME = 'content';
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const ALLOWED_MIME_TYPES = ['application/pdf'];

export interface UploadResult {
    success: boolean;
    objectKey?: string;
    publicUrl?: string;
    error?: string;
}

/**
 * Validate that a file is a valid PDF and within size limits.
 */
export function validatePdf(file: { mimetype: string; size: number; originalname: string }): { valid: boolean; error?: string } {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        return { valid: false, error: `Invalid file type: ${file.mimetype}. Only PDF files are allowed.` };
    }
    if (file.size > MAX_FILE_SIZE) {
        return { valid: false, error: `File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Maximum is 100MB.` };
    }
    if (!file.originalname.toLowerCase().endsWith('.pdf')) {
        return { valid: false, error: 'File must have a .pdf extension.' };
    }
    return { valid: true };
}

/**
 * Check if a file with the given object_key already exists in the database.
 */
export async function checkDuplicate(objectKey: string): Promise<boolean> {
    const [existing] = await db.select({ id: fileAssets.id })
        .from(fileAssets)
        .where(eq(fileAssets.objectKey, objectKey))
        .limit(1);
    return !!existing;
}

/**
 * Sleep helper for retry backoff.
 */
function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Upload a PDF buffer to Supabase Storage with automatic retry on network errors.
 */
export async function uploadPdf(
    fileBuffer: Buffer,
    objectKey: string,
    contentType: string = 'application/pdf'
): Promise<UploadResult> {
    if (!supabaseAdmin) {
        return { success: false, error: 'Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.' };
    }

    const MAX_RETRIES = 3;
    const RETRY_DELAYS = [2000, 5000, 10000]; // 2s, 5s, 10s

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        const { data, error } = await supabaseAdmin.storage
            .from(BUCKET_NAME)
            .upload(objectKey, fileBuffer, {
                contentType,
                upsert: false,
            });

        if (!error) {
            const publicUrl = getPublicUrl(objectKey);
            return { success: true, objectKey, publicUrl };
        }

        // Already exists — upsert it
        if (error.message?.includes('already exists') || error.message?.includes('Duplicate')) {
            const { error: upsertError } = await supabaseAdmin.storage
                .from(BUCKET_NAME)
                .upload(objectKey, fileBuffer, { contentType, upsert: true });

            if (upsertError) {
                return { success: false, error: `Upload failed (upsert): ${upsertError.message}` };
            }
            const publicUrl = getPublicUrl(objectKey);
            return { success: true, objectKey, publicUrl };
        }

        // Non-retryable errors — fail immediately
        if (error.message?.includes('maximum allowed size') || error.message?.includes('Invalid key')) {
            return { success: false, error: `Upload failed: ${error.message}` };
        }

        // Retryable network errors (Bad Gateway, fetch failed)
        if (attempt < MAX_RETRIES) {
            console.log(`  ⏳ Retry ${attempt + 1}/${MAX_RETRIES} for ${objectKey} (${error.message})`);
            await sleep(RETRY_DELAYS[attempt]);
            continue;
        }

        return { success: false, error: `Upload failed: ${error.message}` };
    }

    return { success: false, error: 'Upload failed: max retries exceeded' };
}

/**
 * Get the public URL for a file in Supabase Storage.
 */
export function getPublicUrl(objectKey: string): string {
    if (!supabaseAdmin) {
        return '';
    }
    const { data } = supabaseAdmin.storage.from(BUCKET_NAME).getPublicUrl(objectKey);
    return data.publicUrl;
}

/**
 * Generate a signed URL for protected files (expires after specified seconds).
 */
export async function getSignedUrl(objectKey: string, expiresIn: number = 3600): Promise<string | null> {
    if (!supabaseAdmin) return null;

    const { data, error } = await supabaseAdmin.storage
        .from(BUCKET_NAME)
        .createSignedUrl(objectKey, expiresIn);

    if (error) {
        console.error(`Failed to create signed URL for ${objectKey}:`, error.message);
        return null;
    }

    return data.signedUrl;
}

/**
 * Delete a file from Supabase Storage.
 */
export async function deleteFile(objectKey: string): Promise<boolean> {
    if (!supabaseAdmin) return false;

    const { error } = await supabaseAdmin.storage
        .from(BUCKET_NAME)
        .remove([objectKey]);

    if (error) {
        console.error(`Failed to delete ${objectKey}:`, error.message);
        return false;
    }

    return true;
}

/**
 * List all files in a specific path in Supabase Storage.
 */
export async function listFiles(path: string = ''): Promise<string[]> {
    if (!supabaseAdmin) return [];

    const { data, error } = await supabaseAdmin.storage
        .from(BUCKET_NAME)
        .list(path, { limit: 1000 });

    if (error) {
        console.error(`Failed to list files at ${path}:`, error.message);
        return [];
    }

    return data.map(f => path ? `${path}/${f.name}` : f.name);
}

/**
 * Sanitize a filename for use as a Supabase Storage object key segment.
 * Removes characters that Supabase rejects: [ ] ( ) ! @ # $ % ^ & * ` ' " \ etc.
 */
export function sanitizeFilename(fileName: string): string {
    return fileName
        .replace(/[\[\]()!@#$%^&*`'"\\]/g, '') // remove invalid chars
        .replace(/\s+/g, '_')                   // spaces → underscores
        .replace(/_+/g, '_')                    // collapse multiple underscores
        .replace(/^_|_$/g, '');                 // trim leading/trailing underscores
}

/**
 * Build the object_key for a curriculum file following the path structure:
 * {boardKey}/{qualKey}/{subjectSlug}/{resourceKey}/{subFolder?}/{filename}
 * Sanitizes the filename to ensure Supabase accepts it.
 */
export function buildObjectKey(params: {
    boardKey: string;
    qualKey: string;
    subjectSlug: string;
    resourceKey: string;
    fileName: string;
    year?: number;
    session?: string;
}): string {
    const parts = [
        params.boardKey,
        params.qualKey,
        params.subjectSlug,
        params.resourceKey,
    ];

    if (params.year) {
        parts.push(String(params.year));
    }
    if (params.session) {
        parts.push(params.session);
    }

    parts.push(sanitizeFilename(params.fileName));

    return parts.join('/');
}

/**
 * Enrich a file asset row with a Supabase public URL.
 * Falls back to the local API URL if no object_key is set.
 */
export function enrichFileWithUrl(file: any): any {
    if (file.objectKey && supabaseAdmin) {
        return {
            ...file,
            url: getPublicUrl(file.objectKey),
        };
    }
    // Fallback: local API serving
    if (!file.url) {
        return {
            ...file,
            url: `/api/curriculum/files/${file.id}/raw`,
        };
    }
    return file;
}
