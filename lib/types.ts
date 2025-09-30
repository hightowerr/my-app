export interface FormattedInsight {
  principle: string;      // Plain text, no markdown
  outcome: 'positive' | 'negative';
  rationale: string;      // Plain text, no markdown
}

export interface ComparisonResult {
  id: string;
  imageA: {
    name: string;
    data: string;
    type: string;
    size: number;
  };
  imageB: {
    name: string;
    data: string;
    type: string;
    size: number;
  };
  comparison: {
    changes: string[];
    implication: string;
    psychologyInsights?: FormattedInsight[];
  };
  timestamp: string;
  feedback?: 'useful' | 'not-useful';
}

export interface TimelineScreenshot {
  id: string;
  name: string;
  data: string;
  type: string;
  size: number;
  timestamp: string;
  order: number;
}

export interface TimelineReport {
  id: string;
  type: 'initial' | 'continuation' | 'summary';
  fromScreenshotId?: string;
  toScreenshotId: string;
  changes: string[];
  implication: string;
  strategicView?: string;
  psychologyInsights?: FormattedInsight[];
  timestamp: string;
}

export interface TimelineComparison {
  id: string;
  title?: string;
  screenshots: TimelineScreenshot[];
  reports: TimelineReport[];
  feedback?: Record<string, 'useful' | 'not-useful'>;
  createdAt: string;
  updatedAt: string;
}

export type StorageItem = ComparisonResult | TimelineComparison;

export function isTimelineComparison(item: StorageItem): item is TimelineComparison {
  return 'screenshots' in item && Array.isArray(item.screenshots);
}

export function isComparisonResult(item: StorageItem): item is ComparisonResult {
  return 'imageA' in item && 'imageB' in item;
}