import csv
from pathlib import Path

root = Path('/Users/devtehen/workspace/peptides-decodes')
products_dir = root / 'products'
products_dir.mkdir(exist_ok=True)

rows = []
with open(root / 'RC-Peptides-Cleaned-List.csv', newline='', encoding='utf-8') as f:
    rows = list(csv.DictReader(f))

rows_by_slug = {r['slug']: r for r in rows}

priority_slugs = [
    'argirelin-200mg-vial',
    'matrixyl-10mg-vial',
    'l-carnitine-500mg',
    'l-glutathione',
    'tudca-100x500mg',
    'melatonin-10mg-vial',
    'bpc157-10mg-vial',
    'tb500-10mg-vial',
    'ss-31-10mg-vial',
    'orexin-a-10mg-vial',
    'dihexa-60x10mg',
    'aod9604-5mg-vial',
    'ipamorelin-10mg-vial',
    'nad-500mg-vial',
    'ghk-cu-50mg-vial',
]

template = '''<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <title>{title} — Peptides Decoded</title>
  <meta name="description" content="{meta_desc}">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="canonical" href="https://peptides-decodes.pages.dev/products/{slug}/">
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://peptides-decodes.pages.dev/products/{slug}/">
  <meta property="og:title" content="{title} — Peptides Decoded">
  <meta property="og:description" content="{meta_desc}">
  <meta property="og:image" content="https://peptides-decodes.pages.dev/og-image.png">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="https://peptides-decodes.pages.dev/products/{slug}/">
  <meta name="twitter:title" content="{title} — Peptides Decoded">
  <meta name="twitter:description" content="{meta_desc}">
  <meta name="twitter:image" content="https://peptides-decodes.pages.dev/og-image.png">
  <script type="application/ld+json">
  {{
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "{title}",
    "description": "{meta_desc}",
    "brand": {{ "@type": "Brand", "name": "RC Peptides" }},
    "offers": {{
      "@type": "Offer",
      "price": "{price}",
      "priceCurrency": "EUR",
      "availability": "https://schema.org/PreOrder",
      "url": "{product_url}"
    }}
  }}
  </script>
  <style>
    :root {{
      --bg:#fafafa; --fg:#1e293b; --muted:#64748b; --accent:#0ea5e9; --card:#ffffff; --border:#e2e8f0;
      --success:#16a34a; --warning:#d97706; --danger:#dc2626; --radius:12px;
      --font-sans:ui-sans-serif,system-ui,-apple-system,sans-serif;
      --font-serif:ui-serif,Georgia,Cambria,serif;
      --font-mono:ui-monospace,SFMono-Regular,Menlo,monospace;
    }}
    @media (prefers-color-scheme:dark){{ :root{{ --bg:#0f172a; --fg:#f8fafc; --muted:#94a3b8; --card:#1e293b; --border:#334155; }} }}
    @media (prefers-reduced-motion:reduce){{ *{{animation:none!important;transition:none!important}} }}
    *{{box-sizing:border-box;margin:0;padding:0}}
    body{{font-family:var(--font-sans);background:var(--bg);color:var(--fg);line-height:1.6;min-height:100vh}}
    .container{{max-width:900px;margin:0 auto;padding:2rem 1.5rem}}
    header{{display:flex;justify-content:space-between;align-items:center;margin-bottom:2rem;gap:1rem;flex-wrap:wrap}}
    .logo{{font-size:1.5rem;font-weight:800;color:var(--accent);text-decoration:none}}
    nav ul{{list-style:none;display:flex;gap:1.25rem;flex-wrap:wrap}}
    nav a{{color:var(--muted);text-decoration:none;font-size:.95rem;transition:color .2s}}
    nav a:hover,nav a:focus{{color:var(--fg);outline:2px solid var(--accent);outline-offset:4px;border-radius:4px}}
    .breadcrumb{{font-size:.875rem;color:var(--muted);margin-bottom:1.25rem}}
    .breadcrumb a{{color:var(--accent);text-decoration:none}}
    .product-header{{margin-bottom:1.5rem}}
    .badge{{display:inline-block;padding:.25rem .75rem;border-radius:999px;font-size:.75rem;font-weight:700;text-transform:uppercase;letter-spacing:.05em;margin-bottom:.75rem}}
    .badge-recommended{{background:rgba(34,197,94,.15);color:var(--success);border:1px solid var(--success)}}
    .badge-clinical{{background:rgba(14,165,233,.15);color:var(--accent);border:1px solid var(--accent)}}
    .badge-preclinical{{background:rgba(217,119,6,.15);color:var(--warning);border:1px solid var(--warning)}}
    .badge-prescription{{background:rgba(220,38,38,.12);color:var(--danger);border:1px solid var(--danger)}}
    h1{{font-family:var(--font-serif);font-size:clamp(1.6rem,4vw,2rem);font-weight:700;margin-bottom:.5rem;line-height:1.2}}
    .price{{font-size:1.25rem;font-weight:700;color:var(--fg);margin-bottom:1rem;font-family:var(--font-mono)}}
    .card{{background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:1.5rem;box-shadow:0 4px 12px rgba(0,0,0,.05);margin:1.25rem 0}}
    h2{{font-family:var(--font-serif);font-size:1.25rem;font-weight:700;margin:1.25rem 0 .5rem}}
    h3{{font-family:var(--font-serif);font-size:1.05rem;font-weight:700;margin:1rem 0 .5rem}}
    p{{color:var(--muted);margin-bottom:.75rem}}
    ul{{margin-left:1.25rem;color:var(--muted);margin-bottom:.75rem}}
    li{{margin-bottom:.35rem}}
    .mono{{font-family:var(--font-mono);font-size:.9rem;color:var(--fg)}}
    .disclaimer{{background:rgba(220,38,38,.08);border:1px solid var(--danger);border-radius:var(--radius);padding:1.25rem;margin:1.5rem 0}}
    .disclaimer h3{{color:var(--danger);font-size:1rem;margin-bottom:.5rem}}
    .disclosure{{background:rgba(14,165,233,.08);border:1px solid var(--accent);border-radius:var(--radius);padding:1.25rem;margin:1.25rem 0}}
    .disclosure h3{{color:var(--accent);font-size:1rem;margin-bottom:.5rem}}
    .cta{{display:inline-block;margin-top:.75rem;padding:.875rem 1.5rem;border-radius:var(--radius);background:linear-gradient(90deg,var(--accent),#38bdf8);color:#0f172a;font-weight:700;text-decoration:none}}
    .cta:hover,.cta:focus{{transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,.15);outline:2px solid var(--accent);outline-offset:4px}}
    footer{{margin-top:3rem;padding-top:1.5rem;border-top:1px solid var(--border);text-align:center;color:var(--muted);font-size:.875rem}}
    footer a{{color:var(--accent);text-decoration:none}}
    @media print{{body{{background:white;color:black}}.cta,header,footer{{display:none}}}}
  </style>
</head>
<body>
  <div class="container">
    <header role="banner">
      <a href="/" class="logo" aria-label="Peptides Decoded — Accueil">Peptides Decoded</a>
      <nav role="navigation" aria-label="Navigation principale">
        <ul>
          <li><a href="/">Accueil</a></li>
          <li><a href="/#articles">Articles</a></li>
          <li><a href="/#methodology">Méthodologie</a></li>
        </ul>
      </nav>
    </header>

    <nav class="breadcrumb" aria-label="Fil d'Ariane">
      <a href="/">Accueil</a> → <a href="/#articles">Articles</a> → <span aria-current="page">{breadcrumb_category}</span>
    </nav>

    <main role="main">
      <section class="product-header" aria-labelledby="product-title">
        <span class="badge {badge_class}">{evidence_label} · {promotion_label}</span>
        <h1 id="product-title">{title}</h1>
        <p class="price">Prix : {price} — <a href="{product_url}" class="cta" rel="nofollow sponsored">Voir le produit sur RC Peptides →</a></p>
      </section>

      <article class="card" aria-labelledby="product-title">
        <h2 id="positionnement">Positionnement</h2>
        <p>{positionnement}</p>

        <h2 id="preuve">Preuve scientifique disponible</h2>
        <p>{preuve}</p>

        <h2 id="securite-limites">Sécurité et limites</h2>
        <ul>
          <li><strong>Statut :</strong> {statut}</li>
          <li><strong>Niveau de preuve :</strong> {niveau_preuve}</li>
          <li><strong>Usage :</strong> {usage}</li>
        </ul>
        <p class="mono">COA lot disponible sur demande au fournisseur. Purité ≥99% HPLC. Usage recherche / cosmétique selon statut légal local.</p>
      </article>

      <div class="disclosure" role="note" aria-label="Disclosure affiliation">
        <h3>🔗 Disclosure affiliation</h3>
        <p>Ce lien utilise un parrainage affilié <span class="mono">ref=PEPTIDESDECODED</span>. Je peux toucher une commission sans coût supplémentaire pour vous. Cela n'influence pas l'analyse scientifique ci-dessus.</p>
      </div>

      <div class="disclaimer" role="alert" aria-labelledby="disclaimer-title">
        <h3 id="disclaimer-title">⚠️ Avertissement important</h3>
        <p>Peptides Decoded est informatif uniquement. Ce produit peut être un ingrédient cosmétique, un complément, un médicament sur prescription ou un matériau de recherche. Vérifiez le statut réglementaire dans votre pays. Consultez un professionnel de santé qualifié avant toute utilisation.</p>
      </div>
    </main>

    <footer>
      <p>Peptides Decoded © 2026. <a href="/editorial-policy/">Politique éditoriale</a> · <a href="/privacy/">Confidentialité</a> · <a href="/terms/">Conditions</a></p>
      <p style="margin-top:.5rem">Dernière mise à jour : 20 août 2026</p>
    </footer>
  </div>
</body>
</html>
'''

evidence_labels = {
    'CLINICAL': 'Données cliniques humaines',
    'PRECLINICAL': 'Données précliniques',
}
promotion_labels = {
    'RECOMMENDED': 'Recommandé éditorial',
    'CLINICAL': 'Preuves cliniques',
    'ANIMAL_DATA_ONLY': 'Données animales uniquement',
    'PRESCRIPTION_ONLY': 'Sur prescription',
}

created = []
for slug in priority_slugs:
    row = rows_by_slug.get(slug)
    if not row:
        print('MISSING', slug)
        continue
    title = row['product_name']
    cat = row['category']
    price = row['price']
    evidence = row['evidence_level']
    promo = row['promotion_status']
    url = row['rc_product_url']
    pos = row.get('Positionnement') or ''
    preuve = row.get('Preuve scientifique') or 'Consulter la fiche produit et la littérature primaire pour les références précises.'
    statut = 'PRÉCLINIQUE — données animales/in vitro uniquement.' if evidence == 'PRECLINICAL' else 'STATUT CLINICAL — données humaines disponibles.'
    niveau = 'Faible à intermédiaire : essais courts, populations limitées, souvent sponsorisés.' if evidence == 'PRECLINICAL' else 'Intermédiaire : RCT humaines disponibles mais durée/n limitée pour certaines indications.'
    usage = 'Recherche uniquement, non approuvé comme médicament dans la plupart des juridictions.' if evidence == 'PRECLINICAL' else 'Usage cosmétique/complément/médicament selon produit et pays. Vérifier réglementation locale.'
    badge_class = 'badge-recommended' if promo == 'RECOMMENDED' else ('badge-clinical' if evidence == 'CLINICAL' else ('badge-prescription' if promo == 'PRESCRIPTION_ONLY' else 'badge-preclinical'))
    ev_label = evidence_labels.get(evidence, evidence)
    pr_label = promotion_labels.get(promo, promo)
    breadcrumb_category = cat

    pos = pos.replace('"', "'")
    preuve = preuve.replace('"', "'")
    meta_desc = f"{title} — {cat}. {preuve[:140]}..."

    html = template.format(
        title=title,
        meta_desc=meta_desc,
        slug=slug,
        price=price,
        product_url=url,
        breadcrumb_category=breadcrumb_category,
        badge_class=badge_class,
        evidence_label=ev_label,
        promotion_label=pr_label,
        positionnement=pos,
        preuve=preuve,
        statut=statut,
        niveau_preuve=niveau,
        usage=usage,
    )
    out = products_dir / slug / 'index.html'
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(html, encoding='utf-8')
    created.append(str(out))

print('CREATED', len(created), 'product pages')
for p in created:
    print(p)
