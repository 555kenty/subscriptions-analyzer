# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server (localhost:3000)
npm run build    # Production build
npm run lint     # Run ESLint
```

No test suite is configured.

## Architecture

**SubTrack** is a client-side-only Next.js 16 app (App Router) that analyzes bank statements to detect recurring subscriptions. All processing happens in the browser — no backend, no API routes, no server actions.

### Data flow

1. User uploads a CSV or PDF bank statement via `components/upload-zone.tsx`
2. `app/page.tsx` routes to the appropriate parser:
   - CSV → `lib/parsers/csv-parser.ts` (uses PapaParse; expects semicolon-delimited French bank format with columns `Date`, `Libellé`, `Montant`)
   - PDF → `lib/parsers/pdf-parser.ts` (uses `pdf-lib` to load, then custom byte-level text extraction; image-based PDFs are not supported)
3. Both parsers return `{ transactions: Transaction[], errors: string[] }`
4. `lib/detectors/subscription-detector.ts` matches transactions against `SUBSCRIPTION_PATTERNS` (keyword lists per vendor), groups by vendor, detects frequency (monthly: 25–35 day avg interval, yearly: 330–395 days), and computes `SubscriptionStats`
5. Results render via `components/stats-cards.tsx` and `components/subscription-card.tsx`

### Key design decisions

- **Keyword matching only**: Detection is purely pattern-based (`SUBSCRIPTION_PATTERNS` in `subscription-detector.ts`). There is no fuzzy matching or ML. To add a new service, add an entry to that array and a matching entry in `lib/cancellation-links.ts`.
- **French locale throughout**: CSV column names are in French (`Libellé`, `Montant`), amounts use comma as decimal separator, dates default to DD/MM/YYYY. All UI text is in French.
- **All client-side**: `pdf-parser.ts` exports `parsePDF` and `parsePDFWithOCR` stubs that throw — they are obsolete leftovers from a server-side approach. Only `parsePDFStatement(file: File)` should be called.
- **Path alias**: `@/` maps to the project root (configured in `tsconfig.json`).

### Types (`types/index.ts`)

- `Transaction` — raw parsed row (date, label, amount, raw strings)
- `Subscription` — grouped/detected subscription with frequency, category, cancellation link
- `SubscriptionStats` — aggregated totals and per-category breakdown
- `CsvRow` — typed PapaParse row shape matching the expected CSV headers
