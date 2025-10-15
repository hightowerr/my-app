import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import { TimelineReport } from './types';
import { buildTimelineSummaryPrompt } from '@/components/agents/prompts/timeline-summary';

/**
 * Number of reports to batch before generating a summary
 */
export const SUMMARY_BATCH_SIZE = 5;

/**
 * Schema for timeline phase summaries
 */
const TimelineSummarySchema = z.object({
  phaseTitle: z.string().describe('Short title (3-5 words) describing this phase'),
  keyPatterns: z.array(z.string()).min(2).max(3).describe('2-3 recurring themes or patterns'),
  strategicDirection: z.string().describe('2-3 sentences explaining overall strategic intent'),
  changes: z.array(z.string()).max(5).describe('Up to 5 most significant changes from all steps')
});

export type TimelineSummary = z.infer<typeof TimelineSummarySchema>;

/**
 * Generates a high-level summary for a batch of timeline reports.
 * Used to maintain "big picture" view as timelines grow.
 *
 * @param reports - Array of reports to summarize (typically last N reports)
 * @param startIndex - Starting step number for this batch (for labeling)
 * @param endIndex - Ending step number for this batch
 * @returns Summary object with phase title, patterns, and strategic direction
 */
export async function generateTimelineSummary(
  reports: TimelineReport[],
  startIndex: number,
  endIndex: number
): Promise<TimelineSummary> {
  try {
    console.log(`[TIMELINE_SUMMARY] Generating summary for steps ${startIndex + 1}-${endIndex + 1} (${reports.length} reports)`);

    const { object: summary } = await generateObject({
      model: openai('gpt-4o-mini'),
      schema: TimelineSummarySchema,
      messages: [
        {
          role: 'user',
          content: buildTimelineSummaryPrompt(reports, startIndex, endIndex)
        }
      ]
    });

    console.log('[TIMELINE_SUMMARY] Generated summary:', summary.phaseTitle);
    return summary;
  } catch (error) {
    console.error('[TIMELINE_SUMMARY] Failed to generate summary:', error);
    // Fallback: create a simple summary from the reports
    return {
      phaseTitle: `Steps ${startIndex + 1}-${endIndex + 1}`,
      keyPatterns: reports.slice(0, 2).map(r => r.changes[0] || 'UI changes'),
      strategicDirection: reports.map(r => r.implication).join(' '),
      changes: reports.flatMap(r => r.changes).slice(0, 5)
    };
  }
}

/**
 * Checks if a timeline should generate a new summary based on its current state.
 *
 * @param totalReports - Total number of reports in the timeline
 * @param existingSummaries - Number of summaries already generated
 * @returns True if a new summary should be generated
 */
export function shouldGenerateSummary(
  totalReports: number,
  existingSummaries: number
): boolean {
  // Generate summary every SUMMARY_BATCH_SIZE reports
  // Example: at 5, 10, 15, 20 reports
  const expectedSummaries = Math.floor(totalReports / SUMMARY_BATCH_SIZE);
  return expectedSummaries > existingSummaries;
}

/**
 * Gets the report range for the next summary to be generated.
 *
 * @param totalReports - Total number of reports
 * @param existingSummaries - Number of summaries already generated
 * @returns Object with startIndex and endIndex, or null if no summary needed
 */
export function getNextSummaryRange(
  totalReports: number,
  existingSummaries: number
): { startIndex: number; endIndex: number } | null {
  if (!shouldGenerateSummary(totalReports, existingSummaries)) {
    return null;
  }

  const endIndex = (existingSummaries + 1) * SUMMARY_BATCH_SIZE - 1;
  const startIndex = existingSummaries * SUMMARY_BATCH_SIZE;

  // Validate range
  if (endIndex >= totalReports) {
    return null;
  }

  return { startIndex, endIndex };
}
