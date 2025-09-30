import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import crypto from 'crypto';
import { getProductPsychologyInsights } from '@/lib/retrieval/vectorize';

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

    const { imageName, imageType, imageData, previousImageData, previousContext, previousScreenshotId } = body;

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
              text: `This is a continuation comparison in a timeline series.

Previous context: ${previousContext}

Compare these two screenshots and identify what's NEW in the latest version. Focus on:
- What changed since the previous screenshot
- How this continues or diverges from the previous progression
- Layout changes
- Content differences (text, images, buttons)
- Color or styling changes
- New or removed elements
- Functionality changes

Provide up to 5 concise bullet points describing the NEW changes, plus:
1. One line explaining why these changes might matter from a product perspective
2. A strategic view of how this fits into the overall timeline progression`
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

    const result = {
      timelineId,
      screenshot: {
        id: screenshotId,
        name: imageName,
        size: imageSizeBytes,
        type: imageType,
        data: imageBase64
      },
      report: {
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
      }
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