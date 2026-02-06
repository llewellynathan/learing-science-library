import type { RubricLevel } from '../../data/auditPrompts';

const defaultRubric: Record<number, RubricLevel> = {
  1: { label: 'Not implemented', description: 'This principle is not present in the design.' },
  2: { label: 'Minimal', description: 'Some elements exist but are not consistently applied.' },
  3: { label: 'Partial', description: 'The principle is partially implemented.' },
  4: { label: 'Well implemented', description: 'The principle is consistently applied.' },
  5: { label: 'Fully integrated', description: 'The principle is a core part of the design.' },
};

interface RatingScaleProps {
  value: number | null;
  onChange: (value: number) => void;
  categoryColor: string;
  rubric?: Record<number, RubricLevel>;
}

export default function RatingScale({ value, onChange, categoryColor, rubric = defaultRubric }: RatingScaleProps) {
  const ratings = [1, 2, 3, 4, 5];
  const selectedLevel = value ? rubric[value] : null;

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {ratings.map((rating) => {
          const isSelected = value === rating;

          return (
            <button
              key={rating}
              type="button"
              onClick={() => onChange(rating)}
              className={`
                flex-1 p-3 rounded-lg border transition-all text-center
                ${isSelected
                  ? `${categoryColor} border-transparent ring-2 ring-offset-1 ring-slate-400`
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }
              `}
            >
              <div className={`text-lg font-semibold ${isSelected ? '' : 'text-slate-700'}`}>
                {rating}
              </div>
              <div className={`text-xs mt-1 ${isSelected ? 'opacity-90' : 'text-slate-500'}`}>
                {rubric[rating].label}
              </div>
            </button>
          );
        })}
      </div>
      {selectedLevel && (
        <p className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3">
          {selectedLevel.description}
        </p>
      )}
    </div>
  );
}
