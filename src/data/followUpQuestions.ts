import { type SectionType, getSectionTypes } from './upfrontQuestions';

export interface FollowUpQuestionData {
  options: string[];
  freeTextPrompt: string;
  appliesTo: SectionType[];
}

export const followUpQuestions: Record<string, FollowUpQuestionData> = {
  'spaced-repetition': {
    options: [
      'Users receive reminders or notifications to return and review',
      'Previously learned content reappears in later sessions',
      'There is a dedicated review or practice mode users can access anytime',
      'The app tracks performance and resurfaces content users struggled with',
      'Review intervals are based on how well users remembered content',
    ],
    freeTextPrompt: 'Describe any spaced learning or review features not visible in the screenshots:',
    appliesTo: ['review', 'overall'],
  },
  'retrieval-practice': {
    options: [
      'Users must recall answers before seeing them (not just recognize from options)',
      'Quizzes or knowledge checks are included throughout the experience',
      'Flashcards or recall-based exercises are available',
      'Users type, speak, or write answers from memory',
      'Practice questions require applying knowledge, not just recognition',
    ],
    freeTextPrompt: 'Describe any recall-based or retrieval activities:',
    appliesTo: ['quiz', 'pre-quiz', 'post-quiz', 'practice', 'review'],
  },
  'elaboration': {
    options: [
      'Users are prompted to explain concepts in their own words',
      '"Why" and "how" questions are asked throughout the content',
      'Learners connect new information to things they already know',
      'Reflection or journaling prompts are included',
      'Users teach or explain concepts to others (peers, AI, etc.)',
    ],
    freeTextPrompt: 'Describe how learners are encouraged to explain or elaborate on content:',
    appliesTo: ['quiz', 'pre-quiz', 'post-quiz', 'lesson', 'practice'],
  },
  'interleaving': {
    options: [
      'Different topics or problem types are mixed within practice sessions',
      'Questions from previous lessons appear alongside new content',
      'Users cannot predict which type of problem will come next',
      'Related but distinct concepts are compared side-by-side',
      'Practice requires choosing which strategy or approach to use',
    ],
    freeTextPrompt: 'Describe how different topics or skills are mixed in practice:',
    appliesTo: ['quiz', 'post-quiz', 'practice', 'review'],  // Not pre-quiz (can't interleave unlearned content)
  },
  'desirable-difficulties': {
    options: [
      'Learners must generate answers before seeing solutions',
      'Content intentionally includes productive struggle or challenge',
      'Hints are available but not given automatically',
      'Practice gets harder as learners improve',
      'Learners work through difficulties before receiving help',
    ],
    freeTextPrompt: 'Describe any intentional challenges designed to improve long-term learning:',
    appliesTo: ['quiz', 'post-quiz', 'practice'],  // Not pre-quiz (diagnostic, not about productive struggle)
  },
  'deliberate-practice': {
    options: [
      'The system identifies specific skills or knowledge gaps',
      'Practice focuses on areas where the learner is weakest',
      'Immediate, specific feedback is provided on performance',
      'Difficulty adjusts based on individual learner performance',
      'Learners can target specific skills they want to improve',
    ],
    freeTextPrompt: 'Describe how practice targets individual weaknesses:',
    appliesTo: ['practice'],
  },
  'cognitive-load-theory': {
    options: [
      'Complex information is broken into smaller, sequential steps',
      'Extraneous or decorative elements have been minimized',
      'Text and visuals are integrated (not separated)',
      'Worked examples show step-by-step solutions',
      'Learners can control the pace of information delivery',
    ],
    freeTextPrompt: 'Describe how you manage complexity for learners:',
    appliesTo: ['quiz', 'pre-quiz', 'post-quiz', 'lesson', 'practice', 'onboarding'],
  },
  'chunking': {
    options: [
      'Content is organized into clear modules, units, or sections',
      'Related information is grouped together meaningfully',
      'Progress indicators show where learners are in the overall structure',
      'Each chunk can be completed in a reasonable amount of time',
      'Summaries or overviews help learners see how pieces connect',
    ],
    freeTextPrompt: 'Describe how content is organized and grouped:',
    appliesTo: ['lesson', 'onboarding'],
  },
  'growth-mindset': {
    options: [
      'Feedback emphasizes effort and strategy, not just correctness',
      'Mistakes are framed as learning opportunities',
      'Messaging encourages persistence through challenges',
      'Success stories highlight growth and improvement over time',
      'Language avoids fixed-ability labels (smart, talented, etc.)',
    ],
    freeTextPrompt: 'Describe messaging or feedback that promotes a growth mindset:',
    appliesTo: ['quiz', 'pre-quiz', 'post-quiz', 'lesson', 'practice', 'onboarding'],
  },
  'self-efficacy': {
    options: [
      'Early tasks are designed to be achievable for beginners',
      'Difficulty gradually increases as skills develop',
      'Positive feedback celebrates progress and achievements',
      'Learners can see examples of others succeeding',
      'There are clear indicators of progress and improvement',
    ],
    freeTextPrompt: 'Describe how you build learner confidence:',
    appliesTo: ['quiz', 'pre-quiz', 'post-quiz', 'lesson', 'practice', 'onboarding'],
  },
  'metacognition': {
    options: [
      'Learners are prompted to plan before starting a task',
      'Self-assessment or confidence ratings are collected',
      'Reflection prompts ask learners what they learned',
      'Learners can see their own performance patterns over time',
      'Prompts help learners identify what they know vs. don\'t know',
    ],
    freeTextPrompt: 'Describe how learners monitor or reflect on their own learning:',
    appliesTo: ['quiz', 'pre-quiz', 'post-quiz', 'lesson', 'practice', 'review'],
  },
  'self-explanation': {
    options: [
      'Learners are asked to explain their reasoning for answers',
      'Prompts ask "why" an answer is correct or incorrect',
      'Learners articulate steps in a process or solution',
      'Explanations are required before moving forward',
      'Learners compare their reasoning to expert explanations',
    ],
    freeTextPrompt: 'Describe how learners explain content to themselves:',
    appliesTo: ['quiz', 'pre-quiz', 'post-quiz', 'lesson', 'practice'],
  },
  'transfer-of-learning': {
    options: [
      'The same concept is shown in multiple different contexts',
      'Underlying principles or patterns are made explicit',
      'Learners apply knowledge to novel or real-world scenarios',
      'Examples vary in surface features while sharing deep structure',
      'Connections to other domains or applications are highlighted',
    ],
    freeTextPrompt: 'Describe how learners apply knowledge to new contexts:',
    appliesTo: ['lesson', 'practice', 'overall'],
  },
};

/**
 * Filter follow-up principles to only those relevant for the given section types
 */
export function getRelevantFollowUpPrinciples(
  principleIds: string[],
  sectionNames: string[]
): string[] {
  const types = getSectionTypes(sectionNames);
  const includeOverall = types.length > 1;

  return principleIds.filter((id) => {
    const questionData = followUpQuestions[id];
    if (!questionData) return false;

    const matchesSectionType = questionData.appliesTo.some((t) => types.includes(t));
    const isOverallQuestion = questionData.appliesTo.includes('overall');

    return matchesSectionType || (includeOverall && isOverallQuestion);
  });
}
