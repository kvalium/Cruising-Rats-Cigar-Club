#!/usr/bin/env python3
"""Fail the Pages build when rendered CRCC pages contain broken local links or identifying names."""
import re
import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit
from xml.etree import ElementTree as ET

root = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else Path('dist').resolve()

class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.references = []
        self.visible = []
        self.has_h1 = False
        self.has_title = False
        self.has_canonical = False
    def handle_starttag(self, tag, attrs):
        data = dict(attrs)
        for key in ('href', 'src'):
            if data.get(key):
                self.references.append(data[key])
        if tag == 'h1':
            self.has_h1 = True
        if tag == 'title':
            self.has_title = True
        if tag == 'link' and data.get('rel') == 'canonical':
            self.has_canonical = True
    def handle_data(self, data):
        self.visible.append(data)

errors = []
pages = list(root.rglob('*.html'))
if len(pages) < 75:
    errors.append(f'Only {len(pages)} HTML pages: expected at least 75')
for page in pages:
    html = page.read_text(encoding='utf-8')
    p = Page()
    p.feed(html)
    rel = page.relative_to(root).as_posix()
    if not p.has_title or not p.has_h1:
        errors.append(f'Missing title or H1: {rel}')
    if not p.has_canonical:
        errors.append(f'Missing canonical: {rel}')
    for href in p.references:
        u = urlsplit(href)
        if u.scheme or u.netloc or not u.path or href.startswith('//'):
            continue
        target = (page.parent / unquote(u.path)).resolve() if not u.path.startswith('/') else (root / unquote(u.path).lstrip('/')).resolve()
        if not target.is_relative_to(root):
            errors.append(f'Unsafe path: {rel} -> {href}')
            continue
        if target.is_dir():
            target /= 'index.html'
        if not target.is_file():
            errors.append(f'Broken local link: {rel} -> {href}')
    if rel.startswith('fiches-degustation/'):
        errors.append('Private archive included in public release: ' + rel)
    if any('/fiches-degustation/' in ref or ref.startswith('fiches-degustation/') for ref in p.references):
        errors.append('Public link to private archive: ' + rel)

tree = ET.parse(root / 'sitemap.xml')
urlset = {n.text for n in tree.iter() if n.tag.endswith('loc') and n.text}
if any('/fiches-degustation/' in u for u in urlset):
    errors.append('Private archive listed in sitemap')
if not any('/fondateurs' in u for u in urlset):
    errors.append('Founders page missing from sitemap')
if len([u for u in urlset if '/actualites/' in u]) != 65:
    errors.append('Expected 65 individual news URLs in sitemap')
faq = root / 'faq.html'
if 'rel="canonical"' not in faq.read_text(encoding='utf-8'):
    errors.append('FAQ missing canonical')
if errors:
    print('CRCC site audit failed:')
    for error in errors[:50]:
        print(' - ' + error)
    sys.exit(1)
print(f'CRCC site audit passed: {len(pages)} pages, {len(urlset)} sitemap URLs; archive removal and links checked.')
