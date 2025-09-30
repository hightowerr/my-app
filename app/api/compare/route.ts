import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import crypto from 'crypto';
import { getProductPsychologyInsights } from '@/lib/retrieval/vectorize';

const ComparisonSchema = z.object({
  changes: z.array(z.string()).max(5).describe('Up to 5 key differences between the screenshots'),
  implication: z.string().describe('One line explaining the possible significance or "so what" of these changes')
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const imageA = formData.get('imageA') as File;
    const imageB = formData.get('imageB') as File;

    if (!imageA || !imageB) {
      return NextResponse.json({ error: 'Both images are required' }, { status: 400 });
    }

    // Convert images to base64
    const imageABuffer = await imageA.arrayBuffer();
    const imageBBuffer = await imageB.arrayBuffer();
    const imageABase64 = Buffer.from(imageABuffer).toString('base64');
    const imageBBase64 = Buffer.from(imageBBuffer).toString('base64');

    // Generate comparison using AI
    const { object: comparison } = await generateObject({
      model: openai('gpt-4o'),
      schema: ComparisonSchema,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Compare these two screenshots and identify the key differences. Focus on:
              - Layout changes
              - Content differences (text, images, buttons)
              - Color or styling changes
              - New or removed elements
              - Functionality changes

              Provide up to 5 concise bullet points describing the changes, plus one line explaining why these changes might matter from a product perspective.`
            },
            {
              type: 'image',
              image: `data:${imageA.type};base64,${imageABase64}`
            },
            {
              type: 'image',
              image: `data:${imageB.type};base64,${imageBBase64}`
            }
          ]
        }
      ]
    });

    // Retrieve product psychology insights (non-blocking - fail gracefully)
    let psychologyInsights: Awaited<ReturnType<typeof getProductPsychologyInsights>> = [];
    try {
      const retrievalContext = `Screenshot comparison changes: ${comparison.changes.join('; ')}. Implication: ${comparison.implication}`;
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

    // Generate unique ID for this comparison
    const comparisonId = crypto.randomUUID();

    // In a real app, you'd save this to a database
    // For now, we'll just return the data and handle storage client-side
    const result = {
      id: comparisonId,
      imageA: {
        name: imageA.name,
        size: imageA.size,
        type: imageA.type,
        data: imageABase64
      },
      imageB: {
        name: imageB.name,
        size: imageB.size,
        type: imageB.type,
        data: imageBBase64
      },
      comparison: {
        ...comparison,
        // Only include insights if array is non-empty
        psychologyInsights: psychologyInsights.length > 0 ? psychologyInsights : undefined
      },
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Comparison error:', error);
    return NextResponse.json(
      { error: 'Failed to compare images' },
      { status: 500 }
    );
  }
}