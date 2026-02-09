import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const principles = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/principles' }),
  schema: z.object({
    title: z.string(),
    category: z.enum([
      'Memory & Retention',
      'Practice & Skill Building',
      'Motivation & Engagement',
      'Cognitive Load',
      'Feedback & Assessment',
      'Transfer & Application',
    ]),
    tags: z.array(z.string()),
    relatedPrinciples: z.array(z.string()).optional(),
    keyResearchers: z.array(z.string()).optional(),
    summary: z.string(),
    essential: z.boolean().optional().default(false),
    // Audience relevance - how critical is this principle for each audience type
    audienceRelevance: z.object({
      learningDesigners: z.enum(['critical', 'high', 'moderate', 'low']).optional(),
      educators: z.enum(['critical', 'high', 'moderate', 'low']).optional(),
      selfLearners: z.enum(['critical', 'high', 'moderate', 'low']).optional(),
    }).optional(),
    // Context relevance - how critical is this principle for each learning context
    contextRelevance: z.object({
      gameBasedLearning: z.enum(['critical', 'high', 'moderate', 'low']).optional(),
      classroomInstruction: z.enum(['critical', 'high', 'moderate', 'low']).optional(),
      elearning: z.enum(['critical', 'high', 'moderate', 'low']).optional(),
      selfStudy: z.enum(['critical', 'high', 'moderate', 'low']).optional(),
    }).optional(),
  }),
});

export const collections = { principles };
