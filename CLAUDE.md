# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Development server**: `pnpm dev` (starts Next.js dev server with Turbopack on http://localhost:3000)
- **Build production**: `pnpm build` (creates production build with Turbopack)
- **Start production**: `pnpm start` (starts production server)
- **Type checking**: `pnpm tsc --noEmit` (run TypeScript compiler to check for type errors)
- **Lint**: `pnpm lint` (runs ESLint with Next.js config)
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
  - `app/upload/page.tsx`: Screenshot upload interface with dual dropzones
  - `app/report/[id]/page.tsx`: Comparison report with side-by-side view and AI analysis
  - `app/history/page.tsx`: List of past comparisons with thumbnails
- **API Routes**:
  - `app/api/compare/route.ts`: Screenshot comparison endpoint using OpenAI GPT-4o
- **Components**:
  - `components/ui/`: shadcn/ui component library (button, card, input, label)
  - `lib/utils.ts`: Utility functions for class composition
- **Configuration**:
  - `components.json`: shadcn/ui configuration
  - `tsconfig.json`: TypeScript configuration with `@/*` path mapping
  - `eslint.config.mjs`: ESLint configuration extending Next.js rules

### Development Notes

- **App Architecture**: Uses Next.js App Router (not Pages Router)
- **Routing**: File-based routing with dynamic routes (`[id]`)
- **State Management**: Client-side localStorage for comparison persistence (no database)
- **AI Processing**: OpenAI GPT-4o for screenshot analysis (≤5 changes + "so what" implication)
- **File Handling**: Drag & drop interface with image preview and base64 encoding
- **Feedback Loop**: Useful/Not useful buttons for report quality tracking
- **TypeScript**: Strict mode with `@/*` alias pointing to project root
- **Styling**: OKLCH color space with class-based dark mode
- **Component System**: shadcn/ui with CVA for type-safe variants
- **No test framework currently configured**

### Environment Requirements

- **OPENAI_API_KEY**: Required for screenshot comparison functionality
- **Node.js**: Version 18+ (current setup uses v18.20.5)

### Product Context

This is a **6-week cycle** MVP for PMs to compare screenshots and get AI insights. The app focuses on:

- **Use Cases**: Competitor tracking, A/B test analysis, internal product demos
- **Core Flow**: Upload → Compare → Report → History
- **Success Metrics**: ≥50% reports marked "Useful", <60s latency, 5+ PM users
- **Constraints**: No perfect diffing, single-user only, localStorage persistence
- **Risk Mitigation**: Simple feedback loop to assess report quality

### Styling Architecture

- **Design System**: OKLCH color space with comprehensive shadcn/ui palette
- **Theme Implementation**: Class-based dark mode with `@custom-variant dark`
- **Component Library**: shadcn/ui with Radix primitives and CVA variants
- **CSS Organization**: Tailwind CSS v4 with `@theme inline` configuration