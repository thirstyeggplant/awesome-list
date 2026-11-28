// Russian. The comments say where a message appears and what its placeholders are; they need no translating.
import { p } from '../format.js';
import type { Messages } from './en.js';

export const ru: Messages = {
  site: {
    /** The browser tab's title on most pages: the page's title, then the site's name. */
    title: '{title} · {site}',
    /** The first link on every page, for keyboards and screen readers; it jumps past the header. */
    skip: 'Перейти к содержимому',
    /** The footer of every page. <1> links to the About page's section on leaving a list out. */
    footer: '{site} индексирует названия, разделы и ссылки. Описания принадлежат спискам и сюда не копируются. Ведёте список и хотите убрать его отсюда? <1>Создайте issue</1>.',
    /** The label of the breadcrumb trail (for screen readers). */
    breadcrumb: 'Навигационная цепочка',
  },
  nav: {
    lists: 'Списки',
    items: 'Элементы',
    about: 'О сайте',
    /** The search box in the header: its label, and the hint inside it ("/" is the key that opens quick search). */
    search: 'Поиск',
    searchHint: 'Поиск  ( / )',
  },
  quick: {
    /** The quick-search dialog, opened with Ctrl-K or "/". */
    label: 'Быстрый поиск',
    placeholder: 'Поиск по спискам, элементам и тегам',
    /** The label of the list of results inside the dialog (for screen readers). */
    results: 'Результаты',
    help: '↑ ↓ — перемещение, Enter — открыть, Esc — закрыть',
    /** Group headings inside the dialog's results. */
    lists: 'Списки',
    items: 'Элементы',
    tags: 'Теги',
  },
  lang: {
    /** The label of the list of languages in the footer (for screen readers). */
    switcher: 'Язык',
    /**
     * A bar shown when the visitor's browser prefers this language over the page's. Written in this file's own
     * language, because it is shown to someone who reads it.
     */
    suggest: 'Читать эту страницу на русском',
    /** The label of the bar's close button (for screen readers), also in this file's own language. */
    close: 'Закрыть',
  },
  share: {
    /** The share row on a list, an item, an owner, the home page and a language or topic of /items: its label. */
    label: 'Поделиться',
    /** A share link's name (for screen readers and as its tooltip). {service} is X, Bluesky, LinkedIn, Reddit or Hacker News. */
    on: 'Поделиться в {service}',
    /** The email link's name. */
    email: 'Отправить по почте',
    /** A button that copies the page's address; then, for a moment, what it says it did. */
    copy: 'Скопировать ссылку',
    copied: 'Скопировано',
    /** A button that opens the phone's own share sheet. */
    native: 'Поделиться…',
  },
  count: {
    lists: p({ one: '{n} список', few: '{n} списка', many: '{n} списков', other: '{n} списка' }),
    items: p({ one: '{n} элемент', few: '{n} элемента', many: '{n} элементов', other: '{n} элемента' }),
    listings: p({ one: '{n} упоминание', few: '{n} упоминания', many: '{n} упоминаний', other: '{n} упоминания' }),
    sections: p({ one: '{n} раздел', few: '{n} раздела', many: '{n} разделов', other: '{n} раздела' }),
    links: p({ one: '{n} ссылка', few: '{n} ссылки', many: '{n} ссылок', other: '{n} ссылки' }),
    stars: p({ one: '{n} звезда', few: '{n} звезды', many: '{n} звёзд', other: '{n} звезды' }),
    projects: p({ one: '{n} проект', few: '{n} проекта', many: '{n} проектов', other: '{n} проекта' }),
    otherLists: p({ one: 'ещё {n} список', few: 'ещё {n} списка', many: 'ещё {n} списков', other: 'ещё {n} списка' }),
    /** "{items} in {sections}": e.g. "12 items in 4 sections"; both values are the plurals above. */
    itemsInSections: '{items}, {sections}',
    /** A list's reason for being read only in part: e.g. "5 items from 81 links"; both values are plurals above. */
    itemsFromLinks: '{items} из: {links}',
    /** "N of M" in a list page's filter: how many entries are shown of all. */
    shownOf: '{n} из {m}',
    /** On a phone, how many lists name an item, in a row's second line. */
    inLists: p({ one: 'в {n} списке', few: 'в {n} списках', many: 'в {n} списках', other: 'в {n} списка' }),
  },
  /** One-word labels of an item's kind, shown beside "Kind" and in the facet rail. */
  kind: {
    repo: 'репозиторий',
    package: 'пакет',
    video: 'видео',
    paper: 'научная статья',
    article: 'статья',
    site: 'сайт',
  },
  /** A repository's state. Shown as a short word beside its name, and in the facet rail. */
  status: {
    active: 'активный',
    quiet: 'затих',
    archived: 'в архиве',
    gone: 'удалён',
  },
  /** A list's state, in the facet rail of /lists: read in full, in part, not read, gone from GitHub. */
  listStatus: {
    ok: 'прочитан полностью',
    partial: 'прочитан частично',
    unparsed: 'ещё не прочитан',
    gone: 'удалён',
  },
  /** The ways of ordering a listing page, after "sort by". */
  sort: {
    relevance: 'релевантности',
    lists: 'спискам',
    stars: 'звёздам',
    items: 'элементам',
    updated: 'обновлению',
    name: 'названию',
  },
  yes: 'да',
  no: 'нет',
  common: {
    search: 'Поиск',
    filter: 'Фильтр',
    searchListsAndItems: 'Поиск по спискам и элементам',
    nothingHere: 'Здесь ничего нет.',
    previous: '← Назад',
    next: 'Далее →',
    /** After the removable filter chips: takes them all away. */
    clearAll: 'Сбросить всё',
    /** "12 lists · sort by stars · items · updated · name"; {sorts} are the sort words, the current one in bold. */
    sortBy: '{count} · сортировка по {sorts}',
    /** Shown past the last page a listing will show. */
    pagingStops: 'Страницы заканчиваются на {n}-й. Сузьте фильтры, чтобы увидеть больше.',
    /** The removable chip for a search: “{q}” is what was searched for. */
    searchChip: '«{q}»',
    /** Between names in a short list, as in "Widgets, Gadgets, Tools" (Chinese and Japanese: '、'). */
    separator: ', ',
    /** Between the pager's two buttons: where the reader is. */
    pageOf: 'Страница {page} из {pages}',
    /** Between the parts of an entry's line of facts, as in "gin-gonic · Go · ★ 89,600". */
    dot: ' · ',
    /** A filter that is on, as a removable chip: {facet} is the facet's title ("Language"), {value} what is chosen ("Go"). */
    filterChip: '{facet}: {value}',
  },
  /** The parts of an entry's line of facts that need words: its stars, and the year of its last push. */
  entry: {
    stars: '★ {n}',
    updated: 'обновлено в {year}',
  },
  facts: {
    stars: 'Звёзды',
    lastPush: 'Последний пуш',
    language: 'Язык',
    licence: 'Лицензия',
    entries: 'Записи',
    namedBy: 'Упоминается в',
    state: 'Состояние',
    fork: 'Форк',
    kind: 'Тип',
    host: 'Хост',
    renamedFrom: 'Прежнее название',
    /** An item's GitHub owner, a link to their page. */
    owner: 'Владелец',
  },
  home: {
    /** The page's heading: the same words as its title, without the site's name. */
    h1: p({
      one: '{n} awesome-список и всё, что в нём',
      few: '{n} awesome-списка и всё, что в них',
      many: '{n} awesome-списков и всё, что в них',
      other: '{n} awesome-списка и всё, что в них',
    }),
    mostNamed: 'Чаще всего в списках',
    /** The line of the most common languages under the counts, and the link after them to every project. */
    browseByLanguage: 'По языкам',
    allProjects: 'Все проекты',
    /** A heading over the lists with the most stars, as cards; then a link to every list. */
    startHere: 'С чего начать',
    allLists: p({ one: '{n} список', few: 'Все {n} списка', many: 'Все {n} списков', other: 'Все {n} списка' }),
    /** A heading over every list, category by category. */
    byCategory: 'Все списки по категориям',
    /** Under the items named by the most lists: a link to all of those named by two or more. */
    namedByTwo: 'Все проекты, упомянутые в 2 списках и более',
  },
  lists: {
    h1: 'Списки',
    filterLists: 'Фильтр списков',
    category: 'Категория',
    licence: 'Лицензия',
    status: 'Статус',
  },
  list: {
    contents: 'Содержание',
    filterThisList: 'Фильтр по этому списку',
    /** The label of the "#" link beside a section heading (for screen readers). */
    sectionLink: 'Ссылка на этот раздел',
    readOriginal: 'Оригинал на GitHub',
    suggestChange: 'Предложить изменение',
    /** For a list whose entries could not be read; {reason} is why, e.g. "the readme is in reStructuredText". */
    unparsed: 'Нам пока не удалось прочитать записи этого списка ({reason}).',
    noReason: 'причина не указана',
    /**
     * Under a list's entries. <1> is the list's name (bold), {owner} a GitHub login, <2> the link to the
     * repository, whose text is {repo} (github.com/owner/repo).
     */
    attribution: 'Эта страница — индекс списка <1>{name}</1>, который ведут {owner} и контрибьюторы в <2>{repo}</2>. Подбор и порядок — их, краткое описание выше — наше.',
    /** Follows the attribution; {oid} is a commit's short hash, {date} the day it was read. */
    readAt: 'Прочитан на коммите {oid} {date}.',
    /** Follows the attribution; {license} is a licence's name, e.g. "MIT". */
    licence: 'Лицензия: {license}.',
    /** A heading after a list's entries: other lists of the same category. */
    moreIn: 'Ещё в категории «{category}»',
    /** In a list's head, before the names of the lists most like it. */
    seeAlso: 'См. также',
    /** A heading after a list's entries over the lists most like it, each with how many projects both name. */
    related: 'Похожие списки',
    inCommon: p({ one: '{n} общий проект', few: '{n} общих проекта', many: '{n} общих проектов', other: '{n} общего проекта' }),
    /** A heading at the foot of a list page, over its facts, where it comes from and the share row. */
    aboutTitle: 'Об этом списке',
  },
  item: {
    /** Under an item's name: the other names lists give it. */
    alsoListedAs: 'Также встречается как: {names}',
    /** When an item is itself one of the lists; <1> links to its list page. */
    isList: 'Это тоже список из нашей библиотеки: <1>открыть его</1>.',
    gone: 'Этого репозитория больше нет на GitHub.',
    factsAsOf: 'Данные GitHub на {date}.',
    /** Beside one of the lists an item is in, when that list calls it by another name. */
    listedAs: 'указан как «{name}»',
    attribution: 'Упоминается в списках выше. Перейдите в список, чтобы прочитать, что о нём пишут кураторы. Чтобы предложить изменение, создайте issue в одном из этих списков.',
    /** The item's one outbound link, as a button: to its repository, or to its site ({host}, e.g. example.com). */
    openGitHub: 'Открыть на GitHub ↗',
    visit: 'Перейти на {host} ↗',
    /** A heading over other projects of the same GitHub owner; {owner} is a login. */
    moreFrom: 'Ещё от {owner}',
    /** Under them: a link to the owner's page. */
    allFrom: p({ one: '{n} проект от {owner}', few: 'Все {n} проекта от {owner}', many: 'Все {n} проектов от {owner}', other: 'Все {n} проекта от {owner}' }),
    /** The label over an item's topic chips. */
    topics: 'Темы',
    /** Under "What is listed alongside {name}?". */
    alongsideNote: 'Проекты, которые стоят с ним в одном разделе какого-нибудь списка. Списки не говорят, что это альтернативы.',
    q: {
      /** Headings of an item page, as the questions a visitor asks; {name} is the item. */
      lists: 'Какие awesome-списки называют {name}?',
      maintained: 'Поддерживается ли {name}?',
      alongside: 'Что указано рядом с {name}?',
    },
    a: {
      /** The answer under "Is {name} still maintained?", by the repository's state. {date} is its last push, {asOf} the data's date. The site says what GitHub says, and when. */
      active: 'Последний push был {date}, и он не в архиве (данные на {asOf}).',
      /** "Two years" is the site's rule for quiet (730 days). */
      quiet: 'С {date} не было ни одного push — это больше двух лет до {asOf}. Он не в архиве.',
      archived: 'Нет. Владелец отправил его в архив; последний push был {date}.',
    },
  },
  items: {
    h1: 'Элементы',
    searchItems: 'Поиск по элементам',
    /** After the count of results, when a search found more than can be ranked. */
    bestOnly: ' (только лучшие совпадения)',
    kind: 'Тип',
    status: 'Статус',
    language: 'Язык',
    licence: 'Лицензия',
    topic: 'Тема',
    category: 'Категория',
    list: 'Список',
    stars: 'Звёзды',
    namedBy: 'Упоминается в',
    /** Facet values: "1,000+ stars", "in 5+ lists". */
    starsAtLeast: '{n}+ звёзд',
    inAtLeast: 'в {n}+ списках',
  },
  owner: {
    listsTheyKeep: 'Списки, которые ведёт',
    theirProjects: 'Проекты, упомянутые в списках',
    /** A link under an owner's projects to all of them on the Items page. */
    allInItems: p({ one: 'Все {n} в элементах', few: 'Все {n} в элементах', many: 'Все {n} в элементах', other: 'Все {n} в элементах' }),
  },
  search: {
    h1: 'Поиск',
    lists: 'Списки',
    sections: 'Разделы',
    items: 'Элементы',
    /** Beside a section found by search: the list it is in. */
    inList: 'в {list}',
    noItems: 'Нет подходящих элементов.',
    allItems: p({ one: 'Все элементы: {n}', few: 'Все {n} элемента', many: 'Все {n} элементов', other: 'Все {n} элемента' }),
  },
  notFound: {
    h1: 'По этому адресу ничего нет',
    /** Above a few pages that might be what the visitor wanted. */
    perhaps: 'Возможно, вы искали',
  },
  about: {
    h1: 'О сайте {site}',
    /** <1> links to the index of awesome lists. {lists}, {items} are count plurals ("671 lists"). */
    intro: '{site} — бесплатная библиотека всех awesome-списков из <1>индекса awesome-списков</1> и всего, что в них есть: {lists}, {items}, которые они упоминают, и где какой список упоминает каждый из них.',
    shownTitle: 'Что показывается, а что нет',
    shown: 'Сайт показывает названия, разделы, ссылки, факты и наши собственные тексты. Он никогда не показывает описания кураторов или владельцев репозиториев. Краткое описание списка — наше; то, что список пишет о записи, остаётся в списке, в одном клике отсюда.',
    attributionTitle: 'Авторство',
    attribution: 'Подбор и порядок в каждом списке принадлежат тем, кто его ведёт. На странице каждого списка указано, где он находится и на каком коммите прочитан. Данные о репозиториях (звёзды, последний пуш, язык, лицензия, темы) берутся с GitHub.',
    leaveOutTitle: 'Как убрать список',
    /** <1> links to this project's issues on GitHub. */
    leaveOut: 'Ведёте список и хотите убрать его отсюда? <1>Создайте issue в репозитории этого проекта</1> с названием списка. Он будет исключён при следующей сборке: его записи не читаются, а страница удаляется.',
    coverageTitle: 'Охват',
    /** {ok}, {partial}, {unparsed} are plain numbers. */
    coverageLists: 'Списков прочитано полностью: {ok}, частично: {partial}, ещё не прочитано: {unparsed}.',
    /** As above, when some lists are gone from GitHub; {gone} is a plain number. */
    coverageListsGone: 'Списков прочитано полностью: {ok}, частично: {partial}, ещё не прочитано: {unparsed}, удалено с GitHub: {gone}.',
    /** {items} is a count plural ("116,162 items"); the rest are plain numbers. */
    coverageItems: '{items}: репозиториев — {repo}, сайтов — {site}, видео — {video}, статей — {article}, пакетов — {package}, научных статей — {paper}.',
    coverageTwoOrMore: 'Элементов, упомянутых в двух списках и более: {n}.',
    coverageRepos: 'Репозитории: активных — {active}, затихших (без пушей два года) — {quiet}, в архиве — {archived}, удалённых — {gone}.',
    dataOf: 'Данные на {date}.',
  },
  /**
   * Sentences that open a page, made of its own data. Names in them are links; never a curator's or an owner's words.
   */
  sum: {
    /** The home page. {lists} and {items} are count plurals ("671 lists"), {date} a date. */
    home: '{site} — это индекс: {lists} с GitHub и {items}, которые в них названы. Здесь показаны названия, разделы, ссылки и данные GitHub, но никогда не собственные описания списков. Данные на {date}; они перечитываются каждую ночь.',
    /** A category of /lists: {category} is its name, {names} three list names. */
    category: p({ one: 'В категории {category} {n} awesome-список: {names}.', few: 'В категории {category} {n} awesome-списка. Больше всего звёзд у {names}.', many: 'В категории {category} {n} awesome-списков. Больше всего звёзд у {names}.', other: 'В категории {category} {n} awesome-списка. Больше всего звёзд у {names}.' }),
    /** After a summary: {date} is a date. */
    asOf: 'Данные на {date}.',
    list: {
      /** A list page, after our summary. {name} is the list, {repo} owner/repo, {owner} a login, {items} and {sections} count plurals. */
      what: '{name} — это awesome-список {repo}, который ведёт {owner} на GitHub. Он называет {items} ({sections}).',
      /** The same, for a list whose entries could not be read. */
      whatUnread: '{name} — это awesome-список {repo}, который ведёт {owner} на GitHub.',
      /** {stars} is a count plural ("196,233 stars"), {date} a date. */
      github: 'У него {stars} на GitHub, последний push был {date}.',
      /** {sections} are three section titles, each with its count: "Command Line (105), …". */
      sections: 'Самые большие разделы: {sections}.',
      /** {names} are five project names. */
      top: 'Больше всего звёзд у проектов {names}.',
      /** {language} is a programming language, e.g. "Go". */
      lang: 'Большинство репозиториев в нём написаны на {language}.',
    },
    items: {
      /** /items with one language: {label} is the language. */
      lang: p({ one: '{n} проект из awesome-списков написан на {label}.', few: '{n} проекта из awesome-списков написаны на {label}.', many: '{n} проектов из awesome-списков написаны на {label}.', other: '{n} проекта из awesome-списков написаны на {label}.' }),
      /** /items with one topic: {label} is a GitHub topic. */
      topic: p({ one: '{n} проект из awesome-списков отмечен темой GitHub {label}.', few: '{n} проекта из awesome-списков отмечены темой GitHub {label}.', many: '{n} проектов из awesome-списков отмечены темой GitHub {label}.', other: '{n} проекта из awesome-списков отмечены темой GitHub {label}.' }),
      /** /items with one licence: {label} is the licence, e.g. "MIT". */
      license: p({ one: '{n} проект из awesome-списков распространяется под лицензией {label}.', few: '{n} проекта из awesome-списков распространяются под лицензией {label}.', many: '{n} проектов из awesome-списков распространяются под лицензией {label}.', other: '{n} проекта из awesome-списков распространяются под лицензией {label}.' }),
      /** /items with one kind: {label} is the kind's word, e.g. "video". */
      kind: p({ one: '{n} элемент из awesome-списков относится к типу «{label}».', few: '{n} элемента из awesome-списков относятся к типу «{label}».', many: '{n} элементов из awesome-списков относятся к типу «{label}».', other: '{n} элемента из awesome-списков относятся к типу «{label}».' }),
      /** After one of the four: {names} are five names. */
      top: 'Больше всего списков называют {names}.',
    },
    item: {
      /** An item page's first sentence. {name} is the repository, {language} e.g. "Go", {owner} a login, {stars} a count plural. */
      repoLang: '{name} — репозиторий на {language} от {owner} на GitHub; у него {stars}.',
      /** The same, with no language known. */
      repo: '{name} — репозиторий от {owner} на GitHub; у него {stars}.',
      /** The same, with no stars known. */
      repoPlain: '{name} — репозиторий от {owner} на GitHub.',
      /** Anything else, one sentence a kind: {name} is its name, {host} where it is (example.com). */
      kind: {
        repo: '{name} — репозиторий на {host}.',
        site: '{name} — сайт на {host}.',
        video: '{name} — видео на {host}.',
        article: '{name} — статья на {host}.',
        package: '{name} — пакет на {host}.',
        paper: '{name} — научная статья на {host}.',
      },
      /** The second sentence: {lists} are up to three lists, each "Go (under Web Frameworks)", and perhaps "2 more". */
      lists: p({ one: '{n} awesome-список называет его: {lists}.', few: '{n} awesome-списка называют его: {lists}.', many: '{n} awesome-списков называют его: {lists}.', other: '{n} awesome-списка называют его: {lists}.' }),
      /** One of those lists: {list} is its name, {section} the title of the section that holds the item. */
      listUnder: '{list} (в разделе «{section}»)',
      /** After three lists: how many more name it. */
      more: p({ one: 'ещё {n}', few: 'ещё {n}', many: 'ещё {n}', other: 'ещё {n}' }),
      /** The third sentence, for a repository: {date} is a date. */
      pushed: 'Последний push был {date}.',
    },
    owner: {
      /** An owner page: {display} is a login, {lists} and {projects} count plurals. */
      both: '{display} ведёт {lists}, которые есть здесь, а awesome-списки называют {projects} этого автора.',
      /** The same, with no projects named. */
      lists: '{display} ведёт {lists}, которые есть здесь.',
      /** The same, with no lists kept. */
      projects: 'Awesome-списки называют {projects} от {display}.',
    },
  },
  /** Titles (in the browser's tab and in search results) and descriptions (under the title in search results). */
  meta: {
    /** Aim at 60 characters or fewer (30 for Chinese, Japanese, Korean). Descriptions: 70 to 160 (80). */
    home: {
      title: p({
        one: '{site}: {n} awesome-список и всё, что в нём',
        few: '{site}: {n} awesome-списка и всё, что в них',
        many: '{site}: {n} awesome-списков и всё, что в них',
        other: '{site}: {n} awesome-списка и всё, что в них',
      }),
      /** {n} is the number of lists; {items} the number of projects, already formatted. */
      description: p({
        one: 'Индекс {n} awesome-списка и упомянутых в нём проектов ({items}) по категориям, языкам, лицензиям и темам.',
        few: 'Индекс {n} awesome-списков и упомянутых в них проектов ({items}) по категориям, языкам, лицензиям и темам.',
        many: 'Индекс {n} awesome-списков и упомянутых в них проектов ({items}) по категориям, языкам, лицензиям и темам.',
        other: 'Индекс {n} awesome-списка и упомянутых в них проектов ({items}) по категориям, языкам, лицензиям и темам.',
      }),
    },
    lists: {
      title: p({ one: 'Все awesome-списки: {n}', few: 'Все {n} awesome-списка', many: 'Все {n} awesome-списков', other: 'Все {n} awesome-списка' }),
      description: p({
        one: '{n} awesome-список с размером, звёздами и нашим кратким описанием в одну строку.',
        few: '{n} awesome-списка с размерами, звёздами и нашими краткими описаниями в одну строку.',
        many: '{n} awesome-списков с размерами, звёздами и нашими краткими описаниями в одну строку.',
        other: '{n} awesome-списка с размерами, звёздами и нашими краткими описаниями в одну строку.',
      }),
    },
    category: {
      /** {category} is a category's name, e.g. "Platforms". */
      title: p({ one: '{category}: {n} awesome-список', few: '{category}: {n} awesome-списка', many: '{category}: {n} awesome-списков', other: '{category}: {n} awesome-списка' }),
      description: p({
        one: '{category}: {n} awesome-список с размером, звёздами и кратким описанием.',
        few: '{category}: {n} awesome-списка с размерами, звёздами и краткими описаниями.',
        many: '{category}: {n} awesome-списков с размерами, звёздами и краткими описаниями.',
        other: '{category}: {n} awesome-списка с размерами, звёздами и краткими описаниями.',
      }),
    },
    /** A later page of a listing: {title} is the first page's title. */
    page: '{title}, страница {page}',
    list: {
      /** {name} is the list's name, {repo} its repository's (awesome-nodejs). */
      title: p({
        one: '{name} ({repo}): awesome-список, {n} элемент',
        few: '{name} ({repo}): awesome-список, {n} элемента',
        many: '{name} ({repo}): awesome-список, {n} элементов',
        other: '{name} ({repo}): awesome-список, {n} элемента',
      }),
      /** When the list has no summary of ours; {repo} is github.com/owner/repo. */
      description: '{name} — awesome-список, который ведётся в {repo}.',
    },
    item: {
      /** A repository: {repo} is owner/repo. */
      repoTitle: p({ one: '{repo}: в {n} awesome-списке', few: '{repo}: в {n} awesome-списках', many: '{repo}: в {n} awesome-списках', other: '{repo}: в {n} awesome-списка' }),
      /** Anything else: {name} is its name. */
      title: p({ one: '{name}: в {n} awesome-списке', few: '{name}: в {n} awesome-списках', many: '{name}: в {n} awesome-списках', other: '{name}: в {n} awesome-списка' }),
      /** In one list only: {list} is that list's name. */
      repoTitleOne: '{repo}: в awesome-списке {list}',
      titleOne: '{name}: в awesome-списке {list}',
      alongside: 'Рядом с {names}.',
    },
    owner: {
      /** {display} is a GitHub login. */
      title: '{display}: списки и проекты',
    },
    items: {
      title: p({
        one: '{n} проект из awesome-списков',
        few: '{n} проекта из awesome-списков',
        many: '{n} проектов из awesome-списков',
        other: '{n} проекта из awesome-списков',
      }),
      description: p({
        one: '{n} проект по языку, лицензии, теме, звёздам и числу списков, где он упоминается.',
        few: '{n} проекта по языку, лицензии, теме, звёздам и числу списков, где они упоминаются.',
        many: '{n} проектов по языку, лицензии, теме, звёздам и числу списков, где они упоминаются.',
        other: '{n} проекта по языку, лицензии, теме, звёздам и числу списков, где они упоминаются.',
      }),
      /** One filter: {label} is what it is, e.g. "Go" or "archived" or "1,000+ stars". */
      filteredTitle: p({
        one: '{label}: {n} проект из awesome-списков',
        few: '{label}: {n} проекта из awesome-списков',
        many: '{label}: {n} проектов из awesome-списков',
        other: '{label}: {n} проекта из awesome-списков',
      }),
      filteredDescription: p({
        one: '{label}: {n} проект из awesome-списков, со звёздами и списками, где он упоминается.',
        few: '{label}: {n} проекта из awesome-списков, со звёздами и списками, где они упоминаются.',
        many: '{label}: {n} проектов из awesome-списков, со звёздами и списками, где они упоминаются.',
        other: '{label}: {n} проекта из awesome-списков, со звёздами и списками, где они упоминаются.',
      }),
      /** A search in the items: {q} is what was searched for. */
      matching: 'Элементы по запросу «{q}»',
    },
    about: {
      title: 'О сайте {site}',
      description: 'Что показывает {site}, откуда берутся данные и как убрать список из индекса.',
    },
  },
};
