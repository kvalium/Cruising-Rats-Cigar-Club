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
S3_ORIGIN = 'https://cruising-rats-cigar-club.s3.eu-west-3.amazonaws.com'
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
                origin_path = S3_ORIGIN + path[len(S3):] if path.startswith(S3 + '/') else path
                with urlopen(Request(origin_path, method='HEAD'), timeout=15) as response:
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

def canonical_public_url(url):
    """Cloudflare Pages redirects extensionful HTML URLs to clean URLs."""
    if not url.startswith(SITE + '/'):
        return url
    if url.endswith('/index.html'):
        return url[:-10]
    if url.endswith('.html'):
        return url[:-5]
    return url

def rewrite_public_urls():
    for path in DIST.rglob('*.html'):
        html = path.read_text()
        for prefix in OLD:
            html = html.replace(prefix, SITE + '/')
        for selector in ('<link rel="canonical" href="', '<meta property="og:url" content="'):
            html = re.sub(re.escape(selector) + r'([^"]+)',
                lambda m: selector + canonical_public_url(m.group(1)), html)
        if S3:
            html = html.replace(SITE + '/images/', S3 + '/images/')
            html = html.replace('../images/', S3 + '/images/')
            html = re.sub(r'(["\'])images/', lambda m: m.group(1) + S3 + '/images/', html)
        path.write_text(html)
    sitemap = DIST / 'sitemap.xml'
    xml = sitemap.read_text()
    for prefix in OLD:
        xml = xml.replace(prefix, SITE + '/')
    xml = re.sub(r'<loc>([^<]+)</loc>',
                 lambda m: '<loc>' + canonical_public_url(m.group(1)) + '</loc>', xml)
    sitemap.write_text(xml)
    ET.parse(sitemap)
    (DIST / 'robots.txt').write_text(f'User-agent: *\nAllow: /\n\nSitemap: {SITE}/sitemap.xml\n')

def enrich_news_pages():
    """Publish full-length satirical editorial articles in the original CRCC style."""
    from html import escape
    entries = json.loads((ROOT / 'data' / 'news-seo.json').read_text(encoding='utf-8'))
    if len(entries) != 65:
        raise RuntimeError('Expected exactly 65 news articles')

    related_targets = {entry['file'] for entry in entries}
    for entry in entries:
        name = entry['file']
        path = DIST / 'actualites' / name
        if not path.is_file() or entry.get('related') not in related_targets:
            raise RuntimeError('Missing article or related page: ' + name)

        paragraphs = entry['paragraphs']
        if len(paragraphs) != 5:
            raise RuntimeError('Each news article must contain exactly five paragraphs: ' + name)
        def count_words(paragraph):
            return len(re.findall(r"[\wÀ-ÿ]+(?:['’\-][\wÀ-ÿ]+)*", re.sub(r'<[^>]+>', ' ', paragraph)))
        total = sum(count_words(p) for p in paragraphs)
        if not 200 <= total <= 350:
            raise RuntimeError(f'Article word count {total} outside 200–350: {name}')

        raw = path.read_text(encoding='utf-8')
        match = re.search(
            r'(?s)<main><article><div class="news-date">(.+?)</div>'
            r'<h2>(.+?)</h2>(<img class="hero-image"[^>]+>)'
            r'(.*?)<p><a href="../actualites.html">← Retour à toutes les actualités du CRCC</a></p></article></main>',
            raw
        )
        if match is None:
            raise RuntimeError('Unexpected source HTML in ' + name)
        date, title, img, original_text = match.groups()
        source_paragraphs = re.findall(r'(?s)<p>(.*?)</p>', original_text)
        if source_paragraphs != paragraphs[:2]:
            raise RuntimeError('Original bulletin paragraphs changed: ' + name)

        # Avoid altering global CSS. Only individual news pages load the new stylesheet.
        raw = raw.replace('</head>', '<link rel="stylesheet" href="../css/news-article.css"></head>', 1)
        raw = raw.replace('<body>', '<body class="news-article-page">', 1)
        raw = raw.replace('<h1 class="site-title">Bulletin officiel du Club</h1>',
                          '<div class="site-title">Bulletin officiel du Club</div>', 1)

        # An image of 460x330 is shown at up to 340 CSS pixels on desktop.
        img = img.replace('style="height:auto;aspect-ratio:460/330"', '')
        img = img.replace('class="hero-image"', 'class="news-feature-image"')
        body_html = ''.join('<p>' + p + '</p>' for p in paragraphs[2:])
        intro_html = ''.join('<p>' + p + '</p>' for p in paragraphs[:2])
        related_href = escape(entry['related'], quote=True)
        related_title = escape(entry['relatedTitle'])
        doc = (
            '<main class="news-main"><article class="news-feature">'
            f'<header class="news-feature-header"><div class="news-date">{date}</div>'
            f'<h1 class="news-feature-title">{title}</h1>'
            '<p class="news-feature-kicker">BULLETIN OFFICIEL · ANALYSE &amp; OBSERVATIONS</p>'
            '</header>'
            '<div class="news-feature-intro">'
            f'<figure class="news-feature-figure">{img}'
            '<figcaption>Pièce iconographique jointe au dossier.</figcaption></figure>'
            f'<div class="news-feature-opening">{intro_html}</div></div>'
            f'<div class="news-feature-body">{body_html}</div>'
            '<aside class="news-feature-related" aria-label="Lectures associées">'
            '<h2>Dans les archives du Club</h2><ul>'
            '<li><a href="../degustation.html">Comprendre les étapes d’une dégustation</a></li>'
            f'<li><a href="{related_href}">{related_title}</a></li>'
            '</ul></aside>'
            '<nav class="news-feature-back" aria-label="Retour aux actualités">'
            '<a href="../actualites.html">← Toutes les actualités du CRCC</a></nav>'
            '</article></main>'
        )
        raw = raw.replace(match.group(0), doc, 1)
        raw = raw.replace('</footer>', '<br><a href="../fiches-degustation/" rel="nofollow">ACCÈS MEMBRES</a></footer>', 1)
        # Existing JSON-LD datePublished retains the original publication date.
        raw = re.sub(r'"dateModified":"[^"]+"', '"dateModified":"2026-10-25"', raw, count=1)
        path.write_text(raw, encoding='utf-8')

def main():
    if DIST.exists():
        shutil.rmtree(DIST)
    DIST.mkdir()
    for directory in ('css', 'js', 'jeu', 'scripts', 'data', 'news-thumbs', 'actualites'):
        shutil.copytree(ROOT / directory, DIST / directory)
    if not S3:
        for directory in ('images', 'documents'):
            shutil.copytree(ROOT / directory, DIST / directory)
    for path in ROOT.glob('*.html'):
        shutil.copy2(path, DIST / path.name)
    for name in ('sitemap.xml', 'robots.txt', '_headers', 'llms.txt'):
        shutil.copy2(ROOT / name, DIST / name)
    # Rebuild tasting archives behind the shared-password Cloudflare middleware.
    prepare_data(snapshot())
    protected_docs = DIST / 'fiches-degustation-docs'
    protected_docs.mkdir()
    shutil.copytree(ROOT / 'documents', protected_docs / 'documents')
    tasting_data = DIST / 'data' / 'degustations.json'
    payload = json.loads(tasting_data.read_text())
    for session in payload['sessions']:
        def private_doc_path(path):
            if '/documents/' in path:
                return 'fiches-degustation-docs/documents/' + path.split('/documents/', 1)[1]
            return 'fiches-degustation-docs/documents/' + path.removeprefix('documents/')
        if session.get('minutes_pdf'):
            session['minutes_pdf'] = private_doc_path(session['minutes_pdf'])
        for sheet in session['sheets']:
            sheet['pdf'] = private_doc_path(sheet['pdf'])
        if session.get('committee_review') and session['committee_review'].get('minutes_pdf'):
            session['committee_review']['minutes_pdf'] = session['minutes_pdf']
    tasting_data.write_text(json.dumps(payload,ensure_ascii=False))
    env = {**os.environ, 'CRCC_SITE_URL': SITE + '/'}
    subprocess.run([sys.executable, 'scripts/build-degustations.py'], cwd=DIST, env=env, check=True)
    # Private, unlinked Committee correspondence office.
    shutil.copy2(ROOT / 'fiches-degustation' / 'bureau-correspondances.html', DIST / 'fiches-degustation' / 'bureau-correspondances.html')
    sitemap = DIST / 'sitemap.xml'
    sitemap.write_text(re.sub(r'\s*<url><loc>[^<]*/fiches-degustation/[^<]*</loc>.*?</url>', '', sitemap.read_text(), flags=re.S))
    for page in (DIST / 'fiches-degustation').glob('*.html'):
        html = page.read_text()
        page.write_text(html.replace('</head>', '<meta name="robots" content="noindex,nofollow"></head>', 1))
    rewrite_public_urls()
    enrich_news_pages()
    shutil.rmtree(DIST / 'scripts')
    shutil.rmtree(DIST / 'data')
    subprocess.run([sys.executable, str(ROOT / 'scripts/check-site.py'), str(DIST)], cwd=ROOT, check=True)
    print('Static release built and verified in dist/')

if __name__ == '__main__':
    main()
