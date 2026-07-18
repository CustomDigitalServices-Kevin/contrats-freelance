/*
 * Contenu juridique du générateur de contrats freelance (CGV, contrat de prestation, NDA).
 * Pur JavaScript ES2017, sans dépendance. Exécutable en navigateur (window.CONTRATS_TEMPLATES)
 * et en Node (module.exports) pour les tests.
 *
 * Base juridique : Vault_Projets/Outils Locaux/generateur-contrats-freelance-legal.md (2026-07-18, V1 + V2).
 * Contrat d'interface figé : tools/contrats-generator/CONTRACT.md (2026-07-18, V1 + V2 additions).
 */

if (typeof window === "undefined") {
  if (typeof global !== "undefined") {
    global.window = global;
  }
}

// ---------------------------------------------------------------------------
// Helpers communs
// ---------------------------------------------------------------------------

function formatSiren(siren) {
  if (!siren) return "";
  var digits = String(siren).replace(/\D/g, "");
  return digits.replace(/(\d{3})(?=\d)/g, "$1 ").trim();
}

function statutLabel(statut) {
  switch (statut) {
    case "micro":
      return "micro-entrepreneur";
    case "ei":
      return "entrepreneur individuel";
    case "eurl":
      return "EURL";
    case "sasu":
      return "SASU";
    default:
      return "professionnel indépendant";
  }
}

function tvaMention(profile) {
  return profile.franchiseTva
    ? "TVA non applicable, art. 293 B du CGI"
    : "TVA en sus au taux légal en vigueur au jour de la facturation";
}

function tribunalCompetent(profile) {
  var ville =
    profile.villeTribunal && String(profile.villeTribunal).trim() !== ""
      ? String(profile.villeTribunal).trim()
      : null;
  return ville
    ? "tribunal de commerce de " + ville
    : "tribunal de commerce du siège du Prestataire";
}

function prestataireIdentite(profile) {
  return (
    profile.nom +
    ", " +
    statutLabel(profile.statut) +
    ", immatriculé sous le numéro SIREN " +
    formatSiren(profile.siren) +
    ", dont le siège est situé " +
    profile.adresse
  );
}

function clientIdentite(client) {
  var siren = client.siren ? "immatriculé sous le numéro SIREN " + formatSiren(client.siren) + ", " : "";
  var representant = client.representant
    ? "représenté par " + client.representant
    : "représenté par son représentant légal";
  return client.nom + ", " + siren + "dont le siège est situé " + client.adresse + ", " + representant;
}

function footerCommun(profile, today) {
  return [
    "Document réservé aux relations entre professionnels (B2B), à l'exclusion de toute relation avec un consommateur.",
    profile.nom +
      " — " +
      statutLabel(profile.statut) +
      " — SIREN " +
      formatSiren(profile.siren) +
      " — " +
      profile.adresse,
    "Contact : " + profile.email + (profile.telephone ? " — " + profile.telephone : ""),
    "Document établi le " + today + "."
  ];
}

function escompteMention(fields) {
  var taux = fields && fields.escompte;
  if (taux != null && taux !== "" && Number(taux) > 0) {
    return (
      "Un escompte de " + taux + " % est accordé au Client pour tout paiement anticipé par rapport à l'échéance convenue."
    );
  }
  return "Aucun escompte n'est accordé en cas de paiement anticipé.";
}

// ---------------------------------------------------------------------------
// V2 — moteur générique du catalogue de clauses
// ---------------------------------------------------------------------------

function isClauseOn(catalog, clauseId, dataClauses) {
  var entry = null;
  for (var i = 0; i < catalog.length; i++) {
    if (catalog[i].id === clauseId) {
      entry = catalog[i];
      break;
    }
  }
  if (!entry) return false;
  if (entry.core) return true;
  if (dataClauses && Object.prototype.hasOwnProperty.call(dataClauses, clauseId)) {
    return dataClauses[clauseId] === true;
  }
  return entry.default === true;
}

// entries : liste ordonnée de { clauseId, heading, paragraphs }, la DERNIÈRE entrée devant
// toujours être "Droit applicable et juridiction". customClauses sont insérées juste avant elle.
function assembleDocument(title, subtitle, entries, customClauses, footerMentions) {
  var list = entries.slice();
  var juridiction = list.pop();

  (customClauses || []).forEach(function (cc, index) {
    if (!cc || !cc.text) return;
    var paragraphs = String(cc.text)
      .split(/\n\s*\n/)
      .map(function (p) {
        return p.trim();
      })
      .filter(function (p) {
        return p.length > 0;
      });
    if (paragraphs.length === 0) return;
    list.push({
      clauseId: "custom-" + index,
      heading: cc.title || "Clause complémentaire",
      paragraphs: paragraphs
    });
  });

  list.push(juridiction);

  var sections = list.map(function (entry, i) {
    return {
      clauseId: entry.clauseId,
      heading: "Article " + (i + 1) + " - " + entry.heading,
      paragraphs: entry.paragraphs
    };
  });

  return { title: title, subtitle: subtitle, sections: sections, footerMentions: footerMentions };
}

// ---------------------------------------------------------------------------
// Document 1 — CGV de prestation de services B2B
// ---------------------------------------------------------------------------

var cgvClausesCatalog = [
  { id: "parties", label: "Objet et champ d'application", core: true, default: true, risky: false, warning: null, help: null },
  { id: "devis", label: "Devis et commande", core: true, default: true, risky: false, warning: null, help: null },
  { id: "prix", label: "Prix", core: true, default: true, risky: false, warning: null, help: null },
  {
    id: "conditionsReglement",
    label: "Conditions de règlement (délai de paiement et escompte)",
    core: true,
    default: true,
    risky: false,
    warning: null,
    help: "Mention obligatoire (art. L441-1) : inclut désormais les conditions d'escompte."
  },
  {
    id: "penalites",
    label: "Pénalités de retard et indemnité de recouvrement",
    core: true,
    default: true,
    risky: false,
    warning: null,
    help: null
  },
  { id: "obligationsPrestataire", label: "Obligations du Prestataire", core: true, default: true, risky: false, warning: null, help: null },
  { id: "obligationsClient", label: "Obligations du Client", core: true, default: true, risky: false, warning: null, help: null },
  { id: "proprieteIntellectuelle", label: "Propriété intellectuelle", core: true, default: true, risky: false, warning: null, help: null },
  {
    id: "acompte",
    label: "Acompte à la commande",
    core: false,
    default: false,
    risky: false,
    warning: null,
    help: "Prévoit la possibilité de demander un acompte au Client à la commande."
  },
  {
    id: "revisionPrix",
    label: "Révision annuelle des prix",
    core: false,
    default: false,
    risky: false,
    warning: null,
    help: "Indexe le prix sur un indice public en lien direct avec l'activité du Prestataire (art. L112-2 code monétaire et financier)."
  },
  {
    id: "reservePropriete",
    label: "Réserve de propriété (supports matériels/numériques)",
    core: false,
    default: false,
    risky: false,
    warning: null,
    help: "Réserve la propriété des supports remis (clés USB, équipements) jusqu'au paiement intégral (art. 2367 code civil)."
  },
  {
    id: "plafondResponsabilite",
    label: "Plafonner la responsabilité au montant des sommes versées",
    core: false,
    default: true,
    risky: false,
    warning: null,
    help: "L'article Responsabilité reste toujours présent ; cette option n'en change que le contenu (plafond ou droit commun)."
  },
  { id: "forceMajeure", label: "Force majeure", core: true, default: true, risky: false, warning: null, help: null },
  { id: "resiliation", label: "Résiliation", core: true, default: true, risky: false, warning: null, help: null },
  {
    id: "mediationAmiable",
    label: "Règlement amiable et médiation préalable",
    core: false,
    default: false,
    risky: false,
    warning: null,
    help: "Impose une tentative de résolution amiable avant toute action judiciaire (art. 1530 code de procédure civile)."
  },
  { id: "donneesPersonnelles", label: "Données personnelles", core: true, default: true, risky: false, warning: null, help: null },
  { id: "droitApplicable", label: "Droit applicable et juridiction", core: true, default: true, risky: false, warning: null, help: null }
];

var cgvDocument = {
  id: "cgv",
  label: "CGV de prestation de services (B2B)",
  description: "Conditions générales de vente pour prestations de services entre professionnels.",
  fields: [
    {
      id: "escompte",
      label: "Taux d'escompte pour paiement anticipé (%)",
      type: "number",
      placeholder: null,
      required: false,
      help: "Laissez vide si aucun escompte n'est accordé"
    }
  ],
  clauses: cgvClausesCatalog,
  options: [
    {
      id: "delaiPaiement",
      label: "Délai de paiement (jours)",
      help: "Délai à compter de la date d'émission de la facture, conformément à l'article L441-1 du code de commerce.",
      type: "number",
      default: 30,
      risky: false,
      warning: null
    },
    {
      id: "tauxPenalites",
      label: "Taux des pénalités de retard",
      help: "Taux applicable de plein droit en cas de retard de paiement (art. L441-10 du code de commerce).",
      type: "choice",
      default: "bce10",
      choices: [
        { id: "bce10", label: "Taux BCE + 10 points" },
        { id: "legal3x", label: "3 fois le taux d'intérêt légal" }
      ],
      risky: false,
      warning: null
    },
    {
      id: "tauxAcompte",
      label: "Taux d'acompte à la commande (%)",
      help: "À adapter à votre pratique",
      type: "number",
      default: 30,
      risky: false,
      warning: null
    }
  ],
  build: function (data) {
    var profile = data.profile;
    var fields = data.fields || {};
    var options = data.options || {};
    var dataClauses = data.clauses;
    var today = data.today;

    var delaiPaiement = options.delaiPaiement != null ? options.delaiPaiement : 30;
    var tauxPenalitesTexte =
      options.tauxPenalites === "legal3x"
        ? "trois fois le taux d'intérêt légal en vigueur"
        : "le taux d'intérêt appliqué par la Banque centrale européenne à son opération de refinancement la plus récente, majoré de 10 points";
    var tauxAcompte = options.tauxAcompte != null ? options.tauxAcompte : 30;
    var plafondOn = isClauseOn(cgvClausesCatalog, "plafondResponsabilite", dataClauses);
    var prixMention = tvaMention(profile);
    var tribunal = tribunalCompetent(profile);

    var entries = [
      {
        clauseId: "parties",
        heading: "Objet et champ d'application",
        paragraphs: [
          "Les présentes conditions générales de vente (ci-après « les CGV ») régissent exclusivement les relations commerciales entre " +
            prestataireIdentite(profile) +
            " (ci-après « le Prestataire ») et tout client agissant en qualité de professionnel (ci-après « le Client »). Le présent document est réservé aux relations entre professionnels (B2B) et exclut toute application des dispositions protectrices du droit de la consommation.",
          "Toute prestation commandée auprès du Prestataire implique l'adhésion sans réserve du Client aux présentes CGV, qui prévalent sur tout document émanant du Client, notamment ses conditions générales d'achat, sauf dérogation expresse et écrite préalable du Prestataire."
        ]
      },
      {
        clauseId: "devis",
        heading: "Devis et commande",
        paragraphs: [
          "Chaque prestation fait l'objet d'un devis écrit préalable détaillant la nature des prestations, leur prix et leurs modalités d'exécution. La commande est réputée ferme à compter de l'acceptation écrite du devis par le Client, par signature, bon pour accord ou tout autre moyen écrit équivalent.",
          "Toute modification du périmètre demandée par le Client après acceptation du devis fait l'objet d'un avenant écrit et peut donner lieu à un ajustement du prix et des délais convenus."
        ]
      },
      {
        clauseId: "prix",
        heading: "Prix",
        paragraphs: [
          "Les prix des prestations sont ceux indiqués au devis accepté par le Client, établis selon le barème du Prestataire ou, à défaut, selon la méthode de calcul précisée au devis (temps passé, forfait ou régie). " +
            prixMention +
            ".",
          "Toute réduction de prix éventuellement consentie par le Prestataire, sous forme de remise, rabais ou ristourne, est mentionnée expressément sur le devis ou sur la facture correspondante."
        ]
      }
    ];

    if (isClauseOn(cgvClausesCatalog, "acompte", dataClauses)) {
      entries.push({
        clauseId: "acompte",
        heading: "Acompte",
        paragraphs: [
          "Le Prestataire peut exiger un acompte de " +
            tauxAcompte +
            " % du prix total à la commande, le solde étant dû selon les conditions de règlement fixées à l'article consacré aux conditions de règlement."
        ]
      });
    }

    if (isClauseOn(cgvClausesCatalog, "revisionPrix", dataClauses)) {
      entries.push({
        clauseId: "revisionPrix",
        heading: "Révision des prix",
        paragraphs: [
          "Le prix convenu peut être révisé annuellement selon la variation de l'indice Syntec publié par l'Institut national de la statistique et des études économiques (Insee), ou tout autre indice ayant un lien direct avec l'activité du Prestataire, conformément à l'article L112-2 du code monétaire et financier."
        ]
      });
    }

    entries.push({
      clauseId: "conditionsReglement",
      heading: "Conditions de règlement",
      paragraphs: [
        "Sauf stipulation contraire du devis, les factures sont payables à " +
          delaiPaiement +
          " jours à compter de leur date d'émission, conformément à l'article L441-1 du code de commerce.",
        escompteMention(fields),
        "Le règlement s'effectue par virement bancaire aux coordonnées communiquées par le Prestataire, ou par tout autre moyen de paiement convenu entre les parties."
      ]
    });

    entries.push({
      clauseId: "penalites",
      heading: "Pénalités de retard et indemnité de recouvrement",
      paragraphs: [
        "Conformément aux articles L441-10 et D441-5 du code de commerce, tout retard de paiement entraîne de plein droit, sans qu'une mise en demeure préalable soit nécessaire, l'application d'une pénalité calculée sur la base de " +
          tauxPenalitesTexte +
          ".",
        "Tout retard de paiement donne également lieu, de plein droit, au paiement d'une indemnité forfaitaire pour frais de recouvrement de 40 euros, sans préjudice d'une indemnisation complémentaire sur justificatifs lorsque les frais de recouvrement effectivement exposés sont supérieurs à ce montant."
      ]
    });

    entries.push({
      clauseId: "obligationsPrestataire",
      heading: "Obligations du Prestataire",
      paragraphs: [
        "Le Prestataire s'engage à exécuter les prestations commandées avec diligence et conformément aux règles de l'art de sa profession. Le Prestataire est tenu à une obligation de moyens et non de résultat, sauf stipulation contraire expresse figurant au devis."
      ]
    });

    entries.push({
      clauseId: "obligationsClient",
      heading: "Obligations du Client",
      paragraphs: [
        "Le Client s'engage à fournir au Prestataire, en temps utile, toutes les informations, documents et accès nécessaires à la bonne exécution de la prestation, et à régler le prix convenu dans les conditions et délais fixés à l'article consacré aux conditions de règlement."
      ]
    });

    entries.push({
      clauseId: "proprieteIntellectuelle",
      heading: "Propriété intellectuelle",
      paragraphs: [
        "Les livrables réalisés par le Prestataire dans le cadre de la prestation demeurent sa propriété jusqu'au paiement intégral du prix convenu. La cession des droits de propriété intellectuelle afférents aux livrables au profit du Client n'intervient qu'à compter de ce paiement intégral et porte exclusivement sur les droits, l'étendue, la destination et la durée expressément précisés au devis, ou à défaut sur un usage professionnel du Client limité à ses besoins propres."
      ]
    });

    if (isClauseOn(cgvClausesCatalog, "reservePropriete", dataClauses)) {
      entries.push({
        clauseId: "reservePropriete",
        heading: "Réserve de propriété",
        paragraphs: [
          "Les supports matériels ou numériques (clés USB, équipements, médias de stockage) remis au Client dans le cadre de la prestation demeurent la propriété du Prestataire jusqu'au paiement intégral du prix convenu, conformément à l'article 2367 du code civil. Cette réserve de propriété est sans effet sur les droits de propriété intellectuelle afférents aux livrables, régis par l'article consacré à la propriété intellectuelle."
        ]
      });
    }

    entries.push({
      clauseId: "plafondResponsabilite",
      heading: "Responsabilité",
      paragraphs: plafondOn
        ? [
            "La responsabilité du Prestataire au titre de l'exécution des prestations est limitée, tous préjudices confondus, au montant total des sommes effectivement versées par le Client au titre de la prestation concernée.",
            "En tout état de cause, le Prestataire ne saurait être tenu responsable des dommages indirects tels que perte d'exploitation, perte de données ou préjudice commercial."
          ]
        : [
            "La responsabilité du Prestataire est engagée dans les conditions de droit commun, sans plafonnement contractuel.",
            "En tout état de cause, le Prestataire ne saurait être tenu responsable des dommages indirects tels que perte d'exploitation, perte de données ou préjudice commercial."
          ]
    });

    entries.push({
      clauseId: "forceMajeure",
      heading: "Force majeure",
      paragraphs: [
        "Aucune des parties ne pourra être tenue responsable de l'inexécution ou du retard dans l'exécution de ses obligations résultant d'un cas de force majeure au sens de l'article 1218 du code civil et de la jurisprudence des juridictions françaises."
      ]
    });

    entries.push({
      clauseId: "resiliation",
      heading: "Résiliation",
      paragraphs: [
        "En cas de manquement grave de l'une des parties à ses obligations, non réparé dans un délai de 15 jours suivant une mise en demeure restée sans effet, l'autre partie pourra résilier la prestation en cours de plein droit, sans préjudice de tout dommage et intérêt éventuel."
      ]
    });

    if (isClauseOn(cgvClausesCatalog, "mediationAmiable", dataClauses)) {
      entries.push({
        clauseId: "mediationAmiable",
        heading: "Règlement amiable et médiation",
        paragraphs: [
          "Avant toute action judiciaire, les parties s'engagent à tenter de résoudre à l'amiable, y compris par voie de médiation conventionnelle au sens de l'article 1530 du code de procédure civile, tout différend né de l'interprétation ou de l'exécution des présentes CGV, pendant un délai de 30 jours à compter de sa notification écrite par la partie la plus diligente."
        ]
      });
    }

    entries.push({
      clauseId: "donneesPersonnelles",
      heading: "Données personnelles",
      paragraphs: [
        "Dans le cadre de l'exécution de la prestation, le Prestataire peut être amené à traiter des données à caractère personnel du Client ou de ses représentants, dans le respect du règlement (UE) 2016/679 (RGPD) et de la loi n° 78-17 du 6 janvier 1978 modifiée. Pour toute question relative à ce traitement, le Client peut contacter le Prestataire aux coordonnées suivantes : " +
          profile.email +
          (profile.telephone ? ", " + profile.telephone : "") +
          "."
      ]
    });

    entries.push({
      clauseId: "droitApplicable",
      heading: "Droit applicable et juridiction",
      paragraphs: [
        "Les présentes CGV sont soumises au droit français. En cas de litige né de leur interprétation ou de leur exécution, et à défaut de résolution amiable, compétence exclusive est attribuée au " +
          tribunal +
          ", y compris en cas de pluralité de défendeurs ou d'appel en garantie."
      ]
    });

    return assembleDocument(
      "Conditions générales de vente",
      "Prestations de services entre professionnels (B2B)",
      entries,
      data.customClauses,
      footerCommun(profile, today)
    );
  }
};

// ---------------------------------------------------------------------------
// Document 2 — Contrat de prestation de services
// ---------------------------------------------------------------------------

var prestationClausesCatalog = [
  { id: "parties", label: "Parties et préambule", core: true, default: true, risky: false, warning: null, help: null },
  { id: "objet", label: "Objet", core: true, default: true, risky: false, warning: null, help: null },
  { id: "duree", label: "Durée", core: true, default: true, risky: false, warning: null, help: null },
  {
    id: "independance",
    label: "Obligations réciproques et indépendance des parties",
    core: true,
    default: true,
    risky: false,
    warning: null,
    help: null
  },
  {
    id: "prixPaiement",
    label: "Prix et paiement (délai et escompte)",
    core: true,
    default: true,
    risky: false,
    warning: null,
    help: "Mention obligatoire (art. L441-1) : inclut désormais les conditions d'escompte."
  },
  {
    id: "acompte",
    label: "Acompte à la signature",
    core: false,
    default: false,
    risky: false,
    warning: null,
    help: "Prévoit le versement d'un acompte à la signature du Contrat."
  },
  {
    id: "indexation",
    label: "Indexation du prix",
    core: false,
    default: false,
    risky: false,
    warning: null,
    help: "Indexe le prix sur un indice public en lien direct avec l'activité du Prestataire (art. L112-2 code monétaire et financier)."
  },
  { id: "penalites", label: "Pénalités de retard et indemnité de recouvrement", core: true, default: true, risky: false, warning: null, help: null },
  {
    id: "clausePenale",
    label: "Clause pénale (retard de livraison)",
    core: false,
    default: false,
    risky: false,
    warning: null,
    help: "Montant indicatif, à adapter au contrat ; le juge peut le réviser (art. 1231-5 code civil)."
  },
  { id: "proprieteIntellectuelle", label: "Propriété intellectuelle", core: true, default: true, risky: false, warning: null, help: null },
  { id: "confidentialite", label: "Confidentialité", core: true, default: true, risky: false, warning: null, help: null },
  {
    id: "garantie",
    label: "Garantie de conformité des livrables",
    core: false,
    default: true,
    risky: false,
    warning: null,
    help: null
  },
  {
    id: "maintenanceSupport",
    label: "Maintenance et support post-livraison",
    core: false,
    default: false,
    risky: false,
    warning: null,
    help: null
  },
  {
    id: "reversibilite",
    label: "Réversibilité en fin de contrat",
    core: false,
    default: false,
    risky: false,
    warning: null,
    help: null
  },
  {
    id: "sousTraitance",
    label: "Autoriser la sous-traitance",
    core: false,
    default: true,
    risky: false,
    warning: null,
    help: "Le Prestataire peut sous-traiter tout ou partie de la mission, à charge d'en informer le Client."
  },
  {
    id: "nonSollicitation",
    label: "Clause de non-sollicitation du personnel (12 mois)",
    core: false,
    default: true,
    risky: false,
    warning: null,
    help: "Interdit à chaque partie de débaucher le personnel de l'autre pendant 12 mois après la fin du contrat."
  },
  {
    id: "exclusivite",
    label: "Exclusivité au profit du Client",
    core: false,
    default: false,
    risky: true,
    warning:
      "Risque de requalification du contrat en contrat de travail : une exclusivité imposée au Prestataire est un indice de lien de subordination retenu par l'Urssaf et les tribunaux.",
    help: "Le Prestataire s'engage à ne pas intervenir pour des tiers pendant la durée du contrat."
  },
  {
    id: "nonConcurrence",
    label: "Non-concurrence post-contrat",
    core: false,
    default: false,
    risky: true,
    warning:
      "Cette clause doit rester proportionnée (durée, zone géographique et activité limitées) ; en B2B, elle n'implique pas de contrepartie financière obligatoire (règle propre au droit du travail).",
    help: null
  },
  {
    id: "horairesImposes",
    label: "Présence à horaires imposés par le Client",
    core: false,
    default: false,
    risky: true,
    warning:
      "Risque de requalification en salariat : des horaires imposés et un contrôle permanent de l'exécution sont des critères caractéristiques du lien de subordination retenus par l'Urssaf.",
    help: null
  },
  { id: "assuranceRCPro", label: "Assurance responsabilité civile professionnelle", core: true, default: true, risky: false, warning: null, help: null },
  {
    id: "cessionContrat",
    label: "Cession du contrat",
    core: false,
    default: false,
    risky: false,
    warning: null,
    help: "Autorise la cession du Contrat à un tiers sous réserve de l'accord écrit préalable de l'autre partie (art. 1216 code civil)."
  },
  {
    id: "referenceClient",
    label: "Référence client / portfolio",
    core: false,
    default: false,
    risky: false,
    warning: null,
    help: "Autorise le Prestataire à mentionner le Client comme référence, sauf opposition écrite."
  },
  {
    id: "integraliteDivisibilite",
    label: "Intégralité de l'accord et divisibilité",
    core: false,
    default: true,
    risky: false,
    warning: null,
    help: null
  },
  { id: "resiliation", label: "Résiliation", core: true, default: true, risky: false, warning: null, help: null },
  {
    id: "mediationPrealable",
    label: "Règlement amiable et médiation préalable",
    core: false,
    default: false,
    risky: false,
    warning: null,
    help: "Impose une tentative de résolution amiable avant toute action judiciaire (art. 1530 code de procédure civile)."
  },
  { id: "forceMajeure", label: "Force majeure", core: true, default: true, risky: false, warning: null, help: null },
  { id: "donneesPersonnelles", label: "Données personnelles", core: true, default: true, risky: false, warning: null, help: null },
  { id: "droitApplicable", label: "Droit applicable et juridiction", core: true, default: true, risky: false, warning: null, help: null }
];

var prestationDocument = {
  id: "prestation",
  label: "Contrat de prestation de services",
  description: "Contrat encadrant une mission de prestation de services entre professionnels.",
  fields: [
    {
      id: "objet",
      label: "Objet de la mission",
      type: "textarea",
      placeholder: "Décrivez la nature de la mission confiée au Prestataire",
      required: true,
      help: null
    },
    {
      id: "dureeFin",
      label: "Date de fin de la mission",
      type: "date",
      placeholder: null,
      required: false,
      help: "Laissez vide si la mission est ponctuelle, sans terme calendaire fixé à l'avance"
    },
    {
      id: "prix",
      label: "Prix de la prestation (HT)",
      type: "number",
      placeholder: "Montant en euros",
      required: true,
      help: "Montant hors taxes, hors modalité de facturation précisée à l'étape suivante"
    },
    {
      id: "escompte",
      label: "Taux d'escompte pour paiement anticipé (%)",
      type: "number",
      placeholder: null,
      required: false,
      help: "Laissez vide si aucun escompte n'est accordé"
    }
  ],
  clauses: prestationClausesCatalog,
  options: [
    {
      id: "modaliteFacturation",
      label: "Modalité de facturation",
      help: null,
      type: "choice",
      default: "forfait",
      choices: [
        { id: "forfait", label: "Forfait" },
        { id: "regie", label: "Régie (temps passé)" }
      ],
      risky: false,
      warning: null
    },
    {
      id: "delaiPaiement",
      label: "Délai de paiement (jours)",
      help: "Délai à compter de la date d'émission de la facture.",
      type: "number",
      default: 30,
      risky: false,
      warning: null
    },
    {
      id: "preavisResiliation",
      label: "Préavis de résiliation (jours)",
      help: null,
      type: "number",
      default: 30,
      risky: false,
      warning: null
    },
    {
      id: "tauxAcompte",
      label: "Taux d'acompte à la signature (%)",
      help: "À adapter à votre pratique",
      type: "number",
      default: 30,
      risky: false,
      warning: null
    },
    {
      id: "montantPenaliteRetard",
      label: "Pénalité de retard de livraison (EUR/jour)",
      help: "Montant indicatif, à adapter au contrat ; le juge peut le réviser (art. 1231-5).",
      type: "number",
      default: 50,
      risky: false,
      warning: null
    },
    {
      id: "dureeNonConcurrence",
      label: "Durée de la non-concurrence (mois)",
      help: "À ajuster selon la mission ; doit rester proportionnée.",
      type: "number",
      default: 12,
      risky: false,
      warning: null
    }
  ],
  build: function (data) {
    var profile = data.profile;
    var client = data.client;
    var fields = data.fields || {};
    var options = data.options || {};
    var dataClauses = data.clauses;
    var today = data.today;

    var objet = fields.objet;
    var dureeFin = fields.dureeFin;
    var prix = fields.prix;
    var modaliteTexte =
      options.modaliteFacturation === "regie"
        ? "en régie, sur la base du temps effectivement passé"
        : "au forfait, pour un montant global et forfaitaire";
    var delaiPaiement = options.delaiPaiement != null ? options.delaiPaiement : 30;
    var preavis = options.preavisResiliation != null ? options.preavisResiliation : 30;
    var tauxAcompte = options.tauxAcompte != null ? options.tauxAcompte : 30;
    var montantPenaliteRetard = options.montantPenaliteRetard != null ? options.montantPenaliteRetard : 50;
    var dureeNonConcurrence = options.dureeNonConcurrence != null ? options.dureeNonConcurrence : 12;
    var sousTraitanceOn = isClauseOn(prestationClausesCatalog, "sousTraitance", dataClauses);
    var nonSollicitationOn = isClauseOn(prestationClausesCatalog, "nonSollicitation", dataClauses);
    var exclusiviteOn = isClauseOn(prestationClausesCatalog, "exclusivite", dataClauses);
    var horairesOn = isClauseOn(prestationClausesCatalog, "horairesImposes", dataClauses);
    var tribunal = tribunalCompetent(profile);

    var independanceParagraphs = [
      "Le Prestataire exécute sa mission en toute indépendance, sans lien de subordination avec le Client. Il organise librement son travail, détermine ses méthodes et ses outils de travail, et n'est soumis à aucune directive contraignante ni à aucun contrôle permanent du Client quant aux modalités d'exécution de sa prestation.",
      "Le Client s'engage à fournir au Prestataire les informations et éléments nécessaires à la bonne exécution de la mission et à régler le prix convenu dans les conditions fixées à l'article consacré au prix et au paiement."
    ];
    if (exclusiviteOn) {
      independanceParagraphs.push(
        "Par dérogation au principe d'indépendance énoncé ci-dessus, le Prestataire consent au Client une exclusivité pour la durée du présent contrat, dans les conditions convenues entre les parties. Les parties reconnaissent que cette clause accroît le risque de requalification du présent contrat en contrat de travail et déclarent l'avoir accepté en connaissance de cause."
      );
    }
    if (horairesOn) {
      independanceParagraphs.push(
        "Le Prestataire convient d'assurer sa présence selon des horaires déterminés par le Client. Les parties reconnaissent que cette modalité accroît le risque de requalification du présent contrat en contrat de travail et déclarent l'avoir accepté en connaissance de cause."
      );
    }

    var entries = [
      {
        clauseId: "parties",
        heading: "Parties et préambule",
        paragraphs: [
          "Le présent contrat de prestation de services (ci-après « le Contrat ») est conclu entre " +
            prestataireIdentite(profile) +
            " (ci-après « le Prestataire »), et " +
            clientIdentite(client) +
            " (ci-après « le Client »).",
          "Le présent Contrat est réservé aux relations entre professionnels (B2B) et exclut toute application des dispositions protectrices du droit de la consommation."
        ]
      },
      {
        clauseId: "objet",
        heading: "Objet",
        paragraphs: [
          "Le Prestataire s'engage à réaliser au profit du Client la mission suivante : " + objet + "."
        ]
      },
      {
        clauseId: "duree",
        heading: "Durée",
        paragraphs: dureeFin
          ? [
              "Le présent Contrat prend effet à sa date de signature et se poursuit jusqu'au " +
                dureeFin +
                ", sauf résiliation anticipée dans les conditions prévues à l'article consacré à la résiliation."
            ]
          : [
              "Le présent Contrat est conclu pour une mission ponctuelle, sans terme calendaire fixé à l'avance ; il prend fin à l'achèvement de la mission décrite à l'article consacré à l'objet."
            ]
      },
      {
        clauseId: "independance",
        heading: "Obligations réciproques et indépendance des parties",
        paragraphs: independanceParagraphs
      }
    ];

    if (isClauseOn(prestationClausesCatalog, "acompte", dataClauses)) {
      entries.push({
        clauseId: "acompte",
        heading: "Acompte",
        paragraphs: [
          "Le Client verse au Prestataire, à la signature du Contrat, un acompte de " +
            tauxAcompte +
            " % du prix total, le solde étant dû selon les conditions fixées à l'article consacré au prix et au paiement."
        ]
      });
    }

    if (isClauseOn(prestationClausesCatalog, "indexation", dataClauses)) {
      entries.push({
        clauseId: "indexation",
        heading: "Indexation du prix",
        paragraphs: [
          "Le prix convenu peut être révisé selon la variation de l'indice Syntec publié par l'Insee, ou tout autre indice ayant un lien direct avec l'activité du Prestataire, conformément à l'article L112-2 du code monétaire et financier."
        ]
      });
    }

    entries.push({
      clauseId: "prixPaiement",
      heading: "Prix et paiement",
      paragraphs: [
        "La prestation est facturée " +
          modaliteTexte +
          ", pour un prix de " +
          prix +
          " euros hors taxes. " +
          tvaMention(profile) +
          ".",
        "Sauf stipulation contraire, les factures sont payables à " +
          delaiPaiement +
          " jours à compter de leur date d'émission, conformément à l'article L441-1 du code de commerce.",
        escompteMention(fields)
      ]
    });

    entries.push({
      clauseId: "penalites",
      heading: "Pénalités de retard et indemnité de recouvrement",
      paragraphs: [
        "Conformément aux articles L441-10 et D441-5 du code de commerce, tout retard de paiement entraîne de plein droit l'application d'une pénalité calculée sur la base du taux d'intérêt appliqué par la Banque centrale européenne à son opération de refinancement la plus récente, majoré de 10 points, ainsi qu'une indemnité forfaitaire pour frais de recouvrement de 40 euros, sans préjudice d'une indemnisation complémentaire sur justificatifs."
      ]
    });

    if (isClauseOn(prestationClausesCatalog, "clausePenale", dataClauses)) {
      entries.push({
        clauseId: "clausePenale",
        heading: "Clause pénale",
        paragraphs: [
          "Tout retard imputable au Prestataire dans la livraison des livrables peut donner lieu à une pénalité forfaitaire de " +
            montantPenaliteRetard +
            " euros par jour de retard, sans que ce montant ne fasse obstacle au pouvoir du juge de la modérer ou de l'augmenter d'office si elle est manifestement excessive ou dérisoire, conformément à l'article 1231-5 du code civil, toute stipulation contraire étant réputée non écrite."
        ]
      });
    }

    entries.push({
      clauseId: "proprieteIntellectuelle",
      heading: "Propriété intellectuelle",
      paragraphs: [
        "Les droits de propriété intellectuelle afférents aux livrables produits par le Prestataire dans le cadre de la mission sont cédés au Client de manière expresse, écrite et délimitée : l'étendue de la cession porte sur les droits de reproduction, de représentation et d'adaptation ; sa destination est l'usage professionnel du Client dans le cadre de son activité ; son territoire est le territoire français, sauf stipulation contraire au devis ; sa durée correspond à la durée légale de protection des droits concernés. Cette cession ne prend effet qu'à compter du paiement intégral du prix convenu."
      ]
    });

    entries.push({
      clauseId: "confidentialite",
      heading: "Confidentialité",
      paragraphs: [
        "Chaque partie s'engage à garder confidentielles toutes les informations de nature technique, commerciale ou financière dont elle aurait connaissance à l'occasion de l'exécution du présent Contrat, et à ne les utiliser qu'aux fins de son exécution, pendant toute sa durée et pendant une durée de 3 ans après son terme."
      ]
    });

    if (isClauseOn(prestationClausesCatalog, "garantie", dataClauses)) {
      entries.push({
        clauseId: "garantie",
        heading: "Garantie de conformité des livrables",
        paragraphs: [
          "Le Prestataire garantit la conformité des livrables aux spécifications convenues et s'engage à corriger, dans un délai raisonnable, toute non-conformité signalée par le Client dans les 30 jours suivant la livraison."
        ]
      });
    }

    if (isClauseOn(prestationClausesCatalog, "maintenanceSupport", dataClauses)) {
      entries.push({
        clauseId: "maintenanceSupport",
        heading: "Maintenance et support",
        paragraphs: [
          "Une prestation de maintenance ou de support peut être fournie après livraison, selon les modalités, la durée et le prix précisés au devis correspondant."
        ]
      });
    }

    if (isClauseOn(prestationClausesCatalog, "reversibilite", dataClauses)) {
      entries.push({
        clauseId: "reversibilite",
        heading: "Réversibilité",
        paragraphs: [
          "En fin de contrat, quelle qu'en soit la cause, le Prestataire restitue au Client les données et accès nécessaires à la poursuite de son activité et lui apporte une assistance raisonnable à la transition vers un nouveau prestataire, dans des conditions à préciser d'un commun accord."
        ]
      });
    }

    entries.push({
      clauseId: "sousTraitance",
      heading: "Sous-traitance",
      paragraphs: sousTraitanceOn
        ? [
            "Le Prestataire est autorisé à sous-traiter tout ou partie de l'exécution de la mission, à charge d'en informer préalablement le Client et de demeurer seul responsable envers celui-ci de la bonne exécution de la prestation."
          ]
        : [
            "Le Prestataire exécute personnellement la mission et ne peut recourir à la sous-traitance sans l'accord écrit préalable du Client."
          ]
    });

    entries.push({
      clauseId: "nonSollicitation",
      heading: "Non-sollicitation du personnel",
      paragraphs: nonSollicitationOn
        ? [
            "Pendant la durée du Contrat et pendant une durée de 12 mois suivant son terme, chaque partie s'interdit de solliciter, débaucher ou employer, directement ou indirectement, tout salarié ou collaborateur de l'autre partie ayant été impliqué dans l'exécution du présent Contrat, sauf accord écrit préalable de la partie concernée."
          ]
        : [
            "Les parties ne sont soumises à aucune clause de non-sollicitation du personnel au titre du présent Contrat."
          ]
    });

    if (isClauseOn(prestationClausesCatalog, "nonConcurrence", dataClauses)) {
      entries.push({
        clauseId: "nonConcurrence",
        heading: "Non-concurrence",
        paragraphs: [
          "Pendant la durée du Contrat et pendant une durée de " +
            dureeNonConcurrence +
            " mois suivant son terme, le Prestataire s'interdit d'exercer, directement ou indirectement, sur le territoire national, une activité concurrente de celle décrite à l'article consacré à l'objet. Cette clause demeure proportionnée dans sa durée, sa zone géographique et son champ d'activité ; elle ne s'accompagne d'aucune contrepartie financière obligatoire, cette exigence relevant du droit du travail et non des relations entre professionnels."
        ]
      });
    }

    entries.push({
      clauseId: "assuranceRCPro",
      heading: "Assurance responsabilité civile professionnelle",
      paragraphs: [
        "Le Prestataire déclare être titulaire d'une assurance responsabilité civile professionnelle couvrant les conséquences pécuniaires de sa responsabilité civile professionnelle et s'engage à en justifier à première demande du Client."
      ]
    });

    if (isClauseOn(prestationClausesCatalog, "cessionContrat", dataClauses)) {
      entries.push({
        clauseId: "cessionContrat",
        heading: "Cession du contrat",
        paragraphs: [
          "Chaque partie peut céder le présent Contrat à un tiers sous réserve de l'accord écrit préalable de l'autre partie, conformément à l'article 1216 du code civil. À défaut d'un tel accord, la cession est inopposable à la partie qui ne l'a pas consentie."
        ]
      });
    }

    if (isClauseOn(prestationClausesCatalog, "referenceClient", dataClauses)) {
      entries.push({
        clauseId: "referenceClient",
        heading: "Référence client",
        paragraphs: [
          "Sauf opposition écrite du Client, le Prestataire peut mentionner le Client comme référence dans ses supports commerciaux ou son portfolio, sans divulgation d'informations confidentielles."
        ]
      });
    }

    if (isClauseOn(prestationClausesCatalog, "integraliteDivisibilite", dataClauses)) {
      entries.push({
        clauseId: "integraliteDivisibilite",
        heading: "Intégralité de l'accord et divisibilité",
        paragraphs: [
          "Le présent Contrat exprime l'intégralité de l'accord des parties relatif à son objet et se substitue à tout accord antérieur, écrit ou oral, portant sur le même objet. Si l'une de ses clauses est jugée nulle ou inapplicable, les autres clauses demeurent en vigueur."
        ]
      });
    }

    entries.push({
      clauseId: "resiliation",
      heading: "Résiliation",
      paragraphs: [
        "Chaque partie peut résilier le présent Contrat à tout moment, moyennant le respect d'un préavis de " +
          preavis +
          " jours notifié par écrit à l'autre partie.",
        "En cas de manquement grave de l'une des parties à ses obligations, non réparé dans un délai de 15 jours suivant une mise en demeure restée sans effet, l'autre partie pourra résilier le Contrat de plein droit, sans préavis et sans préjudice de tout dommage et intérêt éventuel."
      ]
    });

    if (isClauseOn(prestationClausesCatalog, "mediationPrealable", dataClauses)) {
      entries.push({
        clauseId: "mediationPrealable",
        heading: "Règlement amiable et médiation",
        paragraphs: [
          "Avant toute action judiciaire, les parties s'engagent à tenter de résoudre à l'amiable, y compris par voie de médiation conventionnelle au sens de l'article 1530 du code de procédure civile, tout différend né de l'interprétation ou de l'exécution du présent Contrat, pendant un délai de 30 jours à compter de sa notification écrite par la partie la plus diligente."
        ]
      });
    }

    entries.push({
      clauseId: "forceMajeure",
      heading: "Force majeure",
      paragraphs: [
        "Aucune des parties ne pourra être tenue responsable de l'inexécution ou du retard dans l'exécution de ses obligations résultant d'un cas de force majeure au sens de l'article 1218 du code civil et de la jurisprudence des juridictions françaises."
      ]
    });

    entries.push({
      clauseId: "donneesPersonnelles",
      heading: "Données personnelles",
      paragraphs: [
        "Dans le cadre de l'exécution du Contrat, les parties peuvent être amenées à traiter des données à caractère personnel l'une de l'autre ou de leurs représentants, dans le respect du règlement (UE) 2016/679 (RGPD) et de la loi n° 78-17 du 6 janvier 1978 modifiée. Pour toute question relative à ce traitement, le Client peut contacter le Prestataire aux coordonnées suivantes : " +
          profile.email +
          (profile.telephone ? ", " + profile.telephone : "") +
          "."
      ]
    });

    entries.push({
      clauseId: "droitApplicable",
      heading: "Droit applicable et juridiction",
      paragraphs: [
        "Le présent Contrat est soumis au droit français. En cas de litige né de son interprétation ou de son exécution, et à défaut de résolution amiable, compétence exclusive est attribuée au " +
          tribunal +
          ", y compris en cas de pluralité de défendeurs ou d'appel en garantie."
      ]
    });

    return assembleDocument(
      "Contrat de prestation de services",
      "Mission de prestation entre professionnels (B2B)",
      entries,
      data.customClauses,
      footerCommun(profile, today)
    );
  }
};

// ---------------------------------------------------------------------------
// Document 3 — Accord de confidentialité (NDA)
// ---------------------------------------------------------------------------

var ndaClausesCatalog = [
  { id: "parties", label: "Parties", core: true, default: true, risky: false, warning: null, help: null },
  {
    id: "reciproque",
    label: "Accord réciproque",
    core: false,
    default: false,
    risky: false,
    warning: null,
    help: "Si désactivé, seule la Partie Divulgatrice communique des informations confidentielles à la Partie Réceptrice (accord unilatéral). Contrôle le contenu de l'article Parties, toujours présent."
  },
  { id: "definition", label: "Définition des informations confidentielles", core: true, default: true, risky: false, warning: null, help: null },
  { id: "exclusions", label: "Exclusions", core: true, default: true, risky: false, warning: null, help: null },
  {
    id: "notificationDivulgationForcee",
    label: "Notification en cas de divulgation forcée",
    core: false,
    default: true,
    risky: false,
    warning: null,
    help: "Détaille la procédure à suivre par la Partie Réceptrice en cas de divulgation exigée par la loi."
  },
  { id: "obligations", label: "Obligations de la Partie Réceptrice", core: true, default: true, risky: false, warning: null, help: null },
  {
    id: "nonSollicitationNda",
    label: "Non-sollicitation du personnel (12 mois)",
    core: false,
    default: false,
    risky: false,
    warning: null,
    help: null
  },
  { id: "dureeSurvie", label: "Durée de l'accord et survie de l'obligation", core: true, default: true, risky: false, warning: null, help: null },
  { id: "restitution", label: "Restitution ou destruction", core: true, default: true, risky: false, warning: null, help: null },
  { id: "absenceCession", label: "Absence de cession de droits", core: true, default: true, risky: false, warning: null, help: null },
  {
    id: "absenceObligationContracter",
    label: "Absence d'obligation de contracter",
    core: false,
    default: true,
    risky: false,
    warning: null,
    help: null
  },
  {
    id: "clausePenaleNda",
    label: "Clause pénale (violation de confidentialité)",
    core: false,
    default: false,
    risky: false,
    warning: null,
    help: "Montant indicatif, à adapter au contrat ; le juge peut le réviser (art. 1231-5 code civil)."
  },
  { id: "droitApplicable", label: "Droit applicable et juridiction", core: true, default: true, risky: false, warning: null, help: null }
];

var ndaDocument = {
  id: "nda",
  label: "Accord de confidentialité (NDA)",
  description: "Accord de non-divulgation unilatéral ou réciproque entre professionnels.",
  fields: [
    {
      id: "finalite",
      label: "Finalité / projet concerné par la confidentialité",
      type: "textarea",
      placeholder: "Décrivez le projet ou la relation d'affaires justifiant l'échange d'informations confidentielles",
      required: true,
      help: null
    }
  ],
  clauses: ndaClausesCatalog,
  options: [
    {
      id: "dureeConfidentialite",
      label: "Durée de l'obligation de confidentialité (années)",
      help: null,
      type: "number",
      default: 5,
      risky: false,
      warning: null
    },
    {
      id: "montantPenaliteNda",
      label: "Montant de la clause pénale (EUR)",
      help: "Montant indicatif, à adapter au contrat ; le juge peut le réviser (art. 1231-5).",
      type: "number",
      default: 5000,
      risky: false,
      warning: null
    }
  ],
  build: function (data) {
    var profile = data.profile;
    var client = data.client;
    var fields = data.fields || {};
    var options = data.options || {};
    var dataClauses = data.clauses;
    var today = data.today;

    var finalite = fields.finalite;
    var reciproque = isClauseOn(ndaClausesCatalog, "reciproque", dataClauses);
    var duree = options.dureeConfidentialite != null ? options.dureeConfidentialite : 5;
    var montantPenaliteNda = options.montantPenaliteNda != null ? options.montantPenaliteNda : 5000;
    var tribunal = tribunalCompetent(profile);

    var partiesParagraphs = reciproque
      ? [
          "Le présent accord de confidentialité (ci-après « l'Accord ») est conclu entre " +
            prestataireIdentite(profile) +
            " (ci-après « le Prestataire »), et " +
            clientIdentite(client) +
            " (ci-après « le Client »).",
          "Le présent Accord est réciproque : chacune des parties peut agir en qualité de Partie Divulgatrice ou de Partie Réceptrice selon les informations confidentielles qu'elle communique à l'autre partie."
        ]
      : [
          "Le présent accord de confidentialité (ci-après « l'Accord ») est conclu entre " +
            prestataireIdentite(profile) +
            " (ci-après « le Prestataire »), et " +
            clientIdentite(client) +
            " (ci-après « le Client »).",
          "Le présent Accord est unilatéral : le Client agit en qualité de Partie Divulgatrice et le Prestataire en qualité de Partie Réceptrice des informations confidentielles échangées dans le cadre défini à l'article consacré à la définition des informations confidentielles."
        ];

    var entries = [
      { clauseId: "parties", heading: "Parties", paragraphs: partiesParagraphs },
      {
        clauseId: "definition",
        heading: "Définition des informations confidentielles",
        paragraphs: [
          "Sont considérées comme informations confidentielles toutes informations de nature technique, commerciale, financière, stratégique ou relatives à un savoir-faire, communiquées par la Partie Divulgatrice à la Partie Réceptrice, sous quelque forme que ce soit (écrite, orale, électronique), dans le cadre du projet suivant : " +
            finalite +
            "."
        ]
      },
      {
        clauseId: "exclusions",
        heading: "Exclusions",
        paragraphs: [
          "Ne sont pas considérées comme confidentielles les informations qui : sont ou deviennent publiques sans manquement de la Partie Réceptrice au présent Accord ; étaient déjà connues de la Partie Réceptrice avant leur communication, ce dont elle peut justifier ; ont été développées de manière indépendante par la Partie Réceptrice sans recours aux informations confidentielles ; ou doivent être divulguées en application d'une obligation légale, réglementaire, d'une décision de justice ou d'une autorité compétente, sous réserve d'en informer préalablement la Partie Divulgatrice lorsque cela est possible."
        ]
      }
    ];

    if (isClauseOn(ndaClausesCatalog, "notificationDivulgationForcee", dataClauses)) {
      entries.push({
        clauseId: "notificationDivulgationForcee",
        heading: "Notification en cas de divulgation forcée",
        paragraphs: [
          "Lorsque la Partie Réceptrice est tenue de divulguer tout ou partie des informations confidentielles en application d'une obligation légale, réglementaire, d'une décision de justice ou d'une autorité compétente, elle en informe la Partie Divulgatrice dans un délai raisonnable et, chaque fois que cela est légalement possible, avant toute divulgation, afin de lui permettre de faire valoir ses droits ou de solliciter une mesure de protection appropriée. La divulgation est limitée au strict nécessaire au regard de l'obligation invoquée."
        ]
      });
    }

    entries.push({
      clauseId: "obligations",
      heading: "Obligations de la Partie Réceptrice",
      paragraphs: [
        "La Partie Réceptrice s'engage à ne pas divulguer les informations confidentielles à des tiers, à les protéger avec le même degré de diligence que ses propres informations confidentielles, et à ne les utiliser qu'aux fins de la finalité décrite à l'article consacré à la définition des informations confidentielles, à l'exclusion de toute autre utilisation."
      ]
    });

    if (isClauseOn(ndaClausesCatalog, "nonSollicitationNda", dataClauses)) {
      entries.push({
        clauseId: "nonSollicitationNda",
        heading: "Non-sollicitation du personnel",
        paragraphs: [
          "Pendant la durée du présent Accord et pendant une durée de 12 mois suivant son terme, chaque partie s'interdit de solliciter, débaucher ou employer, directement ou indirectement, tout salarié ou collaborateur de l'autre partie ayant eu connaissance des informations confidentielles échangées, sauf accord écrit préalable de la partie concernée."
        ]
      });
    }

    entries.push({
      clauseId: "dureeSurvie",
      heading: "Durée de l'accord et survie de l'obligation",
      paragraphs: [
        "Le présent Accord entre en vigueur à sa date de signature. L'obligation de confidentialité qu'il institue s'applique pendant toute la durée des relations entre les parties et se poursuit pendant " +
          duree +
          " ans à compter du terme de celles-ci, indépendamment du sort du projet mentionné à l'article consacré à la définition des informations confidentielles."
      ]
    });

    entries.push({
      clauseId: "restitution",
      heading: "Restitution ou destruction",
      paragraphs: [
        "À première demande de la Partie Divulgatrice, ou à l'expiration ou à la résiliation du présent Accord, la Partie Réceptrice s'engage à restituer ou à détruire, au choix de la Partie Divulgatrice, tout support contenant des informations confidentielles, et à en justifier sur simple demande."
      ]
    });

    entries.push({
      clauseId: "absenceCession",
      heading: "Absence de cession de droits",
      paragraphs: [
        "Le présent Accord n'emporte, au profit de la Partie Réceptrice, aucune cession de droit de propriété intellectuelle, de licence ou d'autre droit sur les informations confidentielles communiquées, autre que le droit d'en prendre connaissance dans le cadre strict de la finalité définie à l'article consacré à la définition des informations confidentielles."
      ]
    });

    if (isClauseOn(ndaClausesCatalog, "absenceObligationContracter", dataClauses)) {
      entries.push({
        clauseId: "absenceObligationContracter",
        heading: "Absence d'obligation de contracter",
        paragraphs: [
          "La conclusion du présent Accord n'emporte, pour l'une ou l'autre des parties, aucune obligation de contracter, de poursuivre les discussions ou de mener à bien le projet mentionné à l'article consacré à la définition des informations confidentielles. Chacune des parties conserve la faculté de mettre fin aux discussions à tout moment, sous réserve du respect de la bonne foi précontractuelle."
        ]
      });
    }

    if (isClauseOn(ndaClausesCatalog, "clausePenaleNda", dataClauses)) {
      entries.push({
        clauseId: "clausePenaleNda",
        heading: "Clause pénale",
        paragraphs: [
          "Tout manquement à l'obligation de confidentialité prévue au présent Accord peut donner lieu à une pénalité forfaitaire de " +
            montantPenaliteNda +
            " euros, sans que ce montant ne fasse obstacle au pouvoir du juge de la modérer ou de l'augmenter d'office si elle est manifestement excessive ou dérisoire, conformément à l'article 1231-5 du code civil, toute stipulation contraire étant réputée non écrite."
        ]
      });
    }

    entries.push({
      clauseId: "sanctions",
      heading: "Sanctions et réparation",
      paragraphs: [
        "Tout manquement aux obligations résultant du présent Accord engage la responsabilité de la partie défaillante et l'expose à la réparation de l'intégralité du préjudice subi par l'autre partie, sans préjudice de toute autre action que cette dernière jugerait utile d'engager."
      ]
    });

    entries.push({
      clauseId: "droitApplicable",
      heading: "Droit applicable et juridiction",
      paragraphs: [
        "Le présent Accord est soumis au droit français. En cas de litige né de son interprétation ou de son exécution, et à défaut de résolution amiable, compétence exclusive est attribuée au " +
          tribunal +
          ", y compris en cas de pluralité de défendeurs ou d'appel en garantie."
      ]
    });

    return assembleDocument(
      "Accord de confidentialité",
      reciproque ? "Accord réciproque entre professionnels" : "Accord unilatéral entre professionnels",
      entries,
      data.customClauses,
      footerCommun(profile, today)
    );
  }
};

// ---------------------------------------------------------------------------
// Assemblage final
// ---------------------------------------------------------------------------

window.CONTRATS_TEMPLATES = {
  version: "2.0.0",
  disclaimer:
    "Ce document est un modèle type à personnaliser, fourni à titre informatif. Il ne constitue pas une consultation juridique et ne remplace pas l'avis d'un avocat pour votre situation particulière.",
  documents: {
    cgv: cgvDocument,
    prestation: prestationDocument,
    nda: ndaDocument
  }
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = window.CONTRATS_TEMPLATES;
}
