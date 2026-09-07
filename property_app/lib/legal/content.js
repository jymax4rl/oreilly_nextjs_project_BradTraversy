/**
 * Isisel — legal & policies content (EN + FR).
 * Single source of truth for the /policies UI.
 */

export const POLICIES_META = {
  en: {
    title: "Policies",
    subtitle:
      "Clear rules for guests and hosts on Isisel — African vacation rentals, with room to grow.",
    toc: "On this page",
    lastUpdated: "Last updated: 4 September 2026",
    versionLabel: "Terms version",
  },
  fr: {
    title: "Politiques",
    subtitle:
      "Règles claires pour voyageurs et hôtes sur Isisel — locations de vacances en Afrique, avec une ambition d’évolution.",
    toc: "Sur cette page",
    lastUpdated: "Dernière mise à jour : 4 septembre 2026",
    versionLabel: "Version des conditions",
  },
};

/**
 * @typedef {{ id: string, nav: { en: string, fr: string }, title: { en: string, fr: string }, paragraphs: { en: string[], fr: string[] } }} PolicySection
 */

/** @type {PolicySection[]} */
export const POLICY_SECTIONS = [
  {
    id: "guest-booking",
    nav: { en: "Guest booking", fr: "Réservation voyageur" },
    title: {
      en: "Guest booking rules",
      fr: "Règles de réservation voyageur",
    },
    paragraphs: {
      en: [
        "Isisel connects travelers with hosts offering short-stay lodging across Africa, starting with markets such as The Gambia and expanding regionally.",
        "When you request or confirm a stay, you agree to provide accurate guest details, respect house rules published on the listing, and treat the property and neighbors with care.",
        "You are responsible for the conduct of everyone in your party. Damage, unauthorized parties, or illegal activity may lead to cancellation without refund (where applicable), account restrictions, and reporting to local authorities when required.",
        "Listing information is provided by hosts. We moderate for quality and safety, but we do not guarantee that every detail of every property is perfect — verify critical needs with the host before arrival when unsure.",
      ],
      fr: [
        "Isisel met en relation voyageurs et hôtes proposant des séjours de courte durée en Afrique, en commençant par des marchés comme la Gambie, avec une expansion régionale.",
        "Lorsque vous demandez ou confirmez un séjour, vous vous engagez à fournir des informations exactes, à respecter le règlement intérieur publié sur l’annonce, et à traiter le logement et le voisinage avec soin.",
        "Vous êtes responsable du comportement de toutes les personnes de votre groupe. Dommages, fêtes non autorisées ou activités illégales peuvent entraîner une annulation sans remboursement (le cas échéant), des restrictions de compte, et un signalement aux autorités locales si nécessaire.",
        "Les informations des annonces sont fournies par les hôtes. Nous modérons pour la qualité et la sécurité, mais nous ne garantissons pas chaque détail de chaque bien — vérifiez vos besoins critiques avec l’hôte avant l’arrivée en cas de doute.",
      ],
    },
  },
  {
    id: "cancellations",
    nav: { en: "Cancellations", fr: "Annulations" },
    title: {
      en: "Cancellations & changes",
      fr: "Annulations et modifications",
    },
    paragraphs: {
      en: [
        "Cancellation and change rules are driven by the listing’s published booking policy and any confirmation messages between guest and host.",
        "Where the platform supports modify/cancel flows, use in-product tools so both parties have a clear record. Off-platform agreements should still be confirmed in writing (message thread or email).",
        "Hosts should honor confirmed reservations except for force majeure, safety issues, or guest policy violations. Repeated no-shows or last-minute cancellations by either party may affect account standing.",
        "Refunds for payments made outside Isisel (cash, mobile money, bank transfer arranged directly) are between guest and host according to their agreed terms. Isisel does not hold those funds in MVP.",
      ],
      fr: [
        "Les règles d’annulation et de modification suivent la politique de réservation publiée sur l’annonce et les messages de confirmation entre voyageur et hôte.",
        "Lorsque la plateforme propose des flux de modification/annulation, utilisez-les pour laisser une trace claire aux deux parties. Les accords hors plateforme doivent aussi être confirmés par écrit (messagerie ou e-mail).",
        "Les hôtes doivent honorer les réservations confirmées, sauf force majeure, problème de sécurité ou violation des règles par le voyageur. Les absences répétées ou annulations de dernière minute peuvent affecter le statut du compte.",
        "Les remboursements pour paiements hors Isisel (espèces, mobile money, virement convenu directement) relèvent de l’accord entre voyageur et hôte. Isisel ne détient pas ces fonds en MVP.",
      ],
    },
  },
  {
    id: "host-responsibilities",
    nav: { en: "Host duties", fr: "Devoirs de l’hôte" },
    title: {
      en: "Host responsibilities",
      fr: "Responsabilités de l’hôte",
    },
    paragraphs: {
      en: [
        "Hosts must keep listings accurate: photos, amenities, location context, capacity, pricing, and house rules. Misleading listings may be unpublished or suspended.",
        "Keep your availability calendar honest. Blocking dates you cannot honor protects guests and your reputation; double-booking or ghosting confirmed guests is grounds for enforcement.",
        "Respond to booking inquiries and messages within a reasonable time. Provide clear check-in instructions and be reachable for urgent issues during the stay.",
        "You remain responsible for compliance with local lodging, tax, and safety rules in your country. Isisel provides a marketplace layer — not a substitute for local licensing or insurance advice.",
        "Full host terms live in our Host Terms document in the product repository and are summarized on this page under Host Terms.",
      ],
      fr: [
        "Les hôtes doivent maintenir des annonces exactes : photos, équipements, contexte de localisation, capacité, tarifs et règlement intérieur. Les annonces trompeuses peuvent être dépubliées ou suspendues.",
        "Tenez un calendrier de disponibilité honnête. Bloquer les dates que vous ne pouvez pas honorer protège les voyageurs et votre réputation ; la double réservation ou l’absence de réponse après confirmation justifie des mesures.",
        "Répondez aux demandes et messages dans un délai raisonnable. Fournissez des instructions d’arrivée claires et restez joignable en cas d’urgence pendant le séjour.",
        "Vous restez responsable du respect des règles locales d’hébergement, fiscales et de sécurité. Isisel fournit une couche marketplace — pas un substitut aux licences ou conseils d’assurance locaux.",
        "Les conditions hôtes complètes figurent dans notre document Host Terms du dépôt produit et sont résumées sur cette page.",
      ],
    },
  },
  {
    id: "payments",
    nav: { en: "Payments", fr: "Paiements" },
    title: {
      en: "Payments (MVP)",
      fr: "Paiements (MVP)",
    },
    paragraphs: {
      en: [
        "In the current MVP, many stays may be paid via arrangements that hosts and guests agree — including cash on arrival, mobile money (e.g. Orange Money and similar), or other local methods. Off-platform payment is explicitly allowed for MVP convenience.",
        "Where Isisel offers in-app payment providers in the future, those flows will show clear fees and confirmation states. Until then, treat the platform as the booking and messaging layer; money movement may happen outside our rails.",
        "Never share passwords or one-time codes. Prefer traceable mobile-money references when possible. Isisel is not a bank and does not insure peer-to-peer transfers made outside the product.",
        "If an in-platform payment integration is enabled on a listing, follow the on-screen instructions; chargebacks and provider disputes follow that provider’s rules.",
      ],
      fr: [
        "Dans le MVP actuel, de nombreux séjours peuvent être payés selon l’accord hôte–voyageur — y compris espèces à l’arrivée, mobile money (ex. Orange Money et équivalents) ou autres moyens locaux. Le paiement hors plateforme est explicitement autorisé pour la commodité du MVP.",
        "Lorsque Isisel proposera des prestataires de paiement intégrés, les frais et confirmations seront affichés clairement. D’ici là, considérez la plateforme comme couche de réservation et de messagerie ; les fonds peuvent circuler hors de nos rails.",
        "Ne partagez jamais mots de passe ni codes à usage unique. Préférez des références mobile money traçables lorsque c’est possible. Isisel n’est pas une banque et n’assure pas les transferts de pair à pair hors produit.",
        "Si un paiement intégré est activé sur une annonce, suivez les instructions à l’écran ; litiges et rétrofacturations suivent les règles du prestataire.",
      ],
    },
  },
  {
    id: "privacy",
    nav: { en: "Privacy", fr: "Confidentialité" },
    title: {
      en: "Privacy overview",
      fr: "Aperçu de la confidentialité",
    },
    paragraphs: {
      en: [
        "We collect account data (such as name, email, and profile photo from Google sign-in), listing and booking records, messages you send on the platform, and technical logs needed to run and secure the service.",
        "We use this data to operate bookings, moderation, support, fraud prevention, and product improvement. We do not sell personal data.",
        "Hosting providers (cloud database, auth, email, image CDN, analytics) process data under our instructions to deliver the product. Access is limited to what each service needs.",
        "You may request correction of profile information via Settings / Profile. For deletion or broader privacy requests, contact us using the Contact section below. Retention follows operational and legal needs.",
        "See the Privacy Policy content file in the repository for the durable long-form text mirrored here.",
      ],
      fr: [
        "Nous collectons les données de compte (nom, e-mail et photo via Google), les enregistrements d’annonces et de réservations, les messages échangés sur la plateforme, et les journaux techniques nécessaires au fonctionnement et à la sécurité.",
        "Nous utilisons ces données pour les réservations, la modération, le support, la prévention de la fraude et l’amélioration du produit. Nous ne vendons pas les données personnelles.",
        "Des prestataires (base cloud, authentification, e-mail, CDN d’images, analytique) traitent des données selon nos instructions. L’accès est limité au nécessaire.",
        "Vous pouvez corriger votre profil via Paramètres / Profil. Pour une suppression ou une demande plus large, contactez-nous via la section Contact. La conservation suit les besoins opérationnels et légaux.",
        "Consultez le fichier Privacy Policy du dépôt pour le texte long durable repris ici.",
      ],
    },
  },
  {
    id: "content-standards",
    nav: { en: "Content standards", fr: "Standards de contenu" },
    title: {
      en: "Content & community standards",
      fr: "Standards de contenu et de communauté",
    },
    paragraphs: {
      en: [
        "Do not post illegal content, scams, hate, harassment, sexual exploitation, or listings you do not have the right to offer.",
        "Photos must depict the actual property. Watermarked stock that misrepresents the stay is not allowed.",
        "We may remove content, restrict features, or suspend accounts that violate these standards or applicable law. Hosts and guests should report concerns via Contact.",
      ],
      fr: [
        "Ne publiez pas de contenu illégal, d’arnaques, de haine, de harcèlement, d’exploitation sexuelle, ni d’annonces que vous n’avez pas le droit de proposer.",
        "Les photos doivent représenter le bien réel. Les images génériques trompeuses ne sont pas autorisées.",
        "Nous pouvons retirer du contenu, restreindre des fonctions ou suspendre des comptes en cas de violation. Signalez les problèmes via Contact.",
      ],
    },
  },
  {
    id: "intellectual-property",
    nav: { en: "Intellectual property", fr: "Propriété intellectuelle" },
    title: {
      en: "Intellectual property",
      fr: "Propriété intellectuelle",
    },
    paragraphs: {
      en: [
        "All right, title, and interest in and to the Isisel service — including without limitation the Isisel and Kama Properties names, wordmarks, logos, domain names (including isisel.com), trade dress, user interface, layout, design system, icons, software, source code, object code, algorithms, databases (as compilations), APIs, documentation, and all related goodwill — are and shall remain the exclusive property of Isisel and its licensors. No licence is granted except the limited, revocable, non-exclusive, non-transferable, non-sublicensable right to access and use the service for its intended marketplace purpose, strictly in accordance with these Policies and the Terms of Service. All rights not expressly granted are reserved.",
        "You shall not, and shall not permit any third party to: copy, reproduce, adapt, translate, modify, reverse engineer, decompile, disassemble, or create derivative works of the service except to the limited extent that applicable law prohibits such restriction; scrape, harvest, or systematically extract listings, prices, photographs, reviews, or other data; frame, mirror, or commercially exploit the service or its look and feel; use Isisel marks, or any confusingly similar name, logo, or domain, in a manner that suggests sponsorship, endorsement, partnership, or affiliation that does not exist; or register or use trademarks, company names, or social-media handles that imitate Isisel.",
        "You retain whatever intellectual-property rights you already hold in content you lawfully submit (including listing text, photographs, house rules, messages, and reviews). By submitting such content, you represent that you have all rights necessary to do so, and you hereby grant Isisel a worldwide, royalty-free, transferable, sublicensable, perpetual licence to host, store, reproduce, adapt (including for formatting, compression, and thumbnails), display, perform, and distribute that content solely in connection with operating, improving, promoting, and protecting the service. You waive, to the maximum extent permitted by law, moral-rights claims against Isisel’s reasonable use of that content in the foregoing manner. This licence survives termination of your account as to copies already made in backups, caches, legal archives, and public pages until those copies are removed in the ordinary course.",
        "You may not upload content that infringes copyright, trademark, design right, portrait/image rights, or trade secrets of any person. If you believe content on Isisel infringes your rights, send a written notice to contact@isisel.com identifying the work, the URL or listing, your contact details, and a good-faith statement of ownership or exclusive licence. We may remove or disable access to material, notify the poster, and, in appropriate cases, suspend repeat infringers. Isisel does not adjudicate ownership disputes between hosts and third-party photographers; those remain between the parties.",
        "Names, logos, and product identifications of third parties that may appear on the site (including hospitality, software, or payment brands) remain the property of their respective owners. Their appearance does not, of itself, constitute a partnership, joint venture, sponsorship, or endorsement. Unsolicited ideas, feedback, or suggestions you send to Isisel may be used without obligation or compensation; you assign to Isisel all rights in such feedback to the extent assignable, or otherwise grant an equivalent unrestricted licence.",
        "Creator, influencer, and partnership materials (including pitches, media kits, and user-generated stay content submitted to Isisel) are subject to this section. Commercial collaborations remain governed by any separate written agreement; absent such an agreement, no exclusive licence, revenue share, or brand-usage right is conferred on either party merely by submitting a lead or publishing a post. Durable long-form text: content/legal/INTELLECTUAL_PROPERTY.md.",
      ],
      fr: [
        "Tous les droits, titres et intérêts afférents au service Isisel — notamment, sans limitation, les noms Isisel et Kama Properties, signes, logos, noms de domaine (y compris isisel.com), habillage commercial, interface, mise en page, système de design, icônes, logiciel, code source et objet, algorithmes, bases de données (en tant que compilations), API, documentation et le goodwill associé — sont et demeurent la propriété exclusive d’Isisel et de ses concédants. Aucune licence n’est accordée, hormis le droit limité, révocable, non exclusif, incessible et non sous-licenciable d’accéder au service et de l’utiliser aux fins marketplace prévues, strictement conformément aux présentes Politiques et aux Conditions d’utilisation. Tous les droits non expressément concédés sont réservés.",
        "Vous ne devez pas, et ne devez pas permettre à un tiers de : copier, reproduire, adapter, traduire, modifier, rétroconcevoir, décompiler, désassembler ou créer des œuvres dérivées du service, sauf dans la mesure où la loi applicable interdit une telle restriction ; aspirer, collecter ou extraire de manière systématique les annonces, prix, photographies, avis ou autres données ; encadrer, mettre en miroir ou exploiter commercialement le service ou son apparence ; utiliser les marques Isisel, ou tout nom, logo ou domaine prêtant à confusion, de manière à suggérer un parrainage, une approbation, un partenariat ou une affiliation qui n’existent pas ; ou déposer ou utiliser des marques, dénominations sociales ou identifiants de réseaux sociaux imitant Isisel.",
        "Vous conservez les droits de propriété intellectuelle que vous détenez déjà sur les contenus que vous soumettez licitement (textes d’annonces, photographies, règlements, messages et avis). En les soumettant, vous déclarez disposer de tous les droits nécessaires, et vous concédez par les présentes à Isisel une licence mondiale, gratuite, cessible, sous-licenciable et perpétuelle pour héberger, stocker, reproduire, adapter (y compris formatage, compression et miniatures), représenter, exécuter et diffuser ces contenus uniquement aux fins d’exploitation, d’amélioration, de promotion et de protection du service. Vous renoncez, dans la mesure maximale permise par la loi, aux prétentions de droits moraux contre l’usage raisonnable par Isisel dans les conditions ci-dessus. Cette licence survit à la clôture du compte pour les copies déjà réalisées (sauvegardes, caches, archives légales et pages publiques) jusqu’à leur suppression dans le cours normal.",
        "Il est interdit de téléverser un contenu portant atteinte au droit d’auteur, aux marques, aux dessins et modèles, aux droits à l’image ou aux secrets d’affaires d’autrui. Si vous estimez qu’un contenu sur Isisel porte atteinte à vos droits, adressez une notification écrite à contact@isisel.com identifiant l’œuvre, l’URL ou l’annonce, vos coordonnées, et une déclaration de bonne foi de titularité ou de licence exclusive. Nous pouvons retirer ou désactiver l’accès, informer l’auteur de la publication et, le cas échéant, suspendre les contrevenants réitérants. Isisel ne tranche pas les litiges de titularité entre hôtes et photographes tiers ; ceux-ci restent entre les parties.",
        "Les noms, logos et identifications de produits de tiers pouvant figurer sur le site (marques d’hospitalité, de logiciels ou de paiement notamment) restent la propriété de leurs titulaires. Leur apparition ne constitue pas, à elle seule, un partenariat, une coentreprise, un parrainage ou une approbation. Les idées, retours et suggestions non sollicités adressés à Isisel peuvent être utilisés sans obligation ni contrepartie ; vous cédez à Isisel tous les droits cessibles sur ces retours, ou concédez à défaut une licence équivalente et non restreinte.",
        "Les matériels créateurs, influenceurs et partenariats (pitches, kits média et contenus de séjour soumis à Isisel) relèvent de la présente section. Les collaborations commerciales restent régies par tout contrat écrit distinct ; en l’absence d’un tel contrat, le dépôt d’un lead ou la publication d’un post ne confère à aucune partie de licence exclusive, de partage de revenus ni de droit d’usage de marque. Texte durable : content/legal/INTELLECTUAL_PROPERTY.md.",
      ],
    },
  },
  {
    id: "disputes",
    nav: { en: "Disputes", fr: "Litiges" },
    title: {
      en: "Dispute resolution (outline)",
      fr: "Résolution des litiges (aperçu)",
    },
    paragraphs: {
      en: [
        "First, message the other party politely with facts, dates, and desired outcome. Most stay issues resolve between guest and host.",
        "If you cannot resolve it, contact Isisel with booking references and evidence (messages, receipts, photos). We may mediate informally for marketplace integrity; we are not a court or arbitration panel in MVP.",
        "Nothing in these policies prevents either party from seeking remedies available under local law. For Gambia- and Africa-focused stays, local consumer and lodging norms may apply alongside these platform rules.",
      ],
      fr: [
        "Commencez par écrire poliment à l’autre partie avec faits, dates et résultat souhaité. La plupart des problèmes se règlent entre voyageur et hôte.",
        "Si aucun accord n’est trouvé, contactez Isisel avec références de réservation et preuves. Nous pouvons médier de façon informelle ; nous ne sommes pas un tribunal en MVP.",
        "Rien n’empêche les parties d’exercer les recours prévus par le droit local. Pour les séjours centrés sur la Gambie et l’Afrique, les normes locales peuvent s’appliquer avec ces règles plateforme.",
      ],
    },
  },
  {
    id: "contact",
    nav: { en: "Contact", fr: "Contact" },
    title: { en: "Contact", fr: "Contact" },
    paragraphs: {
      en: [
        "For policy questions, trust & safety reports, or privacy requests, email contact@isisel.com or use in-app messaging.",
        "Include your account email, relevant listing or booking IDs, and a clear summary so we can respond efficiently.",
      ],
      fr: [
        "Pour les questions de politique, signalements confiance & sécurité, ou demandes de confidentialité, écrivez à contact@isisel.com ou utilisez la messagerie in-app.",
        "Indiquez l’e-mail du compte, les identifiants d’annonce ou de réservation, et un résumé clair pour une réponse efficace.",
      ],
    },
  },
  {
    id: "future-marketplace",
    nav: { en: "Future expansion", fr: "Expansion future" },
    title: {
      en: "Future marketplace (land buy/sell)",
      fr: "Marketplace future (achat/vente de terrains)",
    },
    paragraphs: {
      en: [
        "Isisel today focuses on vacation rentals and short stays. We may expand into land and property buy/sell marketplace features in the future.",
        "That expansion is a product roadmap possibility — not a live claim that land transactions are available on the platform today. When those features launch, additional terms, KYC, and local compliance requirements will apply and will be published before use.",
        "Using the current rental product does not create any right to list or purchase land on Isisel until those features are officially released.",
      ],
      fr: [
        "Isisel se concentre aujourd’hui sur les locations de vacances et séjours courts. Nous pourrons élargir vers l’achat/vente de terrains et biens immobiliers à l’avenir.",
        "Cette expansion est une possibilité produit — pas une affirmation que les transactions foncières sont disponibles aujourd’hui. Au lancement, des conditions supplémentaires, KYC et exigences locales s’appliqueront et seront publiées avant usage.",
        "L’usage du produit de location actuel ne crée aucun droit de lister ou d’acheter un terrain sur Isisel avant la sortie officielle de ces fonctions.",
      ],
    },
  },
  {
    id: "terms",
    nav: { en: "Terms of service", fr: "Conditions d’utilisation" },
    title: {
      en: "Terms of service (summary)",
      fr: "Conditions d’utilisation (résumé)",
    },
    paragraphs: {
      en: [
        "By creating an account or using Isisel, you agree to these Policies and the Terms of Service version shown at acceptance (currently stored as a versioned key on device and, after sign-in, on your user profile when available).",
        "We grant you a limited, non-exclusive license to use the product for lawful booking and hosting. You may not scrape, abuse APIs, reverse-engineer for competitive cloning, or interfere with other users. Intellectual property is governed by the Intellectual property section of these Policies.",
        "The service is provided “as is” within commercial reasonableness for an early-stage marketplace. We limit liability to the maximum extent permitted by applicable law; we are not liable for off-platform payments, host–guest disputes beyond our mediation role, or indirect damages.",
        "We may update terms when the product changes. Material updates will bump the terms version; you may be asked to re-accept before signing in again.",
        "Durable full text: see content/legal/TERMS_OF_SERVICE.md in the project repository.",
      ],
      fr: [
        "En créant un compte ou en utilisant Isisel, vous acceptez ces Politiques et la version des Conditions affichée à l’acceptation (clé versionnée sur l’appareil et, après connexion, sur le profil utilisateur lorsque disponible).",
        "Nous vous accordons une licence limitée et non exclusive d’usage légal pour réserver et héberger. Interdiction de scraper, d’abuser des API, de rétro-ingénierie concurrentielle ou de nuire aux autres utilisateurs. La propriété intellectuelle est régie par la section Propriété intellectuelle de ces Politiques.",
        "Le service est fourni « en l’état » dans la limite du raisonnable pour une marketplace en phase initiale. Nous limitons la responsabilité dans la mesure permise par la loi ; nous ne sommes pas responsables des paiements hors plateforme, des litiges hôte–voyageur au-delà de notre rôle de médiation, ni des dommages indirects.",
        "Nous pouvons mettre à jour les conditions lorsque le produit évolue. Une mise à jour matérielle incrémente la version ; une nouvelle acceptation pourra être demandée avant connexion.",
        "Texte durable : voir content/legal/TERMS_OF_SERVICE.md dans le dépôt.",
      ],
    },
  },
  {
    id: "host-terms",
    nav: { en: "Host terms", fr: "Conditions hôtes" },
    title: { en: "Host terms (summary)", fr: "Conditions hôtes (résumé)" },
    paragraphs: {
      en: [
        "Listing accuracy, calendar honesty, and lawful operation of your lodging are mandatory. Payments may be arranged off-platform in MVP; you must still honor confirmed stays and communicate clearly.",
        "We may moderate, unpublish, or suspend accounts for fraud, safety risk, discrimination, or repeated guest harm. Intellectual property in the Isisel brand and software remains ours; you keep rights in your own photos and text, and grant us a license to display them on the service.",
        "Liability between host and guest for the stay is primarily between those parties. Platform liability limits in the Terms of Service apply. Market context: we build for African hospitality realities, including mobile money and relationship-driven bookings — without waiving legal compliance.",
        "Future land marketplace clauses: the platform may expand; additional host/seller terms will apply then. Durable full text: content/legal/HOST_TERMS.md.",
      ],
      fr: [
        "L’exactitude des annonces, l’honnêteté du calendrier et l’exploitation légale de votre hébergement sont obligatoires. Les paiements peuvent être hors plateforme en MVP ; vous devez honorer les séjours confirmés et communiquer clairement.",
        "Nous pouvons modérer, dépublier ou suspendre en cas de fraude, risque de sécurité, discrimination ou préjudices répétés. La propriété intellectuelle de la marque et du logiciel Isisel nous appartient ; vous conservez vos photos et textes, et nous accordez une licence d’affichage sur le service.",
        "La responsabilité du séjour pèse surtout entre hôte et voyageur. Les limites de responsabilité des Conditions s’appliquent. Contexte : nous concevons pour l’hospitalité africaine, y compris mobile money et réservations relationnelles — sans écarter le respect de la loi.",
        "Clause marketplace foncière future : la plateforme pourra s’étendre ; des conditions vendeur supplémentaires s’appliqueront alors. Texte durable : content/legal/HOST_TERMS.md.",
      ],
    },
  },
  {
    id: "cookies",
    nav: { en: "Cookies", fr: "Cookies" },
    title: { en: "Cookies & similar tech", fr: "Cookies et technologies similaires" },
    paragraphs: {
      en: [
        "We use essential cookies and storage for authentication (e.g. session), security, and remembering preferences such as language and terms acceptance on your device.",
        "We may use privacy-conscious analytics (for example Vercel Analytics) to understand aggregate traffic. We do not use invasive third-party ad trackers as part of the core MVP experience.",
        "You can clear site data in your browser; you may need to sign in and re-accept terms afterward.",
      ],
      fr: [
        "Nous utilisons des cookies et un stockage essentiels pour l’authentification (session), la sécurité, et mémoriser des préférences comme la langue et l’acceptation des conditions sur votre appareil.",
        "Nous pouvons utiliser une analytique respectueuse de la vie privée (par ex. Vercel Analytics) pour le trafic agrégé. Nous n’utilisons pas de traqueurs publicitaires invasifs dans l’expérience MVP de base.",
        "Vous pouvez effacer les données du site dans le navigateur ; une reconnexion et une nouvelle acceptation des conditions pourront être nécessaires.",
      ],
    },
  },
];

export function getSectionById(id) {
  return POLICY_SECTIONS.find((s) => s.id === id) || null;
}

export const SECTION_IDS = POLICY_SECTIONS.map((s) => s.id);
