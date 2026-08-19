# Contributing to Peptides Decoded

Thank you for your interest in contributing to Peptides Decoded. This project is an independent publication that decodes clinical data on peptides with scientific rigor and editorial independence.

## Editorial Standards

### 1. Evidence Hierarchy
Every article must explicitly state the **type and level of evidence**:

| Level | Design | Examples |
|-------|--------|----------|
| **Élevé** | RCT multicentrique, méta-analyse de RCTs, grandes cohortes prospectives | SURMOUNT, STEP, SURPASS, méta-analyses Cochrane |
| **Intermédiaire** | Études observationnelles bien menées, revues systématiques non Cochrane, analyses de registres | Registres nationaux, cohortes rétrospectives de qualité |
| **Faible / Exploratoire** | Petits essais, phase 2, préclinique, séries de cas, avis d'experts | Essais phase 1/2, modèles animaux, mécanistiques |

**Rule**: Never present preclinical or mechanistic data as clinical benefit.

### 2. Standardized Article Structure
Each article **must** include these sections in order:

1. **Titre factuel** — ex: *"Tirzépatide et perte de poids : que montrent réellement les essais cliniques ?"*
2. **Verdict (1 phrase)** — immédiatement visible, nuancé au niveau de preuve
3. **Type et niveau de preuve** — tableau structuré (design, population, comparateur, durée, niveau, applicabilité)
4. **Résultats vérifiés** — critère principal, taille échantillon, différence entre groupes, IC 95 %, durée suivi, abandons, résultats secondaires, sous-groupes
5. **Sécurité** — fréquents, graves, interruptions, signaux post-AMM, inconnues long terme, dose étudiée vs usage réel
6. **Limites** — financement, conflits d'intérêts, durée insuffisante, population peu représentative, biomarqueur vs clinique, pas de comparaison directe, préclinique seulement, prépublication, communiqué sans publication
7. **Sources primaires** — publication originale, DOI, PMID, NCT/EU CTIS, FDA/EMA, revue systématique

### 3. Verdict Classification System
Use **exactly** these visual badges (CSS classes):

| Badge | Class | Meaning |
|-------|-------|---------|
| Données solides | `evidence-high` | Plusieurs études humaines cohérentes |
| Données prometteuses | `evidence-moderate` | Signal humain intéressant, confirmation nécessaire |
| Données limitées | `evidence-low` | Petit essai, résultat indirect, suivi court |
| Préclinique | `evidence-low` | Données animales/cellulaires uniquement |
| Non démontré | `evidence-low` | Absence de preuve clinique suffisante |
| Signal de sécurité | `evidence-low` | Risque identifié nécessitant surveillance |

### 4. Forbidden Formulations
**Never use**: "prouvé", "garanti", "révolutionnaire", "sans danger", "efficace à 100 %", "miracle", "game-changer".

**Use instead**: "montre une efficacité supérieure au placebo", "réduction significative de X % (IC 95 %)", "profil de sécurité dominé par...", "nécessite confirmation", "signaux préliminaires".

### 5. Source Hierarchy (Priority Order)
1. Publication originale (peer-reviewed) — DOI, PMID
2. ClinicalTrials.gov / EU CTIS — NCT / EudraCT numbers
3. FDA / EMA / ANSM / Health Canada — assessment reports, labels
4. Revues systématiques / méta-analyses Cochrane — quand pertinentes
5. **Médias et communiqués** : uniquement pour identifier un sujet, **jamais** pour soutenir une conclusion scientifique

### 6. Conflict of Interest & Funding Transparency
- Always disclose study funding sources
- Note declared COI from publications
- Distinguish industry-sponsored vs independent research
- Peptides Decoded itself: no industry funding, no affiliate links in scientific content

### 7. Medical Disclaimer
Every article must include the standard disclaimer block (`.disclaimer` class).

### 8. Updates & Corrections
- Add "Dernière vérification : DATE" to article meta
- Maintain a changelog for substantive corrections
- Never silently edit published conclusions

## Technical Standards

### File Structure
```
/articles/<slug>/index.html     # Clean URLs with trailing slashes
/editorial-policy/index.html
/privacy/index.html
/terms/index.html
/en/...                         # English mirror (same structure)
```

### HTML Requirements
- Valid HTML5, semantic elements (`<article>`, `<section>`, `<nav>`, `<header>`, `<footer>`)
- Meta tags: `title`, `description`, `canonical`, Open Graph, Twitter Cards
- JSON-LD: `Article` schema with `datePublished`, `dateModified`, `author`
- Accessibility: ARIA labels, keyboard navigation, WCAG AA contrast, `prefers-reduced-motion`
- Responsive: mobile-first, print styles

### CSS Architecture
- CSS custom properties (`:root`) for theming
- No external CSS frameworks
- Dark theme default (--bg: #0f172a), light mode via `@media (prefers-color-scheme: light)` if implemented

### Cloudflare Pages
- Static files only (no Workers needed for current scope)
- `_redirects` for clean URL handling
- `sitemap.xml`, `robots.txt` at root
- Deploy from `main` branch

## Pull Request Process

1. **Create a feature branch** from `main`: `feat/<short-description>`
2. **Follow the article template** (copy an existing article as base)
3. **Run local validation**:
   - `npx html-validate *.html articles/*/index.html` (or similar)
   - Check links: `npx linkinator https://peptides-decodes.pages.dev --skip "mailto:"`
   - Lighthouse CI: performance ≥ 90, accessibility ≥ 95, best practices ≥ 90, SEO ≥ 90
4. **Open PR** with:
   - Clear title: `feat: Add article on <topic>`
   - Description linking to primary sources (DOI, NCT, PMID)
   - Checklist: [ ] Evidence table complete, [ ] Sources linked, [ ] Disclaimer present, [ ] Badge correct, [ ] Meta tags valid
5. **Review** — at least one approval required
6. **Merge to main** — triggers Cloudflare Pages deploy

## Adding a New Article

```bash
# 1. Create directory
mkdir -p articles/<slug>/

# 2. Copy template
cp articles/peptides-cosmetiques/index.html articles/<slug>/index.html

# 3. Edit with your content following the structure above

# 4. Update homepage (index.html) — add card in #articles section

# 5. Update sitemap.xml — add new <url> entry

# 6. Test locally, then PR
```

## Questions?

Open an issue or check `/editorial-policy` for the full editorial policy.