# Générateur de contrats freelance

Générateur de **CGV**, **contrats de prestation de services** et **NDA** (accords de
confidentialité) conformes au droit français, pour les relations **entre professionnels
(B2B)**. Un seul fichier HTML, **100 % local, hors-ligne, sans compte et sans envoi de
données sur Internet**.

> Renseigne ton profil freelance une seule fois, choisis un document, personnalise les
> coordonnées du client et les clauses, imprime en PDF ou télécharge en DOCX.

## En 3 clics

1. **Mon profil** : nom / raison sociale, statut, SIREN, adresse, franchise en base de
   TVA, ville du tribunal compétent. Enregistré dans le navigateur, à remplir une fois.
2. **Document + client** : choisis CGV, contrat de prestation ou NDA, puis renseigne les
   coordonnées du client et les informations propres au document (objet, durée, prix…).
3. **Clauses** : ajuste les options (facturation, sous-traitance, non-sollicitation,
   exclusivité…) avec des valeurs sûres pré-sélectionnées, puis imprime en PDF ou
   télécharge en DOCX.

## Pourquoi cet outil

- **Gratuit et sans compte.** Aucune limite, aucun filigrane, aucune clé API.
- **Privé.** Rien n'est envoyé sur un serveur : tout se passe dans le navigateur
  (RGPD by design).
- **Hors-ligne.** Un seul fichier `index.html`, ça marche sans connexion.
- **Conforme droit FR**, sourcé (voir tableau ci-dessous), pas deviné.
- **Open source**, double licence (code MIT + contenu des clauses CC BY 4.0).

## Documents disponibles

| Document | Contenu |
|---|---|
| **CGV de prestation de services (B2B)** | Conditions de règlement, taux des pénalités de retard, indemnité forfaitaire de recouvrement, barème de prix, mention TVA le cas échéant |
| **Contrat de prestation de services** | Objet, durée, prix et paiement, obligations réciproques, propriété intellectuelle / cession de droits, confidentialité, résiliation, responsabilité, sous-traitance, non-sollicitation, juridiction |
| **NDA (accord de confidentialité)** | Unilatéral ou réciproque : définition des informations confidentielles, exclusions, durée, restitution, sanctions |

## Périmètre : B2B uniquement (V1)

Cet outil est **réservé aux relations entre professionnels**. Le B2C (droit de
rétractation, médiateur de la consommation) est explicitement hors périmètre : l'utiliser
pour un client particulier n'apporte pas les protections légales requises dans ce cas.

## Mentions légales couvertes

| Mention | Base légale |
|---|---|
| Conditions de règlement (délais de paiement) | art. L441-1 code de commerce |
| Taux des pénalités de retard | art. L441-10 code de commerce |
| Indemnité forfaitaire de recouvrement (40 €) | art. L441-10 / D441-5 code de commerce |
| Barème des prix unitaires ou méthode de calcul | art. L441-1 code de commerce |
| Mention « TVA non applicable, art. 293 B du CGI » (si franchise en base) | art. 293 B du CGI |
| Cession de droits de propriété intellectuelle (écrite, expresse, délimitée) | code de la propriété intellectuelle |

**Clauses à risque de requalification en salariat** (exclusivité, horaires imposés) :
jamais activées par défaut, avec un avertissement explicite si tu choisis de les inclure.
Sources : voir le RAG juridique interne (economie.gouv.fr, Légifrance, impots.gouv.fr,
Urssaf, bpifrance-creation.fr).

## Disclaimer

> Ce document est un modèle type à personnaliser, fourni à titre informatif. Il ne
> constitue pas une consultation juridique et ne remplace pas l'avis d'un avocat pour
> votre situation particulière.

Ce disclaimer est affiché avant la génération de chaque document et repris en pied de
page du document généré. Un générateur de modèles génériques non personnalisés à un cas
précis échappe au périmètre de la consultation juridique réglementée (loi du 31 décembre
1971) : c'est le principe sur lequel opèrent les modèles gratuits de type
bpifrance-creation / service-public.

## Vie privée

Aucune donnée saisie (profil, client, clauses) ne quitte ton navigateur. Aucune requête
réseau au runtime, aucun compte, aucun cookie de suivi. La persistance se fait uniquement
via le `localStorage` de ton navigateur.

## Prérequis

Un navigateur moderne (Chrome, Edge, Firefox ou Safari récent). Rien d'autre à installer.

## Installation

1. **Le plus simple** : télécharger le fichier [`index.html`](index.html) (bouton « Raw »
   puis enregistrer), puis double-cliquer dessus.
2. **Télécharger le ZIP** : bouton vert *Code* → *Download ZIP*, décompresser,
   double-cliquer sur `index.html`.
3. **Cloner** :
   ```bash
   git clone https://github.com/CustomDigitalServices-Kevin/contrats-freelance.git
   cd contrats-freelance
   # puis ouvrir index.html dans le navigateur
   ```

## Export DOCX

Le bouton **Télécharger DOCX** s'appuie sur la librairie
[dolanmiu/docx](https://github.com/dolanmiu/docx) (MIT), vendorée localement dans
`docx.min.js`. Tant que ce fichier n'est pas présent dans ton dossier, le bouton affiche
un message clair au lieu de générer un faux fichier ; l'export DOCX complet arrive dans
une prochaine étape du build de cet outil.

## Licence

Double licence :

- **Code** (`index.html`, structure de l'outil) : licence **MIT**, voir [`LICENSE`](LICENSE).
- **Contenu des clauses** (`clauses.js`, textes juridiques des modèles) : licence
  **[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/deed.fr)**.

Développé par Kevin Tomas / Custom Digital Services.
