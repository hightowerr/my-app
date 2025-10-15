/**
 * Prompt for rewriting verbose context into focused retrieval queries.
 * Used by: lib/retrieval/query-rewriter.ts
 */
export function buildQueryRewritingPrompt(context: string): string {
  return `You are a query optimization expert for semantic search over product psychology principles.

**Original context:**
${context}

**Task:**
Extract 2-3 focused search queries that will retrieve relevant psychology principles from a knowledge base.

**Guidelines:**
1. Extract core UI/UX concepts (e.g., "color changes", "form layout", "content removal")
2. Infer user psychology angles (e.g., "motivation", "trust", "cognitive load")
3. Each query should be 3-7 words, optimized for semantic search
4. Prioritize diversity - cover different aspects of the changes
5. Remove metadata noise ("Timeline continuation", "Previous context:", etc.)

**Examples:**

Input: "Screenshot comparison changes: button color changed from gray to blue; added social proof badges. Implication: increasing trust signals"
Output: ["UI color psychology trust signals", "social proof credibility design", "button styling user perception"]

Input: "Timeline continuation. Previous context: removed pricing table. New changes: simplified checkout form; added progress indicator. Strategic view: reducing friction"
Output: ["form simplification cognitive load", "checkout flow conversion optimization", "progress indicators completion psychology"]

**Now extract optimized queries for the context above. Return ONLY the queries, one per line, no numbering or explanation.`;
}
