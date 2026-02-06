import { useState, useCallback, useMemo } from 'react';
import {
  getRelevantQuestions,
  getSectionTypes,
  type UpfrontContextAnswers,
  type SectionType,
} from '../../data/upfrontQuestions';

interface UpfrontContextModalProps {
  sectionNames: string[];
  onComplete: (answers: UpfrontContextAnswers) => void;
  onSkip: () => void;
}

const sectionTypeLabels: Record<SectionType, string> = {
  quiz: 'Quiz / Assessment',
  lesson: 'Lesson / Instruction',
  practice: 'Practice / Activity',
  review: 'Review / Summary',
  onboarding: 'Onboarding',
  overall: 'Overall Experience',
};

export default function UpfrontContextModal({
  sectionNames,
  onComplete,
  onSkip,
}: UpfrontContextModalProps) {
  // Get relevant questions based on section types
  const relevantQuestions = useMemo(
    () => getRelevantQuestions(sectionNames),
    [sectionNames]
  );

  const detectedTypes = useMemo(
    () => getSectionTypes(sectionNames),
    [sectionNames]
  );

  const [answers, setAnswers] = useState<UpfrontContextAnswers>(() =>
    Object.fromEntries(
      relevantQuestions.map((q) => [q.id, { selectedOption: '', freeText: '' }])
    )
  );
  const [expandedFreeText, setExpandedFreeText] = useState<Record<string, boolean>>({});

  const handleOptionChange = useCallback((questionId: string, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: { ...prev[questionId], selectedOption: value },
    }));
  }, []);

  const handleFreeTextChange = useCallback((questionId: string, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: { ...prev[questionId], freeText: value },
    }));
  }, []);

  const toggleFreeText = useCallback((questionId: string) => {
    setExpandedFreeText((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  }, []);

  const hasAnyAnswer = Object.values(answers).some(
    (a) => a.selectedOption !== '' || a.freeText.trim() !== ''
  );

  const handleSubmit = useCallback(() => {
    // Filter out empty answers
    const filteredAnswers: UpfrontContextAnswers = {};
    for (const [id, answer] of Object.entries(answers)) {
      if (answer.selectedOption !== '' || answer.freeText.trim() !== '') {
        filteredAnswers[id] = answer;
      }
    }
    onComplete(filteredAnswers);
  }, [answers, onComplete]);

  // If no relevant questions (shouldn't happen, but just in case), skip modal
  if (relevantQuestions.length === 0) {
    onSkip();
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">
            Help us understand your learning experience
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            These questions help assess aspects not visible in screenshots.
          </p>

          {/* Detected section types */}
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="text-xs text-slate-500">Analyzing:</span>
            {detectedTypes.map((type) => (
              <span
                key={type}
                className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs"
              >
                {sectionTypeLabels[type]}
              </span>
            ))}
          </div>
        </div>

        {/* Questions */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {relevantQuestions.map((question) => (
            <div
              key={question.id}
              className="bg-slate-50 rounded-lg p-4 border border-slate-200"
            >
              <h3 className="font-medium text-slate-900 mb-3">{question.question}</h3>

              <div className="space-y-2">
                {question.options.map((option) => (
                  <label
                    key={option.value}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      answers[question.id]?.selectedOption === option.value
                        ? 'border-slate-400 bg-white'
                        : 'border-transparent hover:bg-white/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name={question.id}
                      value={option.value}
                      checked={answers[question.id]?.selectedOption === option.value}
                      onChange={() => handleOptionChange(question.id, option.value)}
                      className="mt-0.5 text-slate-600 focus:ring-slate-500"
                    />
                    <span className="text-sm text-slate-700">{option.label}</span>
                  </label>
                ))}
              </div>

              {/* Collapsible free text */}
              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => toggleFreeText(question.id)}
                  className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1"
                >
                  <svg
                    className={`w-4 h-4 transition-transform ${
                      expandedFreeText[question.id] ? 'rotate-90' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                  Add additional details
                </button>

                {expandedFreeText[question.id] && (
                  <textarea
                    value={answers[question.id]?.freeText || ''}
                    onChange={(e) => handleFreeTextChange(question.id, e.target.value)}
                    placeholder={question.freeTextPrompt}
                    className="mt-2 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 resize-none"
                    rows={2}
                  />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onSkip}
            className="text-sm text-slate-500 hover:text-slate-700"
          >
            Skip and analyze without context
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
              hasAnyAnswer
                ? 'bg-slate-900 text-white hover:bg-slate-800'
                : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
            }`}
          >
            Continue to Analysis
          </button>
        </div>
      </div>
    </div>
  );
}
