import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { buildQueryRewritingPrompt } from '@/components/agents/prompts/query-rewriting';

/**
 * Rewrites verbose context into focused retrieval queries optimized for semantic search.
 *
 * @param context - The full context string (may include timeline history, changes, implications)
 * @param numQueries - Number of queries to generate (default: 2-3 for diversity)
 * @returns Array of focused query strings
 */
export async function rewriteQuery(
  context: string,
  numQueries: number = 3
): Promise<string[]> {
  try {
    console.log('[QUERY_REWRITER] Rewriting query from context:', context.substring(0, 100) + '...');

    const { text } = await generateText({
      model: openai('gpt-4o-mini'),
      prompt: buildQueryRewritingPrompt(context),
    });

    // Parse the output - expecting one query per line
    const queries = text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && !line.match(/^\d+\./)) // Remove numbered lists
      .slice(0, numQueries); // Limit to requested number

    console.log('[QUERY_REWRITER] Generated queries:', queries);

    // Fallback: if parsing fails, use original context
    if (queries.length === 0) {
      console.warn('[QUERY_REWRITER] Failed to parse queries, using original context');
      return [context];
    }

    return queries;
  } catch (error) {
    console.error('[QUERY_REWRITER] Error rewriting query:', error);
    // Graceful fallback - return original context
    return [context];
  }
}

/**
 * Rewrites query with single output for simpler use cases.
 * Combines multiple queries into one focused query.
 */
export async function rewriteQuerySingle(context: string): Promise<string> {
  const queries = await rewriteQuery(context, 2);
  // Combine top 2 queries with OR semantics
  return queries.join(' OR ');
}
