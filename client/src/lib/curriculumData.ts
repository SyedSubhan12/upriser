// PapaCambridge-Style Curriculum Data Types and Content
// Navigation: Board → Qualification → (optional Branch) → Subject → Resource Hub → File Browser

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface Board {
    id: string;
    boardKey: string;        // slug: caie, pearson, ib, ocr, aqa, wjec, ccea
    displayName: string;
    fullName: string;
    description: string;
    logoUrl?: string;
    sortOrder: number;
    isEnabled: boolean;
}

export interface Qualification {
    id: string;
    boardId: string;
    qualKey: string;         // slug: igcse, a-level, gcse, etc.
    displayName: string;
    hasBranching: boolean;   // true for Current/Legacy support
    sortOrder: number;
}

export interface Branch {
    id: string;
    qualId: string;
    branchKey: string;       // current | legacy
    displayName: string;
}

export interface Subject {
    id: string;
    boardId: string;
    qualId: string;
    branchId?: string;       // nullable
    subjectName: string;
    subjectCode?: string;    // e.g., "0580", "9709"
    versionTag?: string;     // e.g., "2018", "First Teaching 2024"
    slug: string;
    sortKey: string;
    description?: string;
    icon?: string;
}

export interface ResourceCategory {
    resourceKey: string;     // past_papers, notes, syllabus, books, other, timetable
    displayName: string;
    icon: string;
    sortOrder: number;
}

export interface ResourceNode {
    id: string;
    subjectId: string;
    resourceKey: string;
    parentNodeId?: string;  // nullable for root nodes
    title: string;
    nodeType: 'folder' | 'list' | 'file';
    meta?: Record<string, unknown>;
}

export interface FileAsset {
    id: string;
    subjectId: string;
    resourceKey: string;
    nodeId: string;
    title: string;
    fileName?: string;
    mimeType?: string;
    fileSize?: number;
    fileType: FileType;
    year?: number;
    session?: string;         // m, s, w (May/June, Summer, Winter)
    paper?: number;
    variant?: number;
    url: string;
    fileContent?: string;     // Base64 if needed
}

export type FileType = 'qp' | 'ms' | 'gt' | 'er' | 'in' | 'ir' | 'ci' | 'sf' | 'pm' | 'sm' | 'sp' | 'other';

// IB-specific types
export interface SubjectGroup {
    id: string;
    programId: string;       // Links to qualId for IB DP
    name: string;
    description: string;
    sortOrder: number;
}

// ============================================
// FILE TYPE LABELS
// ============================================

export const FILE_TYPE_LABELS: Record<FileType, string> = {
    qp: 'Question Paper',
    ms: 'Mark Scheme',
    gt: 'Grade Threshold',
    er: 'Examiner Report',
    in: 'Insert',
    ir: 'Instructions',
    ci: 'Confidential Instructions',
    sf: 'Source File',
    pm: 'Principal Examiner Report',
    sm: 'Specimen Mark Scheme',
    sp: 'Specimen Paper',
    other: 'Other',
};

export const FILE_TYPE_SHORT_LABELS: Record<FileType, string> = {
    qp: 'QP',
    ms: 'MS',
    gt: 'GT',
    er: 'ER',
    in: 'IN',
    ir: 'IR',
    ci: 'CI',
    sf: 'SF',
    pm: 'PM',
    sm: 'SM',
    sp: 'SP',
    other: 'Other',
};

// ============================================
// BOARDS DATA
// ============================================

export const boards: Board[] = [
    {
        id: 'caie',
        boardKey: 'caie',
        displayName: 'CAIE',
        fullName: 'Cambridge Assessment International Education',
        description: 'Cambridge qualifications prepare students for life, helping them develop an informed curiosity and a lasting passion for learning.',
        sortOrder: 1,
        isEnabled: true,
    },
    {
        id: 'pearson',
        boardKey: 'pearson',
        displayName: 'Pearson (Edexcel)',
        fullName: 'Pearson Edexcel',
        description: 'Edexcel qualifications are designed to be inclusive, enabling progression to higher education and employment.',
        sortOrder: 2,
        isEnabled: true,
    },
    {
        id: 'ib',
        boardKey: 'ib',
        displayName: 'IB',
        fullName: 'International Baccalaureate',
        description: 'The IB provides high-quality international education to develop inquiring, knowledgeable and caring young people.',
        sortOrder: 3,
        isEnabled: true,
    },
    {
        id: 'ocr',
        boardKey: 'ocr',
        displayName: 'OCR',
        fullName: 'Oxford, Cambridge and RSA',
        description: 'OCR is a leading UK awarding body providing qualifications for learners of all ages.',
        sortOrder: 4,
        isEnabled: true,
    },
    {
        id: 'aqa',
        boardKey: 'aqa',
        displayName: 'AQA',
        fullName: 'Assessment and Qualifications Alliance',
        description: 'AQA is the largest provider of academic qualifications taught in schools and colleges in England.',
        sortOrder: 5,
        isEnabled: true,
    },
    {
        id: 'wjec',
        boardKey: 'wjec',
        displayName: 'WJEC',
        fullName: 'Welsh Joint Education Committee',
        description: 'WJEC provides qualifications for schools and colleges in Wales and England.',
        sortOrder: 6,
        isEnabled: true,
    },
    {
        id: 'ccea',
        boardKey: 'ccea',
        displayName: 'CCEA',
        fullName: 'Council for the Curriculum, Examinations & Assessment',
        description: 'CCEA is a unique organisation in Northern Ireland, providing curriculum and assessment services.',
        sortOrder: 7,
        isEnabled: true,
    },
];

// ============================================
// QUALIFICATIONS DATA
// ============================================

export const qualifications: Qualification[] = [
    // CAIE Qualifications
    {
        id: 'caie-igcse',
        boardId: 'caie',
        qualKey: 'igcse',
        displayName: 'IGCSE',
        hasBranching: false,
        sortOrder: 1,
    },
    {
        id: 'caie-olevel',
        boardId: 'caie',
        qualKey: 'o-level',
        displayName: 'O Level',
        hasBranching: false,
        sortOrder: 2,
    },
    {
        id: 'caie-as-a-level',
        boardId: 'caie',
        qualKey: 'as-a-level',
        displayName: 'AS & A Level',
        hasBranching: false,
        sortOrder: 3,
    },
    {
        id: 'caie-pre-u',
        boardId: 'caie',
        qualKey: 'pre-u',
        displayName: 'Pre-U',
        hasBranching: false,
        sortOrder: 4,
    },

    // Pearson (Edexcel) Qualifications
    {
        id: 'pearson-int-gcse',
        boardId: 'pearson',
        qualKey: 'international-gcse',
        displayName: 'International GCSE',
        hasBranching: true,  // Supports Current/Legacy
        sortOrder: 1,
    },
    {
        id: 'pearson-int-a-level',
        boardId: 'pearson',
        qualKey: 'international-a-level',
        displayName: 'International Advanced Level',
        hasBranching: true,
        sortOrder: 2,
    },
    {
        id: 'pearson-gcse',
        boardId: 'pearson',
        qualKey: 'gcse',
        displayName: 'GCSE',
        hasBranching: true,
        sortOrder: 3,
    },
    {
        id: 'pearson-entry-level',
        boardId: 'pearson',
        qualKey: 'entry-level',
        displayName: 'Entry Level Certificate',
        hasBranching: false,
        sortOrder: 4,
    },
    {
        id: 'pearson-ipc',
        boardId: 'pearson',
        qualKey: 'ipc',
        displayName: 'International Primary Curriculum',
        hasBranching: false,
        sortOrder: 5,
    },

    // IB Qualifications (Programs)
    {
        id: 'ib-myp',
        boardId: 'ib',
        qualKey: 'myp',
        displayName: 'MYP (Middle Years Programme)',
        hasBranching: false,
        sortOrder: 1,
    },
    {
        id: 'ib-dp',
        boardId: 'ib',
        qualKey: 'dp',
        displayName: 'DP (Diploma Programme)',
        hasBranching: false,
        sortOrder: 2,
    },

    // OCR Qualifications
    {
        id: 'ocr-gcse',
        boardId: 'ocr',
        qualKey: 'gcse',
        displayName: 'GCSE',
        hasBranching: false,
        sortOrder: 1,
    },
    {
        id: 'ocr-a-level',
        boardId: 'ocr',
        qualKey: 'a-level',
        displayName: 'A Level',
        hasBranching: false,
        sortOrder: 2,
    },

    // AQA Qualifications
    {
        id: 'aqa-gcse',
        boardId: 'aqa',
        qualKey: 'gcse',
        displayName: 'GCSE',
        hasBranching: false,
        sortOrder: 1,
    },
    {
        id: 'aqa-a-level',
        boardId: 'aqa',
        qualKey: 'a-level',
        displayName: 'A Level',
        hasBranching: false,
        sortOrder: 2,
    },
];

// ============================================
// BRANCHES DATA (Current/Legacy)
// ============================================

export const branches: Branch[] = [
    // Pearson International GCSE
    {
        id: 'pearson-int-gcse-current',
        qualId: 'pearson-int-gcse',
        branchKey: 'current',
        displayName: 'Current Specification',
    },
    {
        id: 'pearson-int-gcse-legacy',
        qualId: 'pearson-int-gcse',
        branchKey: 'legacy',
        displayName: 'Legacy Specification',
    },
    // Pearson International A Level
    {
        id: 'pearson-int-a-level-current',
        qualId: 'pearson-int-a-level',
        branchKey: 'current',
        displayName: 'Current Specification',
    },
    {
        id: 'pearson-int-a-level-legacy',
        qualId: 'pearson-int-a-level',
        branchKey: 'legacy',
        displayName: 'Legacy Specification',
    },
    // Pearson GCSE
    {
        id: 'pearson-gcse-current',
        qualId: 'pearson-gcse',
        branchKey: 'current',
        displayName: 'Current Specification',
    },
    {
        id: 'pearson-gcse-legacy',
        qualId: 'pearson-gcse',
        branchKey: 'legacy',
        displayName: 'Legacy Specification',
    },
];

// ============================================
// IB DP SUBJECT GROUPS
// ============================================

export const subjectGroups: SubjectGroup[] = [
    {
        id: 'ib-dp-group1',
        programId: 'ib-dp',
        name: 'Studies in Language and Literature',
        description: 'Courses in literature, language and culture.',
        sortOrder: 1,
    },
    {
        id: 'ib-dp-group2',
        programId: 'ib-dp',
        name: 'Language Acquisition',
        description: 'Foreign language learning courses.',
        sortOrder: 2,
    },
    {
        id: 'ib-dp-group3',
        programId: 'ib-dp',
        name: 'Individuals and Societies',
        description: 'Social sciences including history, geography, economics.',
        sortOrder: 3,
    },
    {
        id: 'ib-dp-group4',
        programId: 'ib-dp',
        name: 'Sciences',
        description: 'Biology, Chemistry, Physics, Environmental Systems.',
        sortOrder: 4,
    },
    {
        id: 'ib-dp-group5',
        programId: 'ib-dp',
        name: 'Mathematics',
        description: 'Mathematics courses at various levels.',
        sortOrder: 5,
    },
    {
        id: 'ib-dp-group6',
        programId: 'ib-dp',
        name: 'The Arts',
        description: 'Visual arts, music, theatre, film, and dance.',
        sortOrder: 6,
    },
];

// ============================================
// SUBJECTS DATA
// ============================================

export const subjects: Subject[] = [
    // CAIE IGCSE Subjects
    { id: 'caie-igcse-math-0580', boardId: 'caie', qualId: 'caie-igcse', subjectName: 'Mathematics', subjectCode: '0580', versionTag: '2024', slug: 'mathematics-0580', sortKey: 'mathematics', description: 'IGCSE Mathematics', icon: 'calculator' },
    { id: 'caie-igcse-add-math-0606', boardId: 'caie', qualId: 'caie-igcse', subjectName: 'Additional Mathematics', subjectCode: '0606', versionTag: '2024', slug: 'add-mathematics-0606', sortKey: 'additional-mathematics', description: 'IGCSE Additional Mathematics', icon: 'calculator' },
    { id: 'caie-igcse-physics-0625', boardId: 'caie', qualId: 'caie-igcse', subjectName: 'Physics', subjectCode: '0625', versionTag: '2023', slug: 'physics-0625', sortKey: 'physics', description: 'IGCSE Physics', icon: 'atom' },
    { id: 'caie-igcse-chemistry-0620', boardId: 'caie', qualId: 'caie-igcse', subjectName: 'Chemistry', subjectCode: '0620', versionTag: '2023', slug: 'chemistry-0620', sortKey: 'chemistry', description: 'IGCSE Chemistry', icon: 'flask-conical' },
    { id: 'caie-igcse-biology-0610', boardId: 'caie', qualId: 'caie-igcse', subjectName: 'Biology', subjectCode: '0610', versionTag: '2023', slug: 'biology-0610', sortKey: 'biology', description: 'IGCSE Biology', icon: 'leaf' },
    { id: 'caie-igcse-cs-0478', boardId: 'caie', qualId: 'caie-igcse', subjectName: 'Computer Science', subjectCode: '0478', versionTag: '2023', slug: 'computer-science-0478', sortKey: 'computer-science', description: 'IGCSE Computer Science', icon: 'laptop' },
    { id: 'caie-igcse-english-0500', boardId: 'caie', qualId: 'caie-igcse', subjectName: 'First Language English', subjectCode: '0500', versionTag: '2024', slug: 'english-0500', sortKey: 'english-first-language', description: 'IGCSE First Language English', icon: 'book' },
    { id: 'caie-igcse-english-0510', boardId: 'caie', qualId: 'caie-igcse', subjectName: 'English as a Second Language', subjectCode: '0510', versionTag: '2024', slug: 'english-0510', sortKey: 'english-second-language', description: 'IGCSE English as a Second Language', icon: 'book' },
    { id: 'caie-igcse-economics-0455', boardId: 'caie', qualId: 'caie-igcse', subjectName: 'Economics', subjectCode: '0455', versionTag: '2024', slug: 'economics-0455', sortKey: 'economics', description: 'IGCSE Economics', icon: 'trending-up' },
    { id: 'caie-igcse-business-0450', boardId: 'caie', qualId: 'caie-igcse', subjectName: 'Business Studies', subjectCode: '0450', versionTag: '2024', slug: 'business-0450', sortKey: 'business-studies', description: 'IGCSE Business Studies', icon: 'briefcase' },
    { id: 'caie-igcse-accounting-0452', boardId: 'caie', qualId: 'caie-igcse', subjectName: 'Accounting', subjectCode: '0452', versionTag: '2024', slug: 'accounting-0452', sortKey: 'accounting', description: 'IGCSE Accounting', icon: 'receipt' },
    { id: 'caie-igcse-history-0470', boardId: 'caie', qualId: 'caie-igcse', subjectName: 'History', subjectCode: '0470', versionTag: '2024', slug: 'history-0470', sortKey: 'history', description: 'IGCSE History', icon: 'landmark' },
    { id: 'caie-igcse-geography-0460', boardId: 'caie', qualId: 'caie-igcse', subjectName: 'Geography', subjectCode: '0460', versionTag: '2024', slug: 'geography-0460', sortKey: 'geography', description: 'IGCSE Geography', icon: 'globe' },

    // CAIE O Level Subjects
    { id: 'caie-olevel-math-4024', boardId: 'caie', qualId: 'caie-olevel', subjectName: 'Mathematics', subjectCode: '4024', slug: 'mathematics-4024', sortKey: 'mathematics', description: 'O Level Mathematics', icon: 'calculator' },
    { id: 'caie-olevel-physics-5054', boardId: 'caie', qualId: 'caie-olevel', subjectName: 'Physics', subjectCode: '5054', slug: 'physics-5054', sortKey: 'physics', description: 'O Level Physics', icon: 'atom' },
    { id: 'caie-olevel-chemistry-5070', boardId: 'caie', qualId: 'caie-olevel', subjectName: 'Chemistry', subjectCode: '5070', slug: 'chemistry-5070', sortKey: 'chemistry', description: 'O Level Chemistry', icon: 'flask-conical' },
    { id: 'caie-olevel-biology-5090', boardId: 'caie', qualId: 'caie-olevel', subjectName: 'Biology', subjectCode: '5090', slug: 'biology-5090', sortKey: 'biology', description: 'O Level Biology', icon: 'leaf' },
    { id: 'caie-olevel-cs-2210', boardId: 'caie', qualId: 'caie-olevel', subjectName: 'Computer Science', subjectCode: '2210', slug: 'computer-science-2210', sortKey: 'computer-science', description: 'O Level Computer Science', icon: 'laptop' },
    { id: 'caie-olevel-english-1123', boardId: 'caie', qualId: 'caie-olevel', subjectName: 'English Language', subjectCode: '1123', slug: 'english-1123', sortKey: 'english', description: 'O Level English Language', icon: 'book' },

    // CAIE AS & A Level Subjects
    { id: 'caie-alevel-math-9709', boardId: 'caie', qualId: 'caie-as-a-level', subjectName: 'Mathematics', subjectCode: '9709', versionTag: '2024', slug: 'mathematics-9709', sortKey: 'mathematics', description: 'AS & A Level Mathematics', icon: 'calculator' },
    { id: 'caie-alevel-further-math-9231', boardId: 'caie', qualId: 'caie-as-a-level', subjectName: 'Further Mathematics', subjectCode: '9231', versionTag: '2024', slug: 'further-mathematics-9231', sortKey: 'further-mathematics', description: 'AS & A Level Further Mathematics', icon: 'calculator' },
    { id: 'caie-alevel-physics-9702', boardId: 'caie', qualId: 'caie-as-a-level', subjectName: 'Physics', subjectCode: '9702', versionTag: '2024', slug: 'physics-9702', sortKey: 'physics', description: 'AS & A Level Physics', icon: 'atom' },
    { id: 'caie-alevel-chemistry-9701', boardId: 'caie', qualId: 'caie-as-a-level', subjectName: 'Chemistry', subjectCode: '9701', versionTag: '2024', slug: 'chemistry-9701', sortKey: 'chemistry', description: 'AS & A Level Chemistry', icon: 'flask-conical' },
    { id: 'caie-alevel-biology-9700', boardId: 'caie', qualId: 'caie-as-a-level', subjectName: 'Biology', subjectCode: '9700', versionTag: '2024', slug: 'biology-9700', sortKey: 'biology', description: 'AS & A Level Biology', icon: 'leaf' },
    { id: 'caie-alevel-cs-9618', boardId: 'caie', qualId: 'caie-as-a-level', subjectName: 'Computer Science', subjectCode: '9618', versionTag: '2024', slug: 'computer-science-9618', sortKey: 'computer-science', description: 'AS & A Level Computer Science', icon: 'laptop' },
    { id: 'caie-alevel-economics-9708', boardId: 'caie', qualId: 'caie-as-a-level', subjectName: 'Economics', subjectCode: '9708', versionTag: '2024', slug: 'economics-9708', sortKey: 'economics', description: 'AS & A Level Economics', icon: 'trending-up' },
    { id: 'caie-alevel-business-9609', boardId: 'caie', qualId: 'caie-as-a-level', subjectName: 'Business', subjectCode: '9609', versionTag: '2024', slug: 'business-9609', sortKey: 'business', description: 'AS & A Level Business', icon: 'briefcase' },
    { id: 'caie-alevel-accounting-9706', boardId: 'caie', qualId: 'caie-as-a-level', subjectName: 'Accounting', subjectCode: '9706', versionTag: '2024', slug: 'accounting-9706', sortKey: 'accounting', description: 'AS & A Level Accounting', icon: 'receipt' },

    // Pearson International GCSE (Current)
    { id: 'pearson-int-gcse-math-4ma1', boardId: 'pearson', qualId: 'pearson-int-gcse', branchId: 'pearson-int-gcse-current', subjectName: 'Mathematics A', subjectCode: '4MA1', versionTag: 'Current', slug: 'mathematics-4ma1', sortKey: 'mathematics-a', description: 'International GCSE Mathematics A', icon: 'calculator' },
    { id: 'pearson-int-gcse-physics-4ph1', boardId: 'pearson', qualId: 'pearson-int-gcse', branchId: 'pearson-int-gcse-current', subjectName: 'Physics', subjectCode: '4PH1', versionTag: 'Current', slug: 'physics-4ph1', sortKey: 'physics', description: 'International GCSE Physics', icon: 'atom' },
    { id: 'pearson-int-gcse-chemistry-4ch1', boardId: 'pearson', qualId: 'pearson-int-gcse', branchId: 'pearson-int-gcse-current', subjectName: 'Chemistry', subjectCode: '4CH1', versionTag: 'Current', slug: 'chemistry-4ch1', sortKey: 'chemistry', description: 'International GCSE Chemistry', icon: 'flask-conical' },
    { id: 'pearson-int-gcse-biology-4bi1', boardId: 'pearson', qualId: 'pearson-int-gcse', branchId: 'pearson-int-gcse-current', subjectName: 'Biology', subjectCode: '4BI1', versionTag: 'Current', slug: 'biology-4bi1', sortKey: 'biology', description: 'International GCSE Biology', icon: 'leaf' },
    { id: 'pearson-int-gcse-english-4ea1', boardId: 'pearson', qualId: 'pearson-int-gcse', branchId: 'pearson-int-gcse-current', subjectName: 'English Language A', subjectCode: '4EA1', versionTag: 'Current', slug: 'english-4ea1', sortKey: 'english-language-a', description: 'International GCSE English Language A', icon: 'book' },

    // Pearson International GCSE (Legacy)
    { id: 'pearson-int-gcse-math-4ma0-legacy', boardId: 'pearson', qualId: 'pearson-int-gcse', branchId: 'pearson-int-gcse-legacy', subjectName: 'Mathematics A', subjectCode: '4MA0', versionTag: 'Legacy', slug: 'mathematics-4ma0-legacy', sortKey: 'mathematics-a', description: 'International GCSE Mathematics A (Legacy)', icon: 'calculator' },
    { id: 'pearson-int-gcse-physics-4ph0-legacy', boardId: 'pearson', qualId: 'pearson-int-gcse', branchId: 'pearson-int-gcse-legacy', subjectName: 'Physics', subjectCode: '4PH0', versionTag: 'Legacy', slug: 'physics-4ph0-legacy', sortKey: 'physics', description: 'International GCSE Physics (Legacy)', icon: 'atom' },

    // IB MYP Subjects
    { id: 'ib-myp-math', boardId: 'ib', qualId: 'ib-myp', subjectName: 'Mathematics', slug: 'mathematics', sortKey: 'mathematics', description: 'MYP Mathematics', icon: 'calculator' },
    { id: 'ib-myp-sciences', boardId: 'ib', qualId: 'ib-myp', subjectName: 'Sciences', slug: 'sciences', sortKey: 'sciences', description: 'MYP Sciences', icon: 'atom' },
    { id: 'ib-myp-lang-lit', boardId: 'ib', qualId: 'ib-myp', subjectName: 'Language and Literature', slug: 'language-and-literature', sortKey: 'language-and-literature', description: 'MYP Language and Literature', icon: 'book' },
    { id: 'ib-myp-lang-acq', boardId: 'ib', qualId: 'ib-myp', subjectName: 'Language Acquisition', slug: 'language-acquisition', sortKey: 'language-acquisition', description: 'MYP Language Acquisition', icon: 'languages' },
    { id: 'ib-myp-individuals', boardId: 'ib', qualId: 'ib-myp', subjectName: 'Individuals and Societies', slug: 'individuals-and-societies', sortKey: 'individuals-and-societies', description: 'MYP Individuals and Societies', icon: 'users' },
    { id: 'ib-myp-arts', boardId: 'ib', qualId: 'ib-myp', subjectName: 'Arts', slug: 'arts', sortKey: 'arts', description: 'MYP Arts', icon: 'palette' },
    { id: 'ib-myp-design', boardId: 'ib', qualId: 'ib-myp', subjectName: 'Design', slug: 'design', sortKey: 'design', description: 'MYP Design', icon: 'pencil-ruler' },
    { id: 'ib-myp-phe', boardId: 'ib', qualId: 'ib-myp', subjectName: 'Physical and Health Education', slug: 'physical-and-health-education', sortKey: 'physical-and-health-education', description: 'MYP Physical and Health Education', icon: 'heart-pulse' },

    // IB DP Subjects (with subject groups)
    // Group 1: Studies in Language and Literature
    { id: 'ib-dp-english-a-lit', boardId: 'ib', qualId: 'ib-dp', subjectName: 'English A: Literature', slug: 'english-a-literature', sortKey: 'english-a-literature', description: 'IB DP English A: Literature', icon: 'book' },
    { id: 'ib-dp-english-a-lang-lit', boardId: 'ib', qualId: 'ib-dp', subjectName: 'English A: Language and Literature', slug: 'english-a-language-and-literature', sortKey: 'english-a-language-and-literature', description: 'IB DP English A: Language and Literature', icon: 'book-open' },

    // Group 2: Language Acquisition
    { id: 'ib-dp-french-b', boardId: 'ib', qualId: 'ib-dp', subjectName: 'French B', slug: 'french-b', sortKey: 'french-b', description: 'IB DP French B', icon: 'languages' },
    { id: 'ib-dp-spanish-b', boardId: 'ib', qualId: 'ib-dp', subjectName: 'Spanish B', slug: 'spanish-b', sortKey: 'spanish-b', description: 'IB DP Spanish B', icon: 'languages' },
    { id: 'ib-dp-mandarin-b', boardId: 'ib', qualId: 'ib-dp', subjectName: 'Mandarin B', slug: 'mandarin-b', sortKey: 'mandarin-b', description: 'IB DP Mandarin B', icon: 'languages' },

    // Group 3: Individuals and Societies
    { id: 'ib-dp-history', boardId: 'ib', qualId: 'ib-dp', subjectName: 'History', slug: 'history', sortKey: 'history', description: 'IB DP History', icon: 'landmark' },
    { id: 'ib-dp-geography', boardId: 'ib', qualId: 'ib-dp', subjectName: 'Geography', slug: 'geography', sortKey: 'geography', description: 'IB DP Geography', icon: 'globe' },
    { id: 'ib-dp-economics', boardId: 'ib', qualId: 'ib-dp', subjectName: 'Economics', slug: 'economics', sortKey: 'economics', description: 'IB DP Economics', icon: 'trending-up' },
    { id: 'ib-dp-business', boardId: 'ib', qualId: 'ib-dp', subjectName: 'Business Management', slug: 'business-management', sortKey: 'business-management', description: 'IB DP Business Management', icon: 'briefcase' },
    { id: 'ib-dp-psychology', boardId: 'ib', qualId: 'ib-dp', subjectName: 'Psychology', slug: 'psychology', sortKey: 'psychology', description: 'IB DP Psychology', icon: 'brain' },

    // Group 4: Sciences
    { id: 'ib-dp-physics', boardId: 'ib', qualId: 'ib-dp', subjectName: 'Physics', slug: 'physics', sortKey: 'physics', description: 'IB DP Physics', icon: 'atom' },
    { id: 'ib-dp-chemistry', boardId: 'ib', qualId: 'ib-dp', subjectName: 'Chemistry', slug: 'chemistry', sortKey: 'chemistry', description: 'IB DP Chemistry', icon: 'flask-conical' },
    { id: 'ib-dp-biology', boardId: 'ib', qualId: 'ib-dp', subjectName: 'Biology', slug: 'biology', sortKey: 'biology', description: 'IB DP Biology', icon: 'leaf' },
    { id: 'ib-dp-cs', boardId: 'ib', qualId: 'ib-dp', subjectName: 'Computer Science', slug: 'computer-science', sortKey: 'computer-science', description: 'IB DP Computer Science', icon: 'laptop' },
    { id: 'ib-dp-ess', boardId: 'ib', qualId: 'ib-dp', subjectName: 'Environmental Systems and Societies', slug: 'environmental-systems-and-societies', sortKey: 'environmental-systems-and-societies', description: 'IB DP Environmental Systems and Societies', icon: 'tree-deciduous' },

    // Group 5: Mathematics
    { id: 'ib-dp-math-aa', boardId: 'ib', qualId: 'ib-dp', subjectName: 'Mathematics: Analysis and Approaches', slug: 'mathematics-aa', sortKey: 'mathematics-aa', description: 'IB DP Mathematics: Analysis and Approaches', icon: 'calculator' },
    { id: 'ib-dp-math-ai', boardId: 'ib', qualId: 'ib-dp', subjectName: 'Mathematics: Applications and Interpretation', slug: 'mathematics-ai', sortKey: 'mathematics-ai', description: 'IB DP Mathematics: Applications and Interpretation', icon: 'calculator' },

    // Group 6: The Arts
    { id: 'ib-dp-visual-arts', boardId: 'ib', qualId: 'ib-dp', subjectName: 'Visual Arts', slug: 'visual-arts', sortKey: 'visual-arts', description: 'IB DP Visual Arts', icon: 'palette' },
    { id: 'ib-dp-music', boardId: 'ib', qualId: 'ib-dp', subjectName: 'Music', slug: 'music', sortKey: 'music', description: 'IB DP Music', icon: 'music' },
    { id: 'ib-dp-theatre', boardId: 'ib', qualId: 'ib-dp', subjectName: 'Theatre', slug: 'theatre', sortKey: 'theatre', description: 'IB DP Theatre', icon: 'drama' },
    { id: 'ib-dp-film', boardId: 'ib', qualId: 'ib-dp', subjectName: 'Film', slug: 'film', sortKey: 'film', description: 'IB DP Film', icon: 'video' },
];

// ============================================
// RESOURCE CATEGORIES (Fixed Order)
// ============================================

export const resourceCategories: ResourceCategory[] = [
    { resourceKey: 'past_papers', displayName: 'Past Papers', icon: 'file-text', sortOrder: 1 },
    { resourceKey: 'notes', displayName: 'Notes', icon: 'notebook', sortOrder: 2 },
    { resourceKey: 'syllabus', displayName: 'Syllabus', icon: 'list', sortOrder: 3 },
    { resourceKey: 'books', displayName: 'Books / Ebooks', icon: 'book-open', sortOrder: 4 },
    { resourceKey: 'other', displayName: 'Other Resources', icon: 'folder', sortOrder: 5 },
    { resourceKey: 'timetable', displayName: 'Timetable', icon: 'calendar', sortOrder: 6 },
];

// ============================================
// SAMPLE RESOURCE NODES (for demo)
// ============================================

export const resourceNodes: ResourceNode[] = [
    // CAIE IGCSE Mathematics Past Papers structure
    { id: 'caie-igcse-math-pp-root', subjectId: 'caie-igcse-math-0580', resourceKey: 'past_papers', title: 'Past Papers', nodeType: 'folder' },
    { id: 'caie-igcse-math-pp-2024', subjectId: 'caie-igcse-math-0580', resourceKey: 'past_papers', parentNodeId: 'caie-igcse-math-pp-root', title: '2024', nodeType: 'folder' },
    { id: 'caie-igcse-math-pp-2024-mj', subjectId: 'caie-igcse-math-0580', resourceKey: 'past_papers', parentNodeId: 'caie-igcse-math-pp-2024', title: 'May/June', nodeType: 'folder' },
    { id: 'caie-igcse-math-pp-2024-on', subjectId: 'caie-igcse-math-0580', resourceKey: 'past_papers', parentNodeId: 'caie-igcse-math-pp-2024', title: 'Oct/Nov', nodeType: 'folder' },
    { id: 'caie-igcse-math-pp-2023', subjectId: 'caie-igcse-math-0580', resourceKey: 'past_papers', parentNodeId: 'caie-igcse-math-pp-root', title: '2023', nodeType: 'folder' },
    { id: 'caie-igcse-math-pp-2023-mj', subjectId: 'caie-igcse-math-0580', resourceKey: 'past_papers', parentNodeId: 'caie-igcse-math-pp-2023', title: 'May/June', nodeType: 'folder' },
    { id: 'caie-igcse-math-pp-2023-on', subjectId: 'caie-igcse-math-0580', resourceKey: 'past_papers', parentNodeId: 'caie-igcse-math-pp-2023', title: 'Oct/Nov', nodeType: 'folder' },

    // Notes structure
    { id: 'caie-igcse-math-notes-root', subjectId: 'caie-igcse-math-0580', resourceKey: 'notes', title: 'Notes', nodeType: 'folder' },
    { id: 'caie-igcse-math-notes-ch1', subjectId: 'caie-igcse-math-0580', resourceKey: 'notes', parentNodeId: 'caie-igcse-math-notes-root', title: 'Chapter 1: Number', nodeType: 'folder' },
    { id: 'caie-igcse-math-notes-ch2', subjectId: 'caie-igcse-math-0580', resourceKey: 'notes', parentNodeId: 'caie-igcse-math-notes-root', title: 'Chapter 2: Algebra', nodeType: 'folder' },

    // CAIE AS & A Level Chemistry Books structure
    { id: 'caie-alevel-chem-books-root', subjectId: 'caie-alevel-chemistry-9701', resourceKey: 'books', title: 'Books / Ebooks', nodeType: 'folder' },
];

// ============================================
// SAMPLE FILE ASSETS (for demo)
// ============================================

export const fileAssets: FileAsset[] = [
    // 2024 May/June Papers
    { id: 'f1', subjectId: 'caie-igcse-math-0580', resourceKey: 'past_papers', nodeId: 'caie-igcse-math-pp-2024-mj', title: '0580_s24_qp_11.pdf', fileType: 'qp', year: 2024, session: 's', paper: 1, variant: 1, url: '/files/0580_s24_qp_11.pdf' },
    { id: 'f2', subjectId: 'caie-igcse-math-0580', resourceKey: 'past_papers', nodeId: 'caie-igcse-math-pp-2024-mj', title: '0580_s24_ms_11.pdf', fileType: 'ms', year: 2024, session: 's', paper: 1, variant: 1, url: '/files/0580_s24_ms_11.pdf' },
    { id: 'f3', subjectId: 'caie-igcse-math-0580', resourceKey: 'past_papers', nodeId: 'caie-igcse-math-pp-2024-mj', title: '0580_s24_qp_21.pdf', fileType: 'qp', year: 2024, session: 's', paper: 2, variant: 1, url: '/files/0580_s24_qp_21.pdf' },
    { id: 'f4', subjectId: 'caie-igcse-math-0580', resourceKey: 'past_papers', nodeId: 'caie-igcse-math-pp-2024-mj', title: '0580_s24_ms_21.pdf', fileType: 'ms', year: 2024, session: 's', paper: 2, variant: 1, url: '/files/0580_s24_ms_21.pdf' },
    { id: 'f5', subjectId: 'caie-igcse-math-0580', resourceKey: 'past_papers', nodeId: 'caie-igcse-math-pp-2024-mj', title: '0580_s24_gt.pdf', fileType: 'gt', year: 2024, session: 's', url: '/files/0580_s24_gt.pdf' },
    { id: 'f6', subjectId: 'caie-igcse-math-0580', resourceKey: 'past_papers', nodeId: 'caie-igcse-math-pp-2024-mj', title: '0580_s24_er.pdf', fileType: 'er', year: 2024, session: 's', url: '/files/0580_s24_er.pdf' },

    // Chemistry Coursebook
    {
        id: 'chem-coursebook',
        subjectId: 'caie-alevel-chemistry-9701',
        resourceKey: 'books',
        nodeId: 'caie-alevel-chem-books-root',
        title: 'Cambridge International AS and A Level Chemistry Coursebook Complete',
        fileType: 'other',
        url: '/cambridge%20international%20as%20and%20a%20level%20chemistry%20coursebook%20complete.pdf'
    },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

// Board functions
export function getBoardByKey(boardKey: string): Board | undefined {
    return boards.find(b => b.boardKey === boardKey && b.isEnabled);
}

export function getBoardById(id: string): Board | undefined {
    return boards.find(b => b.id === id && b.isEnabled);
}

export function getEnabledBoards(): Board[] {
    return boards.filter(b => b.isEnabled).sort((a, b) => a.sortOrder - b.sortOrder);
}

// Qualification functions
export function getQualificationsByBoard(boardId: string): Qualification[] {
    return qualifications.filter(q => q.boardId === boardId).sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getQualificationByKey(boardId: string, qualKey: string): Qualification | undefined {
    return qualifications.find(q => q.boardId === boardId && q.qualKey === qualKey);
}

export function getQualificationById(id: string): Qualification | undefined {
    return qualifications.find(q => q.id === id);
}

// Branch functions
export function getBranchesByQualification(qualId: string): Branch[] {
    return branches.filter(b => b.qualId === qualId);
}

export function getBranchByKey(qualId: string, branchKey: string): Branch | undefined {
    return branches.find(b => b.qualId === qualId && b.branchKey === branchKey);
}

export function getBranchById(id: string): Branch | undefined {
    return branches.find(b => b.id === id);
}

// Subject Group functions (for IB DP)
export function getSubjectGroupsByProgram(qualId: string): SubjectGroup[] {
    return subjectGroups.filter(g => g.programId === qualId).sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getSubjectGroupById(id: string): SubjectGroup | undefined {
    return subjectGroups.find(g => g.id === id);
}

// Subject functions
export function getSubjectsByQualification(qualId: string, branchId?: string): Subject[] {
    let result = subjects.filter(s => s.qualId === qualId);
    if (branchId) {
        result = result.filter(s => s.branchId === branchId);
    } else {
        // If no branch specified and qualification has branches, return empty
        const qual = getQualificationById(qualId);
        if (qual?.hasBranching) {
            result = result.filter(s => !s.branchId);
        }
    }
    return result.sort((a, b) => a.sortKey.localeCompare(b.sortKey));
}

export function getSubjectById(id: string): Subject | undefined {
    return subjects.find(s => s.id === id);
}

export function searchSubjects(query: string, filters?: { boardId?: string; qualId?: string; branchId?: string }): Subject[] {
    let result = subjects;

    if (filters?.boardId) {
        result = result.filter(s => s.boardId === filters.boardId);
    }
    if (filters?.qualId) {
        result = result.filter(s => s.qualId === filters.qualId);
    }
    if (filters?.branchId) {
        result = result.filter(s => s.branchId === filters.branchId);
    }

    if (query) {
        const lowerQuery = query.toLowerCase();
        result = result.filter(s =>
            s.subjectName.toLowerCase().includes(lowerQuery) ||
            (s.subjectCode?.toLowerCase().includes(lowerQuery)) ||
            (s.description?.toLowerCase().includes(lowerQuery))
        );
    }

    return result.sort((a, b) => a.sortKey.localeCompare(b.sortKey));
}

// Get all unique version tags for filtering
export function getVersionTags(qualId: string, branchId?: string): string[] {
    const subs = getSubjectsByQualification(qualId, branchId);
    const tags = new Set<string>();
    subs.forEach(s => {
        if (s.versionTag) tags.add(s.versionTag);
    });
    return Array.from(tags).sort();
}

// Resource functions
export function getResourceCategories(): ResourceCategory[] {
    return resourceCategories.sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getResourceCategory(resourceKey: string): ResourceCategory | undefined {
    return resourceCategories.find(r => r.resourceKey === resourceKey);
}

// Resource Node functions
export function getResourceNodesBySubject(subjectId: string, resourceKey: string): ResourceNode[] {
    return resourceNodes.filter(n => n.subjectId === subjectId && n.resourceKey === resourceKey);
}

export function getRootResourceNodes(subjectId: string, resourceKey: string): ResourceNode[] {
    return resourceNodes.filter(n => n.subjectId === subjectId && n.resourceKey === resourceKey && !n.parentNodeId);
}

export function getChildResourceNodes(parentNodeId: string): ResourceNode[] {
    return resourceNodes.filter(n => n.parentNodeId === parentNodeId);
}

export function getResourceNodeById(id: string): ResourceNode | undefined {
    return resourceNodes.find(n => n.id === id);
}

// File Asset functions
export function getFileAssetsByNode(nodeId: string): FileAsset[] {
    return fileAssets.filter(f => f.nodeId === nodeId);
}

export function getFileAssetsBySubjectAndResource(subjectId: string, resourceKey: string): FileAsset[] {
    return fileAssets.filter(f => f.subjectId === subjectId && f.resourceKey === resourceKey);
}

export function filterFileAssetsByType(assets: FileAsset[], fileType?: FileType): FileAsset[] {
    if (!fileType) return assets;
    return assets.filter(f => f.fileType === fileType);
}

// File type detection from filename
export function detectFileType(filename: string): FileType {
    const lower = filename.toLowerCase();
    if (lower.includes('_qp_') || lower.includes('_qp.')) return 'qp';
    if (lower.includes('_ms_') || lower.includes('_ms.')) return 'ms';
    if (lower.includes('_gt_') || lower.includes('_gt.')) return 'gt';
    if (lower.includes('_er_') || lower.includes('_er.')) return 'er';
    if (lower.includes('_in_') || lower.includes('_in.')) return 'in';
    if (lower.includes('_ir_') || lower.includes('_ir.')) return 'ir';
    return 'other';
}

// Get subject with full context
export function getSubjectWithContext(subjectId: string) {
    const subject = getSubjectById(subjectId);
    if (!subject) return null;

    const board = getBoardById(subject.boardId);
    const qualification = getQualificationById(subject.qualId);
    const branch = subject.branchId ? getBranchById(subject.branchId) : null;

    return {
        subject,
        board,
        qualification,
        branch,
    };
}

// Count resources for a subject (for displaying counts on cards)
export function countResourcesForSubject(subjectId: string): Record<string, number> {
    const counts: Record<string, number> = {};

    resourceCategories.forEach(cat => {
        const nodes = getResourceNodesBySubject(subjectId, cat.resourceKey);
        const files = getFileAssetsBySubjectAndResource(subjectId, cat.resourceKey);
        counts[cat.resourceKey] = nodes.length + files.length;
    });

    return counts;
}

// Check if IB DP qualification (special handling for subject groups)
export function isIBDP(qualId: string): boolean {
    return qualId === 'ib-dp';
}

// For backward compatibility - map old function names
export function getCurriculumById(id: string): Board | undefined {
    return getBoardById(id) || getBoardByKey(id);
}

export function getLevelsByCurriculum(curriculumId: string): Qualification[] {
    return getQualificationsByBoard(curriculumId);
}
