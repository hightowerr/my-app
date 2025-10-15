import { openai } from '@ai-sdk/openai';
import { generateObject, generateText } from 'ai';
import { z } from 'zod';
import {
  FormattedInsight,
  formatInsight,
  filterValidatedInsights
} from './formatPsychInsights';
import { buildPsychologySynthesisPrompt } from '@/components/agents/prompts/psychology-synthesis';
import { rewriteQuerySingle } from './query-rewriter';
import { buildReRankingPrompt } from '@/components/agents/prompts/re-ranking';
import { generateHybridQueries, deduplicateDocuments, mergeSearchResults } from './hybrid-search';

interface VectorizeConfig {
  accessToken: string;
  endpoint: string;
}

/**
 * Type definition for Vectorize API document response.
 * Documents can be strings or objects with optional text/content fields.
 */
interface VectorizeDocument {
  text?: string;
  content?: string;
  // Allow other fields from Vectorize API
  [key: string]: unknown;
}

/**
 * Maximum insights to return (hardcoded limit for schema stability)
 */
const MAX_INSIGHTS = 3;

/**
 * Schema for synthesizing raw retrieval chunks into clean insights.
 * Each insight identifies a principle from retrieved docs, classifies the change as positive/negative,
 * and explains why with reference to specific UI changes.
 */
const InsightSynthesisSchema = z.object({
  insights: z.array(
    z.object({
      principle: z.string().describe('The exact name of the psychology principle or bias from the retrieved documents (e.g., "Scarcity", "Social Proof", "Framing")'),
      outcome: z.enum(['positive', 'negative']).describe('Whether this change is positive or negative for user experience'),
      rationale: z.string().describe('1-2 sentences explaining why, referencing specific UI changes from the context')
    })
  ).max(MAX_INSIGHTS).describe(`Up to ${MAX_INSIGHTS} relevant product psychology insights - return fewer if less are truly relevant`)
});

/**
 * Retrieves product psychology insights from Vectorize based on screenshot analysis context.
 * Returns 1-3 structured insights with principle name, outcome classification, and contextual rationale.
 */
export async function getProductPsychologyInsights(
  context: string,
  maxResults: number = MAX_INSIGHTS
): Promise<FormattedInsight[]> {
  try {
    // Validate environment variables
    const config = validateVectorizeConfig();

    // Cap maxResults to schema limit
    const cappedMaxResults = Math.min(maxResults, MAX_INSIGHTS);

    console.log('[VECTORIZE] Starting retrieval for', cappedMaxResults, 'insights');
    console.log('[VECTORIZE] Endpoint:', config.endpoint);

    // Step 1: Query generation (hybrid or single)
    const hybridSearchEnabled = process.env.ENABLE_HYBRID_SEARCH === 'true';
    const retrievalCount = Math.min(cappedMaxResults * 3, 10); // Get 3x for re-ranking, max 10

    let rawChunks: string[];

    if (hybridSearchEnabled) {
      console.log('[VECTORIZE] Using hybrid search (semantic + keyword)');
      rawChunks = await performHybridSearch(config, context, retrievalCount);
    } else {
      console.log('[VECTORIZE] Using single semantic search');
      // Step 1a: Rewrite query for better semantic search (with fallback)
      let rewrittenQuery = context; // Default to original context
      const queryRewritingEnabled = process.env.DISABLE_QUERY_REWRITING !== 'true';

      if (queryRewritingEnabled) {
        try {
          rewrittenQuery = await rewriteQuerySingle(context);
          console.log('[VECTORIZE] Query rewritten to:', rewrittenQuery.substring(0, 100) + '...');
        } catch (rewriteError) {
          console.warn('[VECTORIZE] Query rewriting failed, using original context:', rewriteError);
        }
      }

      // Step 1b: Single retrieval
      rawChunks = await performSingleSearch(config, rewrittenQuery, retrievalCount);
    }

    // Step 2: Continue with re-ranking and synthesis
    if (rawChunks.length === 0) {
      console.log('[VECTORIZE] No relevant psychology insights found');
      return [];
    }

    console.log('[VECTORIZE] Retrieved', rawChunks.length, 'raw documents from retrieval');

    // Step 3: Re-rank documents by relevance to context
    // Can be disabled via DISABLE_RERANKING=true for debugging
    let rerankedChunks = rawChunks.slice(0, cappedMaxResults); // Default: just take top-k
    const rerankingEnabled = process.env.DISABLE_RERANKING !== 'true';

    if (rerankingEnabled && rawChunks.length > cappedMaxResults) {
      try {
        rerankedChunks = await reRankDocuments(context, rawChunks, cappedMaxResults);
        console.log('[VECTORIZE] Re-ranked from', rawChunks.length, 'to top', rerankedChunks.length, 'chunks');
      } catch (rerankError) {
        console.warn('[VECTORIZE] Re-ranking failed, using top chunks:', rerankError);
        // Fallback already set above
      }
    } else if (!rerankingEnabled) {
      console.log('[VECTORIZE] Re-ranking disabled, using top', rerankedChunks.length, 'chunks');
    }

    // Step 4: Use GPT-4o-mini to synthesize re-ranked chunks into clean, contextual insights
    const synthesizedInsights = await synthesizeInsightsWithAI(rerankedChunks, context, cappedMaxResults);

    console.log(`[VECTORIZE] Synthesized ${synthesizedInsights.length} clean insights from ${rawChunks.length} raw chunks`);
    return synthesizedInsights;

  } catch (error) {
    console.error('[VECTORIZE] Error retrieving psychology insights:', error);

    // Gracefully fail - don't block the main comparison flow
    if (error instanceof Error) {
      console.error('[VECTORIZE] Error details:', error.message);
    }

    return [];
  }
}

/**
 * Validates Vectorize environment configuration.
 * Throws error if required env vars are missing.
 */
function validateVectorizeConfig(): VectorizeConfig {
  const accessToken = process.env.VECTORIZE_ACCESS_TOKEN;
  const endpoint = process.env.VECTORIZE_ENDPOINT;

  if (!accessToken || !endpoint) {
    const missing = [];
    if (!accessToken) missing.push('VECTORIZE_ACCESS_TOKEN');
    if (!endpoint) missing.push('VECTORIZE_ENDPOINT');

    throw new Error(`Missing required Vectorize environment variables: ${missing.join(', ')}`);
  }

  return {
    accessToken,
    endpoint,
  };
}

/**
 * Uses GPT-4o-mini to synthesize raw retrieval chunks into clean, contextualized insights.
 * Extracts principle names, classifies outcome, and generates change-specific rationales.
 */
/**
 * Re-ranks retrieved documents by relevance to context using LLM scoring.
 * This improves precision by filtering out false positives from semantic search.
 */
async function reRankDocuments(
  context: string,
  chunks: string[],
  topK: number
): Promise<string[]> {
  try {
    // If we have fewer chunks than needed, return all
    if (chunks.length <= topK) {
      console.log('[RERANKER] Fewer chunks than topK, skipping re-ranking');
      return chunks;
    }

    console.log('[RERANKER] Re-ranking', chunks.length, 'chunks to top', topK);

    const { text } = await generateText({
      model: openai('gpt-4o-mini'),
      prompt: buildReRankingPrompt(context, chunks, topK),
    });

    console.log('[RERANKER] Raw LLM response:', JSON.stringify(text));

    // Parse indices from output - try multiple formats
    // Expected: "4, 1, 7" or "4\n1\n7" or "[4, 1, 7]"
    let cleanedText = text
      .replace(/[\[\]]/g, '') // Remove brackets
      .replace(/\n/g, ',')     // Replace newlines with commas
      .replace(/\s+/g, ' ')    // Normalize whitespace
      .trim();

    // Extract all numbers from the text
    const indices = cleanedText
      .split(/[,\s]+/) // Split on commas or spaces
      .map(s => parseInt(s.trim(), 10))
      .filter(n => !isNaN(n) && n >= 0 && n < chunks.length) // Validate indices
      .slice(0, topK); // Limit to topK

    console.log('[RERANKER] Parsed indices:', indices, 'from cleaned text:', cleanedText);

    // Return chunks in re-ranked order
    const reranked = indices.map(i => chunks[i]);

    // Fallback: if parsing failed, return original top chunks
    if (reranked.length === 0) {
      console.warn('[RERANKER] Failed to parse indices, returning original order');
      return chunks.slice(0, topK);
    }

    return reranked;
  } catch (error) {
    console.error('[RERANKER] Re-ranking failed:', error);
    // Fallback: return original top chunks
    return chunks.slice(0, topK);
  }
}

async function synthesizeInsightsWithAI(
  rawChunks: string[],
  context: string,
  maxResults: number
): Promise<FormattedInsight[]> {
  try {
    const { object: synthesis } = await generateObject({
      model: openai('gpt-4o-mini'),
      schema: InsightSynthesisSchema,
      messages: [
        {
          role: 'user',
          content: buildPsychologySynthesisPrompt(context, rawChunks, maxResults)
        }
      ]
    });

    // Format insights by stripping markdown
    const formattedInsights = synthesis.insights.map(formatInsight);

    // Validate that principles exist in retrieved chunks
    const validatedInsights = filterValidatedInsights(formattedInsights, rawChunks);

    return validatedInsights;

  } catch (error) {
    console.error('[VECTORIZE] AI synthesis failed:', error);
    // Fallback: return empty array to fail gracefully
    return [];
  }
}

/**
 * Performs a single semantic search against Vectorize.
 */
async function performSingleSearch(
  config: VectorizeConfig,
  query: string,
  numResults: number
): Promise<string[]> {
  const abortController = new AbortController();
  const timeoutId = setTimeout(() => abortController.abort(), 30000);

  try {
    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.accessToken}`,
      },
      body: JSON.stringify({
        question: query,
        numResults,
      }),
      signal: abortController.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[VECTORIZE] API error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      });
      throw new Error(`Vectorize API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.documents || data.documents.length === 0) {
      return [];
    }

    // Extract text content from documents
    return data.documents.map((doc: string | VectorizeDocument): string => {
      if (typeof doc === 'string') {
        return doc;
      }

      if (typeof doc === 'object' && doc !== null) {
        if (typeof doc.text === 'string' && doc.text.length > 0) {
          return doc.text;
        }
        if (typeof doc.content === 'string' && doc.content.length > 0) {
          return doc.content;
        }
      }

      return JSON.stringify(doc);
    });
  } catch (fetchError) {
    clearTimeout(timeoutId);

    if (fetchError instanceof Error && fetchError.name === 'AbortError') {
      console.error('[VECTORIZE] Request timed out after 30 seconds');
      throw new Error('Vectorize API request timed out');
    }

    throw fetchError;
  }
}

/**
 * Performs hybrid search (semantic + keyword) against Vectorize.
 * Makes 2 parallel requests and merges results.
 */
async function performHybridSearch(
  config: VectorizeConfig,
  context: string,
  numResults: number
): Promise<string[]> {
  try {
    // Generate both query types
    const { semantic, keyword } = await generateHybridQueries(context);

    // Perform both searches in parallel
    const [semanticDocs, keywordDocs] = await Promise.all([
      performSingleSearch(config, semantic, numResults),
      performSingleSearch(config, keyword, numResults)
    ]);

    console.log('[HYBRID_SEARCH] Semantic retrieved:', semanticDocs.length);
    console.log('[HYBRID_SEARCH] Keyword retrieved:', keywordDocs.length);

    // Merge and deduplicate
    const merged = mergeSearchResults(semanticDocs, keywordDocs, numResults);
    const deduplicated = deduplicateDocuments(merged);

    return deduplicated;
  } catch (error) {
    console.error('[HYBRID_SEARCH] Failed, falling back to semantic-only:', error);
    // Fallback to semantic-only search
    const semanticQuery = await rewriteQuerySingle(context);
    return performSingleSearch(config, semanticQuery, numResults);
  }
}
