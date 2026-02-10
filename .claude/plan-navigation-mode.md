# Plan: Autonomous App Navigation for AI Auditor

## Current Status: Phase 2 Complete - Ready for Production Use

**Last Updated:** 2026-02-10

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

### ✅ Phase 2: Complete (MCP Integration)

**All tasks completed:**
- ✅ MCP Playwright server connected and verified
- ✅ Added 'ready' status to NavigationSessionStatus type
- ✅ Updated NavigationMode.tsx with ready state UI and JSON import
- ✅ Fixed AuditTool.tsx onComplete handler with proper base64→File conversion
- ✅ Added detectSectionTypeFromCaptures helper function
- ✅ Tested live navigation with Claude Code using MCP tools (Khan Academy)
- ✅ Verified end-to-end flow: navigation → capture → import → analysis
- ✅ Added fallback logic for mismatched flow IDs in imported JSON

**Test Results:**
- Successfully navigated Khan Academy and captured 4 key moments
- Import correctly creates sections from captures with proper images and notes
- Section type detection works (onboarding_step, quiz_question, etc.)
- Ready for AI analysis pipeline

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

## Navigation Agent Core Loop (To Implement)

```
1. Take screenshot of current page
2. Analyze: What am I looking at? What's the goal?
3. Decide: What's the next action to progress toward goal?
4. Execute: Click/type/scroll/wait
5. Capture: If key moment (quiz, feedback, transition), save screenshot
6. Repeat until flow complete
7. Move to next flow or finish
```

### Key Moments to Auto-Capture

- Quiz question appears
- Answer feedback shown
- Lesson content loads
- Progress indicator changes
- Error/help message appears
- Section/module transition
- Any user-triggered interaction result

---

## Phase 3: Cloud Deployment (Future)

Not started. Options to evaluate later:
- Browserbase (headless browser API)
- Playwright Cloud
- Self-hosted on Railway/Fly.io

---

## Verification Plan

1. **Local testing:**
   - Navigate a sample learning app (Khan Academy, Duolingo web)
   - Verify screenshots captured at key moments
   - Run captured data through audit pipeline

2. **Integration testing:**
   - Complete flow: URL input → navigation → audit results
   - Compare results to manual screenshot audit

3. **Edge cases:**
   - Login-protected content
   - Dynamic/animated content
   - Multi-page flows
   - Error states
