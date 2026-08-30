# reddit-dash

Aho-Corasick multi-pattern string matching in TypeScript, written as the keyword-filter stage of a Reddit lead-monitoring pipeline on Cloudflare Workers.

The matcher and its tests work.
The pipeline around it is a design, not a running system, so read [Status](#status) before assuming anything else here is built.

## What works today

`aho_corasick.ts` builds one trie from a keyword list and scans text in a single pass, finding every occurrence regardless of how many keywords there are.

```ts
import { build, search } from './aho_corasick';

build(['he', 'she', 'his', 'hers']);
search('ushers');
```

The exported surface is `build`, `search`, `go`, `getLink`, `addString` and `reset`, plus the `Vertex` node type.
Suffix links are computed lazily by `getLink` and cached, and `go` memoises transitions, so repeated scans reuse earlier work.

Two limits worth knowing before reusing it:

- The trie is module-level state, so `build` replaces whatever was there. Call `reset` between keyword sets.
- Transitions are hardcoded to the 26 lowercase ASCII letters, so digits, punctuation and Unicode are not handled. Text has to be lowercased and stripped first.

## Tests

```bash
npm install
npx vitest run
```

14 tests cover overlapping matches at one position, repeated matches, absent patterns, empty input, root and non-root transitions, transition caching, and suffix links at depth 0 and 1.

`worker/` has its own Vitest config and needs the Cloudflare Workers pool, so it is excluded from the root run and tested from inside that directory.

## Why Aho-Corasick

Checking N keywords against each post one at a time costs O(N x M) per post.
At 1000 keywords and 1.7M posts a day that is on the order of a billion operations.
Aho-Corasick builds the trie once and scans each post in one pass proportional to post length, independent of keyword count.

That matters because the design puts this matcher in front of an LLM.
Keyword matching is cheap and inference is not, so the filter is what would keep the expensive stage running on a small fraction of posts rather than all of them.

## Status

Built and tested:

- the Aho-Corasick matcher, `aho_corasick.ts`
- its test suite, `aho_corasick.test.ts`
- architecture and data-flow diagrams, `diagrams.md` and the two SVGs

Not built. `worker/src/index.ts` is still the generated Cloudflare template returning `Hello World!`:

- Reddit ingestion and OAuth
- post deduplication
- LLM scoring of matched posts
- D1 storage and the query API
- the React dashboard
- deployment and CI

The intended stack is Cloudflare Workers with D1 for storage and a React frontend, and `package.json` already carries `hono` and `snoowrap` for the routing and Reddit stages.
None of it is wired up yet.

## Layout

```
aho_corasick.ts        matcher
aho_corasick.test.ts   its tests
diagrams.md            architecture and data flow notes
worker/                Cloudflare Workers scaffold, unmodified template
```
