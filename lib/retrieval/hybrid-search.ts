import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { buildKeywordQueryPrompt } from '@/components/agents/prompts/keyword-query';
import { rewriteQuerySingle } from './query-rewriter';

/**
 * Generates both semantic and keyword-optimized queries for hybrid search.
 *
 * @param context - The original context string
 * @returns Object with semantic and keyword queries
 */
export async function generateHybridQueries(context: string): Promise<{
  semantic: string;
  keyword: string;
}> {
  try {
    console.log('[HYBRID_SEARCH] Generating hybrid queries from context');

    // Generate both queries in parallel
    const [semanticQuery, keywordResult] = await Promise.all([
      rewriteQuerySingle(context),
      generateText({
        model: openai('gpt-4o-mini'),
        prompt: buildKeywordQueryPrompt(context),
      })
    ]);

    const keywordQuery = keywordResult.text.trim();

    console.log('[HYBRID_SEARCH] Semantic query:', semanticQuery.substring(0, 80) + '...');
    console.log('[HYBRID_SEARCH] Keyword query:', keywordQuery.substring(0, 80) + '...');

    return {
      semantic: semanticQuery,
      keyword: keywordQuery
    };
  } catch (error) {
    console.error('[HYBRID_SEARCH] Failed to generate hybrid queries:', error);
    // Fallback: use original context for both
    return {
      semantic: context,
      keyword: context
    };
  }
}

/**
 * Deduplicates documents by content similarity.
 * Uses simple string matching to avoid retrieving the same principle twice.
 *
 * @param docs - Array of document strings
 * @returns Deduplicated array
 */
export function deduplicateDocuments(docs: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const doc of docs) {
    // Normalize: lowercase, remove extra whitespace
    const normalized = doc.toLowerCase().replace(/\s+/g, ' ').trim();

    // Check if we've seen something very similar
    const isDuplicate = Array.from(seen).some(existing => {
      // Consider duplicate if >80% similar (simple approximation)
      const similarity = calculateSimilarity(normalized, existing);
      return similarity > 0.8;
    });

    if (!isDuplicate) {
      seen.add(normalized);
      result.push(doc);
    } else {
      console.log('[HYBRID_SEARCH] Filtered duplicate document');
    }
  }

  console.log('[HYBRID_SEARCH] Deduplicated', docs.length, 'docs to', result.length);
  return result;
}

/**
 * Simple similarity calculation using Jaccard index.
 * Good enough for duplicate detection.
 */
function calculateSimilarity(a: string, b: string): number {
  const wordsA = new Set(a.split(' '));
  const wordsB = new Set(b.split(' '));

  const intersection = new Set([...wordsA].filter(w => wordsB.has(w)));
  const union = new Set([...wordsA, ...wordsB]);

  return intersection.size / union.size;
}

/**
 * Merges and ranks documents from semantic and keyword searches.
 * Documents that appear in both searches are ranked higher.
 *
 * @param semanticDocs - Documents from semantic search
 * @param keywordDocs - Documents from keyword search
 * @param topK - Number of documents to return
 * @returns Merged and ranked documents
 */
export function mergeSearchResults(
  semanticDocs: string[],
  keywordDocs: string[],
  topK: number
): string[] {
  // Track document sources
  const docScores = new Map<string, { score: number; doc: string }>();

  // Score semantic results higher (they're usually more relevant)
  semanticDocs.forEach((doc, idx) => {
    const score = (semanticDocs.length - idx) * 2; // 2x weight for semantic
    docScores.set(doc, { score, doc });
  });

  // Add keyword results (or boost if already present)
  keywordDocs.forEach((doc, idx) => {
    const score = keywordDocs.length - idx;
    const existing = docScores.get(doc);

    if (existing) {
      // Boost documents that appear in both searches
      existing.score += score * 1.5; // Bonus for appearing in both
    } else {
      docScores.set(doc, { score, doc });
    }
  });

  // Sort by score and return top-k
  const sorted = Array.from(docScores.values())
    .sort((a, b) => b.score - a.score)
    .map(item => item.doc)
    .slice(0, topK);

  console.log('[HYBRID_SEARCH] Merged', semanticDocs.length + keywordDocs.length, 'docs to top', sorted.length);
  return sorted;
}
