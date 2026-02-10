export type SectionType = 'quiz' | 'pre-quiz' | 'post-quiz' | 'lesson' | 'practice' | 'review' | 'onboarding' | 'overall';

export const SECTION_TYPE_OPTIONS: { value: SectionType; label: string }[] = [
  { value: 'pre-quiz', label: 'Pre-Quiz / Diagnostic' },
  { value: 'post-quiz', label: 'Post-Quiz / Assessment' },
  { value: 'quiz', label: 'Quiz / Test' },
  { value: 'lesson', label: 'Lesson / Instruction' },
  { value: 'practice', label: 'Practice / Activity' },
  { value: 'review', label: 'Review / Summary' },
  { value: 'onboarding', label: 'Onboarding / Intro' },
];

export interface UpfrontQuestionOption {
  value: string;
  label: string;
  scoringHint: string;
}

export interface UpfrontQuestion {
  id: string;
  principleIds: string[];
  question: string;
  options: UpfrontQuestionOption[];
  freeTextPrompt: string;
  /** Which section types this question applies to. 'overall' means full experience audits. */
  appliesTo: SectionType[];
}

export interface UpfrontContextAnswers {
  [questionId: string]: {
    selectedOption: string;
    freeText: string;
  };
}

/**
 * Detect section type from section name
 */
export function detectSectionType(sectionName: string): SectionType {
  const name = sectionName.toLowerCase();

  // Pre-quiz patterns (check BEFORE generic quiz)
  if (/pre[- ]?(lesson|quiz|test|assessment)|diagnostic|baseline|placement/.test(name)) {
    return 'pre-quiz';
  }

  // Post-quiz patterns (check BEFORE generic quiz)
  if (/post[- ]?(lesson|quiz|test|assessment)|final|summative/.test(name)) {
    return 'post-quiz';
  }

  // Generic Quiz/Assessment patterns
  if (/quiz|test|assessment|exam|check|question/.test(name)) {
    return 'quiz';
  }

  // Practice/Activity patterns
  if (/practice|exercise|activity|game|drill|challenge/.test(name)) {
    return 'practice';
  }

  // Review patterns
  if (/review|summary|recap|revisit|refresh/.test(name)) {
    return 'review';
  }

  // Onboarding patterns
  if (/onboard|welcome|intro|getting started|tutorial/.test(name)) {
    return 'onboarding';
  }

  // Lesson/Instruction patterns (default for content-like sections)
  if (/lesson|instruction|content|learn|module|video|lecture|read/.test(name)) {
    return 'lesson';
  }

  // Default to lesson for unrecognized names
  return 'lesson';
}

/**
 * Get unique section types from a list of section names
 */
export function getSectionTypes(sectionNames: string[]): SectionType[] {
  const types = new Set<SectionType>();
  for (const name of sectionNames) {
    types.add(detectSectionType(name));
  }
  return Array.from(types);
}

/**
 * Filter questions based on detected section types
 */
export function getRelevantQuestions(sectionNames: string[]): UpfrontQuestion[] {
  const types = getSectionTypes(sectionNames);

  // If multiple section types, include 'overall' questions too
  const includeOverall = types.length > 1;

  return upfrontQuestions.filter((q) => {
    // Check if question applies to any of the detected section types
    const matchesSectionType = q.appliesTo.some((t) => types.includes(t));

    // Include overall questions if auditing multiple section types
    const isOverallQuestion = q.appliesTo.includes('overall');

    return matchesSectionType || (includeOverall && isOverallQuestion);
  });
}

/**
 * Get applicable principle IDs for a given section type
 * Used by analyze.ts to filter which principles to include in the AI prompt
 */
export function getApplicablePrincipleIds(
  sectionType: SectionType,
  allPrincipleIds: string[],
  principleAppliesTo: Record<string, SectionType[]>
): string[] {
  return allPrincipleIds.filter((id) => {
    const appliesTo = principleAppliesTo[id];
    // If no appliesTo defined, apply to all (fallback)
    if (!appliesTo || appliesTo.length === 0) return true;
    // Check if principle applies to this section type
    return appliesTo.includes(sectionType);
  });
}

export const upfrontQuestions: UpfrontQuestion[] = [
  // === OVERALL / MULTI-SECTION QUESTIONS ===
  {
    id: 'spaced-learning',
    principleIds: ['spaced-repetition'],
    question: 'How does your learning experience handle review and repetition over time?',
    appliesTo: ['overall', 'review'],
    options: [
      {
        value: 'none',
        label: 'Learning happens in a single session with no planned follow-up',
        scoringHint: 'No spaced repetition implemented - score 1',
      },
      {
        value: 'manual-review',
        label: 'Users can return to review content, but timing is up to them',
        scoringHint: 'Minimal spacing - user-directed only - score 2',
      },
      {
        value: 'reminders',
        label: 'The system sends reminders or notifications to return and practice',
        scoringHint: 'Some spaced repetition via reminders - score 3',
      },
      {
        value: 'scheduled-review',
        label: 'Content automatically resurfaces for review at set intervals',
        scoringHint: 'Structured spaced repetition with fixed intervals - score 4',
      },
      {
        value: 'adaptive-spacing',
        label: 'Review timing adapts based on how well the user remembered content',
        scoringHint: 'Adaptive spaced repetition (e.g., SM-2 algorithm) - score 5',
      },
    ],
    freeTextPrompt: 'Describe any other spacing or review features:',
  },

  // === QUIZ / ASSESSMENT QUESTIONS ===
  {
    id: 'quiz-feedback',
    principleIds: ['retrieval-practice', 'elaboration'],
    question: 'What kind of feedback do learners receive on quiz questions?',
    appliesTo: ['quiz', 'pre-quiz', 'post-quiz'],
    options: [
      {
        value: 'none',
        label: 'No feedback - just a final score',
        scoringHint: 'No feedback on individual questions - retrieval practice score 2, elaboration score 1',
      },
      {
        value: 'correct-incorrect',
        label: 'Shows whether each answer was correct or incorrect',
        scoringHint: 'Basic correctness feedback - retrieval practice score 3, elaboration score 2',
      },
      {
        value: 'correct-answer',
        label: 'Shows the correct answer after incorrect responses',
        scoringHint: 'Answer revelation feedback - retrieval practice score 3-4, elaboration score 2-3',
      },
      {
        value: 'explanation',
        label: 'Explains WHY the answer is correct or incorrect',
        scoringHint: 'Explanatory feedback - retrieval practice score 4, elaboration score 4',
      },
      {
        value: 'adaptive-explanation',
        label: 'Provides personalized explanations based on the specific mistake',
        scoringHint: 'Adaptive explanatory feedback - retrieval practice score 5, elaboration score 5',
      },
    ],
    freeTextPrompt: 'Describe the feedback learners receive:',
  },
  {
    id: 'quiz-randomization',
    principleIds: ['interleaving', 'desirable-difficulties'],
    question: 'How are questions presented in this quiz?',
    appliesTo: ['quiz', 'post-quiz'],  // Not pre-quiz (can't interleave topics not yet taught)
    options: [
      {
        value: 'fixed',
        label: 'Same questions in the same order every time',
        scoringHint: 'Fixed question order - interleaving score 1-2',
      },
      {
        value: 'shuffled',
        label: 'Question order is randomized',
        scoringHint: 'Randomized order - interleaving score 3',
      },
      {
        value: 'pool',
        label: 'Questions are drawn from a larger pool',
        scoringHint: 'Question pool with variation - interleaving score 3-4',
      },
      {
        value: 'mixed-topics',
        label: 'Questions from different topics are mixed together',
        scoringHint: 'Topic interleaving within quiz - interleaving score 4',
      },
      {
        value: 'adaptive-selection',
        label: 'Questions are selected based on learner performance',
        scoringHint: 'Adaptive question selection - interleaving score 4-5, desirable-difficulties score 4-5',
      },
    ],
    freeTextPrompt: 'Describe how questions are selected or ordered:',
  },

  // === PRACTICE / ACTIVITY QUESTIONS ===
  {
    id: 'practice-difficulty',
    principleIds: ['deliberate-practice', 'desirable-difficulties'],
    question: 'How does difficulty progress in practice activities?',
    appliesTo: ['practice'],
    options: [
      {
        value: 'fixed',
        label: 'Same difficulty throughout',
        scoringHint: 'No difficulty progression - deliberate-practice score 1-2',
      },
      {
        value: 'user-selected',
        label: 'User chooses difficulty level',
        scoringHint: 'User-controlled difficulty - deliberate-practice score 2-3',
      },
      {
        value: 'linear',
        label: 'Difficulty increases as user progresses',
        scoringHint: 'Linear difficulty progression - deliberate-practice score 3',
      },
      {
        value: 'adaptive',
        label: 'Difficulty adjusts based on performance',
        scoringHint: 'Adaptive difficulty - deliberate-practice score 4',
      },
      {
        value: 'targeted',
        label: 'System targets weak areas with appropriate challenge',
        scoringHint: 'Targeted practice at edge of ability - deliberate-practice score 5',
      },
    ],
    freeTextPrompt: 'Describe how difficulty is managed:',
  },
  {
    id: 'practice-mixing',
    principleIds: ['interleaving'],
    question: 'How are different skills or topics mixed in practice?',
    appliesTo: ['practice'],
    options: [
      {
        value: 'blocked',
        label: 'One skill/topic at a time until mastered',
        scoringHint: 'Blocked practice - interleaving score 1-2',
      },
      {
        value: 'sequential',
        label: 'Topics introduced one at a time but occasionally revisited',
        scoringHint: 'Sequential with some review - interleaving score 2-3',
      },
      {
        value: 'mixed',
        label: 'Multiple topics/skills mixed within sessions',
        scoringHint: 'Interleaved practice - interleaving score 3-4',
      },
      {
        value: 'randomized',
        label: 'Random mixing of topics - learner can\'t predict what\'s next',
        scoringHint: 'Randomized interleaving - interleaving score 4',
      },
      {
        value: 'cumulative',
        label: 'All previously learned topics can appear at any time',
        scoringHint: 'Cumulative interleaving - interleaving score 5',
      },
    ],
    freeTextPrompt: 'Describe how topics are mixed in practice:',
  },

  // === LESSON / INSTRUCTION QUESTIONS ===
  {
    id: 'lesson-pacing',
    principleIds: ['cognitive-load-theory', 'chunking'],
    question: 'How is content paced and chunked in lessons?',
    appliesTo: ['lesson'],
    options: [
      {
        value: 'continuous',
        label: 'Content flows continuously without breaks',
        scoringHint: 'No chunking or pacing control - cognitive-load score 2, chunking score 1-2',
      },
      {
        value: 'sections',
        label: 'Content is divided into sections but auto-advances',
        scoringHint: 'Some structure but no user control - cognitive-load score 3, chunking score 3',
      },
      {
        value: 'self-paced',
        label: 'Learner controls when to move to next section',
        scoringHint: 'Self-paced with chunks - cognitive-load score 4, chunking score 4',
      },
      {
        value: 'interactive-chunks',
        label: 'Small chunks with interactions/checks between them',
        scoringHint: 'Interactive chunking - cognitive-load score 4-5, chunking score 4-5',
      },
      {
        value: 'adaptive-pacing',
        label: 'Pacing adapts based on learner comprehension',
        scoringHint: 'Adaptive pacing - cognitive-load score 5, chunking score 5',
      },
    ],
    freeTextPrompt: 'Describe how content is paced:',
  },
  {
    id: 'lesson-elaboration',
    principleIds: ['elaboration', 'self-explanation'],
    question: 'How does the lesson encourage deeper processing?',
    appliesTo: ['lesson'],
    options: [
      {
        value: 'passive',
        label: 'Content is presented for passive consumption (reading/watching)',
        scoringHint: 'Passive learning only - elaboration score 1-2, self-explanation score 1',
      },
      {
        value: 'examples',
        label: 'Includes worked examples showing how concepts apply',
        scoringHint: 'Examples provided - elaboration score 2-3, self-explanation score 2',
      },
      {
        value: 'questions',
        label: 'Asks comprehension questions throughout',
        scoringHint: 'Embedded questions - elaboration score 3, self-explanation score 3',
      },
      {
        value: 'explain-prompts',
        label: 'Prompts learners to explain concepts in their own words',
        scoringHint: 'Self-explanation prompts - elaboration score 4, self-explanation score 4',
      },
      {
        value: 'generation',
        label: 'Learners must generate examples or explanations before seeing answers',
        scoringHint: 'Generation before instruction - elaboration score 5, self-explanation score 5',
      },
    ],
    freeTextPrompt: 'Describe how learners engage with content:',
  },

  // === ONBOARDING QUESTIONS ===
  {
    id: 'onboarding-efficacy',
    principleIds: ['self-efficacy', 'growth-mindset'],
    question: 'How does onboarding build learner confidence?',
    appliesTo: ['onboarding'],
    options: [
      {
        value: 'none',
        label: 'Jumps straight into content without confidence building',
        scoringHint: 'No confidence scaffolding - self-efficacy score 1-2',
      },
      {
        value: 'overview',
        label: 'Provides an overview of what will be learned',
        scoringHint: 'Goal orientation only - self-efficacy score 2-3',
      },
      {
        value: 'easy-wins',
        label: 'Starts with easy tasks to build early success',
        scoringHint: 'Early wins for confidence - self-efficacy score 4',
      },
      {
        value: 'personalized',
        label: 'Assesses prior knowledge and starts at appropriate level',
        scoringHint: 'Personalized starting point - self-efficacy score 4-5',
      },
      {
        value: 'growth-framing',
        label: 'Explicitly frames learning as growth, normalizes mistakes',
        scoringHint: 'Growth mindset framing - self-efficacy score 5, growth-mindset score 4-5',
      },
    ],
    freeTextPrompt: 'Describe how onboarding builds confidence:',
  },
];
