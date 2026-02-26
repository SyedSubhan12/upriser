-- ============================================================================
-- CURRICULUM SCHEMA - Production-Grade PostgreSQL DDL
-- ============================================================================
-- 
-- This file contains the complete DDL for the curriculum management system.
-- Tables: boards, qualifications, branches, subjects, subject_groups,
--         resource_categories, resource_nodes, file_assets
--
-- Features:
-- - S3-compatible object storage (stores metadata + object keys, not BLOBs)
-- - MIME-type based file support with PapaCambridge-style filters (qp/ms/gt/er/in/ir)
-- - Folder tree structure per subject/resource category
-- - Optimized indexes for fast browsing, filtering, and search
-- - JSONB metadata for flexible filtering
-- - snake_case naming convention throughout
--
-- ============================================================================

-- ===========================================
-- ENUM TYPES
-- ===========================================

CREATE TYPE file_type_enum AS ENUM ('qp', 'ms', 'gt', 'er', 'in', 'ir', 'other');
CREATE TYPE node_type_enum AS ENUM ('folder', 'list', 'file');
CREATE TYPE session_enum AS ENUM ('m', 's', 'w'); -- March, Summer (May/June), Winter (Oct/Nov)

-- ===========================================
-- TABLE: curriculum_boards
-- Education boards (CAIE, Pearson/Edexcel, IB, OCR, AQA, WJEC, CCEA)
-- ===========================================

CREATE TABLE curriculum_boards (
    id VARCHAR(36) PRIMARY KEY,
    board_key TEXT NOT NULL UNIQUE,           -- slug: caie, pearson, ib
    display_name TEXT NOT NULL,               -- Short name: CAIE, Edexcel
    full_name TEXT NOT NULL,                  -- Full name: Cambridge Assessment...
    description TEXT,
    logo_url TEXT,                            -- S3 object key for logo
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE curriculum_boards IS 'Education boards (CAIE, Pearson/Edexcel, IB, OCR, AQA, WJEC, CCEA)';

-- Indexes
CREATE INDEX idx_curriculum_boards_enabled_sort ON curriculum_boards(is_enabled, sort_order);
CREATE INDEX idx_curriculum_boards_key ON curriculum_boards(board_key);

-- ===========================================
-- TABLE: curriculum_qualifications
-- Qualifications/programs per board (IGCSE, A Level, DP, etc.)
-- ===========================================

CREATE TABLE curriculum_qualifications (
    id VARCHAR(36) PRIMARY KEY,
    board_id VARCHAR(36) NOT NULL REFERENCES curriculum_boards(id) ON DELETE CASCADE,
    qual_key TEXT NOT NULL,                   -- slug: igcse, a-level, dp
    display_name TEXT NOT NULL,               -- IGCSE, AS & A Level, Diploma Programme
    has_branching BOOLEAN NOT NULL DEFAULT FALSE, -- true for current/legacy specs
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT uq_qualifications_board_key UNIQUE (board_id, qual_key)
);

COMMENT ON TABLE curriculum_qualifications IS 'Qualifications/programs per board (IGCSE, A Level, MYP, DP, etc.)';

-- Indexes
CREATE INDEX idx_curriculum_qualifications_board ON curriculum_qualifications(board_id);
CREATE INDEX idx_curriculum_qualifications_board_sort ON curriculum_qualifications(board_id, sort_order);

-- ===========================================
-- TABLE: curriculum_branches
-- Current/Legacy specification branches
-- ===========================================

CREATE TABLE curriculum_branches (
    id VARCHAR(36) PRIMARY KEY,
    qual_id VARCHAR(36) NOT NULL REFERENCES curriculum_qualifications(id) ON DELETE CASCADE,
    branch_key TEXT NOT NULL,                 -- current, legacy
    display_name TEXT NOT NULL,               -- Current Specification, Legacy Specification
    created_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT uq_branches_qual_key UNIQUE (qual_id, branch_key)
);

COMMENT ON TABLE curriculum_branches IS 'Current/Legacy specification branches for qualifications with version splits';

-- Indexes
CREATE INDEX idx_curriculum_branches_qual ON curriculum_branches(qual_id);

-- ===========================================
-- TABLE: curriculum_subjects
-- Subjects with codes and version tags
-- ===========================================

CREATE TABLE curriculum_subjects (
    id VARCHAR(36) PRIMARY KEY,
    board_id VARCHAR(36) NOT NULL REFERENCES curriculum_boards(id),
    qual_id VARCHAR(36) NOT NULL REFERENCES curriculum_qualifications(id),
    branch_id VARCHAR(36) REFERENCES curriculum_branches(id),
    subject_name TEXT NOT NULL,               -- Mathematics, Physics, Chemistry
    subject_code TEXT,                        -- 0580, 9709, 4MA1
    version_tag TEXT,                         -- 2024, First Teaching 2024
    slug TEXT NOT NULL,                       -- URL-friendly: mathematics-0580
    sort_key TEXT NOT NULL,                   -- Sorting: mathematics
    description TEXT,
    icon TEXT,                                -- Icon name: calculator, atom
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE curriculum_subjects IS 'Subjects with codes and version tags';

-- Indexes for navigation queries
CREATE INDEX idx_curriculum_subjects_board ON curriculum_subjects(board_id);
CREATE INDEX idx_curriculum_subjects_qual ON curriculum_subjects(qual_id);
CREATE INDEX idx_curriculum_subjects_branch ON curriculum_subjects(branch_id) WHERE branch_id IS NOT NULL;
CREATE INDEX idx_curriculum_subjects_board_qual ON curriculum_subjects(board_id, qual_id);
CREATE INDEX idx_curriculum_subjects_qual_branch ON curriculum_subjects(qual_id, branch_id) WHERE branch_id IS NOT NULL;

-- Indexes for search and filtering
CREATE INDEX idx_curriculum_subjects_slug ON curriculum_subjects(slug);
CREATE INDEX idx_curriculum_subjects_code ON curriculum_subjects(subject_code) WHERE subject_code IS NOT NULL;
CREATE INDEX idx_curriculum_subjects_name_search ON curriculum_subjects USING gin(to_tsvector('english', subject_name));
CREATE INDEX idx_curriculum_subjects_active ON curriculum_subjects(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_curriculum_subjects_sort ON curriculum_subjects(sort_key);

-- ===========================================
-- TABLE: curriculum_subject_groups
-- IB DP subject groups (6 groups)
-- ===========================================

CREATE TABLE curriculum_subject_groups (
    id VARCHAR(36) PRIMARY KEY,
    program_id VARCHAR(36) NOT NULL REFERENCES curriculum_qualifications(id),
    name TEXT NOT NULL,                       -- Studies in Language and Literature
    description TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE curriculum_subject_groups IS 'IB DP subject groups (Studies in Language, Sciences, etc.)';

-- Indexes
CREATE INDEX idx_curriculum_subject_groups_program ON curriculum_subject_groups(program_id);
CREATE INDEX idx_curriculum_subject_groups_sort ON curriculum_subject_groups(program_id, sort_order);

-- ===========================================
-- TABLE: curriculum_resource_categories
-- Resource types (past_papers, notes, syllabus, etc.)
-- ===========================================

CREATE TABLE curriculum_resource_categories (
    id VARCHAR(36) PRIMARY KEY,
    resource_key TEXT NOT NULL UNIQUE,        -- past_papers, notes, syllabus, books, other, timetable
    display_name TEXT NOT NULL,               -- Past Papers, Notes, Syllabus
    icon TEXT NOT NULL,                       -- file-text, notebook, list
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE curriculum_resource_categories IS 'Resource categories (past_papers, notes, syllabus, books, other, timetable)';

-- Indexes
CREATE INDEX idx_curriculum_resource_categories_sort ON curriculum_resource_categories(sort_order);

-- ===========================================
-- TABLE: curriculum_resource_nodes
-- Folder tree structure per subject/resource
-- ===========================================

CREATE TABLE curriculum_resource_nodes (
    id VARCHAR(36) PRIMARY KEY,
    subject_id VARCHAR(36) NOT NULL REFERENCES curriculum_subjects(id) ON DELETE CASCADE,
    resource_key TEXT NOT NULL REFERENCES curriculum_resource_categories(resource_key),
    parent_node_id VARCHAR(36) REFERENCES curriculum_resource_nodes(id) ON DELETE CASCADE,
    title TEXT NOT NULL,                      -- Folder name: 2024, May/June, Chapter 1
    node_type TEXT NOT NULL,                  -- folder, list, file
    meta JSONB,                               -- Flexible metadata: {"year": 2024, "session": "s"}
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE curriculum_resource_nodes IS 'Folder tree structure per subject/resource category';
COMMENT ON COLUMN curriculum_resource_nodes.meta IS 'Flexible JSONB metadata (year, session, topic, etc.)';

-- Indexes for folder tree navigation
CREATE INDEX idx_curriculum_resource_nodes_subject ON curriculum_resource_nodes(subject_id);
CREATE INDEX idx_curriculum_resource_nodes_subject_resource ON curriculum_resource_nodes(subject_id, resource_key);
CREATE INDEX idx_curriculum_resource_nodes_parent ON curriculum_resource_nodes(parent_node_id) WHERE parent_node_id IS NOT NULL;
CREATE INDEX idx_curriculum_resource_nodes_root ON curriculum_resource_nodes(subject_id, resource_key) WHERE parent_node_id IS NULL;

-- Index for JSONB metadata filtering
CREATE INDEX idx_curriculum_resource_nodes_meta ON curriculum_resource_nodes USING gin(meta);

-- Index for title search
CREATE INDEX idx_curriculum_resource_nodes_title_search ON curriculum_resource_nodes USING gin(to_tsvector('english', title));

-- ===========================================
-- TABLE: curriculum_file_assets
-- Uploaded files with S3 object keys and metadata
-- ===========================================

CREATE TABLE curriculum_file_assets (
    id VARCHAR(36) PRIMARY KEY,
    subject_id VARCHAR(36) NOT NULL REFERENCES curriculum_subjects(id) ON DELETE CASCADE,
    resource_key TEXT NOT NULL REFERENCES curriculum_resource_categories(resource_key),
    node_id VARCHAR(36) NOT NULL REFERENCES curriculum_resource_nodes(id) ON DELETE CASCADE,
    
    -- File metadata
    title TEXT NOT NULL,                      -- Display title: 0580/21 Question Paper
    file_name TEXT NOT NULL,                  -- Original filename: 0580_s24_qp_21.pdf
    mime_type TEXT NOT NULL,                  -- MIME type: application/pdf, image/png
    file_size INTEGER,                        -- Size in bytes
    
    -- PapaCambridge-style file type filtering
    file_type TEXT NOT NULL,                  -- qp, ms, gt, er, in, ir, other
    
    -- Past paper metadata (nullable for non-past-paper files)
    year INTEGER,                             -- 2024, 2023, etc.
    session TEXT,                             -- m (March), s (Summer), w (Winter)
    paper INTEGER,                            -- Paper number: 1, 2, 3
    variant INTEGER,                          -- Variant: 1, 2, 3
    
    -- S3 object storage
    object_key TEXT NOT NULL,                 -- S3 key: curriculum/caie/igcse/0580/...
    url TEXT,                                 -- Public URL (optional, can be generated)
    
    -- Status
    is_public BOOLEAN NOT NULL DEFAULT TRUE,
    download_count INTEGER NOT NULL DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE curriculum_file_assets IS 'Uploaded files with S3 object keys and metadata';
COMMENT ON COLUMN curriculum_file_assets.file_type IS 'File type: qp (question paper), ms (mark scheme), gt (grade threshold), er (examiner report), in (insert), ir (instructions), other';
COMMENT ON COLUMN curriculum_file_assets.session IS 'Exam session: m (March), s (May/June Summer), w (Oct/Nov Winter)';
COMMENT ON COLUMN curriculum_file_assets.object_key IS 'S3 object key for the file';

-- Indexes for file browsing
CREATE INDEX idx_curriculum_file_assets_node ON curriculum_file_assets(node_id);
CREATE INDEX idx_curriculum_file_assets_subject ON curriculum_file_assets(subject_id);
CREATE INDEX idx_curriculum_file_assets_subject_resource ON curriculum_file_assets(subject_id, resource_key);

-- Indexes for file type filtering
CREATE INDEX idx_curriculum_file_assets_type ON curriculum_file_assets(file_type);
CREATE INDEX idx_curriculum_file_assets_subject_type ON curriculum_file_assets(subject_id, resource_key, file_type);

-- Indexes for year/session/paper filtering
CREATE INDEX idx_curriculum_file_assets_year ON curriculum_file_assets(year) WHERE year IS NOT NULL;
CREATE INDEX idx_curriculum_file_assets_session ON curriculum_file_assets(session) WHERE session IS NOT NULL;
CREATE INDEX idx_curriculum_file_assets_composite ON curriculum_file_assets(subject_id, resource_key, year, session, paper, variant);

-- Index for title search
CREATE INDEX idx_curriculum_file_assets_title_search ON curriculum_file_assets USING gin(to_tsvector('english', title));

-- Combined index for common browse query pattern
CREATE INDEX idx_curriculum_file_assets_browse ON curriculum_file_assets(subject_id, resource_key, file_type, year DESC NULLS LAST);


-- ============================================================================
-- SEED DATA
-- ============================================================================

-- ===========================================
-- Seed: Education Boards
-- ===========================================

INSERT INTO curriculum_boards (id, board_key, display_name, full_name, description, sort_order, is_enabled) VALUES
('board-caie', 'caie', 'CAIE', 'Cambridge Assessment International Education', 'Cambridge qualifications prepare students for life, helping them develop an informed curiosity and a lasting passion for learning.', 1, TRUE),
('board-pearson', 'pearson', 'Pearson (Edexcel)', 'Pearson Edexcel', 'Edexcel qualifications are designed to be inclusive, enabling progression to higher education and employment.', 2, TRUE),
('board-ib', 'ib', 'IB', 'International Baccalaureate', 'The IB provides high-quality international education to develop inquiring, knowledgeable and caring young people.', 3, TRUE),
('board-ocr', 'ocr', 'OCR', 'Oxford, Cambridge and RSA', 'OCR is a leading UK awarding body providing qualifications for learners of all ages.', 4, TRUE),
('board-aqa', 'aqa', 'AQA', 'Assessment and Qualifications Alliance', 'AQA is the largest provider of academic qualifications taught in schools and colleges in England.', 5, TRUE)
ON CONFLICT (board_key) DO NOTHING;

-- ===========================================
-- Seed: Resource Categories
-- ===========================================

INSERT INTO curriculum_resource_categories (id, resource_key, display_name, icon, sort_order) VALUES
('cat-past-papers', 'past_papers', 'Past Papers', 'file-text', 1),
('cat-notes', 'notes', 'Notes', 'notebook', 2),
('cat-syllabus', 'syllabus', 'Syllabus', 'list', 3),
('cat-books', 'books', 'Books / Ebooks', 'book-open', 4),
('cat-other', 'other', 'Other Resources', 'folder', 5),
('cat-timetable', 'timetable', 'Timetable', 'calendar', 6)
ON CONFLICT (resource_key) DO NOTHING;

-- ===========================================
-- Seed: CAIE Qualifications
-- ===========================================

INSERT INTO curriculum_qualifications (id, board_id, qual_key, display_name, has_branching, sort_order) VALUES
('qual-caie-igcse', 'board-caie', 'igcse', 'IGCSE', FALSE, 1),
('qual-caie-olevel', 'board-caie', 'o-level', 'O Level', FALSE, 2),
('qual-caie-alevel', 'board-caie', 'as-a-level', 'AS & A Level', FALSE, 3)
ON CONFLICT (board_id, qual_key) DO NOTHING;

-- ===========================================
-- Seed Example: CAIE → IGCSE → Mathematics → Notes → File
-- ===========================================

-- Subject
INSERT INTO curriculum_subjects (id, board_id, qual_id, subject_name, subject_code, version_tag, slug, sort_key, description, icon, is_active) VALUES
('subj-caie-igcse-math-0580', 'board-caie', 'qual-caie-igcse', 'Mathematics', '0580', '2024', 'mathematics-0580', 'mathematics', 'IGCSE Mathematics (0580) - Extended and Core syllabi', 'calculator', TRUE)
ON CONFLICT DO NOTHING;

-- Root folder for Notes
INSERT INTO curriculum_resource_nodes (id, subject_id, resource_key, parent_node_id, title, node_type, sort_order) VALUES
('node-notes-root', 'subj-caie-igcse-math-0580', 'notes', NULL, 'Notes', 'folder', 0)
ON CONFLICT DO NOTHING;

-- Subfolder for Chapter 1
INSERT INTO curriculum_resource_nodes (id, subject_id, resource_key, parent_node_id, title, node_type, sort_order) VALUES
('node-notes-ch1', 'subj-caie-igcse-math-0580', 'notes', 'node-notes-root', 'Chapter 1: Number', 'folder', 1)
ON CONFLICT DO NOTHING;

-- File in Chapter 1
INSERT INTO curriculum_file_assets (id, subject_id, resource_key, node_id, title, file_name, mime_type, file_size, file_type, object_key, is_public) VALUES
('file-notes-ch1-1', 'subj-caie-igcse-math-0580', 'notes', 'node-notes-ch1', 'Number Systems Complete Notes', '0580_number_systems_notes.pdf', 'application/pdf', 524288, 'other', 'curriculum/caie/igcse/0580/notes/chapter1/0580_number_systems_notes.pdf', TRUE)
ON CONFLICT DO NOTHING;

-- Past Papers folder tree
INSERT INTO curriculum_resource_nodes (id, subject_id, resource_key, parent_node_id, title, node_type, sort_order, meta) VALUES
('node-pp-root', 'subj-caie-igcse-math-0580', 'past_papers', NULL, 'Past Papers', 'folder', 0, NULL),
('node-pp-2024', 'subj-caie-igcse-math-0580', 'past_papers', 'node-pp-root', '2024', 'folder', 1, '{"year": 2024}'),
('node-pp-2024-mj', 'subj-caie-igcse-math-0580', 'past_papers', 'node-pp-2024', 'May/June', 'folder', 1, '{"year": 2024, "session": "s"}')
ON CONFLICT DO NOTHING;

-- Past paper files (Question Paper + Mark Scheme)
INSERT INTO curriculum_file_assets (id, subject_id, resource_key, node_id, title, file_name, mime_type, file_size, file_type, year, session, paper, variant, object_key, is_public) VALUES
('file-pp-2024-qp21', 'subj-caie-igcse-math-0580', 'past_papers', 'node-pp-2024-mj', '0580/21 Question Paper', '0580_s24_qp_21.pdf', 'application/pdf', 1048576, 'qp', 2024, 's', 2, 1, 'curriculum/caie/igcse/0580/past_papers/2024/s/0580_s24_qp_21.pdf', TRUE),
('file-pp-2024-ms21', 'subj-caie-igcse-math-0580', 'past_papers', 'node-pp-2024-mj', '0580/21 Mark Scheme', '0580_s24_ms_21.pdf', 'application/pdf', 524288, 'ms', 2024, 's', 2, 1, 'curriculum/caie/igcse/0580/past_papers/2024/s/0580_s24_ms_21.pdf', TRUE)
ON CONFLICT DO NOTHING;


-- ============================================================================
-- EXAMPLE QUERIES
-- ============================================================================

-- 1. Get all enabled boards sorted by sort_order
-- SELECT * FROM curriculum_boards WHERE is_enabled = TRUE ORDER BY sort_order;

-- 2. Get qualifications for a specific board
-- SELECT * FROM curriculum_qualifications WHERE board_id = 'board-caie' ORDER BY sort_order;

-- 3. Get subjects for a board/qualification
-- SELECT * FROM curriculum_subjects 
-- WHERE board_id = 'board-caie' AND qual_id = 'qual-caie-igcse' AND is_active = TRUE
-- ORDER BY sort_key;

-- 4. Get root folders for a subject's resource category
-- SELECT * FROM curriculum_resource_nodes
-- WHERE subject_id = 'subj-caie-igcse-math-0580' AND resource_key = 'past_papers' AND parent_node_id IS NULL
-- ORDER BY sort_order;

-- 5. Get child nodes of a folder
-- SELECT * FROM curriculum_resource_nodes WHERE parent_node_id = 'node-pp-2024' ORDER BY sort_order;

-- 6. Get files in a folder filtered by type
-- SELECT * FROM curriculum_file_assets
-- WHERE node_id = 'node-pp-2024-mj' AND file_type = 'qp'
-- ORDER BY year DESC, paper, variant;

-- 7. Get all question papers for a subject/year
-- SELECT * FROM curriculum_file_assets
-- WHERE subject_id = 'subj-caie-igcse-math-0580' 
--   AND resource_key = 'past_papers' 
--   AND file_type = 'qp' 
--   AND year = 2024
-- ORDER BY session, paper, variant;

-- 8. Full-text search on file titles
-- SELECT * FROM curriculum_file_assets
-- WHERE to_tsvector('english', title) @@ plainto_tsquery('english', 'question paper');

-- 9. JSONB metadata query on nodes
-- SELECT * FROM curriculum_resource_nodes
-- WHERE meta @> '{"year": 2024, "session": "s"}';
