#!/usr/bin/env python3
"""Render the fictional clothing collection and its individual product pages."""
import json
import re
import sys
from html import escape
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
GROUPS = [('hommes', 'Hommes', 'Louis prend la pose. Le dossier reste ouvert.'),
          ('femmes', 'Femmes', 'Pipa conserve toute autorité sur le vestiaire.'),
          ('enfants', 'Enfants', 'Petit format. Grandes exigences.')]


def image(product, prefix='', side='left', lazy=True):
    model = product['model']
    label = ('Vue portée par ' + model if model in ('Pipa', 'Louis')
             else 'Vue portée sur un mannequin junior de catalogue' if model == 'junior'
             else 'Seconde vue du vêtement seul') if side == 'right' else 'Vêtement seul'
    return (f'<div class="garment-crop garment-{side}"><img '
            f'src="{prefix}boutique-media/{product["slug"]}.webp" '
            f'alt="{escape(product["title"])} — {escape(label.lower())}, coloris {escape(product["colour"])}" '
            'width="1536" height="1024" decoding="async" '
            + ('loading="lazy"' if lazy else 'fetchpriority="high"') + '></div>')


def card(p, prefix=''):
    target = f'{prefix}boutique-articles/{p["slug"]}.html'
    return (f'<article class="boutique-product" data-universe="{escape(p["universe"], quote=True)}">'
            f'<a class="garment-link" href="{target}" aria-label="Voir {escape(p["title"],quote=True)}">'
            + image(p, prefix) + '</a><div class="boutique-product-copy">'
            f'<div class="boutique-ref">{p["id"]} · {escape(p["universe"])}</div>'
            f'<h3><a href="{target}">{escape(p["title"])}</a></h3>'
            f'<p class="boutique-colour">{escape(p["colour"])} · {escape(p["fabric"])}</p>'
            f'<blockquote>« {escape(p["caption"])} »</blockquote>'
            f'<a class="boutique-detail-link" href="{target}">Voir la pièce et ses visuels →</a>'
            '</div></article>')


def product_page(p, products, template):
    page = re.sub(r'<title>.*?</title>', '<title>' + escape(p['title']) + ' — Boutique CRCC</title>', template)
    desc = escape(p['description'], quote=True)
    page = re.sub(r'<meta name="description" content="[^"]*">', '<meta name="description" content="'+desc+'">', page)
    url = 'https://cruising-rats-cigar-club.fr/boutique-articles/' + p['slug']
    page = re.sub(r'<link rel="canonical" href="[^"]*">', '<link rel="canonical" href="'+url+'">', page)
    page = re.sub(r'<meta property="og:title" content="[^"]*">', '<meta property="og:title" content="'+escape(p['title'], quote=True)+'">', page)
    page = re.sub(r'<meta property="og:description" content="[^"]*">', '<meta property="og:description" content="'+desc+'">', page)
    page = re.sub(r'<meta property="og:url" content="[^"]*">', '<meta property="og:url" content="'+url+'">', page)
    page = re.sub(r'<meta property="og:image" content="[^"]*">', '<meta property="og:image" content="https://cruising-rats-cigar-club.fr/boutique-media/'+p['slug']+'.webp">', page)
    page = re.sub(r'<h1 class="site-title">.*?</h1>', '<div class="site-title">La Boutique du Comité</div>', page)
    # Template links live at the public root; the product pages live one level below.
    page = re.sub(r'(href|src)="(?![a-z]+:|/|#)([^"]+)"', r'\1="../\2"', page)
    gallery_caption = 'Porté par ' + p['model'] if p['model'] in ('Pipa','Louis') else ('Vue portée · junior' if p['model']=='junior' else 'Seconde vue · pièce seule')
    back = ''
    if p.get('back_image'):
        back = ('<section class="garment-back-view" aria-labelledby="back-title"><h2 id="back-title">Le dos du Club</h2>'
                '<figure><img src="../boutique-media/' + p['back_image'] + '" width="1536" height="1024" loading="lazy" decoding="async" '
                'alt="Dos de la surchemise noire, seule et portée par Louis, grand lettrage ivoire Cruising Rats Cigar Club">'
                '<figcaption>La même surchemise de dos : grand lettrage Cruising Rats Cigar Club.</figcaption></figure></section>')
    peers = [other for other in products if other['category']==p['category'] and other['slug']!=p['slug']][:3]
    group = next(label for key,label,_ in GROUPS if key==p['category'])
    main = ('<main class="boutique-detail"><nav class="boutique-breadcrumb" aria-label="Fil d’Ariane">'
            '<a href="../boutique.html">Boutique</a><span aria-hidden="true"> / </span>'
            f'<a href="../boutique.html#{p["category"]}">{group}</a></nav>'
            f'<header class="garment-heading"><div class="boutique-ref">{p["id"]} · {escape(p["universe"])}</div>'
            f'<h1>{escape(p["title"])}</h1><p>{escape(p["caption"])}</p></header>'
            '<div class="garment-gallery" aria-label="Visuels de l’article">'
            '<figure>' + image(p,'../',lazy=False) + '<figcaption>La pièce seule</figcaption></figure>'
            '<figure>' + image(p,'../',side='right',lazy=False) + f'<figcaption>{gallery_caption}</figcaption></figure></div>'
            f'<p class="garment-enlarge"><a href="../boutique-media/{p["slug"]}.webp">Agrandir les deux vues ↗</a></p>'
            + back + '<section class="garment-details" aria-labelledby="article-details">'
            f'<div><h2 id="article-details">L’esprit de la pièce</h2><p>{escape(p["description"])}</p>'
            f'<h3>Le motif</h3><p>{escape(p["motif"])}</p><blockquote>{escape(p["aside"])}</blockquote></div>'
            '<aside><h2>Fiche du vestiaire</h2><dl>'
            f'<dt>Rayon</dt><dd>{group}</dd><dt>Univers</dt><dd>{escape(p["universe"])}</dd>'
            f'<dt>Coloris présenté</dt><dd>{escape(p["colour"])}</dd>'
            f'<dt>Matière envisagée</dt><dd>{escape(p["fabric"])}</dd>'
            f'<dt>Coupe</dt><dd>{escape(p["cut"])}</dd></dl>'
            '</aside></section>'
            '<section class="boutique-related" aria-labelledby="related-title"><h2 id="related-title">Dans le même vestiaire</h2>'
            '<div class="boutique-products">' + ''.join(card(other,'../') for other in peers) + '</div></section>'
            f'<p><a class="boutique-back" href="../boutique.html#{p["category"]}">← Retour au rayon {group.lower()}</a></p></main>')
    return re.sub(r'<main>.*?</main>', lambda _:main, page, flags=re.S)


def main():
    output = Path(sys.argv[1]).resolve() if len(sys.argv)>1 else ROOT/'dist'
    data = json.loads((ROOT/'data/boutique.json').read_text())
    products = data['products']
    template = (ROOT/'boutique.html').read_text().replace('<script src="js/boutique.js" defer></script>', '')
    for p in products:
        photo = output/'boutique-media'/f'{p["slug"]}.webp'
        if not photo.is_file():
            raise RuntimeError('Missing product image: '+str(photo))
    target = output/'boutique-articles'
    target.mkdir(parents=True,exist_ok=True)
    for p in products:
        (target/(p['slug']+'.html')).write_text(product_page(p,products,template),encoding='utf-8')
    sections=[]
    for key,label,tagline in GROUPS:
        selected=[p for p in products if p['category']==key]
        sections.append(f'<section id="{key}" class="boutique-section" aria-labelledby="titre-{key}">'
                        '<header class="boutique-section-header">'
                        f'<h2 id="titre-{key}">{label}</h2><p>{tagline}</p></header>'
                        '<div class="boutique-products">'+''.join(card(p) for p in selected)+'</div></section>')
    hero = next(p for p in products if p['slug']=='sweat-operation-hamster')
    main = ('<main><section class="boutique-intro" aria-labelledby="collection-title"><div>'
            '<div class="boutique-eyebrow">LES AVENTURES DE CIGAROLO · COLLECTION ILLUSTRÉE</div>'
            '<h2 id="collection-title">Du caractère.<br>Dans les deux camps.</h2>'
            f'<p class="lead">{len(products)} pièces, trois rayons et une rivalité qui déborde des dossiers. '
            'Cigarolo, Pipa et les hamsters du HRPC se partagent le vestiaire.</p>'
            '<nav class="boutique-rays" aria-label="Rayons de la boutique">'
            '<a href="#hommes">HOMMES</a><a href="#femmes">FEMMES</a><a href="#enfants">ENFANTS</a></nav>'
            '</div>'
            '<figure><a href="boutique-articles/'+hero['slug']+'.html">'
            '<img src="boutique-media/'+hero['slug']+'.webp" width="1536" height="1024" '
            'alt="Sweat bordeaux Opération hamster, seul et porté par Pipa" fetchpriority="high" decoding="async">'
            '</a><figcaption>Opération hamster · Pipa, chargée de l’infiltration et de la présentation.</figcaption></figure></section>'
            '<div class="boutique-filter" aria-label="Filtrer la collection">'
            '<button type="button" data-filter="all" aria-pressed="true">Tout le vestiaire</button>'
            '<button type="button" data-filter="hrpc" aria-pressed="false">Les pièces HRPC</button>'
            f'<span id="boutique-count" role="status" aria-live="polite">{len(products)} pièces</span></div>'
            + ''.join(sections) +
            '<aside class="boutique-outro"><h2>Le coton est une intention. L’aplomb, une obligation.</h2>'
            '<p>Coloris sobres, imprimés de BD en aplats et références de voisinage : la collection s’étudie pièce par pièce.</p>'
            '</aside></main>')
    html = re.sub(r'<main>.*?</main>',lambda _:main,template,flags=re.S)
    html = html.replace('</body>','<script src="js/boutique.js" defer></script></body>')
    (output/'boutique.html').write_text(html,encoding='utf-8')
    sitemap=output/'sitemap.xml'
    xml=sitemap.read_text()
    for p in products:
        url='https://cruising-rats-cigar-club.fr/boutique-articles/'+p['slug']
        if url not in xml:
            xml=xml.replace('</urlset>',f'  <url><loc>{url}</loc><lastmod>2026-11-06</lastmod></url>\n</urlset>')
    sitemap.write_text(xml)
    print(f'Boutique: {len(products)} product pages and catalogue rendered.')


if __name__=='__main__':
    main()
