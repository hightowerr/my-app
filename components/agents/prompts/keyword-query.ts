/**
 * Prompt for generating keyword-optimized queries for hybrid search.
 * Used by: lib/retrieval/hybrid-search.ts
 */
export function buildKeywordQueryPrompt(context: string): string {
  return `You are a search query optimizer specializing in keyword extraction for retrieval systems.

**Original context:**
${context}

**Task:**
Extract 5-7 specific keywords or short phrases that would help retrieve relevant product psychology principles.

**Guidelines:**
1. Focus on psychology principle names (e.g., "Loss Aversion", "Social Proof", "Scarcity")
2. Include UX pattern keywords (e.g., "form design", "CTA placement", "color psychology")
3. Use exact terminology from psychology/UX literature
4. Avoid generic words like "change", "update", "new"
5. Include both broad terms ("trust") and specific terms ("reciprocity principle")

**Example:**

Input: "Button color changed from gray to blue; added social proof badges"
Output: social proof, color psychology, trust signals, button design, credibility, conversion optimization, visual prominence

**Now extract keywords for the context above. Return ONLY the comma-separated keywords, no explanation.`;
}
