# Live Audit Skill

Navigate a web-based learning experience and capture key moments as a JSON file with embedded screenshots. The JSON can then be pasted into the web app for analysis.

## Phase 1: Setup

First, ask the user for:

1. **URL** - The starting URL of the learning experience
2. **Flows** - List of user journeys to capture (e.g., "Dashboard to lesson", "Lesson to practice", "Practice to lesson complete")
3. **Learner Persona** (optional) - How to behave when answering questions:
   - `struggling` - Answer incorrectly ~70% of the time, experience failure paths
   - `developing` - Mixed accuracy (~40% incorrect)
   - `proficient` - Answer correctly ~85% of the time
   - `mixed` - Deliberately alternate to capture both correct/incorrect paths
   - `natural` - Default behavior (usually correct)

Confirm the configuration before starting navigation.

## Phase 2: Navigate & Capture

Use MCP Playwright tools to navigate the learning experience. Load the tools using ToolSearch first:

```
ToolSearch: select:mcp__playwright__browser_navigate
ToolSearch: select:mcp__playwright__browser_snapshot
ToolSearch: select:mcp__playwright__browser_take_screenshot
ToolSearch: select:mcp__playwright__browser_click
ToolSearch: select:mcp__playwright__browser_type
```

### Session Folder Setup

Before starting navigation, create a timestamped session folder to keep generated files organized:

```bash
mkdir -p tmp/live-audit/<YYYY-MM-DD-HHmmss>
```

Replace `<YYYY-MM-DD-HHmmss>` with the current timestamp (e.g., `2024-02-10-143052`). All screenshots and the captures.json file will be saved to this folder.

### Navigation Process

1. **Navigate to URL**: `browser_navigate(url)`
2. **Analyze page**: `browser_snapshot()` to understand current state
3. **Identify content type** based on these patterns:
   - **Quiz Question**: "question", "quiz", "test", "assessment", "select the", "choose the", "which of the following"
   - **Quiz Feedback**: "correct", "incorrect", "wrong", "right answer", "try again", "well done", "great job"
   - **Lesson Content**: "lesson", "learn about", "introduction to", "chapter", "module", "topic"
   - **Progress Indicator**: "progress", "complete", "achievement", "level up", "xp", "points", "streak"
   - **Onboarding**: "welcome", "get started", "set your goal", "create profile", "tutorial"
   - **Practice Exercise**: "practice", "exercise", "try it", "your turn", "activity", "challenge"
   - **Review/Summary**: "review", "summary", "recap", "key points", "what you learned"

4. **Capture at key moments**: `browser_take_screenshot()` (save to session folder) when you see:
   - Quiz questions (BEFORE answering)
   - Feedback after answering (both correct and incorrect)
   - Quiz results (pass and fail states)
   - New lesson content or explanations
   - Progress indicators or completion messages
   - Onboarding steps
   - Review or summary screens
   - Any noteworthy UX patterns

5. **Progress through content**: Use `browser_click()` and `browser_type()` to interact

### Persona Behavior

Follow the persona instructions when answering questions:

- **Struggling**: Select WRONG answers ~70% of the time. Pick plausibly incorrect options. Use retry if available.
- **Developing**: Mix correct and incorrect (~40% wrong). Accept some failures without retrying.
- **Proficient**: Answer correctly ~85% of the time. Make occasional natural mistakes.
- **Mixed**: Answer WRONG first, then CORRECT on retry to capture both paths.
- **Natural**: Answer as you normally would.

### Capture Metadata

For each screenshot, record this metadata:

```json
{
  "id": "uuid",
  "flowId": "flow-1",
  "sequenceNumber": 1,
  "timestamp": 1707580800000,
  "contentType": "quiz_question | quiz_feedback | lesson_content | progress_indicator | onboarding_step | practice_exercise | review_summary | assessment_result | error_message | help_tooltip | unknown",
  "trigger": "navigation | interaction | content_change | key_moment | flow_start | flow_end",
  "url": "https://example.com/lesson/1",
  "pageTitle": "Page Title",
  "description": "Description of what's visible and why it's important",
  "wasCorrect": true/false (for quiz_feedback),
  "attemptNumber": 1 (for quiz_feedback),
  "activePersona": "struggling | developing | proficient | mixed | natural"
}
```

## Phase 3: Generate captures.json

After completing all flows, create a `captures.json` file with all captured moments:

```json
{
  "session": {
    "startUrl": "https://example.com",
    "startedAt": 1707580800000,
    "endedAt": 1707581400000,
    "defaultPersona": "natural"
  },
  "flows": [
    {
      "id": "flow-1",
      "description": "Dashboard to lesson",
      "status": "completed",
      "persona": "natural"
    }
  ],
  "captures": [
    {
      "id": "capture-uuid",
      "image": "base64-encoded-png",
      "mediaType": "image/png",
      "timestamp": 1707580800000,
      "trigger": "key_moment",
      "url": "https://example.com/lesson/1",
      "pageTitle": "Lesson 1",
      "description": "Quiz question asking about...",
      "contentType": "quiz_question",
      "flowId": "flow-1",
      "sequenceNumber": 1,
      "wasCorrect": null,
      "attemptNumber": null,
      "activePersona": "natural"
    }
  ],
  "interactions": []
}
```

Save this file in the session folder as `captures.json` (e.g., `tmp/live-audit/2024-02-10-143052/captures.json`).

After saving, output the full path to the JSON file so the user can easily find it to paste into the web app.

**Note:** The `tmp/` folder is gitignored. Old session folders can be deleted when no longer needed.

## Handling Issues

If you encounter:
- **Login screens**: Ask the user to log in manually
- **Captchas**: Ask the user to solve and confirm when ready
- **Navigation stuck**: Take a screenshot and ask the user for guidance
- **Errors**: Document and ask user how to proceed

## Example Usage

After running `/live-audit`, provide:

```
URL: https://masterywrite.app/dashboard
Flows:
1. Dashboard to lesson
2. Lesson to practice (use "struggling" persona)
3. Practice to lesson complete
```

Expected output:
1. Browser opens and navigates through all flows
2. 5-15 screenshots captured at key moments
3. `captures.json` saved to session folder (`tmp/live-audit/<timestamp>/`)
4. Full path to JSON file output for easy copy/paste into web app
