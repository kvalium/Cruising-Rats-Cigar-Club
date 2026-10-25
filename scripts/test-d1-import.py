#!/usr/bin/env python3
"""Check that the first migration retains every published archive and report."""
import importlib.util
import json
import sqlite3
from pathlib import Path

root = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('seed_d1', root / 'scripts/seed-d1.py')
seed_d1 = importlib.util.module_from_spec(spec)
spec.loader.exec_module(seed_d1)
original = json.loads((root / 'data/degustations.json').read_text())
db = sqlite3.connect(':memory:')
seed_d1.seed(db, original)

sessions = {json.loads(row[0])['id']: json.loads(row[0])
            for row in db.execute('SELECT payload FROM sessions')}
assert sessions == {s['id']: s for s in original['sessions']}
assert db.execute('SELECT COUNT(*) FROM members').fetchone()[0] == 4
assert db.execute('SELECT COUNT(*) FROM sheets').fetchone()[0] == sum(len(s['sheets']) for s in original['sessions'])
for session in original['sessions']:
    assert db.execute('SELECT COUNT(*) FROM participants WHERE session_id=?', (session['id'],)).fetchone()[0] == len(session['participants'])
    for sheet in session['sheets']:
        row = db.execute('SELECT f.payload,r.html,f.committee_score FROM sheets f JOIN reports r ON r.sheet_id=f.id WHERE f.id=?', (sheet['id'],)).fetchone()
        assert json.loads(row[0]) == sheet
        assert row[1] == (root / sheet['report']).read_text()
        assert row[2] == sum(c['score'] for c in sheet['criteria'])
print('D1 import preserves all sessions, sheets, reports, participants and scores.')
