# Screenshot Compare for PMs

Stop manually explaining product changes. Upload two screenshots, get instant AI analysis.

## The Problem We're Solving

PMs spend way too much time writing up competitor changes, A/B test results, and demo explanations. You take screenshots, then manually write bullets about what changed. It's slow, you miss stuff, and honestly pretty boring work.

This tool does that work for you. Upload before/after screenshots → get clear change analysis → spend time on strategy instead.

## Quick Start

```bash
git clone <repo-url>
cd my-app
pnpm install

# Add your OpenAI key
echo "OPENAI_API_KEY=your_key_here" > .env.local

pnpm dev
```

Open http://localhost:3000 → drag two screenshots → done.

## How It Works

Super simple flow:
1. Upload screenshot A (before)
2. Upload screenshot B (after)
3. AI finds the differences
4. Get max 5 bullet points + "so what does this mean"
5. Save to your history with thumbs up/down feedback

Perfect for:
- Competitor tracking (they changed their pricing page again...)
- A/B test readouts (variant B converted better, here's why)
- Product demos (showing stakeholders what shipped)

## What We Built (P1 MVP)

This is the thinnest possible slice that's actually useful:
- One user, no accounts needed
- Exactly 2 screenshots per comparison
- AI generates one report per pair
- Simple history (no fancy organization)
- Useful/not useful feedback

**Next up**: Timeline view, multiple screenshots per product, Chrome extension.

## Tech Details

- Next.js 15 + React 19 + TypeScript
- OpenAI GPT-4o for image analysis
- shadcn/ui components + Tailwind
- localStorage (no database complexity)
- pnpm only

```bash
pnpm dev          # Start with Turbopack
pnpm tsc --noEmit # Type check before committing
pnpm lint         # Keep it clean
```

## Success Metrics

- Under 60 seconds from upload to report
- 50%+ reports marked useful
- 5+ PMs using it regularly

We're optimizing for speed and usefulness over perfection.
