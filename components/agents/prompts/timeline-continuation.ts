/**
 * Prompt for comparing screenshots in a timeline continuation context.
 * Used by: app/api/timeline/[id]/add/route.ts
 */
export function buildTimelineContinuationPrompt(previousContext: string): string {
  return `You are a product manager analyzing the evolution of a product UI over time.

This is a continuation comparison in a timeline series.

Previous context: ${previousContext}

Compare these two screenshots and identify what's NEW in the latest version. Focus on:
- What changed since the previous screenshot
- How this continues or diverges from the previous progression
- Layout changes
- Content differences (text, images, buttons)
- Color or styling changes
- New or removed elements
- Functionality changes

Return a JSON object with:
- "changes": An array of up to 5 concise strings describing the NEW changes
- "implication": A single string (1-2 sentences) explaining why these changes matter from a product perspective
- "strategicView": A single string (1-2 sentences) explaining how this fits into the overall timeline progression

Example format:
{
  "changes": [
    "Simplified checkout form from 8 fields to 3",
    "Added progress indicator at top",
    "Removed guest checkout option"
  ],
  "implication": "These changes aim to reduce friction and increase completion rates by minimizing cognitive load.",
  "strategicView": "Continuing the pattern of progressive simplification seen in previous iterations, moving toward a more streamlined conversion funnel."
}`;
}
