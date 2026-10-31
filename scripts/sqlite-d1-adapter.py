"""Local test adapter for the D1 prepared-statement interface; never production."""
import json
import sqlite3
import sys

request = json.load(sys.stdin)
db = sqlite3.connect(request['database'])
db.row_factory = sqlite3.Row
db.execute('PRAGMA foreign_keys=ON')
results = []
try:
    if request.get('script'):
        db.executescript(request['script'])
    else:
        with db:
            for statement in request['statements']:
                cursor = db.execute(statement['sql'], statement.get('params', []))
                rows = [dict(row) for row in cursor.fetchall()] if cursor.description else []
                results.append({'results': rows, 'meta': {'changes': max(0, cursor.rowcount)}})
    print(json.dumps({'results': results}))
except Exception as error:
    print(json.dumps({'error': str(error)}))
    sys.exit(1)
