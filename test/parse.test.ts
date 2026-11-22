import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { bullets } from '../src/parse/bullets.js';
import { headings } from '../src/parse/headings.js';
import { choose, parserNamed, parserNames, registerParser } from '../src/parse/index.js';
import { paragraphs } from '../src/parse/paragraphs.js';
import { table } from '../src/parse/table.js';

function fixture(name: string): string {
  return readFileSync(new URL(`fixtures/${name}`, import.meta.url), 'utf8');
}

const names = (text: string, parse = bullets): string[] => parse(text).items.map((i) => i.name);

describe('bullets', () => {
  it('reads the usual form, with sections from the headings and the title left out', () => {
    const result = bullets(fixture('bullets.md'));
    expect(result.items.map((i) => [i.name, i.section, i.sourceDescription])).toEqual([
      ['Quillpad', ['Editors'], 'A tiny editor for notes.'],
      ['Inkwell', ['Editors'], 'Writes plain text and nothing else.'],
      ['Slate Board', ['Editors'], 'Boards of cards.'],
      ['No Words', ['Editors'], null],
      ['Quill Spell', ['Editors', 'Plugins'], 'Checks spelling in Quillpad.'],
      ['Turtle Shell', ['Shells'], 'A slow but careful shell.'],
    ]);
  });

  it('does not make items of relative links, anchors or plain words', () => {
    expect(names(fixture('bullets.md'))).not.toContain('Local page');
    expect(names(fixture('bullets.md'))).not.toContain('An anchor');
  });

  it('counts the links it saw, leaving out badges, anchors and the contents', () => {
    expect(bullets(fixture('bullets.md')).linksSeen).toBe(6);
  });

  it('puts a plain-text parent into the section and names a linked parent', () => {
    const items = bullets(fixture('nested.md')).items;
    expect(items.map((i) => [i.name, i.section, i.parentName])).toEqual([
      ['Seedbank', ['Planning', 'Seed catalogues'], undefined],
      ['Sprout Calendar', ['Planning', 'Seed catalogues'], undefined],
      ['Plot Planner', ['Planning'], undefined],
      ['Plot Planner Web', ['Planning'], 'Plot Planner'],
      ['Plot Themes', ['Planning'], 'Plot Planner Web'],
      ['Drip Clock', ['Planning', 'Watering', 'Timers'], undefined],
      ['Trowel Notes', ['Planning'], undefined],
    ]);
    expect(items.at(-1)?.sourceDescription).toBe('Written with two colons.');
  });

  it('looks past badges, images, emoji and emphasis to the link', () => {
    const result = bullets(fixture('badges.md'));
    expect(result.items.map((i) => [i.name, i.url])).toEqual([
      ['Cloudcount', 'https://github.com/example-owner/cloudcount'],
      ['Rainmeter Lite', 'https://rain.example.com'],
      ['Drizzle', 'https://github.com/example-owner/drizzle'],
      ['Breeze', 'https://breeze.example.com'],
      ['Thunder Kit', 'https://github.com/example-owner/thunder-kit'],
      ['Fog Lamp', 'https://foglamp.example.com'],
      ['Hail Tracker', 'https://hail.example.com'],
      ['Mist', 'https://github.com/example-owner/mist'],
    ]);
    expect(result.items.every((i) => i.extraLinks.length === 0)).toBe(true);
  });

  it('keeps the other links of a bullet as extra links', () => {
    const [first, second] = bullets(fixture('several-links.md')).items;
    expect(first?.name).toBe('Pixel Barn');
    expect(first?.extraLinks).toEqual([
      { text: 'Demo', url: 'https://demo.pixelbarn.example.com' },
      { text: 'Source Code', url: 'https://github.com/example-owner/pixel-barn' },
      { text: 'Clients', url: 'https://example.com/pixel-barn/clients' },
    ]);
    expect(first?.sourceDescription).toBe('Keeps family photos at home. (Demo, Source Code, Clients) MIT Docker');
    expect(second?.extraLinks).toEqual([{ text: 'Docs', url: 'https://docs.example.com/frame-shed' }]);
  });

  it('skips contents, contributing and licence sections, and keeps related', () => {
    const result = bullets(fixture('skipped.md'));
    expect(result.items.map((i) => [i.name, i.section])).toEqual([
      ['Crane Steps', ['Folding']],
      ['Box Guide', ['Folding']],
      ['Awesome Glue', ['Related']],
    ]);
    expect(result.linksSeen).toBe(3);
  });

  it('reads the list under a contents heading of a higher level', () => {
    const result = bullets(fixture('under-contents.md'));
    expect(result.items.map((i) => [i.name, i.section])).toEqual([
      ['Rake Helper', ['Tools']],
      ['Hose Map', ['Tools', 'Hoses']],
    ]);
  });

  it('does not make items of bare addresses, but counts them', () => {
    const result = bullets(fixture('bare-urls.md'));
    expect(result.items.map((i) => [i.name, i.url])).toEqual([
      ['Kite Club', 'https://kites.example.com'],
      ['Real Item', 'https://real.example.com'],
    ]);
    expect(result.linksSeen).toBe(6);
  });

  it('finds little in a readme made of HTML, and counts its links', () => {
    const result = bullets(fixture('html-heavy.md'));
    expect(names(fixture('html-heavy.md'))).toEqual(['Wick Shop']);
    expect(result.linksSeen).toBe(7);
  });

  it('never throws on odd input', () => {
    for (const text of ['', '\u0000', '- [](', '|a|\n|-|\n|[x](http://', '# \n## \n- [a](http://)', '<<<>>>', '- '.repeat(10000)]) {
      for (const name of parserNames()) {
        expect(() => parserNamed(name)?.(text)).not.toThrow();
      }
    }
  });
});

describe('table', () => {
  it('makes an item of each row with a link, the other cells as its description', () => {
    const result = table(fixture('table.md'));
    expect(result.items.map((i) => [i.name, i.url, i.sourceDescription, i.section])).toEqual([
      ['Coinbox', 'https://coinbox.example.com', '@coinbox · $5/mo · Takes card payments in a shop.', ['Payments']],
      ['Tillroll', 'https://github.com/example-owner/tillroll', 'Free · Prints receipts.', ['Payments']],
      ['Parcel Hop', 'https://parcelhop.example.com', 'Cheap labels.', ['Shipping']],
    ]);
    expect(result.items[0]?.extraLinks).toEqual([{ text: '@coinbox', url: 'https://twitter.com/coinbox-example' }]);
  });
});

describe('headings', () => {
  it('makes an item of each heading with a link, the next paragraph as its description', () => {
    const result = headings(fixture('headings.md'));
    expect(result.items.map((i) => [i.name, i.section, i.sourceDescription])).toEqual([
      ['The Quiet Orbit', ['Novels', 'Space'], 'A crew waits a long time for a signal that never comes.'],
      ['Dust Harbour', ['Novels', 'Space'], 'A town on a moon that sells water.'],
      ['Late Again', ['Novels', 'Time'], 'A clock that runs backwards.'],
    ]);
    expect(result.items[0]?.extraLinks).toEqual([
      { text: 'A. Writer', url: 'https://en.wikipedia.org/wiki/Example_Writer' },
    ]);
  });
});

describe('paragraphs', () => {
  it('reads items on lines of their own, outside bullets', () => {
    const result = paragraphs(fixture('paragraphs.md'));
    expect(result.items.map((i) => [i.name, i.sourceDescription])).toEqual([
      ['Chalk Talks', 'Short lessons on a blackboard.'],
      ['Pencil Notes', 'Drawing for beginners.'],
      ['Brick Lib', '★ 12 Builds walls out of data.'],
      ['Slow Cooking Code', 'A long article about patience.'],
    ]);
  });
});

describe('choose', () => {
  it('keeps bullets for a list in the usual form', () => {
    expect(choose(fixture('bullets.md'))).toMatchObject({ parser: 'bullets', reason: 'default' });
  });

  it('takes another parser when it finds clearly more', () => {
    expect(choose(fixture('table.md')).parser).toBe('table');
    expect(choose(fixture('headings.md')).parser).toBe('headings');
    expect(choose(fixture('paragraphs.md')).parser).toBe('paragraphs');
  });

  it('keeps bullets, and says why, when nothing does better', () => {
    const c = choose(fixture('html-heavy.md'));
    expect(c.parser).toBe('bullets');
    expect(c.reason).toContain('1 items from 7 links');
  });

  it('uses the parser an override names', () => {
    const c = choose(fixture('bullets.md'), 'table');
    expect(c).toMatchObject({ parser: 'table', reason: 'named in the override' });
    expect(c.result.items).toEqual([]);
  });

  it('refuses a parser that does not exist, and a second one of the same name', () => {
    expect(() => choose('', 'nonesuch')).toThrow(/does not exist/);
    expect(() => {
      registerParser('bullets', bullets);
    }).toThrow(/already registered/);
  });
});
