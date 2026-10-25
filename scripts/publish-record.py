#!/usr/bin/env python3
"""Submit one agent-reviewed session or member to the private publication Worker."""
import importlib.util
import json
import os
import sys
from pathlib import Path
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]

def send(resource, value):
    base = os.environ.get('CRCC_PUBLISH_URL', '').rstrip('/')
    token = os.environ.get('CRCC_PUBLISH_TOKEN')
    if not base or not token or not base.startswith('https://'):
        raise SystemExit('Set CRCC_PUBLISH_URL (HTTPS) and CRCC_PUBLISH_TOKEN in your environment')
    request = Request(base + resource, data=json.dumps(value, ensure_ascii=False).encode(), method='PUT',
                      headers={'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json'})
    with urlopen(request, timeout=30) as response:
        print(response.read().decode())

def main():
    if len(sys.argv) != 3 or sys.argv[1] not in ('session', 'member'):
        raise SystemExit('Usage: python3 scripts/publish-record.py session|member <id>')
    kind, identifier = sys.argv[1:]
    data = json.loads((ROOT / 'data/degustations.json').read_text())
    if kind == 'member':
        member = next((m for m in data['members'] if m['id'] == identifier), None)
        if member is None:
            raise SystemExit('Unknown member')
        send('/internal/members/' + identifier, member)
        return
    spec = importlib.util.spec_from_file_location('archive_builder', ROOT / 'scripts/build-degustations.py')
    builder = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(builder)
    builder.validate(data)
    session = next((s for s in data['sessions'] if s['id'] == identifier), None)
    if session is None:
        raise SystemExit('Unknown session')
    reports = {f['id']: (ROOT / f['report']).read_text() for f in session['sheets']}
    send('/internal/sessions/' + identifier, {'session': session, 'reports': reports})

if __name__ == '__main__':
    main()
