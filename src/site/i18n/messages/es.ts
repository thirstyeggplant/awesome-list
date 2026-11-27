// Spanish. Translated from messages/en.ts. After changing a message, run `pnpm check-translations --stamp es`.
// The comments say where a message appears and what its placeholders are; they need no translating.
import { p } from '../format.js';
import type { Messages } from './en.js';

export const es: Messages = {
  site: {
    /** The browser tab's title on most pages: the page's title, then the site's name. */
    title: '{title} · {site}',
    /** The first link on every page, for keyboards and screen readers; it jumps past the header. */
    skip: 'Saltar al contenido',
    /** The footer of every page. <1> links to the About page's section on leaving a list out. */
    footer: '{site} indexa nombres, secciones y enlaces. Las descripciones pertenecen a las listas y no se copian aquí. ¿Mantienes una lista y quieres que no aparezca? <1>Abre un issue</1>.',
    /** The label of the breadcrumb trail (for screen readers). */
    breadcrumb: 'Ruta de navegación',
  },
  nav: {
    lists: 'Listas',
    items: 'Elementos',
    about: 'Acerca de',
    /** The search box in the header: its label, and the hint inside it ("/" is the key that opens quick search). */
    search: 'Buscar',
    searchHint: 'Buscar  ( / )',
  },
  quick: {
    /** The quick-search dialog, opened with Ctrl-K or "/". */
    label: 'Búsqueda rápida',
    placeholder: 'Busca listas, elementos y etiquetas',
    /** The label of the list of results inside the dialog (for screen readers). */
    results: 'Resultados',
    help: '↑ ↓ para moverte, Enter para abrir, Esc para cerrar',
    /** Group headings inside the dialog's results. */
    lists: 'Listas',
    items: 'Elementos',
    tags: 'Etiquetas',
  },
  lang: {
    /** The label of the list of languages in the footer (for screen readers). */
    switcher: 'Idioma',
    /**
     * A bar shown when the visitor's browser prefers this language over the page's. Written in this file's own
     * language, because it is shown to someone who reads it.
     */
    suggest: 'Lee esta página en español',
    /** The label of the bar's close button (for screen readers), also in this file's own language. */
    close: 'Cerrar',
  },
  count: {
    lists: p({ one: '{n} lista', many: '{n} de listas', other: '{n} listas' }),
    items: p({ one: '{n} elemento', many: '{n} de elementos', other: '{n} elementos' }),
    listings: p({ one: '{n} aparición', many: '{n} de apariciones', other: '{n} apariciones' }),
    sections: p({ one: '{n} sección', many: '{n} de secciones', other: '{n} secciones' }),
    links: p({ one: '{n} enlace', many: '{n} de enlaces', other: '{n} enlaces' }),
    stars: p({ one: '{n} estrella', many: '{n} de estrellas', other: '{n} estrellas' }),
    projects: p({ one: '{n} proyecto', many: '{n} de proyectos', other: '{n} proyectos' }),
    otherLists: p({ one: '{n} lista más', many: '{n} de listas más', other: '{n} listas más' }),
    /** "{items} in {sections}": e.g. "12 items in 4 sections"; both values are the plurals above. */
    itemsInSections: '{items} en {sections}',
    /** A list's reason for being read only in part: e.g. "5 items from 81 links"; both values are plurals above. */
    itemsFromLinks: '{items} de {links}',
    /** "N of M" in a list page's filter: how many entries are shown of all. */
    shownOf: '{n} de {m}',
    /** On a phone, how many lists name an item, in a row's second line. */
    inLists: p({ one: 'en {n} lista', many: 'en {n} de listas', other: 'en {n} listas' }),
  },
  /** One-word labels of an item's kind, shown beside "Kind" and in the facet rail. */
  kind: {
    repo: 'repositorio',
    package: 'paquete',
    video: 'video',
    paper: 'artículo de investigación',
    article: 'artículo',
    site: 'sitio',
  },
  /** A repository's state. Shown as a short word beside its name, and in the facet rail. */
  status: {
    active: 'activo',
    quiet: 'inactivo',
    archived: 'archivado',
    gone: 'desaparecido',
  },
  /** A list's state, in the facet rail of /lists: read in full, in part, not read, gone from GitHub. */
  listStatus: {
    ok: 'leída completa',
    partial: 'leída en parte',
    unparsed: 'aún sin leer',
    gone: 'desaparecida',
  },
  /** The ways of ordering a listing page, after "sort by". */
  sort: {
    relevance: 'relevancia',
    lists: 'listas',
    stars: 'estrellas',
    items: 'elementos',
    updated: 'actualización',
    name: 'nombre',
  },
  yes: 'sí',
  no: 'no',
  common: {
    search: 'Buscar',
    filter: 'Filtrar',
    searchListsAndItems: 'Buscar listas y elementos',
    nothingHere: 'No hay nada aquí.',
    previous: '← Anterior',
    next: 'Siguiente →',
    /** After the removable filter chips: takes them all away. */
    clearAll: 'Quitar todo',
    /** "12 lists · sort by stars · items · updated · name"; {sorts} are the sort words, the current one in bold. */
    sortBy: '{count} · ordenar por {sorts}',
    /** Shown past the last page a listing will show. */
    pagingStops: 'La paginación termina en la página {n}. Ajusta los filtros para ver más.',
    /** The removable chip for a search: “{q}” is what was searched for. */
    searchChip: '«{q}»',
    /** Between names in a short list, as in "Widgets, Gadgets, Tools" (Chinese and Japanese: '、'). */
    separator: ', ',
    /** The labels over the columns of a listing's rows. */
    columns: { name: 'Nombre', language: 'Lenguaje', stars: 'Estrellas', lists: 'Listas', updated: 'Actualizado', items: 'Elementos' },
  },
  facts: {
    stars: 'Estrellas',
    lastPush: 'Último push',
    language: 'Lenguaje',
    licence: 'Licencia',
    entries: 'Entradas',
    namedBy: 'Citado por',
    state: 'Estado',
    fork: 'Fork',
    kind: 'Tipo',
    host: 'Dominio',
    renamedFrom: 'Antes llamado',
  },
  home: {
    /** The page's heading: the same words as its title, without the site's name. */
    h1: p({ one: '{n} lista awesome y todo lo que contiene', many: '{n} de listas awesome y todo lo que contienen', other: '{n} listas awesome y todo lo que contienen' }),
    /** The line of counts under the search box; {lists}, {items} and {listings} are the count plurals. */
    counts: '{lists} · {items} · {listings} · datos del {date}',
    mostNamed: 'Citados por más listas',
    /** The line of the most common languages under the counts, and the link after them to every project. */
    browseByLanguage: 'Explorar por lenguaje',
    allProjects: 'Todos los proyectos',
    /** A heading over the lists with the most stars, as cards; then a link to every list. */
    startHere: 'Empieza aquí',
    allLists: p({ one: '{n} lista', many: 'Las {n} de listas', other: 'Las {n} listas' }),
    /** A heading over every list, category by category. */
    byCategory: 'Todas las listas por categoría',
    /** Under the items named by the most lists: a link to all of those named by two or more. */
    namedByTwo: 'Todos los proyectos citados por 2 listas o más',
  },
  lists: {
    h1: 'Listas',
    filterLists: 'Filtrar listas',
    category: 'Categoría',
    licence: 'Licencia',
    status: 'Estado',
  },
  list: {
    contents: 'Contenido',
    filterThisList: 'Filtrar esta lista',
    collapseAll: 'Contraer todo',
    expandAll: 'Expandir todo',
    /** The label of the "#" link beside a section heading (for screen readers). */
    sectionLink: 'Enlace a esta sección',
    readOriginal: 'Leer el original en GitHub',
    suggestChange: 'Sugerir un cambio',
    /** For a list whose entries could not be read; {reason} is why, e.g. "the readme is in reStructuredText". */
    unparsed: 'Todavía no pudimos leer las entradas de esta lista ({reason}).',
    noReason: 'sin motivo indicado',
    /**
     * Under a list's entries. <1> is the list's name (bold), {owner} a GitHub login, <2> the link to the
     * repository, whose text is {repo} (github.com/owner/repo).
     */
    attribution: 'Esta página es un índice de <1>{name}</1>, una lista que mantienen {owner} y sus colaboradores en <2>{repo}</2>. La selección y el orden son suyos; el resumen de arriba es nuestro.',
    /** Follows the attribution; {oid} is a commit's short hash, {date} the day it was read. */
    readAt: 'Leída en el commit {oid} el {date}.',
    /** Follows the attribution; {license} is a licence's name, e.g. "MIT". */
    licence: 'Licencia: {license}.',
    /** A heading after a list's entries: other lists of the same category. */
    moreIn: 'Más en {category}',
  },
  item: {
    /** Under an item's name: the other names lists give it. */
    alsoListedAs: 'También aparece como: {names}',
    /** When an item is itself one of the lists; <1> links to its list page. */
    isList: 'Esto es también una lista de la biblioteca: <1>ábrela</1>.',
    archived: 'Archivado por su propietario.',
    gone: 'Este repositorio ya no está en GitHub.',
    /** {month} is a month and year, e.g. "Mar 2023". */
    quietSince: 'Sin pushes desde {month}.',
    quiet: 'Sin pushes en dos años.',
    factsAsOf: 'Datos de GitHub a fecha de {date}.',
    inLists: p({ one: 'En {n} lista', many: 'En {n} de listas', other: 'En {n} listas' }),
    /** Beside one of the lists an item is in, when that list calls it by another name. */
    listedAs: 'aparece como «{name}»',
    alongside: 'Aparece junto a',
    attribution: 'Citado por las listas de arriba. Abre una lista para leer lo que dicen sus curadores. Para sugerir un cambio, abre un issue en una de esas listas.',
    /** The item's one outbound link, as a button: to its repository, or to its site ({host}, e.g. example.com). */
    openGitHub: 'Abrir en GitHub ↗',
    visit: 'Visitar {host} ↗',
    /** A heading over other projects of the same GitHub owner; {owner} is a login. */
    moreFrom: 'Más de {owner}',
    /** Under them: a link to the owner's page. */
    allFrom: p({ one: '{n} proyecto de {owner}', many: 'Los {n} de proyectos de {owner}', other: 'Los {n} proyectos de {owner}' }),
    /** The label over an item's topic chips. */
    topics: 'Temas',
  },
  items: {
    h1: 'Elementos',
    searchItems: 'Buscar elementos',
    /** After the count of results, when a search found more than can be ranked. */
    bestOnly: ' (solo las mejores coincidencias)',
    kind: 'Tipo',
    status: 'Estado',
    language: 'Lenguaje',
    licence: 'Licencia',
    topic: 'Tema',
    category: 'Categoría',
    list: 'Lista',
    stars: 'Estrellas',
    namedBy: 'Citado por',
    /** Facet values: "1,000+ stars", "in 5+ lists". */
    starsAtLeast: '{n}+ estrellas',
    inAtLeast: 'en {n}+ listas',
  },
  owner: {
    listsTheyKeep: 'Listas que mantiene',
    theirProjects: 'Sus proyectos citados en listas',
    /** A link under an owner's projects to all of them on the Items page. */
    allInItems: p({ one: 'El único en Elementos', many: 'Los {n} en Elementos', other: 'Los {n} en Elementos' }),
  },
  search: {
    h1: 'Buscar',
    lists: 'Listas',
    sections: 'Secciones',
    items: 'Elementos',
    /** Beside a section found by search: the list it is in. */
    inList: 'en {list}',
    noItems: 'Ningún elemento coincide.',
    allItems: p({ one: 'El único elemento', many: 'Los {n} de elementos', other: 'Los {n} elementos' }),
  },
  notFound: {
    h1: 'No hay nada en esta dirección',
    /** Above a few pages that might be what the visitor wanted. */
    perhaps: 'Quizás buscabas',
  },
  about: {
    h1: 'Acerca de {site}',
    /** <1> links to the index of awesome lists. {lists}, {items} are count plurals ("671 lists"). */
    intro: '{site} es una biblioteca gratuita de todas las listas awesome del <1>índice de listas awesome</1> y de todo lo que contienen: {lists}, los {items} que citan y dónde cita cada lista a cada uno.',
    shownTitle: 'Qué se muestra y qué no',
    shown: 'El sitio muestra nombres, secciones, enlaces y datos, además de textos propios. Nunca muestra la descripción de un curador ni la del propietario de un repositorio. El resumen de cada lista es nuestro; lo que una lista dice de una entrada se queda en la lista, a un enlace de distancia.',
    attributionTitle: 'Atribución',
    attribution: 'La selección y el orden de cada lista pertenecen a quienes la mantienen. Cada página de lista indica dónde está la lista y el commit en que se leyó. Los datos de los repositorios (estrellas, último push, lenguaje, licencia, temas) vienen de GitHub.',
    leaveOutTitle: 'Cómo se excluye una lista',
    /** <1> links to this project's issues on GitHub. */
    leaveOut: '¿Mantienes una lista y quieres que no aparezca? <1>Abre un issue en el repositorio de este proyecto</1> indicando la lista. Se excluye en la siguiente compilación: no se leen sus entradas y se elimina su página.',
    coverageTitle: 'Cobertura',
    /** {ok}, {partial}, {unparsed} are plain numbers. */
    coverageLists: 'Listas: {ok} leídas completas, {partial} en parte, {unparsed} aún sin leer.',
    /** As above, when some lists are gone from GitHub; {gone} is a plain number. */
    coverageListsGone: 'Listas: {ok} leídas completas, {partial} en parte, {unparsed} aún sin leer, {gone} desaparecidas de GitHub.',
    /** {items} is a count plural ("116,162 items"); the rest are plain numbers. */
    coverageItems: '{items}: repositorios: {repo}, sitios: {site}, videos: {video}, artículos: {article}, paquetes: {package}, artículos de investigación: {paper}.',
    coverageTwoOrMore: 'Elementos citados por dos listas o más: {n}.',
    coverageRepos: 'Repositorios: {active} activos, {quiet} inactivos (sin push en dos años), {archived} archivados, {gone} desaparecidos.',
    dataOf: 'Los datos son del {date}.',
  },
  /** Titles (in the browser's tab and in search results) and descriptions (under the title in search results). */
  meta: {
    /** Aim at 60 characters or fewer (30 for Chinese, Japanese, Korean). Descriptions: 70 to 160 (80). */
    home: {
      title: p({ one: '{site}: {n} lista awesome y todo su contenido', many: '{site}: {n} de listas awesome y todo su contenido', other: '{site}: {n} listas awesome y todo su contenido' }),
      /** {n} is the number of lists; {items} the number of projects, already formatted. */
      description: p({
        one: 'Índice de {n} lista awesome y los {items} proyectos que cita, por categoría, lenguaje, licencia y tema.',
        many: 'Índice de {n} de listas awesome y los {items} proyectos que citan, por categoría, lenguaje, licencia y tema.',
        other: 'Índice de {n} listas awesome y los {items} proyectos que citan, por categoría, lenguaje, licencia y tema.',
      }),
    },
    lists: {
      title: p({ one: 'La única lista awesome', many: 'Las {n} de listas awesome', other: 'Las {n} listas awesome' }),
      description: p({
        one: '{n} lista awesome con su tamaño, sus estrellas y nuestro resumen de una línea.',
        many: '{n} de listas awesome con su tamaño, sus estrellas y nuestro resumen de una línea.',
        other: '{n} listas awesome con su tamaño, sus estrellas y nuestro resumen de una línea.',
      }),
    },
    category: {
      /** {category} is a category's name, e.g. "Platforms". */
      title: p({ one: '{category}: {n} lista awesome', many: '{category}: {n} de listas awesome', other: '{category}: {n} listas awesome' }),
      description: p({
        one: '{n} lista awesome de {category}, con su tamaño, estrellas y resumen.',
        many: '{n} de listas awesome de {category}, con su tamaño, estrellas y resumen.',
        other: '{n} listas awesome de {category}, con su tamaño, estrellas y resumen.',
      }),
    },
    /** A later page of a listing: {title} is the first page's title. */
    page: '{title}, página {page}',
    list: {
      /** {name} is the list's name. */
      title: p({ one: '{name}: una lista awesome de {n} elemento', many: '{name}: una lista awesome de {n} de elementos', other: '{name}: una lista awesome de {n} elementos' }),
      /** When the list has no summary of ours; {repo} is github.com/owner/repo. */
      description: '{name}, una lista awesome mantenida en {repo}.',
    },
    item: {
      /** A repository: {repo} is owner/repo. */
      repoTitle: p({ one: '{repo}: en {n} lista awesome', many: '{repo}: en {n} de listas awesome', other: '{repo}: en {n} listas awesome' }),
      /** Anything else: {name} is its name. */
      title: p({ one: '{name}: en {n} lista awesome', many: '{name}: en {n} de listas awesome', other: '{name}: en {n} listas awesome' }),
      /** {lists} are up to three list names. */
      repoDescription: p({
        one: '{name} aparece en {n} lista awesome: {lists}.',
        many: '{name} aparece en {n} de listas awesome: {lists}.',
        other: '{name} aparece en {n} listas awesome: {lists}.',
      }),
      /** {host} is a web site's host, e.g. example.com. */
      description: p({
        one: '{name} ({host}) aparece en {n} lista awesome: {lists}.',
        many: '{name} ({host}) aparece en {n} de listas awesome: {lists}.',
        other: '{name} ({host}) aparece en {n} listas awesome: {lists}.',
      }),
      /** In one list only: {list} is that list's name. */
      repoTitleOne: '{repo}: en la lista awesome {list}',
      titleOne: '{name}: en la lista awesome {list}',
      /** Sentences of an item's description: {section} is a section's title in the list, {names} up to three names. */
      inOne: '{name} aparece en la lista awesome {list}, en {section}.',
      under: 'En {list}, aparece en {section}.',
      alongside: 'Junto a {names}.',
    },
    owner: {
      /** {display} is a GitHub login. */
      title: '{display}: listas y proyectos',
      /** {lists} and {projects} are count plurals ("3 lists", "12 projects"). */
      description: '{display} en GitHub: mantiene {lists} y tiene {projects} citados en listas.',
    },
    items: {
      title: p({ one: '{n} proyecto citado en listas awesome', many: '{n} de proyectos citados en listas awesome', other: '{n} proyectos citados en listas awesome' }),
      description: p({
        one: 'Explora {n} proyecto por lenguaje, licencia, tema, estrellas y cuántas listas lo citan.',
        many: 'Explora {n} de proyectos por lenguaje, licencia, tema, estrellas y cuántas listas los citan.',
        other: 'Explora {n} proyectos por lenguaje, licencia, tema, estrellas y cuántas listas los citan.',
      }),
      /** One filter: {label} is what it is, e.g. "Go" or "archived" or "1,000+ stars". */
      filteredTitle: p({ one: '{label}: {n} proyecto en listas awesome', many: '{label}: {n} de proyectos en listas awesome', other: '{label}: {n} proyectos en listas awesome' }),
      filteredDescription: p({
        one: '{label}: {n} proyecto citado en listas awesome, con sus estrellas y las listas que lo citan.',
        many: '{label}: {n} de proyectos citados en listas awesome, con sus estrellas y las listas que los citan.',
        other: '{label}: {n} proyectos citados en listas awesome, con sus estrellas y las listas que los citan.',
      }),
      /** A search in the items: {q} is what was searched for. */
      matching: 'Elementos que coinciden con «{q}»',
    },
    about: {
      title: 'Acerca de {site}',
      description: 'Qué muestra {site}, de dónde salen sus datos y cómo se excluye una lista.',
    },
  },
};
