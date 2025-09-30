import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import crypto from 'crypto';

const CreateTimelineSchema = z.object({
  comparisonId: z.string(),
  title: z.string().optional()
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { comparisonId, title } = CreateTimelineSchema.parse(body);

    const timelineId = `timeline-${crypto.randomUUID()}`;

    return NextResponse.json({
      id: timelineId,
      comparisonId,
      title,
      created: true
    });
  } catch (error) {
    console.error('Timeline creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create timeline' },
      { status: 500 }
    );
  }
}