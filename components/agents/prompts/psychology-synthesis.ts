/**
 * Prompt for synthesizing raw retrieval chunks into clean psychology insights.
 * Used by: lib/retrieval/vectorize.ts
 */
export function buildPsychologySynthesisPrompt(
  context: string,
  rawChunks: string[],
  maxResults: number
): string {
  return `You are a product psychology expert analyzing screenshot changes.

**Context of the changes:**
${context}

**Raw retrieval results (may contain formatting, tables, or noise):**
${rawChunks.map((chunk, i) => `[${i + 1}] ${chunk}`).join('\n\n')}

**CRITICAL CONSTRAINTS:**
1. Select principles ONLY from the raw retrieval results above - do not invent or freestyle principles
2. Classify each change as "positive" or "negative" for user experience
3. Reference specific UI changes from the context (e.g., "button color changed", "new layout added")
4. If fewer than ${maxResults} principles are truly relevant, return fewer
5. Do not reuse the same principle as both positive and negative
6. Prioritize by UX impact (most significant changes first)

**Task:**
Synthesize up to ${maxResults} insights. For each insight:
1. Extract the **exact principle name** from the retrieved documents (e.g., "Scarcity", "Social Proof", "Framing")
2. Classify as **positive** or **negative** change
3. Write **1-2 sentences** explaining why, referencing specific UI changes

Focus on insights that are:
- Frame as "what shifted" in the latest image vs previous
- Directly relevant to the UI changes described in the context
- Clear and jargon-free (Slack-style, not academic)
- Actionable for product managers
- Reinforce the "So what" and strategic overview

Ignore formatting artifacts, table syntax, or irrelevant noise in the raw results.`;
}
