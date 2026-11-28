// Korean. Translated from messages/en.ts. After changing a message, run `pnpm check-translations --stamp ko`.
// The comments say where a message appears and what its placeholders are; they need no translating.
import { p } from '../format.js';
import type { Messages } from './en.js';

export const ko: Messages = {
  site: {
    /** The browser tab's title on most pages: the page's title, then the site's name. */
    title: '{title} · {site}',
    /** The first link on every page, for keyboards and screen readers; it jumps past the header. */
    skip: '본문으로 건너뛰기',
    /** The footer of every page. <1> links to the About page's section on leaving a list out. */
    footer: '{site}는 이름, 섹션, 링크만 색인합니다. 설명은 각 목록의 것이므로 여기에 옮기지 않습니다. 목록을 관리하는데 제외되길 원하시나요? <1>이슈를 열어 주세요</1>.',
    /** The label of the breadcrumb trail (for screen readers). */
    breadcrumb: '현재 위치',
  },
  nav: {
    lists: '목록',
    items: '항목',
    about: '소개',
    /** The search box in the header: its label, and the hint inside it ("/" is the key that opens quick search). */
    search: '검색',
    searchHint: '검색  ( / )',
  },
  quick: {
    /** The quick-search dialog, opened with Ctrl-K or "/". */
    label: '빠른 검색',
    placeholder: '목록, 항목, 태그 검색',
    /** The label of the list of results inside the dialog (for screen readers). */
    results: '검색 결과',
    help: '↑ ↓ 이동, Enter 열기, Esc 닫기',
    /** Group headings inside the dialog's results. */
    lists: '목록',
    items: '항목',
    tags: '태그',
  },
  lang: {
    /** The label of the list of languages in the footer (for screen readers). */
    switcher: '언어',
    /**
     * A bar shown when the visitor's browser prefers this language over the page's. Written in this file's own
     * language, because it is shown to someone who reads it.
     */
    suggest: '이 페이지를 한국어로 보기',
    /** The label of the bar's close button (for screen readers), also in this file's own language. */
    close: '닫기',
  },
  share: {
    /** The share row on a list, an item, an owner, the home page and a language or topic of /items: its label. */
    label: '공유',
    /** A share link's name (for screen readers and as its tooltip). {service} is X, Bluesky, LinkedIn, Reddit or Hacker News. */
    on: '{service}에 공유',
    /** The email link's name. */
    email: '이메일로 공유',
    /** A button that copies the page's address; then, for a moment, what it says it did. */
    copy: '링크 복사',
    copied: '복사됨',
    /** A button that opens the phone's own share sheet. */
    native: '공유…',
  },
  count: {
    lists: p({ other: '목록 {n}개' }),
    items: p({ other: '항목 {n}개' }),
    listings: p({ other: '등재 {n}건' }),
    sections: p({ other: '섹션 {n}개' }),
    links: p({ other: '링크 {n}개' }),
    stars: p({ other: '스타 {n}개' }),
    projects: p({ other: '프로젝트 {n}개' }),
    otherLists: p({ other: '다른 목록 {n}개' }),
    /** "{items} in {sections}": e.g. "12 items in 4 sections"; both values are the plurals above. */
    itemsInSections: '{sections}, {items}',
    /** A list's reason for being read only in part: e.g. "5 items from 81 links"; both values are plurals above. */
    itemsFromLinks: '{links} 중 {items}',
    /** "N of M" in a list page's filter: how many entries are shown of all. */
    shownOf: '{m}개 중 {n}개',
    /** On a phone, how many lists name an item, in a row's second line. */
    inLists: p({ other: '목록 {n}개에 실림' }),
  },
  /** One-word labels of an item's kind, shown beside "Kind" and in the facet rail. */
  kind: {
    repo: '저장소',
    package: '패키지',
    video: '영상',
    paper: '논문',
    article: '글',
    site: '사이트',
  },
  /** A repository's state. Shown as a short word beside its name, and in the facet rail. */
  status: {
    active: '활발함',
    quiet: '잠잠함',
    archived: '보관됨',
    gone: '사라짐',
  },
  /** A list's state, in the facet rail of /lists: read in full, in part, not read, gone from GitHub. */
  listStatus: {
    ok: '전부 읽음',
    partial: '일부 읽음',
    unparsed: '아직 안 읽음',
    gone: '사라짐',
  },
  /** The ways of ordering a listing page, after "sort by". */
  sort: {
    relevance: '관련도',
    lists: '목록 수',
    stars: '스타',
    items: '항목 수',
    updated: '업데이트',
    name: '이름',
  },
  yes: '예',
  no: '아니요',
  common: {
    search: '검색',
    filter: '필터',
    searchListsAndItems: '목록과 항목 검색',
    nothingHere: '아무것도 없어요.',
    previous: '← 이전',
    next: '다음 →',
    /** After the removable filter chips: takes them all away. */
    clearAll: '모두 지우기',
    /** "12 lists · sort by stars · items · updated · name"; {sorts} are the sort words, the current one in bold. */
    sortBy: '{count} · 정렬: {sorts}',
    /** Shown past the last page a listing will show. */
    pagingStops: '{n}쪽까지만 볼 수 있어요. 더 보려면 필터를 좁혀 주세요.',
    /** The removable chip for a search: “{q}” is what was searched for. */
    searchChip: '“{q}”',
    /** Between names in a short list, as in "Widgets, Gadgets, Tools" (Chinese and Japanese: '、'). */
    separator: ', ',
    /** Between the pager's two buttons: where the reader is. */
    pageOf: '{pages}페이지 중 {page}페이지',
    /** Between the parts of an entry's line of facts, as in "gin-gonic · Go · ★ 89,600". */
    dot: ' · ',
    /** A filter that is on, as a removable chip: {facet} is the facet's title ("Language"), {value} what is chosen ("Go"). */
    filterChip: '{facet}: {value}',
  },
  /** The parts of an entry's line of facts that need words: its stars, and the year of its last push. */
  entry: {
    stars: '★ {n}',
    updated: '{year}년 업데이트',
  },
  facts: {
    stars: '스타',
    lastPush: '마지막 푸시',
    language: '언어',
    licence: '라이선스',
    entries: '항목',
    namedBy: '수록 목록',
    state: '상태',
    fork: '포크',
    kind: '종류',
    host: '호스트',
    renamedFrom: '이전 이름',
    /** An item's GitHub owner, a link to their page. */
    owner: '소유자',
    /** A list's plain Markdown copy, a link to /lists/{owner}/{repo}.md. The format's name. */
    markdown: 'Markdown',
  },
  home: {
    /** The page's heading: the same words as its title, without the site's name. */
    h1: p({ other: 'awesome list {n}개와 그 안의 모든 것' }),
    mostNamed: '가장 많은 목록에 실린 항목',
    /** The line of the most common languages under the counts, and the link after them to every project. */
    browseByLanguage: '언어별로 보기',
    allProjects: '모든 프로젝트',
    /** A heading over the lists with the most stars, as cards; then a link to every list. */
    startHere: '여기서 시작하기',
    allLists: p({ other: '목록 {n}개 모두' }),
    /** A heading over every list, category by category. */
    byCategory: '카테고리별 전체 목록',
    /** Under the items named by the most lists: a link to all of those named by two or more. */
    namedByTwo: '2개 이상의 목록에 실린 모든 프로젝트',
  },
  lists: {
    h1: '목록',
    filterLists: '목록 필터',
    category: '카테고리',
    licence: '라이선스',
    status: '상태',
  },
  list: {
    contents: '목차',
    filterThisList: '이 목록 필터',
    /** The label of the "#" link beside a section heading (for screen readers). */
    sectionLink: '이 섹션 링크',
    readOriginal: 'GitHub에서 원본 읽기',
    suggestChange: '변경 제안하기',
    /** For a list whose entries could not be read; {reason} is why, e.g. "the readme is in reStructuredText". */
    unparsed: '이 목록의 항목을 아직 읽지 못했어요({reason}).',
    noReason: '이유 없음',
    /**
     * Under a list's entries. <1> is the list's name (bold), {owner} a GitHub login, <2> the link to the
     * repository, whose text is {repo} (github.com/owner/repo).
     */
    attribution: '이 페이지는 {owner} 및 기여자들이 <2>{repo}</2>에서 관리하는 목록 <1>{name}</1>의 색인입니다. 선정과 순서는 그들의 것이고, 위의 요약은 저희가 썼습니다.',
    /** Follows the attribution; {oid} is a commit's short hash, {date} the day it was read. */
    readAt: '{date}에 커밋 {oid} 기준으로 읽었습니다.',
    /** Follows the attribution; {license} is a licence's name, e.g. "MIT". */
    licence: '라이선스: {license}.',
    /** A heading after a list's entries: other lists of the same category. */
    moreIn: '{category} 카테고리의 다른 목록',
    /** In a list's head, before the names of the lists most like it. */
    seeAlso: '함께 보기',
    /** A heading after a list's entries over the lists most like it, each with how many projects both name. */
    related: '관련 목록',
    inCommon: p({ other: '공통 프로젝트 {n}개' }),
    /** A heading at the foot of a list page, over its facts, where it comes from and the share row. */
    aboutTitle: '이 목록에 대하여',
  },
  item: {
    /** Under an item's name: the other names lists give it. */
    alsoListedAs: '다른 이름: {names}',
    /** When an item is itself one of the lists; <1> links to its list page. */
    isList: '이 항목은 라이브러리에 있는 목록이기도 해요. <1>목록 열기</1>',
    gone: 'GitHub에서 더 이상 이 저장소를 찾을 수 없어요.',
    factsAsOf: '{date} 기준 GitHub 정보.',
    /** Beside one of the lists an item is in, when that list calls it by another name. */
    listedAs: '‘{name}’ 이름으로 실림',
    attribution: '위 목록들에 실린 항목입니다. 큐레이터가 이 항목을 어떻게 소개하는지는 각 목록에서 읽어 보세요. 변경을 제안하려면 해당 목록에 이슈를 열어 주세요.',
    /** The item's one outbound link, as a button: to its repository, or to its site ({host}, e.g. example.com). */
    openGitHub: 'GitHub에서 열기 ↗',
    visit: '{host} 방문 ↗',
    /** A heading over other projects of the same GitHub owner; {owner} is a login. */
    moreFrom: '{owner}의 다른 프로젝트',
    /** Under them: a link to the owner's page. */
    allFrom: p({ other: '{owner}의 프로젝트 {n}개 모두' }),
    /** The label over an item's topic chips. */
    topics: '토픽',
    /** Under "What is listed alongside {name}?". */
    alongsideNote: '어떤 목록에서 같은 섹션에 실린 프로젝트예요. 목록이 이들을 대안이라고 말하는 것은 아니에요.',
    q: {
      /** Headings of an item page, as the questions a visitor asks; {name} is the item. */
      lists: '{name}은(는) 어떤 awesome list에 실려 있나요?',
      maintained: '{name}은(는) 아직 관리되고 있나요?',
      alongside: '{name}과(와) 함께 실린 것은?',
    },
    a: {
      /** The answer under "Is {name} still maintained?", by the repository's state. {date} is its last push, {asOf} the data's date. The site says what GitHub says, and when. */
      active: '{asOf} 기준으로 마지막 푸시는 {date}이고, 보관(archive)되지 않았어요.',
      /** "Two years" is the site's rule for quiet (730 days). */
      quiet: '{date} 이후로 푸시가 없어요. {asOf}보다 2년 넘게 전이에요. 보관(archive)되지는 않았어요.',
      archived: '아니요. 소유자가 보관(archive)했어요. 마지막 푸시는 {date}이에요.',
    },
  },
  items: {
    h1: '항목',
    searchItems: '항목 검색',
    /** After the count of results, when a search found more than can be ranked. */
    bestOnly: ' (가장 잘 맞는 결과만)',
    kind: '종류',
    status: '상태',
    language: '언어',
    licence: '라이선스',
    topic: '토픽',
    category: '카테고리',
    list: '목록',
    stars: '스타',
    namedBy: '수록 목록',
    /** Facet values: "1,000+ stars", "in 5+ lists". */
    starsAtLeast: '스타 {n}개 이상',
    inAtLeast: '목록 {n}개 이상',
  },
  owner: {
    listsTheyKeep: '관리하는 목록',
    theirProjects: '목록에 실린 프로젝트',
    /** A link under an owner's projects to all of them on the Items page. */
    allInItems: p({ other: '항목에서 {n}개 모두 보기' }),
  },
  search: {
    h1: '검색',
    lists: '목록',
    sections: '섹션',
    items: '항목',
    /** Beside a section found by search: the list it is in. */
    inList: '{list} 목록',
    noItems: '일치하는 항목이 없어요.',
    allItems: p({ other: '항목 {n}개 모두 보기' }),
  },
  notFound: {
    h1: '이 주소에는 아무것도 없어요',
    /** Above a few pages that might be what the visitor wanted. */
    perhaps: '이런 페이지를 찾으셨나요?',
  },
  about: {
    h1: '{site} 소개',
    /** <1> links to the index of awesome lists. {lists}, {items} are count plurals ("671 lists"). */
    intro: '{site}는 <1>awesome list 색인</1>에 있는 모든 awesome list와 그 안의 모든 것을 모은 무료 라이브러리입니다. {lists}, 그 목록들에 실린 {items}, 그리고 각 항목이 어느 목록의 어디에 실렸는지 담고 있습니다.',
    /** The About page's headings are the questions a visitor asks; {site} is the site's name. */
    shownTitle: '{site}은(는) 무엇을 보여 주나요?',
    shown: '이 사이트는 이름, 섹션, 링크, 사실 정보와 저희가 직접 쓴 글만 보여 줍니다. 큐레이터나 저장소 소유자의 설명은 절대 보여 주지 않습니다. 목록 요약은 저희가 쓴 것이고, 목록이 각 항목에 대해 쓴 내용은 링크 하나 너머 원래 목록에 있습니다.',
    attributionTitle: '데이터는 어디서 오며, 누구의 것인가요?',
    attribution: '각 목록의 선정과 순서는 그 목록을 관리하는 사람들의 것입니다. 목록 페이지마다 목록이 있는 곳과 읽은 커밋을 밝힙니다. 저장소 정보(스타, 마지막 푸시, 언어, 라이선스, 토픽)는 GitHub에서 가져옵니다.',
    leaveOutTitle: '목록은 어떻게 제외되나요?',
    /** <1> links to this project's issues on GitHub. */
    leaveOut: '목록을 관리하는데 제외되길 원하시나요? 목록 이름을 적어 <1>이 프로젝트 저장소에 이슈를 열어 주세요</1>. 다음 빌드부터 제외되어 항목을 읽지 않고 페이지도 삭제됩니다.',
    coverageTitle: '얼마나 다루고 있나요?',
    /** {ok}, {partial}, {unparsed} are plain numbers. */
    coverageLists: '목록 {ok}개는 전부, {partial}개는 일부 읽었고, {unparsed}개는 아직 읽지 않았습니다.',
    /** As above, when some lists are gone from GitHub; {gone} is a plain number. */
    coverageListsGone: '목록 {ok}개는 전부, {partial}개는 일부 읽었고, {unparsed}개는 아직 읽지 않았으며, {gone}개는 GitHub에서 사라졌습니다.',
    /** {items} is a count plural ("116,162 items"); the rest are plain numbers. */
    coverageItems: '{items}: 저장소 {repo}개, 사이트 {site}개, 영상 {video}개, 글 {article}개, 패키지 {package}개, 논문 {paper}개.',
    coverageTwoOrMore: '항목 {n}개가 두 개 이상의 목록에 실려 있습니다.',
    coverageRepos: '저장소: 활발함 {active}개, 잠잠함 {quiet}개(2년간 푸시 없음), 보관됨 {archived}개, 사라짐 {gone}개.',
    freshTitle: '데이터는 얼마나 최신인가요?',
    /** {date} is the day this copy of the data was finished. */
    fresh: '목록과 GitHub의 정보는 매일 밤 다시 읽어요. 이 사본은 {date}에 완성되었어요.',
    aiTitle: 'AI 어시스턴트와 크롤러가 사용할 수 있나요?',
    /** <1> links to /llms.txt; robots.txt, /llms.txt and .md are names of files and stay as they are. */
    ai: '네. robots.txt에서 허용하고 있고, <1>/llms.txt</1>에서 사이트를 설명해요. 모든 목록은 주소 끝에 .md를 붙이면 Markdown 사본을 받을 수 있어요. 목록의 선택과 순서는 큐레이터의 것이므로 그 부분은 GitHub의 목록을, 개수와 어떤 목록이 프로젝트를 싣는지는 {site}을(를) 인용해 주세요.',
  },
  /**
   * Sentences that open a page, made of its own data. Names in them are links; never a curator's or an owner's words.
   */
  sum: {
    /** The home page. {lists} and {items} are count plurals ("671 lists"), {date} a date. */
    home: '{site}은(는) GitHub에 있는 {lists}과(와) 거기에 실린 {items}의 색인이에요. 이름, 섹션, 링크, GitHub의 정보를 보여 주며, 목록 자체의 설명은 보여 주지 않아요. 데이터는 {date} 기준이며 매일 밤 다시 읽어요.',
    /** A category of /lists: {category} is its name, {names} three list names. */
    category: p({ other: '{category} 분류에는 awesome list {n}개가 있어요. 스타가 가장 많은 목록은 {names}예요.' }),
    /** After a summary: {date} is a date. */
    asOf: '데이터는 {date} 기준이에요.',
    list: {
      /** A list page, after our summary. {name} is the list, {repo} owner/repo, {owner} a login, {items} and {sections} count plurals. */
      what: '{name}은(는) {owner}이(가) GitHub에서 관리하는 awesome list {repo}예요. {sections}에 {items}이(가) 실려 있어요.',
      /** The same, for a list whose entries could not be read. */
      whatUnread: '{name}은(는) {owner}이(가) GitHub에서 관리하는 awesome list {repo}예요.',
      /** {stars} is a count plural ("196,233 stars"), {date} a date. */
      github: 'GitHub에서 {stars}를 받았고, 마지막 푸시는 {date}이에요.',
      /** {sections} are three section titles, each with its count: "Command Line (105), …". */
      sections: '가장 큰 섹션은 {sections}예요.',
      /** {names} are five project names. */
      top: '스타가 가장 많은 프로젝트는 {names}예요.',
      /** {language} is a programming language, e.g. "Go". */
      lang: '저장소 대부분은 {language}(으)로 작성되어 있어요.',
    },
    items: {
      /** /items with one language: {label} is the language. */
      lang: p({ other: 'awesome list에 실린 프로젝트 중 {n}개가 {label}(으)로 작성되어 있어요.' }),
      /** /items with one topic: {label} is a GitHub topic. */
      topic: p({ other: 'awesome list에 실린 프로젝트 중 {n}개에 GitHub 토픽 {label}이(가) 붙어 있어요.' }),
      /** /items with one licence: {label} is the licence, e.g. "MIT". */
      license: p({ other: 'awesome list에 실린 프로젝트 중 {n}개가 {label} 라이선스를 따라요.' }),
      /** /items with one kind: {label} is the kind's word, e.g. "video". */
      kind: p({ other: 'awesome list에 실린 것 중 {n}개가 {label} 종류예요.' }),
      /** After one of the four: {names} are five names. */
      top: '가장 많은 목록에 실린 것은 {names}예요.',
    },
    item: {
      /** An item page's first sentence. {name} is the repository, {language} e.g. "Go", {owner} a login, {stars} a count plural. */
      repoLang: '{name}은(는) GitHub에 있는 {owner}의 {language} 저장소이며 {stars}를 받았어요.',
      /** The same, with no language known. */
      repo: '{name}은(는) GitHub에 있는 {owner}의 저장소이며 {stars}를 받았어요.',
      /** The same, with no stars known. */
      repoPlain: '{name}은(는) GitHub에 있는 {owner}의 저장소예요.',
      /** Anything else, one sentence a kind: {name} is its name, {host} where it is (example.com). */
      kind: {
        repo: '{name}은(는) {host}에 있는 저장소예요.',
        site: '{name}은(는) {host}에 있는 웹사이트예요.',
        video: '{name}은(는) {host}에 있는 동영상이에요.',
        article: '{name}은(는) {host}에 있는 글이에요.',
        package: '{name}은(는) {host}에 있는 패키지예요.',
        paper: '{name}은(는) {host}에 있는 논문이에요.',
      },
      /** The second sentence: {lists} are up to three lists, each "Go (under Web Frameworks)", and perhaps "2 more". */
      lists: p({ other: 'awesome list {n}개에 실려 있어요: {lists}.' }),
      /** One of those lists: {list} is its name, {section} the title of the section that holds the item. */
      listUnder: '{list}({section} 섹션)',
      /** After three lists: how many more name it. */
      more: p({ other: '외 {n}개' }),
      /** The third sentence, for a repository: {date} is a date. */
      pushed: '마지막 푸시는 {date}이에요.',
    },
    owner: {
      /** An owner page: {display} is a login, {lists} and {projects} count plurals. */
      both: '{display}은(는) 여기 색인된 {lists}을(를) 관리하며, awesome list에 {projects}이(가) 실려 있어요.',
      /** The same, with no projects named. */
      lists: '{display}은(는) 여기 색인된 {lists}을(를) 관리해요.',
      /** The same, with no lists kept. */
      projects: 'awesome list에 {display}의 {projects}이(가) 실려 있어요.',
    },
  },
  /** Titles (in the browser's tab and in search results) and descriptions (under the title in search results). */
  meta: {
    /** Aim at 60 characters or fewer (30 for Chinese, Japanese, Korean). Descriptions: 70 to 160 (80). */
    home: {
      title: p({ other: '{site}: awesome list {n}개와 그 모든 것' }),
      /** {n} is the number of lists; {items} the number of projects, already formatted. */
      description: p({
        other: 'awesome list {n}개와 거기 실린 프로젝트 {items}개를 카테고리, 언어, 라이선스, 토픽별로 정리한 색인.',
      }),
    },
    lists: {
      title: p({ other: 'awesome list {n}개 전체' }),
      description: p({ other: 'awesome list {n}개의 규모, 스타, 한 줄 요약을 한곳에서 보세요.' }),
    },
    category: {
      /** {category} is a category's name, e.g. "Platforms". */
      title: p({ other: '{category}: awesome list {n}개' }),
      description: p({ other: '{category} 분야 awesome list {n}개의 규모, 스타, 요약.' }),
    },
    /** A later page of a listing: {title} is the first page's title. */
    page: '{title}, {page}쪽',
    list: {
      /** {name} is the list's name, {repo} its repository's (awesome-nodejs). */
      title: p({ other: '{name} ({repo}): 항목 {n}개의 awesome list' }),
      /** When the list has no summary of ours; {repo} is github.com/owner/repo. */
      description: '{repo}에서 관리하는 awesome list {name}.',
    },
    item: {
      /** A repository: {repo} is owner/repo. */
      repoTitle: p({ other: '{repo}: awesome list {n}개에 실림' }),
      /** Anything else: {name} is its name. */
      title: p({ other: '{name}: awesome list {n}개에 실림' }),
      /** In one list only: {list} is that list's name. */
      repoTitleOne: '{repo}: awesome list {list}에 실림',
      titleOne: '{name}: awesome list {list}에 실림',
      alongside: '함께 실린 항목: {names}.',
    },
    owner: {
      /** {display} is a GitHub login. */
      title: '{display}: 목록과 프로젝트',
    },
    items: {
      title: p({ other: 'awesome list에 실린 프로젝트 {n}개' }),
      description: p({ other: '프로젝트 {n}개를 언어, 라이선스, 토픽, 스타, 실린 목록 수로 찾아보세요.' }),
      /** One filter: {label} is what it is, e.g. "Go" or "archived" or "1,000+ stars". */
      filteredTitle: p({ other: '{label}: awesome list 속 프로젝트 {n}개' }),
      filteredDescription: p({ other: '{label}: awesome list에 실린 프로젝트 {n}개와 각각의 스타, 실린 목록.' }),
      /** A search in the items: {q} is what was searched for. */
      matching: '“{q}” 검색 결과 항목',
    },
    about: {
      title: '{site} 소개',
      description: '{site}에서 보여 주는 것, 데이터의 출처, 목록을 제외하는 방법.',
    },
  },
};
