-- ============================================================================
-- CURRICULUM SCHEMA INDEXES MIGRATION
-- Production-grade indexes for fast browsing, filtering, and search
-- ============================================================================

-- ===========================================
-- INDEXES FOR boards TABLE
-- ===========================================
CREATE INDEX IF NOT EXISTS idx_boards_enabled_sort ON boards(is_enabled, sort_order);
CREATE INDEX IF NOT EXISTS idx_boards_board_key ON boards(board_key);

-- ===========================================
-- INDEXES FOR qualifications TABLE
-- ===========================================
CREATE INDEX IF NOT EXISTS idx_qualifications_board ON qualifications(board_id);
CREATE INDEX IF NOT EXISTS idx_qualifications_board_sort ON qualifications(board_id, sort_order);
CREATE UNIQUE INDEX IF NOT EXISTS idx_qualifications_board_key ON qualifications(board_id, qual_key);

-- ===========================================
-- INDEXES FOR branches TABLE
-- ===========================================
CREATE INDEX IF NOT EXISTS idx_branches_qual ON branches(qual_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_branches_qual_key ON branches(qual_id, branch_key);

-- ===========================================
-- INDEXES FOR subjects TABLE
-- ===========================================
-- Primary navigation queries
CREATE INDEX IF NOT EXISTS idx_subjects_board ON subjects(board_id);
CREATE INDEX IF NOT EXISTS idx_subjects_qual ON subjects(qual_id);
CREATE INDEX IF NOT EXISTS idx_subjects_branch ON subjects(branch_id) WHERE branch_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_subjects_board_qual ON subjects(board_id, qual_id);
CREATE INDEX IF NOT EXISTS idx_subjects_qual_branch ON subjects(qual_id, branch_id) WHERE branch_id IS NOT NULL;

-- Search and filtering
CREATE INDEX IF NOT EXISTS idx_subjects_slug ON subjects(slug);
CREATE INDEX IF NOT EXISTS idx_subjects_code ON subjects(subject_code) WHERE subject_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_subjects_name_search ON subjects USING gin(to_tsvector('english', subject_name));
CREATE INDEX IF NOT EXISTS idx_subjects_active ON subjects(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_subjects_sort ON subjects(sort_key);

-- ===========================================
-- INDEXES FOR subject_groups TABLE (IB DP)
-- ===========================================
CREATE INDEX IF NOT EXISTS idx_subject_groups_program ON subject_groups(program_id);
CREATE INDEX IF NOT EXISTS idx_subject_groups_sort ON subject_groups(program_id, sort_order);

-- ===========================================
-- INDEXES FOR resource_categories TABLE
-- ===========================================
CREATE INDEX IF NOT EXISTS idx_resource_categories_sort ON resource_categories(sort_order);

-- ===========================================
-- INDEXES FOR resource_nodes TABLE
-- ===========================================
-- Folder tree navigation
CREATE INDEX IF NOT EXISTS idx_resource_nodes_subject ON resource_nodes(subject_id);
CREATE INDEX IF NOT EXISTS idx_resource_nodes_subject_category ON resource_nodes(subject_id, resource_key);
CREATE INDEX IF NOT EXISTS idx_resource_nodes_parent ON resource_nodes(parent_node_id) WHERE parent_node_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_resource_nodes_root ON resource_nodes(subject_id, resource_key) WHERE parent_node_id IS NULL;

-- Metadata filtering via JSONB
CREATE INDEX IF NOT EXISTS idx_resource_nodes_meta ON resource_nodes USING gin(meta);

-- Title search
CREATE INDEX IF NOT EXISTS idx_resource_nodes_title_search ON resource_nodes USING gin(to_tsvector('english', title));

-- ===========================================
-- INDEXES FOR file_assets TABLE
-- ===========================================
-- Primary file browsing queries
CREATE INDEX IF NOT EXISTS idx_file_assets_node ON file_assets(node_id);
CREATE INDEX IF NOT EXISTS idx_file_assets_subject ON file_assets(subject_id);
CREATE INDEX IF NOT EXISTS idx_file_assets_subject_resource ON file_assets(subject_id, resource_key);

-- File type filtering (qp, ms, gt, er, in, ir, other)
CREATE INDEX IF NOT EXISTS idx_file_assets_type ON file_assets(file_type);
CREATE INDEX IF NOT EXISTS idx_file_assets_subject_type ON file_assets(subject_id, resource_key, file_type);

-- Year/Session/Paper/Variant filtering for past papers
CREATE INDEX IF NOT EXISTS idx_file_assets_year ON file_assets(year) WHERE year IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_file_assets_session ON file_assets(session) WHERE session IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_file_assets_paper ON file_assets(paper) WHERE paper IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_file_assets_composite ON file_assets(subject_id, resource_key, year, session, paper, variant);

-- Title search
CREATE INDEX IF NOT EXISTS idx_file_assets_title_search ON file_assets USING gin(to_tsvector('english', title));

-- Combined filtering index for common query pattern
CREATE INDEX IF NOT EXISTS idx_file_assets_browse ON file_assets(subject_id, resource_key, file_type, year DESC NULLS LAST);

-- ===========================================
-- COMMENTS FOR DOCUMENTATION
-- ===========================================
COMMENT ON TABLE boards IS 'Education boards (CAIE, Pearson/Edexcel, IB, OCR, AQA, WJEC, CCEA)';
COMMENT ON TABLE qualifications IS 'Qualifications/programs per board (IGCSE, A Level, MYP, DP, etc.)';
COMMENT ON TABLE branches IS 'Current/Legacy specification branches for qualifications with version splits';
COMMENT ON TABLE subjects IS 'Subjects with codes and version tags';
COMMENT ON TABLE subject_groups IS 'IB DP subject groups (Studies in Language, Sciences, etc.)';
COMMENT ON TABLE resource_categories IS 'Resource categories (past_papers, notes, syllabus, books, other, timetable)';
COMMENT ON TABLE resource_nodes IS 'Folder tree structure per subject/resource category';
COMMENT ON TABLE file_assets IS 'Uploaded files with S3 object keys and metadata';

COMMENT ON COLUMN file_assets.file_type IS 'File type: qp (question paper), ms (mark scheme), gt (grade threshold), er (examiner report), in (insert), ir (instructions), other';
COMMENT ON COLUMN file_assets.session IS 'Exam session: m (March), s (May/June Summer), w (Oct/Nov Winter)';
COMMENT ON COLUMN file_assets.url IS 'S3 object key or public URL for the file';
