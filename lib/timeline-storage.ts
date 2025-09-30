import { ComparisonResult, TimelineComparison, TimelineScreenshot, TimelineReport, StorageItem, isTimelineComparison, isComparisonResult } from './types';
import { StorageUtils } from './storage-utils';

export class TimelineStorage {
  private static TIMELINE_PREFIX = 'timeline-';
  private static COMPARISON_PREFIX = 'comparison-';

  static async createTimelineFromComparison(comparison: ComparisonResult, title?: string): Promise<TimelineComparison> {
    console.log('Creating timeline from comparison:', comparison.id);

    // Validate required properties
    if (!comparison.id || !comparison.imageA || !comparison.imageB || !comparison.comparison) {
      throw new Error('Invalid comparison data: missing required properties');
    }

    const now = new Date().toISOString();
    const timelineId = `${this.TIMELINE_PREFIX}${globalThis.crypto.randomUUID()}`;

    console.log('Compressing images for timeline creation...');

    try {
      // Compress both images before storing
      const [compressedA, compressedB] = await Promise.all([
        StorageUtils.compressImage(comparison.imageA.data, 400),
        StorageUtils.compressImage(comparison.imageB.data, 400)
      ]);

      console.log('Image A compressed:', StorageUtils.getDataSizeKB(comparison.imageA.data), 'KB ->', StorageUtils.getDataSizeKB(compressedA), 'KB');
      console.log('Image B compressed:', StorageUtils.getDataSizeKB(comparison.imageB.data), 'KB ->', StorageUtils.getDataSizeKB(compressedB), 'KB');

      // Extract base64 data from data URLs (compressImage returns full data URLs)
      const dataA = compressedA.includes(',') ? compressedA.split(',')[1] : compressedA;
      const dataB = compressedB.includes(',') ? compressedB.split(',')[1] : compressedB;

      const screenshots: TimelineScreenshot[] = [
        {
          id: `screenshot-${comparison.id}-a`,
          name: comparison.imageA.name,
          data: dataA,
          type: 'image/jpeg',
          size: StorageUtils.getDataSizeKB(compressedA) * 1024,
          timestamp: comparison.timestamp,
          order: 0
        },
        {
          id: `screenshot-${comparison.id}-b`,
          name: comparison.imageB.name,
          data: dataB,
          type: 'image/jpeg',
          size: StorageUtils.getDataSizeKB(compressedB) * 1024,
          timestamp: comparison.timestamp,
          order: 1
        }
      ];

      const initialReport: TimelineReport = {
        id: `report-${comparison.id}`,
        type: 'initial',
        fromScreenshotId: screenshots[0].id,
        toScreenshotId: screenshots[1].id,
        changes: comparison.comparison.changes,
        implication: comparison.comparison.implication,
        timestamp: comparison.timestamp
      };

      const timeline: TimelineComparison = {
        id: timelineId,
        title,
        screenshots,
        reports: [initialReport],
        feedback: comparison.feedback ? { [initialReport.id]: comparison.feedback } : {},
        createdAt: now,
        updatedAt: now
      };

      return timeline;
    } catch (error) {
      console.error('Error compressing images for timeline:', error);
      throw new Error('Failed to compress images for timeline creation. The images might be too large or corrupted.');
    }
  }

  static saveTimeline(timeline: TimelineComparison): void {
    timeline.updatedAt = new Date().toISOString();
    const timelineData = JSON.stringify(timeline);

    console.log('Saving timeline:', timeline.id);
    console.log('Timeline data size:', StorageUtils.getDataSizeKB(`data:application/json;base64,${btoa(timelineData)}`), 'KB');

    const storageSummary = StorageUtils.getStorageSummary();
    console.log('Storage summary before save:', storageSummary);

    try {
      StorageUtils.safeSetItem(timeline.id, timelineData);
      console.log('Timeline saved successfully');
    } catch (error) {
      if (error instanceof Error && error.message === 'STORAGE_QUOTA_EXCEEDED') {
        throw new Error('Storage quota exceeded. Try removing some old comparisons or timelines from the history page to free up space.');
      }
      throw error;
    }
  }

  static getTimeline(id: string): TimelineComparison | null {
    try {
      const stored = localStorage.getItem(id);
      if (!stored) {
        console.log('[DEBUG] getTimeline: No stored data found for id:', id);
        return null;
      }

      const parsed = JSON.parse(stored);
      console.log('[DEBUG] getTimeline retrieved:', { id, hasScreenshots: !!parsed.screenshots, screenshotCount: parsed.screenshots?.length, hasReports: !!parsed.reports });
      return isTimelineComparison(parsed) ? parsed : null;
    } catch (error) {
      console.error('[DEBUG] getTimeline error:', error);
      return null;
    }
  }

  static getAllTimelines(): TimelineComparison[] {
    const allKeys = Object.keys(localStorage);
    const timelineKeys = allKeys.filter(key => key.startsWith(this.TIMELINE_PREFIX));

    return timelineKeys
      .map(key => this.getTimeline(key))
      .filter((timeline): timeline is TimelineComparison => timeline !== null)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  static getAllComparisons(): ComparisonResult[] {
    const allKeys = Object.keys(localStorage);
    const comparisonKeys = allKeys.filter(key => key.startsWith(this.COMPARISON_PREFIX));

    return comparisonKeys
      .map(key => {
        try {
          const stored = localStorage.getItem(key);
          if (!stored) return null;
          const parsed = JSON.parse(stored);
          return isComparisonResult(parsed) ? parsed : null;
        } catch {
          return null;
        }
      })
      .filter((comparison): comparison is ComparisonResult => comparison !== null)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  static getAllStorageItems(): StorageItem[] {
    const timelines = this.getAllTimelines();
    const comparisons = this.getAllComparisons();

    const allItems: StorageItem[] = [...timelines, ...comparisons];
    return allItems.sort((a, b) => {
      const aTime = 'updatedAt' in a ? a.updatedAt : a.timestamp;
      const bTime = 'updatedAt' in b ? b.updatedAt : b.timestamp;
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });
  }

  static async addScreenshotToTimeline(
    timelineId: string,
    screenshot: { id?: string; name: string; data: string; type: string; size: number }
  ): Promise<TimelineComparison | null> {
    const timeline = this.getTimeline(timelineId);
    if (!timeline) return null;

    console.log('Adding screenshot to timeline:', timelineId);
    console.log('[DEBUG] Screenshot object received:', { id: screenshot.id, name: screenshot.name, dataStart: screenshot.data?.substring(0, 50) + '...', type: screenshot.type, size: screenshot.size });

    // Validate screenshot data before attempting compression
    if (!screenshot.data || typeof screenshot.data !== 'string') {
      console.error('[VALIDATION ERROR] Screenshot data is invalid:', typeof screenshot.data);
      throw new Error('Invalid screenshot data');
    }

    console.log('[VALIDATION] Screenshot data format:', {
      hasComma: screenshot.data.includes(','),
      startsWithData: screenshot.data.startsWith('data:'),
      length: screenshot.data.length,
      preview: screenshot.data.substring(0, 50)
    });

    console.log('[VALIDATION] Screenshot data size:', StorageUtils.getDataSizeKB(screenshot.data), 'KB');

    try {
      // Compress the image before storing
      console.log('[COMPRESS] Starting compression for screenshot...');
      const compressedData = await StorageUtils.compressImage(screenshot.data, 400); // 400KB max per image
      console.log('Compressed screenshot size:', StorageUtils.getDataSizeKB(compressedData), 'KB');

      // Extract base64 data from data URL (compressImage returns full data URL)
      const base64Data = compressedData.includes(',') ? compressedData.split(',')[1] : compressedData;

      const newScreenshot: TimelineScreenshot = {
        id: screenshot.id || `screenshot-${globalThis.crypto.randomUUID()}`,
        name: screenshot.name,
        data: base64Data,
        type: 'image/jpeg', // Always store as JPEG after compression
        size: StorageUtils.getDataSizeKB(compressedData) * 1024, // Convert back to bytes
        timestamp: new Date().toISOString(),
        order: timeline.screenshots.length
      };

      timeline.screenshots.push(newScreenshot);
      this.saveTimeline(timeline);

      return timeline;
    } catch (error) {
      console.error('Error adding screenshot to timeline:', error);
      throw error;
    }
  }

  static deleteTimeline(id: string): boolean {
    try {
      localStorage.removeItem(id);
      return true;
    } catch {
      return false;
    }
  }

  static deleteComparison(id: string): boolean {
    try {
      localStorage.removeItem(`${this.COMPARISON_PREFIX}${id}`);
      return true;
    } catch {
      return false;
    }
  }

  static async convertComparisonToTimeline(comparisonId: string, title?: string): Promise<TimelineComparison | null> {
    console.log('Converting comparison to timeline:', { comparisonId, title });

    const comparison = this.getComparison(comparisonId);
    if (!comparison) {
      console.error('Comparison not found for ID:', comparisonId);
      console.log('Available localStorage keys:', Object.keys(localStorage).filter(k => k.startsWith('comparison-')));
      return null;
    }

    console.log('Found comparison:', comparison);

    try {
      const timeline = await this.createTimelineFromComparison(comparison, title);
      console.log('Created timeline:', timeline.id);

      this.saveTimeline(timeline);
      console.log('Timeline saved successfully');

      return timeline;
    } catch (error) {
      console.error('Error creating timeline:', error);
      throw error; // Re-throw to allow proper error handling in UI
    }
  }

  private static getComparison(id: string): ComparisonResult | null {
    try {
      const key = `${this.COMPARISON_PREFIX}${id}`;
      console.log('Looking for comparison with key:', key);

      const stored = localStorage.getItem(key);
      if (!stored) {
        console.log('No stored data found for key:', key);
        return null;
      }

      const parsed = JSON.parse(stored);
      console.log('Parsed comparison data:', parsed);

      if (!isComparisonResult(parsed)) {
        console.error('Stored data is not a valid ComparisonResult:', parsed);
        return null;
      }

      return parsed;
    } catch (error) {
      console.error('Error getting comparison:', error);
      return null;
    }
  }
}