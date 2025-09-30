/**
 * Formatting utilities for product psychology insights.
 * Strips markdown and validates principles against retrieved documents.
 */

export interface FormattedInsight {
  principle: string;      // Plain text, no markdown
  outcome: 'positive' | 'negative';
  rationale: string;      // Plain text, no markdown
}

/**
 * Strips all markdown formatting from text.
 * Handles nested markdown, escaped sequences, and edge cases.
 * Removes: **bold**, *italic*, `code`, [links](url), ~~strikethrough~~, etc.
 *
 * Algorithm:
 * 1. First pass: Unescape escaped markdown (e.g., \* → *, \_ → _)
 * 2. Iterative passes: Apply markdown removal rules until no changes occur
 * 3. This handles nested constructs like ***nested*** or **bold with *italic***
 */
export function stripMarkdown(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  // Step 1: Unescape escaped markdown characters
  // Replace \* with *, \_ with _, \` with `, etc.
  let result = text
    .replace(/\\(\*|_|`|~|\[|\]|\(|\)|\\)/g, '$1');

  // Step 2: Iteratively strip markdown until no changes occur
  // This handles nested and complex markdown structures
  let previousResult = '';
  let iterations = 0;
  const MAX_ITERATIONS = 10; // Prevent infinite loops on malformed input

  while (result !== previousResult && iterations < MAX_ITERATIONS) {
    previousResult = result;
    iterations++;

    result = result
      // Remove headings: # Header, ## Header, etc.
      .replace(/^#{1,6}\s+(.+)$/gm, '$1')

      // Remove bold: **text** or __text__
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/__(.+?)__/g, '$1')

      // Remove italic: *text* or _text_
      // Use negative lookahead to avoid matching bold markers
      .replace(/\*([^*]+?)\*/g, '$1')
      .replace(/_([^_]+?)_/g, '$1')

      // Remove inline code: `text` or ```code blocks```
      .replace(/```[\s\S]*?```/g, '')  // Code blocks first
      .replace(/`([^`]+?)`/g, '$1')     // Then inline code

      // Remove links: [text](url) or [text][ref]
      .replace(/\[([^\]]+?)\]\([^\)]+?\)/g, '$1')
      .replace(/\[([^\]]+?)\]\[[^\]]+?\]/g, '$1')

      // Remove images: ![alt](url)
      .replace(/!\[([^\]]*?)\]\([^\)]+?\)/g, '$1')

      // Remove strikethrough: ~~text~~
      .replace(/~~(.+?)~~/g, '$1')

      // Remove HTML tags (in case markdown contains HTML)
      .replace(/<[^>]+>/g, '')

      // Remove blockquotes: > text
      .replace(/^>\s+(.+)$/gm, '$1')

      // Remove horizontal rules: ---, ***, ___
      .replace(/^[\*\-_]{3,}\s*$/gm, '')

      // Remove list markers: -, *, +, 1., etc.
      .replace(/^[\s]*[-*+]\s+/gm, '')
      .replace(/^[\s]*\d+\.\s+/gm, '')

      // Collapse multiple spaces into one
      .replace(/\s+/g, ' ');
  }

  // Step 3: Final cleanup
  return result
    .trim()
    // Remove any remaining standalone markdown characters
    .replace(/^[\*_~`#>\-+]+|[\*_~`]+$/g, '');
}

/**
 * Formats a raw insight object by stripping markdown from all text fields.
 */
export function formatInsight(insight: {
  principle: string;
  outcome: 'positive' | 'negative';
  rationale: string;
}): FormattedInsight {
  return {
    principle: stripMarkdown(insight.principle),
    outcome: insight.outcome,
    rationale: stripMarkdown(insight.rationale),
  };
}

/**
 * Validates that a principle name appears in the retrieved document chunks.
 * Returns true if the principle is found (case-insensitive partial match).
 */
export function validatePrincipleInChunks(
  principle: string,
  retrievedChunks: string[]
): boolean {
  const normalizedPrinciple = principle.toLowerCase().trim();

  return retrievedChunks.some(chunk => {
    const normalizedChunk = chunk.toLowerCase();
    return normalizedChunk.includes(normalizedPrinciple);
  });
}

/**
 * Filters insights to only include those with principles found in retrieved chunks.
 * Logs warnings for filtered-out insights.
 */
export function filterValidatedInsights(
  insights: FormattedInsight[],
  retrievedChunks: string[]
): FormattedInsight[] {
  return insights.filter(insight => {
    const isValid = validatePrincipleInChunks(insight.principle, retrievedChunks);

    if (!isValid) {
      console.warn(
        `[VECTORIZE] Filtered out insight with principle "${insight.principle}" - not found in retrieved documents`
      );
    }

    return isValid;
  });
}
