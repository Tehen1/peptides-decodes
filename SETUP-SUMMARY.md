# Setup Summary — Peptides Affiliate Tracking

**Status:** ✅ Supabase schema applied  
**Date:** 2026-08-06  
**Project:** supabase-fixieRun-proj (`qmmghddeqffzqorbiman`)

---

## ✅ Completed

### 1. Supabase Schema

- **Tables créates/mises à jour:**
  - `affiliate_products` (existante, colonnes ajout: `slug`, `price`, `promotion_status`, `evidence_level`, `rc_product_url`)
  - `affiliate_clicks` (existante, colonnes ajout: `newsletter_id`, `user_agent`, `ip_hash`, `converted`, `conversion_value`)
  - `affiliate_conversions` (nouvelle)
  - `affiliate_settings` (nouvelle, RC Peptides insé§¹é¶¹e par dÉ¹efaut)

- **RLS Policies:**
  - `affiliate_products`: public read
  - `affiliate_clicks`: insert public, select owner
  - `affiliate_conversions`: select owner
  - `affiliate_settings`: select public (active only)

- **Views:**
  - `daily_clicks_by_link`: clicks quotidiens par lien
  - `revenue_by_partner`: revenue par partenaire

### 2. Fichiers GénÉ¹erÉ¹es

- `RC-Peptides-Cleaned-List.csv` (67 produits)
- `RC-Peptides-Top-Promote.md` (tableau final)
- `supabase-affiliate-schema.sql` (schema complet)
- `cloudflare-edge-function-affiliate.ts` (edge function)

---

## 🚀 Chemins officiels (Cloudflare Pages)

- **Home FR** : `https://peptides-decodes.pages.dev/`
- **Home EN** : `https://peptides-decodes.pages.dev/en.html`
- **Articles FR** : `https://peptides-decodes.pages.dev/articles/` ou `/articles/index.html`
- **Articles EN** : `https://peptides-decodes.pages.dev/articles-en` → `/articles/en.html`
- **Affiliation FR** : `https://peptides-decodes.pages.dev/affiliation.html`
- **Affiliation EN** : `https://peptides-decodes.pages.dev/affiliation-en.html`
- **Tracking Worker** : `https://peptides-affiliate-tracking.antony-lambi88workersdev.workers.dev/api/affiliate/click/:slug?nl=:NL_ID`

## ⏳ Next Steps

### Étape 1: Importer les produits dans Supabase

```bash
# Via Supabase Dashboard → SQL Editor
COPY affiliate_products (id, product_name, category, slug, price, promotion_status, evidence_level, rc_product_url)
FROM STDIN WITH (FORMAT csv, HEADER true);
```

Ou via `psql`:

```bash
psql -h db.qmmghddeqffzqorbiman.supabase.co -U postgres -d postgres \
  -c "\\copy affiliate_products FROM 'RC-Peptides-Cleaned-List.csv' WITH (FORMAT csv, HEADER true)"
```

### Étape 2: Déployer Edge Function Cloudflare

**Fichier:** `cloudflare-edge-function-affiliate.ts`

```bash
# 1. Installer Wrangler
npm install -g wrangler

# 2. Login Cloudflare
wrangler login

# 3. Créer worker
wrangler init peptides-affiliate-tracking
cd peptides-affiliate-tracking

# 4. Copier le code
cp cloudflare-edge-function-affiliate.ts src/index.ts

# 5. Configurer wrangler.toml
cat > wrangler.toml << EOF
name = "peptides-affiliate-tracking"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[vars]
SUPABASE_URL = "https://qmmghddeqffzqorbiman.supabase.co"
SUPABASE_SERVICE_ROLE_KEY = "ton_service_role_key_ici"
EOF

# 6. Déployer
wrangler deploy
```

**Variables d'environnement:**
- `SUPABASE_URL`: `https://qmmghddeqffzqorbiman.supabase.co`
- `SUPABASE_SERVICE_ROLE_KEY`: (rÉ¹cupÉ¹er dans Supabase Dashboard → Settings → API)

### Étape 3: Configurer DNS Cloudflare

Ajouter une route dans Cloudflare Dashboard:

- **Zone:** `peptides-decodes.pages.dev`
- **Route:** `/api/affiliate/click/*`
- **Worker:** `peptides-affiliate-tracking`

### Étape 4: Mettre à jour Newsletter

**Avant:**
```html
<a href="https://rcpeptides.to/products/bpc157-10mg-vial">Voir COA + prix →</a>
```

**AprÉ¹es:**
```html
<a href="https://peptides-decodes.pages.dev/api/affiliate/click/bpc157-10mg-vial?nl=1">Voir COA + prix →</a>
```

### Étape 5: Ajouter Disclosure FTC/RGPD

**Dans footer newsletter:**
```html
<p style="font-size:12px;color:#6b7280;">
  Certains liens dans cet email sont des liens affiliÉ¹es. 
  Je peux toucher une petite commission sans coû µ1t supplÉ¹emÉ¹entaire pour vous.
  <a href="https://peptides-decodes.pages.dev/affiliation" style="color:#6b7280;">En savoir plus</a>
</p>
```

---

## 📊 Analytics Queries

### Top produits (7 jours)

```sql
SELECT 
  p.product_name,
  COUNT(c.id) AS clicks,
  COUNT(DISTINCT c.subscriber_id) AS unique_clicks
FROM affiliate_clicks c
JOIN affiliate_links al ON c.affiliate_link_id = al.id
JOIN affiliate_products p ON al.url_slug = p.slug
WHERE c.clicked_at > NOW() - INTERVAL '7 days'
GROUP BY p.id, p.product_name
ORDER BY clicks DESC
LIMIT 10;
```

### Revenue par partenaire

```sql
SELECT * FROM revenue_by_partner;
```

---

## 🔐 RGPD Compliance

- **IP hashÉ¶1e:** SHA256 (via `hash_ip_address()`)
- **Data retention:** clicks >12 mois → suppression automatique (à§¹ configurer via cron)
- **Consentement:** tracking URL dÉ¹sactivable (prÉ¹fÉ¹rence center)
- **Privacy policy:** disclosure tracking affiliÉ¹ + partners

---

## 📧 Email RC Peptides

**Objet:** `Partenariat affiliation — Newsletter Peptides Decodes (FR/BE)`

**Destinataire:** `support@rcpeptides.to` (ou contact form)

**Corps:** Voir `RC-Peptides-Email-Propre.md`

---

## Backup Labs

Si RC Peptides refuse:

1. **American Peptides** (35%) → `partners@americanpeptides.us`
2. **Aldera Bio Labs** (10-20%) → Application en ligne
3. **Onyx Biolabs** → `affiliates@onyxbiolabs.com`

---

**GÉ¹nÉ¹erÉ¹e le 6 aoåµıt 2026 — Peptides Decodes**
```