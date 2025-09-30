import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import {
  FormattedInsight,
  formatInsight,
  filterValidatedInsights
} from './formatPsychInsights';

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

    // Create abort controller for timeout (30 seconds)
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), 30000);

    try {
      // Make direct POST request to the full retrieval endpoint
      const response = await fetch(config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.accessToken}`,
        },
        body: JSON.stringify({
          question: context,
          numResults: cappedMaxResults,
        }),
        signal: abortController.signal,
      });

      // Clear timeout on successful response
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
        console.log('[VECTORIZE] No relevant psychology insights found');
        return [];
      }

      console.log('[VECTORIZE] Retrieved', data.documents.length, 'raw documents from retrieval');

      // Extract text content from documents with type-safe parsing
      const rawChunks = data.documents.map((doc: string | VectorizeDocument): string => {
        // Handle string documents
        if (typeof doc === 'string') {
          return doc;
        }

        // Handle object documents - check for text field
        if (typeof doc === 'object' && doc !== null) {
          if (typeof doc.text === 'string' && doc.text.length > 0) {
            return doc.text;
          }
          if (typeof doc.content === 'string' && doc.content.length > 0) {
            return doc.content;
          }
        }

        // Fallback: stringify the entire document
        return JSON.stringify(doc);
      });

      // Use GPT-4o-mini to synthesize raw chunks into clean, contextual insights
      const synthesizedInsights = await synthesizeInsightsWithAI(rawChunks, context, cappedMaxResults);

      console.log(`[VECTORIZE] Synthesized ${synthesizedInsights.length} clean insights from ${rawChunks.length} raw chunks`);
      return synthesizedInsights;

    } catch (fetchError) {
      clearTimeout(timeoutId);

      // Handle abort/timeout errors specifically
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.error('[VECTORIZE] Request timed out after 30 seconds');
        throw new Error('Vectorize API request timed out');
      }

      throw fetchError;
    }

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
          content: `You are a product psychology expert analyzing screenshot changes.

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

Ignore formatting artifacts, table syntax, or irrelevant noise in the raw results.`
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
