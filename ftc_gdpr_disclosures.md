# RC Peptides Affiliate — FTC 2026 / GDPR Disclosure Copy

## 1. Newsletter Body — Pre-First-Link Disclosure (MANDATORY)

Place this block **before the first affiliate link** in every newsletter:

---

> **Transparence affiliée** — Certains liens dans cet email sont des liens affiliés.
> Si vous effectuez un achat via ces liens, je peux toucher une petite commission
> **sans coût supplémentaire pour vous**. Cela m'aide à financer la recherche et la
> rédaction de ces contenus. Je ne recommande que des produits que j'ai évalués
> personnellement ou dont la qualité analytique est vérifiable (COA lot disponible).

---

## 2. Per-CTA Inline Disclosure (MANDATORY on every affiliate link)

Append directly before or after each CTA button/link:

> 🔗 *Lien affilié — je peux toucher une commission sans coût supplémentaire pour vous.*

**HTML version (copy-paste into email template):**
```html
<p style="font-size:12px;color:#666;margin:4px 0 12px;">
  🔗 Lien affilié — je peux toucher une commission sans coût supplémentaire pour vous.
</p>
```

## 3. Email Footer Disclosure (MANDATORY in every email footer)

```
Ce message peut contenir des liens affiliés. Consultez notre politique d'affiliation
complète : https://yoursite.com/affiliation
```

**HTML version:**
```html
<p style="font-size:11px;color:#999;text-align:center;padding:8px 0;border-top:1px solid #eee;">
  Cet email peut contenir des liens affiliés. |
  <a href="https://yoursite.com/affiliation" style="color:#999;">Politique d'affiliation</a> |
  <a href="{{unsubscribe_url}}" style="color:#999;">Se désabonner</a>
</p>
```

## 4. /affiliation Page — Required Content

Create `/affiliation` on yoursite.com with the following minimum content:

**Titre H1 :** Programme d'affiliation — Transparence totale

**Body required (adapt wording freely, keep all facts):**
- Je participe au programme d'affiliation de RC Peptides (rcpeptides.to).
- Je reçois une commission sur les achats effectués via mes liens, sans coût supplémentaire pour l'acheteur.
- Mes recommandations sont basées sur l'évaluation des COA (certificats d'analyse), de la pureté HPLC déclarée, et de la littérature scientifique disponible.
- Les produits présentés sont des **réactifs de recherche** destinés à un usage en laboratoire uniquement.
- Aucun produit présenté sur ce site n'est destiné au diagnostic, au traitement ou à la prévention d'une maladie chez l'humain.
- Date de dernière mise à jour : [DATE]
- Contact : [EMAIL]

## 5. GDPR — Technical Measures Implemented

| Mesure | Implémentation |
|---|---|
| Anonymisation IP | SHA-256(IP + sel fixe) — irréversible |
| Aucun cookie tiers | Tracking côté serveur (Cloudflare Worker) uniquement |
| Durée de conservation | Purge automatique après 13 mois (pg_cron) |
| Consentement | Newsletter opt-in explicite requis avant tracking |
| Droit d'accès/suppression | Via `DELETE FROM affiliate_clicks WHERE ip_hash = ?` |

## 6. Regulatory Note — Research Peptides

**MANDATORY disclaimer on all content pages and newsletter footers:**

> Les produits présentés sont des réactifs de recherche. Ils ne sont pas approuvés
> par l'EMA, la FDA ou tout autre organisme réglementaire à des fins de traitement
> ou de prévention de maladies chez l'humain. Toute utilisation sur des sujets
> humains est hors du cadre légal dans la plupart des juridictions européennes.

---

*Généré automatiquement — conforme FTC Endorsement Guides 16 CFR Part 255 (révision 2023,
appliquée 2026) et RGPD Art. 13/14 (information des personnes concernées).*
