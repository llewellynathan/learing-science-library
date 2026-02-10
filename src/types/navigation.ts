/**
 * Types for the autonomous navigation feature of the AI auditor.
 * Enables Claude to navigate web-based learning experiences and capture
 * key moments for learning science principle analysis.
 */

/** Represents a flow to navigate through the learning experience */
export interface NavigationFlow {
  id: string;
  /** User-provided description of the flow, e.g., "Complete the onboarding quiz" */
  description: string;
  /** Current status of this flow */
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped';
  /** Optional notes added by user or agent */
  notes?: string;
}

/** Types of triggers for capturing a screenshot */
export type CaptureTrigger =
  | 'navigation'      // Page/URL change
  | 'interaction'     // Click, form submit, etc.
  | 'content_change'  // Significant DOM change detected
  | 'key_moment'      // AI-detected important learning moment
  | 'user_requested'  // User manually requested capture
  | 'flow_start'      // Beginning of a flow
  | 'flow_end';       // End of a flow

/** Types of learning-related content detected */
export type LearningContentType =
  | 'quiz_question'
  | 'quiz_feedback'
  | 'lesson_content'
  | 'progress_indicator'
  | 'error_message'
  | 'help_tooltip'
  | 'navigation_menu'
  | 'onboarding_step'
  | 'assessment_result'
  | 'practice_exercise'
  | 'review_summary'
  | 'unknown';

/** A captured moment during navigation */
export interface CapturedMoment {
  id: string;
  /** Base64-encoded screenshot */
  image: string;
  /** Image media type (e.g., 'image/png') */
  mediaType: string;
  /** Timestamp of capture */
  timestamp: number;
  /** What triggered this capture */
  trigger: CaptureTrigger;
  /** Current page URL at time of capture */
  url: string;
  /** Page title at time of capture */
  pageTitle: string;
  /** AI-generated description of what's visible */
  description: string;
  /** Detected type of learning content */
  contentType: LearningContentType;
  /** ID of the flow this belongs to */
  flowId: string;
  /** Sequence number within the flow */
  sequenceNumber: number;
}

/** Types of user interactions that can be performed */
export type InteractionType =
  | 'click'
  | 'type'
  | 'scroll'
  | 'select'
  | 'hover'
  | 'wait'
  | 'navigate';

/** A recorded interaction during navigation */
export interface Interaction {
  id: string;
  /** Type of interaction */
  type: InteractionType;
  /** Timestamp of interaction */
  timestamp: number;
  /** Target element selector or description */
  target: string;
  /** Value for type/select interactions */
  value?: string;
  /** Duration for wait interactions (ms) */
  duration?: number;
  /** URL for navigate interactions */
  url?: string;
  /** ID of the flow this belongs to */
  flowId: string;
  /** Whether this interaction succeeded */
  success: boolean;
  /** Error message if failed */
  error?: string;
}

/** Status of the overall navigation session */
export type NavigationSessionStatus =
  | 'idle'
  | 'ready'            // Session configured, waiting for Claude Code to navigate
  | 'starting'
  | 'navigating'
  | 'waiting_for_user'
  | 'capturing'
  | 'completed'
  | 'failed';

/** Reason for waiting for user intervention */
export type WaitingReason =
  | 'login_required'
  | 'captcha_detected'
  | 'navigation_stuck'
  | 'confirmation_needed'
  | 'unknown_state';

/** Complete navigation session data */
export interface NavigationSession {
  id: string;
  /** Starting URL */
  startUrl: string;
  /** User-defined flows to navigate */
  flows: NavigationFlow[];
  /** All captured screenshots */
  captures: CapturedMoment[];
  /** All recorded interactions */
  interactions: Interaction[];
  /** Current session status */
  status: NavigationSessionStatus;
  /** Currently active flow ID */
  currentFlowId?: string;
  /** Reason if waiting for user */
  waitingReason?: WaitingReason;
  /** Current screenshot (for showing state to user) */
  currentScreenshot?: string;
  /** Session start timestamp */
  startedAt: number;
  /** Session end timestamp */
  endedAt?: number;
  /** Error message if failed */
  error?: string;
}

/** Configuration for navigation session */
export interface NavigationConfig {
  /** Maximum time to wait for page load (ms) */
  pageLoadTimeout: number;
  /** Maximum time per flow before giving up (ms) */
  flowTimeout: number;
  /** Delay between actions (ms) - helps with rate limiting */
  actionDelay: number;
  /** Whether to capture on every interaction */
  captureOnInteraction: boolean;
  /** Whether to capture on navigation */
  captureOnNavigation: boolean;
  /** Auto-detect and capture key learning moments */
  autoDetectKeyMoments: boolean;
  /** Browser viewport size */
  viewport: {
    width: number;
    height: number;
  };
}

/** Default navigation configuration */
export const DEFAULT_NAVIGATION_CONFIG: NavigationConfig = {
  pageLoadTimeout: 30000,
  flowTimeout: 300000, // 5 minutes per flow
  actionDelay: 500,
  captureOnInteraction: true,
  captureOnNavigation: true,
  autoDetectKeyMoments: true,
  viewport: {
    width: 1280,
    height: 720,
  },
};

/** Props for the NavigationMode component */
export interface NavigationModeProps {
  /** Callback when navigation session completes with captures */
  onComplete: (session: NavigationSession) => void;
  /** Callback when user cancels navigation */
  onCancel: () => void;
}

/** Data structure for sending captures to the analyze API */
export interface NavigationAnalysisRequest {
  /** Captured moments to analyze */
  captures: CapturedMoment[];
  /** Interaction history for context */
  interactions: Interaction[];
  /** Flow descriptions for context */
  flows: NavigationFlow[];
  /** Session metadata */
  session: {
    startUrl: string;
    duration: number; // ms
  };
}
