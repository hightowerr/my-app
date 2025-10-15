import { TimelineComparison, TimelineReport } from './types';

/**
 * Sliding window size - how many recent reports to include in full detail
 */
const RECENT_WINDOW_SIZE = 3;

/**
 * Whether to use hierarchical summaries when available
 */
const USE_HIERARCHICAL_SUMMARIES = process.env.DISABLE_HIERARCHICAL_SUMMARIES !== 'true';

/**
 * Maximum age (in milliseconds) for reports to be considered "recent"
 * Default: 7 days
 */
const RECENT_TIME_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Builds optimized context for timeline continuation using sliding window strategy.
 *
 * Strategy:
 * - Include last N reports in full detail (RECENT_WINDOW_SIZE)
 * - Summarize older reports into high-level themes
 * - Prevents unbounded context growth in long timelines
 *
 * @param timeline - The timeline to build context from
 * @param windowSize - Number of recent reports to include (default: 3)
 * @returns Optimized context string
 */
export function buildTimelineContext(
  timeline: TimelineComparison,
  windowSize: number = RECENT_WINDOW_SIZE
): string {
  const continuationReports = timeline.reports.filter(r => r.type === 'continuation' || r.type === 'initial');
  const summaryReports = timeline.reports.filter(r => r.type === 'summary');

  // If timeline is short, include everything
  if (continuationReports.length <= windowSize) {
    const allChanges = continuationReports
      .map(r => r.changes.join(', '))
      .join(' | ');
    return `Previous changes in timeline: ${allChanges || 'Initial comparison'}`;
  }

  // Split into recent and older reports
  const recentReports = continuationReports.slice(-windowSize);
  const olderReports = continuationReports.slice(0, -windowSize);

  // Build detailed context for recent changes
  const recentChanges = recentReports
    .map((r, idx) => {
      const stepLabel = continuationReports.length - windowSize + idx + 1;
      return `Step ${stepLabel}: ${r.changes.join(', ')}`;
    })
    .join(' | ');

  // Build context for older changes - use summaries if available
  let olderContext: string;
  if (USE_HIERARCHICAL_SUMMARIES && summaryReports.length > 0) {
    olderContext = buildHierarchicalContext(summaryReports, olderReports);
  } else {
    olderContext = summarizeOlderReports(olderReports);
  }

  // Combine with strategic view if available
  const lastReport = recentReports[recentReports.length - 1];
  const strategicHint = lastReport?.strategicView
    ? ` Strategic direction: ${lastReport.strategicView}.`
    : '';

  return `Timeline history: ${olderContext} Recent changes: ${recentChanges}.${strategicHint}`;
}

/**
 * Builds context using hierarchical summaries.
 * Provides high-level overview from summary reports plus any unsummarized changes.
 */
function buildHierarchicalContext(
  summaryReports: TimelineReport[],
  olderReports: Array<{ changes: string[] }>
): string {
  // Build context from phase summaries
  const summaryContext = summaryReports
    .map(s => {
      if (!s.phaseTitle) return null;
      const patterns = s.keyPatterns?.join('; ') || '';
      return `${s.phaseTitle}: ${patterns}`;
    })
    .filter(Boolean)
    .join(' | ');

  // Check if there are unsummarized older reports
  // (reports that exist but haven't been batched into a summary yet)
  const summarizedReportCount = summaryReports.length * 5; // Assuming SUMMARY_BATCH_SIZE = 5
  const unsummarizedReports = olderReports.slice(summarizedReportCount);

  if (unsummarizedReports.length > 0) {
    const unsummarizedContext = summarizeOlderReports(unsummarizedReports);
    return `${summaryContext} | ${unsummarizedContext}`;
  }

  return summaryContext || summarizeOlderReports(olderReports);
}

/**
 * Summarizes older reports into high-level themes.
 * Extracts common patterns without overwhelming context.
 */
function summarizeOlderReports(reports: Array<{ changes: string[] }>): string {
  if (reports.length === 0) {
    return 'Initial comparison.';
  }

  // Extract all changes and find common themes
  const allChanges = reports.flatMap(r => r.changes);

  // Simple frequency-based summarization
  const themes: Record<string, number> = {};
  for (const change of allChanges) {
    const lowerChange = change.toLowerCase();

    // Categorize by common UI patterns
    if (lowerChange.includes('color') || lowerChange.includes('style')) {
      themes['styling changes'] = (themes['styling changes'] || 0) + 1;
    } else if (lowerChange.includes('layout') || lowerChange.includes('position')) {
      themes['layout adjustments'] = (themes['layout adjustments'] || 0) + 1;
    } else if (lowerChange.includes('button') || lowerChange.includes('link') || lowerChange.includes('cta')) {
      themes['CTA modifications'] = (themes['CTA modifications'] || 0) + 1;
    } else if (lowerChange.includes('form') || lowerChange.includes('input')) {
      themes['form changes'] = (themes['form changes'] || 0) + 1;
    } else if (lowerChange.includes('text') || lowerChange.includes('copy') || lowerChange.includes('content')) {
      themes['content updates'] = (themes['content updates'] || 0) + 1;
    } else if (lowerChange.includes('add') || lowerChange.includes('new')) {
      themes['new elements'] = (themes['new elements'] || 0) + 1;
    } else if (lowerChange.includes('remov') || lowerChange.includes('delet')) {
      themes['removed elements'] = (themes['removed elements'] || 0) + 1;
    }
  }

  // Build summary from top themes
  const sortedThemes = Object.entries(themes)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3) // Top 3 themes
    .map(([theme]) => theme);

  if (sortedThemes.length === 0) {
    return `${reports.length} earlier changes.`;
  }

  return `Earlier: ${sortedThemes.join(', ')} (${reports.length} changes total).`;
}

/**
 * Builds context with time-based windowing (alternative strategy).
 * Includes all reports from the last N days in full detail.
 */
export function buildTimelineContextByTime(
  timeline: TimelineComparison,
  timeWindowMs: number = RECENT_TIME_WINDOW_MS
): string {
  const now = Date.now();
  const cutoffTime = now - timeWindowMs;

  const recentReports = timeline.reports.filter(r => {
    const reportTime = new Date(r.timestamp).getTime();
    return reportTime >= cutoffTime;
  });

  const olderReports = timeline.reports.filter(r => {
    const reportTime = new Date(r.timestamp).getTime();
    return reportTime < cutoffTime;
  });

  // Build context similar to sliding window
  const recentChanges = recentReports
    .map(r => r.changes.join(', '))
    .join(' | ');

  if (olderReports.length === 0) {
    return `Recent changes: ${recentChanges || 'Initial comparison'}`;
  }

  const olderSummary = summarizeOlderReports(olderReports);
  return `Timeline history: ${olderSummary} Recent changes (last 7 days): ${recentChanges}.`;
}
