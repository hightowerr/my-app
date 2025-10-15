/**
 * Prompt for generating high-level summaries of timeline phases.
 * Used by: lib/timeline-summary.ts
 */
export function buildTimelineSummaryPrompt(
  reports: Array<{ changes: string[]; implication: string; strategicView?: string }>,
  startIndex: number,
  endIndex: number
): string {
  const reportDetails = reports
    .map((r, idx) => {
      const stepNum = startIndex + idx + 1;
      return `Step ${stepNum}:
- Changes: ${r.changes.join(', ')}
- Implication: ${r.implication}
${r.strategicView ? `- Strategic view: ${r.strategicView}` : ''}`;
    })
    .join('\n\n');

  return `You are a product strategist analyzing the evolution of a product UI over multiple iterations.

**Timeline Phase (Steps ${startIndex + 1}-${endIndex + 1}):**
${reportDetails}

**Task:**
Synthesize these ${reports.length} iterations into a high-level summary that captures:
1. The overarching theme or goal of this phase
2. Key patterns or trends across the changes
3. The strategic direction implied by these changes

Return a JSON object with:
- "phaseTitle": A short title (3-5 words) describing this phase (e.g., "Onboarding Simplification", "Trust Signal Enhancement")
- "keyPatterns": An array of 2-3 strings describing recurring themes or patterns
- "strategicDirection": A single string (2-3 sentences) explaining the overall strategic intent
- "changes": Array of the most significant changes from all steps (up to 5 total)

Example format:
{
  "phaseTitle": "Progressive Simplification",
  "keyPatterns": [
    "Reduced form fields and input complexity",
    "Increased visual hierarchy with color",
    "Shifted focus from features to benefits"
  ],
  "strategicDirection": "This phase focused on reducing cognitive load and friction in the conversion funnel. The team systematically removed barriers while enhancing trust signals, suggesting a data-driven approach to improving completion rates.",
  "changes": [
    "Simplified checkout from 8 to 3 fields",
    "Added progress indicators",
    "Increased CTA button contrast",
    "Removed guest checkout option",
    "Added social proof badges"
  ]
}`;
}
