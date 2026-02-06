import { useState, useMemo, useCallback } from 'react';
import RatingScale from './RatingScale';
import ImageUpload from './ImageUpload';
import FollowUpQuestions, { type FollowUpAnswer } from './FollowUpQuestions';
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

interface ImageFile {
  file: File;
  preview: string;
}

interface Section {
  id: string;
  name: string;
  images: ImageFile[];
  notes: string;
}

interface AIScore {
  score: number;
  reasoning: string;
  confidence: 'high' | 'medium' | 'low';
  notApplicable?: boolean;
}

interface SectionResult {
  sectionId: string;
  sectionName: string;
  scores: Record<string, AIScore>;
}

interface RefinedScore {
  principleId: string;
  originalScore: number;
  refinedScore: number;
  refinedReasoning: string;
  specificActions: string[];
}

const categoryColors: Record<Category, { bg: string; text: string }> = {
  'Memory & Retention': { bg: 'bg-purple-100', text: 'text-purple-800' },
  'Practice & Skill Building': { bg: 'bg-green-100', text: 'text-green-800' },
  'Motivation & Engagement': { bg: 'bg-orange-100', text: 'text-orange-800' },
  'Cognitive Load': { bg: 'bg-blue-100', text: 'text-blue-800' },
  'Feedback & Assessment': { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  'Transfer & Application': { bg: 'bg-pink-100', text: 'text-pink-800' },
};

const confidenceColors = {
  high: 'text-green-600',
  medium: 'text-amber-600',
  low: 'text-slate-400',
};

const SECTION_PRESETS = [
  'Pre-Lesson Quiz',
  'Lesson / Instruction',
  'Post-Lesson Quiz',
  'Practice Activity',
  'Review / Summary',
  'Onboarding',
  'Assessment',
];

export default function AuditTool({ principles }: AuditToolProps) {
  const [mode, setMode] = useState<'manual' | 'ai'>('manual');
  const [ratings, setRatings] = useState<Record<string, number | null>>(() =>
    Object.fromEntries(principles.map((p) => [p.id, null]))
  );
  const [showResults, setShowResults] = useState(false);

  // Section-based state
  const [sections, setSections] = useState<Section[]>([]);
  const [newSectionName, setNewSectionName] = useState('');
  const [sectionResults, setSectionResults] = useState<SectionResult[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzingSection, setAnalyzingSection] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resultsTab, setResultsTab] = useState<'overall' | string>('overall');
  const [isSharing, setIsSharing] = useState(false);
  const [sharedUrl, setSharedUrl] = useState<string | null>(null);

  // Follow-up questions state
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [refinedScores, setRefinedScores] = useState<RefinedScore[]>([]);

  const completedCount = Object.values(ratings).filter((r) => r !== null).length;
  const totalCount = principles.length;
  const allCompleted = completedCount === totalCount;

  // Combine section results into overall scores
  const combinedAiScores = useMemo(() => {
    if (sectionResults.length === 0) return null;

    const combined: Record<string, AIScore & { contributingSection: string }> = {};

    for (const principle of principles) {
      let bestScore: (AIScore & { contributingSection: string }) | null = null;

      for (const result of sectionResults) {
        const score = result.scores[principle.id];
        if (score && !score.notApplicable && score.score > 0) {
          if (!bestScore || score.score > bestScore.score) {
            bestScore = { ...score, contributingSection: result.sectionName };
          }
        }
      }

      if (bestScore) {
        combined[principle.id] = bestScore;
      }
    }

    return combined;
  }, [sectionResults, principles]);

  // Identify low-scoring principles for follow-up
  const lowScoringPrinciples = useMemo(() => {
    if (!combinedAiScores) return [];

    return Object.entries(combinedAiScores)
      .filter(([, score]) => score.score <= 3 && !score.notApplicable)
      .map(([id, score]) => {
        const principle = principles.find((p) => p.id === id)!;
        return {
          id,
          title: principle.title,
          score: score.score,
          reasoning: score.reasoning,
        };
      })
      .sort((a, b) => a.score - b.score);
  }, [combinedAiScores, principles]);

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
          contributingSection: combinedAiScores?.[id]?.contributingSection,
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
          contributingSection: combinedAiScores?.[id]?.contributingSection,
        };
      })
      .sort((a, b) => b.score - a.score);

    return { average, gaps, strengths, totalRated: rated.length };
  }, [ratings, principles, combinedAiScores]);

  // Generate key takeaways from results
  const keyTakeaways = useMemo(() => {
    if (!results || results.gaps.length === 0) return null;

    // Group gaps by category and find lowest average
    const categoryAvg: Record<string, number[]> = {};
    for (const gap of results.gaps) {
      if (!categoryAvg[gap.category]) categoryAvg[gap.category] = [];
      categoryAvg[gap.category].push(gap.score);
    }

    const priorityCategory = Object.entries(categoryAvg)
      .map(([cat, scores]) => ({
        category: cat,
        avg: scores.reduce((a, b) => a + b, 0) / scores.length,
        count: scores.length,
      }))
      .sort((a, b) => a.avg - b.avg)[0];

    // Top 3 actions (already sorted by score in results.gaps)
    const topActions = results.gaps.slice(0, 3);

    // Quick wins: scores of 2-3 (easier to improve than 1s)
    const quickWins = results.gaps.filter((g) => g.score >= 2 && g.score <= 3);

    return { priorityCategory, topActions, quickWins };
  }, [results]);

  const handleRating = (principleId: string, score: number) => {
    setRatings((prev) => ({ ...prev, [principleId]: score }));
  };

  const addSection = useCallback((name: string) => {
    if (!name.trim()) return;
    setSections((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name: name.trim(), images: [], notes: '' },
    ]);
    setNewSectionName('');
  }, []);

  const removeSection = useCallback((id: string) => {
    setSections((prev) => {
      const section = prev.find((s) => s.id === id);
      if (section) {
        section.images.forEach((img) => URL.revokeObjectURL(img.preview));
      }
      return prev.filter((s) => s.id !== id);
    });
  }, []);

  const updateSectionImages = useCallback((sectionId: string, images: ImageFile[]) => {
    setSections((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, images } : s))
    );
  }, []);

  const updateSectionNotes = useCallback((sectionId: string, notes: string) => {
    setSections((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, notes } : s))
    );
  }, []);

  const analyzeSections = useCallback(async () => {
    const sectionsWithImages = sections.filter((s) => s.images.length > 0);
    if (sectionsWithImages.length === 0) return;

    setIsAnalyzing(true);
    setError(null);
    setSectionResults([]);

    const results: SectionResult[] = [];

    for (const section of sectionsWithImages) {
      setAnalyzingSection(section.name);

      try {
        const imageData = await Promise.all(
          section.images.map(async (img) => {
            const buffer = await img.file.arrayBuffer();
            const base64 = btoa(
              new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
            );
            return { data: base64, mediaType: img.file.type };
          })
        );

        const response = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            images: imageData,
            sectionName: section.name,
            sectionNotes: section.notes || undefined,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Analysis failed for ${section.name}`);
        }

        const data = await response.json();
        results.push({
          sectionId: section.id,
          sectionName: section.name,
          scores: data.scores,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Analysis failed');
        setIsAnalyzing(false);
        setAnalyzingSection(null);
        return;
      }
    }

    setSectionResults(results);

    // Pre-fill ratings with best scores
    const newRatings: Record<string, number | null> = {};
    for (const principle of principles) {
      let bestScore = 0;
      for (const result of results) {
        const score = result.scores[principle.id];
        if (score && !score.notApplicable && score.score > bestScore) {
          bestScore = score.score;
        }
      }
      newRatings[principle.id] = bestScore > 0 ? bestScore : null;
    }
    setRatings(newRatings);

    setIsAnalyzing(false);
    setAnalyzingSection(null);

    // Check for low-scoring principles to trigger follow-up
    const lowScoring = Object.entries(newRatings)
      .filter(([, score]) => score !== null && score <= 3);
    if (lowScoring.length > 0) {
      setShowFollowUp(true);
    }
  }, [sections, principles]);

  const resetAudit = useCallback(() => {
    setRatings(Object.fromEntries(principles.map((p) => [p.id, null])));
    setSections([]);
    setSectionResults([]);
    setShowResults(false);
    setShowFollowUp(false);
    setRefinedScores([]);
    setError(null);
    setResultsTab('overall');
  }, [principles]);

  // Handle follow-up completion
  const handleFollowUpComplete = useCallback(async (answers: FollowUpAnswer[]) => {
    if (!combinedAiScores) return;

    setIsRefining(true);
    setError(null);

    // Build original scores for the refine API
    const originalScores = lowScoringPrinciples.map((p) => ({
      principleId: p.id,
      title: p.title,
      score: p.score,
      reasoning: p.reasoning,
    }));

    try {
      const response = await fetch('/api/refine-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ originalScores, answers }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to refine analysis');
      }

      const data = await response.json();
      setRefinedScores(data.refinedScores || []);

      // Update ratings with refined scores
      const newRatings = { ...ratings };
      for (const refined of data.refinedScores || []) {
        newRatings[refined.principleId] = refined.refinedScore;
      }
      setRatings(newRatings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refine analysis');
    } finally {
      setIsRefining(false);
      setShowFollowUp(false);
    }
  }, [combinedAiScores, lowScoringPrinciples, ratings]);

  const handleFollowUpSkip = useCallback(() => {
    setShowFollowUp(false);
  }, []);

  const copyResults = () => {
    if (!results) return;

    const lines = [
      `# Learning Science Audit Results`,
      ``,
      `**Overall Score: ${results.average.toFixed(1)} / 5.0**`,
      `${results.totalRated}/${totalCount} principles rated`,
      ``,
    ];

    // Add Key Takeaways
    if (keyTakeaways) {
      lines.push(`## Key Takeaways`);
      lines.push(``);
      lines.push(`**Priority Focus:** ${keyTakeaways.priorityCategory.category} (avg ${keyTakeaways.priorityCategory.avg.toFixed(1)}/5)`);
      lines.push(``);
      lines.push(`**Top Actions:**`);
      keyTakeaways.topActions.forEach((action, i) => {
        lines.push(`${i + 1}. **${action.title}** (${action.score}/5) - ${action.recommendation}`);
      });
      if (keyTakeaways.quickWins.length > 0) {
        lines.push(``);
        lines.push(`**Quick Wins:** ${keyTakeaways.quickWins.map((w) => w.title).join(', ')}`);
      }
      lines.push(``);
    }

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

  const shareLegacyUrl = () => {
    const scores = principles.map((p) => ratings[p.id] ?? 0).join(',');
    const url = `${window.location.origin}/audit?r=${scores}`;
    navigator.clipboard.writeText(url);
  };

  const shareReport = async () => {
    if (!results) return;

    setIsSharing(true);
    setSharedUrl(null);

    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          overallScore: results.average,
          ratings,
          sectionResults: sectionResults.length > 0 ? sectionResults : null,
          keyTakeaways,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to share report');
      }

      const data = await response.json();
      const fullUrl = `${window.location.origin}${data.url}`;
      setSharedUrl(fullUrl);
      navigator.clipboard.writeText(fullUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to share report');
    } finally {
      setIsSharing(false);
    }
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

  const sectionsWithImages = sections.filter((s) => s.images.length > 0);

  return (
    <div className="space-y-8">
      {/* Mode Toggle */}
      <div className="flex gap-2 p-1 bg-slate-100 rounded-lg w-fit">
        <button
          onClick={() => { setMode('manual'); resetAudit(); }}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            mode === 'manual'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Manual Audit
        </button>
        <button
          onClick={() => { setMode('ai'); resetAudit(); }}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            mode === 'ai'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          AI-Assisted Audit
        </button>
      </div>

      {/* AI Mode: Section-based Upload */}
      {mode === 'ai' && sectionResults.length === 0 && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-2">Define Your Learning Experience Sections</h3>
            <p className="text-sm text-slate-600 mb-4">
              Break your learning experience into sections (e.g., pre-quiz, lesson, practice game).
              Upload up to 5 screenshots for each section.
            </p>

            {/* Add Section */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newSectionName}
                onChange={(e) => setNewSectionName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addSection(newSectionName)}
                placeholder="Section name..."
                className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                disabled={isAnalyzing}
              />
              <button
                onClick={() => addSection(newSectionName)}
                disabled={!newSectionName.trim() || isAnalyzing}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed"
              >
                Add Section
              </button>
            </div>

            {/* Presets */}
            <div className="flex flex-wrap gap-2 mb-6">
              {SECTION_PRESETS.filter((p) => !sections.some((s) => s.name === p)).map((preset) => (
                <button
                  key={preset}
                  onClick={() => addSection(preset)}
                  disabled={isAnalyzing}
                  className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-full text-xs hover:bg-slate-200 disabled:opacity-50"
                >
                  + {preset}
                </button>
              ))}
            </div>

            {/* Section Cards */}
            {sections.length > 0 && (
              <div className="space-y-4">
                {sections.map((section) => (
                  <div
                    key={section.id}
                    className="border border-slate-200 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-slate-900">{section.name}</h4>
                      <button
                        onClick={() => removeSection(section.id)}
                        disabled={isAnalyzing}
                        className="text-slate-400 hover:text-red-500 disabled:opacity-50"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <ImageUpload
                      images={section.images}
                      onChange={(images) => updateSectionImages(section.id, images)}
                      maxImages={5}
                      disabled={isAnalyzing}
                    />
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Additional context <span className="text-slate-400 font-normal">(optional)</span>
                      </label>
                      <textarea
                        value={section.notes}
                        onChange={(e) => updateSectionNotes(section.id, e.target.value)}
                        placeholder="Describe behaviors not visible in screenshots (e.g., random question selection, adaptive difficulty, spaced repetition timing, personalization...)"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 resize-none"
                        rows={3}
                        disabled={isAnalyzing}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {sections.length === 0 && (
              <div className="text-center py-8 text-slate-500 text-sm">
                Add sections to get started. Each section can have up to 5 screenshots.
              </div>
            )}
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Analyze Button */}
          <div className="flex gap-3">
            <button
              onClick={analyzeSections}
              disabled={sectionsWithImages.length === 0 || isAnalyzing}
              className={`px-6 py-2 rounded-lg font-medium text-white transition-colors ${
                sectionsWithImages.length === 0 || isAnalyzing
                  ? 'bg-slate-300 cursor-not-allowed'
                  : 'bg-slate-900 hover:bg-slate-800'
              }`}
            >
              {isAnalyzing ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Analyzing {analyzingSection}...
                </span>
              ) : (
                `Analyze ${sectionsWithImages.length} Section${sectionsWithImages.length !== 1 ? 's' : ''}`
              )}
            </button>
          </div>
        </div>
      )}

      {/* Follow-up Questions Phase */}
      {mode === 'ai' && showFollowUp && lowScoringPrinciples.length > 0 && (
        <div className="space-y-6">
          {isRefining ? (
            <div className="bg-white rounded-lg border border-slate-200 p-8 text-center">
              <svg className="animate-spin h-8 w-8 mx-auto mb-4 text-slate-600" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <p className="text-slate-600">Refining your results based on your answers...</p>
            </div>
          ) : (
            <FollowUpQuestions
              lowScoringPrinciples={lowScoringPrinciples}
              onComplete={handleFollowUpComplete}
              onSkip={handleFollowUpSkip}
            />
          )}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}
        </div>
      )}

      {/* Progress */}
      {(mode === 'manual' || (sectionResults.length > 0 && !showFollowUp)) && (
        <div className="sticky top-0 z-10 bg-slate-50 py-4 border-b border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-700">
              {completedCount} of {totalCount} principles rated
              {sectionResults.length > 0 && (
                <span className="text-slate-400 ml-2">
                  (from {sectionResults.length} section{sectionResults.length !== 1 ? 's' : ''})
                </span>
              )}
            </span>
            <div className="flex gap-3">
              {sectionResults.length > 0 && (
                <button
                  onClick={resetAudit}
                  className="text-sm font-medium text-slate-500 hover:text-slate-700"
                >
                  Start Over
                </button>
              )}
              {completedCount > 0 && (
                <button
                  onClick={() => setShowResults(!showResults)}
                  className="text-sm font-medium text-slate-600 hover:text-slate-900"
                >
                  {showResults ? 'Continue Rating' : 'View Results'}
                </button>
              )}
            </div>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div
              className="bg-slate-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(completedCount / totalCount) * 100}%` }}
            />
          </div>
        </div>
      )}

      {showResults && results && !showFollowUp ? (
        /* Results Section */
        <div className="space-y-6">
          {/* Results Tabs (if section-based) */}
          {sectionResults.length > 0 && (
            <div className="flex gap-2 p-1 bg-slate-100 rounded-lg w-fit">
              <button
                onClick={() => setResultsTab('overall')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  resultsTab === 'overall'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Overall
              </button>
              {sectionResults.map((sr) => (
                <button
                  key={sr.sectionId}
                  onClick={() => setResultsTab(sr.sectionId)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    resultsTab === sr.sectionId
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {sr.sectionName}
                </button>
              ))}
            </div>
          )}

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
                      className={`px-2 py-1 text-sm rounded-full ${categoryColors[keyTakeaways.priorityCategory.category as Category].bg} ${categoryColors[keyTakeaways.priorityCategory.category as Category].text}`}
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
                  <div className="text-sm font-medium text-slate-500 mb-2">
                    Top Actions
                    {refinedScores.length > 0 && (
                      <span className="ml-2 text-xs text-green-600">(refined based on your answers)</span>
                    )}
                  </div>
                  <ol className="space-y-3">
                    {keyTakeaways.topActions.map((action, i) => {
                      const refined = refinedScores.find((r) => r.principleId === action.id);
                      return (
                        <li key={action.id} className="flex items-start gap-2">
                          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center">
                            {i + 1}
                          </span>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-slate-900">{action.title}</span>
                              {refined && refined.refinedScore !== refined.originalScore ? (
                                <span className="text-sm">
                                  <span className="text-slate-400 line-through">{refined.originalScore}/5</span>
                                  <span className="text-green-600 ml-1">{refined.refinedScore}/5</span>
                                </span>
                              ) : (
                                <span className="text-slate-400">({action.score}/5)</span>
                              )}
                            </div>
                            {refined ? (
                              <>
                                <p className="text-sm text-slate-600 mt-1">{refined.refinedReasoning}</p>
                                {refined.specificActions.length > 0 && (
                                  <ul className="mt-2 space-y-1">
                                    {refined.specificActions.map((sa, idx) => (
                                      <li key={idx} className="text-sm text-slate-700 flex items-start gap-1">
                                        <span className="text-green-500">→</span>
                                        {sa}
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </>
                            ) : (
                              <p className="text-sm text-slate-600 mt-0.5">{action.recommendation}</p>
                            )}
                          </div>
                        </li>
                      );
                    })}
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
                      {keyTakeaways.quickWins.map((w) => w.title).join(', ')} {keyTakeaways.quickWins.length === 1 ? 'is' : 'are'} at {keyTakeaways.quickWins.length === 1 ? `${keyTakeaways.quickWins[0].score}/5` : '2-3/5'} — small improvements could push {keyTakeaways.quickWins.length === 1 ? 'this' : 'these'} to strengths.
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
                        {gap.contributingSection && (
                          <span className="text-xs text-slate-400">
                            from: {gap.contributingSection}
                          </span>
                        )}
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
                      {s.contributingSection && (
                        <span className="text-xs text-slate-400">
                          from: {s.contributingSection}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            <div className="flex gap-3">
              <button
                onClick={copyResults}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 text-sm font-medium"
              >
                Copy Results
              </button>
              <button
                onClick={shareReport}
                disabled={isSharing}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:bg-slate-400 text-sm font-medium flex items-center gap-2"
              >
                {isSharing ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Sharing...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    Share Report
                  </>
                )}
              </button>
            </div>
            {sharedUrl && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="text-sm text-green-800 font-medium mb-1">Report shared! Link copied to clipboard.</div>
                <div className="text-sm text-green-700 font-mono break-all">{sharedUrl}</div>
              </div>
            )}
          </div>
        </div>
      ) : (mode === 'manual' || (sectionResults.length > 0 && !showFollowUp)) ? (
        /* Rating Cards */
        <div className="space-y-4">
          {principles.map((principle) => {
            const promptData = auditData[principle.id];
            const colors = categoryColors[principle.category];
            const aiScore = combinedAiScores?.[principle.id];

            // Get section-specific view if tab selected
            const selectedSection = sectionResults.find((sr) => sr.sectionId === resultsTab);
            const sectionScore = selectedSection?.scores[principle.id];

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

                {/* AI Reasoning */}
                {aiScore && (
                  <div className="mb-4 p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-slate-500">AI Analysis</span>
                      <span className={`text-xs ${confidenceColors[aiScore.confidence]}`}>
                        ({aiScore.confidence} confidence)
                      </span>
                      {aiScore.contributingSection && (
                        <span className="text-xs text-slate-400">
                          from: {aiScore.contributingSection}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-700">{aiScore.reasoning}</p>
                  </div>
                )}

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
      ) : null}

      {/* Show Results Button at bottom when all completed */}
      {allCompleted && !showResults && !showFollowUp && (mode === 'manual' || sectionResults.length > 0) && (
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
