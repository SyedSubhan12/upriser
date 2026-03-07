
export type CAIEFileType = 'qp' | 'ms' | 'gt' | 'er' | 'in' | 'ir' | 'ci' | 'sf' | 'pm' | 'sm' | 'sp' | 'other';

export interface CAIEParsedFilename {
    subjectCode: string | null;
    year: number | null;
    session: string | null; // e.g., "May/June", "Oct/Nov", "March"
    sessionCode: string | null; // e.g., "s", "w", "m"
    fileType: CAIEFileType;
    paper: number | null;
    variant: number | null;
    isValid: boolean;
}

export const CAIE_SESSION_MAP: Record<string, string> = {
    's': 'May/June',
    'w': 'Oct/Nov',
    'm': 'March',
    'y': 'Specimen',
};

export const CAIE_FILE_TYPE_MAP: Record<string, string> = {
    'qp': 'Question Paper',
    'ms': 'Mark Scheme',
    'gt': 'Grade Thresholds',
    'er': 'Examiner Report',
    'in': 'Insert',
    'ir': 'Instructional',
    'ci': 'Confidential Instructions',
    'sf': 'Source File',
    'pm': 'Principal Examiner Report',
    'sm': 'Specimen Mark Scheme',
    'sp': 'Specimen Paper',
};

/**
 * Parse a Cambridge past paper filename e.g. "9706_s20_qp_12.pdf"
 * Standard pattern: [SubjectCode]_[Session][Year]_[Type]_[Variant].pdf
 */
export function parseCAIEFilename(filename: string): CAIEParsedFilename {
    const baseName = filename.replace(/\.[^.]+$/, '').toLowerCase(); // strip extension
    const parts = baseName.split('_');

    // Default result
    const result: CAIEParsedFilename = {
        subjectCode: null,
        year: null,
        session: null,
        sessionCode: null,
        fileType: 'other',
        paper: null,
        variant: null,
        isValid: false,
    };

    if (parts.length < 2) return result;

    // Part 1: Subject Code (e.g., 9706)
    if (/^\d{4,5}$/.test(parts[0])) {
        result.subjectCode = parts[0];
    }

    // Part 2: Session and Year (e.g., s20)
    const sessionYearPart = parts[1];
    const sessionYearMatch = sessionYearPart.match(/^([swmy])(\d{2})$/i);
    if (sessionYearMatch) {
        result.sessionCode = sessionYearMatch[1].toLowerCase();
        result.session = CAIE_SESSION_MAP[result.sessionCode] || null;

        const yearSuffix = parseInt(sessionYearMatch[2]);
        // Assume 20xx for now, CAIE papers are usually from 2000 onwards in digital form
        result.year = 2000 + yearSuffix;
    }

    // Look for file type and variant in remaining parts
    for (let i = 2; i < parts.length; i++) {
        const p = parts[i];

        // Check for file type
        if (['qp', 'ms', 'gt', 'er', 'in', 'ir', 'ci', 'sf', 'pm', 'sm', 'sp'].includes(p)) {
            result.fileType = p as CAIEFileType;

            // Look ahead for variant/paper
            const nextPart = parts[i + 1];
            if (nextPart && /^\d{1,2}$/.test(nextPart)) {
                if (nextPart.length === 2) {
                    result.paper = parseInt(nextPart[0]);
                    result.variant = parseInt(nextPart[1]);
                } else {
                    result.paper = parseInt(nextPart);
                }
            }
            break;
        }
    }

    // Validation
    if (result.subjectCode && result.year && result.sessionCode && result.fileType !== 'other') {
        result.isValid = true;
    }

    return result;
}

/**
 * Format paper and variant for display
 */
export function formatPaperVariant(paper: number | null, variant: number | null): string {
    if (paper !== null && variant !== null) return `P${paper}${variant}`;
    if (paper !== null) return `P${paper}`;
    return '';
}
