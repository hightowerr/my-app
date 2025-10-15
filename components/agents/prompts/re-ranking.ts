/**
 * Prompt for re-ranking retrieved chunks by relevance to screenshot changes.
 * Used by: lib/retrieval/vectorize.ts
 */
export function buildReRankingPrompt(context: string, chunks: string[], topK: number): string {
  return `You are a relevance scoring expert for product psychology insights.

**Screenshot analysis context:**
${context}

**Retrieved psychology principles (from semantic search):**
Below are ${chunks.length} documents, indexed from 0 to ${chunks.length - 1}.
${chunks.map((chunk, i) => `[${i}] ${chunk}`).join('\n\n')}

**Task:**
Score each principle by relevance to the UI changes described in the context.

**Scoring criteria:**
- **High relevance (3):** Principle directly explains WHY this UI change matters for users
- **Medium relevance (2):** Principle is somewhat related but not core to the changes
- **Low relevance (1):** Principle is tangentially related or not applicable

**Important:**
- Focus on principles that help explain the "so what" of the changes
- Prioritize principles that are actionable for product managers
- Consider both the specific change AND the strategic direction

**Output format:**
You MUST return EXACTLY ${topK} indices from the ${chunks.length} documents above.
Valid indices are 0 to ${chunks.length - 1} ONLY.
Return the indices as a comma-separated list of numbers ONLY. No other text.

Example outputs (for ${chunks.length} documents, selecting top ${topK}):
${chunks.length >= 5 ? '- "2, 0, 4"' : `- "${Math.min(chunks.length - 1, 1)}, 0"`}
${chunks.length >= 3 ? '- "1, 0, 2"' : ''}

Your response (comma-separated indices from 0-${chunks.length - 1}):`;
}
