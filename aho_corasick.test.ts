import { beforeAll, describe, it, expect } from 'vitest';
import { build, search, go, getLink } from './aho_corasick';

// global trie `t` is built once — patterns are fixed for the whole file
const PATTERNS = ['he', 'she', 'his', 'hers'];

beforeAll(() => {
  build(PATTERNS);
});

describe('search — basic matches', () => {
  it('finds overlapping patterns at the same position', () => {
    // she@3, he@3 via suffix link, hers@5
    expect(search('ushers')).toEqual([3, 3, 5]);
  });

  it('finds a standalone single pattern', () => {
    expect(search('he')).toEqual([1]);
  });

  it('finds "his" on its own', () => {
    expect(search('his')).toEqual([2]);
  });

  it('returns no matches when none are present', () => {
    expect(search('xyzzy')).toEqual([]);
  });

  it('handles the empty text', () => {
    expect(search('')).toEqual([]);
  });
});

describe('search — multiple and repeated matches', () => {
  it('finds the same pattern at multiple positions', () => {
    // "hehe": "he" ends at index 1 and index 3
    expect(search('hehe')).toEqual([1, 3]);
  });

  it('reports both "he" and "she" when "she" appears', () => {
    // "she": "she" ends at 2, "he" (its suffix) also ends at 2
    expect(search('she')).toEqual([2, 2]);
  });

  it('finds matches embedded in surrounding text', () => {
    // "he" spans i=1..2
    expect(search('ahead')).toEqual([2]);
  });
});

describe('go — transitions', () => {
  it('follows a real edge off the root', () => {
    expect(go(0, 'h')).not.toBe(0);
  });

  it('stays at the root for an unmatched character', () => {
    expect(go(0, 'z')).toBe(0);
  });

  it('is idempotent — the cached transition is stable', () => {
    // verifies the go[] memoization returns the same node index
    const first = go(0, 's');
    expect(go(0, 's')).toBe(first);
  });
});

describe('getLink — suffix links', () => {
  it('links the root to itself', () => {
    expect(getLink(0)).toBe(0);
  });

  it('links a depth-1 node back to the root', () => {
    const h = go(0, 'h');
    expect(getLink(h)).toBe(0);
  });

  it('links "she" to "he" (longest proper suffix that is a live prefix)', () => {
    const she = go(go(go(0, 's'), 'h'), 'e');
    const he = go(go(0, 'h'), 'e');
    expect(getLink(she)).toBe(he);
  });
});