CREATE TABLE IF NOT EXISTS exam_invites (
 id TEXT PRIMARY KEY, code_hash TEXT NOT NULL UNIQUE,
 member_id TEXT NOT NULL, member_name TEXT NOT NULL,
 created_at INTEGER NOT NULL DEFAULT (unixepoch()),
 session_hash TEXT UNIQUE, claimed_at INTEGER,
 started_at INTEGER, deadline_at INTEGER, finished_at INTEGER,
 finish_reason TEXT CHECK(finish_reason IN ('manual','timeout')),
 score_cigare INTEGER, score_club INTEGER,
 decision TEXT CHECK(decision IN ('homologue','ajourne')),
 decided_at INTEGER, revoked_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_exam_member ON exam_invites(member_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_exam_one_active ON exam_invites(member_id) WHERE revoked_at IS NULL;
CREATE TABLE IF NOT EXISTS exam_answers(
 invite_id TEXT NOT NULL REFERENCES exam_invites(id) ON DELETE CASCADE,
 question_no INTEGER NOT NULL CHECK(question_no BETWEEN 1 AND 30),
 choice INTEGER NOT NULL CHECK(choice BETWEEN 0 AND 3),
 updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
 PRIMARY KEY(invite_id, question_no)
);
CREATE TABLE IF NOT EXISTS exam_audit(
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 invite_id TEXT NOT NULL REFERENCES exam_invites(id) ON DELETE CASCADE,
 action TEXT NOT NULL, at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE TABLE IF NOT EXISTS exam_opinions(
 invite_id TEXT PRIMARY KEY REFERENCES exam_invites(id) ON DELETE CASCADE,
 opinion TEXT NOT NULL DEFAULT '',
 updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);
