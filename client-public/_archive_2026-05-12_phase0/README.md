# Archive — Phase 0.2 (refactor theming multi-tenant)

**Date d'archivage** : 2026-05-12  
**Auteur** : audit 0.2 (refactor theming SunnyGo)  
**Contexte** : Phase 0 — Strangler pattern sur le theming `CLIENT-end/client-public/`. Avant de migrer les 4 systèmes de theming coexistants (cf. audit 0.1 + 0.2) vers une source unique Zustand, on isole tout code mort identifié pour purifier le périmètre d'audit sans perte d'historique.

## ⛔️ NE PAS IMPORTER CES FICHIERS

Le bundler Metro est configuré (cf. [`CLIENT-end/metro.config.js`](../../metro.config.js)) avec un `blockList` qui exclut tout dossier `_archive_*` du graphe de modules. Toute tentative d'`import` depuis ce dossier échouera au build.

## Date prévue de suppression définitive

**≥ 2026-06-12** (J+30 après archivage), **ET** sous condition cumulative :

1. ✅ Phase 0.3 (adaptateur strangler) mergée
2. ✅ Smoke test visuel complet du parcours `Welcome → Menu → Order → Payment → Tracking` validé sur les 2 thèmes actifs (Cucina + Grillz)
3. ✅ Aucun rollback theming en attente sur `main`

La suppression définitive sera **1 PR dédiée**, séparée du chantier theming, avec titre `chore(cleanup): remove archive _archive_2026-05-12_phase0`.

## Inventaire archivé (11 fichiers, 12 821 lignes)

### Backups orphelins (5)

| Fichier d'origine | Lignes |
|---|---:|
| `App.jsx.backup` | 421 |
| `src/screens/JoinOrCreateTable.jsx.backup` | 1 821 |
| `src/screens/Menu.jsx.backup` | 3 178 |
| `src/screens/MenuScreen.jsx.backup` | 535 |
| `src/screens/MenuScreen.jsx.bak` | 1 061 |

### Stylesheets thématiques legacy (4)

Ces 4 fichiers définissaient des palettes par thème en dur (pré-Zustand). Aucun import résiduel détecté lors de l'audit 0.2. Tous remplacés par `theme/` + `useThemeStore`.

| Fichier d'origine | Lignes |
|---|---:|
| `src/styles/appStyles-classic.js` | 1 081 |
| `src/styles/appStyles-classic.fixed.js` | 88 |
| `src/styles/appStyles-standard.js` | 598 |
| `src/styles/appStyles-grillz.js` | 650 |

### Screens morts (2)

| Fichier d'origine | Lignes | Justification |
|---|---:|---|
| `src/screens/MenuScreenExample.jsx` | 204 | Démo non utilisée en prod (jamais importée). Importait l'ancien `useTheme()`. |
| `src/screens/Menu.jsx` | 3 184 | Re-exporté par `screens/index.js` mais zéro consommateur. Utilisait encore `config?.styleKey === "italia"`. La ligne d'export a été retirée de `src/screens/index.js` dans le même PR pour empêcher toute résurrection accidentelle. |

## Restauration en cas de besoin

Tout l'historique git est préservé (`git mv`). Pour récupérer un fichier :

```bash
git mv CLIENT-end/client-public/_archive_2026-05-12_phase0/<chemin>/<fichier> CLIENT-end/client-public/<chemin-original>/<fichier>
```

Et vérifier les imports manquants avec `grep_search` avant ré-introduction.

---

## Ajout 2026-05-12 (audit 0.2.4) — 9 composants UI primitives orphelins

### Inventaire (9 dossiers, 18 fichiers, 607 lignes)

| Dossier d'origine | Lignes |
|---|---:|
| `src/components/ui/Card/` | 51 |
| `src/components/ui/Input/` | 104 |
| `src/components/ui/Badge/` | 56 |
| `src/components/ui/Background/` | 28 |
| `src/components/ui/BottomSheet/` | 73 |
| `src/components/food/FoodCard/` | 78 |
| `src/components/food/CategoryPill/` | 55 |
| `src/components/cart/CartItem/` | 74 |
| `src/components/navigation/BottomNav/` | 88 |

Archivés dans `_archive_2026-05-12_phase0/components/{ui,food,cart,navigation}/`.

### Mention spéciale — Deux destins possibles

Composants UI primitives orphelins en runtime, alimentés par le **Système C** (`ThemeProvider` Context) qui reste vivant pour `WelcomeScreen`. Deux destins possibles :

- **(A)** Recyclage en **Phase 2** comme base du Design System Showcase branché Zustand.
- **(B)** Suppression définitive si Phase 2 décide de tout reconstruire from scratch.

**Décision à prendre en début de Phase 1, fenêtre J+30 minimum après archivage.**

### Édition collatérale (barrel files)

Les 5 barrel files suivants ont été allégés des 9 exports archivés (Button et autres exports vivants conservés) :

- `src/components/index.js`
- `src/components/ui/index.js`
- `src/components/food/index.js`
- `src/components/cart/index.js`
- `src/components/navigation/index.js`

### Vérification d'inutilisation

Grep effectué post-archivage sur `from.*<Composant>` dans `CLIENT-end/client-public/` : **zéro consommateur vivant** détecté hors `_archive_*`. Les seules occurrences résiduelles sont internes à l'archive (FoodCard et CartItem se réfèrent à Card/Badge entre eux dans l'archive).

