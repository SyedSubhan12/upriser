/**
 * Curriculum Seed Data Script
 * 
 * Seeds the curriculum database with:
 * - Core education boards (CAIE, Pearson, IB, etc.)
 * - Resource categories (past_papers, notes, syllabus, etc.)
 * - Example data: CAIE → IGCSE → Mathematics → Notes → file
 */

import { db } from "./db";
import { randomUUID } from "crypto";
import {
    curriculumBoards,
    curriculumQualifications,
    curriculumBranches,
    curriculumSubjects,
    curriculumSubjectGroups,
    curriculumResourceCategories,
    curriculumResourceNodes,
    curriculumFileAssets,
} from "@shared/curriculum-schema";

// ============================================================================
// SEED DATA
// ============================================================================

async function seedBoards() {
    console.log("Seeding boards...");

    const boards = [
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
        {
            id: "board-wjec",
            board_key: "wjec",
            display_name: "WJEC",
            full_name: "Welsh Joint Education Committee",
            description: "WJEC provides qualifications for schools and colleges in Wales and England.",
            sort_order: 6,
            is_enabled: false, // disabled by default
        },
        {
            id: "board-ccea",
            board_key: "ccea",
            display_name: "CCEA",
            full_name: "Council for the Curriculum, Examinations & Assessment",
            description: "CCEA is a unique organisation in Northern Ireland, providing curriculum and assessment services.",
            sort_order: 7,
            is_enabled: false, // disabled by default
        },
    ];

    await db.insert(curriculumBoards).values(boards).onConflictDoNothing();
    console.log(`Seeded ${boards.length} boards`);
}

async function seedResourceCategories() {
    console.log("Seeding resource categories...");

    const categories = [
        { id: "cat-past-papers", resource_key: "past_papers", display_name: "Past Papers", icon: "file-text", sort_order: 1 },
        { id: "cat-notes", resource_key: "notes", display_name: "Notes", icon: "notebook", sort_order: 2 },
        { id: "cat-syllabus", resource_key: "syllabus", display_name: "Syllabus", icon: "list", sort_order: 3 },
        { id: "cat-books", resource_key: "books", display_name: "Books / Ebooks", icon: "book-open", sort_order: 4 },
        { id: "cat-other", resource_key: "other", display_name: "Other Resources", icon: "folder", sort_order: 5 },
        { id: "cat-timetable", resource_key: "timetable", display_name: "Timetable", icon: "calendar", sort_order: 6 },
    ];

    await db.insert(curriculumResourceCategories).values(categories).onConflictDoNothing();
    console.log(`Seeded ${categories.length} resource categories`);
}

async function seedCAIEQualifications() {
    console.log("Seeding CAIE qualifications...");

    const qualifications = [
        { id: "qual-caie-igcse", board_id: "board-caie", qual_key: "igcse", display_name: "IGCSE", has_branching: false, sort_order: 1 },
        { id: "qual-caie-olevel", board_id: "board-caie", qual_key: "o-level", display_name: "O Level", has_branching: false, sort_order: 2 },
        { id: "qual-caie-alevel", board_id: "board-caie", qual_key: "as-a-level", display_name: "AS & A Level", has_branching: false, sort_order: 3 },
        { id: "qual-caie-preu", board_id: "board-caie", qual_key: "pre-u", display_name: "Pre-U", has_branching: false, sort_order: 4 },
    ];

    await db.insert(curriculumQualifications).values(qualifications).onConflictDoNothing();
    console.log(`Seeded ${qualifications.length} CAIE qualifications`);
}

async function seedPearsonQualifications() {
    console.log("Seeding Pearson qualifications...");

    const qualifications = [
        { id: "qual-pearson-intgcse", board_id: "board-pearson", qual_key: "international-gcse", display_name: "International GCSE", has_branching: true, sort_order: 1 },
        { id: "qual-pearson-intalevel", board_id: "board-pearson", qual_key: "international-a-level", display_name: "International Advanced Level", has_branching: true, sort_order: 2 },
        { id: "qual-pearson-gcse", board_id: "board-pearson", qual_key: "gcse", display_name: "GCSE", has_branching: true, sort_order: 3 },
    ];

    await db.insert(curriculumQualifications).values(qualifications).onConflictDoNothing();

    // Seed branches for Pearson qualifications
    const branches = [
        { id: "branch-intgcse-current", qual_id: "qual-pearson-intgcse", branch_key: "current", display_name: "Current Specification" },
        { id: "branch-intgcse-legacy", qual_id: "qual-pearson-intgcse", branch_key: "legacy", display_name: "Legacy Specification" },
        { id: "branch-intalevel-current", qual_id: "qual-pearson-intalevel", branch_key: "current", display_name: "Current Specification" },
        { id: "branch-intalevel-legacy", qual_id: "qual-pearson-intalevel", branch_key: "legacy", display_name: "Legacy Specification" },
        { id: "branch-gcse-current", qual_id: "qual-pearson-gcse", branch_key: "current", display_name: "Current Specification" },
        { id: "branch-gcse-legacy", qual_id: "qual-pearson-gcse", branch_key: "legacy", display_name: "Legacy Specification" },
    ];

    await db.insert(curriculumBranches).values(branches).onConflictDoNothing();
    console.log(`Seeded ${qualifications.length} Pearson qualifications with ${branches.length} branches`);
}

async function seedIBQualifications() {
    console.log("Seeding IB qualifications...");

    const qualifications = [
        { id: "qual-ib-myp", board_id: "board-ib", qual_key: "myp", display_name: "MYP (Middle Years Programme)", has_branching: false, sort_order: 1 },
        { id: "qual-ib-dp", board_id: "board-ib", qual_key: "dp", display_name: "DP (Diploma Programme)", has_branching: false, sort_order: 2 },
    ];

    await db.insert(curriculumQualifications).values(qualifications).onConflictDoNothing();

    // Seed IB DP subject groups
    const subjectGroups = [
        { id: "group-ib-dp-1", program_id: "qual-ib-dp", name: "Studies in Language and Literature", description: "Courses in literature, language and culture.", sort_order: 1 },
        { id: "group-ib-dp-2", program_id: "qual-ib-dp", name: "Language Acquisition", description: "Foreign language learning courses.", sort_order: 2 },
        { id: "group-ib-dp-3", program_id: "qual-ib-dp", name: "Individuals and Societies", description: "Social sciences including history, geography, economics.", sort_order: 3 },
        { id: "group-ib-dp-4", program_id: "qual-ib-dp", name: "Sciences", description: "Biology, Chemistry, Physics, Environmental Systems.", sort_order: 4 },
        { id: "group-ib-dp-5", program_id: "qual-ib-dp", name: "Mathematics", description: "Mathematics courses at various levels.", sort_order: 5 },
        { id: "group-ib-dp-6", program_id: "qual-ib-dp", name: "The Arts", description: "Visual arts, music, theatre, film, and dance.", sort_order: 6 },
    ];

    await db.insert(curriculumSubjectGroups).values(subjectGroups).onConflictDoNothing();
    console.log(`Seeded ${qualifications.length} IB qualifications with ${subjectGroups.length} subject groups`);
}

async function seedExampleSubjectAndFile() {
    console.log("Seeding example: CAIE → IGCSE → Mathematics → Notes → file...");

    // 1. Create subject
    const subjectId = "subj-caie-igcse-math-0580";
    await db.insert(curriculumSubjects).values({
        id: subjectId,
        board_id: "board-caie",
        qual_id: "qual-caie-igcse",
        subject_name: "Mathematics",
        subject_code: "0580",
        version_tag: "2024",
        slug: "mathematics-0580",
        sort_key: "mathematics",
        description: "IGCSE Mathematics (0580) - Extended and Core syllabi",
        icon: "calculator",
        is_active: true,
    }).onConflictDoNothing();
    console.log("  Created subject: IGCSE Mathematics (0580)");

    // 2. Create root folder for Notes
    const notesFolderId = "node-caie-igcse-math-notes-root";
    await db.insert(curriculumResourceNodes).values({
        id: notesFolderId,
        subject_id: subjectId,
        resource_key: "notes",
        parent_node_id: null,
        title: "Notes",
        node_type: "folder",
        sort_order: 0,
    }).onConflictDoNothing();
    console.log("  Created folder: Notes");

    // 3. Create subfolder for Chapter 1
    const chapter1FolderId = "node-caie-igcse-math-notes-ch1";
    await db.insert(curriculumResourceNodes).values({
        id: chapter1FolderId,
        subject_id: subjectId,
        resource_key: "notes",
        parent_node_id: notesFolderId,
        title: "Chapter 1: Number",
        node_type: "folder",
        sort_order: 1,
    }).onConflictDoNothing();
    console.log("  Created subfolder: Chapter 1: Number");

    // 4. Create file asset in Chapter 1
    const fileId = randomUUID();
    await db.insert(curriculumFileAssets).values({
        id: fileId,
        subject_id: subjectId,
        resource_key: "notes",
        node_id: chapter1FolderId,
        title: "Number Systems Complete Notes",
        file_name: "0580_number_systems_notes.pdf",
        mime_type: "application/pdf",
        file_size: 524288, // 512 KB
        file_type: "other",
        object_key: "curriculum/caie/igcse/0580/notes/chapter1/0580_number_systems_notes.pdf",
        url: null, // Will be generated from object_key
        is_public: true,
        download_count: 0,
    }).onConflictDoNothing();
    console.log("  Created file: Number Systems Complete Notes");

    // 5. Create Past Papers folder structure with a question paper
    const ppRootId = "node-caie-igcse-math-pp-root";
    await db.insert(curriculumResourceNodes).values({
        id: ppRootId,
        subject_id: subjectId,
        resource_key: "past_papers",
        parent_node_id: null,
        title: "Past Papers",
        node_type: "folder",
        sort_order: 0,
    }).onConflictDoNothing();

    const pp2024Id = "node-caie-igcse-math-pp-2024";
    await db.insert(curriculumResourceNodes).values({
        id: pp2024Id,
        subject_id: subjectId,
        resource_key: "past_papers",
        parent_node_id: ppRootId,
        title: "2024",
        node_type: "folder",
        sort_order: 1,
        meta: { year: 2024 },
    }).onConflictDoNothing();

    const pp2024MjId = "node-caie-igcse-math-pp-2024-mj";
    await db.insert(curriculumResourceNodes).values({
        id: pp2024MjId,
        subject_id: subjectId,
        resource_key: "past_papers",
        parent_node_id: pp2024Id,
        title: "May/June",
        node_type: "folder",
        sort_order: 1,
        meta: { year: 2024, session: "s" },
    }).onConflictDoNothing();

    // Add question paper and mark scheme
    await db.insert(curriculumFileAssets).values([
        {
            id: randomUUID(),
            subject_id: subjectId,
            resource_key: "past_papers",
            node_id: pp2024MjId,
            title: "0580/21 Question Paper",
            file_name: "0580_s24_qp_21.pdf",
            mime_type: "application/pdf",
            file_size: 1048576, // 1 MB
            file_type: "qp",
            year: 2024,
            session: "s",
            paper: 2,
            variant: 1,
            object_key: "curriculum/caie/igcse/0580/past_papers/2024/s/0580_s24_qp_21.pdf",
            is_public: true,
        },
        {
            id: randomUUID(),
            subject_id: subjectId,
            resource_key: "past_papers",
            node_id: pp2024MjId,
            title: "0580/21 Mark Scheme",
            file_name: "0580_s24_ms_21.pdf",
            mime_type: "application/pdf",
            file_size: 524288, // 512 KB
            file_type: "ms",
            year: 2024,
            session: "s",
            paper: 2,
            variant: 1,
            object_key: "curriculum/caie/igcse/0580/past_papers/2024/s/0580_s24_ms_21.pdf",
            is_public: true,
        },
    ]).onConflictDoNothing();

    console.log("  Created past papers: Question Paper + Mark Scheme for 2024 May/June");
}

// ============================================================================
// MAIN SEED FUNCTION
// ============================================================================

async function main() {
    console.log("Starting curriculum seed...\n");

    try {
        await seedBoards();
        await seedResourceCategories();
        await seedCAIEQualifications();
        await seedPearsonQualifications();
        await seedIBQualifications();
        await seedExampleSubjectAndFile();

        console.log("\n✅ Curriculum seed completed successfully!");
    } catch (error) {
        console.error("\n❌ Seed failed:", error);
        process.exit(1);
    }

    process.exit(0);
}

main();
