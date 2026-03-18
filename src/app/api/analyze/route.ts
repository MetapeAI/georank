import { NextRequest, NextResponse } from "next/server";
import {
  fetchSimilarWeb,
  fetchAhrefs,
  fetchSemrush,
  fetchPageSpeed,
  fetchTavily,
} from "@/lib/api-clients";
import {
  calcTrafficScore,
  calcAiTrafficScore,
  calcDomainScore,
  calcCwvScore,
  calcOverall,
} from "@/lib/scoring";

// Store running analyses in memory (MVP — no DB)
const analyses = new Map<string, any>();

export async function POST(req: NextRequest) {
  const { url } = await req.json();
  if (!url) return NextResponse.json({ error: "URL is required" }, { status: 400 });

  // Normalize URL
  let targetUrl = url.trim();
  if (!targetUrl.startsWith("http")) targetUrl = "https://" + targetUrl;

  const id = crypto.randomUUID();
  analyses.set(id, { status: "running", url: targetUrl, startedAt: Date.now(), progress: 0 });

  // Run analysis in background
  runAnalysis(id, targetUrl);

  return NextResponse.json({ id, status: "running" });
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    // Return all analyses
    const all = Array.from(analyses.entries()).map(([id, data]) => ({ id, ...data }));
    return NextResponse.json(all);
  }
  const data = analyses.get(id);
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ id, ...data });
}

async function runAnalysis(id: string, url: string) {
  const update = (fields: any) => {
    const current = analyses.get(id) || {};
    analyses.set(id, { ...current, ...fields });
  };

  const results: any = { url };
  const errors: string[] = [];

  // 1. SimilarWeb
  update({ progress: 10, step: "Fetching SimilarWeb data..." });
  try {
    results.similarweb = await fetchSimilarWeb(url);
  } catch (e: any) {
    errors.push(`SimilarWeb: ${e.message}`);
  }

  // 2. Ahrefs
  update({ progress: 30, step: "Fetching Ahrefs data..." });
  try {
    results.ahrefs = await fetchAhrefs(url);
  } catch (e: any) {
    errors.push(`Ahrefs: ${e.message}`);
  }

  // 3. Semrush
  update({ progress: 45, step: "Fetching Semrush data..." });
  try {
    results.semrush = await fetchSemrush(url);
  } catch (e: any) {
    errors.push(`Semrush: ${e.message}`);
  }

  // 4. PageSpeed (mobile + desktop)
  update({ progress: 60, step: "Running PageSpeed analysis..." });
  try {
    const [mobile, desktop] = await Promise.all([
      fetchPageSpeed(url, "mobile"),
      fetchPageSpeed(url, "desktop"),
    ]);
    results.pagespeed = { mobile, desktop };
  } catch (e: any) {
    errors.push(`PageSpeed: ${e.message}`);
  }

  // 5. Tavily (third-party presence)
  update({ progress: 80, step: "Checking third-party presence..." });
  try {
    const domain = new URL(url).hostname.replace("www.", "");
    const brandName = domain.split(".")[0];
    results.tavily = await fetchTavily(`${brandName} reviews site:reddit.com OR site:producthunt.com OR site:g2.com OR site:linkedin.com`);
  } catch (e: any) {
    errors.push(`Tavily: ${e.message}`);
  }

  // 6. Calculate scores
  update({ progress: 90, step: "Calculating scores..." });

  const traffic = calcTrafficScore(results.similarweb);
  const aiTraffic = calcAiTrafficScore(results.similarweb);
  const domainAuthority = calcDomainScore(results.ahrefs, results.semrush);
  const coreWebVitals = calcCwvScore(results.pagespeed?.mobile, results.pagespeed?.desktop);

  // Tech infra and content scores need browser audit — placeholder for MVP
  const techInfra = { score: 0, details: "Requires browser audit (coming soon)" };
  const onPageSeo = { score: 0, details: "Requires browser audit (coming soon)" };
  const content = { score: 0, details: "Requires manual review (coming soon)" };
  const thirdParty = { score: 0, details: "Requires manual review (coming soon)" };

  // Check tavily results for third-party presence
  if (results.tavily?.results) {
    const platforms = new Set<string>();
    for (const r of results.tavily.results) {
      const u = r.url || "";
      if (u.includes("reddit.com")) platforms.add("Reddit");
      if (u.includes("producthunt.com")) platforms.add("Product Hunt");
      if (u.includes("g2.com")) platforms.add("G2");
      if (u.includes("linkedin.com")) platforms.add("LinkedIn");
      if (u.includes("github.com")) platforms.add("GitHub");
      if (u.includes("youtube.com")) platforms.add("YouTube");
    }
    thirdParty.score = Math.min(10, platforms.size * 2);
    thirdParty.details = `Found on: ${Array.from(platforms).join(", ") || "None detected"}`;
  }

  const scoreCard = { traffic, aiTraffic, domainAuthority, techInfra, coreWebVitals, onPageSeo, content, thirdParty };
  const overall = calcOverall(scoreCard);

  update({
    status: "done",
    progress: 100,
    step: "Complete",
    results,
    scores: { ...scoreCard, overall },
    errors: errors.length > 0 ? errors : undefined,
    completedAt: Date.now(),
  });
}
