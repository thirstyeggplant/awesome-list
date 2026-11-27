// German. Translated from messages/en.ts. After changing a message, run `pnpm check-translations --stamp de`.
// The comments say where a message appears and what its placeholders are; they need no translating.
import { p } from '../format.js';
import type { Messages } from './en.js';

export const de: Messages = {
  site: {
    /** The browser tab's title on most pages: the page's title, then the site's name. */
    title: '{title} · {site}',
    /** The first link on every page, for keyboards and screen readers; it jumps past the header. */
    skip: 'Zum Inhalt springen',
    /** The footer of every page. <1> links to the About page's section on leaving a list out. */
    footer: '{site} verzeichnet Namen, Abschnitte und Links. Beschreibungen gehören den Listen und werden hier nicht übernommen. Du pflegst eine Liste und möchtest sie hier nicht sehen? <1>Eröffne ein Issue</1>.',
    /** The label of the breadcrumb trail (for screen readers). */
    breadcrumb: 'Brotkrumennavigation',
  },
  nav: {
    lists: 'Listen',
    items: 'Einträge',
    about: 'Über',
    /** The search box in the header: its label, and the hint inside it ("/" is the key that opens quick search). */
    search: 'Suche',
    searchHint: 'Suchen  ( / )',
  },
  quick: {
    /** The quick-search dialog, opened with Ctrl-K or "/". */
    label: 'Schnellsuche',
    placeholder: 'Listen, Einträge und Tags durchsuchen',
    /** The label of the list of results inside the dialog (for screen readers). */
    results: 'Ergebnisse',
    help: '↑ ↓ zum Wechseln, Enter zum Öffnen, Esc zum Schließen',
    /** Group headings inside the dialog's results. */
    lists: 'Listen',
    items: 'Einträge',
    tags: 'Tags',
  },
  lang: {
    /** The label of the list of languages in the footer (for screen readers). */
    switcher: 'Sprache',
    /**
     * A bar shown when the visitor's browser prefers this language over the page's. Written in this file's own
     * language, because it is shown to someone who reads it.
     */
    suggest: 'Diese Seite auf Deutsch lesen',
    /** The label of the bar's close button (for screen readers), also in this file's own language. */
    close: 'Schließen',
  },
  count: {
    lists: p({ one: '{n} Liste', other: '{n} Listen' }),
    items: p({ one: '{n} Eintrag', other: '{n} Einträge' }),
    listings: p({ one: '{n} Nennung', other: '{n} Nennungen' }),
    sections: p({ one: '{n} Abschnitt', other: '{n} Abschnitte' }),
    links: p({ one: '{n} Link', other: '{n} Links' }),
    stars: p({ one: '{n} Stern', other: '{n} Sterne' }),
    projects: p({ one: '{n} Projekt', other: '{n} Projekte' }),
    otherLists: p({ one: '{n} weitere Liste', other: '{n} weitere Listen' }),
    /** "{items} in {sections}": e.g. "12 items in 4 sections"; both values are the plurals above. */
    itemsInSections: '{items} in {sections}',
    /** A list's reason for being read only in part: e.g. "5 items from 81 links"; both values are plurals above. */
    itemsFromLinks: '{items} aus {links}',
    /** "N of M" in a list page's filter: how many entries are shown of all. */
    shownOf: '{n} von {m}',
    /** On a phone, how many lists name an item, in a row's second line. */
    inLists: p({ one: 'in {n} Liste', other: 'in {n} Listen' }),
  },
  /** One-word labels of an item's kind, shown beside "Kind" and in the facet rail. */
  kind: {
    repo: 'Repository',
    package: 'Paket',
    video: 'Video',
    paper: 'Paper',
    article: 'Artikel',
    site: 'Website',
  },
  /** A repository's state. Shown as a short word beside its name, and in the facet rail. */
  status: {
    active: 'aktiv',
    quiet: 'ruhig',
    archived: 'archiviert',
    gone: 'verschwunden',
  },
  /** A list's state, in the facet rail of /lists: read in full, in part, not read, gone from GitHub. */
  listStatus: {
    ok: 'vollständig gelesen',
    partial: 'teilweise gelesen',
    unparsed: 'noch nicht gelesen',
    gone: 'verschwunden',
  },
  /** The ways of ordering a listing page, after "sort by". */
  sort: {
    relevance: 'Relevanz',
    lists: 'Listen',
    stars: 'Sterne',
    items: 'Einträge',
    updated: 'Aktualisierung',
    name: 'Name',
  },
  yes: 'ja',
  no: 'nein',
  common: {
    search: 'Suchen',
    filter: 'Filtern',
    searchListsAndItems: 'Listen und Einträge durchsuchen',
    nothingHere: 'Hier ist nichts.',
    previous: '← Zurück',
    next: 'Weiter →',
    /** After the removable filter chips: takes them all away. */
    clearAll: 'Alle entfernen',
    /** "12 lists · sort by stars · items · updated · name"; {sorts} are the sort words, the current one in bold. */
    sortBy: '{count} · sortieren nach {sorts}',
    /** Shown past the last page a listing will show. */
    pagingStops: 'Das Blättern endet auf Seite {n}. Schränke die Filter ein, um mehr zu sehen.',
    /** The removable chip for a search: “{q}” is what was searched for. */
    searchChip: '„{q}“',
    /** Between names in a short list, as in "Widgets, Gadgets, Tools" (Chinese and Japanese: '、'). */
    separator: ', ',
    /** The labels over the columns of a listing's rows. */
    columns: { name: 'Name', language: 'Sprache', stars: 'Sterne', lists: 'Listen', updated: 'Aktualisiert', items: 'Einträge' },
  },
  facts: {
    stars: 'Sterne',
    lastPush: 'Letzter Push',
    language: 'Sprache',
    licence: 'Lizenz',
    entries: 'Einträge',
    namedBy: 'Genannt von',
    state: 'Status',
    fork: 'Fork',
    kind: 'Art',
    host: 'Host',
    renamedFrom: 'Umbenannt von',
  },
  home: {
    /** The page's heading: the same words as its title, without the site's name. */
    h1: p({ one: '{n} awesome Liste und alles darin', other: '{n} awesome Listen und alles darin' }),
    /** The line of counts under the search box; {lists}, {items} and {listings} are the count plurals. */
    counts: '{lists} · {items} · {listings} · Datenstand {date}',
    mostNamed: 'Von den meisten Listen genannt',
    /** The line of the most common languages under the counts, and the link after them to every project. */
    browseByLanguage: 'Nach Sprache stöbern',
    allProjects: 'Alle Projekte',
    /** A heading over the lists with the most stars, as cards; then a link to every list. */
    startHere: 'Hier anfangen',
    allLists: p({ one: '{n} Liste', other: 'Alle {n} Listen' }),
    /** A heading over every list, category by category. */
    byCategory: 'Alle Listen nach Kategorie',
    /** Under the items named by the most lists: a link to all of those named by two or more. */
    namedByTwo: 'Alle Projekte, die von 2 oder mehr Listen genannt werden',
  },
  lists: {
    h1: 'Listen',
    filterLists: 'Listen filtern',
    category: 'Kategorie',
    licence: 'Lizenz',
    status: 'Status',
  },
  list: {
    contents: 'Inhalt',
    filterThisList: 'Diese Liste filtern',
    collapseAll: 'Alle einklappen',
    expandAll: 'Alle ausklappen',
    /** The label of the "#" link beside a section heading (for screen readers). */
    sectionLink: 'Link zu diesem Abschnitt',
    readOriginal: 'Original auf GitHub lesen',
    suggestChange: 'Änderung vorschlagen',
    /** For a list whose entries could not be read; {reason} is why, e.g. "the readme is in reStructuredText". */
    unparsed: 'Die Einträge dieser Liste konnten wir noch nicht lesen ({reason}).',
    noReason: 'kein Grund angegeben',
    /**
     * Under a list's entries. <1> is the list's name (bold), {owner} a GitHub login, <2> the link to the
     * repository, whose text is {repo} (github.com/owner/repo).
     */
    attribution: 'Diese Seite verzeichnet <1>{name}</1>, eine Liste, die {owner} und Mitwirkende unter <2>{repo}</2> pflegen. Auswahl und Reihenfolge stammen von ihnen, die Zusammenfassung oben von uns.',
    /** Follows the attribution; {oid} is a commit's short hash, {date} the day it was read. */
    readAt: 'Gelesen bei Commit {oid} am {date}.',
    /** Follows the attribution; {license} is a licence's name, e.g. "MIT". */
    licence: 'Lizenz: {license}.',
    /** A heading after a list's entries: other lists of the same category. */
    moreIn: 'Mehr in {category}',
  },
  item: {
    /** Under an item's name: the other names lists give it. */
    alsoListedAs: 'Auch geführt als: {names}',
    /** When an item is itself one of the lists; <1> links to its list page. */
    isList: 'Das ist selbst eine Liste in der Bibliothek: <1>öffnen</1>.',
    archived: 'Von seinem Owner archiviert.',
    gone: 'GitHub hat dieses Repository nicht mehr.',
    /** {month} is a month and year, e.g. "Mar 2023". */
    quietSince: 'Keine Pushes seit {month}.',
    quiet: 'Keine Pushes seit zwei Jahren.',
    factsAsOf: 'Fakten von GitHub, Stand {date}.',
    inLists: p({ one: 'In {n} Liste', other: 'In {n} Listen' }),
    /** Beside one of the lists an item is in, when that list calls it by another name. */
    listedAs: 'geführt als ‚{name}‘',
    alongside: 'Zusammen genannt mit',
    attribution: 'Genannt von den Listen oben. Folge einer Liste, um zu lesen, was ihre Kuratoren darüber sagen. Für eine Änderung eröffne ein Issue bei einer dieser Listen.',
    /** The item's one outbound link, as a button: to its repository, or to its site ({host}, e.g. example.com). */
    openGitHub: 'Auf GitHub öffnen ↗',
    visit: '{host} besuchen ↗',
    /** A heading over other projects of the same GitHub owner; {owner} is a login. */
    moreFrom: 'Mehr von {owner}',
    /** Under them: a link to the owner's page. */
    allFrom: p({ one: '{n} Projekt von {owner}', other: 'Alle {n} Projekte von {owner}' }),
    /** The label over an item's topic chips. */
    topics: 'Themen',
  },
  items: {
    h1: 'Einträge',
    searchItems: 'Einträge durchsuchen',
    /** After the count of results, when a search found more than can be ranked. */
    bestOnly: ' (nur die besten Treffer)',
    kind: 'Art',
    status: 'Status',
    language: 'Sprache',
    licence: 'Lizenz',
    topic: 'Thema',
    category: 'Kategorie',
    list: 'Liste',
    stars: 'Sterne',
    namedBy: 'Genannt von',
    /** Facet values: "1,000+ stars", "in 5+ lists". */
    starsAtLeast: '{n}+ Sterne',
    inAtLeast: 'in {n}+ Listen',
  },
  owner: {
    listsTheyKeep: 'Gepflegte Listen',
    theirProjects: 'Eigene Projekte, die Listen nennen',
    /** A link under an owner's projects to all of them on the Items page. */
    allInItems: p({ one: '{n} in Einträgen', other: 'Alle {n} in Einträgen' }),
  },
  search: {
    h1: 'Suche',
    lists: 'Listen',
    sections: 'Abschnitte',
    items: 'Einträge',
    /** Beside a section found by search: the list it is in. */
    inList: 'in {list}',
    noItems: 'Keine passenden Einträge.',
    allItems: p({ one: '{n} Eintrag', other: 'Alle {n} Einträge' }),
  },
  notFound: {
    h1: 'Unter dieser Adresse gibt es nichts',
    /** Above a few pages that might be what the visitor wanted. */
    perhaps: 'Vielleicht',
  },
  about: {
    h1: 'Über {site}',
    /** <1> links to the index of awesome lists. {lists}, {items} are count plurals ("671 lists"). */
    intro: '{site} ist eine freie Bibliothek aller awesome Listen im <1>Verzeichnis der awesome Listen</1> und allem, was darin steht: {lists}, die {items}, die sie nennen, und wo jede Liste welchen Eintrag nennt.',
    shownTitle: 'Was gezeigt wird und was nicht',
    shown: 'Die Site zeigt Namen, Abschnitte, Links und Fakten sowie unsere eigenen Worte. Sie zeigt nie die Beschreibung eines Kurators oder Repository-Owners. Die Zusammenfassung einer Liste stammt von uns; was eine Liste über einen Eintrag sagt, bleibt auf der Liste, einen Link entfernt.',
    attributionTitle: 'Urheberschaft',
    attribution: 'Auswahl und Reihenfolge jeder Liste gehören den Menschen, die sie pflegen. Jede Listenseite nennt, wo die Liste liegt und bei welchem Commit sie gelesen wurde. Fakten zu Repositorys (Sterne, letzter Push, Sprache, Lizenz, Topics) stammen von GitHub.',
    leaveOutTitle: 'Wie eine Liste herausgenommen wird',
    /** <1> links to this project's issues on GitHub. */
    leaveOut: 'Du pflegst eine Liste und möchtest sie hier nicht sehen? <1>Eröffne ein Issue im Repository dieses Projekts</1> und nenne die Liste. Beim nächsten Build wird sie herausgenommen: Ihre Einträge werden nicht gelesen und ihre Seite wird entfernt.',
    coverageTitle: 'Abdeckung',
    /** {ok}, {partial}, {unparsed} are plain numbers. */
    coverageLists: '{ok} Listen vollständig gelesen, {partial} teilweise, {unparsed} noch nicht.',
    /** As above, when some lists are gone from GitHub; {gone} is a plain number. */
    coverageListsGone: '{ok} Listen vollständig gelesen, {partial} teilweise, {unparsed} noch nicht, {gone} nicht mehr auf GitHub.',
    /** {items} is a count plural ("116,162 items"); the rest are plain numbers. */
    coverageItems: '{items}: {repo} Repositorys, {site} Websites, {video} Videos, {article} Artikel, {package} Pakete, {paper} Paper.',
    coverageTwoOrMore: '{n} Einträge werden von zwei oder mehr Listen genannt.',
    coverageRepos: 'Repositorys: {active} aktiv, {quiet} ruhig (seit zwei Jahren kein Push), {archived} archiviert, {gone} verschwunden.',
    dataOf: 'Datenstand: {date}.',
  },
  /** Titles (in the browser's tab and in search results) and descriptions (under the title in search results). */
  meta: {
    /** Aim at 60 characters or fewer (30 for Chinese, Japanese, Korean). Descriptions: 70 to 160 (80). */
    home: {
      title: p({ one: '{site}: {n} awesome Liste und alles darin', other: '{site}: {n} awesome Listen und alles darin' }),
      /** {n} is the number of lists; {items} the number of projects, already formatted. */
      description: p({
        one: 'Ein Verzeichnis von {n} awesome Liste und den {items} Projekten darin, nach Kategorie, Sprache, Lizenz und Thema.',
        other: 'Ein Verzeichnis von {n} awesome Listen und den {items} Projekten darin, nach Kategorie, Sprache, Lizenz und Thema.',
      }),
    },
    lists: {
      title: p({ one: '{n} awesome Liste', other: 'Alle {n} awesome Listen' }),
      description: p({ one: '{n} awesome Liste mit Umfang, Sternen und unserer eigenen Kurzbeschreibung.', other: '{n} awesome Listen mit Umfang, Sternen und unseren eigenen Kurzbeschreibungen.' }),
    },
    category: {
      /** {category} is a category's name, e.g. "Platforms". */
      title: p({ one: '{category}: {n} awesome Liste', other: '{category}: {n} awesome Listen' }),
      description: p({ one: '{n} awesome Liste zu {category}, mit Umfang, Sternen und Zusammenfassung.', other: '{n} awesome Listen zu {category}, mit Umfang, Sternen und Zusammenfassungen.' }),
    },
    /** A later page of a listing: {title} is the first page's title. */
    page: '{title}, Seite {page}',
    list: {
      /** {name} is the list's name. */
      title: p({ one: '{name}: eine awesome Liste mit {n} Eintrag', other: '{name}: eine awesome Liste mit {n} Einträgen' }),
      /** When the list has no summary of ours; {repo} is github.com/owner/repo. */
      description: '{name}, eine awesome Liste, gepflegt unter {repo}.',
    },
    item: {
      /** A repository: {repo} is owner/repo. */
      repoTitle: p({ one: '{repo}: in {n} awesome Liste', other: '{repo}: in {n} awesome Listen' }),
      /** Anything else: {name} is its name. */
      title: p({ one: '{name}: in {n} awesome Liste', other: '{name}: in {n} awesome Listen' }),
      /** {lists} are up to three list names. */
      repoDescription: p({ one: '{name} wird von {n} awesome Liste genannt: {lists}.', other: '{name} wird von {n} awesome Listen genannt: {lists}.' }),
      /** {host} is a web site's host, e.g. example.com. */
      description: p({ one: '{name} ({host}) wird von {n} awesome Liste genannt: {lists}.', other: '{name} ({host}) wird von {n} awesome Listen genannt: {lists}.' }),
      /** In one list only: {list} is that list's name. */
      repoTitleOne: '{repo}: in der awesome Liste {list}',
      titleOne: '{name}: in der awesome Liste {list}',
      /** Sentences of an item's description: {section} is a section's title in the list, {names} up to three names. */
      inOne: '{name} steht in der awesome Liste {list} unter {section}.',
      under: 'In {list} unter {section}.',
      alongside: 'Zusammen mit {names}.',
    },
    owner: {
      /** {display} is a GitHub login. */
      title: '{display}: Listen und Projekte',
      /** {lists} and {projects} are count plurals ("3 lists", "12 projects"). */
      description: '{display} auf GitHub: {lists} gepflegt, {projects} von Listen genannt.',
    },
    items: {
      title: p({ one: '{n} Projekt aus awesome Listen', other: '{n} Projekte aus awesome Listen' }),
      description: p({ one: '{n} Projekt nach Sprache, Lizenz, Thema, Sternen und der Zahl der Listen, die es nennen.', other: '{n} Projekte nach Sprache, Lizenz, Thema, Sternen und der Zahl der Listen, die sie nennen.' }),
      /** One filter: {label} is what it is, e.g. "Go" or "archived" or "1,000+ stars". */
      filteredTitle: p({ one: '{label}: {n} Projekt in awesome Listen', other: '{label}: {n} Projekte in awesome Listen' }),
      filteredDescription: p({ one: '{label}: {n} Projekt aus awesome Listen, mit Sternen und den Listen, die es nennen.', other: '{label}: {n} Projekte aus awesome Listen, mit Sternen und den Listen, die sie nennen.' }),
      /** A search in the items: {q} is what was searched for. */
      matching: 'Einträge zu „{q}“',
    },
    about: {
      title: 'Über {site}',
      description: 'Was {site} zeigt, woher die Daten stammen und wie eine Liste herausgenommen wird.',
    },
  },
};
