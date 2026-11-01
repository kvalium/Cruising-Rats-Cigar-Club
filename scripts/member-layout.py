"""Shared, build-time navigation for the protected member area."""
import re
from html import escape, unescape

MENU=(('index.html','Accueil'),('degustations.html','Dégustations'),
      ('registre-membres.html','Membres'),('bureaux-commissions.html','Bureaux & Commissions'))

def section_for(path):
    if path=='index.html':
        return 'index.html'
    if path=='registre-membres.html' or path.startswith('membre-'):
        return 'registre-membres.html'
    if path in ('degustations.html','soumettre-degustation.html') or path.startswith(('seance-','fiche-')):
        return 'degustations.html'
    return 'bureaux-commissions.html'

def navigation(path):
    active=section_for(path)
    return '<nav class="site-nav member-nav" aria-label="Navigation de l’espace membres">'+''.join(
        '<a href="'+href+'"'+(' aria-current="page"' if href==active else '')+'>'+escape(label)+'</a>'
        for href,label in MENU)+'</nav>'

def header(title,reference='SERVICE DES ARCHIVES ORGANOLEPTIQUES'):
    return ('<header class="site-header member-header">'
            '<a class="member-logo" href="../index.html" aria-label="Retour au site principal du CRCC">'
            '<img class="logo" src="https://assets.cruising-rats-cigar-club.fr/images/crcc-logo-header-155.webp" '
            'alt="Logo du Cruising Rats Cigar Club" width="100" height="100">'
            '<span>← Site du Club</span></a><div class="member-heading">'
            '<div class="kicker">CRUISING RATS CIGAR CLUB · ESPACE MEMBRES</div>'
            '<h1 class="site-title">'+escape(title)+'</h1>'
            '<div class="reference">'+escape(reference)+'</div></div></header>')

def normalize(html,path):
    """Apply the same shell to generated archives and the independent offices."""
    head=re.search(r'<header\b[^>]*class="[^"]*site-header[^"]*"[^>]*>[\s\S]*?</header>',html)
    if not head:
        raise ValueError('Missing member header: '+path)
    title=re.search(r'<h1\b[^>]*class="[^"]*site-title[^"]*"[^>]*>([\s\S]*?)</h1>',head.group())
    if not title:
        raise ValueError('Missing member page title: '+path)
    clean=lambda value:unescape(re.sub(r'<[^>]*>','',value)).strip()
    reference=re.search(r'<div class="reference">([\s\S]*?)</div>',head.group())
    html=html[:head.start()]+header(clean(title.group(1)),clean(reference.group(1)) if reference else 'ESPACE MEMBRES DU CRCC')+html[head.end():]
    html,count=re.subn(r'<nav\b[^>]*class="[^"]*(?:site-nav|office-subnav)[^"]*"[^>]*>[\s\S]*?</nav>',navigation(path),html,count=1)
    if count!=1:
        raise ValueError('Missing member navigation: '+path)
    if '../css/member-area.css' not in html:
        html=html.replace('</head>','<link rel="stylesheet" href="../css/member-area.css"></head>',1)
    def body_class(match):
        tag=match.group()
        classes=re.search(r'class="([^"]*)"',tag)
        if classes:
            if 'member-area' not in classes.group(1).split():
                tag=tag.replace(classes.group(), 'class="'+classes.group(1)+' member-area"',1)
        else:
            tag=tag[:-1]+' class="member-area">'
        return tag
    html=re.sub(r'<body\b[^>]*>',body_class,html,count=1)
    main=re.search(r'<main\b[^>]*>',html)
    if main:
        ident=re.search(r'id="([^"]+)"',main.group())
        target=ident.group(1) if ident else 'member-main'
        if not ident:
            html=html[:main.start()]+main.group()[:-1]+' id="member-main">'+html[main.end():]
        if 'class="member-skip-link"' not in html:
            html=re.sub(r'(<body\b[^>]*>)',lambda m:m.group(1)+'<a class="member-skip-link" href="#'+escape(target,quote=True)+'">Aller au contenu</a>',html,count=1)
    return html

def normalize_directory(directory):
    for path in directory.glob('*.html'):
        original=path.read_text()
        updated=normalize(original,path.name)
        if updated!=original:
            path.write_text(updated)
