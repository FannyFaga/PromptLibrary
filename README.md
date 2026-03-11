# Prompt Library

> An open-source community library of AI prompts — browse, search, and copy prompts across dozens of domains. Anyone can contribute.

## What it does

A shared, open-source collection of AI prompts that anyone can use and contribute to:

- **Browse prompts** across categories like Writing, Coding, Marketing, Education, and more
- **Fill-in placeholders** — prompts with `[variables]` open a form. Fill in each value, see a live preview, then copy the assembled prompt in one click
- **Search** across title, tags, and content simultaneously — with per-field match breakdown
- **Filter** by category, toggle favorites-only, sort by newest / A–Z / most used
- **Track usage** — "Total Copies" stat and "Most Used" sort show which prompts the community uses most
- **Submit prompts** — contribute your own prompts to the shared library
- **Import / Export** prompts as JSON
- **Favorites** saved locally in your browser — personal and private
- **Immutable prompts** — once submitted, prompts cannot be edited or deleted, ensuring a reliable library

## Screenshot

![Prompt Library homepage showing the stats bar, search, category filters, and a grid of prompt cards](screenshot.png)

## Tech stack

| | |
|---|---|
| UI | React 18 + Tailwind CSS v3 |
| Routing | React Router v6 |
| Backend | Supabase (Postgres + RLS) |
| State | React Context + `useLocalStorage` for favorites |
| Toasts | react-hot-toast |
| Build | Vite 5 |
| Tests | Vitest |
| Deploy | Vercel |

## Getting started

### 1. Set up Supabase

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the contents of [`supabase/schema.sql`](supabase/schema.sql)
3. Go to **Settings → API** and copy your **Project URL** and **anon public key**

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env and fill in your Supabase URL + anon key
```

### 3. Run locally

```bash
npm install
npm run dev
```

### 4. Run tests

```bash
npm test
```

## Architecture

### Supabase + Row Level Security
All prompts live in a shared Postgres database. RLS policies enforce:
- **SELECT** — public (anyone can read)
- **INSERT** — public (anyone can submit)
- **UPDATE / DELETE** — denied (prompts are immutable)
- `copy_count` is incremented via a `security definer` RPC function, bypassing the no-update policy safely

### Favorites = localStorage
Favorites are personal — they're just a list of prompt IDs stored in `localStorage`. No auth required, and they stay private to each browser.

### Portals for modals
`ConfirmModal`, `PromptDetailModal`, and `FillPromptModal` all portal to `<body>`. `PromptCard` has `hover:-translate-y-0.5` which creates a new CSS stacking context — portaling sidesteps clipping issues.

### `FillPromptModal` — the core UX
Prompts with `[placeholder]` syntax open a fill-in form instead of copying directly. Tokens are extracted by `extractTokens()` (pure function, deduplicated). The live preview highlights filled tokens in indigo and unfilled ones in amber.

### Copy tracking
Every successful clipboard write calls `recordCopy(id)` which increments `copy_count` in Supabase via RPC. This powers the "Most Used" sort and the "Total Copies" stat.
