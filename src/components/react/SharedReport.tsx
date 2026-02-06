import { useMemo } from 'react';
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

interface KeyTakeaways {
  priorityCategory: {
    category: string;
    avg: number;
    count: number;
  };
  topActions: Array<{
    id: string;
    title: string;
    score: number;
    recommendation: string;
  }>;
  quickWins: Array<{
    id: string;
    title: string;
    score: number;
  }>;
}

interface SharedReportProps {
  principles: Principle[];
  report: {
    id: string;
    createdAt: string;
    overallScore: number;
    ratings: Record<string, number | null>;
    keyTakeaways: KeyTakeaways | null;
  };
}

const categoryColors: Record<Category, { bg: string; text: string }> = {
  'Memory & Retention': { bg: 'bg-purple-100', text: 'text-purple-800' },
  'Practice & Skill Building': { bg: 'bg-green-100', text: 'text-green-800' },
  'Motivation & Engagement': { bg: 'bg-orange-100', text: 'text-orange-800' },
  'Cognitive Load': { bg: 'bg-blue-100', text: 'text-blue-800' },
  'Feedback & Assessment': { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  'Transfer & Application': { bg: 'bg-pink-100', text: 'text-pink-800' },
};

export default function SharedReport({ principles, report }: SharedReportProps) {
  const results = useMemo(() => {
    const rated = Object.entries(report.ratings).filter(([, score]) => score !== null);
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
  }, [report.ratings, principles]);

  const keyTakeaways = report.keyTakeaways;
  const createdDate = new Date(report.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  if (!results) {
    return <div className="text-center text-slate-500 py-8">No results to display.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-sm text-slate-500">
        Report created on {createdDate}
      </div>

      {/* Score Summary */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="text-center">
          <div className="text-4xl font-bold text-slate-900 mb-1">
            {results.average.toFixed(1)} / 5.0
          </div>
          <div className="text-slate-500">
            Overall Score ({results.totalRated}/{principles.length} principles rated)
          </div>
        </div>
      </div>

      {/* Key Takeaways */}
      {keyTakeaways && (
        <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            Key Takeaways
          </h3>

          <div className="space-y-4">
            {/* Priority Category */}
            <div className="bg-white rounded-lg p-4 border border-slate-200">
              <div className="text-sm font-medium text-slate-500 mb-1">Priority Focus Area</div>
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-1 text-sm rounded-full ${categoryColors[keyTakeaways.priorityCategory.category as Category]?.bg || 'bg-slate-100'} ${categoryColors[keyTakeaways.priorityCategory.category as Category]?.text || 'text-slate-800'}`}
                >
                  {keyTakeaways.priorityCategory.category}
                </span>
                <span className="text-sm text-slate-600">
                  (avg {keyTakeaways.priorityCategory.avg.toFixed(1)}/5 across {keyTakeaways.priorityCategory.count} principle{keyTakeaways.priorityCategory.count !== 1 ? 's' : ''})
                </span>
              </div>
            </div>

            {/* Top Actions */}
            <div className="bg-white rounded-lg p-4 border border-slate-200">
              <div className="text-sm font-medium text-slate-500 mb-2">Top Actions</div>
              <ol className="space-y-2">
                {keyTakeaways.topActions.map((action, i) => (
                  <li key={action.id} className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center">
                      {i + 1}
                    </span>
                    <div>
                      <span className="font-medium text-slate-900">{action.title}</span>
                      <span className="text-slate-400 ml-1">({action.score}/5)</span>
                      <p className="text-sm text-slate-600 mt-0.5">{action.recommendation}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            {/* Quick Wins */}
            {keyTakeaways.quickWins.length > 0 && (
              <div className="bg-white rounded-lg p-4 border border-green-200">
                <div className="text-sm font-medium text-green-700 mb-2 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Quick Wins
                </div>
                <p className="text-sm text-slate-600">
                  {keyTakeaways.quickWins.map((w) => w.title).join(', ')} {keyTakeaways.quickWins.length === 1 ? 'is' : 'are'} at 2-3/5 — small improvements could push {keyTakeaways.quickWins.length === 1 ? 'this' : 'these'} to strengths.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

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
                  <div className="flex items-center gap-2 flex-wrap">
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
                <li key={s.id} className="flex items-center gap-2 flex-wrap">
                  <span className="text-green-600">&#10003;</span>
                  <span className="text-slate-900">{s.title}</span>
                  <span className="text-sm text-slate-500">({s.score}/5)</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Create Your Own */}
      <div className="text-center pt-4 border-t border-slate-200">
        <a
          href="/audit"
          className="inline-block px-6 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-medium"
        >
          Create Your Own Audit
        </a>
      </div>
    </div>
  );
}
