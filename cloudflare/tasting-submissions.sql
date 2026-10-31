CREATE TABLE IF NOT EXISTS tasting_submissions (
 id TEXT PRIMARY KEY, owner_hash TEXT NOT NULL, client_id TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'draft', version INTEGER NOT NULL DEFAULT 1,
 payload TEXT NOT NULL, submitted_payload TEXT, review TEXT, feedback TEXT NOT NULL DEFAULT '',
 session_id TEXT UNIQUE, publication_marker TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, submitted_at TEXT,
 UNIQUE(owner_hash,client_id)
);
CREATE TABLE IF NOT EXISTS tasting_submission_files (
 id TEXT PRIMARY KEY, submission_id TEXT NOT NULL REFERENCES tasting_submissions(id),
 kind TEXT NOT NULL CHECK(kind IN ('sheet','minutes','photo','thumbnail')),
 member_id TEXT, slot TEXT NOT NULL, name TEXT NOT NULL, s3_key TEXT NOT NULL,
 type TEXT, bytes INTEGER, width INTEGER, height INTEGER, sha256 TEXT,
 state TEXT NOT NULL DEFAULT 'reserved', caption TEXT NOT NULL DEFAULT '', alt TEXT NOT NULL DEFAULT '',
 UNIQUE(submission_id,slot)
);
CREATE TABLE IF NOT EXISTS tasting_submission_events (
 id INTEGER PRIMARY KEY AUTOINCREMENT, submission_id TEXT NOT NULL REFERENCES tasting_submissions(id),
 event TEXT NOT NULL, details TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_tasting_submissions_status ON tasting_submissions(status,updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasting_submissions_owner ON tasting_submissions(owner_hash,updated_at DESC);
CREATE TABLE IF NOT EXISTS tasting_submission_versions (
 submission_id TEXT NOT NULL REFERENCES tasting_submissions(id), version INTEGER NOT NULL,
 payload TEXT NOT NULL, review TEXT, status TEXT NOT NULL,
 archived_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY(submission_id,version)
);
