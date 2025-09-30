# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Development server**: `pnpm dev` (starts Next.js dev server with Turbopack on http://localhost:3000)
- **Build production**: `pnpm build` (creates production build with Turbopack)
- **Start production**: `pnpm start` (starts production server)
- **Type checking**: `pnpm tsc --noEmit` (run TypeScript compiler to check for type errors)
- **Lint**: `pnpm lint` (runs ESLint with Next.js config)
- **Add UI components**: `npx shadcn@latest add [component-name]` (adds pre-configured shadcn/ui components)
- **Package manager**: Uses `pnpm` (note: pnpm-lock.yaml present)

### Code Quality

**IMPORTANT**: Always run `pnpm tsc --noEmit` after writing or modifying any code to ensure there are no TypeScript errors before considering the task complete.

### Package Manager

This project strictly uses **pnpm**. Do not use npm or yarn.

## Project Architecture

This is a **Screenshot Compare App for PMs** built on Next.js 15 - a tool for comparing screenshots and generating AI-powered change reports.

- **Framework**: Next.js 15 with React 19
- **Styling**: Tailwind CSS v4 with PostCSS + shadcn/ui components
- **TypeScript**: Full TypeScript support with strict mode
- **Fonts**: Geist Sans and Geist Mono from next/font/google
- **AI Integration**: Multiple AI SDK providers configured:
  - **OpenAI** (@ai-sdk/openai) - Primary provider for screenshot comparison (GPT-4o)
  - Anthropic (@ai-sdk/anthropic)
  - Google (@ai-sdk/google)
  - xAI (@ai-sdk/xai)
  - Vercel AI SDK (ai)
- **Schema Validation**: Zod for type-safe validation
- **UI Components**: shadcn/ui component library:
  - Radix UI primitives
  - Lucide React for icons
  - Class Variance Authority (CVA) for component variants
  - clsx and tailwind-merge for conditional styling
  - tw-animate-css for animations

### Application Structure

- **Core Pages**:
  - `app/page.tsx`: Landing page with feature overview and navigation
  - `app/upload/page.tsx`: Screenshot upload interface with dual dropzones (supports both comparison and timeline modes)
  - `app/report/[id]/page.tsx`: Comparison report with side-by-side view and AI analysis
  - `app/timeline/[id]/page.tsx`: Timeline view with horizontal screenshot navigation and progression reports
  - `app/history/page.tsx`: List of past comparisons and timelines with thumbnails
- **API Routes**:
  - `app/api/compare/route.ts`: Screenshot comparison endpoint using OpenAI GPT-4o
  - `app/api/timeline/route.ts`: Timeline creation endpoint
  - `app/api/timeline/[id]/add/route.ts`: Add screenshots to existing timelines with AI continuation analysis
- **Core Libraries**:
  - `lib/types.ts`: TypeScript interfaces for ComparisonResult, TimelineComparison, TimelineScreenshot, TimelineReport
  - `lib/timeline-storage.ts`: Timeline persistence and management utilities with image compression
  - `lib/storage-utils.ts`: Image compression, localStorage quota management, and automatic cleanup
  - `components/ui/`: shadcn/ui component library (button, card, input, label)
  - `lib/utils.ts`: Utility functions for class composition
- **Configuration**:
  - `components.json`: shadcn/ui configuration
  - `tsconfig.json`: TypeScript configuration with `@/*` path mapping
  - `eslint.config.mjs`: ESLint configuration extending Next.js rules

### Development Notes

- **App Architecture**: Uses Next.js App Router (not Pages Router)
- **Routing**: File-based routing with dynamic routes (`[id]`)
- **State Management**: Client-side localStorage for comparison and timeline persistence (no database)
- **AI Processing**: OpenAI GPT-4o for screenshot analysis (≤5 changes + "so what" implication)
- **File Handling**: Drag & drop interface with image preview and base64 encoding
- **Image Storage**: Automatic compression to ~400KB per image using HTML5 Canvas API
- **Storage Management**: Automatic cleanup of old data when localStorage quota exceeded (4MB limit)
- **Timeline Feature**: Sequential screenshot comparison with continuation analysis and strategic view
- **Feedback Loop**: Useful/Not useful buttons for report quality tracking
- **TypeScript**: Strict mode with `@/*` alias pointing to project root
- **Styling**: OKLCH color space with class-based dark mode
- **Component System**: shadcn/ui with CVA for type-safe variants
- **Data Flow**: Upload → FormData → API → GPT-4o → JSON response → localStorage → display
- **Timeout Handling**: 30-second API timeouts with AbortController for user cancellation
- **No test framework currently configured**

### Environment Requirements

- **OPENAI_API_KEY**: Required for screenshot comparison functionality
- **Node.js**: Version 18+ (current setup uses v18.20.5)

### Product Context

This is a **6-week cycle** MVP for PMs to compare screenshots and get AI insights. The app focuses on:

- **Use Cases**: Competitor tracking, A/B test analysis, internal product demos, timeline progression tracking
- **Core Flows**:
  - Single comparison: Upload → Compare → Report → History
  - Timeline tracking: Upload → Compare → Create Timeline → Add Screenshots → View Progression
- **Success Metrics**: ≥50% reports marked "Useful", <60s latency, 5+ PM users
- **Constraints**: No perfect diffing, single-user only, localStorage persistence
- **Risk Mitigation**: Simple feedback loop to assess report quality

### Timeline Architecture

The Timeline feature allows users to track UI changes over time by adding multiple screenshots to a single progression:

- **Data Model**: TimelineComparison contains ordered TimelineScreenshots and TimelineReports
- **Storage Strategy**: Images compressed to ~400KB each, stored as base64 in localStorage
- **AI Analysis Types**:
  - `initial`: First comparison between two screenshots
  - `continuation`: Adding new screenshot to existing timeline (compares against previous)
  - `summary`: Future feature for trend analysis
- **Storage Management**: Automatic quota monitoring with cleanup of oldest items when approaching 4MB limit
- **Timeline Creation**: Convert any ComparisonResult into a timeline, or create new timeline from upload
- **Progression Analysis**: AI provides strategic view of how changes fit into overall timeline direction
- **Error Handling**: Comprehensive timeout management (30s API, 45s client) with user cancellation

### Styling Architecture

- **Design System**: OKLCH color space with comprehensive shadcn/ui palette
- **Theme Implementation**: Class-based dark mode with `@custom-variant dark`
- **Component Library**: shadcn/ui with Radix primitives and CVA variants
- **CSS Organization**: Tailwind CSS v4 with `@theme inline` configuration

## Critical Image Data Handling

**IMPORTANT**: The app stores and renders base64 image data. Due to legacy data, images may be stored in two formats:
- **New format**: Base64 string only (e.g., `iVBORw0KG...`)
- **Old format**: Full data URL (e.g., `data:image/jpeg;base64,iVBORw0KG...`)

### Required Pattern for Image Rendering

**ALL** image src attributes MUST use this pattern to handle both formats:

```typescript
const imageSrc = data.startsWith('data:')
  ? data  // Already has data URL prefix
  : `data:${type};base64,${data}`;  // Add prefix for base64-only

<img src={imageSrc} alt="..." />
```

**Never** directly use: `src={\`data:${type};base64,${data}\`}` - this causes double-prefix errors.

### Image Storage Pattern

When storing images via `lib/timeline-storage.ts` or `lib/storage-utils.ts`:
- `StorageUtils.compressImage()` returns full data URLs
- **Always extract base64-only** before storing: `data.split(',')[1]`
- This keeps storage efficient and prevents double-prefix issues

### Image Data Flow

1. **Upload**: FileReader → full data URL → API
2. **API**: Extracts base64 → sends to OpenAI → returns base64-only
3. **Storage**: Receives data URL → extracts base64 → stores base64-only
4. **Render**: Stored base64 → smart detection → add prefix if needed

### Files with Image Rendering

All image rendering locations already implement the smart detection pattern:
- `app/timeline/[id]/page.tsx` (thumbnails & main view)
- `app/history/page.tsx` (timeline & comparison thumbnails)
- `app/report/[id]/page.tsx` (full comparison screenshots)
- `app/upload/page.tsx` (timeline preview thumbnails)

**When adding new image rendering**: Always use the smart detection pattern above.

## Report Linking Architecture

### Timeline Report Matching

Timeline reports link to screenshots via IDs. The critical flow:

1. **API generates**: `screenshot.id` and `report.toScreenshotId`
2. **Storage receives**: Must preserve `screenshot.id` from API (not generate new one)
3. **Render queries**: `reports.find(r => r.toScreenshotId === screenshot.id)`

**IMPORTANT**: When calling `TimelineStorage.addScreenshotToTimeline()`, always pass the `id` from the API response:

```typescript
const result = await fetch('/api/timeline/${id}/add');
await TimelineStorage.addScreenshotToTimeline(timelineId, {
  id: result.screenshot.id,  // ← Must pass this!
  name: result.screenshot.name,
  data: screenshotDataUrl,
  type: result.screenshot.type,
  size: result.screenshot.size
});
```

If IDs don't match, reports will not display for screenshots.