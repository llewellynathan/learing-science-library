import type { APIRoute } from 'astro';
import Anthropic from '@anthropic-ai/sdk';
import { auditData } from '../../data/auditPrompts';

export const prerender = false;

interface ScoreResult {
  score: number;
  reasoning: string;
  confidence: 'high' | 'medium' | 'low';
  notApplicable?: boolean;
}

interface AnalysisResult {
  scores: Record<string, ScoreResult>;
}

function buildPrompt(sectionName?: string, sectionNotes?: string): string {
  let prompt = '';

  if (sectionName) {
    prompt = `You are an expert in learning science and instructional design. You are analyzing screenshots from ONE SECTION of a larger learning experience.

This section is: "${sectionName}"
`;

    if (sectionNotes) {
      prompt += `
The user has provided additional context about behaviors not visible in the screenshots:
"${sectionNotes}"

Consider BOTH the screenshots AND this context when scoring. The notes may describe dynamic behaviors like randomization, adaptive difficulty, spaced repetition timing, or personalization that cannot be seen in static images.

`;
    }

    prompt += `
For each of the 13 learning science principles below:
1. If the principle IS relevant to this type of section:
   - Provide a score from 1-5 based on the rubric criteria
   - Provide brief reasoning (1-2 sentences) explaining your score
   - Provide confidence level: "high", "medium", or "low"
   - Set "notApplicable" to false

2. If the principle is NOT relevant or cannot be assessed for this section type:
   - Set "notApplicable" to true
   - Set score to 0
   - Explain briefly why it doesn't apply to this section
   - For example: Spaced repetition timing can't be assessed from a single lesson section

`;
  } else {
    prompt = `You are an expert in learning science and instructional design. Analyze the provided screenshots of a learning experience and evaluate it against each of the following 13 essential learning science principles.

For each principle, provide:
1. A score from 1-5 based on the rubric criteria below
2. A brief reasoning (1-2 sentences) explaining your score based on what you observe
3. A confidence level: "high" if clearly visible, "medium" if partially visible, "low" if you're inferring or can't fully assess from screenshots

IMPORTANT: Some principles (like spaced repetition timing or long-term transfer) may not be fully assessable from static screenshots. Use "low" confidence for these and note what you cannot determine.

`;
  }

  prompt += `Here are the 13 principles with their scoring rubrics:

`;

  for (const [id, data] of Object.entries(auditData)) {
    prompt += `## ${id}\n`;
    prompt += `Question: ${data.prompt}\n`;
    prompt += `Rubric:\n`;
    for (let i = 1; i <= 5; i++) {
      const level = data.rubric[i];
      prompt += `  ${i} - ${level.label}: ${level.description}\n`;
    }
    prompt += `\n`;
  }

  prompt += `
Respond in valid JSON format only, with no additional text:
{
  "scores": {
    "principle-id": {
      "score": <1-5 or 0 if not applicable>,
      "reasoning": "<brief explanation>",
      "confidence": "<high|medium|low>",
      "notApplicable": <true|false>
    },
    ...
  }
}

Analyze the screenshots now and provide your assessment.`;

  return prompt;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const apiKey = import.meta.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { images, sectionName, sectionNotes } = await request.json();

    if (!images || !Array.isArray(images) || images.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No images provided' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (images.length > 5) {
      return new Response(
        JSON.stringify({ error: 'Maximum 5 images allowed per section' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const client = new Anthropic({ apiKey });

    const imageContent: Anthropic.ImageBlockParam[] = images.map((img: { data: string; mediaType: string }) => ({
      type: 'image' as const,
      source: {
        type: 'base64' as const,
        media_type: img.mediaType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
        data: img.data,
      },
    }));

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: [
            ...imageContent,
            {
              type: 'text',
              text: buildPrompt(sectionName, sectionNotes),
            },
          ],
        },
      ],
    });

    const textContent = response.content.find((block) => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from API');
    }

    // Parse the JSON response
    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse JSON from response');
    }

    const result: AnalysisResult = JSON.parse(jsonMatch[0]);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Analysis error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Analysis failed' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
