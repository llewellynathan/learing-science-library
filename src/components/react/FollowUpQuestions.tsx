import { useState, useCallback } from 'react';
import { followUpQuestions } from '../../data/followUpQuestions';

interface LowScoringPrinciple {
  id: string;
  title: string;
  score: number;
  reasoning: string;
}

export interface FollowUpAnswer {
  principleId: string;
  selectedOptions: string[];
  freeText: string;
}

interface FollowUpQuestionsProps {
  lowScoringPrinciples: LowScoringPrinciple[];
  onComplete: (answers: FollowUpAnswer[]) => void;
  onSkip: () => void;
}

export default function FollowUpQuestions({
  lowScoringPrinciples,
  onComplete,
  onSkip,
}: FollowUpQuestionsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<FollowUpAnswer[]>(() =>
    lowScoringPrinciples.map((p) => ({
      principleId: p.id,
      selectedOptions: [],
      freeText: '',
    }))
  );

  const currentPrinciple = lowScoringPrinciples[currentIndex];
  const currentAnswer = answers[currentIndex];
  const questionData = followUpQuestions[currentPrinciple.id];
  const isLast = currentIndex === lowScoringPrinciples.length - 1;

  const updateAnswer = useCallback(
    (update: Partial<FollowUpAnswer>) => {
      setAnswers((prev) =>
        prev.map((a, i) => (i === currentIndex ? { ...a, ...update } : a))
      );
    },
    [currentIndex]
  );

  const toggleOption = useCallback(
    (option: string) => {
      const current = currentAnswer.selectedOptions;
      const updated = current.includes(option)
        ? current.filter((o) => o !== option)
        : [...current, option];
      updateAnswer({ selectedOptions: updated });
    },
    [currentAnswer.selectedOptions, updateAnswer]
  );

  const handleNext = useCallback(() => {
    if (isLast) {
      onComplete(answers);
    } else {
      setCurrentIndex((i) => i + 1);
    }
  }, [isLast, answers, onComplete]);

  const handlePrevious = useCallback(() => {
    setCurrentIndex((i) => Math.max(0, i - 1));
  }, []);

  const handleSkipQuestion = useCallback(() => {
    if (isLast) {
      onComplete(answers);
    } else {
      setCurrentIndex((i) => i + 1);
    }
  }, [isLast, answers, onComplete]);

  const hasAnswer =
    currentAnswer.selectedOptions.length > 0 || currentAnswer.freeText.trim() !== '';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-slate-900">
            Let's refine your results
          </h3>
          <button
            onClick={onSkip}
            className="text-sm text-slate-500 hover:text-slate-700"
          >
            Skip to Results
          </button>
        </div>
        <p className="text-sm text-slate-600">
          Answer a few questions about low-scoring areas to get more accurate scores
          and specific recommendations.
        </p>

        {/* Progress */}
        <div className="mt-4 flex items-center gap-3">
          <div className="flex-1 bg-slate-200 rounded-full h-2">
            <div
              className="bg-slate-600 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${((currentIndex + 1) / lowScoringPrinciples.length) * 100}%`,
              }}
            />
          </div>
          <span className="text-sm text-slate-500">
            {currentIndex + 1} of {lowScoringPrinciples.length}
          </span>
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        {/* Principle Header */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-slate-900">{currentPrinciple.title}</h4>
            <span className="px-2 py-0.5 text-xs rounded-full bg-amber-100 text-amber-800">
              {currentPrinciple.score}/5
            </span>
          </div>
        </div>

        {/* AI Reasoning */}
        <div className="mb-6 p-3 bg-slate-50 rounded-lg border border-slate-100">
          <div className="text-xs font-medium text-slate-500 mb-1">AI observed:</div>
          <p className="text-sm text-slate-700">{currentPrinciple.reasoning}</p>
        </div>

        {/* Question */}
        {questionData && (
          <>
            <div className="mb-4">
              <p className="font-medium text-slate-900 mb-3">
                Does your learning experience include any of these?
              </p>
              <div className="space-y-2">
                {questionData.options.map((option) => (
                  <label
                    key={option}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      currentAnswer.selectedOptions.includes(option)
                        ? 'border-slate-400 bg-slate-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={currentAnswer.selectedOptions.includes(option)}
                      onChange={() => toggleOption(option)}
                      className="mt-0.5 rounded border-slate-300 text-slate-600 focus:ring-slate-500"
                    />
                    <span className="text-sm text-slate-700">{option}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Free Text */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {questionData.freeTextPrompt}{' '}
                <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <textarea
                value={currentAnswer.freeText}
                onChange={(e) => updateAnswer({ freeText: e.target.value })}
                placeholder="Add any additional context..."
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 resize-none"
                rows={3}
              />
            </div>
          </>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            currentIndex === 0
              ? 'text-slate-300 cursor-not-allowed'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Previous
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSkipQuestion}
            className="text-sm text-slate-500 hover:text-slate-700"
          >
            Skip this question
          </button>
          <button
            onClick={handleNext}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
              hasAnswer
                ? 'bg-slate-900 text-white hover:bg-slate-800'
                : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
            }`}
          >
            {isLast ? 'Finish & Refine Results' : 'Next Question'}
          </button>
        </div>
      </div>
    </div>
  );
}
