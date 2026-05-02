# Fix Image/Video Access Error — Session Context

## Branch
`claude/fix-image-access-error-yTHnA`

## Repository
`dailygkquiz2026-coder/socialmedia-agent`

## Problem (from 2026-05-01 run_summary.json)

| Step    | Status  | Error                                                                 |
|---------|---------|-----------------------------------------------------------------------|
| strategy | success | —                                                                    |
| image   | error   | Imagen 3 error 403: PERMISSION_DENIED — "Your project has been denied access." |
| video   | error   | Veo 3.1 start error 404 (empty body)                                  |
| brief   | success | —                                                                    |

## Root Causes

### Image (403 PERMISSION_DENIED)
- **File**: `agent/social_media_agent.js` — `generateImage()` line 75
- **Old model**: `imagen-3.0-generate-001` via `:predict` endpoint
- **Cause**: Imagen 3 requires special project allowlisting in Google AI Studio. Standard API keys are denied.
- **Fix**: Switched to `gemini-2.0-flash-preview-image-generation` via `:generateContent` endpoint.
  - Uses the same `GOOGLE_AI_API_KEY` with no special access needed.
  - Response structure changed: image is in `candidates[0].content.parts[].inlineData.data`.

### Video (404 Not Found)
- **File**: `agent/social_media_agent.js` — `generateVideo()` line 104
- **Old endpoint**: `veo-2.0-generate-001:generateVideo` — this method does not exist (404).
- **Cause**: The correct long-running method for Veo is `:predictLongRunning`, not `:generateVideo`.
- **Fix**: Change method suffix to `:predictLongRunning`.

## Changes Made

### `agent/social_media_agent.js`

1. **`generateImage()`** — replaced Imagen 3 with Gemini image generation:
   - Endpoint: `.../gemini-2.0-flash-preview-image-generation:generateContent`
   - Body: `{ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseModalities: ['image','text'] } }`
   - Extract: `candidates[0].content.parts.find(p => p.inlineData).inlineData.data`

2. **`generateVideo()`** — fix method suffix:
   - Old: `veo-2.0-generate-001:generateVideo`
   - New: `veo-2.0-generate-001:predictLongRunning`

3. **Misc label updates**:
   - Module docstring: "image (Gemini), video (Veo 2)"
   - Console logs in `main()`: updated from "Imagen 3" / "Veo 3.1"
   - `writeBrief()`: section headings updated

## Status
- [x] Image fix applied (Gemini image generation)
- [ ] Video fix pending (`:generateVideo` → `:predictLongRunning`)
- [ ] Misc label cleanup pending
- [ ] Commit & push to branch

## Environment Variables Required
| Variable            | Purpose                        | Source                        |
|---------------------|--------------------------------|-------------------------------|
| `ANTHROPIC_API_KEY` | Claude content strategy        | console.anthropic.com         |
| `GOOGLE_AI_API_KEY` | Gemini image + Veo video       | aistudio.google.com/apikey    |
