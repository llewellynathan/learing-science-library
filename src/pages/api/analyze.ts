import type { APIRoute } from 'astro';
import Anthropic from '@anthropic-ai/sdk';
import { auditData } from '../../data/auditPrompts';
import {
  upfrontQuestions,
  detectSectionType,
  getApplicablePrincipleIds,
  type UpfrontContextAnswers,
  type SectionType,
} from '../../data/upfrontQuestions';
import { MAX_IMAGES_PER_SECTION } from '../../config/constants';

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

function buildUpfrontContextSection(upfrontContext: UpfrontContextAnswers): string {
  if (!upfrontContext || Object.keys(upfrontContext).length === 0) {
    return '';
  }

  let section = `
IMPORTANT CONTEXT ABOUT THE OVERALL LEARNING EXPERIENCE:
The user has provided information about behaviors that cannot be assessed from screenshots alone. Use this context to inform your scoring of the relevant principles.

`;

  for (const [questionId, answer] of Object.entries(upfrontContext)) {
    const question = upfrontQuestions.find((q) => q.id === questionId);
    if (!question) continue;

    const selectedOption = question.options.find((o) => o.value === answer.selectedOption);
    if (selectedOption) {
      section += `**${question.question}**
User selected: "${selectedOption.label}"
Scoring guidance: ${selectedOption.scoringHint}
Affects principles: ${question.principleIds.join(', ')}
`;
      if (answer.freeText && answer.freeText.trim()) {
        section += `Additional context: "${answer.freeText}"
`;
      }
      section += `
`;
    }
  }

  section += `Use this context when scoring the affected principles. These principles may receive higher scores if the user's context indicates implementation beyond what's visible in screenshots.

`;

  return section;
}

function buildPrompt(
  sectionName?: string,
  resolvedSectionType?: SectionType,
  sectionNotes?: string,
  upfrontContext?: UpfrontContextAnswers
): string {
  let prompt = '';

  // Use resolved section type (override or detected)
  const sectionType: SectionType = resolvedSectionType || 'overall';
  const allPrincipleIds = Object.keys(auditData);

  // Build mapping of principle ID to appliesTo array
  const principleAppliesTo: Record<string, SectionType[]> = {};
  for (const [id, data] of Object.entries(auditData)) {
    principleAppliesTo[id] = data.appliesTo;
  }

  // Get only applicable principles for this section type
  const applicablePrincipleIds = getApplicablePrincipleIds(sectionType, allPrincipleIds, principleAppliesTo);
  const applicablePrinciples = applicablePrincipleIds.map((id) => [id, auditData[id]] as const);

  if (sectionName) {
    prompt = `You are an expert in learning science and instructional design. You are analyzing screenshots from ONE SECTION of a larger learning experience.

This section is: "${sectionName}" (detected type: ${sectionType})
`;

    // Add upfront context if provided
    if (upfrontContext && Object.keys(upfrontContext).length > 0) {
      prompt += buildUpfrontContextSection(upfrontContext);
    }

    if (sectionNotes) {
      prompt += `
The user has provided additional section-specific context:
"${sectionNotes}"

Consider BOTH the screenshots AND this context when scoring.

`;
    }

    prompt += `
For each of the ${applicablePrinciples.length} learning science principles below (pre-filtered to be relevant for "${sectionType}" sections):
1. Provide a score from 1-5 based on the rubric criteria
2. Provide brief reasoning (1-2 sentences) explaining your score
3. Provide confidence level: "high", "medium", or "low"
4. Set "notApplicable" to false (these principles were pre-selected as applicable)

Note: Principles not applicable to this section type have already been filtered out.

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

  prompt += `Here are the ${applicablePrinciples.length} principles with their scoring rubrics:

`;

  for (const [id, data] of applicablePrinciples) {
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
      "score": <1-5>,
      "reasoning": "<brief explanation>",
      "confidence": "<high|medium|low>",
      "notApplicable": false
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

    const { images, sectionName, sectionType, sectionNotes, upfrontContext } = await request.json();

    if (!images || !Array.isArray(images) || images.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No images provided' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (images.length > MAX_IMAGES_PER_SECTION) {
      return new Response(
        JSON.stringify({ error: `Maximum ${MAX_IMAGES_PER_SECTION} images allowed per section` }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const client = new Anthropic({ apiKey });

    // Use override if provided, otherwise detect from name
    const resolvedSectionType: SectionType = sectionType || (sectionName ? detectSectionType(sectionName) : 'overall');

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
              text: buildPrompt(sectionName, resolvedSectionType, sectionNotes, upfrontContext),
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

    // Add non-applicable principles to the response
    // so the UI can display them properly
    const allPrincipleIds = Object.keys(auditData);
    const principleAppliesTo: Record<string, SectionType[]> = {};
    for (const [id, data] of Object.entries(auditData)) {
      principleAppliesTo[id] = data.appliesTo;
    }
    const applicablePrincipleIds = getApplicablePrincipleIds(resolvedSectionType, allPrincipleIds, principleAppliesTo);

    // Mark non-applicable principles
    for (const principleId of allPrincipleIds) {
      if (!applicablePrincipleIds.includes(principleId)) {
        result.scores[principleId] = {
          score: 0,
          reasoning: `Not applicable to ${resolvedSectionType} sections`,
          confidence: 'high',
          notApplicable: true,
        };
      }
    }

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
