import { describe, expect, it } from 'vitest';
import { canonicalUrl, githubRepoOf, kindOfHost } from '../src/canonical.js';

const id = (url: string): string | undefined => canonicalUrl(url)?.id;

describe('canonicalUrl', () => {
  it('makes one address of the ways a GitHub repository is written', () => {
    for (const url of [
      'https://github.com/Example-Owner/Some-Tool',
      'http://github.com/example-owner/some-tool/',
      'https://www.github.com/example-owner/some-tool#readme',
      'https://github.com/example-owner/some-tool.git',
      'https://GitHub.com/example-owner/some-tool?utm_source=list',
    ]) {
      expect(canonicalUrl(url)).toEqual({ id: 'https://github.com/example-owner/some-tool', kind: 'repo', host: 'github.com' });
    }
  });

  it('leaves pages inside a repository, and pages of the site, as sites', () => {
    expect(canonicalUrl('https://github.com/example-owner/some-tool/tree/main/docs')).toEqual({
      id: 'https://github.com/example-owner/some-tool/tree/main/docs',
      kind: 'site',
      host: 'github.com',
    });
    expect(canonicalUrl('https://github.com/topics/example')?.kind).toBe('site');
    expect(canonicalUrl('https://github.com/sponsors/example-owner')?.kind).toBe('site');
    expect(canonicalUrl('https://github.com/example-owner')?.kind).toBe('site');
  });

  it('lower-cases the host and drops www, a trailing slash and tracking parameters', () => {
    expect(id('https://WWW.Example.com/Path/To/Page/?utm_source=x&utm_medium=y&keep=1#Part')).toBe(
      'https://example.com/Path/To/Page?keep=1#Part',
    );
    expect(id('https://example.com/?utm_campaign=z')).toBe('https://example.com');
    expect(id('https://example.com/page#readme')).toBe('https://example.com/page');
    expect(id('http://example.com:8080/a')).toBe('http://example.com:8080/a');
  });

  it('keeps a query it did not change as it was written', () => {
    expect(id('https://example.com/search?q=a+b&x=%20')).toBe('https://example.com/search?q=a+b&x=%20');
  });

  it('refuses what is not an http address', () => {
    expect(canonicalUrl('mailto:someone@example.com')).toBeNull();
    expect(canonicalUrl('ftp://example.com/file')).toBeNull();
    expect(canonicalUrl('not a url')).toBeNull();
    expect(canonicalUrl('#section')).toBeNull();
  });

  it('tells kinds apart by host', () => {
    const kinds: [string, string][] = [
      ['https://www.npmjs.com/package/example', 'package'],
      ['https://pypi.org/project/example/', 'package'],
      ['https://crates.io/crates/example', 'package'],
      ['https://rubygems.org/gems/example', 'package'],
      ['https://cran.r-project.org/package=example', 'package'],
      ['https://metacpan.org/pod/Example', 'package'],
      ['https://pkg.go.dev/example.com/mod', 'package'],
      ['https://packagist.org/packages/example/example', 'package'],
      ['https://www.nuget.org/packages/Example', 'package'],
      ['https://hex.pm/packages/example', 'package'],
      ['https://www.youtube.com/watch?v=abc', 'video'],
      ['https://youtu.be/abc', 'video'],
      ['https://vimeo.com/123', 'video'],
      ['https://arxiv.org/abs/1234.5678', 'paper'],
      ['https://doi.org/10.1000/xyz', 'paper'],
      ['https://dl.acm.org/doi/10.1145/1', 'paper'],
      ['https://ieeexplore.ieee.org/document/1', 'paper'],
      ['https://openreview.net/forum?id=x', 'paper'],
      ['https://medium.com/@someone/post', 'article'],
      ['https://someone.medium.com/post', 'article'],
      ['https://dev.to/someone/post', 'article'],
      ['https://someone.substack.com/p/post', 'article'],
      ['https://en.wikipedia.org/wiki/Example', 'article'],
      ['https://example.com', 'site'],
      ['https://notmedium.com', 'site'],
    ];
    for (const [url, kind] of kinds) expect([url, canonicalUrl(url)?.kind]).toEqual([url, kind]);
  });

  it('matches a host by its whole name or a dot before it, never by a part of a word', () => {
    expect(kindOfHost('fakeyoutube.com')).toBe('site');
    expect(kindOfHost('m.youtube.com')).toBe('video');
  });
});

describe('githubRepoOf', () => {
  it('gives owner and repository for a repository root only', () => {
    expect(githubRepoOf('https://github.com/Example-Owner/Tool#readme')).toEqual({ owner: 'example-owner', repo: 'tool' });
    expect(githubRepoOf('https://github.com/example-owner/tool/wiki')).toBeNull();
    expect(githubRepoOf('https://example.com/a/b')).toBeNull();
  });
});
