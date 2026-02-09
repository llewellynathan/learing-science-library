import { useState, useEffect } from 'react';

type RelevanceLevel = 'critical' | 'high' | 'moderate' | 'low';

interface AudienceRelevance {
  learningDesigners?: RelevanceLevel;
  educators?: RelevanceLevel;
  selfLearners?: RelevanceLevel;
}

interface ContextRelevance {
  gameBasedLearning?: RelevanceLevel;
  classroomInstruction?: RelevanceLevel;
  elearning?: RelevanceLevel;
  selfStudy?: RelevanceLevel;
}

export interface PrincipleRelevance {
  id: string;
  audienceRelevance?: AudienceRelevance;
  contextRelevance?: ContextRelevance;
}

interface RelevanceFilterProps {
  principles: PrincipleRelevance[];
}

type AudienceKey = keyof AudienceRelevance;
type ContextKey = keyof ContextRelevance;

const audienceLabels: Record<AudienceKey, string> = {
  learningDesigners: 'Learning Designer',
  educators: 'Educator/Teacher',
  selfLearners: 'Self-directed Learner',
};

// Default context labels for designers and educators
const designerContextLabels: Record<ContextKey, string> = {
  gameBasedLearning: 'Game-Based Learning',
  classroomInstruction: 'Classroom Instruction',
  elearning: 'E-Learning',
  selfStudy: 'Self-Study',
};

// Learner-friendly context labels
const learnerContextLabels: Partial<Record<ContextKey, string>> = {
  selfStudy: 'Studying on my own',
  gameBasedLearning: 'Using learning apps or games',
  elearning: 'Taking online courses',
};

// Get context options based on selected audience
const getContextOptions = (audience: AudienceKey | ''): { key: ContextKey; label: string }[] => {
  if (audience === 'selfLearners') {
    return [
      { key: 'selfStudy', label: learnerContextLabels.selfStudy! },
      { key: 'gameBasedLearning', label: learnerContextLabels.gameBasedLearning! },
      { key: 'elearning', label: learnerContextLabels.elearning! },
    ];
  }
  return (Object.keys(designerContextLabels) as ContextKey[]).map((key) => ({
    key,
    label: designerContextLabels[key],
  }));
};

const relevancePriority: Record<RelevanceLevel, number> = {
  critical: 4,
  high: 3,
  moderate: 2,
  low: 1,
};

export default function RelevanceFilter({ principles }: RelevanceFilterProps) {
  const [selectedAudience, setSelectedAudience] = useState<AudienceKey | ''>('');
  const [selectedContext, setSelectedContext] = useState<ContextKey | ''>('');
  const [minRelevance, setMinRelevance] = useState<RelevanceLevel | ''>('');

  // Get context options based on current audience
  const contextOptions = getContextOptions(selectedAudience);

  // Handle audience change - clear context if it's no longer valid
  const handleAudienceChange = (newAudience: AudienceKey | '') => {
    setSelectedAudience(newAudience);
    const newOptions = getContextOptions(newAudience);
    if (selectedContext && !newOptions.some(opt => opt.key === selectedContext)) {
      setSelectedContext('');
    }
  };

  useEffect(() => {
    const cards = document.querySelectorAll('.principle-card');
    const essentialCards = document.querySelectorAll('.essential-principle-card');

    const filterCard = (card: Element, principleId: string) => {
      const principle = principles.find(p => p.id === principleId);

      if (!principle) {
        // If no relevance data, show by default unless filters are active
        if (selectedAudience || selectedContext) {
          (card as HTMLElement).style.display = 'none';
        } else {
          (card as HTMLElement).style.display = '';
        }
        return;
      }

      let shouldShow = true;

      // Check audience relevance
      if (selectedAudience && principle.audienceRelevance) {
        const relevance = principle.audienceRelevance[selectedAudience];
        if (!relevance) {
          shouldShow = false;
        } else if (minRelevance && relevancePriority[relevance] < relevancePriority[minRelevance]) {
          shouldShow = false;
        }
      }

      // Check context relevance
      if (selectedContext && principle.contextRelevance) {
        const relevance = principle.contextRelevance[selectedContext];
        if (!relevance) {
          shouldShow = false;
        } else if (minRelevance && relevancePriority[relevance] < relevancePriority[minRelevance]) {
          shouldShow = false;
        }
      }

      (card as HTMLElement).style.display = shouldShow ? '' : 'none';
    };

    cards.forEach((card) => {
      const principleId = (card as HTMLElement).dataset.principleId || '';
      filterCard(card, principleId);
    });

    essentialCards.forEach((card) => {
      const principleId = (card as HTMLElement).dataset.principleId || '';
      filterCard(card, principleId);
    });
  }, [selectedAudience, selectedContext, minRelevance, principles]);

  const clearFilters = () => {
    setSelectedAudience('');
    setSelectedContext('');
    setMinRelevance('');
  };

  const hasActiveFilters = selectedAudience || selectedContext || minRelevance;

  return (
    <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-700">Filter by Relevance</h3>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-xs text-slate-500 hover:text-slate-700 underline"
          >
            Clear filters
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label htmlFor="audience-filter" className="block text-xs font-medium text-slate-600 mb-1">
            I am a...
          </label>
          <select
            id="audience-filter"
            value={selectedAudience}
            onChange={(e) => handleAudienceChange(e.target.value as AudienceKey | '')}
            className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent"
          >
            <option value="">Anyone</option>
            {(Object.keys(audienceLabels) as AudienceKey[]).map((key) => (
              <option key={key} value={key}>
                {audienceLabels[key]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="context-filter" className="block text-xs font-medium text-slate-600 mb-1">
            I'm interested in...
          </label>
          <select
            id="context-filter"
            value={selectedContext}
            onChange={(e) => setSelectedContext(e.target.value as ContextKey | '')}
            className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent"
          >
            <option value="">Anything</option>
            {contextOptions.map(({ key, label }) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="relevance-filter" className="block text-xs font-medium text-slate-600 mb-1">
            Relevance
          </label>
          <select
            id="relevance-filter"
            value={minRelevance}
            onChange={(e) => setMinRelevance(e.target.value as RelevanceLevel | '')}
            className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent"
          >
            <option value="">Any</option>
            <option value="critical">Critical only</option>
            <option value="high">High+</option>
            <option value="moderate">Moderate+</option>
          </select>
        </div>
      </div>
    </div>
  );
}
