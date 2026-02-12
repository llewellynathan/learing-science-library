import { type SectionType } from './upfrontQuestions';

export interface MissingFlowRecommendation {
  sectionType: SectionType;
  priority: 'high' | 'medium' | 'low';
  headline: string;
  recommendation: string;
  whyItMatters: string;
  affectedPrinciples: string[];
}

export const missingFlowRecommendations: MissingFlowRecommendation[] = [
  {
    sectionType: 'practice',
    priority: 'high',
    headline: 'Practice Activities',
    recommendation: 'Add activities where learners apply concepts with immediate feedback.',
    whyItMatters: 'Active practice with feedback is one of the most effective ways to build lasting skills.',
    affectedPrinciples: ['deliberate-practice', 'retrieval-practice', 'interleaving'],
  },
  {
    sectionType: 'quiz',
    priority: 'high',
    headline: 'Knowledge Checks / Quizzes',
    recommendation: 'Add quizzes that require learners to recall information from memory.',
    whyItMatters: 'Retrieval practice strengthens memory and helps identify gaps in understanding.',
    affectedPrinciples: ['retrieval-practice', 'desirable-difficulties'],
  },
  {
    sectionType: 'pre-quiz',
    priority: 'medium',
    headline: 'Diagnostic Assessment',
    recommendation: 'A pre-assessment can personalize learning paths and activate prior knowledge.',
    whyItMatters: 'Diagnostic assessments help calibrate instruction to learner needs.',
    affectedPrinciples: ['metacognition'],
  },
  {
    sectionType: 'post-quiz',
    priority: 'medium',
    headline: 'Summative Assessment',
    recommendation: 'Add a final assessment to measure learning outcomes and provide closure.',
    whyItMatters: 'Summative assessments verify mastery and provide meaningful feedback on progress.',
    affectedPrinciples: ['retrieval-practice', 'metacognition'],
  },
  {
    sectionType: 'review',
    priority: 'medium',
    headline: 'Review / Spaced Practice',
    recommendation: 'Include activities that revisit content over time to combat forgetting.',
    whyItMatters: 'Spaced review dramatically improves long-term retention.',
    affectedPrinciples: ['spaced-repetition'],
  },
];

export function getMissingFlowRecommendations(
  presentTypes: SectionType[]
): MissingFlowRecommendation[] {
  const priorityOrder = { high: 0, medium: 1, low: 2 };

  return missingFlowRecommendations
    .filter((rec) => {
      // Don't suggest if this type is present
      if (presentTypes.includes(rec.sectionType)) return false;

      // Don't suggest quiz if pre-quiz, post-quiz, or quiz is present (any quiz counts)
      if (rec.sectionType === 'quiz' &&
          (presentTypes.includes('pre-quiz') || presentTypes.includes('post-quiz'))) {
        return false;
      }

      return true;
    })
    .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
}
