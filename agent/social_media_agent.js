/**
 * PantryPulse Social Media Agent
 * Generates daily AI-powered content: strategy (Claude), image (Krea AI), video (Krea AI)
 * Uses Node 20 built-in fetch — no external dependencies required.
 * Requires: ANTHROPIC_API_KEY, KREA_API_KEY
 */

import fs from 'fs';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const KREA_API_KEY = process.env.KREA_API_KEY;

if (!ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY is not set');
if (!KREA_API_KEY) throw new Error('KREA_API_KEY is not set');

const today = new Date().toISOString().split('T')[0];
const outputDir = `outputs/${today}`;

// ---------------------------------------------------------------------------
// Claude — content strategy
// ---------------------------------------------------------------------------

async function buildStrategy() {
  const prompt = `You are a social media strategist for PantryPulse.in, a trusted Indian online grocery and pantry brand.

Today is ${today}. Your job is to create one high-performing Instagram content piece.

Think about:
- Current food & health trends in India
- Seasonal ingredients, upcoming festivals, or cultural moments
- Content formats that perform well as Reels (quick tips, before/after, satisfying visuals)
- PantryPulse's brand voice: warm, trustworthy, modern Indian kitchen

Return ONLY a valid JSON object — no markdown, no explanation:
{
  "trend_topic": "the trending topic or cultural moment you are tapping into",
  "content_angle": "the specific angle tailored to PantryPulse's products/audience",
  "caption": "ready-to-post Instagram caption (max 150 words) including 10–15 relevant hashtags",
  "call_to_action": "one clear CTA sentence",
  "image_prompt": "detailed photorealistic prompt for Flux image generation — 1:1 square, bright natural lighting, styled Indian kitchen or food scene, no text overlays",
  "video_prompt": "detailed cinematic prompt for Kling video — 9:16 vertical, 8 seconds, smooth camera movement, vibrant colors, dynamic food or kitchen action shot"
}`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-opus-4-6',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Claude API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const text = data.content[0].text.trim();

  // Strip markdown code fences if Claude wraps the JSON
  const clean = text.replace(/^```json?\s*/i, '').replace(/\s*```$/, '').trim();
  return JSON.parse(clean);
}

// ---------------------------------------------------------------------------
// Krea AI — post image (Flux)
// Default model: flux/flux-1.1-pro  Override via KREA_IMAGE_MODEL env var.
// ---------------------------------------------------------------------------

async function generateImage(prompt) {
  const model = process.env.KREA_IMAGE_MODEL || 'flux/flux-1.1-pro';

  const startRes = await fetch(`https://api.krea.ai/generate/image/${model}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      Authorization: `Bearer ${KREA_API_KEY}`,
    },
    body: JSON.stringify({ prompt, aspectRatio: '1:1' }),
  });

  if (!startRes.ok) {
    const err = await startRes.text();
    throw new Error(`Krea image start error ${startRes.status}: ${err}`);
  }

  const startData = await startRes.json();
  const jobId = startData.job_id;
  if (!jobId) throw new Error('Krea image did not return a job_id');

  console.log(`  Krea image job started: ${jobId}`);

  // Poll every 5 s for up to 3 minutes
  for (let attempt = 1; attempt <= 36; attempt++) {
    console.log(`  Polling Krea image (attempt ${attempt}/36)...`);
    await sleep(5_000);

    const pollRes = await fetch(`https://api.krea.ai/jobs/${jobId}`, {
      headers: { Authorization: `Bearer ${KREA_API_KEY}` },
    });

    if (!pollRes.ok) continue;

    const pollData = await pollRes.json();

    if (pollData.status === 'completed') {
      const imageUrl = pollData.result?.url || pollData.result?.urls?.[0];
      if (!imageUrl) throw new Error('Krea image job completed but returned no URL');
      return imageUrl;
    }

    if (pollData.status === 'failed') {
      throw new Error(`Krea image job failed: ${JSON.stringify(pollData.result)}`);
    }
  }

  throw new Error('Krea image generation timed out after 3 minutes');
}

// ---------------------------------------------------------------------------
// Krea AI — reel video (async job with polling)
// Default model: kling/kling-2.5  Override via KREA_VIDEO_MODEL env var.
// ---------------------------------------------------------------------------

async function generateVideo(prompt) {
  const model = process.env.KREA_VIDEO_MODEL || 'kling/kling-2.5';

  const startRes = await fetch(`https://api.krea.ai/generate/video/${model}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      Authorization: `Bearer ${KREA_API_KEY}`,
    },
    body: JSON.stringify({ prompt, aspectRatio: '9:16', duration: 8 }),
  });

  if (!startRes.ok) {
    const err = await startRes.text();
    throw new Error(`Krea video start error ${startRes.status}: ${err}`);
  }

  const startData = await startRes.json();
  const jobId = startData.job_id;
  if (!jobId) throw new Error('Krea video did not return a job_id');

  console.log(`  Krea video job started: ${jobId}`);

  // Poll every 10 s for up to 10 minutes
  for (let attempt = 1; attempt <= 60; attempt++) {
    console.log(`  Polling Krea video (attempt ${attempt}/60)...`);
    await sleep(10_000);

    const pollRes = await fetch(`https://api.krea.ai/jobs/${jobId}`, {
      headers: { Authorization: `Bearer ${KREA_API_KEY}` },
    });

    if (!pollRes.ok) continue;

    const pollData = await pollRes.json();

    if (pollData.status === 'completed') {
      const videoUrl = pollData.result?.video_url || pollData.result?.urls?.[0];
      if (!videoUrl) throw new Error('Krea video job completed but returned no URL');
      return videoUrl;
    }

    if (pollData.status === 'failed') {
      throw new Error(`Krea video job failed: ${JSON.stringify(pollData.result)}`);
    }
  }

  return null; // timed out — caller handles gracefully
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function downloadFile(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download file: ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

function writeBrief(strategy, videoTimedOut) {
  return `# PantryPulse Content Brief — ${today}

## Trend Topic
${strategy.trend_topic}

## Content Angle
${strategy.content_angle}

## Caption
${strategy.caption}

## Call to Action
${strategy.call_to_action}

---

## Image Prompt (Krea AI / Flux)
\`\`\`
${strategy.image_prompt}
\`\`\`

## Video Prompt (Krea AI / Kling)
\`\`\`
${strategy.video_prompt}
\`\`\`
${
  videoTimedOut
    ? '\n> **Krea video timed out.** Paste the video prompt above into [Krea AI](https://www.krea.ai) to generate manually.'
    : ''
}
`;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log(`\n🚀 PantryPulse Social Media Agent — ${today}\n`);
  fs.mkdirSync(outputDir, { recursive: true });

  const summary = { date: today, steps: {}, errors: [], status: 'running' };

  try {
    // ── 1. Strategy ──────────────────────────────────────────────────────────
    console.log('📊 Building content strategy with Claude...');
    const strategy = await buildStrategy();
    fs.writeFileSync(`${outputDir}/strategy.json`, JSON.stringify(strategy, null, 2));
    summary.steps.strategy = 'success';
    console.log(`✅ Strategy: "${strategy.trend_topic}"\n`);

    // ── 2. Image ─────────────────────────────────────────────────────────────
    const imageModel = process.env.KREA_IMAGE_MODEL || 'flux/flux-1.1-pro';
    console.log(`🖼️  Generating image with Krea AI (${imageModel})...`);
    try {
      const imageUrl = await generateImage(strategy.image_prompt);
      const imageBuffer = await downloadFile(imageUrl);
      fs.writeFileSync(`${outputDir}/post.png`, imageBuffer);
      summary.steps.image = 'success';
      console.log('✅ Image saved: post.png\n');
    } catch (err) {
      summary.steps.image = `error: ${err.message}`;
      summary.errors.push(`Image: ${err.message}`);
      console.error('❌ Image generation failed:', err.message, '\n');
    }

    // ── 3. Video ─────────────────────────────────────────────────────────────
    const videoModel = process.env.KREA_VIDEO_MODEL || 'kling/kling-2.5';
    console.log(`🎬 Generating reel with Krea AI (${videoModel}, this can take 3–10 min)...`);
    let videoTimedOut = false;
    try {
      const videoUrl = await generateVideo(strategy.video_prompt);
      if (videoUrl) {
        const videoBuffer = await downloadFile(videoUrl);
        fs.writeFileSync(`${outputDir}/reel.mp4`, videoBuffer);
        summary.steps.video = 'success';
        console.log('✅ Video saved: reel.mp4\n');
      } else {
        videoTimedOut = true;
        summary.steps.video = 'timeout — prompt saved in brief.md';
        console.log('⚠️  Krea video timed out — prompt saved in brief.md for manual use\n');
      }
    } catch (err) {
      videoTimedOut = true;
      summary.steps.video = `error: ${err.message}`;
      summary.errors.push(`Video: ${err.message}`);
      console.error('❌ Video generation failed:', err.message, '\n');
    }

    // ── 4. Brief ─────────────────────────────────────────────────────────────
    fs.writeFileSync(`${outputDir}/brief.md`, writeBrief(strategy, videoTimedOut));
    summary.steps.brief = 'success';

    summary.status = summary.errors.length === 0 ? 'success' : 'partial';
  } catch (err) {
    summary.status = 'error';
    summary.errors.push(err.message);
    console.error('💥 Fatal error:', err.message);
    process.exitCode = 1;
  }

  fs.writeFileSync(`${outputDir}/run_summary.json`, JSON.stringify(summary, null, 2));

  console.log(`📁 Outputs → ${outputDir}/`);
  console.log(`📋 Status  : ${summary.status}`);
  if (summary.errors.length) {
    console.log(`⚠️  Errors  : ${summary.errors.join(' | ')}`);
  }
}

main();
