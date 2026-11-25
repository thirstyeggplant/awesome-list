// French, translated from messages/en.ts. The comments say where a message appears and what its placeholders are;
// they need no translating. French plurals: one (0 and 1), many (round millions: "1 000 000 de listes"), other.
import { p } from '../format.js';
import type { Messages } from './en.js';

export const fr: Messages = {
  site: {
    /** The browser tab's title on most pages: the page's title, then the site's name. */
    title: '{title} · {site}',
    /** The first link on every page, for keyboards and screen readers; it jumps past the header. */
    skip: 'Aller au contenu',
    /** The footer of every page. <1> links to the About page's section on leaving a list out. */
    footer: '{site} indexe des noms, des sections et des liens. Les descriptions appartiennent aux listes et ne sont pas copiées ici. Vous maintenez une liste et souhaitez qu’elle soit retirée ? <1>Ouvrez une issue</1>.',
    /** The label of the breadcrumb trail (for screen readers). */
    breadcrumb: 'Fil d’Ariane',
  },
  nav: {
    lists: 'Listes',
    items: 'Éléments',
    about: 'À propos',
    /** The search box in the header: its label, and the hint inside it ("/" is the key that opens quick search). */
    search: 'Rechercher',
    searchHint: 'Rechercher  ( / )',
  },
  quick: {
    /** The quick-search dialog, opened with Ctrl-K or "/". */
    label: 'Recherche rapide',
    placeholder: 'Rechercher des listes, des éléments et des tags',
    /** The label of the list of results inside the dialog (for screen readers). */
    results: 'Résultats',
    help: '↑ ↓ pour se déplacer, Entrée pour ouvrir, Échap pour fermer',
    /** Group headings inside the dialog's results. */
    lists: 'Listes',
    items: 'Éléments',
    tags: 'Tags',
  },
  lang: {
    /** The label of the list of languages in the footer (for screen readers). */
    switcher: 'Langue',
    /**
     * A bar shown when the visitor's browser prefers this language over the page's. Written in this file's own
     * language, because it is shown to someone who reads it.
     */
    suggest: 'Lire cette page en français',
    /** The label of the bar's close button (for screen readers), also in this file's own language. */
    close: 'Fermer',
  },
  count: {
    lists: p({ one: '{n} liste', many: '{n} de listes', other: '{n} listes' }),
    items: p({ one: '{n} élément', many: '{n} d’éléments', other: '{n} éléments' }),
    listings: p({ one: '{n} mention', many: '{n} de mentions', other: '{n} mentions' }),
    sections: p({ one: '{n} section', many: '{n} de sections', other: '{n} sections' }),
    links: p({ one: '{n} lien', many: '{n} de liens', other: '{n} liens' }),
    stars: p({ one: '{n} étoile', many: '{n} d’étoiles', other: '{n} étoiles' }),
    projects: p({ one: '{n} projet', many: '{n} de projets', other: '{n} projets' }),
    otherLists: p({ one: '{n} autre liste', many: '{n} d’autres listes', other: '{n} autres listes' }),
    /** "{items} in {sections}": e.g. "12 items in 4 sections"; both values are the plurals above. */
    itemsInSections: '{items} dans {sections}',
    /** A list's reason for being read only in part: e.g. "5 items from 81 links"; both values are plurals above. */
    itemsFromLinks: '{items} sur {links}',
    /** "N of M" in a list page's filter: how many entries are shown of all. */
    shownOf: '{n} sur {m}',
  },
  /** One-word labels of an item's kind, shown beside "Kind" and in the facet rail. */
  kind: {
    repo: 'dépôt',
    package: 'paquet',
    video: 'vidéo',
    paper: 'publication',
    article: 'article',
    site: 'site',
  },
  /** A repository's state. Shown as a short word beside its name, and in the facet rail. */
  status: {
    active: 'actif',
    quiet: 'inactif',
    archived: 'archivé',
    gone: 'disparu',
  },
  /** A list's state, in the facet rail of /lists: read in full, in part, not read, gone from GitHub. */
  listStatus: {
    ok: 'lue en entier',
    partial: 'lue en partie',
    unparsed: 'pas encore lue',
    gone: 'disparue',
  },
  /** The ways of ordering a listing page, after "sort by". */
  sort: {
    relevance: 'pertinence',
    lists: 'listes',
    stars: 'étoiles',
    items: 'éléments',
    updated: 'mise à jour',
    name: 'nom',
  },
  yes: 'oui',
  no: 'non',
  common: {
    search: 'Rechercher',
    filter: 'Filtrer',
    searchListsAndItems: 'Rechercher des listes et des éléments',
    nothingHere: 'Rien ici.',
    previous: '← Précédent',
    next: 'Suivant →',
    /** After the removable filter chips: takes them all away. */
    clearAll: 'Tout effacer',
    /** "12 lists · sort by stars · items · updated · name"; {sorts} are the sort words, the current one in bold. */
    sortBy: '{count} · trier par {sorts}',
    /** Shown past the last page a listing will show. */
    pagingStops: 'La pagination s’arrête à la page {n}. Affinez les filtres pour en voir plus.',
    /** The removable chip for a search: “{q}” is what was searched for. */
    searchChip: '« {q} »',
    /** Between names in a short list, as in "Widgets, Gadgets, Tools" (Chinese and Japanese: '、'). */
    separator: ', ',
  },
  facts: {
    stars: 'Étoiles',
    lastPush: 'Dernier push',
    language: 'Langage',
    licence: 'Licence',
    entries: 'Entrées',
    namedBy: 'Cité par',
    state: 'État',
    fork: 'Fork',
    kind: 'Type',
    host: 'Hôte',
    renamedFrom: 'Ancien nom',
  },
  home: {
    /** The page's heading: the same words as its title, without the site's name. */
    h1: p({
      one: '{n} liste awesome et tout ce qu’elle contient',
      many: '{n} de listes awesome et tout ce qu’elles contiennent',
      other: '{n} listes awesome et tout ce qu’elles contiennent',
    }),
    /** The line of counts under the search box; {lists}, {items} and {listings} are the count plurals. */
    counts: '{lists} · {items} · {listings} · données du {date}',
    mostNamed: 'Cités par le plus de listes',
  },
  lists: {
    h1: 'Listes',
    filterLists: 'Filtrer les listes',
    category: 'Catégorie',
    licence: 'Licence',
    status: 'État',
  },
  list: {
    contents: 'Sommaire',
    filterThisList: 'Filtrer cette liste',
    collapseAll: 'Tout replier',
    expandAll: 'Tout déplier',
    /** The label of the "#" link beside a section heading (for screen readers). */
    sectionLink: 'Lien vers cette section',
    readOriginal: 'Lire l’original sur GitHub',
    suggestChange: 'Proposer une modification',
    /** For a list whose entries could not be read; {reason} is why, e.g. "the readme is in reStructuredText". */
    unparsed: 'Nous n’avons pas encore pu lire les entrées de cette liste ({reason}).',
    noReason: 'aucune raison indiquée',
    /**
     * Under a list's entries. <1> is the list's name (bold), {owner} a GitHub login, <2> the link to the
     * repository, whose text is {repo} (github.com/owner/repo).
     */
    attribution: 'Cette page est un index de <1>{name}</1>, une liste maintenue par {owner} et ses contributeurs sur <2>{repo}</2>. La sélection et l’ordre sont les leurs ; le résumé ci-dessus est le nôtre.',
    /** Follows the attribution; {oid} is a commit's short hash, {date} the day it was read. */
    readAt: 'Lue au commit {oid} le {date}.',
    /** Follows the attribution; {license} is a licence's name, e.g. "MIT". */
    licence: 'Licence : {license}.',
    /** A heading after a list's entries: other lists of the same category. */
    moreIn: 'Plus dans {category}',
  },
  item: {
    /** Under an item's name: the other names lists give it. */
    alsoListedAs: 'Aussi référencé sous : {names}',
    /** When an item is itself one of the lists; <1> links to its list page. */
    isList: 'Cet élément est lui-même une liste de la bibliothèque : <1>l’ouvrir</1>.',
    archived: 'Archivé par son propriétaire.',
    gone: 'Ce dépôt n’existe plus sur GitHub.',
    /** {month} is a month and year, e.g. "Mar 2023". */
    quietSince: 'Aucun push depuis {month}.',
    quiet: 'Aucun push depuis deux ans.',
    factsAsOf: 'Données GitHub au {date}.',
    inLists: p({ one: 'Dans {n} liste', many: 'Dans {n} de listes', other: 'Dans {n} listes' }),
    /** Beside one of the lists an item is in, when that list calls it by another name. */
    listedAs: 'référencé sous « {name} »',
    alongside: 'Référencé aux côtés de',
    attribution: 'Cité par les listes ci-dessus. Suivez une liste pour lire ce qu’en disent ses curateurs. Pour proposer une modification, ouvrez une issue sur l’une de ces listes.',
  },
  items: {
    h1: 'Éléments',
    searchItems: 'Rechercher des éléments',
    /** After the count of results, when a search found more than can be ranked. */
    bestOnly: ' (les meilleurs résultats seulement)',
    kind: 'Type',
    status: 'État',
    language: 'Langage',
    licence: 'Licence',
    topic: 'Sujet',
    category: 'Catégorie',
    list: 'Liste',
    stars: 'Étoiles',
    namedBy: 'Cité par',
    /** Facet values: "1,000+ stars", "in 5+ lists". */
    starsAtLeast: '{n}+ étoiles',
    inAtLeast: 'dans {n}+ listes',
  },
  owner: {
    listsTheyKeep: 'Listes maintenues',
    theirProjects: 'Ses projets cités par des listes',
    /** A link under an owner's projects to all of them on the Items page. */
    allInItems: p({ one: 'Voir {n} dans Éléments', many: 'Voir les {n} dans Éléments', other: 'Voir les {n} dans Éléments' }),
  },
  search: {
    h1: 'Recherche',
    lists: 'Listes',
    sections: 'Sections',
    items: 'Éléments',
    /** Beside a section found by search: the list it is in. */
    inList: 'dans {list}',
    noItems: 'Aucun élément ne correspond.',
    allItems: p({ one: 'Voir {n} élément', many: 'Voir les {n} d’éléments', other: 'Voir les {n} éléments' }),
  },
  notFound: {
    h1: 'Rien à cette adresse',
    /** Above a few pages that might be what the visitor wanted. */
    perhaps: 'Peut-être',
  },
  about: {
    h1: 'À propos de {site}',
    /** <1> links to the index of awesome lists. {lists}, {items} are count plurals ("671 lists"). */
    intro: '{site} est une bibliothèque gratuite de toutes les listes awesome de l’<1>index des listes awesome</1> et de leur contenu : {lists}, les {items} qu’elles citent, et l’endroit où chaque liste cite chacun d’eux.',
    shownTitle: 'Ce qui est affiché, et ce qui ne l’est pas',
    shown: 'Le site affiche des noms, des sections, des liens et des faits, ainsi que nos propres mots. Il n’affiche jamais la description d’un curateur ou du propriétaire d’un dépôt. Le résumé d’une liste est le nôtre ; ce qu’une liste dit d’une entrée reste sur la liste, à un lien de distance.',
    attributionTitle: 'Attribution',
    attribution: 'La sélection et l’ordre de chaque liste appartiennent aux personnes qui la maintiennent. Chaque page de liste indique où se trouve la liste et le commit auquel elle a été lue. Les données sur les dépôts (étoiles, dernier push, langage, licence, sujets) viennent de GitHub.',
    leaveOutTitle: 'Comment retirer une liste',
    /** <1> links to this project's issues on GitHub. */
    leaveOut: 'Vous maintenez une liste et souhaitez qu’elle soit retirée ? <1>Ouvrez une issue sur le dépôt de ce projet</1> en nommant la liste. Elle sera retirée au prochain build : ses entrées ne seront plus lues et sa page sera supprimée.',
    coverageTitle: 'Couverture',
    /** {ok}, {partial}, {unparsed} are plain numbers. */
    coverageLists: 'Listes : {ok} lues en entier, {partial} en partie, {unparsed} pas encore lues.',
    /** As above, when some lists are gone from GitHub; {gone} is a plain number. */
    coverageListsGone: 'Listes : {ok} lues en entier, {partial} en partie, {unparsed} pas encore lues, {gone} disparues de GitHub.',
    /** {items} is a count plural ("116,162 items"); the rest are plain numbers. */
    coverageItems: '{items} : {repo} dépôts, {site} sites, {video} vidéos, {article} articles, {package} paquets, {paper} publications.',
    coverageTwoOrMore: 'Éléments cités par au moins deux listes : {n}.',
    coverageRepos: 'Dépôts : {active} actifs, {quiet} inactifs (aucun push depuis deux ans), {archived} archivés, {gone} disparus.',
    dataOf: 'Données du {date}.',
  },
  /** Titles (in the browser's tab and in search results) and descriptions (under the title in search results). */
  meta: {
    /** Aim at 60 characters or fewer (30 for Chinese, Japanese, Korean). Descriptions: 70 to 160 (80). */
    home: {
      title: p({
        one: '{site} : {n} liste awesome et tout son contenu',
        many: '{site} : {n} de listes awesome et leur contenu',
        other: '{site} : {n} listes awesome et tout leur contenu',
      }),
      /** {n} is the number of lists; {items} the number of projects, already formatted. */
      description: p({
        one: 'Un index de {n} liste awesome et des {items} projets qu’elle cite, par catégorie, langage, licence et sujet.',
        many: 'Un index de {n} de listes awesome et des {items} projets qu’elles citent, par catégorie, langage, licence et sujet.',
        other: 'Un index de {n} listes awesome et des {items} projets qu’elles citent, par catégorie, langage, licence et sujet.',
      }),
    },
    lists: {
      title: p({ one: '{n} liste awesome', many: 'Les {n} de listes awesome', other: 'Les {n} listes awesome' }),
      description: p({
        one: '{n} liste awesome avec sa taille, ses étoiles et notre résumé en une ligne.',
        many: '{n} de listes awesome avec leur taille, leurs étoiles et notre résumé en une ligne.',
        other: '{n} listes awesome avec leur taille, leurs étoiles et notre résumé en une ligne.',
      }),
    },
    category: {
      /** {category} is a category's name, e.g. "Platforms". */
      title: p({ one: '{category} : {n} liste awesome', many: '{category} : {n} de listes awesome', other: '{category} : {n} listes awesome' }),
      description: p({
        one: '{n} liste awesome dans la catégorie {category}, avec sa taille, ses étoiles et son résumé.',
        many: '{n} de listes awesome dans la catégorie {category}, avec taille, étoiles et résumé.',
        other: '{n} listes awesome dans la catégorie {category}, avec taille, étoiles et résumé.',
      }),
    },
    /** A later page of a listing: {title} is the first page's title. */
    page: '{title}, page {page}',
    list: {
      /** {name} is the list's name. */
      title: p({ one: '{name} : une liste awesome de {n} élément', many: '{name} : une liste awesome de {n} d’éléments', other: '{name} : une liste awesome de {n} éléments' }),
      /** When the list has no summary of ours; {repo} is github.com/owner/repo. */
      description: '{name}, une liste awesome maintenue sur {repo}.',
    },
    item: {
      /** A repository: {repo} is owner/repo. */
      repoTitle: p({ one: '{repo} : dans {n} liste awesome', many: '{repo} : dans {n} de listes awesome', other: '{repo} : dans {n} listes awesome' }),
      /** Anything else: {name} is its name. */
      title: p({ one: '{name} : dans {n} liste awesome', many: '{name} : dans {n} de listes awesome', other: '{name} : dans {n} listes awesome' }),
      /** {lists} are up to three list names. */
      repoDescription: p({
        one: '{name} est cité par {n} liste awesome : {lists}.',
        many: '{name} est cité par {n} de listes awesome : {lists}.',
        other: '{name} est cité par {n} listes awesome : {lists}.',
      }),
      /** {host} is a web site's host, e.g. example.com. */
      description: p({
        one: '{name} ({host}) est cité par {n} liste awesome : {lists}.',
        many: '{name} ({host}) est cité par {n} de listes awesome : {lists}.',
        other: '{name} ({host}) est cité par {n} listes awesome : {lists}.',
      }),
    },
    owner: {
      /** {display} is a GitHub login. */
      title: '{display} : listes et projets',
      /** {lists} and {projects} are count plurals ("3 lists", "12 projects"). */
      description: '{display} sur GitHub : {lists} maintenues, {projects} cités par des listes.',
    },
    items: {
      title: p({
        one: '{n} projet cité par des listes awesome',
        many: '{n} de projets cités par des listes awesome',
        other: '{n} projets cités par des listes awesome',
      }),
      description: p({
        one: 'Parcourez {n} projet par langage, licence, sujet, étoiles et nombre de listes qui le citent.',
        many: 'Parcourez {n} de projets par langage, licence, sujet, étoiles et nombre de listes qui les citent.',
        other: 'Parcourez {n} projets par langage, licence, sujet, étoiles et nombre de listes qui les citent.',
      }),
      /** One filter: {label} is what it is, e.g. "Go" or "archived" or "1,000+ stars". */
      filteredTitle: p({
        one: '{label} : {n} projet dans des listes awesome',
        many: '{label} : {n} de projets dans des listes awesome',
        other: '{label} : {n} projets dans des listes awesome',
      }),
      filteredDescription: p({
        one: '{label} : {n} projet cité par des listes awesome, avec ses étoiles et les listes qui le citent.',
        many: '{label} : {n} de projets cités par des listes awesome, avec leurs étoiles et les listes qui les citent.',
        other: '{label} : {n} projets cités par des listes awesome, avec leurs étoiles et les listes qui les citent.',
      }),
      /** A search in the items: {q} is what was searched for. */
      matching: 'Éléments correspondant à « {q} »',
    },
    about: {
      title: 'À propos de {site}',
      description: 'Ce que {site} affiche, d’où viennent les données et comment retirer une liste.',
    },
  },
};
