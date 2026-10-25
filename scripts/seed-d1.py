#!/usr/bin/env python3
"""Generate a repeatable first D1 import from the existing CRCC archive."""
import json
import sqlite3
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'data/degustations.json'
SCHEMA = ROOT / 'cloudflare/schema.sql'

def compact(value):
    return json.dumps(value, ensure_ascii=False, separators=(',', ':'))

def key(path):
    if path.startswith('https://'):
        from urllib.parse import urlparse
        return urlparse(path).path.lstrip('/')
    return path

def seed(connection, data, reports_root=ROOT):
    connection.executescript(SCHEMA.read_text())
    members = {m['id']: dict(m) for m in data.get('members', [])}
    for session in sorted(data['sessions'], key=lambda s: (s['date'], s['id'])):
        for member in session['participants']:
            members[member['id']] = {**members.get(member['id'], {}), **member}
    for member in members.values():
        connection.execute('INSERT INTO members VALUES (?,?,?,?)',
                           (member['id'], member['name'], member.get('grade'), compact(member)))
    for session in data['sessions']:
        connection.execute('INSERT INTO sessions VALUES (?,?,?,?)',
                           (session['id'], session['date'], session['title'], compact(session)))
        for member in session['participants']:
            connection.execute('INSERT INTO participants VALUES (?,?,?)',
                               (session['id'], member['id'], member.get('grade')))
            if member.get('grade'):
                connection.execute('INSERT INTO grade_history VALUES (?,?,?,?)',
                                   (session['id'], member['id'], member['grade'], session['date']))
        if session.get('minutes_pdf'):
            connection.execute('INSERT INTO documents VALUES (?,?,?,?,?)',
                               (session['id'] + ':minutes', session['id'], None, 'minutes', key(session['minutes_pdf'])))
        for sheet in session['sheets']:
            score = sum(c['score'] for c in sheet['criteria'])
            connection.execute('INSERT INTO sheets VALUES (?,?,?,?,?,?,?,?,?)',
                               (sheet['id'], session['id'], sheet['member_id'], sheet['number'],
                                sheet.get('brand'), sheet.get('cigar_score'), score,
                                sheet.get('rubric_id'), compact(sheet)))
            connection.execute('INSERT INTO documents VALUES (?,?,?,?,?)',
                               (sheet['id'] + ':pdf', session['id'], sheet['id'], 'fiche', key(sheet['pdf'])))
            report = (reports_root / sheet['report']).read_text()
            connection.execute('INSERT INTO reports VALUES (?,?)', (sheet['id'], report))
    connection.commit()

def main():
    if len(sys.argv) != 2:
        raise SystemExit('Usage: python3 scripts/seed-d1.py /path/to/initial.sql')
    data = json.loads(SOURCE.read_text())
    db = sqlite3.connect(':memory:')
    seed(db, data)
    target = Path(sys.argv[1])
    target.parent.mkdir(parents=True, exist_ok=True)
    # Import in FK order. sqlite3.iterdump() sorts table names, which puts
    # documents before their sessions and cannot be replayed with D1 FKs on.
    tables = ('members', 'sessions', 'participants', 'sheets', 'reports',
              'documents', 'grade_history', 'member_grade_events', 'session_versions')
    statements = []
    for table in tables:
        columns = [row[1] for row in db.execute(f'PRAGMA table_info({table})')]
        rows = db.execute(f'SELECT * FROM {table}').fetchall()
        for row in rows:
            values = ','.join(db.execute('SELECT quote(?)', (value,)).fetchone()[0] for value in row)
            statements.append(f'INSERT INTO {table} ({",".join(columns)}) VALUES ({values});')
    target.write_text('\n'.join(statements) + '\n')
    print(f'Exported {len(data["sessions"])} sessions to {target}')

if __name__ == '__main__':
    main()
