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
  share: {
    /** The share row on a list, an item, an owner, the home page and a language or topic of /items: its label. */
    label: 'Teilen',
    /** A share link's name (for screen readers and as its tooltip). {service} is X, Bluesky, LinkedIn, Reddit or Hacker News. */
    on: 'Auf {service} teilen',
    /** The email link's name. */
    email: 'Per E-Mail teilen',
    /** A button that copies the page's address; then, for a moment, what it says it did. */
    copy: 'Link kopieren',
    copied: 'Kopiert',
    /** A button that opens the phone's own share sheet. */
    native: 'Teilen …',
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
    /** Between the pager's two buttons: where the reader is. */
    pageOf: 'Seite {page} von {pages}',
    /** Between the parts of an entry's line of facts, as in "gin-gonic · Go · ★ 89,600". */
    dot: ' · ',
    /** A filter that is on, as a removable chip: {facet} is the facet's title ("Language"), {value} what is chosen ("Go"). */
    filterChip: '{facet}: {value}',
  },
  /** The parts of an entry's line of facts that need words: its stars, and the year of its last push. */
  entry: {
    stars: '★ {n}',
    updated: 'aktualisiert {year}',
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
    /** An item's GitHub owner, a link to their page. */
    owner: 'Inhaber',
    /** A list's plain Markdown copy, a link to /lists/{owner}/{repo}.md. The format's name. */
    markdown: 'Markdown',
  },
  home: {
    /** The page's heading: the same words as its title, without the site's name. */
    h1: p({ one: '{n} awesome Liste und alles darin', other: '{n} awesome Listen und alles darin' }),
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
    /** In a list's head, before the names of the lists most like it. */
    seeAlso: 'Siehe auch',
    /** A heading after a list's entries over the lists most like it, each with how many projects both name. */
    related: 'Verwandte Listen',
    inCommon: p({ one: '{n} gemeinsames Projekt', other: '{n} gemeinsame Projekte' }),
    /** A heading at the foot of a list page, over its facts, where it comes from and the share row. */
    aboutTitle: 'Über diese Liste',
  },
  item: {
    /** Under an item's name: the other names lists give it. */
    alsoListedAs: 'Auch geführt als: {names}',
    /** When an item is itself one of the lists; <1> links to its list page. */
    isList: 'Das ist selbst eine Liste in der Bibliothek: <1>öffnen</1>.',
    gone: 'GitHub hat dieses Repository nicht mehr.',
    factsAsOf: 'Fakten von GitHub, Stand {date}.',
    /** Beside one of the lists an item is in, when that list calls it by another name. */
    listedAs: 'geführt als ‚{name}‘',
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
    /** Under "What is listed alongside {name}?". */
    alongsideNote: 'Projekte, die in einer Liste denselben Abschnitt teilen. Die Listen sagen nicht, dass sie Alternativen sind.',
    q: {
      /** Headings of an item page, as the questions a visitor asks; {name} is the item. */
      lists: 'Welche awesome Listen nennen {name}?',
      maintained: 'Wird {name} noch gepflegt?',
      alongside: 'Was steht neben {name}?',
    },
    a: {
      /** The answer under "Is {name} still maintained?", by the repository's state. {date} is its last push, {asOf} the data's date. The site says what GitHub says, and when. */
      active: 'Der letzte Push war am {date}, und es ist nicht archiviert (Stand {asOf}).',
      /** "Two years" is the site's rule for quiet (730 days). */
      quiet: 'Seit dem {date} gab es keinen Push, mehr als zwei Jahre vor dem {asOf}. Es ist nicht archiviert.',
      archived: 'Nein. Der Inhaber hat es archiviert; der letzte Push war am {date}.',
    },
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
    /** On /items with one language, before up to six lists most of whose repositories are in it: {label} is the language. */
    mostlyIn: 'Listen vor allem in {label}',
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
    /** The About page's headings are the questions a visitor asks; {site} is the site's name. */
    shownTitle: 'Was zeigt {site}?',
    shown: 'Die Site zeigt Namen, Abschnitte, Links und Fakten sowie unsere eigenen Worte. Sie zeigt nie die Beschreibung eines Kurators oder Repository-Owners. Die Zusammenfassung einer Liste stammt von uns; was eine Liste über einen Eintrag sagt, bleibt auf der Liste, einen Link entfernt.',
    attributionTitle: 'Woher kommen die Daten, und wem gebühren sie?',
    attribution: 'Auswahl und Reihenfolge jeder Liste gehören den Menschen, die sie pflegen. Jede Listenseite nennt, wo die Liste liegt und bei welchem Commit sie gelesen wurde. Fakten zu Repositorys (Sterne, letzter Push, Sprache, Lizenz, Topics) stammen von GitHub.',
    leaveOutTitle: 'Wie wird eine Liste ausgelassen?',
    /** <1> links to this project's issues on GitHub. */
    leaveOut: 'Du pflegst eine Liste und möchtest sie hier nicht sehen? <1>Eröffne ein Issue im Repository dieses Projekts</1> und nenne die Liste. Beim nächsten Build wird sie herausgenommen: Ihre Einträge werden nicht gelesen und ihre Seite wird entfernt.',
    coverageTitle: 'Wie viel umfasst es?',
    /** {ok}, {partial}, {unparsed} are plain numbers. */
    coverageLists: '{ok} Listen vollständig gelesen, {partial} teilweise, {unparsed} noch nicht.',
    /** As above, when some lists are gone from GitHub; {gone} is a plain number. */
    coverageListsGone: '{ok} Listen vollständig gelesen, {partial} teilweise, {unparsed} noch nicht, {gone} nicht mehr auf GitHub.',
    /** {items} is a count plural ("116,162 items"); the rest are plain numbers. */
    coverageItems: '{items}: {repo} Repositorys, {site} Websites, {video} Videos, {article} Artikel, {package} Pakete, {paper} Paper.',
    coverageTwoOrMore: '{n} Einträge werden von zwei oder mehr Listen genannt.',
    coverageRepos: 'Repositorys: {active} aktiv, {quiet} ruhig (seit zwei Jahren kein Push), {archived} archiviert, {gone} verschwunden.',
    freshTitle: 'Wie aktuell sind die Daten?',
    /** {date} is the day this copy of the data was finished. */
    fresh: 'Die Listen und die Fakten von GitHub werden jede Nacht neu gelesen. Diese Fassung wurde am {date} fertig.',
    aiTitle: 'Dürfen KI-Assistenten und Crawler es nutzen?',
    /** <1> links to /llms.txt; robots.txt, /llms.txt and .md are names of files and stay as they are. */
    ai: 'Ja. robots.txt erlaubt es, <1>/llms.txt</1> beschreibt die Website, und jede Liste hat unter ihrer Adresse mit angehängtem .md eine schlichte Markdown-Kopie. Auswahl und Reihenfolge einer Liste gehören ihren Kuratoren: Zitiere dafür die Liste auf GitHub, und {site} für Zahlen und dafür, welche Listen ein Projekt nennen.',
  },
  /**
   * Sentences that open a page, made of its own data. Names in them are links; never a curator's or an owner's words.
   */
  sum: {
    /** The home page. {lists} and {items} are count plurals ("671 lists"), {date} a date. */
    home: '{site} ist ein Verzeichnis von {lists} auf GitHub und den {items}, die sie nennen. Es zeigt Namen, Abschnitte, Links und Fakten von GitHub, nie die Beschreibungen der Listen selbst. Stand der Daten: {date}; sie werden jede Nacht neu gelesen.',
    /** A category of /lists: {category} is its name, {names} three list names. */
    category: p({ one: 'In der Kategorie {category} ist {n} awesome Liste: {names}.', other: 'In der Kategorie {category} sind {n} awesome Listen. Die mit den meisten Sternen sind {names}.' }),
    /** After a summary: {date} is a date. */
    asOf: 'Stand der Daten: {date}.',
    list: {
      /** A list page, after our summary. {name} is the list, {repo} owner/repo, {owner} a login, {items} and {sections} count plurals. */
      what: '{name} ist die awesome Liste {repo}, gepflegt von {owner} auf GitHub. Sie nennt {items} in {sections}.',
      /** The same, for a list whose entries could not be read. */
      whatUnread: '{name} ist die awesome Liste {repo}, gepflegt von {owner} auf GitHub.',
      /** {stars} is a count plural ("196,233 stars"), {date} a date. */
      github: 'Sie hat {stars} auf GitHub, und ihr letzter Push war am {date}.',
      /** {sections} are three section titles, each with its count: "Command Line (105), …". */
      sections: 'Die größten Abschnitte sind {sections}.',
      /** {names} are five project names. */
      top: 'Die Projekte darin mit den meisten Sternen sind {names}.',
      /** {language} is a programming language, e.g. "Go". */
      lang: 'Die meisten ihrer Repositorys sind in {language} geschrieben.',
    },
    items: {
      /** /items with one language: {label} is the language. */
      lang: p({ one: '{n} Projekt aus awesome Listen ist in {label} geschrieben.', other: '{n} Projekte aus awesome Listen sind in {label} geschrieben.' }),
      /** /items with one topic: {label} is a GitHub topic. */
      topic: p({ one: '{n} Projekt aus awesome Listen trägt das GitHub-Topic {label}.', other: '{n} Projekte aus awesome Listen tragen das GitHub-Topic {label}.' }),
      /** /items with one licence: {label} is the licence, e.g. "MIT". */
      license: p({ one: '{n} Projekt aus awesome Listen steht unter der Lizenz {label}.', other: '{n} Projekte aus awesome Listen stehen unter der Lizenz {label}.' }),
      /** /items with one kind: {label} is the kind's word, e.g. "video". */
      kind: p({ one: '{n} Eintrag aus awesome Listen ist von der Art {label}.', other: '{n} Einträge aus awesome Listen sind von der Art {label}.' }),
      /** After one of the four: {names} are five names. */
      top: 'Die von den meisten Listen genannten sind {names}.',
    },
    item: {
      /** An item page's first sentence. {name} is the repository, {language} e.g. "Go", {owner} a login, {stars} a count plural. */
      repoLang: '{name} ist ein {language}-Repository von {owner} auf GitHub und hat {stars}.',
      /** The same, with no language known. */
      repo: '{name} ist ein Repository von {owner} auf GitHub und hat {stars}.',
      /** The same, with no stars known. */
      repoPlain: '{name} ist ein Repository von {owner} auf GitHub.',
      /** Anything else, one sentence a kind: {name} is its name, {host} where it is (example.com). */
      kind: {
        repo: '{name} ist ein Repository auf {host}.',
        site: '{name} ist eine Website auf {host}.',
        video: '{name} ist ein Video auf {host}.',
        article: '{name} ist ein Artikel auf {host}.',
        package: '{name} ist ein Paket auf {host}.',
        paper: '{name} ist eine wissenschaftliche Arbeit auf {host}.',
      },
      /** The second sentence: {lists} are up to three lists, each "Go (under Web Frameworks)", and perhaps "2 more". */
      lists: p({ one: 'Eine awesome Liste nennt es: {lists}.', other: '{n} awesome Listen nennen es: {lists}.' }),
      /** One of those lists: {list} is its name, {section} the title of the section that holds the item. */
      listUnder: '{list} (unter {section})',
      /** After three lists: how many more name it. */
      more: p({ one: '{n} weitere', other: '{n} weitere' }),
      /** The third sentence, for a repository: {date} is a date. */
      pushed: 'Der letzte Push war am {date}.',
    },
    owner: {
      /** An owner page: {display} is a login, {lists} and {projects} count plurals. */
      both: '{display} pflegt {lists}, die hier verzeichnet sind, und awesome Listen nennen {projects} des Kontos.',
      /** The same, with no projects named. */
      lists: '{display} pflegt {lists}, die hier verzeichnet sind.',
      /** The same, with no lists kept. */
      projects: 'Awesome Listen nennen {projects} von {display}.',
    },
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
      /** {name} is the list's name, {repo} its repository's (awesome-nodejs). */
      title: p({ one: '{name} ({repo}): eine awesome Liste mit {n} Eintrag', other: '{name} ({repo}): eine awesome Liste mit {n} Einträgen' }),
      /** When the list has no summary of ours; {repo} is github.com/owner/repo. */
      description: '{name}, eine awesome Liste, gepflegt unter {repo}.',
    },
    item: {
      /** A repository: {repo} is owner/repo. */
      repoTitle: p({ one: '{repo}: in {n} awesome Liste', other: '{repo}: in {n} awesome Listen' }),
      /** Anything else: {name} is its name. */
      title: p({ one: '{name}: in {n} awesome Liste', other: '{name}: in {n} awesome Listen' }),
      /** In one list only: {list} is that list's name. */
      repoTitleOne: '{repo}: in der awesome Liste {list}',
      titleOne: '{name}: in der awesome Liste {list}',
      alongside: 'Zusammen mit {names}.',
    },
    owner: {
      /** {display} is a GitHub login. */
      title: '{display}: Listen und Projekte',
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
