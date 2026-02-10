import { useState, useCallback, useEffect } from 'react';
import type {
  NavigationFlow,
  NavigationSession,
  NavigationSessionStatus,
  CapturedMoment,
  NavigationConfig,
  WaitingReason,
  LearnerPersona,
} from '../../types/navigation';
import { LEARNER_PERSONAS } from '../../types/navigation';
import { CONTENT_TYPE_LABELS } from '../../data/navigationPrompts';

interface NavigationModeProps {
  onComplete: (session: NavigationSession) => void;
  onCancel: () => void;
}

const FLOW_PRESETS = [
  'Complete the onboarding',
  'Take a lesson quiz',
  'Review incorrect answers',
  'Explore the practice section',
  'Check progress/achievements',
];

const WAITING_REASON_MESSAGES: Record<WaitingReason, string> = {
  login_required: 'Login is required. Please log in to continue.',
  captcha_detected: 'A captcha was detected. Please solve it to continue.',
  navigation_stuck: 'Navigation got stuck. Please help me proceed.',
  confirmation_needed: 'Confirmation needed before proceeding.',
  unknown_state: 'I\'m not sure how to proceed from here.',
};

export default function NavigationMode({ onComplete, onCancel }: NavigationModeProps) {
  // Session setup state
  const [startUrl, setStartUrl] = useState('');
  const [flows, setFlows] = useState<NavigationFlow[]>([]);
  const [newFlowDescription, setNewFlowDescription] = useState('');
  const [defaultPersona, setDefaultPersona] = useState<LearnerPersona>('mixed');

  // Active session state
  const [session, setSession] = useState<NavigationSession | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Capture preview
  const [selectedCapture, setSelectedCapture] = useState<CapturedMoment | null>(null);

  // Import results
  const [importJson, setImportJson] = useState('');

  const addFlow = useCallback((description: string) => {
    if (!description.trim()) return;
    setFlows((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        description: description.trim(),
        status: 'pending',
      },
    ]);
    setNewFlowDescription('');
  }, []);

  const removeFlow = useCallback((id: string) => {
    setFlows((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const reorderFlow = useCallback((id: string, direction: 'up' | 'down') => {
    setFlows((prev) => {
      const index = prev.findIndex((f) => f.id === id);
      if (index === -1) return prev;

      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= prev.length) return prev;

      const newFlows = [...prev];
      [newFlows[index], newFlows[newIndex]] = [newFlows[newIndex], newFlows[index]];
      return newFlows;
    });
  }, []);

  const updateFlowPersona = useCallback((id: string, persona: LearnerPersona | undefined) => {
    setFlows((prev) =>
      prev.map((f) => (f.id === id ? { ...f, persona } : f))
    );
  }, []);

  const startNavigation = useCallback(async () => {
    if (!startUrl.trim() || flows.length === 0) return;

    setIsStarting(true);
    setError(null);

    // Create initial session in 'ready' state
    const newSession: NavigationSession = {
      id: crypto.randomUUID(),
      startUrl: startUrl.trim(),
      flows: flows.map((f) => ({ ...f, status: 'pending' as const })),
      captures: [],
      interactions: [],
      status: 'ready',
      startedAt: Date.now(),
      defaultPersona,
    };

    setSession(newSession);
    setIsStarting(false);
  }, [startUrl, flows]);

  // Import navigation results from JSON (from Claude Code)
  const importResults = useCallback((jsonText: string) => {
    if (!jsonText.trim()) return;

    try {
      const data = JSON.parse(jsonText);

      if (!data.captures || !Array.isArray(data.captures)) {
        setError('Invalid format: expected { captures: [...] }');
        return;
      }

      setSession((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          captures: data.captures,
          status: 'completed',
          endedAt: Date.now(),
        };
      });
      setImportJson('');
      setError(null);
    } catch (e) {
      setError('Invalid JSON format. Please paste the captures JSON from Claude Code.');
    }
  }, []);

  const handleUserIntervention = useCallback((action: 'continue' | 'skip' | 'abort') => {
    if (!session) return;

    if (action === 'abort') {
      setSession((prev) => prev ? {
        ...prev,
        status: 'completed',
        endedAt: Date.now(),
      } : null);
      return;
    }

    if (action === 'skip') {
      // Skip to next flow
      setSession((prev) => {
        if (!prev) return null;
        const currentIndex = prev.flows.findIndex((f) => f.id === prev.currentFlowId);
        const nextFlow = prev.flows[currentIndex + 1];

        return {
          ...prev,
          status: nextFlow ? 'navigating' : 'completed',
          currentFlowId: nextFlow?.id,
          waitingReason: undefined,
          flows: prev.flows.map((f) =>
            f.id === prev.currentFlowId
              ? { ...f, status: 'skipped' as const }
              : f
          ),
        };
      });
      return;
    }

    // Continue - clear waiting state
    setSession((prev) => prev ? {
      ...prev,
      status: 'navigating',
      waitingReason: undefined,
    } : null);
  }, [session]);

  const completeSession = useCallback(() => {
    if (session) {
      onComplete(session);
    }
  }, [session, onComplete]);

  const isReady = startUrl.trim() && flows.length > 0;
  const captureCount = session?.captures.length ?? 0;
  const completedFlowCount = session?.flows.filter((f) => f.status === 'completed').length ?? 0;

  // Session setup view
  if (!session) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-900 mb-2">Live Navigation Mode</h3>
          <p className="text-sm text-slate-600 mb-6">
            Let Claude navigate your learning experience like a real user. Provide a URL and describe
            the key flows you want to test. Claude will capture screenshots at important moments.
          </p>

          {/* URL Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Starting URL
            </label>
            <input
              type="url"
              value={startUrl}
              onChange={(e) => setStartUrl(e.target.value)}
              placeholder="https://example.com/learning-app"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
            <p className="mt-1 text-xs text-slate-500">
              If login is required, you'll be able to log in manually when the session starts.
            </p>
          </div>

          {/* Flows */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Flows to Test
            </label>

            {flows.length > 0 && (
              <div className="space-y-2 mb-4">
                {flows.map((flow, index) => (
                  <div
                    key={flow.id}
                    className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg"
                  >
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-200 text-slate-600 text-xs flex items-center justify-center">
                      {index + 1}
                    </span>
                    <span className="flex-1 text-sm text-slate-700">{flow.description}</span>
                    <select
                      value={flow.persona || ''}
                      onChange={(e) => updateFlowPersona(flow.id, e.target.value ? e.target.value as LearnerPersona : undefined)}
                      className="text-xs border border-slate-200 rounded px-2 py-1 bg-white text-slate-600"
                      title="Override persona for this flow"
                    >
                      <option value="">Use default</option>
                      {LEARNER_PERSONAS.map((p) => (
                        <option key={p.persona} value={p.persona}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                    <div className="flex gap-1">
                      <button
                        onClick={() => reorderFlow(flow.id, 'up')}
                        disabled={index === 0}
                        className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30"
                        title="Move up"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      </button>
                      <button
                        onClick={() => reorderFlow(flow.id, 'down')}
                        disabled={index === flows.length - 1}
                        className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30"
                        title="Move down"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      <button
                        onClick={() => removeFlow(flow.id)}
                        className="p-1 text-slate-400 hover:text-red-500"
                        title="Remove"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <input
                type="text"
                value={newFlowDescription}
                onChange={(e) => setNewFlowDescription(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addFlow(newFlowDescription)}
                placeholder="Describe a flow to test..."
                className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
              />
              <button
                onClick={() => addFlow(newFlowDescription)}
                disabled={!newFlowDescription.trim()}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed"
              >
                Add Flow
              </button>
            </div>

            {/* Flow presets */}
            {FLOW_PRESETS.filter((p) => !flows.some((f) => f.description === p)).length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {FLOW_PRESETS.filter((p) => !flows.some((f) => f.description === p)).map((preset) => (
                  <button
                    key={preset}
                    onClick={() => addFlow(preset)}
                    className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-full text-xs hover:bg-slate-200"
                  >
                    + {preset}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Default Persona */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Default Learner Persona
            </label>
            <select
              value={defaultPersona}
              onChange={(e) => setDefaultPersona(e.target.value as LearnerPersona)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
            >
              {LEARNER_PERSONAS.map((p) => (
                <option key={p.persona} value={p.persona}>
                  {p.label} - {p.description}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-500">
              The persona determines how questions are answered. "Path Explorer" captures both correct and incorrect feedback.
            </p>
          </div>

          {error && (
            <div className="p-3 mb-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={startNavigation}
              disabled={!isReady || isStarting}
              className={`px-6 py-2 rounded-lg font-medium text-white transition-colors ${
                !isReady || isStarting
                  ? 'bg-slate-300 cursor-not-allowed'
                  : 'bg-slate-900 hover:bg-slate-800'
              }`}
            >
              {isStarting ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Starting...
                </span>
              ) : (
                'Start Navigation'
              )}
            </button>
            <button
              onClick={onCancel}
              className="px-4 py-2 text-slate-600 hover:text-slate-900"
            >
              Cancel
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-600">
          <h4 className="font-medium text-slate-900 mb-2">How it works</h4>
          <ol className="list-decimal list-inside space-y-1">
            <li>Enter the URL of your learning experience</li>
            <li>Define the flows you want Claude to test (in order)</li>
            <li>Claude will open a browser and navigate as a real user would</li>
            <li>If login is needed, you'll be prompted to log in manually</li>
            <li>Claude captures screenshots at key learning moments</li>
            <li>When done, the captures are analyzed for learning science principles</li>
          </ol>
        </div>
      </div>
    );
  }

  // Active session view
  return (
    <div className="space-y-6">
      {/* Session header */}
      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-slate-900">Navigation in Progress</h3>
            <p className="text-sm text-slate-500 truncate max-w-md">{session.startUrl}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              session.status === 'ready' ? 'bg-blue-100 text-blue-700' :
              session.status === 'navigating' ? 'bg-blue-100 text-blue-700' :
              session.status === 'waiting_for_user' ? 'bg-amber-100 text-amber-700' :
              session.status === 'completed' ? 'bg-green-100 text-green-700' :
              session.status === 'failed' ? 'bg-red-100 text-red-700' :
              'bg-slate-100 text-slate-700'
            }`}>
              {session.status === 'ready' ? 'Ready for Navigation' :
               session.status === 'navigating' ? 'Navigating' :
               session.status === 'waiting_for_user' ? 'Waiting for you' :
               session.status === 'completed' ? 'Completed' :
               session.status === 'failed' ? 'Failed' :
               session.status === 'capturing' ? 'Capturing' :
               'Starting'}
            </span>
          </div>
        </div>

        {/* Flow progress */}
        <div className="space-y-2">
          {session.flows.map((flow, index) => (
            <div
              key={flow.id}
              className={`flex items-center gap-2 p-2 rounded ${
                flow.id === session.currentFlowId ? 'bg-blue-50' : 'bg-slate-50'
              }`}
            >
              <span className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                flow.status === 'completed' ? 'bg-green-500 text-white' :
                flow.status === 'in_progress' ? 'bg-blue-500 text-white' :
                flow.status === 'failed' ? 'bg-red-500 text-white' :
                flow.status === 'skipped' ? 'bg-slate-400 text-white' :
                'bg-slate-200 text-slate-600'
              }`}>
                {flow.status === 'completed' ? '✓' :
                 flow.status === 'failed' ? '✕' :
                 flow.status === 'skipped' ? '—' :
                 index + 1}
              </span>
              <span className={`flex-1 text-sm ${
                flow.status === 'skipped' ? 'text-slate-400 line-through' :
                flow.id === session.currentFlowId ? 'text-slate-900 font-medium' :
                'text-slate-600'
              }`}>
                {flow.description}
              </span>
              {flow.id === session.currentFlowId && session.status === 'navigating' && (
                <svg className="animate-spin h-4 w-4 text-blue-500" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              )}
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="flex gap-6 mt-4 pt-4 border-t border-slate-100">
          <div className="text-center">
            <div className="text-2xl font-bold text-slate-900">{captureCount}</div>
            <div className="text-xs text-slate-500">Screenshots</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-slate-900">{session.interactions.length}</div>
            <div className="text-xs text-slate-500">Interactions</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-slate-900">{completedFlowCount}/{session.flows.length}</div>
            <div className="text-xs text-slate-500">Flows Done</div>
          </div>
        </div>
      </div>

      {/* Ready for Navigation - Instructions and Import */}
      {session.status === 'ready' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <h4 className="font-medium text-blue-900 mb-2">Ready for Navigation</h4>
              <p className="text-sm text-blue-800 mb-3">
                Tell Claude Code to navigate your learning experience. Say something like:
              </p>
              <div className="bg-white/50 rounded p-3 mb-4 font-mono text-sm text-blue-900">
                "Navigate to {session.startUrl} using the '{LEARNER_PERSONAS.find(p => p.persona === (session.defaultPersona || 'mixed'))?.label || 'Path Explorer'}' persona and capture these flows: {session.flows.map(f => {
                  const personaLabel = f.persona
                    ? LEARNER_PERSONAS.find(p => p.persona === f.persona)?.label
                    : null;
                  return personaLabel ? `${f.description} (${personaLabel})` : f.description;
                }).join(', ')}"
              </div>
              <p className="text-xs text-blue-700 mb-2">
                <strong>Persona:</strong> {LEARNER_PERSONAS.find(p => p.persona === (session.defaultPersona || 'mixed'))?.description || 'Alternates to capture both correct and incorrect feedback'}
              </p>

              <div className="border-t border-blue-200 pt-4 mt-4">
                <h5 className="text-sm font-medium text-blue-900 mb-2">Import Results</h5>
                <p className="text-xs text-blue-700 mb-2">
                  After Claude Code captures screenshots, paste the JSON output here:
                </p>
                <textarea
                  value={importJson}
                  onChange={(e) => setImportJson(e.target.value)}
                  placeholder='{"captures": [...]}'
                  className="w-full h-24 px-3 py-2 border border-blue-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => importResults(importJson)}
                    disabled={!importJson.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed"
                  >
                    Import Captures
                  </button>
                  <button
                    onClick={onCancel}
                    className="px-4 py-2 text-blue-600 text-sm hover:text-blue-800"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User intervention needed */}
      {session.status === 'waiting_for_user' && session.waitingReason && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="flex-1">
              <h4 className="font-medium text-amber-800">
                {WAITING_REASON_MESSAGES[session.waitingReason]}
              </h4>
              {session.currentScreenshot && (
                <div className="mt-3">
                  <img
                    src={`data:image/png;base64,${session.currentScreenshot}`}
                    alt="Current page state"
                    className="max-w-full h-48 object-contain rounded border border-amber-200"
                  />
                </div>
              )}
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => handleUserIntervention('continue')}
                  className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700"
                >
                  I've done it, continue
                </button>
                <button
                  onClick={() => handleUserIntervention('skip')}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200"
                >
                  Skip this flow
                </button>
                <button
                  onClick={() => handleUserIntervention('abort')}
                  className="px-4 py-2 text-slate-500 text-sm hover:text-slate-700"
                >
                  Stop navigation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Captured screenshots */}
      {session.captures.length > 0 && (
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <h4 className="font-medium text-slate-900 mb-3">Captured Moments</h4>
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {session.captures.map((capture) => (
              <button
                key={capture.id}
                onClick={() => setSelectedCapture(capture)}
                className="relative group"
              >
                <img
                  src={`data:${capture.mediaType};base64,${capture.image}`}
                  alt={capture.description}
                  className="w-full h-20 object-cover rounded border border-slate-200 hover:border-slate-400"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-1 rounded-b">
                  <span className="text-white text-xs truncate block">
                    {CONTENT_TYPE_LABELS[capture.contentType]}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Capture detail modal */}
      {selectedCapture && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-medium text-slate-900">
                  {CONTENT_TYPE_LABELS[selectedCapture.contentType]}
                </h3>
                <p className="text-sm text-slate-500">{selectedCapture.pageTitle}</p>
              </div>
              <button
                onClick={() => setSelectedCapture(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4">
              <img
                src={`data:${selectedCapture.mediaType};base64,${selectedCapture.image}`}
                alt={selectedCapture.description}
                className="w-full rounded border border-slate-200"
              />
              <p className="mt-4 text-sm text-slate-700">{selectedCapture.description}</p>
              <div className="mt-2 text-xs text-slate-500">
                <span>URL: {selectedCapture.url}</span>
                <span className="mx-2">•</span>
                <span>Trigger: {selectedCapture.trigger}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Session complete actions */}
      {session.status === 'completed' && (
        <div className="flex gap-3">
          <button
            onClick={completeSession}
            disabled={session.captures.length === 0}
            className="px-6 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed"
          >
            Analyze {session.captures.length} Captures
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2 text-slate-600 hover:text-slate-900"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Error display */}
      {session.error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {session.error}
        </div>
      )}
    </div>
  );
}
