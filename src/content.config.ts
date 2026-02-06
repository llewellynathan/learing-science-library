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
  }),
});

export const collections = { principles };
