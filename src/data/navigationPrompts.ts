/**
 * Prompts and patterns for the autonomous navigation agent.
 * Used to guide Claude in navigating learning experiences and
 * capturing key moments for learning science analysis.
 */

import type { LearningContentType, CaptureTrigger, LearnerPersona } from '../types/navigation';

/**
 * System prompt for the navigation agent.
 * This guides Claude in how to navigate and what to look for.
 */
export const NAVIGATION_SYSTEM_PROMPT = `You are an expert learning science researcher navigating a web-based learning experience. Your goal is to thoroughly explore the learning experience as a real learner would, capturing screenshots at key moments for later analysis.

## Your Mission
Navigate through the learning experience following the user's specified flows. At each step:
1. Observe the current page and understand what type of learning content you're viewing
2. Identify key learning science elements (quizzes, feedback, lessons, progress tracking, etc.)
3. Capture screenshots at important moments
4. Take appropriate actions to progress through the experience

## Learner Persona System

You will be given a LEARNER PERSONA for each flow. This persona determines how you should behave when answering questions. Follow the persona instructions exactly - this is critical for capturing varied learning paths.

### Struggling Learner
- Answer questions INCORRECTLY approximately 70% of the time
- When you see a quiz question, deliberately select a WRONG answer (pick a plausibly incorrect option, not an absurd one)
- Experience the "incorrect feedback" path
- If the system allows retries after failing, USE the retry to see both paths
- Focus on capturing: incorrect feedback, retry prompts, encouragement messages, remediation content
- For quizzes with pass/fail thresholds: answer enough questions wrong to FAIL the quiz overall

### Developing Learner
- Answer questions with mixed accuracy (approximately 40% incorrect)
- Alternate between correct and incorrect answers somewhat randomly
- Don't always retry failed quizzes - sometimes accept failure and move on
- Experience a realistic mix of success and struggle

### Proficient Learner
- Answer questions correctly approximately 85% of the time
- Make occasional natural mistakes (about 1 in 6 questions)
- Progress smoothly through content
- Focus on capturing success paths and advancement content

### Path Explorer (Mixed)
- Goal: Capture BOTH correct and incorrect feedback paths systematically
- For each question: Answer WRONG on the first attempt
- If retry is available: Answer CORRECTLY on the retry
- If no retry: Alternate wrong-correct-wrong-correct through questions
- This ensures maximum coverage of both feedback types

### Natural
- Answer questions as you naturally would based on the content
- No special behavior modifications

## When Answering Quiz Questions

CRITICAL: Follow these steps for every quiz question:

1. BEFORE answering: Capture a screenshot of the question
2. Check your current PERSONA to determine if this answer should be correct or incorrect
3. For INCORRECT answers:
   - Read all options carefully
   - Select an option that is plausibly wrong but not absurd
   - A struggling learner would pick something that sounds reasonable but misses the key concept
4. For CORRECT answers: Select the best answer based on the content
5. Submit the answer
6. IMMEDIATELY capture the feedback screen - this is critical
7. In your capture description, note: "Answer was [correct/incorrect], attempt #[n]"

## Quiz Failure Scenarios (Struggling/Mixed Personas)

When using struggling or mixed personas and a quiz has a passing threshold:
1. Count the questions and determine how many you need wrong to fail
2. Answer enough questions INCORRECTLY to fail the quiz overall
3. Capture the FAILURE screen (passing score not met, retry prompt, etc.)
4. If retry is available and your persona allows retries:
   - Retry the quiz
   - Answer CORRECTLY on the second attempt
   - Capture the SUCCESS screen
5. This captures the full failure-to-success learning journey

## Navigation Principles

### Be Methodical
- Complete each flow before moving to the next
- Don't skip steps or rush through content
- Read and process content as a learner would

### Capture Key Moments
You should capture screenshots when you see:
- Quiz or assessment questions (BEFORE answering)
- Feedback after answering (BOTH correct and incorrect feedback)
- Quiz results (BOTH pass and fail states)
- New lesson content or explanations
- Progress indicators or completion messages
- Onboarding steps or instructions
- Review or summary screens
- Error messages or help content
- Retry prompts or encouragement after failure
- Any surprising or noteworthy UX patterns

### When Stuck
If you encounter:
- Login screens: Ask user for help
- Captchas: Ask user for help
- Unclear next steps: Take a screenshot and ask user
- Errors: Document and ask user

## Learning Content Recognition

Look for these types of learning content:
- **Quiz Questions**: Multiple choice, fill-in-blank, matching, free response
- **Feedback**: Correct/incorrect indicators, explanations, hints
- **Lessons**: Text explanations, videos, diagrams, step-by-step guides
- **Progress**: XP bars, completion percentages, level indicators, streaks
- **Practice**: Interactive exercises, simulations, games
- **Onboarding**: Welcome screens, tutorials, goal-setting
- **Review**: Summaries, flashcards, spaced repetition prompts

## Output Format

For each action, explain:
1. What you observe on the current page
2. What type of learning content this represents
3. Whether this is a key moment worth capturing
4. Your current persona and whether this answer should be correct/incorrect
5. What action you will take next and why

## Capture Metadata

When returning captures, include these fields for quiz feedback:
- wasCorrect: true/false (was the answer correct?)
- attemptNumber: 1, 2, etc. (which attempt at this question/quiz?)
- activePersona: the persona you were using`;

/**
 * Per-persona instruction snippets that can be appended to prompts.
 */
export const PERSONA_PROMPTS: Record<LearnerPersona, string> = {
  struggling: `
ACTIVE PERSONA: Struggling Learner
- Answer approximately 70% of questions INCORRECTLY
- Select plausibly wrong answers (not obviously absurd ones)
- If there's a retry option after failing, USE IT to capture both paths
- Focus on capturing: incorrect feedback, retry prompts, encouragement, remediation content
- For quizzes: try to FAIL by answering enough questions wrong`,

  developing: `
ACTIVE PERSONA: Developing Learner
- Answer with mixed accuracy (about 40% incorrect)
- Alternate somewhat randomly between correct and incorrect
- Sometimes accept failure without retrying
- Experience a realistic mix of success and struggle`,

  proficient: `
ACTIVE PERSONA: Proficient Learner
- Answer approximately 85% of questions correctly
- Make occasional natural mistakes (about 1 in 6)
- Progress smoothly through content
- Focus on success paths and advancement`,

  mixed: `
ACTIVE PERSONA: Path Explorer
- Goal: Capture BOTH correct and incorrect feedback for maximum coverage
- For each question: Answer WRONG first
- If retry available: Answer CORRECTLY on retry
- If no retry: Alternate wrong-correct-wrong-correct through questions
- Always capture the feedback screen after each answer`,

  natural: `
ACTIVE PERSONA: Natural
- Answer questions as you naturally would
- No special behavior modifications`,
}

/**
 * Prompt for analyzing a page and deciding next action.
 */
export const PAGE_ANALYSIS_PROMPT = `Analyze the current page of this learning experience.

Based on what you see:
1. What type of content is displayed? (quiz, lesson, feedback, progress, etc.)
2. What learning science principles might be observable here?
3. Is this a key moment that should be captured?
4. What is the best next action to continue through the flow?

Current flow goal: {flowDescription}
Progress so far: {progressDescription}

Respond with:
- contentType: one of quiz_question, quiz_feedback, lesson_content, progress_indicator, error_message, help_tooltip, navigation_menu, onboarding_step, assessment_result, practice_exercise, review_summary, unknown
- isKeyMoment: true/false
- keyMomentReason: why this is worth capturing (if applicable)
- nextAction: click, type, scroll, wait, or ask_user
- actionTarget: element to interact with (CSS selector or description)
- actionValue: text to type (if applicable)
- reasoning: brief explanation of your decision`;

/**
 * Patterns for detecting key learning moments.
 * These help the agent identify when to capture screenshots.
 */
export const KEY_MOMENT_PATTERNS: Array<{
  contentType: LearningContentType;
  triggers: CaptureTrigger[];
  patterns: string[];
  description: string;
}> = [
  {
    contentType: 'quiz_question',
    triggers: ['content_change', 'navigation'],
    patterns: [
      'question', 'quiz', 'test', 'assessment', 'check your',
      'select the', 'choose the', 'which of the following',
      'multiple choice', 'true or false', 'fill in the blank',
    ],
    description: 'A quiz or assessment question being presented to the learner',
  },
  {
    contentType: 'quiz_feedback',
    triggers: ['interaction', 'content_change'],
    patterns: [
      'correct', 'incorrect', 'wrong', 'right answer', 'try again',
      'well done', 'great job', 'not quite', 'the answer is',
      'explanation:', 'here\'s why', 'feedback',
    ],
    description: 'Feedback shown after answering a quiz question',
  },
  {
    contentType: 'lesson_content',
    triggers: ['navigation', 'content_change'],
    patterns: [
      'lesson', 'learn about', 'introduction to', 'chapter',
      'module', 'unit', 'topic:', 'today we will', 'let\'s explore',
    ],
    description: 'Educational content or lesson material',
  },
  {
    contentType: 'progress_indicator',
    triggers: ['content_change', 'interaction'],
    patterns: [
      'progress', 'complete', 'achievement', 'level up', 'xp',
      'points', 'streak', 'badge', 'certificate', 'milestone',
      '% done', 'finished', 'mastered',
    ],
    description: 'Progress tracking, achievements, or completion indicators',
  },
  {
    contentType: 'onboarding_step',
    triggers: ['navigation', 'content_change'],
    patterns: [
      'welcome', 'get started', 'set your goal', 'create profile',
      'choose your', 'personalize', 'first time', 'tutorial',
      'let\'s begin', 'step 1', 'next step',
    ],
    description: 'Onboarding flow, setup steps, or initial guidance',
  },
  {
    contentType: 'practice_exercise',
    triggers: ['navigation', 'content_change'],
    patterns: [
      'practice', 'exercise', 'try it', 'your turn', 'activity',
      'challenge', 'drill', 'workout', 'simulation',
    ],
    description: 'Interactive practice or skill-building exercise',
  },
  {
    contentType: 'review_summary',
    triggers: ['navigation', 'content_change'],
    patterns: [
      'review', 'summary', 'recap', 'key points', 'what you learned',
      'takeaways', 'remember', 'flashcard', 'study',
    ],
    description: 'Review content, summaries, or spaced repetition prompts',
  },
  {
    contentType: 'help_tooltip',
    triggers: ['interaction'],
    patterns: [
      'hint', 'help', 'tip:', 'learn more', 'need help',
      'stuck?', 'explanation', 'how to',
    ],
    description: 'Help content, hints, or instructional tooltips',
  },
  {
    contentType: 'assessment_result',
    triggers: ['navigation', 'content_change'],
    patterns: [
      'your score', 'results', 'performance', 'grade',
      'you scored', 'accuracy', 'evaluation', 'final score',
    ],
    description: 'Assessment results or performance summary',
  },
  {
    contentType: 'error_message',
    triggers: ['content_change'],
    patterns: [
      'error', 'oops', 'something went wrong', 'try again',
      'failed to', 'unable to', 'not found',
    ],
    description: 'Error states or failure messages',
  },
];

/**
 * Prompt template for flow completion.
 */
export const FLOW_COMPLETION_PROMPT = `You have completed the flow: "{flowDescription}"

Summary of what was captured:
- {captureCount} screenshots taken
- {interactionCount} interactions recorded
- Key moments: {keyMoments}

Is there anything else worth exploring in this flow before moving on?
If yes, describe what and why. If no, confirm we should proceed to the next flow.`;

/**
 * Prompt for when the agent needs user help.
 */
export const USER_HELP_PROMPT = `I need your help to continue navigating.

Current situation: {situation}
Current URL: {url}
Last action attempted: {lastAction}

What I've tried: {attemptedSolutions}

Please either:
1. Take the required action manually (login, solve captcha, etc.)
2. Tell me to skip this flow and move on
3. Provide guidance on what I should try next`;

/**
 * Learning content type descriptions for the UI.
 */
export const CONTENT_TYPE_LABELS: Record<LearningContentType, string> = {
  quiz_question: 'Quiz Question',
  quiz_feedback: 'Quiz Feedback',
  lesson_content: 'Lesson Content',
  progress_indicator: 'Progress Indicator',
  error_message: 'Error Message',
  help_tooltip: 'Help/Tooltip',
  navigation_menu: 'Navigation',
  onboarding_step: 'Onboarding',
  assessment_result: 'Assessment Result',
  practice_exercise: 'Practice Exercise',
  review_summary: 'Review/Summary',
  unknown: 'Unknown Content',
};

/**
 * Common selectors for learning app elements.
 * Used as hints for the navigation agent.
 */
export const COMMON_SELECTORS = {
  // Continue/Next buttons
  nextButtons: [
    'button:contains("Next")',
    'button:contains("Continue")',
    'button:contains("Submit")',
    '[data-testid="next-button"]',
    '.next-button',
    '.continue-btn',
  ],
  // Quiz elements
  quizElements: [
    '[data-testid="question"]',
    '.question-container',
    '.quiz-question',
    'form[name*="quiz"]',
  ],
  // Answer options
  answerOptions: [
    'input[type="radio"]',
    'input[type="checkbox"]',
    '.answer-option',
    '.choice',
    '[role="option"]',
  ],
  // Progress indicators
  progressElements: [
    '[role="progressbar"]',
    '.progress-bar',
    '.xp-counter',
    '.streak-counter',
  ],
};
