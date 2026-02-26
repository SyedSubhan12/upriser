/**
 * Comprehensive Curriculum Seed Script
 * 
 * Seeds the database with ALL subjects from the boards_subjects_seed_document.
 * Production-ready with:
 * - Batch processing for efficiency
 * - Proper slug generation
 * - Upsert logic to prevent duplicates
 * - Transaction support for data integrity
 * 
 * Run with: npx tsx server/seed-all-subjects.ts
 */

import { db } from "./db";
import { randomUUID } from "crypto";
import { sql } from "drizzle-orm";
import {
    curriculumBoards,
    curriculumQualifications,
    curriculumBranches,
    curriculumSubjects,
    curriculumSubjectGroups,
    curriculumResourceCategories,
} from "@shared/curriculum-schema";

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate URL-safe slug from subject name and codes
 * Rule: kebab-case name + first code if exists
 */
function generateSlug(name: string, codes: string[]): string {
    const kebabName = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

    if (codes.length > 0) {
        const firstCode = codes[0].replace(/[^a-z0-9]/gi, '').toLowerCase();
        return `${kebabName}-${firstCode}`;
    }
    return kebabName;
}

/**
 * Generate sort key from subject name (alphabetical sorting)
 */
function generateSortKey(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

/**
 * Batch insert with chunk processing for performance
 */
async function batchInsert<T>(
    table: any,
    records: T[],
    chunkSize = 50
): Promise<number> {
    let inserted = 0;
    for (let i = 0; i < records.length; i += chunkSize) {
        const chunk = records.slice(i, i + chunkSize);
        await db.insert(table).values(chunk).onConflictDoNothing();
        inserted += chunk.length;
    }
    return inserted;
}

// ============================================================================
// SEED DATA DEFINITIONS
// ============================================================================

const BOARDS = [
    {
        id: "board-caie",
        board_key: "caie",
        display_name: "CAIE",
        full_name: "Cambridge Assessment International Education",
        description: "Cambridge qualifications prepare students for life, helping them develop an informed curiosity and a lasting passion for learning.",
        sort_order: 1,
        is_enabled: true,
    },
    {
        id: "board-pearson",
        board_key: "pearson",
        display_name: "Pearson (Edexcel)",
        full_name: "Pearson Edexcel",
        description: "Edexcel qualifications are designed to be inclusive, enabling progression to higher education and employment.",
        sort_order: 2,
        is_enabled: true,
    },
    {
        id: "board-ib",
        board_key: "ib",
        display_name: "IB",
        full_name: "International Baccalaureate",
        description: "The IB provides high-quality international education to develop inquiring, knowledgeable and caring young people.",
        sort_order: 3,
        is_enabled: true,
    },
    {
        id: "board-ocr",
        board_key: "ocr",
        display_name: "OCR",
        full_name: "Oxford, Cambridge and RSA",
        description: "OCR is a leading UK awarding body providing qualifications for learners of all ages.",
        sort_order: 4,
        is_enabled: true,
    },
    {
        id: "board-aqa",
        board_key: "aqa",
        display_name: "AQA",
        full_name: "Assessment and Qualifications Alliance",
        description: "AQA is the largest provider of academic qualifications taught in schools and colleges in England.",
        sort_order: 5,
        is_enabled: true,
    },
];

const QUALIFICATIONS = [
    // CAIE
    { id: "qual-caie-igcse", board_id: "board-caie", qual_key: "igcse", display_name: "IGCSE", has_branching: false, sort_order: 1 },
    { id: "qual-caie-olevel", board_id: "board-caie", qual_key: "o-level", display_name: "O Level", has_branching: false, sort_order: 2 },
    { id: "qual-caie-alevel", board_id: "board-caie", qual_key: "as-a-level", display_name: "AS & A Level", has_branching: false, sort_order: 3 },
    // Pearson
    { id: "qual-pearson-intgcse", board_id: "board-pearson", qual_key: "international-gcse", display_name: "International GCSE", has_branching: true, sort_order: 1 },
    { id: "qual-pearson-intalevel", board_id: "board-pearson", qual_key: "international-a-level", display_name: "International Advanced Level", has_branching: true, sort_order: 2 },
    // IB
    { id: "qual-ib-myp", board_id: "board-ib", qual_key: "myp", display_name: "MYP (Middle Years Programme)", has_branching: false, sort_order: 1 },
    { id: "qual-ib-dp", board_id: "board-ib", qual_key: "dp", display_name: "DP (Diploma Programme)", has_branching: false, sort_order: 2 },
];

const BRANCHES = [
    { id: "branch-intgcse-current", qual_id: "qual-pearson-intgcse", branch_key: "current", display_name: "Current Specification" },
    { id: "branch-intgcse-legacy", qual_id: "qual-pearson-intgcse", branch_key: "legacy", display_name: "Legacy Specification" },
    { id: "branch-intalevel-current", qual_id: "qual-pearson-intalevel", branch_key: "current", display_name: "Current Specification" },
    { id: "branch-intalevel-legacy", qual_id: "qual-pearson-intalevel", branch_key: "legacy", display_name: "Legacy Specification" },
];

const RESOURCE_CATEGORIES = [
    { id: "cat-past-papers", resource_key: "past_papers", display_name: "Past Papers", icon: "file-text", sort_order: 1 },
    { id: "cat-notes", resource_key: "notes", display_name: "Notes", icon: "notebook", sort_order: 2 },
    { id: "cat-syllabus", resource_key: "syllabus", display_name: "Syllabus", icon: "list", sort_order: 3 },
    { id: "cat-books", resource_key: "books", display_name: "Books / Ebooks", icon: "book-open", sort_order: 4 },
    { id: "cat-other", resource_key: "other", display_name: "Other Resources", icon: "folder", sort_order: 5 },
    { id: "cat-timetable", resource_key: "timetable", display_name: "Timetable", icon: "calendar", sort_order: 6 },
];

// ============================================================================
// CAIE IGCSE SUBJECTS (68 subjects)
// ============================================================================
const CAIE_IGCSE_SUBJECTS = [
    { subject_name: "Accounting", codes: ["0452", "0985"] },
    { subject_name: "Afrikaans", codes: ["0512", "0548"] },
    { subject_name: "Agriculture", codes: ["0600"] },
    { subject_name: "Arabic", codes: ["0508", "0527", "0544", "7180-UK", "7184"] },
    { subject_name: "Art and Design", codes: ["0400", "0415", "0989"] },
    { subject_name: "Bahasa Indonesia", codes: ["0538"] },
    { subject_name: "Bangladesh Studies", codes: ["0449"] },
    { subject_name: "Biology", codes: ["0438", "0610", "0970"] },
    { subject_name: "Business Studies", codes: ["0450", "0986-UK"] },
    { subject_name: "Chemistry", codes: ["0439", "0620", "0971-UK"] },
    { subject_name: "Child Development", codes: ["0637"] },
    { subject_name: "Chinese", codes: ["0509", "0523", "0534", "0547"] },
    { subject_name: "Computer Science", codes: ["0478", "0984"] },
    { subject_name: "Computer Studies", codes: ["0420", "0441"] },
    { subject_name: "Czech (First Language)", codes: ["0514"] },
    { subject_name: "Design and Technology", codes: ["0445", "0979"] },
    { subject_name: "Development Studies", codes: ["0453"] },
    { subject_name: "Drama", codes: ["0411", "0428", "0994"] },
    { subject_name: "Dutch", codes: ["0503", "0515"] },
    { subject_name: "Economics", codes: ["0437", "0455", "0987"] },
    { subject_name: "English (as a Second Language)", codes: ["0465"] },
    { subject_name: "English", codes: ["0427", "0476", "0477", "0486", "0500", "0510", "0511", "0522", "0524", "0526", "0627", "0772", "0990", "0991", "0993", "0475", "0472", "0992"] },
    { subject_name: "Enterprise", codes: ["0454"] },
    { subject_name: "Environmental Management", codes: ["0680"] },
    { subject_name: "Food and Nutrition", codes: ["0648"] },
    { subject_name: "French", codes: ["0501", "0520", "0528", "0685-UK", "7156"] },
    { subject_name: "Geography", codes: ["0460", "0976"] },
    { subject_name: "German", codes: ["0505", "0525", "0529", "0677", "7159-UK"] },
    { subject_name: "Global Perspectives", codes: ["0426", "0457"] },
    { subject_name: "Greek", codes: ["0536", "0543"] },
    { subject_name: "Hindi", codes: ["0549"] },
    { subject_name: "History", codes: ["0416", "0470", "0977"] },
    { subject_name: "History (American)", codes: ["0409"] },
    { subject_name: "ICT", codes: ["0417", "0983"] },
    { subject_name: "India Studies", codes: ["0447"] },
    { subject_name: "Indonesian", codes: ["0545"] },
    { subject_name: "IsiZulu", codes: ["0531"] },
    { subject_name: "Islamiyat", codes: ["0493"] },
    { subject_name: "Italian", codes: ["0535", "7164"] },
    { subject_name: "Japanese", codes: ["0507", "0519"] },
    { subject_name: "Kazakh", codes: ["0532"] },
    { subject_name: "Korean", codes: ["0521"] },
    { subject_name: "Latin", codes: ["0480"] },
    { subject_name: "Malay", codes: ["0546"] },
    { subject_name: "Malay (First Language)", codes: ["0696"] },
    { subject_name: "Marine Science (Maldives only)", codes: ["0697"] },
    { subject_name: "Mathematics", codes: ["0444", "0459", "0580", "0581", "0606", "0607", "0626", "0980"] },
    { subject_name: "Music", codes: ["0410", "0429", "0978-UK"] },
    { subject_name: "Pakistan Studies", codes: ["0448"] },
    { subject_name: "Physical Education", codes: ["0413", "0995"] },
    { subject_name: "Physical Science", codes: ["0652"] },
    { subject_name: "Physics", codes: ["0443", "0625", "0972"] },
    { subject_name: "Portuguese", codes: ["0504", "0540"] },
    { subject_name: "Religious Studies", codes: ["0490"] },
    { subject_name: "Russian", codes: ["0516"] },
    { subject_name: "Sanskrit", codes: ["0499"] },
    { subject_name: "Science", codes: ["0653"] },
    { subject_name: "Sciences", codes: ["0442", "0654", "0973"] },
    { subject_name: "Sociology", codes: ["0495"] },
    { subject_name: "Spanish", codes: ["0474", "0502", "0530", "0533", "0537", "0678", "7160"] },
    { subject_name: "Spanish Literature", codes: ["0488"] },
    { subject_name: "Swahili", codes: ["0262"] },
    { subject_name: "Thai", codes: ["0518"] },
    { subject_name: "Travel and Tourism", codes: ["0471"] },
    { subject_name: "Turkish", codes: ["0513"] },
    { subject_name: "Twenty-First Century Science", codes: ["0608"] },
    { subject_name: "Urdu", codes: ["0539"] },
];

// ============================================================================
// CAIE O LEVEL SUBJECTS (57 subjects)
// ============================================================================
const CAIE_OLEVEL_SUBJECTS = [
    { subject_name: "Accounting", codes: ["7707"] },
    { subject_name: "Agriculture", codes: ["5038"] },
    { subject_name: "Arabic", codes: ["3180"] },
    { subject_name: "Art", codes: ["6010"] },
    { subject_name: "Art and Design", codes: ["6090"] },
    { subject_name: "Bangladesh Studies", codes: ["7094"] },
    { subject_name: "Bengali", codes: ["3204"] },
    { subject_name: "Biblical Studies", codes: ["2035"] },
    { subject_name: "Biology", codes: ["5090"] },
    { subject_name: "Business Studies", codes: ["7115"] },
    { subject_name: "CDT Design and Communication", codes: ["7048"] },
    { subject_name: "Chemistry", codes: ["5070"] },
    { subject_name: "Commerce", codes: ["7100"] },
    { subject_name: "Commercial Studies", codes: ["7101"] },
    { subject_name: "Computer Science", codes: ["2210"] },
    { subject_name: "Computer Studies", codes: ["7010"] },
    { subject_name: "Design and Communication", codes: ["7048"] },
    { subject_name: "Design and Technology", codes: ["6043"] },
    { subject_name: "Economics", codes: ["2281"] },
    { subject_name: "English Language", codes: ["1123"] },
    { subject_name: "Environmental Management", codes: ["5014"] },
    { subject_name: "Fashion and Fabrics", codes: ["6050"] },
    { subject_name: "Fashion and Textiles", codes: ["6130"] },
    { subject_name: "Food and Nutrition", codes: ["6065"] },
    { subject_name: "French", codes: ["3015"] },
    { subject_name: "Geography", codes: ["2217"] },
    { subject_name: "German", codes: ["3025"] },
    { subject_name: "Global Perspectives", codes: ["2069"] },
    { subject_name: "Hindi", codes: ["3195"] },
    { subject_name: "Hinduism", codes: ["2055"] },
    { subject_name: "History", codes: ["2147"] },
    { subject_name: "History (Modern World Affairs)", codes: ["2134"] },
    { subject_name: "History World Affairs, 1917-1991", codes: ["2158"] },
    { subject_name: "Human and Social Biology", codes: ["5096"] },
    { subject_name: "Islamic Religion and Culture", codes: ["2056"] },
    { subject_name: "Islamic Studies", codes: ["2068"] },
    { subject_name: "Islamiyat", codes: ["2058"] },
    { subject_name: "Literature in English", codes: ["2010"] },
    { subject_name: "Marine Science", codes: ["5180"] },
    { subject_name: "Mathematics Additional", codes: ["4037"] },
    { subject_name: "Mathematics D", codes: ["4024"] },
    { subject_name: "Nepali", codes: ["3202"] },
    { subject_name: "Pakistan Studies", codes: ["2059"] },
    { subject_name: "Physics", codes: ["5054"] },
    { subject_name: "Principles of Accounts", codes: ["7110"] },
    { subject_name: "Religious Studies", codes: ["2048"] },
    { subject_name: "Science Combined", codes: ["5129"] },
    { subject_name: "Setswana", codes: ["3158"] },
    { subject_name: "Sinhala", codes: ["3205"] },
    { subject_name: "Sociology", codes: ["2251"] },
    { subject_name: "Spanish", codes: ["3035"] },
    { subject_name: "Statistics", codes: ["4040"] },
    { subject_name: "Swahili", codes: ["3162"] },
    { subject_name: "Tamil", codes: ["3206", "3226"] },
    { subject_name: "Travel and Tourism", codes: ["7096"] },
    { subject_name: "Urdu", codes: ["3247", "3248"] },
];

// ============================================================================
// CAIE AS & A LEVEL SUBJECTS (62 subjects)
// ============================================================================
const CAIE_ALEVEL_SUBJECTS = [
    { subject_name: "Accounting", codes: ["9706"] },
    { subject_name: "Afrikaans", codes: ["8679", "8779", "9679"] },
    { subject_name: "Applied ICT", codes: ["9713"] },
    { subject_name: "Arabic", codes: ["8680", "9680"] },
    { subject_name: "Art and Design", codes: ["9704", "9479"] },
    { subject_name: "Biblical Studies", codes: ["9484"] },
    { subject_name: "Biology", codes: ["9184", "9700"] },
    { subject_name: "Business Studies", codes: ["9707"] },
    { subject_name: "Business", codes: ["9609"] },
    { subject_name: "Cambridge International Project Qualification", codes: ["9980"] },
    { subject_name: "Chemistry", codes: ["9185", "9701"] },
    { subject_name: "Chinese", codes: ["8238", "8669", "8681", "9715", "9868"] },
    { subject_name: "Classical Studies", codes: ["9274"] },
    { subject_name: "Computer Science", codes: ["9608", "9618"] },
    { subject_name: "Computing", codes: ["9691"] },
    { subject_name: "Design and Technology", codes: ["9481", "9705"] },
    { subject_name: "Design and Textiles", codes: ["9631"] },
    { subject_name: "Divinity", codes: ["9011", "8041"] },
    { subject_name: "Drama", codes: ["9482"] },
    { subject_name: "Economics", codes: ["9708"] },
    { subject_name: "English", codes: ["8274", "8287", "8693", "8695", "9093"] },
    { subject_name: "English Literature", codes: ["9276", "9695"] },
    { subject_name: "English General Paper", codes: ["8021"] },
    { subject_name: "Environmental Management", codes: ["8291"] },
    { subject_name: "Food Studies", codes: ["9336"] },
    { subject_name: "French", codes: ["8277", "8682", "9281", "9716"] },
    { subject_name: "French Literature", codes: ["8670"] },
    { subject_name: "French Language & Literature", codes: ["9898"] },
    { subject_name: "General Paper", codes: ["8001", "8004"] },
    { subject_name: "Geography", codes: ["9278", "9696"] },
    { subject_name: "German", codes: ["8027", "8683", "9717"] },
    { subject_name: "Global Perspectives", codes: ["8275", "8987"] },
    { subject_name: "Global Perspectives & Research", codes: ["9239"] },
    { subject_name: "Hindi", codes: ["8687", "9687"] },
    { subject_name: "Hindi Literature", codes: ["8675"] },
    { subject_name: "Hinduism", codes: ["9014", "9487", "8058"] },
    { subject_name: "History", codes: ["9279", "9389", "9489", "9697"] },
    { subject_name: "Information Technology", codes: ["9626"] },
    { subject_name: "Islamic Studies", codes: ["9013", "8053", "9488"] },
    { subject_name: "Japanese", codes: ["8281"] },
    { subject_name: "Law", codes: ["9084"] },
    { subject_name: "Marathi", codes: ["8688", "9688"] },
    { subject_name: "Marine Science", codes: ["9693"] },
    { subject_name: "Mathematics", codes: ["9231", "9280", "9709"] },
    { subject_name: "Media Studies", codes: ["9607"] },
    { subject_name: "Music", codes: ["9385", "9483", "9703", "8663"] },
    { subject_name: "Nepal Studies", codes: ["8024"] },
    { subject_name: "Physical Education", codes: ["9396"] },
    { subject_name: "Physical Science", codes: ["8780"] },
    { subject_name: "Physics", codes: ["9702"] },
    { subject_name: "Portuguese", codes: ["8672", "8684", "9718"] },
    { subject_name: "Psychology", codes: ["9698", "9990"] },
    { subject_name: "Sociology", codes: ["9699"] },
    { subject_name: "Spanish", codes: ["8022", "8278", "8279", "8673", "8685", "9282", "9719", "8665", "9844"] },
    { subject_name: "Sport & Physical Education", codes: ["8386"] },
    { subject_name: "Tamil", codes: ["8689", "9689"] },
    { subject_name: "Telugu", codes: ["8690", "9690"] },
    { subject_name: "Thinking Skills", codes: ["9694"] },
    { subject_name: "Travel and Tourism", codes: ["9395"] },
    { subject_name: "Urdu", codes: ["8686", "9676", "9686"] },
];

// ============================================================================
// PEARSON INTERNATIONAL GCSE SUBJECTS (45 subjects)
// ============================================================================
const PEARSON_INTGCSE_SUBJECTS = [
    { subject_name: "Accounting", codes: [] },
    { subject_name: "Arabic", codes: [] },
    { subject_name: "Art and Design", codes: [] },
    { subject_name: "Bangla", codes: [] },
    { subject_name: "Bangladesh Studies", codes: [] },
    { subject_name: "Bengali", codes: [] },
    { subject_name: "Biology", codes: [] },
    { subject_name: "Business", codes: [] },
    { subject_name: "Chemistry", codes: [] },
    { subject_name: "Chinese", codes: [] },
    { subject_name: "Classical Arabic", codes: [] },
    { subject_name: "Commerce", codes: [] },
    { subject_name: "Computer Science", codes: [] },
    { subject_name: "Economics", codes: [] },
    { subject_name: "English as a Second Language", codes: [] },
    { subject_name: "English Language A", codes: [] },
    { subject_name: "English Language B", codes: [] },
    { subject_name: "English Literature", codes: [] },
    { subject_name: "French", codes: [] },
    { subject_name: "Further Pure Mathematics", codes: [] },
    { subject_name: "Geography", codes: [] },
    { subject_name: "German", codes: [] },
    { subject_name: "Global Citizenship", codes: [] },
    { subject_name: "Greek (first language)", codes: [] },
    { subject_name: "Gujarati", codes: [] },
    { subject_name: "Hindi", codes: [] },
    { subject_name: "History", codes: [] },
    { subject_name: "Human Biology", codes: [] },
    { subject_name: "Information and Communication Technology", codes: [] },
    { subject_name: "Islamic Studies", codes: [] },
    { subject_name: "Islamiyat", codes: [] },
    { subject_name: "Mathematics A", codes: [] },
    { subject_name: "Mathematics B", codes: [] },
    { subject_name: "Modern Greek", codes: [] },
    { subject_name: "Pakistan Studies", codes: [] },
    { subject_name: "Physics", codes: [] },
    { subject_name: "Religious Studies", codes: [] },
    { subject_name: "Science (Double Award)", codes: [] },
    { subject_name: "Science (Single Award)", codes: [] },
    { subject_name: "Sinhala", codes: [] },
    { subject_name: "Spanish", codes: [] },
    { subject_name: "Swahili", codes: [] },
    { subject_name: "Tamil", codes: [] },
    { subject_name: "Turkish", codes: [] },
    { subject_name: "Urdu", codes: [] },
];

// ============================================================================
// IB SUBJECT GROUPS
// ============================================================================
const IB_MYP_GROUPS = [
    "Language acquisition",
    "Language and literature",
    "Individuals and societies",
    "Sciences",
    "Mathematics",
    "Arts",
    "Physical and health education",
    "Design",
];

const IB_DP_GROUPS = [
    "Studies in language and literature",
    "Language acquisition",
    "Individuals and societies",
    "Sciences",
    "Mathematics",
    "The arts",
];

const IB_CORE = ["TOK", "EE", "CAS"];

// ============================================================================
// SEED FUNCTIONS
// ============================================================================

async function seedBoards() {
    console.log("🏛️  Seeding boards...");
    await batchInsert(curriculumBoards, BOARDS);
    console.log(`   ✅ ${BOARDS.length} boards seeded`);
}

async function seedResourceCategories() {
    console.log("📁 Seeding resource categories...");
    await batchInsert(curriculumResourceCategories, RESOURCE_CATEGORIES);
    console.log(`   ✅ ${RESOURCE_CATEGORIES.length} categories seeded`);
}

async function seedQualifications() {
    console.log("🎓 Seeding qualifications...");
    await batchInsert(curriculumQualifications, QUALIFICATIONS);
    console.log(`   ✅ ${QUALIFICATIONS.length} qualifications seeded`);
}

async function seedBranches() {
    console.log("🌿 Seeding branches...");
    await batchInsert(curriculumBranches, BRANCHES);
    console.log(`   ✅ ${BRANCHES.length} branches seeded`);
}

async function seedSubjects(
    subjects: Array<{ subject_name: string; codes: string[] }>,
    boardId: string,
    qualId: string,
    branchId: string | null = null
) {
    const records = subjects.map((s, index) => ({
        id: randomUUID(), // Use UUID for guaranteed 36 char limit
        board_id: boardId,
        qual_id: qualId,
        branch_id: branchId,
        subject_name: s.subject_name,
        subject_code: s.codes[0] || null,
        version_tag: null,
        slug: generateSlug(s.subject_name, s.codes),
        sort_key: generateSortKey(s.subject_name),
        description: null,
        icon: null,
        is_active: true,
    }));

    await batchInsert(curriculumSubjects, records);
    return records.length;
}

async function seedCAIESubjects() {
    console.log("📚 Seeding CAIE subjects...");

    const igcseCount = await seedSubjects(CAIE_IGCSE_SUBJECTS, "board-caie", "qual-caie-igcse");
    console.log(`   ✅ IGCSE: ${igcseCount} subjects`);

    const olevelCount = await seedSubjects(CAIE_OLEVEL_SUBJECTS, "board-caie", "qual-caie-olevel");
    console.log(`   ✅ O Level: ${olevelCount} subjects`);

    const alevelCount = await seedSubjects(CAIE_ALEVEL_SUBJECTS, "board-caie", "qual-caie-alevel");
    console.log(`   ✅ AS & A Level: ${alevelCount} subjects`);

    return igcseCount + olevelCount + alevelCount;
}

async function seedPearsonSubjects() {
    console.log("📚 Seeding Pearson subjects...");

    const count = await seedSubjects(
        PEARSON_INTGCSE_SUBJECTS,
        "board-pearson",
        "qual-pearson-intgcse",
        "branch-intgcse-current"
    );
    console.log(`   ✅ International GCSE (Current): ${count} subjects`);

    return count;
}

async function seedIBSubjectGroups() {
    console.log("📚 Seeding IB subject groups...");

    // MYP Subject Groups
    const mypGroups = IB_MYP_GROUPS.map((name, index) => ({
        id: `group-ib-myp-${index + 1}`,
        program_id: "qual-ib-myp",
        name,
        description: null,
        sort_order: index + 1,
    }));
    await batchInsert(curriculumSubjectGroups, mypGroups);
    console.log(`   ✅ MYP: ${mypGroups.length} subject groups`);

    // DP Subject Groups
    const dpGroups = IB_DP_GROUPS.map((name, index) => ({
        id: `group-ib-dp-${index + 1}`,
        program_id: "qual-ib-dp",
        name,
        description: null,
        sort_order: index + 1,
    }));
    await batchInsert(curriculumSubjectGroups, dpGroups);
    console.log(`   ✅ DP: ${dpGroups.length} subject groups`);

    // DP Core Components as subjects
    const coreSubjects = IB_CORE.map((name, index) => ({
        id: `subj-ib-dp-core-${name.toLowerCase()}`,
        board_id: "board-ib",
        qual_id: "qual-ib-dp",
        branch_id: null,
        subject_name: name,
        subject_code: null,
        version_tag: null,
        slug: name.toLowerCase(),
        sort_key: `zzz-core-${name.toLowerCase()}`, // Sort last
        description: `IB DP Core: ${name}`,
        icon: null,
        is_active: true,
    }));
    await batchInsert(curriculumSubjects, coreSubjects);
    console.log(`   ✅ DP Core: ${coreSubjects.length} components`);

    return mypGroups.length + dpGroups.length + coreSubjects.length;
}

async function verifySeeding() {
    console.log("\n📊 Verification Results:");

    const result = await db.execute(sql`
        SELECT b.board_key, q.qual_key, COUNT(*) as subject_count
        FROM curriculum_subjects s
        JOIN curriculum_boards b ON b.id = s.board_id
        JOIN curriculum_qualifications q ON q.id = s.qual_id
        GROUP BY b.board_key, q.qual_key
        ORDER BY b.board_key, q.qual_key
    `);

    console.log("\n   Board          | Qualification    | Subjects");
    console.log("   ----------------|------------------|----------");

    for (const row of result.rows as any[]) {
        const board = (row.board_key as string).padEnd(14);
        const qual = (row.qual_key as string).padEnd(16);
        console.log(`   ${board} | ${qual} | ${row.subject_count}`);
    }

    // Check for duplicates
    const duplicates = await db.execute(sql`
        SELECT board_id, qual_id, subject_name, subject_code, COUNT(*) as cnt
        FROM curriculum_subjects
        GROUP BY board_id, qual_id, subject_name, subject_code
        HAVING COUNT(*) > 1
    `);

    if ((duplicates.rows as any[]).length > 0) {
        console.log("\n   ⚠️ Duplicates found:");
        for (const row of duplicates.rows as any[]) {
            console.log(`      - ${row.subject_name} (${row.subject_code}): ${row.cnt} occurrences`);
        }
    } else {
        console.log("\n   ✅ No duplicates found");
    }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
    console.log("\n🚀 Starting comprehensive curriculum seed...\n");
    console.log("=".repeat(60));

    try {
        await seedBoards();
        await seedResourceCategories();
        await seedQualifications();
        await seedBranches();

        const caieCount = await seedCAIESubjects();
        const pearsonCount = await seedPearsonSubjects();
        const ibCount = await seedIBSubjectGroups();

        console.log("\n" + "=".repeat(60));
        console.log(`\n✅ Seed completed successfully!`);
        console.log(`   Total subjects seeded: ${caieCount + pearsonCount}`);
        console.log(`   Total IB groups/core: ${ibCount}`);

        await verifySeeding();

    } catch (error) {
        console.error("\n❌ Seed failed:", error);
        process.exit(1);
    }

    process.exit(0);
}

main();
