// Score calculator and data normalizer

export interface ScoreItem {
  score: number;
  details: string;
}

export interface ScoreCard {
  traffic: ScoreItem;
  aiTraffic: ScoreItem;
  domainAuthority: ScoreItem;
  techInfra: ScoreItem;
  coreWebVitals: ScoreItem;
  onPageSeo: ScoreItem;
  content: ScoreItem;
  thirdParty: ScoreItem;
  overall: number;
}

export function calcTrafficScore(sw: any): ScoreItem {
  if (!sw) return { score: 0, details: "No data" };
  const visits = sw.totalVisits || 0;
  let score = 0;
  if (visits > 1000000) score = 10;
  else if (visits > 500000) score = 9;
  else if (visits > 200000) score = 8;
  else if (visits > 100000) score = 7;
  else if (visits > 50000) score = 6;
  else if (visits > 20000) score = 5;
  else if (visits > 10000) score = 4;
  else if (visits > 5000) score = 3;
  else if (visits > 1000) score = 2;
  else score = 1;

  const bounce = sw.bounceRate != null ? (sw.bounceRate * 100).toFixed(1) : "N/A";
  const pages = sw.pagesPerVisit != null ? sw.pagesPerVisit.toFixed(1) : "N/A";
  const time = sw.timeOnSite != null ? `${Math.floor(sw.timeOnSite / 60)}m${Math.floor(sw.timeOnSite % 60)}s` : "N/A";
  const rank = sw.rankGlobal ? `#${sw.rankGlobal.toLocaleString()}` : "N/A";

  return {
    score,
    details: `Monthly visits: ${visits.toLocaleString()} | Global rank: ${rank} | Bounce: ${bounce}% | Pages/visit: ${pages} | Avg time: ${time}`,
  };
}

export function calcAiTrafficScore(sw: any): ScoreItem {
  if (!sw) return { score: 0, details: "No AI traffic data" };

  const sources: Record<string, number> = {};
  if (sw.aiTrafficShareChatgpt != null) sources["ChatGPT"] = +(sw.aiTrafficShareChatgpt * 100).toFixed(1);
  if (sw.aiTrafficSharePerplexity != null) sources["Perplexity"] = +(sw.aiTrafficSharePerplexity * 100).toFixed(1);
  if (sw.aiTrafficShareClaude != null) sources["Claude"] = +(sw.aiTrafficShareClaude * 100).toFixed(1);
  if (sw.aiTrafficShareGemini != null) sources["Gemini"] = +(sw.aiTrafficShareGemini * 100).toFixed(1);
  if (sw.aiTrafficShareCopilot != null) sources["Copilot"] = +(sw.aiTrafficShareCopilot * 100).toFixed(1);

  const activePlatforms = Object.entries(sources).filter(([, v]) => v > 0);
  const score = Math.min(10, activePlatforms.length * 2);

  const details = activePlatforms.length > 0
    ? activePlatforms.map(([k, v]) => `${k}: ${v}%`).join(" | ")
    : "No AI traffic detected";

  return {
    score,
    details: `AI platforms: ${activePlatforms.length}/5 — ${details}`,
  };
}

export function calcDomainScore(ahrefs: any, semrush: any): ScoreItem {
  // Ahrefs data is merged by type
  const authority = ahrefs?.web_authority || {};
  const dr = authority.domain_rating || authority.domainRating || 0;
  const backlinks = authority.backlinks || authority.total_backlinks || 0;
  const refDomains = authority.referring_domains || authority.ref_domains || 0;
  const dofollow = authority.dofollow_backlinks || authority.dofollow || 0;

  // Semrush
  const as = semrush?.authority_score || "N/A";
  const mozDa = semrush?.moz_domain_authority || "N/A";
  const spamScore = semrush?.moz_spam_score || "N/A";

  let score = 0;
  if (dr >= 70) score = 10;
  else if (dr >= 60) score = 8;
  else if (dr >= 50) score = 7;
  else if (dr >= 40) score = 6;
  else if (dr >= 30) score = 5;
  else if (dr >= 20) score = 4;
  else if (dr >= 10) score = 3;
  else score = 1;

  return {
    score,
    details: `DR: ${dr} | AS: ${as} | Moz DA: ${mozDa} | Spam: ${spamScore}% | Backlinks: ${backlinks.toLocaleString()} | Ref domains: ${refDomains.toLocaleString()} | Dofollow: ${dofollow.toLocaleString()}`,
  };
}

export function calcCwvScore(mobile: any, desktop: any): ScoreItem {
  if (!mobile?.lighthouseResult) return { score: 0, details: "No data" };
  const audits = mobile.lighthouseResult.audits;
  const lcp = parseFloat(audits?.["largest-contentful-paint"]?.numericValue) / 1000;
  const cls = parseFloat(audits?.["cumulative-layout-shift"]?.numericValue);
  const fcp = parseFloat(audits?.["first-contentful-paint"]?.numericValue) / 1000;
  const tbt = parseFloat(audits?.["total-blocking-time"]?.numericValue);
  const perfScore = Math.round((mobile.lighthouseResult.categories?.performance?.score || 0) * 100);

  const dAudits = desktop?.lighthouseResult?.audits;
  const dPerf = Math.round((desktop?.lighthouseResult?.categories?.performance?.score || 0) * 100);

  let score = 10;
  if (lcp > 4) score -= 3; else if (lcp > 2.5) score -= 1;
  if (cls > 0.25) score -= 2; else if (cls > 0.1) score -= 1;
  if (fcp > 3) score -= 2; else if (fcp > 1.8) score -= 1;
  if (tbt > 600) score -= 2; else if (tbt > 200) score -= 1;

  return {
    score: Math.max(0, score),
    details: `Mobile: ${perfScore}/100 | Desktop: ${dPerf}/100 | LCP: ${lcp.toFixed(1)}s | CLS: ${cls.toFixed(3)} | FCP: ${fcp.toFixed(1)}s | TBT: ${tbt.toFixed(0)}ms`,
  };
}

export function calcThirdPartyScore(tavily: any): ScoreItem {
  if (!tavily?.results) return { score: 0, details: "No data" };
  const platforms = new Set<string>();
  for (const r of tavily.results) {
    const u = (r.url || "").toLowerCase();
    if (u.includes("reddit.com")) platforms.add("Reddit");
    if (u.includes("producthunt.com")) platforms.add("Product Hunt");
    if (u.includes("g2.com")) platforms.add("G2");
    if (u.includes("linkedin.com")) platforms.add("LinkedIn");
    if (u.includes("github.com")) platforms.add("GitHub");
    if (u.includes("youtube.com")) platforms.add("YouTube");
    if (u.includes("medium.com")) platforms.add("Medium");
    if (u.includes("trustpilot.com")) platforms.add("Trustpilot");
    if (u.includes("capterra.com")) platforms.add("Capterra");
  }
  const score = Math.min(10, platforms.size * 2);
  return {
    score,
    details: `Found on ${platforms.size} platforms: ${Array.from(platforms).join(", ") || "None detected"}`,
  };
}

export function calcOverall(card: Omit<ScoreCard, "overall">): number {
  const weights: Record<string, number> = {
    traffic: 0.15,
    aiTraffic: 0.15,
    domainAuthority: 0.1,
    techInfra: 0.15,
    coreWebVitals: 0.15,
    onPageSeo: 0.1,
    content: 0.1,
    thirdParty: 0.1,
  };
  let total = 0;
  for (const [key, weight] of Object.entries(weights)) {
    total += ((card as any)[key]?.score || 0) * weight;
  }
  return Math.round(total * 10) / 10;
}
