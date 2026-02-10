import { type SectionType } from './upfrontQuestions';

export interface RubricLevel {
  label: string;
  description: string;
}

export interface AuditPromptData {
  prompt: string;
  recommendation: string;
  rubric: Record<number, RubricLevel>;
  /** Which section types this principle applies to. If empty/undefined, applies to all. */
  appliesTo: SectionType[];
}

export const auditData: Record<string, AuditPromptData> = {
  'spaced-repetition': {
    prompt: 'How well does your design distribute learning over time?',
    recommendation: 'Consider adding review schedules, reminder systems, or spacing out practice sessions to leverage the spacing effect for better long-term retention.',
    rubric: {
      1: { label: 'Not implemented', description: 'All content is presented in a single session with no planned review or follow-up.' },
      2: { label: 'Minimal', description: 'Some content is revisited, but timing is arbitrary or inconsistent.' },
      3: { label: 'Partial', description: 'Review sessions exist but intervals are not optimized based on spacing principles.' },
      4: { label: 'Well implemented', description: 'Content is systematically spaced with intentional intervals between sessions.' },
      5: { label: 'Fully integrated', description: 'Adaptive spacing adjusts review timing based on learner performance and forgetting curves.' },
    },
    appliesTo: ['review', 'overall'],
  },
  'retrieval-practice': {
    prompt: 'How often do learners actively recall information from memory?',
    recommendation: 'Add practice quizzes, flashcards, or recall exercises. Replace passive re-reading with active retrieval opportunities.',
    rubric: {
      1: { label: 'Not implemented', description: 'Learners only read, watch, or listen—no opportunities to recall from memory.' },
      2: { label: 'Minimal', description: 'Occasional review questions, but mostly recognition-based (multiple choice) rather than recall.' },
      3: { label: 'Partial', description: 'Some retrieval practice exists but is not the primary learning activity.' },
      4: { label: 'Well implemented', description: 'Regular opportunities to recall information with feedback on accuracy.' },
      5: { label: 'Fully integrated', description: 'Retrieval is the core learning mechanism, with varied formats and immediate feedback.' },
    },
    appliesTo: ['post-quiz', 'quiz', 'practice', 'review', 'overall'],
  },
  'elaboration': {
    prompt: 'How well do you prompt learners to explain and connect new information?',
    recommendation: 'Include reflection prompts, ask "why" and "how" questions, or have learners explain concepts to others or write summaries.',
    rubric: {
      1: { label: 'Not implemented', description: 'Content is presented without prompts for explanation or connection to prior knowledge.' },
      2: { label: 'Minimal', description: 'Occasional "think about" prompts but no structured elaboration activities.' },
      3: { label: 'Partial', description: 'Some opportunities to explain concepts, but connections to prior knowledge are not explicit.' },
      4: { label: 'Well implemented', description: 'Regular prompts to explain "why" and "how," with explicit links to prior knowledge.' },
      5: { label: 'Fully integrated', description: 'Learners consistently generate explanations, make connections, and teach concepts to others.' },
    },
    appliesTo: ['post-quiz', 'quiz', 'lesson', 'practice', 'overall'],
  },
  'interleaving': {
    prompt: 'How much do you mix different topics or problem types during practice?',
    recommendation: 'Mix related concepts within practice sessions. Vary problem types to improve discrimination and transfer.',
    rubric: {
      1: { label: 'Not implemented', description: 'Topics are practiced in isolated blocks—one type at a time until mastery.' },
      2: { label: 'Minimal', description: 'Some variety within sessions, but topics are mostly grouped together.' },
      3: { label: 'Partial', description: 'Topics are sometimes mixed, but blocking is still the dominant pattern.' },
      4: { label: 'Well implemented', description: 'Practice regularly interleaves different topics or problem types within sessions.' },
      5: { label: 'Fully integrated', description: 'Systematic interleaving across all practice, requiring learners to discriminate between approaches.' },
    },
    appliesTo: ['post-quiz', 'quiz', 'practice', 'review', 'overall'],
  },
  'desirable-difficulties': {
    prompt: 'Does your design include productive challenges that may slow initial learning but boost retention?',
    recommendation: 'Introduce appropriate difficulty through spacing, interleaving, varied practice, or generation tasks that create productive struggle.',
    rubric: {
      1: { label: 'Not implemented', description: 'Learning is made as easy as possible—no intentional challenges or struggle.' },
      2: { label: 'Minimal', description: 'Some challenging elements exist but are seen as obstacles rather than features.' },
      3: { label: 'Partial', description: 'A few productive difficulties are included, but ease is still prioritized.' },
      4: { label: 'Well implemented', description: 'Strategic challenges are built in (generation, variation, spacing) with learner support.' },
      5: { label: 'Fully integrated', description: 'Productive struggle is a design principle—difficulty is calibrated to maximize long-term learning.' },
    },
    appliesTo: ['post-quiz', 'quiz', 'practice', 'overall'],
  },
  'deliberate-practice': {
    prompt: 'How well do you target specific weaknesses with focused practice and feedback?',
    recommendation: 'Identify skill gaps and provide focused practice on weak areas. Ensure immediate, specific feedback on performance.',
    rubric: {
      1: { label: 'Not implemented', description: 'Practice is generic—same activities for all learners regardless of skill level.' },
      2: { label: 'Minimal', description: 'Some differentiation exists, but practice does not target individual weaknesses.' },
      3: { label: 'Partial', description: 'Weaknesses can be identified, but targeted practice is limited or optional.' },
      4: { label: 'Well implemented', description: 'Practice focuses on specific skill gaps with immediate, actionable feedback.' },
      5: { label: 'Fully integrated', description: 'Continuous diagnosis of weaknesses with adaptive practice at the edge of ability.' },
    },
    appliesTo: ['practice', 'overall'],
  },
  'cognitive-load-theory': {
    prompt: 'How well do you manage information presentation to avoid overwhelming working memory?',
    recommendation: 'Break complex content into smaller pieces, eliminate extraneous information, and use worked examples to reduce cognitive load.',
    rubric: {
      1: { label: 'Not implemented', description: 'Dense content with no consideration for working memory limits—information overload.' },
      2: { label: 'Minimal', description: 'Some awareness of complexity, but content still overwhelms novice learners.' },
      3: { label: 'Partial', description: 'Content is organized but may still include extraneous information or split attention.' },
      4: { label: 'Well implemented', description: 'Information is streamlined, integrated, and presented in digestible amounts.' },
      5: { label: 'Fully integrated', description: 'Load is carefully managed—worked examples, fading, and scaffolding matched to expertise.' },
    },
    appliesTo: ['pre-quiz', 'post-quiz', 'quiz', 'lesson', 'practice', 'review', 'onboarding', 'overall'],
  },
  'chunking': {
    prompt: 'How well do you group complex information into meaningful, manageable pieces?',
    recommendation: 'Group related information into meaningful chunks. Use hierarchies, categories, or patterns to organize content.',
    rubric: {
      1: { label: 'Not implemented', description: 'Information is presented as a continuous stream without clear organization.' },
      2: { label: 'Minimal', description: 'Some grouping exists but chunks are arbitrary or too large to be useful.' },
      3: { label: 'Partial', description: 'Content is divided into sections, but relationships between chunks are unclear.' },
      4: { label: 'Well implemented', description: 'Information is grouped into meaningful chunks with clear hierarchies and connections.' },
      5: { label: 'Fully integrated', description: 'Chunking leverages learner schemas—patterns and relationships are made explicit.' },
    },
    appliesTo: ['lesson', 'onboarding', 'overall'],
  },
  'growth-mindset': {
    prompt: 'How well does your messaging emphasize that abilities develop through effort?',
    recommendation: 'Praise effort and strategy over innate ability. Frame challenges as opportunities to grow. Normalize productive struggle.',
    rubric: {
      1: { label: 'Not implemented', description: 'Messaging implies fixed ability—success attributed to talent, failure to lack of ability.' },
      2: { label: 'Minimal', description: 'Effort is occasionally mentioned but not consistently reinforced.' },
      3: { label: 'Partial', description: 'Growth mindset language is present but may conflict with other fixed-mindset cues.' },
      4: { label: 'Well implemented', description: 'Consistent messaging that effort and strategy lead to improvement; struggle is normalized.' },
      5: { label: 'Fully integrated', description: 'Growth mindset is embedded throughout—feedback, framing, and culture all reinforce it.' },
    },
    appliesTo: ['pre-quiz', 'post-quiz', 'quiz', 'lesson', 'practice', 'onboarding', 'overall'],
  },
  'self-efficacy': {
    prompt: 'How well do you build learner confidence through achievable challenges and success?',
    recommendation: 'Sequence tasks for early wins. Provide mastery experiences, positive feedback, and models of success.',
    rubric: {
      1: { label: 'Not implemented', description: 'Tasks are too difficult early on—learners experience repeated failure.' },
      2: { label: 'Minimal', description: 'Some easy tasks exist but difficulty progression is inconsistent.' },
      3: { label: 'Partial', description: 'Early wins are possible, but confidence-building is not systematically designed.' },
      4: { label: 'Well implemented', description: 'Tasks are sequenced for success; positive feedback and models build confidence.' },
      5: { label: 'Fully integrated', description: 'Mastery experiences are central—learners build genuine competence through graduated challenges.' },
    },
    appliesTo: ['pre-quiz', 'post-quiz', 'quiz', 'lesson', 'practice', 'onboarding', 'overall'],
  },
  'metacognition': {
    prompt: 'How well do you prompt learners to reflect on and monitor their own learning?',
    recommendation: 'Add self-assessment tools, planning prompts, or reflection questions. Help learners recognize what they know and don\'t know.',
    rubric: {
      1: { label: 'Not implemented', description: 'No prompts for self-reflection—learners are not asked to think about their thinking.' },
      2: { label: 'Minimal', description: 'Occasional reflection prompts, but no structured metacognitive practice.' },
      3: { label: 'Partial', description: 'Some self-assessment opportunities, but learners rarely act on insights.' },
      4: { label: 'Well implemented', description: 'Regular prompts to plan, monitor, and evaluate learning with actionable feedback.' },
      5: { label: 'Fully integrated', description: 'Metacognition is taught explicitly—learners develop awareness of their learning processes.' },
    },
    appliesTo: ['pre-quiz', 'post-quiz', 'quiz', 'lesson', 'practice', 'review', 'overall'],
  },
  'self-explanation': {
    prompt: 'How well do you encourage learners to explain material to themselves?',
    recommendation: 'Include prompts for learners to explain their reasoning, clarify steps, or articulate why solutions work.',
    rubric: {
      1: { label: 'Not implemented', description: 'Learners consume content passively—no prompts to explain or articulate understanding.' },
      2: { label: 'Minimal', description: 'Occasional "why" questions, but self-explanation is not a regular practice.' },
      3: { label: 'Partial', description: 'Some self-explanation prompts exist but are easy to skip or ignore.' },
      4: { label: 'Well implemented', description: 'Regular prompts to explain reasoning, with scaffolding for effective explanations.' },
      5: { label: 'Fully integrated', description: 'Self-explanation is a core activity—learners articulate understanding at each step.' },
    },
    appliesTo: ['post-quiz', 'quiz', 'lesson', 'practice', 'overall'],
  },
  'transfer-of-learning': {
    prompt: 'How well do you help learners apply knowledge to new and varied contexts?',
    recommendation: 'Use varied examples, highlight underlying principles, and provide practice in multiple contexts to promote transfer.',
    rubric: {
      1: { label: 'Not implemented', description: 'Learning is context-bound—no varied examples or application to new situations.' },
      2: { label: 'Minimal', description: 'A few different examples, but underlying principles are not made explicit.' },
      3: { label: 'Partial', description: 'Some transfer activities exist, but practice mostly stays in the original context.' },
      4: { label: 'Well implemented', description: 'Varied examples and contexts; underlying principles are highlighted for transfer.' },
      5: { label: 'Fully integrated', description: 'Transfer is designed in—learners practice applying knowledge across diverse situations.' },
    },
    appliesTo: ['lesson', 'practice', 'overall'],
  },
};
