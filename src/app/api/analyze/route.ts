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
  calcThirdPartyScore,
  calcOverall,
} from "@/lib/scoring";

const analyses = new Map<string, any>();

export async function POST(req: NextRequest) {
  const { url } = await req.json();
  if (!url) return NextResponse.json({ error: "URL is required" }, { status: 400 });

  let targetUrl = url.trim();
  if (!targetUrl.startsWith("http")) targetUrl = "https://" + targetUrl;

  const id = crypto.randomUUID();
  analyses.set(id, { status: "running", url: targetUrl, startedAt: Date.now(), progress: 0 });

  runAnalysis(id, targetUrl);

  return NextResponse.json({ id, status: "running" });
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
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

  // 2. Ahrefs (returns merged object by type)
  update({ progress: 30, step: "Fetching Ahrefs data..." });
  try {
    results.ahrefs = await fetchAhrefs(url);
  } catch (e: any) {
    errors.push(`Ahrefs: ${e.message}`);
  }

  // 3. Semrush
  update({ progress: 50, step: "Fetching Semrush data..." });
  try {
    results.semrush = await fetchSemrush(url);
  } catch (e: any) {
    errors.push(`Semrush: ${e.message}`);
  }

  // 4. PageSpeed (mobile + desktop in parallel)
  update({ progress: 65, step: "Running PageSpeed analysis..." });
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
    results.tavily = await fetchTavily(
      `${brandName} reviews site:reddit.com OR site:producthunt.com OR site:g2.com OR site:linkedin.com OR site:github.com OR site:youtube.com`
    );
  } catch (e: any) {
    errors.push(`Tavily: ${e.message}`);
  }

  // 6. Calculate scores
  update({ progress: 95, step: "Calculating scores..." });

  const traffic = calcTrafficScore(results.similarweb);
  const aiTraffic = calcAiTrafficScore(results.similarweb);
  const domainAuthority = calcDomainScore(results.ahrefs, results.semrush);
  const coreWebVitals = calcCwvScore(results.pagespeed?.mobile, results.pagespeed?.desktop);
  const thirdParty = calcThirdPartyScore(results.tavily);

  // Placeholder scores for browser-audit modules
  const techInfra = { score: 0, details: "Requires browser audit (coming in v2)" };
  const onPageSeo = { score: 0, details: "Requires browser audit (coming in v2)" };
  const content = { score: 0, details: "Requires manual review (coming in v2)" };

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
