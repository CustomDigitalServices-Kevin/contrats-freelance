# Interface contract — index.html <-> clauses.js

Fixed by the orchestration lead on 2026-07-18. Both files MUST follow this contract exactly.
`clauses.js` contains ONLY legal content and pure build functions (no DOM, no UI, no storage).
`index.html` renders forms generically from the declarations below and never hardcodes clause text.

## Global shape

```js
// clauses.js (plain script, no module system)
window.CONTRATS_TEMPLATES = {
  version: "1.0.0",
  disclaimer: "Ce document est un modèle type à personnaliser, fourni à titre informatif. Il ne constitue pas une consultation juridique et ne remplace pas l'avis d'un avocat pour votre situation particulière.",
  documents: { cgv: {...}, prestation: {...}, nda: {...} }
};
```

## Document template shape

```js
{
  id: "cgv",                       // "cgv" | "prestation" | "nda"
  label: "CGV de prestation de services (B2B)",
  description: "1 phrase FR affichée sous le choix du document",
  fields: [ /* step-2 extra inputs, see Field */ ],
  options: [ /* step-3 clause options, see Option */ ],
  build(data) { return { title, subtitle, sections, footerMentions }; }
}
```

### Field (step 2, specific to the document; client identity fields are provided by the app)

```js
{ id: "objet", label: "Objet de la prestation", type: "text"|"textarea"|"number"|"date",
  placeholder: "...", required: true|false, help: "aide courte ou null" }
```

### Option (step 3)

```js
{ id: "penalites", label: "Taux des pénalités de retard", help: "aide courte ou null",
  type: "toggle"|"choice"|"number"|"text",
  default: true|false|"choiceId"|number|"string",   // safe value, ALWAYS
  choices: [{ id, label }],                          // only for type "choice"
  risky: false,                                      // true => warning MUST be non-null
  warning: null }                                    // FR text shown inline when enabled
```

Rules: options that create requalification risk (exclusivité, horaires imposés) MUST exist only
as `risky: true`, `default: false`, with an explicit `warning`. Mandatory legal mentions
(L441-1 / L441-10: conditions de règlement, taux pénalités, indemnité 40 EUR) are NOT optional:
they are always present in `build()` output, options may only tune their parameters.

## build(data) input

```js
data = {
  profile: { nom, statut, siren, adresse, email, telephone, franchiseTva /* bool */, villeTribunal },
  client:  { nom, siren, adresse, representant },
  fields:  { <fieldId>: value, ... },      // step-2 values for the chosen document
  options: { <optionId>: value, ... },     // step-3 values (toggle => bool)
  today:   "18 juillet 2026"               // formatted date string, provided by the app
}
```

`statut` is one of: "micro" | "ei" | "eurl" | "sasu" | "autre" (app provides a select).
If `profile.franchiseTva` is true, `build()` MUST include the mention
"TVA non applicable, art. 293 B du CGI" wherever prices are stated.

## build(data) output

```js
{
  title: "Conditions générales de vente",           // document H1
  subtitle: "Prestations de services entre professionnels", // or null
  sections: [ { heading: "Article 1 - Objet", paragraphs: ["...", "..."] }, ... ],
  footerMentions: ["mention B2B", "identité prestataire", ...] // WITHOUT the disclaimer:
}                                                   // the app always appends window.CONTRATS_TEMPLATES.disclaimer
```

Paragraphs are plain text strings (no HTML). Article numbering is included in `heading` by clauses.js.
The NDA template declares a `reciproque` toggle option (default false = unilatéral) and adapts
parties wording in `build()` accordingly.

## V2 additions (fixed by the lead on 2026-07-18, tasks 16-21)

### Clause catalog (add/remove per clause)

Each document template ADDS a `clauses` array declaring every section of the document:

```js
clauses: [
  { id: "penalites", label: "Pénalités de retard et indemnité de recouvrement",
    core: true,               // core:true => ALWAYS included, no toggle shown (noyau légal, disclaimer, parties, objet...)
    default: true,            // for core:false only : included by default or not
    risky: false, warning: null,
    help: "1 phrase FR expliquant la clause ou null" }
]
```

Rules:
- `core: true` for: parties/préambule, objet, prix, conditions de règlement, pénalités + indemnité
  40 EUR (L441-10/D441-5), droit applicable/juridiction, and every mention the RAG lists as
  obligatoire. These NEVER get a toggle in the UI.
- Existing v1 toggle options that enable/disable whole sections (plafondResponsabilite,
  sousTraitance, nonSollicitation, exclusivite, horairesImposes, reciproque...) MIGRATE into
  `clauses` entries (same ids, same defaults, same risky/warning). `options` keeps only PARAMETERS
  (delaiPaiement, tauxPenalites, dureeConfidentialite, preavisResiliation, modaliteFacturation...).
- `build(data)` input gains:
  - `data.clauses`: `{ <clauseId>: bool }` (missing id => the clause's default). Core clauses are
    rendered regardless of this map.
  - `data.customClauses`: `[ { title: "...", text: "..." } ]` (may be empty). build() inserts them,
    in order, as numbered sections immediately BEFORE the final "Droit applicable et juridiction"
    section; `text` is split on blank lines into paragraphs.
- `build(data)` output sections gain `clauseId` (the catalog id, or `"custom-<index>"`); numbering
  stays continuous after removals/insertions.
- Backward compat: if `data.clauses`/`data.customClauses` are undefined (v1 stored state), build()
  behaves exactly like v1 (defaults applied). index.html migrates old localStorage state gracefully.

### Appearance (UI-only, NOT clauses.js concern)

Logo (dataURL), visual template id and accent color live in index.html + localStorage and affect
preview/print/DOCX rendering only. clauses.js stays pure content: no style, no logo, no template.

## Files ownership

- `clauses.js` : teammate legal-content ONLY. No git commands from this teammate.
- `index.html`, `README.md`, `LICENSE`, `.gitignore`, `docx.min.js` : teammate tool-builder ONLY.
- Commits: tool-builder only, explicit `git add <file>` (never `git add -A`).
