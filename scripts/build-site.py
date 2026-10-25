#!/usr/bin/env python3
"""Build a static Pages release from the current D1 snapshot (or local fixture)."""
import json
import os
import re
import shutil
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from urllib.request import Request, urlopen
from xml.etree import ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / 'dist'
SITE = os.environ.get('CRCC_SITE_URL', 'https://cruising-rats-cigar-club.fr').rstrip('/')
S3 = os.environ.get('CRCC_S3_BASE', '').rstrip('/')
OLD = ('https://kvalium.github.io/CRCC/',
       'https://kvalium.github.io/Cruising-Rats-Cigar-Club/')

def snapshot():
    endpoint = os.environ.get('CRCC_DATA_URL')
    if not endpoint:
        return None
    token = os.environ.get('CRCC_EXPORT_TOKEN')
    if not token:
        raise RuntimeError('CRCC_EXPORT_TOKEN is required with CRCC_DATA_URL')
    request = Request(endpoint, headers={
        'Authorization': 'Bearer ' + token,
        'User-Agent': 'CRCC-Pages-Build/1.0',
    })
    with urlopen(request, timeout=30) as response:
        return json.load(response)

def s3_url(path):
    if path.startswith('https://'):
        return path
    if not path.startswith(('documents/', 'images/')) or '..' in Path(path).parts:
        raise ValueError('Invalid asset path: ' + path)
    return S3 + '/' + path

def verify_assets(data):
    if not S3:
        return
    paths = {s3_url(s['minutes_pdf']) for s in data['sessions'] if s.get('minutes_pdf')}
    paths |= {s3_url(f['pdf']) for s in data['sessions'] for f in s['sheets']}
    paths |= {s3_url(p.relative_to(ROOT).as_posix()) for p in (ROOT / 'images').rglob('*') if p.is_file()}
    if os.environ.get('CRCC_REQUIRE_S3') == '1':
        def check(path):
            try:
                with urlopen(Request(path, method='HEAD'), timeout=15) as response:
                    if response.status != 200:
                        raise RuntimeError(f'S3 object unavailable: {path}')
            except Exception as error:
                raise RuntimeError(f'S3 object unavailable: {path}') from error
        with ThreadPoolExecutor(max_workers=8) as pool:
            list(pool.map(check, sorted(paths)))

def prepare_data(fetched):
    if fetched:
        data = {'members': fetched['members'], 'sessions': fetched['sessions']}
        reports = fetched['reports']
        for session in data['sessions']:
            for sheet in session['sheets']:
                report_path = Path(sheet['report'])
                if report_path.is_absolute() or '..' in report_path.parts or not str(report_path).startswith('data/comptes-rendus/'):
                    raise ValueError('Invalid report path')
                target = DIST / report_path
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_text(reports[sheet['id']])
    else:
        data = json.loads((DIST / 'data/degustations.json').read_text())
    verify_assets(data)
    if S3:
        for session in data['sessions']:
            if session.get('minutes_pdf'):
                session['minutes_pdf'] = s3_url(session['minutes_pdf'])
            for sheet in session['sheets']:
                sheet['pdf'] = s3_url(sheet['pdf'])
            if session.get('committee_review') and session['committee_review'].get('minutes_pdf'):
                session['committee_review']['minutes_pdf'] = s3_url(session['committee_review']['minutes_pdf'])
    (DIST / 'data/degustations.json').write_text(json.dumps(data, ensure_ascii=False))

def rewrite_public_urls():
    for path in DIST.rglob('*.html'):
        html = path.read_text()
        for prefix in OLD:
            html = html.replace(prefix, SITE + '/')
        if S3:
            html = html.replace(SITE + '/images/', S3 + '/images/')
            html = html.replace('../images/', S3 + '/images/')
            html = re.sub(r'(["\'])images/', lambda m: m.group(1) + S3 + '/images/', html)
        path.write_text(html)
    sitemap = DIST / 'sitemap.xml'
    xml = sitemap.read_text()
    for prefix in OLD:
        xml = xml.replace(prefix, SITE + '/')
    sitemap.write_text(xml)
    ET.parse(sitemap)
    (DIST / 'robots.txt').write_text(f'User-agent: *\nAllow: /\n\nSitemap: {SITE}/sitemap.xml\n')

def main():
    if DIST.exists():
        shutil.rmtree(DIST)
    DIST.mkdir()
    for directory in ('css', 'js', 'jeu', 'scripts', 'data'):
        shutil.copytree(ROOT / directory, DIST / directory)
    if not S3:
        for directory in ('images', 'documents'):
            shutil.copytree(ROOT / directory, DIST / directory)
    for path in ROOT.glob('*.html'):
        shutil.copy2(path, DIST / path.name)
    for name in ('sitemap.xml', 'robots.txt', '_headers'):
        shutil.copy2(ROOT / name, DIST / name)
    prepare_data(snapshot())
    env = {**os.environ, 'CRCC_SITE_URL': SITE + '/'}
    subprocess.run([sys.executable, 'scripts/build-degustations.py'], cwd=DIST, env=env, check=True)
    rewrite_public_urls()
    shutil.rmtree(DIST / 'scripts')
    shutil.rmtree(DIST / 'data')
    print('Static release built in dist/')

if __name__ == '__main__':
    main()
