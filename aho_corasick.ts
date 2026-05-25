// alphabet size
const k = 26;

export class Vertex {
  next: number[];    // trie edges (indexed by char)
  go: number[];      // memoized automaton transitions
  output: boolean = false;  // true if a pattern ends here
  parent: number;
  parentChar: string;
  link: number = -1; // suffix link (-1 = uncomputed)
  constructor(parent: number = -1, parentChar: string = '$') {
    this.parent = parent;
    this.parentChar = parentChar;
    this.next = new Array(k).fill(-1);
    this.go = new Array(k).fill(-1);
  }
}

// global trie
export const t: Vertex[] = [new Vertex()];

export function addString(s: string): void {
  let v = 0;
  for (const ch of s) {
    const c = ch.charCodeAt(0) - 'a'.charCodeAt(0);
    if (t[v].next[c] === -1) {
      t[v].next[c] = t.length;
      t.push(new Vertex(v, ch));
    }
    v = t[v].next[c];
  }
  t[v].output = true;
}

// lazy suffix link: longest proper suffix of v that is a live trie prefix
export function getLink(v: number): number {
  if (t[v].link === -1) {
    if (v === 0 || t[v].parent === 0) {
      t[v].link = 0;
    } else {
      t[v].link = go(getLink(t[v].parent), t[v].parentChar);
    }
  }
  return t[v].link;
}

// automaton transition: follow edge or fall back via suffix link
export function go(v: number, ch: string): number {
  const c = ch.charCodeAt(0) - 'a'.charCodeAt(0);
  if (t[v].go[c] === -1) {
    if (t[v].next[c] !== -1) {
      t[v].go[c] = t[v].next[c];
    } else {
      t[v].go[c] = v === 0 ? 0 : go(getLink(v), ch);
    }
  }
  return t[v].go[c];
}

export function build(patterns: string[]): void {
  for (const p of patterns) addString(p);
}

// returns the indices where any pattern ends
export function search(text: string): number[] {
  const hits: number[] = [];
  let v = 0;
  for (let i = 0; i < text.length; i++) {
    v = go(v, text[i]);
    for (let u = v; u !== 0; u = getLink(u)) {
      if (t[u].output) hits.push(i);
    }
  }
  return hits;
}

// resets the global trie to just the root; use between tests for isolation
export function reset(): void {
  t.length = 0;
  t.push(new Vertex());
}