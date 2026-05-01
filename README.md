# PantryPulse Social Media Agent

Automated daily social media content generator for [PantryPulse.in](https://pantrypulse.in).

Every day at **10:00 AM IST** the agent:
1. Scans Instagram Reels, YouTube Shorts & Facebook for what's trending
2. Builds a PantryPulse-aligned content strategy using Claude AI
3. Generates a post **image** using Google Imagen 3
4. Generates a **reel video** using Google Veo 3.1
5. Saves everything (image, video, caption, brief) to `outputs/YYYY-MM-DD/`
6. Commits outputs back to this repo automatically

---

## Output Structure

```
outputs/
  2025-07-15/
    post.png           → Instagram image (1:1 square)
    reel.mp4           → Short reel (9:16 vertical, 8 seconds)
    brief.md           → Full content brief with strategy + prompts
    strategy.json      → Raw strategy data
    run_summary.json   → Success / error log for the run
```

---

## Setup (one-time, ~5 minutes)

### Step 1 → Fork or clone this repo

```bash
git clone https://github.com/YOUR_USERNAME/pantrypulse-agent.git
cd pantrypulse-agent
```

Push it to your own GitHub account.

---

### Step 2 → Add GitHub Secrets

Go to your repo → **Settings → Secrets and variables → Actions → New repository secret**

| Secret name | Where to get it |
|---|---|
| `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com) → API Keys |
| `GOOGLE_AI_API_KEY` | [aistudio.google.com](https://aistudio.google.com) → Get API Key |

---

### Step 3 → Enable write permissions for Actions

Go to **Settings → Actions → General → Workflow permissions**
→ Select **"Read and write permissions"** → Save

This lets the workflow commit generated content back to the repo.

---

### Step 4 → Enable the workflow

Go to the **Actions** tab in your repo. If GitHub shows a banner asking you to enable workflows, click **"I understand my workflows, go ahead and enable them"**.

---

### Step 5 → Test it manually

Go to **Actions → PantryPulse Daily Social Agent → Run workflow → Run workflow**

Watch the logs live. On success you'll see new files in `outputs/YYYY-MM-DD/`.

---

## Change the Run Time

Edit `.github/workflows/daily_agent.yml` → find the `cron:` line:

```yaml
- cron: '30 4 * * *'   # Default = 10:00 AM IST
```

| Time (IST) | Cron (UTC) |
|---|---|
| 10:00 AM | `30 4 * * *` |
| 10:30 AM | `0 5 * * *` |
| 11:00 AM | `30 5 * * *` |

> Note: GitHub Actions can be 5–15 minutes late on scheduled runs.

---

## Run Locally

```bash
# Install (no external deps needed — uses Node 20 built-in fetch)
npm install

# Set keys
export ANTHROPIC_API_KEY=your_anthropic_key
export GOOGLE_AI_API_KEY=your_google_key

# Run
npm start
```

Outputs saved to `outputs/YYYY-MM-DD/`.

---

## API Access Requirements

| API | Access | Notes |
|---|---|---|
| Claude (Anthropic) | Paid API | ~$0.01–0.05 per run |
| Google Imagen 3 | Free tier on AI Studio | Available immediately |
| Google Veo 3.1 | **Preview access required** | Request at [ai.google.dev](https://ai.google.dev) |

> **If Veo 3.1 is unavailable**, the agent still completes and saves the image, caption, and a video prompt you can paste manually into [Google AI Studio VideoFX](https://aistudio.google.com/app/generate-videos).

---

## Troubleshooting

**Workflow not running on schedule?**
GitHub pauses scheduled workflows on repos with no activity for 60 days. Do any commit to re-activate.

**Imagen 3 access denied?**
Make sure your Google AI key has Imagen 3 enabled. Test at [aistudio.google.com](https://aistudio.google.com).

**Veo times out?**
Veo 3.1 rendering can take 3–5 minutes. The agent polls for up to 6 minutes. If it still times out, the video prompt is saved in `brief.md` for manual use.

**Want to run more than once a day?**
Add extra cron lines:
```yaml
- cron: '30 4 * * *'   # 10:00 AM IST
- cron: '30 10 * * *'  # 4:00 PM IST
```
