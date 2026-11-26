-- Add the report review fields to databases created by an older schema.
ALTER TABLE reports
    ADD COLUMN IF NOT EXISTS admin_note text,
    ADD COLUMN IF NOT EXISTS resolved_at timestamptz,
    ADD COLUMN IF NOT EXISTS evidence_urls jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Allow all report states used by the admin review screen.
ALTER TABLE reports DROP CONSTRAINT IF EXISTS reports_status_check;
ALTER TABLE reports
    ADD CONSTRAINT reports_status_check
    CHECK (status IN ('open', 'reviewing', 'resolved', 'dismissed')) NOT VALID;
