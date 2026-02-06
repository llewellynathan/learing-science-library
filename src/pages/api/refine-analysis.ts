import type { APIRoute } from 'astro';
import Anthropic from '@anthropic-ai/sdk';
import { auditData } from '../../data/auditPrompts';

export const prerender = false;

interface FollowUpAnswer {
  principleId: string;
  selectedOptions: string[];
  freeText: string;
}

interface OriginalScore {
  principleId: string;
  title: string;
  score: number;
  reasoning: string;
}

interface RefinedScore {
  principleId: string;
  originalScore: number;
  refinedScore: number;
  refinedReasoning: string;
  specificActions: string[];
}

function buildRefinePrompt(
  originalScores: OriginalScore[],
  answers: FollowUpAnswer[]
): string {
  let prompt = `You are an expert in learning science. You previously analyzed a learning experience and scored it on several principles. The user has now provided additional context about features that may not have been visible in screenshots.

For each principle below, consider the new information and:
1. Decide if the score should be adjusted (it can stay the same, go up, or rarely go down)
2. Provide updated reasoning that incorporates the new context
3. Provide 2-3 specific, actionable recommendations for improvement

Here are the principles that need refinement:

`;

  for (const original of originalScores) {
    const answer = answers.find((a) => a.principleId === original.principleId);
    const rubric = auditData[original.principleId]?.rubric;

    prompt += `---
## ${original.title} (ID: ${original.principleId})

**Original Score:** ${original.score}/5
**Original Reasoning:** "${original.reasoning}"

`;

    if (rubric) {
      prompt += `**Scoring Rubric:**
`;
      for (let i = 1; i <= 5; i++) {
        prompt += `  ${i} - ${rubric[i].label}: ${rubric[i].description}
`;
      }
      prompt += `
`;
    }

    if (answer) {
      if (answer.selectedOptions.length > 0) {
        prompt += `**User indicates the experience includes:**
${answer.selectedOptions.map((o) => `- ${o}`).join('\n')}

`;
      }
      if (answer.freeText.trim()) {
        prompt += `**Additional context from user:**
"${answer.freeText}"

`;
      }
      if (answer.selectedOptions.length === 0 && !answer.freeText.trim()) {
        prompt += `**User provided no additional context for this principle.**

`;
      }
    }
  }

  prompt += `
---

Respond in valid JSON format only, with no additional text:
{
  "refinedScores": [
    {
      "principleId": "<principle-id>",
      "originalScore": <1-5>,
      "refinedScore": <1-5>,
      "refinedReasoning": "<updated reasoning incorporating new context>",
      "specificActions": ["<action 1>", "<action 2>", "<action 3>"]
    },
    ...
  ]
}

Be specific in your recommendations. Reference the user's context when adjusting scores. If no new information warrants a score change, keep the same score but still provide specific actions.`;

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

    const { originalScores, answers } = await request.json();

    if (!originalScores || !Array.isArray(originalScores) || originalScores.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No scores provided' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const client = new Anthropic({ apiKey });

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: buildRefinePrompt(originalScores, answers || []),
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

    const result = JSON.parse(jsonMatch[0]);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Refine analysis error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Analysis failed' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
