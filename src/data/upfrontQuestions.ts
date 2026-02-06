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
}

export interface UpfrontContextAnswers {
  [questionId: string]: {
    selectedOption: string;
    freeText: string;
  };
}

export const upfrontQuestions: UpfrontQuestion[] = [
  {
    id: 'spaced-learning',
    principleIds: ['spaced-repetition'],
    question: 'How does your learning experience handle review and repetition over time?',
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
  {
    id: 'adaptive-difficulty',
    principleIds: ['deliberate-practice', 'desirable-difficulties'],
    question: 'How does difficulty adjust to the individual learner?',
    options: [
      {
        value: 'none',
        label: 'Same content and difficulty for all learners',
        scoringHint: 'No personalization or adaptive difficulty - score 1-2',
      },
      {
        value: 'levels',
        label: 'Users choose their level (beginner/intermediate/advanced)',
        scoringHint: 'User-selected difficulty levels only - score 2-3',
      },
      {
        value: 'linear-progression',
        label: 'Difficulty increases as users progress through content',
        scoringHint: 'Linear difficulty progression - score 3',
      },
      {
        value: 'adaptive-performance',
        label: 'System adjusts difficulty based on user performance',
        scoringHint: 'Performance-based adaptive difficulty - score 4',
      },
      {
        value: 'targeted-practice',
        label: 'System identifies weak areas and provides focused practice',
        scoringHint: 'Deliberate practice with weakness targeting - score 5',
      },
    ],
    freeTextPrompt: 'Describe how the system adapts to learners:',
  },
  {
    id: 'content-mixing',
    principleIds: ['interleaving'],
    question: 'How are different topics or problem types presented during practice?',
    options: [
      {
        value: 'blocked',
        label: 'One topic/type at a time until complete, then move to next',
        scoringHint: 'Blocked practice - no interleaving - score 1-2',
      },
      {
        value: 'some-variety',
        label: 'Mostly grouped, but occasional variety within practice',
        scoringHint: 'Minimal interleaving - score 2-3',
      },
      {
        value: 'mixed',
        label: 'Different topics/types are mixed together in practice sessions',
        scoringHint: 'Interleaved practice - score 3-4',
      },
      {
        value: 'randomized',
        label: 'Question order is randomized so users cannot predict what comes next',
        scoringHint: 'Randomized interleaving - score 4',
      },
      {
        value: 'cumulative',
        label: 'Previous topics reappear in later practice sessions',
        scoringHint: 'Cumulative review with interleaving - score 5',
      },
    ],
    freeTextPrompt: 'Describe how topics are mixed or sequenced:',
  },
];
