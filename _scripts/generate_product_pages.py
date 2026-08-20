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
  <link rel="stylesheet" href="/_shared/product.css">
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
