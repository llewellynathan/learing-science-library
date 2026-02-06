import { useState, useMemo } from 'react';
import RatingScale from './RatingScale';
import { auditData } from '../../data/auditPrompts';

type Category =
  | 'Memory & Retention'
  | 'Practice & Skill Building'
  | 'Motivation & Engagement'
  | 'Cognitive Load'
  | 'Feedback & Assessment'
  | 'Transfer & Application';

interface Principle {
  id: string;
  title: string;
  category: Category;
  summary: string;
}

interface AuditToolProps {
  principles: Principle[];
}

const categoryColors: Record<Category, { bg: string; text: string }> = {
  'Memory & Retention': { bg: 'bg-purple-100', text: 'text-purple-800' },
  'Practice & Skill Building': { bg: 'bg-green-100', text: 'text-green-800' },
  'Motivation & Engagement': { bg: 'bg-orange-100', text: 'text-orange-800' },
  'Cognitive Load': { bg: 'bg-blue-100', text: 'text-blue-800' },
  'Feedback & Assessment': { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  'Transfer & Application': { bg: 'bg-pink-100', text: 'text-pink-800' },
};

export default function AuditTool({ principles }: AuditToolProps) {
  const [ratings, setRatings] = useState<Record<string, number | null>>(() =>
    Object.fromEntries(principles.map((p) => [p.id, null]))
  );
  const [showResults, setShowResults] = useState(false);

  const completedCount = Object.values(ratings).filter((r) => r !== null).length;
  const totalCount = principles.length;
  const allCompleted = completedCount === totalCount;

  const results = useMemo(() => {
    const rated = Object.entries(ratings).filter(([, score]) => score !== null);
    if (rated.length === 0) return null;

    const scores = rated.map(([, score]) => score as number);
    const average = scores.reduce((a, b) => a + b, 0) / scores.length;

    const gaps = rated
      .filter(([, score]) => (score as number) <= 3)
      .map(([id, score]) => {
        const principle = principles.find((p) => p.id === id)!;
        return {
          id,
          title: principle.title,
          category: principle.category,
          score: score as number,
          recommendation: auditData[id]?.recommendation || '',
        };
      })
      .sort((a, b) => a.score - b.score);

    const strengths = rated
      .filter(([, score]) => (score as number) >= 4)
      .map(([id, score]) => {
        const principle = principles.find((p) => p.id === id)!;
        return {
          id,
          title: principle.title,
          category: principle.category,
          score: score as number,
        };
      })
      .sort((a, b) => b.score - a.score);

    return { average, gaps, strengths, totalRated: rated.length };
  }, [ratings, principles]);

  const handleRating = (principleId: string, score: number) => {
    setRatings((prev) => ({ ...prev, [principleId]: score }));
  };

  const copyResults = () => {
    if (!results) return;

    const lines = [
      `# Learning Science Audit Results`,
      ``,
      `**Overall Score: ${results.average.toFixed(1)} / 5.0**`,
      `${results.totalRated}/${totalCount} principles rated`,
      ``,
    ];

    if (results.gaps.length > 0) {
      lines.push(`## Areas for Improvement`);
      lines.push(``);
      results.gaps.forEach((gap) => {
        lines.push(`- **${gap.title}** (${gap.score}/5)`);
        lines.push(`  ${gap.recommendation}`);
      });
      lines.push(``);
    }

    if (results.strengths.length > 0) {
      lines.push(`## Strengths`);
      lines.push(``);
      results.strengths.forEach((s) => {
        lines.push(`- ${s.title} (${s.score}/5)`);
      });
    }

    navigator.clipboard.writeText(lines.join('\n'));
  };

  const shareUrl = () => {
    const scores = principles.map((p) => ratings[p.id] ?? 0).join(',');
    const url = `${window.location.origin}/audit?r=${scores}`;
    navigator.clipboard.writeText(url);
  };

  // Parse URL params on mount
  useState(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const encoded = params.get('r');
    if (encoded) {
      const scores = encoded.split(',').map((s) => parseInt(s, 10));
      const newRatings: Record<string, number | null> = {};
      principles.forEach((p, i) => {
        const score = scores[i];
        newRatings[p.id] = score && score > 0 ? score : null;
      });
      setRatings(newRatings);
      if (scores.some((s) => s > 0)) {
        setShowResults(true);
      }
    }
  });

  return (
    <div className="space-y-8">
      {/* Progress */}
      <div className="sticky top-0 z-10 bg-slate-50 py-4 border-b border-slate-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-700">
            {completedCount} of {totalCount} principles rated
          </span>
          {completedCount > 0 && (
            <button
              onClick={() => setShowResults(!showResults)}
              className="text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              {showResults ? 'Continue Rating' : 'View Results'}
            </button>
          )}
        </div>
        <div className="w-full bg-slate-200 rounded-full h-2">
          <div
            className="bg-slate-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(completedCount / totalCount) * 100}%` }}
          />
        </div>
      </div>

      {showResults && results ? (
        /* Results Section */
        <div className="space-y-6">
          {/* Score Summary */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-slate-900 mb-1">
                {results.average.toFixed(1)} / 5.0
              </div>
              <div className="text-slate-500">
                Overall Score ({results.totalRated}/{totalCount} principles rated)
              </div>
            </div>
          </div>

          {/* Gaps */}
          {results.gaps.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-3">
                Areas for Improvement ({results.gaps.length})
              </h3>
              <div className="space-y-3">
                {results.gaps.map((gap) => (
                  <div
                    key={gap.id}
                    className="bg-white rounded-lg border border-amber-200 p-4"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-amber-600">&#9888;</span>
                        <span className="font-medium text-slate-900">{gap.title}</span>
                        <span
                          className={`px-2 py-0.5 text-xs rounded-full ${categoryColors[gap.category].bg} ${categoryColors[gap.category].text}`}
                        >
                          {gap.category}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-slate-500">
                        {gap.score}/5
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mb-3">{gap.recommendation}</p>
                    <a
                      href={`/principles/${gap.id}`}
                      className="text-sm font-medium text-slate-700 hover:text-slate-900"
                    >
                      Learn more about {gap.title} &rarr;
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Strengths */}
          {results.strengths.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-3">
                Strengths ({results.strengths.length})
              </h3>
              <div className="bg-white rounded-lg border border-green-200 p-4">
                <ul className="space-y-2">
                  {results.strengths.map((s) => (
                    <li key={s.id} className="flex items-center gap-2">
                      <span className="text-green-600">&#10003;</span>
                      <span className="text-slate-900">{s.title}</span>
                      <span className="text-sm text-slate-500">({s.score}/5)</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={copyResults}
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 text-sm font-medium"
            >
              Copy Results
            </button>
            <button
              onClick={shareUrl}
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 text-sm font-medium"
            >
              Copy Share Link
            </button>
          </div>
        </div>
      ) : (
        /* Rating Cards */
        <div className="space-y-4">
          {principles.map((principle) => {
            const promptData = auditData[principle.id];
            const colors = categoryColors[principle.category];

            return (
              <div
                key={principle.id}
                className={`bg-white rounded-lg border p-5 ${
                  ratings[principle.id] !== null
                    ? 'border-slate-200'
                    : 'border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-slate-900">{principle.title}</h3>
                  <span
                    className={`px-2 py-0.5 text-xs rounded-full ${colors.bg} ${colors.text}`}
                  >
                    {principle.category}
                  </span>
                </div>
                <p className="text-slate-600 text-sm mb-4">
                  {promptData?.prompt || principle.summary}
                </p>
                <RatingScale
                  value={ratings[principle.id]}
                  onChange={(score) => handleRating(principle.id, score)}
                  categoryColor={`${colors.bg} ${colors.text}`}
                  rubric={promptData?.rubric}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* Show Results Button at bottom when all completed */}
      {allCompleted && !showResults && (
        <div className="text-center py-6">
          <button
            onClick={() => setShowResults(true)}
            className="px-6 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-medium"
          >
            View Your Results
          </button>
        </div>
      )}
    </div>
  );
}
