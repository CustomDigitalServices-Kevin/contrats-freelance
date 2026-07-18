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

## Files ownership

- `clauses.js` : teammate legal-content ONLY. No git commands from this teammate.
- `index.html`, `README.md`, `LICENSE`, `.gitignore`, `docx.min.js` : teammate tool-builder ONLY.
- Commits: tool-builder only, explicit `git add <file>` (never `git add -A`).
