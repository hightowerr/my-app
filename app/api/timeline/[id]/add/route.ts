import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import crypto from 'crypto';
import { getProductPsychologyInsights } from '@/lib/retrieval/vectorize';
import { buildTimelineContinuationPrompt } from '@/components/agents/prompts/timeline-continuation';
import { generateTimelineSummary, shouldGenerateSummary, getNextSummaryRange, SUMMARY_BATCH_SIZE } from '@/lib/timeline-summary';
import type { TimelineReport } from '@/lib/types';

const ContinuationComparisonSchema = z.object({
  changes: z.array(z.string()).max(5).describe('Up to 5 key differences between the latest screenshots'),
  implication: z.string().describe('One line explaining the possible significance or "so what" of these changes'),
  strategicView: z.string().describe('How this fits into the overall timeline progression and strategic direction')
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const requestStartTime = Date.now();
  console.log('[TIMING] === API ROUTE HIT ===', new Date().toISOString());

  try {
    const { id: timelineId } = await params;
    console.log('[TIMING] Params resolved in', Date.now() - requestStartTime, 'ms');

    console.log('[TIMING] About to parse JSON body...');

    // Check Content-Length header
    const contentLength = request.headers.get('content-length');
    console.log('[VALIDATION] Request Content-Length:', contentLength, 'bytes', contentLength ? `(${(parseInt(contentLength, 10) / 1024 / 1024).toFixed(2)} MB)` : '');

    const body = await request.json();
    console.log('[TIMING] ✓ JSON parsed successfully in', Date.now() - requestStartTime, 'ms');

    const { imageName, imageType, imageData, previousImageData, previousContext, previousScreenshotId, allReports, screenshotCount } = body;

    // Use Content-Length header instead of re-stringifying body (performance optimization)
    // Validate Content-Length is a valid positive integer before parsing
    const isValidContentLength = contentLength && /^\d+$/.test(contentLength);
    const bodySize = isValidContentLength ? parseInt(contentLength, 10) : 0;
    console.log('[VALIDATION] Parsed body size:', (bodySize / 1024 / 1024).toFixed(2), 'MB');
    console.log('[TIMING] Timeline add screenshot request:', {
      timelineId,
      imageName,
      imageType,
      imageDataSizeMB: (imageData?.length / 1024 / 1024).toFixed(2),
      previousImageSizeMB: (previousImageData?.length / 1024 / 1024).toFixed(2),
      totalBodySizeMB: (bodySize / 1024 / 1024).toFixed(2)
    });

    if (!imageData) {
      return NextResponse.json({ error: 'Image data is required' }, { status: 400 });
    }

    // Validate image size (estimate from data URL length)
    const imageSizeBytes = (imageData.length * 3) / 4; // Approximate decoded size
    console.log('[TIMING] Image validation. Estimated size:', (imageSizeBytes / 1024 / 1024).toFixed(2), 'MB, elapsed:', Date.now() - requestStartTime, 'ms');

    if (imageSizeBytes > 10 * 1024 * 1024) {
      console.error('Image too large:', imageSizeBytes);
      return NextResponse.json({ error: 'Image file is too large. Please use an image under 10MB.' }, { status: 400 });
    }

    if (!previousImageData) {
      return NextResponse.json({ error: 'Previous image data is required for comparison' }, { status: 400 });
    }

    if (!previousScreenshotId) {
      return NextResponse.json({ error: 'Previous screenshot ID is required for linking reports' }, { status: 400 });
    }

    // Validate imageData format before extracting base64
    if (typeof imageData !== 'string' || !imageData) {
      return NextResponse.json({ error: 'Image data must be a non-empty string' }, { status: 400 });
    }

    // Extract base64 from data URLs for response (we'll send full data URLs to OpenAI)
    // Validate it's a proper data URL format before splitting
    const dataUrlPattern = /^data:[\w/+.-]+;base64,/;
    let imageBase64: string;

    if (dataUrlPattern.test(imageData)) {
      imageBase64 = imageData.split(',')[1];
    } else if (imageData.includes(',')) {
      // Has comma but doesn't match data URL pattern
      return NextResponse.json({
        error: 'Invalid image format. Expected base64 data URL format: data:image/[type];base64,[data]'
      }, { status: 400 });
    } else {
      // Assume raw base64 (no data URL prefix)
      imageBase64 = imageData;
    }

    console.log('[TIMING] Starting AI comparison... elapsed:', Date.now() - requestStartTime, 'ms');
    const aiStartTime = Date.now();

    // Add timeout wrapper for AI generation
    const comparisonPromise = generateObject({
      model: openai('gpt-4o'),
      schema: ContinuationComparisonSchema,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: buildTimelineContinuationPrompt(previousContext)
            },
            {
              type: 'image',
              image: previousImageData
            },
            {
              type: 'image',
              image: imageData
            }
          ]
        }
      ]
    });

    // Create timeout promise (45s to allow for larger images)
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('AI analysis timed out after 45 seconds')), 45000);
    });

    // Race between AI generation and timeout
    const aiResult = await Promise.race([comparisonPromise, timeoutPromise]);
    const aiDuration = ((Date.now() - aiStartTime) / 1000).toFixed(2);
    console.log('[TIMING] AI analysis completed in', aiDuration, 'seconds, total elapsed:', Date.now() - requestStartTime, 'ms');

    // Type assertion for the Promise.race result
    if (!aiResult || typeof aiResult !== 'object' || !('object' in aiResult)) {
      throw new Error('Invalid AI response format');
    }

    const { object: comparison } = aiResult as { object: z.infer<typeof ContinuationComparisonSchema> };

    console.log('AI comparison completed successfully');

    // Retrieve product psychology insights (non-blocking - fail gracefully)
    let psychologyInsights: Awaited<ReturnType<typeof getProductPsychologyInsights>> = [];
    try {
      const retrievalContext = `Timeline continuation. Previous context: ${previousContext}. New changes: ${comparison.changes.join('; ')}. Implication: ${comparison.implication}. Strategic view: ${comparison.strategicView}`;
      psychologyInsights = await getProductPsychologyInsights(retrievalContext);
      console.log('[INSIGHTS] Successfully retrieved', psychologyInsights.length, 'psychology insights');
    } catch (insightError) {
      // Log the error but don't fail the request
      console.error('[INSIGHTS] Failed to retrieve psychology insights:', insightError);
      if (insightError instanceof Error) {
        console.error('[INSIGHTS] Error details:', insightError.message);
      }
      // Set to empty array so the request can continue without insights
      psychologyInsights = [];
    }

    const reportId = crypto.randomUUID();
    const screenshotId = crypto.randomUUID();

    const continuationReport = {
      id: reportId,
      type: 'continuation' as const,
      fromScreenshotId: previousScreenshotId,
      toScreenshotId: screenshotId,
      changes: comparison.changes,
      implication: comparison.implication,
      strategicView: comparison.strategicView,
      // Only include insights if array is non-empty
      psychologyInsights: psychologyInsights.length > 0 ? psychologyInsights : undefined,
      timestamp: new Date().toISOString()
    };

    // Check if we should generate a summary (server-side)
    let summaryReport = null;
    if (allReports && Array.isArray(allReports)) {
      const continuationReports = [...allReports.filter((r: TimelineReport) => r.type === 'continuation' || r.type === 'initial'), continuationReport];
      const existingSummaries = allReports.filter((r: TimelineReport) => r.type === 'summary');

      console.log(`[TIMELINE_SUMMARY] Debug: allReports.length=${allReports.length}, continuationReports.length=${continuationReports.length}, existingSummaries.length=${existingSummaries.length}`);
      console.log(`[TIMELINE_SUMMARY] Debug: shouldGenerateSummary(${continuationReports.length}, ${existingSummaries.length}) = ${shouldGenerateSummary(continuationReports.length, existingSummaries.length)}`);

      if (shouldGenerateSummary(continuationReports.length, existingSummaries.length)) {
        console.log(`[TIMELINE_SUMMARY] Should generate summary. Total reports: ${continuationReports.length}, existing summaries: ${existingSummaries.length}`);

        try {
          const summaryRange = getNextSummaryRange(continuationReports.length, existingSummaries.length);
          if (summaryRange) {
            console.log(`[TIMELINE_SUMMARY] Generating summary for reports ${summaryRange.startIndex}-${summaryRange.endIndex}`);
            const reportsToSummarize = continuationReports.slice(summaryRange.startIndex, summaryRange.endIndex + 1);
            const summary = await generateTimelineSummary(reportsToSummarize, summaryRange.startIndex, summaryRange.endIndex);

            // The summary should link to the screenshot at summaryRange.endIndex
            // We need to figure out which screenshot ID that is
            // If we're at the 5th report (endIndex=4), that's the 5th screenshot (current one)
            // The client will have screenshotCount screenshots BEFORE adding this one
            // So if screenshotCount=4, this new screenshot (screenshotId) is the 5th one
            // summaryRange.endIndex is 0-based report index, screenshotCount is current count before adding
            const isCurrentScreenshot = summaryRange.endIndex === screenshotCount;
            const summaryScreenshotId = isCurrentScreenshot ? screenshotId : continuationReports[summaryRange.endIndex]?.toScreenshotId;

            summaryReport = {
              id: `summary-${crypto.randomUUID()}`,
              type: 'summary' as const,
              toScreenshotId: summaryScreenshotId || screenshotId, // Link to the 5th, 10th, etc. screenshot
              changes: summary.changes,
              implication: `Phase summary: ${summary.phaseTitle}`,
              strategicView: summary.strategicDirection,
              phaseTitle: summary.phaseTitle,
              keyPatterns: summary.keyPatterns,
              strategicDirection: summary.strategicDirection,
              timestamp: new Date().toISOString()
            };

            console.log('[TIMELINE_SUMMARY] Summary generated:', summary.phaseTitle);
          }
        } catch (summaryError) {
          console.error('[TIMELINE_SUMMARY] Failed to generate summary:', summaryError);
          // Continue without summary - it's optional
        }
      }
    }

    const result = {
      timelineId,
      screenshot: {
        id: screenshotId,
        name: imageName,
        size: imageSizeBytes,
        type: imageType,
        data: imageBase64
      },
      report: continuationReport,
      summaryReport // Will be null if no summary needed
    };

    console.log('[TIMING] Timeline addition result prepared, total elapsed:', Date.now() - requestStartTime, 'ms');
    return NextResponse.json(result);
  } catch (error) {
    console.error('Timeline add screenshot error:', error);

    // Provide more specific error messages
    let errorMessage = 'Failed to add screenshot to timeline';
    let statusCode = 500;

    if (error instanceof Error) {
      if (error.message.includes('timed out')) {
        errorMessage = 'AI analysis took too long. Please try again with a smaller image.';
        statusCode = 408; // Request Timeout
      } else if (error.message.includes('OpenAI')) {
        errorMessage = 'AI service is temporarily unavailable. Please try again.';
        statusCode = 503; // Service Unavailable
      } else if (error.message.includes('Invalid')) {
        errorMessage = 'Invalid image format. Please use a valid image file.';
        statusCode = 400; // Bad Request
      }
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
}