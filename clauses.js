/*
 * Contenu juridique du générateur de contrats freelance (CGV, contrat de prestation, NDA).
 * Pur JavaScript ES2017, sans dépendance. Exécutable en navigateur (window.CONTRATS_TEMPLATES)
 * et en Node (module.exports) pour les tests.
 *
 * Base juridique : Vault_Projets/Outils Locaux/generateur-contrats-freelance-legal.md (2026-07-18).
 * Contrat d'interface figé : tools/contrats-generator/CONTRACT.md (2026-07-18).
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

// ---------------------------------------------------------------------------
// Document 1 — CGV de prestation de services B2B
// ---------------------------------------------------------------------------

var cgvDocument = {
  id: "cgv",
  label: "CGV de prestation de services (B2B)",
  description: "Conditions générales de vente pour prestations de services entre professionnels.",
  fields: [],
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
      id: "plafondResponsabilite",
      label: "Plafonner la responsabilité au montant des sommes versées",
      help: "Limite la responsabilité contractuelle du Prestataire au montant payé par le Client pour la prestation concernée.",
      type: "toggle",
      default: true,
      risky: false,
      warning: null
    }
  ],
  build: function (data) {
    var profile = data.profile;
    var options = data.options || {};
    var today = data.today;

    var delaiPaiement = options.delaiPaiement != null ? options.delaiPaiement : 30;
    var tauxPenalitesTexte =
      options.tauxPenalites === "legal3x"
        ? "trois fois le taux d'intérêt légal en vigueur"
        : "le taux d'intérêt appliqué par la Banque centrale européenne à son opération de refinancement la plus récente, majoré de 10 points";
    var plafondOn = options.plafondResponsabilite !== false;
    var prixMention = tvaMention(profile);
    var tribunal = tribunalCompetent(profile);

    var sections = [
      {
        heading: "Article 1 - Objet et champ d'application",
        paragraphs: [
          "Les présentes conditions générales de vente (ci-après « les CGV ») régissent exclusivement les relations commerciales entre " +
            prestataireIdentite(profile) +
            " (ci-après « le Prestataire ») et tout client agissant en qualité de professionnel (ci-après « le Client »). Le présent document est réservé aux relations entre professionnels (B2B) et exclut toute application des dispositions protectrices du droit de la consommation.",
          "Toute prestation commandée auprès du Prestataire implique l'adhésion sans réserve du Client aux présentes CGV, qui prévalent sur tout document émanant du Client, notamment ses conditions générales d'achat, sauf dérogation expresse et écrite préalable du Prestataire."
        ]
      },
      {
        heading: "Article 2 - Devis et commande",
        paragraphs: [
          "Chaque prestation fait l'objet d'un devis écrit préalable détaillant la nature des prestations, leur prix et leurs modalités d'exécution. La commande est réputée ferme à compter de l'acceptation écrite du devis par le Client, par signature, bon pour accord ou tout autre moyen écrit équivalent.",
          "Toute modification du périmètre demandée par le Client après acceptation du devis fait l'objet d'un avenant écrit et peut donner lieu à un ajustement du prix et des délais convenus."
        ]
      },
      {
        heading: "Article 3 - Prix",
        paragraphs: [
          "Les prix des prestations sont ceux indiqués au devis accepté par le Client, établis selon le barème du Prestataire ou, à défaut, selon la méthode de calcul précisée au devis (temps passé, forfait ou régie). " +
            prixMention +
            ".",
          "Toute réduction de prix éventuellement consentie par le Prestataire, sous forme de remise, rabais ou ristourne, est mentionnée expressément sur le devis ou sur la facture correspondante."
        ]
      },
      {
        heading: "Article 4 - Conditions de règlement",
        paragraphs: [
          "Sauf stipulation contraire du devis, les factures sont payables à " +
            delaiPaiement +
            " jours à compter de leur date d'émission, conformément à l'article L441-1 du code de commerce.",
          "Le règlement s'effectue par virement bancaire aux coordonnées communiquées par le Prestataire, ou par tout autre moyen de paiement convenu entre les parties."
        ]
      },
      {
        heading: "Article 5 - Pénalités de retard et indemnité de recouvrement",
        paragraphs: [
          "Conformément aux articles L441-10 et D441-5 du code de commerce, tout retard de paiement entraîne de plein droit, sans qu'une mise en demeure préalable soit nécessaire, l'application d'une pénalité calculée sur la base de " +
            tauxPenalitesTexte +
            ".",
          "Tout retard de paiement donne également lieu, de plein droit, au paiement d'une indemnité forfaitaire pour frais de recouvrement de 40 euros, sans préjudice d'une indemnisation complémentaire sur justificatifs lorsque les frais de recouvrement effectivement exposés sont supérieurs à ce montant."
        ]
      },
      {
        heading: "Article 6 - Obligations du Prestataire",
        paragraphs: [
          "Le Prestataire s'engage à exécuter les prestations commandées avec diligence et conformément aux règles de l'art de sa profession. Le Prestataire est tenu à une obligation de moyens et non de résultat, sauf stipulation contraire expresse figurant au devis."
        ]
      },
      {
        heading: "Article 7 - Obligations du Client",
        paragraphs: [
          "Le Client s'engage à fournir au Prestataire, en temps utile, toutes les informations, documents et accès nécessaires à la bonne exécution de la prestation, et à régler le prix convenu dans les conditions et délais fixés à l'article 4 des présentes."
        ]
      },
      {
        heading: "Article 8 - Propriété intellectuelle",
        paragraphs: [
          "Les livrables réalisés par le Prestataire dans le cadre de la prestation demeurent sa propriété jusqu'au paiement intégral du prix convenu. La cession des droits de propriété intellectuelle afférents aux livrables au profit du Client n'intervient qu'à compter de ce paiement intégral et porte exclusivement sur les droits, l'étendue, la destination et la durée expressément précisés au devis, ou à défaut sur un usage professionnel du Client limité à ses besoins propres."
        ]
      },
      {
        heading: "Article 9 - Responsabilité",
        paragraphs: plafondOn
          ? [
              "La responsabilité du Prestataire au titre de l'exécution des prestations est limitée, tous préjudices confondus, au montant total des sommes effectivement versées par le Client au titre de la prestation concernée.",
              "En tout état de cause, le Prestataire ne saurait être tenu responsable des dommages indirects tels que perte d'exploitation, perte de données ou préjudice commercial."
            ]
          : [
              "La responsabilité du Prestataire est engagée dans les conditions de droit commun, sans plafonnement contractuel.",
              "En tout état de cause, le Prestataire ne saurait être tenu responsable des dommages indirects tels que perte d'exploitation, perte de données ou préjudice commercial."
            ]
      },
      {
        heading: "Article 10 - Force majeure",
        paragraphs: [
          "Aucune des parties ne pourra être tenue responsable de l'inexécution ou du retard dans l'exécution de ses obligations résultant d'un cas de force majeure au sens de l'article 1218 du code civil et de la jurisprudence des juridictions françaises."
        ]
      },
      {
        heading: "Article 11 - Résiliation",
        paragraphs: [
          "En cas de manquement grave de l'une des parties à ses obligations, non réparé dans un délai de 15 jours suivant une mise en demeure restée sans effet, l'autre partie pourra résilier la prestation en cours de plein droit, sans préjudice de tout dommage et intérêt éventuel."
        ]
      },
      {
        heading: "Article 12 - Données personnelles",
        paragraphs: [
          "Dans le cadre de l'exécution de la prestation, le Prestataire peut être amené à traiter des données à caractère personnel du Client ou de ses représentants, dans le respect du règlement (UE) 2016/679 (RGPD) et de la loi n° 78-17 du 6 janvier 1978 modifiée. Pour toute question relative à ce traitement, le Client peut contacter le Prestataire aux coordonnées suivantes : " +
            profile.email +
            (profile.telephone ? ", " + profile.telephone : "") +
            "."
        ]
      },
      {
        heading: "Article 13 - Droit applicable et juridiction",
        paragraphs: [
          "Les présentes CGV sont soumises au droit français. En cas de litige né de leur interprétation ou de leur exécution, et à défaut de résolution amiable, compétence exclusive est attribuée au " +
            tribunal +
            ", y compris en cas de pluralité de défendeurs ou d'appel en garantie."
        ]
      }
    ];

    return {
      title: "Conditions générales de vente",
      subtitle: "Prestations de services entre professionnels (B2B)",
      sections: sections,
      footerMentions: footerCommun(profile, today)
    };
  }
};

// ---------------------------------------------------------------------------
// Document 2 — Contrat de prestation de services
// ---------------------------------------------------------------------------

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
    }
  ],
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
      id: "sousTraitance",
      label: "Autoriser la sous-traitance",
      help: "Le Prestataire peut sous-traiter tout ou partie de la mission, à charge d'en informer le Client.",
      type: "toggle",
      default: true,
      risky: false,
      warning: null
    },
    {
      id: "nonSollicitation",
      label: "Clause de non-sollicitation du personnel (12 mois)",
      help: "Interdit à chaque partie de débaucher le personnel de l'autre pendant 12 mois après la fin du contrat.",
      type: "toggle",
      default: true,
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
      id: "exclusivite",
      label: "Exclusivité au profit du Client",
      help: "Le Prestataire s'engage à ne pas intervenir pour des tiers pendant la durée du contrat.",
      type: "toggle",
      default: false,
      risky: true,
      warning:
        "Risque de requalification du contrat en contrat de travail : une exclusivité imposée au Prestataire est un indice de lien de subordination retenu par l'Urssaf et les tribunaux."
    },
    {
      id: "horairesImposes",
      label: "Présence à horaires imposés par le Client",
      help: null,
      type: "toggle",
      default: false,
      risky: true,
      warning:
        "Risque de requalification en salariat : des horaires imposés et un contrôle permanent de l'exécution sont des critères caractéristiques du lien de subordination retenus par l'Urssaf."
    }
  ],
  build: function (data) {
    var profile = data.profile;
    var client = data.client;
    var fields = data.fields || {};
    var options = data.options || {};
    var today = data.today;

    var objet = fields.objet;
    var dureeFin = fields.dureeFin;
    var prix = fields.prix;
    var modaliteTexte =
      options.modaliteFacturation === "regie"
        ? "en régie, sur la base du temps effectivement passé"
        : "au forfait, pour un montant global et forfaitaire";
    var delaiPaiement = options.delaiPaiement != null ? options.delaiPaiement : 30;
    var sousTraitanceOn = options.sousTraitance !== false;
    var nonSollicitationOn = options.nonSollicitation !== false;
    var preavis = options.preavisResiliation != null ? options.preavisResiliation : 30;
    var exclusiviteOn = options.exclusivite === true;
    var horairesOn = options.horairesImposes === true;
    var tribunal = tribunalCompetent(profile);

    var obligationsParagraphs = [
      "Le Prestataire exécute sa mission en toute indépendance, sans lien de subordination avec le Client. Il organise librement son travail, détermine ses méthodes et ses outils de travail, et n'est soumis à aucune directive contraignante ni à aucun contrôle permanent du Client quant aux modalités d'exécution de sa prestation.",
      "Le Client s'engage à fournir au Prestataire les informations et éléments nécessaires à la bonne exécution de la mission et à régler le prix convenu dans les conditions fixées à l'article consacré au prix et au paiement."
    ];
    if (exclusiviteOn) {
      obligationsParagraphs.push(
        "Par dérogation au principe d'indépendance énoncé ci-dessus, le Prestataire consent au Client une exclusivité pour la durée du présent contrat, dans les conditions convenues entre les parties. Les parties reconnaissent que cette clause accroît le risque de requalification du présent contrat en contrat de travail et déclarent l'avoir accepté en connaissance de cause."
      );
    }
    if (horairesOn) {
      obligationsParagraphs.push(
        "Le Prestataire convient d'assurer sa présence selon des horaires déterminés par le Client. Les parties reconnaissent que cette modalité accroît le risque de requalification du présent contrat en contrat de travail et déclarent l'avoir accepté en connaissance de cause."
      );
    }

    var sections = [
      {
        heading: "Article 1 - Parties et préambule",
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
        heading: "Article 2 - Objet",
        paragraphs: [
          "Le Prestataire s'engage à réaliser au profit du Client la mission suivante : " + objet + "."
        ]
      },
      {
        heading: "Article 3 - Durée",
        paragraphs: dureeFin
          ? [
              "Le présent Contrat prend effet à sa date de signature et se poursuit jusqu'au " +
                dureeFin +
                ", sauf résiliation anticipée dans les conditions prévues à l'article consacré à la résiliation."
            ]
          : [
              "Le présent Contrat est conclu pour une mission ponctuelle, sans terme calendaire fixé à l'avance ; il prend fin à l'achèvement de la mission décrite à l'article 2."
            ]
      },
      {
        heading: "Article 4 - Obligations réciproques et indépendance des parties",
        paragraphs: obligationsParagraphs
      },
      {
        heading: "Article 5 - Prix et paiement",
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
            " jours à compter de leur date d'émission, conformément à l'article L441-1 du code de commerce."
        ]
      },
      {
        heading: "Article 6 - Pénalités de retard et indemnité de recouvrement",
        paragraphs: [
          "Conformément aux articles L441-10 et D441-5 du code de commerce, tout retard de paiement entraîne de plein droit l'application d'une pénalité calculée sur la base du taux d'intérêt appliqué par la Banque centrale européenne à son opération de refinancement la plus récente, majoré de 10 points, ainsi qu'une indemnité forfaitaire pour frais de recouvrement de 40 euros, sans préjudice d'une indemnisation complémentaire sur justificatifs."
        ]
      },
      {
        heading: "Article 7 - Propriété intellectuelle",
        paragraphs: [
          "Les droits de propriété intellectuelle afférents aux livrables produits par le Prestataire dans le cadre de la mission sont cédés au Client de manière expresse, écrite et délimitée : l'étendue de la cession porte sur les droits de reproduction, de représentation et d'adaptation ; sa destination est l'usage professionnel du Client dans le cadre de son activité ; son territoire est le territoire français, sauf stipulation contraire au devis ; sa durée correspond à la durée légale de protection des droits concernés. Cette cession ne prend effet qu'à compter du paiement intégral du prix convenu."
        ]
      },
      {
        heading: "Article 8 - Confidentialité",
        paragraphs: [
          "Chaque partie s'engage à garder confidentielles toutes les informations de nature technique, commerciale ou financière dont elle aurait connaissance à l'occasion de l'exécution du présent Contrat, et à ne les utiliser qu'aux fins de son exécution, pendant toute sa durée et pendant une durée de 3 ans après son terme."
        ]
      },
      {
        heading: "Article 9 - Sous-traitance",
        paragraphs: sousTraitanceOn
          ? [
              "Le Prestataire est autorisé à sous-traiter tout ou partie de l'exécution de la mission, à charge d'en informer préalablement le Client et de demeurer seul responsable envers celui-ci de la bonne exécution de la prestation."
            ]
          : [
              "Le Prestataire exécute personnellement la mission et ne peut recourir à la sous-traitance sans l'accord écrit préalable du Client."
            ]
      },
      {
        heading: "Article 10 - Non-sollicitation du personnel",
        paragraphs: nonSollicitationOn
          ? [
              "Pendant la durée du Contrat et pendant une durée de 12 mois suivant son terme, chaque partie s'interdit de solliciter, débaucher ou employer, directement ou indirectement, tout salarié ou collaborateur de l'autre partie ayant été impliqué dans l'exécution du présent Contrat, sauf accord écrit préalable de la partie concernée."
            ]
          : [
              "Les parties ne sont soumises à aucune clause de non-sollicitation du personnel au titre du présent Contrat."
            ]
      },
      {
        heading: "Article 11 - Assurance responsabilité civile professionnelle",
        paragraphs: [
          "Le Prestataire déclare être titulaire d'une assurance responsabilité civile professionnelle couvrant les conséquences pécuniaires de sa responsabilité civile professionnelle et s'engage à en justifier à première demande du Client."
        ]
      },
      {
        heading: "Article 12 - Résiliation",
        paragraphs: [
          "Chaque partie peut résilier le présent Contrat à tout moment, moyennant le respect d'un préavis de " +
            preavis +
            " jours notifié par écrit à l'autre partie.",
          "En cas de manquement grave de l'une des parties à ses obligations, non réparé dans un délai de 15 jours suivant une mise en demeure restée sans effet, l'autre partie pourra résilier le Contrat de plein droit, sans préavis et sans préjudice de tout dommage et intérêt éventuel."
        ]
      },
      {
        heading: "Article 13 - Force majeure",
        paragraphs: [
          "Aucune des parties ne pourra être tenue responsable de l'inexécution ou du retard dans l'exécution de ses obligations résultant d'un cas de force majeure au sens de l'article 1218 du code civil et de la jurisprudence des juridictions françaises."
        ]
      },
      {
        heading: "Article 14 - Données personnelles",
        paragraphs: [
          "Dans le cadre de l'exécution du Contrat, les parties peuvent être amenées à traiter des données à caractère personnel l'une de l'autre ou de leurs représentants, dans le respect du règlement (UE) 2016/679 (RGPD) et de la loi n° 78-17 du 6 janvier 1978 modifiée. Pour toute question relative à ce traitement, le Client peut contacter le Prestataire aux coordonnées suivantes : " +
            profile.email +
            (profile.telephone ? ", " + profile.telephone : "") +
            "."
        ]
      },
      {
        heading: "Article 15 - Droit applicable et juridiction",
        paragraphs: [
          "Le présent Contrat est soumis au droit français. En cas de litige né de son interprétation ou de son exécution, et à défaut de résolution amiable, compétence exclusive est attribuée au " +
            tribunal +
            ", y compris en cas de pluralité de défendeurs ou d'appel en garantie."
        ]
      }
    ];

    return {
      title: "Contrat de prestation de services",
      subtitle: "Mission de prestation entre professionnels (B2B)",
      sections: sections,
      footerMentions: footerCommun(profile, today)
    };
  }
};

// ---------------------------------------------------------------------------
// Document 3 — Accord de confidentialité (NDA)
// ---------------------------------------------------------------------------

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
  options: [
    {
      id: "reciproque",
      label: "Accord réciproque",
      help: "Si désactivé, seule la Partie Divulgatrice communique des informations confidentielles à la Partie Réceptrice (accord unilatéral).",
      type: "toggle",
      default: false,
      risky: false,
      warning: null
    },
    {
      id: "dureeConfidentialite",
      label: "Durée de l'obligation de confidentialité (années)",
      help: null,
      type: "number",
      default: 5,
      risky: false,
      warning: null
    }
  ],
  build: function (data) {
    var profile = data.profile;
    var client = data.client;
    var fields = data.fields || {};
    var options = data.options || {};
    var today = data.today;

    var finalite = fields.finalite;
    var reciproque = options.reciproque === true;
    var duree = options.dureeConfidentialite != null ? options.dureeConfidentialite : 5;
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
          "Le présent Accord est unilatéral : le Client agit en qualité de Partie Divulgatrice et le Prestataire en qualité de Partie Réceptrice des informations confidentielles échangées dans le cadre défini à l'article 2."
        ];

    var sections = [
      {
        heading: "Article 1 - Parties",
        paragraphs: partiesParagraphs
      },
      {
        heading: "Article 2 - Définition des informations confidentielles",
        paragraphs: [
          "Sont considérées comme informations confidentielles toutes informations de nature technique, commerciale, financière, stratégique ou relatives à un savoir-faire, communiquées par la Partie Divulgatrice à la Partie Réceptrice, sous quelque forme que ce soit (écrite, orale, électronique), dans le cadre du projet suivant : " +
            finalite +
            "."
        ]
      },
      {
        heading: "Article 3 - Exclusions",
        paragraphs: [
          "Ne sont pas considérées comme confidentielles les informations qui : sont ou deviennent publiques sans manquement de la Partie Réceptrice au présent Accord ; étaient déjà connues de la Partie Réceptrice avant leur communication, ce dont elle peut justifier ; ont été développées de manière indépendante par la Partie Réceptrice sans recours aux informations confidentielles ; ou doivent être divulguées en application d'une obligation légale, réglementaire, d'une décision de justice ou d'une autorité compétente, sous réserve d'en informer préalablement la Partie Divulgatrice lorsque cela est possible."
        ]
      },
      {
        heading: "Article 4 - Obligations de la Partie Réceptrice",
        paragraphs: [
          "La Partie Réceptrice s'engage à ne pas divulguer les informations confidentielles à des tiers, à les protéger avec le même degré de diligence que ses propres informations confidentielles, et à ne les utiliser qu'aux fins de la finalité décrite à l'article 2, à l'exclusion de toute autre utilisation."
        ]
      },
      {
        heading: "Article 5 - Durée de l'accord et survie de l'obligation",
        paragraphs: [
          "Le présent Accord entre en vigueur à sa date de signature. L'obligation de confidentialité qu'il institue s'applique pendant toute la durée des relations entre les parties et se poursuit pendant " +
            duree +
            " ans à compter du terme de celles-ci, indépendamment du sort du projet mentionné à l'article 2."
        ]
      },
      {
        heading: "Article 6 - Restitution ou destruction",
        paragraphs: [
          "À première demande de la Partie Divulgatrice, ou à l'expiration ou à la résiliation du présent Accord, la Partie Réceptrice s'engage à restituer ou à détruire, au choix de la Partie Divulgatrice, tout support contenant des informations confidentielles, et à en justifier sur simple demande."
        ]
      },
      {
        heading: "Article 7 - Absence de cession de droits",
        paragraphs: [
          "Le présent Accord n'emporte, au profit de la Partie Réceptrice, aucune cession de droit de propriété intellectuelle, de licence ou d'autre droit sur les informations confidentielles communiquées, autre que le droit d'en prendre connaissance dans le cadre strict de la finalité définie à l'article 2."
        ]
      },
      {
        heading: "Article 8 - Sanctions et réparation",
        paragraphs: [
          "Tout manquement aux obligations résultant du présent Accord engage la responsabilité de la partie défaillante et l'expose à la réparation de l'intégralité du préjudice subi par l'autre partie, sans préjudice de toute autre action que cette dernière jugerait utile d'engager."
        ]
      },
      {
        heading: "Article 9 - Droit applicable et juridiction",
        paragraphs: [
          "Le présent Accord est soumis au droit français. En cas de litige né de son interprétation ou de son exécution, et à défaut de résolution amiable, compétence exclusive est attribuée au " +
            tribunal +
            ", y compris en cas de pluralité de défendeurs ou d'appel en garantie."
        ]
      }
    ];

    return {
      title: "Accord de confidentialité",
      subtitle: reciproque
        ? "Accord réciproque entre professionnels"
        : "Accord unilatéral entre professionnels",
      sections: sections,
      footerMentions: footerCommun(profile, today)
    };
  }
};

// ---------------------------------------------------------------------------
// Assemblage final
// ---------------------------------------------------------------------------

window.CONTRATS_TEMPLATES = {
  version: "1.0.0",
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
