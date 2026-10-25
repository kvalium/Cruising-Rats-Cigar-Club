PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS members (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  grade TEXT,
  payload TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  title TEXT NOT NULL,
  payload TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS participants (
  session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  member_id TEXT NOT NULL REFERENCES members(id),
  historical_grade TEXT,
  PRIMARY KEY (session_id, member_id)
);

CREATE TABLE IF NOT EXISTS sheets (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  member_id TEXT NOT NULL REFERENCES members(id),
  number INTEGER NOT NULL,
  brand TEXT,
  cigar_score REAL,
  committee_score INTEGER NOT NULL,
  rubric_id TEXT,
  payload TEXT NOT NULL,
  UNIQUE (member_id, number)
);

CREATE TABLE IF NOT EXISTS reports (
  sheet_id TEXT PRIMARY KEY REFERENCES sheets(id) ON DELETE CASCADE,
  html TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  sheet_id TEXT REFERENCES sheets(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('minutes', 'fiche')),
  s3_key TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS grade_history (
  session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  member_id TEXT NOT NULL REFERENCES members(id),
  grade TEXT NOT NULL,
  observed_on TEXT NOT NULL,
  PRIMARY KEY (session_id, member_id)
);

CREATE TABLE IF NOT EXISTS session_versions (
  session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  revision INTEGER NOT NULL,
  archived_at TEXT NOT NULL,
  payload TEXT NOT NULL,
  reports TEXT NOT NULL,
  PRIMARY KEY (session_id, revision)
);

CREATE TABLE IF NOT EXISTS member_grade_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  member_id TEXT NOT NULL REFERENCES members(id),
  previous_grade TEXT,
  new_grade TEXT NOT NULL,
  changed_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(date DESC);
CREATE INDEX IF NOT EXISTS idx_sheets_member ON sheets(member_id);
CREATE INDEX IF NOT EXISTS idx_participants_member ON participants(member_id);
