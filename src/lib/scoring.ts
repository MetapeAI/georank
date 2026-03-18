// Score calculator and data normalizer

export interface ScoreCard {
  traffic: { score: number; details: string };
  aiTraffic: { score: number; details: string };
  domainAuthority: { score: number; details: string };
  techInfra: { score: number; details: string };
  coreWebVitals: { score: number; details: string };
  onPageSeo: { score: number; details: string };
  content: { score: number; details: string };
  thirdParty: { score: number; details: string };
  overall: number;
}

export function calcCwvScore(mobile: any, desktop: any): { score: number; details: string } {
  if (!mobile?.lighthouseResult) return { score: 0, details: "No data" };
  const audits = mobile.lighthouseResult.audits;
  const lcp = parseFloat(audits?.["largest-contentful-paint"]?.numericValue) / 1000;
  const cls = parseFloat(audits?.["cumulative-layout-shift"]?.numericValue);
  const fcp = parseFloat(audits?.["first-contentful-paint"]?.numericValue) / 1000;
  const tbt = parseFloat(audits?.["total-blocking-time"]?.numericValue);

  let score = 10;
  if (lcp > 4) score -= 3; else if (lcp > 2.5) score -= 1;
  if (cls > 0.25) score -= 2; else if (cls > 0.1) score -= 1;
  if (fcp > 3) score -= 2; else if (fcp > 1.8) score -= 1;
  if (tbt > 600) score -= 2; else if (tbt > 200) score -= 1;

  return {
    score: Math.max(0, score),
    details: `LCP: ${lcp.toFixed(1)}s | CLS: ${cls.toFixed(3)} | FCP: ${fcp.toFixed(1)}s | TBT: ${tbt.toFixed(0)}ms`,
  };
}

export function calcTrafficScore(sw: any): { score: number; details: string } {
  if (!sw) return { score: 0, details: "No data" };
  const visits = sw.estimatedMonthlyVisits;
  const latest = visits ? Object.values(visits).pop() as number : 0;
  let score = 0;
  if (latest > 1000000) score = 10;
  else if (latest > 500000) score = 9;
  else if (latest > 200000) score = 8;
  else if (latest > 100000) score = 7;
  else if (latest > 50000) score = 6;
  else if (latest > 20000) score = 5;
  else if (latest > 10000) score = 4;
  else if (latest > 5000) score = 3;
  else if (latest > 1000) score = 2;
  else score = 1;

  return {
    score,
    details: `Monthly visits: ${latest?.toLocaleString() || "N/A"} | Bounce: ${(sw.bounceRate * 100)?.toFixed(1) || "N/A"}%`,
  };
}

export function calcAiTrafficScore(sw: any): { score: number; details: string } {
  if (!sw?.aiTraffic) return { score: 0, details: "No AI traffic data" };
  const sources = sw.aiTraffic;
  const platforms = Object.keys(sources).filter((k) => sources[k] > 0);
  let score = platforms.length * 2;
  return {
    score: Math.min(10, score),
    details: `AI platforms with traffic: ${platforms.length}/5 — ${platforms.join(", ") || "None"}`,
  };
}

export function calcDomainScore(ahrefs: any, semrush: any): { score: number; details: string } {
  const dr = ahrefs?.domainRating || 0;
  let score = Math.round(dr / 10);
  const as = semrush?.authorityScore || "N/A";
  return {
    score: Math.min(10, score),
    details: `DR: ${dr} | AS: ${as} | Backlinks: ${ahrefs?.backlinks?.toLocaleString() || "N/A"} | Ref domains: ${ahrefs?.referringDomains?.toLocaleString() || "N/A"}`,
  };
}

export function calcOverall(card: Omit<ScoreCard, "overall">): number {
  const weights = {
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
    total += (card as any)[key].score * weight;
  }
  return Math.round(total * 10) / 10;
}
