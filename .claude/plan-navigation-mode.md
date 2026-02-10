# Plan: Autonomous App Navigation for AI Auditor

## Current Status: ✅ COMPLETE - Merged to Main

**Last Updated:** 2026-02-10

**PRs Merged:**
- PR #8: feat: add live navigation mode and section-type filtering
- PR #9: fix: use valid SectionType values in navigation mode

---

## Progress Summary

### ✅ Phase 1: Complete (Local MCP Browser Control)

All UI and configuration work is done. The following files were created:

| File | Status | Purpose |
|------|--------|---------|
| `.mcp.json` | ✅ Created | Playwright MCP server config using `@playwright/mcp@latest` |
| `src/types/navigation.ts` | ✅ Created | TypeScript types for sessions, flows, captures, interactions |
| `src/data/navigationPrompts.ts` | ✅ Created | System prompts, key moment patterns, content type labels |
| `src/components/react/NavigationMode.tsx` | ✅ Created | Full UI for navigation mode with flow management |
| `src/components/react/AuditTool.tsx` | ✅ Modified | Added "Live Navigation" as third mode option |

**Build status:** Project builds successfully (`npm run build` passes)

### ✅ Phase 2: Complete (MCP Integration & Bug Fixes)

**All tasks completed:**
- ✅ MCP Playwright server connected and verified
- ✅ Added 'ready' status to NavigationSessionStatus type
- ✅ Updated NavigationMode.tsx with ready state UI and JSON import
- ✅ Fixed AuditTool.tsx onComplete handler with proper base64→File conversion
- ✅ Added detectSectionTypeFromCaptures helper function
- ✅ Tested live navigation with Claude Code using MCP tools (Khan Academy, MasteryWrite)
- ✅ Verified end-to-end flow: navigation → capture → import → analysis
- ✅ Added fallback logic for mismatched flow IDs in imported JSON
- ✅ **Fixed SectionType bug:** Changed invalid return values in `detectSectionTypeFromCaptures`:
  - `'assessment'` → `'quiz'` (for quiz_question, quiz_feedback, assessment_result)
  - `'instruction'` → `'lesson'` (for lesson_content)
  - Added `'onboarding'` detection (for onboarding_step)

**Test Results:**
- Successfully navigated Khan Academy and MasteryWrite
- Captured key moments: dashboard, lessons, practice exercises, quiz feedback
- Import correctly creates sections from captures with proper images and notes
- Section type detection maps to valid SectionType values
- AI analysis returns scores for applicable principles (8-9 per section)
- Full end-to-end flow verified in production

---

## How to Use Navigation Mode

### Step 1: Start a Navigation Session

1. Open the audit tool at `/audit`
2. Select "Live Navigation" mode
3. Enter the URL of the learning experience
4. Add flows describing what to test (e.g., "Complete onboarding quiz")
5. Click "Start Navigation" to enter ready state

### Step 2: Navigate with Claude Code

When the UI shows "Ready for Navigation", tell Claude Code something like:

```
Navigate to https://example.com/learning and capture these flows:
- Complete the onboarding quiz
- Take a lesson
```

Claude Code will use MCP Playwright tools to:
1. Open the browser and navigate to the URL
2. Follow the flow descriptions, interacting with the page
3. Capture screenshots at key learning moments
4. Return captures as JSON when complete

### Step 3: Import and Analyze

1. Copy the JSON output from Claude Code
2. Paste it into the import textarea in the UI
3. Click "Import Captures"
4. The captures become sections ready for AI analysis
5. Click "Analyze" to run the learning science audit

---

## Navigation Agent Commands (For Claude Code)

When navigating, use these MCP Playwright tools:

| Tool | Purpose |
|------|---------|
| `browser_navigate(url)` | Navigate to a URL |
| `browser_snapshot()` | Get accessibility tree with element refs |
| `browser_take_screenshot(type: "png")` | Capture current view |
| `browser_click(ref, element)` | Click an element |
| `browser_type(ref, text, element)` | Type into a field |
| `browser_close()` | Close the browser |

### Capture Output Format

Return captures as JSON:
```json
{
  "captures": [
    {
      "id": "uuid",
      "image": "base64-encoded-png",
      "mediaType": "image/png",
      "contentType": "quiz_question",
      "description": "Multiple choice question about...",
      "url": "https://...",
      "pageTitle": "Page Title",
      "flowId": "flow-1",
      "timestamp": 1234567890,
      "trigger": "key_moment",
      "sequenceNumber": 1
    }
  ]
}
```

---

## Key Files Reference

### Types (`src/types/navigation.ts`)

```typescript
// Key types defined:
NavigationSession     // Complete session with flows, captures, interactions
NavigationFlow        // A flow to navigate (id, description, status)
CapturedMoment        // Screenshot with metadata (trigger, contentType, etc.)
Interaction           // Recorded user action (click, type, etc.)
NavigationConfig      // Session configuration (timeouts, viewport)
```

### Prompts (`src/data/navigationPrompts.ts`)

```typescript
// Key exports:
NAVIGATION_SYSTEM_PROMPT  // System prompt for navigation agent
PAGE_ANALYSIS_PROMPT      // Template for analyzing current page
KEY_MOMENT_PATTERNS       // Patterns for detecting learning content
CONTENT_TYPE_LABELS       // Human-readable labels for content types
```

### UI Component (`src/components/react/NavigationMode.tsx`)

- **Props:** `onComplete(session)`, `onCancel()`
- **Setup view:** URL input, flow management, start button
- **Active session view:** Progress, captures, user intervention

### MCP Configuration (`.mcp.json`)

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest"]
    }
  }
}
```

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│  User provides:                                              │
│  - URL of learning experience                                │
│  - Key flows to test ("complete onboarding", "take quiz")   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Navigation Agent (Claude + MCP Playwright)                 │
│  - Views current page screenshot                            │
│  - Decides next action (click, type, scroll, wait)         │
│  - Captures key moments for audit                           │
│  - Follows user's flow guidance                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Captured Experience Data                                    │
│  - Screenshots at key moments                               │
│  - Interaction sequence (what was clicked, typed)           │
│  - Page transitions and timing                              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Existing Audit Pipeline                                     │
│  - Analyze captured screenshots + context                   │
│  - Score against learning science principles                │
│  - Generate recommendations                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## Design Decisions (Confirmed)

1. **Authentication:** User logs in manually first, agent takes over
2. **Failure recovery:** Pause and ask user for help
3. **Scope:** User-defined flows, navigated in sequence

---

## Navigation Agent Core Loop (Implemented)

Claude Code executes this loop when navigating:

```
1. Take screenshot of current page
2. Analyze: What am I looking at? What's the goal?
3. Decide: What's the next action to progress toward goal?
4. Execute: Click/type/scroll/wait
5. Capture: If key moment (quiz, feedback, transition), save screenshot
6. Repeat until flow complete
7. Move to next flow or finish
8. Return captures as JSON for import into UI
```

### Key Moments to Auto-Capture

| Content Type | Trigger |
|--------------|---------|
| `quiz_question` | Quiz/assessment question appears |
| `quiz_feedback` | Answer feedback shown (correct/incorrect) |
| `lesson_content` | Instructional content loads |
| `practice_exercise` | Practice activity appears |
| `progress_indicator` | Progress/dashboard view |
| `onboarding_step` | Welcome/tutorial screens |

---

## Phase 3: Cloud Deployment (Future)

Not started. Options to evaluate later:
- Browserbase (headless browser API)
- Playwright Cloud
- Self-hosted on Railway/Fly.io

---

## Verification Results

### ✅ Local testing:
- Navigated Khan Academy: captured homepage, course overview, practice exercises, feedback
- Navigated MasteryWrite: captured dashboard, lesson content, practice completion, quiz feedback
- All screenshots captured at key moments with correct metadata

### ✅ Integration testing:
- Complete flow verified: URL input → navigation → capture → import → analysis → results
- AI analysis returns proper scores for applicable principles
- Rating cards display AI reasoning and confidence levels

### ✅ Edge cases tested:
- Login-protected content: User logs in manually, then navigation continues
- Multi-flow sessions: Captures grouped by flowId correctly
- Mismatched flow IDs: Fallback logic groups by capture flowIds
