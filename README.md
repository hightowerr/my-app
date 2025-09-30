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

**Single Comparison Flow:**
1. Upload screenshot A (before)
2. Upload screenshot B (after)
3. AI finds the differences
4. Get max 5 bullet points + "so what does this mean"
5. Save to your history with thumbs up/down feedback

**Timeline Flow:**
1. Start with a 2-screenshot comparison
2. Convert to timeline (or start fresh)
3. Add new screenshots one at a time
4. AI compares each to the previous state
5. View progression with strategic insights

Perfect for:
- Competitor tracking (monitor their pricing page evolution)
- A/B test readouts (see what changed between variants)
- Product demos (show stakeholders the journey)
- Feature rollouts (track UI changes over sprints)

## What We Built

**Single Comparisons** (P1 MVP):
- One user, no accounts needed
- Upload 2 screenshots for side-by-side comparison
- AI generates one report per pair (max 5 changes + "so what")
- Simple history with thumbnails
- Useful/not useful feedback

**Timeline Feature** (Now Live):
- Track UI evolution with multiple screenshots in sequence
- Add screenshots one-by-one to build a progression
- AI analyzes each addition vs. previous state
- Strategic view of how changes fit overall direction
- Navigate through timeline with thumbnails
- Automatic image compression (~400KB per screenshot)
- localStorage-based persistence (4MB auto-cleanup)

**Next up**: Chrome extension, batch uploads, export reports.

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
