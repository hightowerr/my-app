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
  - **Vectorize** (@vectorize-io/vectorize-client) - RAG for product psychology insights
  - Anthropic (@ai-sdk/anthropic)
  - Google (@ai-sdk/google)
  - xAI (@ai-sdk/xai)
  - Vercel AI SDK (ai)
- **Schema Validation**: Zod for type-safe validation
- **RAG Integration**: Vectorize retrieval for product psychology principles
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
  - `lib/retrieval/vectorize.ts`: Vectorize RAG integration for product psychology insights
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

- **OPENAI_API_KEY**: Required for screenshot comparison functionality (GPT-4o vision)
- **VECTORIZE_ACCESS_TOKEN**: Required for product psychology insights retrieval
- **VECTORIZE_ENDPOINT**: Full Vectorize retrieval endpoint URL (includes org/pipeline path)
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

1. **API generates**: Complete report structure with `screenshot.id`, `report.fromScreenshotId`, and `report.toScreenshotId`
2. **Storage receives**: Must preserve `screenshot.id` from API (not generate new one)
3. **Client must pass**: `previousScreenshotId` in API request payload
4. **Render queries**: `reports.find(r => r.toScreenshotId === screenshot.id)`

**IMPORTANT**: The API route `/api/timeline/[id]/add` now requires `previousScreenshotId` in the request body and returns a complete report structure:

```typescript
// Client sends (app/upload/page.tsx):
const payload = {
  imageName: files.a.name,
  imageType: files.a.type,
  imageData: imageDataUrl,
  previousImageData: previousImageDataUrl,
  previousScreenshotId: lastScreenshot.id,  // ← Required!
  previousContext: context
};

// API returns (app/api/timeline/[id]/add/route.ts):
const result = {
  screenshot: { id, name, type, data },
  report: {
    id: reportId,
    type: 'continuation',
    fromScreenshotId: previousScreenshotId,  // ← From request
    toScreenshotId: screenshotId,            // ← New screenshot
    changes: comparison.changes,
    implication: comparison.implication,
    strategicView: comparison.strategicView,
    timestamp: new Date().toISOString()
  }
};

// Client saves:
await TimelineStorage.addScreenshotToTimeline(timelineId, {
  id: result.screenshot.id,  // ← Preserve from API!
  name: result.screenshot.name,
  data: screenshotDataUrl,
  type: result.screenshot.type,
  size: result.screenshot.size
});
updatedTimeline.reports.push(result.report);  // ← Complete report from API
```

If IDs don't match, reports will not display for screenshots.

## Development Logging

### Log Level Semantics

**IMPORTANT**: Use appropriate console methods for different log types:
- `console.log()` - Informational/timing/debug messages
- `console.error()` - Actual errors and exceptions only

This prevents false positives in error monitoring systems (Sentry, etc.).

**Example from API routes**:
```typescript
console.log('[TIMING] Request started');  // ✅ Info
console.log('[VALIDATION] Body size: 2MB');  // ✅ Info
console.error('Image too large:', size);  // ✅ Actual error
```

### Conditional Logging (Client-Side)

Client-side code uses conditional logging to reduce console noise in production:

```typescript
// Development flag for conditional logging
const isDev = process.env.NODE_ENV === 'development';

// Use throughout the file
if (isDev) {
  console.log('[DEBUG] Message here');
}
```

This pattern is implemented in:
- `app/upload/page.tsx` (all console.log statements wrapped)

**When adding new client-side logging**: Always wrap console statements with `isDev` check.

**API routes**: Use `console.log` directly (Next.js server logs aren't sent to browser).

## Security & Code Quality Patterns

### ID Generation

**CRITICAL**: Always use cryptographically secure ID generation:

```typescript
// Server-side (API routes):
import crypto from 'crypto';
const id = crypto.randomUUID();  // ✅ Node.js crypto module

// Client-side (React components, lib files):
const id = globalThis.crypto.randomUUID();  // ✅ Web Crypto API

// ❌ Wrong - predictable, vulnerable to attacks
const id = Math.random().toString(36).substring(2, 15);
```

**Rationale**: `Math.random()` is not cryptographically secure and can lead to:
- ID collisions at scale
- Predictable IDs that can be enumerated by attackers
- Security vulnerabilities in timeline/report linking

**Environment-specific usage:**
- **Server-side**: Use `import crypto from 'crypto'` in API routes (Node.js)
- **Client-side**: Use `globalThis.crypto.randomUUID()` in browser code (Web Crypto API)
- `lib/timeline-storage.ts` uses `globalThis.crypto` since it runs client-side

### parseInt() Best Practices

**ALWAYS** specify radix when using `parseInt()`:

```typescript
// ✅ Correct - explicit decimal parsing
const size = parseInt(contentLength, 10);

// ❌ Wrong - can interpret as octal/hex
const size = parseInt(contentLength);
```

**Validate before parsing**:
```typescript
// ✅ Validate numeric string before parsing
const isValid = contentLength && /^\d+$/.test(contentLength);
const size = isValid ? parseInt(contentLength, 10) : 0;

// ❌ Wrong - NaN from invalid input like "abc", "12px"
const size = parseInt(contentLength, 10);
```

### Input Validation (API Routes)

**ALWAYS** validate input format before string operations:

```typescript
// ✅ Correct - validate data URL format before split
const dataUrlPattern = /^data:[\w/+.-]+;base64,/;
if (dataUrlPattern.test(imageData)) {
  const base64 = imageData.split(',')[1];
} else if (imageData.includes(',')) {
  return NextResponse.json({ error: 'Invalid format' }, { status: 400 });
} else {
  // Handle raw base64
  const base64 = imageData;
}

// ❌ Wrong - blind split can fail or produce unexpected results
const base64 = imageData.split(',')[1];
```

**Validation checklist for API inputs**:
1. Type check (`typeof x === 'string'`)
2. Null/empty check (`!x`)
3. Format validation (regex pattern)
4. Return 400 errors with clear messages for invalid input

**Files with comprehensive validation**:
- `app/api/timeline/[id]/add/route.ts` (Content-Length, imageData format)
- `app/api/compare/route.ts` (form data validation)

## Vectorize RAG Integration

### Architecture

Product psychology insights are retrieved via **Vectorize RAG** and displayed alongside GPT-4o analysis in both comparison and timeline reports.

- **Integration pattern**: Library function called directly by API routes (not separate API endpoint)
- **Location**: `lib/retrieval/vectorize.ts`, `lib/retrieval/formatPsychInsights.ts`
- **Called by**: `app/api/compare/route.ts` and `app/api/timeline/[id]/add/route.ts`
- **Graceful failure**: Insights are optional; API succeeds even if Vectorize fails
- **Output format**: Structured `FormattedInsight[]` objects (principle, outcome, rationale)
- **AI synthesis**: GPT-4o-mini synthesizes raw retrieval chunks into contextualized insights with outcome classification
- **Validation**: Principles are validated against retrieved documents to prevent AI hallucination

### Implementation Details

```typescript
// lib/retrieval/vectorize.ts
export async function getProductPsychologyInsights(
  context: string,
  maxResults: number = 3
): Promise<FormattedInsight[]>

// lib/types.ts
export interface FormattedInsight {
  principle: string;      // Plain text, no markdown
  outcome: 'positive' | 'negative';
  rationale: string;      // Plain text, no markdown
}
```

**Key points:**
- Uses direct `fetch()` to Vectorize endpoint (not SDK client)
- `VECTORIZE_ENDPOINT` is a **full URL** including org/pipeline/retrieval path
- Returns empty array on failure (doesn't throw)
- **30-second timeout** on Vectorize API calls with AbortController
- **maxResults capped** at `MAX_INSIGHTS` (3) to match Zod schema constraint
- **Type-safe document parsing**: `VectorizeDocument` interface with defensive field access
- **Three-step process:**
  1. Vectorize RAG retrieves raw chunks (may contain table formatting, markdown, noise)
  2. GPT-4o-mini synthesizes chunks into structured insights with Zod schema enforcement
  3. Validation filters insights where principle name doesn't appear in retrieved chunks
- **AI synthesis constraints:**
  - Must select principles ONLY from retrieved documents (no freestyling)
  - Must classify each as positive/negative for UX
  - Must reference specific UI changes from context
  - Return fewer than maxResults if less are truly relevant
  - Prioritize by UX impact
- **Formatting:** `stripMarkdown()` removes all markdown syntax before returning to UI
- **Fallback:** If AI synthesis fails, returns empty array (fail gracefully)
- **Privacy:** Context logging removed to prevent PII leakage in production logs

### API Integration Flow

1. **GPT-4o vision analysis** completes (changes + implication)
2. **Vectorize RAG retrieval** called with analysis context (wrapped in try-catch)
3. **Combined response** returned to client with `psychologyInsights` field (or empty array on failure)

**Error Handling Pattern:**
```typescript
// Both API routes use isolated error handling for insights
let psychologyInsights: Awaited<ReturnType<typeof getProductPsychologyInsights>> = [];
try {
  psychologyInsights = await getProductPsychologyInsights(context);
  console.log('[INSIGHTS] Successfully retrieved', psychologyInsights.length, 'insights');
} catch (insightError) {
  console.error('[INSIGHTS] Failed to retrieve psychology insights:', insightError);
  psychologyInsights = []; // Safe default - request continues without insights
}
```

**Why isolated error handling?**
- Psychology insights are **optional enhancement** - not core functionality
- Vectorize API failures should not block screenshot comparison
- Users still get valuable analysis (changes + "so what") even without insights
- Errors are logged for monitoring but don't propagate to user

### Type-Safe Document Parsing

**VectorizeDocument interface** (`lib/retrieval/vectorize.ts:19-24`):
```typescript
interface VectorizeDocument {
  text?: string;
  content?: string;
  [key: string]: unknown; // Allow other fields from Vectorize API
}
```

**Safe parsing logic** (lines 106-124):
```typescript
const rawChunks = data.documents.map((doc: string | VectorizeDocument): string => {
  // 1. Handle string documents
  if (typeof doc === 'string') {
    return doc;
  }

  // 2. Handle object documents with defensive checks
  if (typeof doc === 'object' && doc !== null) {
    // Check text field exists and is non-empty string
    if (typeof doc.text === 'string' && doc.text.length > 0) {
      return doc.text;
    }
    // Check content field exists and is non-empty string
    if (typeof doc.content === 'string' && doc.content.length > 0) {
      return doc.content;
    }
  }

  // 3. Fallback: stringify entire document
  return JSON.stringify(doc);
});
```

**Why this matters:**
- **No `any` types**: Explicit `string | VectorizeDocument` prevents unsafe property access
- **Defensive checks**: Validates field types before accessing (prevents runtime errors)
- **API changes resilient**: If Vectorize API response shape changes, code won't crash
- **Non-empty validation**: Checks `length > 0` to avoid empty strings
- **Safe fallback**: `JSON.stringify()` ensures we always get a string

**Example context passed to Vectorize:**
```typescript
// For comparison:
const context = `Screenshot comparison changes: ${changes.join('; ')}. Implication: ${implication}`;

// For timeline continuation:
const context = `Timeline continuation. Previous context: ${previousContext}. New changes: ${changes.join('; ')}. Implication: ${implication}. Strategic view: ${strategicView}`;
```

### Type Definitions

Both `ComparisonResult.comparison` and `TimelineReport` include:
```typescript
psychologyInsights?: FormattedInsight[];  // Optional field, 1-3 structured insights
```

### Markdown Stripping & Formatting

**CRITICAL**: Product psychology insights MUST NOT contain markdown in the data.

The `lib/retrieval/formatPsychInsights.ts` helper provides:
- `stripMarkdown()` - Robust markdown removal with iterative processing
- `formatInsight()` - Applies markdown stripping to insight objects
- `validatePrincipleInChunks()` - Ensures principle exists in retrieved docs (prevents hallucination)
- `filterValidatedInsights()` - Removes insights with invalid principles

**stripMarkdown() algorithm:**
1. **Unescape escaped sequences**: `\*` → `*`, `\_` → `_`, `\`` → `` ` `` (handles escaped markdown)
2. **Iterative stripping**: Apply regex replacements repeatedly until no changes occur (handles nested markdown like `***nested***`)
3. **Comprehensive removal**: Strips bold, italic, code, links, images, headings, lists, blockquotes, HTML tags
4. **Max 10 iterations**: Prevents infinite loops on malformed markdown

**Why no markdown?**
- UI applies Tailwind styling (`font-semibold`) for emphasis
- Prevents rendering artifacts and odd formatting
- Keeps insights clean and consistent across light/dark modes

**Testing**: See `lib/retrieval/formatPsychInsights.test-examples.ts` for edge case coverage

### UI Rendering

Psychology insights appear in blue callout cards with 💡 emoji and outcome badges:
- `app/report/[id]/page.tsx` - Comparison reports
- `app/timeline/[id]/page.tsx` - Timeline reports

**Output format:**
- **No markdown** in data (all stripped by `formatInsight()`)
- **Tailwind styling** for emphasis: `font-semibold` for principle names
- **Outcome badges**: Green for positive, red for negative
- Each insight frames "what shifted" in the latest image vs previous
- Rationale references specific UI changes and reinforces "So what"

**Pattern:**
```typescript
{result.comparison.psychologyInsights && result.comparison.psychologyInsights.length > 0 && (
  <div className="border-t pt-4">
    <h3 className="font-semibold mb-3">Product Psychology Insights</h3>
    <div className="space-y-3">
      {result.comparison.psychologyInsights.map((insight, index) => (
        <div key={index} className="flex items-start gap-3 bg-blue-50 dark:bg-blue-950/30 p-3 rounded-lg">
          <span className="text-blue-600 dark:text-blue-400 font-semibold flex-shrink-0 text-lg">💡</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-sm text-blue-900 dark:text-blue-100">
                {insight.principle}
              </span>
              <span className={cn(
                "px-2 py-0.5 text-xs font-medium rounded-full",
                insight.outcome === 'positive'
                  ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                  : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
              )}>
                {insight.outcome === 'positive' ? 'Positive' : 'Negative'}
              </span>
            </div>
            <p className="text-sm text-blue-900/80 dark:text-blue-100/80">
              {insight.rationale}
            </p>
          </div>
        </div>
      ))}
    </div>
  </div>
)}
```

### Why Not a Separate API Route?

Vectorize is integrated as a library function (not `/api/insights/route.ts`) because:
- **Tightly coupled** to comparison flow (enhances GPT-4o results)
- **Atomic operation** - single API call for better UX
- **Matches pattern** - GPT-4o analysis is also inline
- **Performance** - no extra HTTP roundtrip
- **Graceful failure** - insights optional, doesn't block comparison

## localStorage Management

### Safe Storage Pattern

**CRITICAL**: Always use `StorageUtils.safeSetItem()` instead of direct `localStorage.setItem()`.

```typescript
import { StorageUtils } from "@/lib/storage-utils";

// ✅ Correct - automatic quota management
try {
  StorageUtils.safeSetItem(`comparison-${id}`, JSON.stringify(data));
} catch (error) {
  if (error instanceof Error && error.message === 'STORAGE_QUOTA_EXCEEDED') {
    alert('Storage full! Please delete old items from History page.');
  }
}

// ❌ Wrong - throws QuotaExceededError when full
localStorage.setItem(`comparison-${id}`, JSON.stringify(data));
```

### Storage Utilities

**`StorageUtils` class** (`lib/storage-utils.ts`) provides:

1. **`compressImage(imageData, maxSizeKB)`** - Compress images to ~400KB
   - Resizes to max 800px dimension
   - Adjusts JPEG quality to hit target size
   - Returns full data URL format

2. **`safeSetItem(key, value)`** - Safe localStorage with auto-cleanup
   - Checks quota before saving
   - Auto-deletes oldest items if needed (by timestamp)
   - Throws `STORAGE_QUOTA_EXCEEDED` if cleanup fails

3. **`getStorageSummary()`** - Debug storage usage
   - Total usage in KB
   - Percent used
   - Item count

### Storage Limits

- **Quota**: 4MB conservative limit (browser typically allows 5-10MB)
- **Auto-cleanup**: Deletes oldest comparisons/timelines when quota exceeded
- **Per-image target**: ~400KB compressed (JPEG, max 800px)

### Files Using Safe Storage

- ✅ `app/upload/page.tsx` - Uses `safeSetItem()` for comparisons
- ✅ `app/report/[id]/page.tsx` - Uses `safeSetItem()` for feedback updates
- ✅ `lib/timeline-storage.ts` - Uses `safeSetItem()` internally for timelines

**When adding new localStorage usage**: Always import and use `StorageUtils.safeSetItem()`.

## Common Pitfalls & Solutions

### Error: "crypto.randomUUID is not a function" in Browser

**Problem**: Importing `crypto` from Node.js and calling `crypto.randomUUID()` in client-side code.

**Solution**: Use `globalThis.crypto.randomUUID()` instead:
```typescript
// ❌ Wrong - causes error in browser
import crypto from 'crypto';
const id = crypto.randomUUID();

// ✅ Correct - works in both browser and Node.js
const id = globalThis.crypto.randomUUID();
```

**Files that must use `globalThis.crypto`**:
- `lib/timeline-storage.ts` (runs client-side)
- Any React component that generates IDs
- Any utility file imported by client components

**Files that use Node.js `crypto`**:
- API routes (`app/api/**/*.ts`)
- Server-only utilities