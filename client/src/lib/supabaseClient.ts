import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Frontend Supabase client (anon key - public access only)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Get a public URL for a file in Supabase Storage.
 * Falls back to API route if Supabase is not configured.
 */
export function getFileUrl(objectKey: string | null | undefined, fileId: string): string {
    if (objectKey && supabaseUrl) {
        const { data } = supabase.storage.from('content').getPublicUrl(objectKey);
        return data.publicUrl;
    }
    // Fallback to Express API route
    return `/api/curriculum/files/${fileId}/raw`;
}
