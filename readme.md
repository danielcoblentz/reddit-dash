Tech stack
Runtime
Cloudflare WorkersTypeScript
Serverless edge — no cold starts, auto-scales, near-zero cost at idle
Ingestion
Reddit OAuth APIPushshift
OAuth for live stream, Pushshift for historical backfill
Keyword filter
Aho-Corasick
Multi-pattern trie — O(n) scan regardless of keyword count. Built once, reused every run
Semantic scoring
Llama 3
Scores intent, budget signals, urgency on posts that pass keyword gate only
Storage
Cloudflare D1
SQLite at the edge — co-located with Workers for sub-ms reads
Frontend
ReactAWS Amplify
SPA hosted on Amplify, queries Workers REST API for lead data
Functional requirements
• Ingest posts and comments from targeted subreddits on a scheduled interval
• Deduplicate posts by hashed post ID before any processing
• Scan post text using Aho-Corasick against a configurable keyword list
• Route keyword-matched posts to Llama 3 for lead quality scoring (0–10)
• Persist scored leads to D1 with metadata (subreddit, timestamp, score, post URL)
• Expose REST API to query leads by score threshold, date range, subreddit
• Dashboard displays top leads, score distribution, and volume over time
• Keyword list is hot-reloadable without redeploying the Worker
Non-functional requirements
• End-to-end latency under 8 seconds from post creation to dashboard visibility
• Lead qualification under 3 seconds per matched post
• System handles 10M+ posts/day without provisioning changes
• LLM called on at most 1–5% of total posts to control inference cost
• D1 queries return under 50ms for dashboard reads (edge co-location)
• Zero-downtime deploys via Cloudflare Workers versioned rollouts
• Unit tested with Vitest — 80%+ coverage on filter and scoring modules
• Deduplication runs in O(1) per post using hashed ID lookup


ile structure
digreddit/
├── worker/ # Cloudflare Workers backend
│ ├── src/
│ │ ├── index.ts # Worker entry — routes, cron trigger
│ │ ├── ingestion/
│ │ │ ├── reddit.ts # Reddit OAuth + PRAW fetch logic
│ │ │ └── dedup.ts # Post ID hashing + seen-set check
│ │ ├── filter/
│ │ │ ├── aho-corasick.ts # Trie build + O(n) scan
│ │ │ └── keywords.ts # Keyword list loader (hot-reload)
│ │ ├── scoring/
│ │ │ └── llama.ts # Llama 3 API call + score parse
│ │ ├── storage/
│ │ │ └── d1.ts # D1 read/write — leads schema
│ │ └── api/
│ │ └── routes.ts # REST endpoints — /leads /stats
│ ├── test/
│ │ ├── aho-corasick.test.ts # Unit tests — trie correctness
│ │ └── scoring.test.ts # Unit tests — score parsing
│ ├── wrangler.toml # Cloudflare config — cron, D1 binding
│ └── package.json
│
├── frontend/ # React dashboard
│ ├── src/
│ │ ├── App.tsx
│ │ ├── components/
│ │ │ ├── LeadTable.tsx # Paginated lead list
│ │ │ ├── ScoreChart.tsx # Score distribution chart
│ │ │ └── VolumeChart.tsx # Post volume over time
│ │ └── hooks/
│ │ └── useLeads.ts # API fetch + state management
│ └── package.json
│
├── migrations/ # D1 SQL schema migrations
│ └── 001_init.sql # leads table, indexes
│
└── README.md


Key design decisions
Why Aho-Corasick over naive search
Naive approach loops through N keywords per post: O(N × M) per post. At 1000 keywords and 1.7M posts that is 1.7 billion operations daily. Aho-Corasick builds a trie once and scans each post in O(post_length) — one pass regardless of keyword count. The 3-second qualification time is a direct result of this choice.
Why Cloudflare Workers over a traditional server
Workers run at the edge globally with no cold starts. For a real-time monitor processing thousands of posts per minute, serverless edge avoids provisioning overhead and costs near zero at idle while scaling automatically at spikes. D1 co-location at the edge keeps storage reads under 50ms.
Why LLM only after keyword filter
LLM inference is expensive and slow. Running Llama 3 on every post would be cost-prohibitive at 1.7M posts/day. Aho-Corasick acts as a cheap gate — only the 1–5% of posts with relevant keywords hit the LLM. This is the classic two-stage filtering pattern used in production ML pipelines.
Why D1 over Postgres or KV
D1 is SQLite running at the same edge node as the Worker — no network hop for reads. Postgres would require a separate hosted database with cross-region latency. KV lacks ta



tech


D1 - databse SQLlite (cloudflare)
typescript + react
hono API routing

hosted on amplify



TODO:
- get reddit API wokring
- setup cloudflare srevice
- deploy on AWS
- contianerize and make CI/CD pipeline