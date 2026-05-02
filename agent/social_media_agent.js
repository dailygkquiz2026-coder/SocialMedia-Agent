/**
 * PantryPulse Social Media Agent
 * Generates daily AI-powered content: strategy (seasonal template), image (Krea AI), video (Krea AI)
 * Uses Node 20 built-in fetch — no external dependencies required.
 * Only requires: KREA_API_KEY
 */

import fs from 'fs';

const KREA_API_KEY = process.env.KREA_API_KEY;
if (!KREA_API_KEY) throw new Error('KREA_API_KEY is not set');

const today = new Date().toISOString().split('T')[0];
const outputDir = `outputs/${today}`;

// ---------------------------------------------------------------------------
// Strategy — month-aware seasonal template (no LLM / no API key needed)
// ---------------------------------------------------------------------------

function buildStrategy() {
  const month = new Date().getMonth(); // 0 = Jan … 11 = Dec

  const topics = [
    // Jan
    {
      trend: 'New Year health resolutions + winter superfoods',
      angle: 'Start the year right with PantryPulse immunity-boosting pantry staples',
      image_scene: 'flat lay of winter superfoods — turmeric, ginger, amla, methi — on a wooden counter, warm morning light',
      video_scene: 'slow zoom into a steaming bowl of haldi doodh surrounded by fresh turmeric and ginger roots',
    },
    // Feb
    {
      trend: "Valentine's Day + homemade treats",
      angle: 'Surprise your loved ones with DIY chocolates using PantryPulse ingredients',
      image_scene: 'heart-shaped dark chocolate truffles on a marble board with rose petals, soft warm lighting',
      video_scene: 'hands drizzling melted chocolate over truffles in a bright Indian kitchen, close-up',
    },
    // Mar
    {
      trend: 'Holi festival + thandai season',
      angle: 'Make the perfect thandai at home with PantryPulse dry fruits and spices',
      image_scene: 'glasses of thandai with rose petals and saffron strands on a colorful festive table',
      video_scene: 'vibrant thandai being poured into a glass with dry fruits cascading in slow motion, festive colors',
    },
    // Apr
    {
      trend: 'Summer prep + cooling foods',
      angle: "Beat the heat with PantryPulse's aam panna and sattu essentials",
      image_scene: 'tall glass of aam panna with mint and ice on a bright sunlit kitchen counter',
      video_scene: 'refreshing aam panna being stirred with mint swirling in slow motion, bright airy kitchen',
    },
    // May
    {
      trend: 'Mango season peak + gut health awareness',
      angle: "Celebrate mango season with PantryPulse's pure alphonso pulp and probiotic recipes",
      image_scene: 'ripe alphonso mangoes halved on a white marble counter with mango lassi in background, bright natural light',
      video_scene: 'mango lassi being poured into a tall glass with crushed ice, golden mangoes visible in background',
    },
    // Jun
    {
      trend: 'Monsoon snacking + chai culture',
      angle: 'Monsoon calls for PantryPulse chai masala and crispy snack essentials',
      image_scene: 'steaming chai cup with pakoras on a rainy window-sill, cozy warm tones',
      video_scene: 'close-up of chai being poured into a clay cup with rain drops on window in background',
    },
    // Jul
    {
      trend: 'Sawan + sattvic eating',
      angle: 'Sawan-special sattvic meals with PantryPulse whole grains and dairy',
      image_scene: 'thali with sabudana khichdi, fruits, and mishri on banana leaf, natural soft lighting',
      video_scene: 'hands arranging a beautiful sattvic thali with colorful fruits and sabudana dishes',
    },
    // Aug
    {
      trend: 'Independence Day + desi superfoods',
      angle: "Celebrate with tricolor dishes made from PantryPulse's 100% Indian ingredients",
      image_scene: 'tricolor thali — saffron rice, white paneer, green spinach — on a traditional brass plate',
      video_scene: 'colorful tricolor food arrangement being plated artistically in an Indian kitchen',
    },
    // Sep
    {
      trend: 'Ganesh Chaturthi + modak season',
      angle: 'Make authentic steamed modaks at home with PantryPulse rice flour and jaggery',
      image_scene: 'freshly steamed modaks arranged on a banana leaf with marigold flowers, temple-style setup',
      video_scene: 'hands folding a modak with steam rising, festive orange marigold flowers in background',
    },
    // Oct
    {
      trend: 'Navratri + fasting superfoods',
      angle: 'Navratri vrat made delicious with PantryPulse kuttu, sabudana and sendha namak',
      image_scene: 'kuttu ki puri with aloo sabzi and curd, served on a clay plate, earthy natural tones',
      video_scene: 'crispy kuttu puris being fried in a kadhai with splattering oil in slow motion',
    },
    // Nov
    {
      trend: 'Diwali sweets + gifting season',
      angle: 'Homemade Diwali sweets are trending — use PantryPulse dry fruits and ghee',
      image_scene: 'assorted Diwali sweets — kaju katli, besan ladoo, gulab jamun — in a golden gift box with diyas',
      video_scene: 'hands placing kaju katli pieces into a decorative Diwali box with diyas in the background',
    },
    // Dec
    {
      trend: 'Christmas + winter baking',
      angle: 'Bake the perfect plum cake with PantryPulse dry fruits and premium flour',
      image_scene: 'sliced Christmas plum cake with candied fruits on a wooden board, fairy lights in background',
      video_scene: 'slicing a rich plum cake revealing dry fruit layers inside, cozy warm Christmas kitchen',
    },
  ];

  const t = topics[month];

  return {
    trend_topic: t.trend,
    content_angle: t.angle,
    caption: `✨ ${t.angle}\n\nShop now at PantryPulse.in — India's trusted pantry brand 🛒\n\n#PantryPulse #IndianKitchen #HealthyEating #IndianFood #FoodPhotography #HomeCooking #FoodBlogger #IndianRecipes #PantryEssentials #CleanEating #KitchenGoals #FoodStyling #InstaFood #FoodLovers #MadeInIndia`,
    call_to_action: 'Shop the freshest pantry essentials at PantryPulse.in — link in bio!',
    image_prompt: `Photorealistic food photography, 1:1 square format, bright natural window lighting, styled modern Indian kitchen. ${t.image_scene}. No text overlays, no people, ultra-detailed, professional food photography.`,
    video_prompt: `Cinematic food video, 9:16 vertical, 8 seconds, smooth slow-motion camera movement, vibrant natural colors, professional food videography. ${t.video_scene}. No text overlays, no people, ultra-high quality.`,
  };
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
    console.log('📊 Building content strategy...');
    const strategy = buildStrategy();
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
