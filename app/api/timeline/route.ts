import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const CreateTimelineSchema = z.object({
  comparisonId: z.string(),
  title: z.string().optional()
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { comparisonId, title } = CreateTimelineSchema.parse(body);

    const timelineId = `timeline-${Math.random().toString(36).substring(2, 15)}`;

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