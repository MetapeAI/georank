// API clients for SEO/GEO data sources

async function apifyRunAndGetAll(actorId: string, input: any): Promise<any[]> {
  const token = process.env.APIFY_API_KEY;
  const res = await fetch(
    `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items?token=${token}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }
  );
  if (!res.ok) throw new Error(`Apify ${actorId} error: ${res.status}`);
  return res.json();
}

export async function fetchSimilarWeb(url: string) {
  const items = await apifyRunAndGetAll("radeance~similarweb-scraper", {
    urls: [url],
    include_similar_sites: false,
    include_indepth_data: true,
  });
  return items[0] || null;
}

export async function fetchAhrefs(url: string) {
  const domain = new URL(url).hostname.replace("www.", "");
  const items = await apifyRunAndGetAll("radeance~ahrefs-scraper", {
    url: domain,
    country: "us",
    mode: "subdomains",
    include_web_authority: true,
    include_traffic: true,
    include_keywords: true,
    include_keywords_ranking: true,
    include_backlinks: true,
    include_broken_links: true,
    include_competitors: true,
  });
  // Ahrefs returns multiple items by type — merge them into one object
  const merged: any = {};
  for (const item of items) {
    const type = item.type || "unknown";
    merged[type] = item;
  }
  merged._allItems = items;
  return merged;
}

export async function fetchSemrush(url: string) {
  const domain = new URL(url).hostname.replace("www.", "");
  const items = await apifyRunAndGetAll("radeance~semrush-scraper", {
    urls: [domain],
  });
  return items[0] || null;
}

export async function fetchPageSpeed(url: string, strategy: "mobile" | "desktop" = "mobile") {
  const key = process.env.PAGESPEED_API_KEY;
  const res = await fetch(
    `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&key=${key}&category=performance&strategy=${strategy}`
  );
  if (!res.ok) throw new Error(`PageSpeed API error: ${res.status}`);
  return res.json();
}

export async function fetchTavily(query: string) {
  const key = process.env.TAVILY_API_KEY;
  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: key,
      query,
      max_results: 10,
    }),
  });
  if (!res.ok) throw new Error(`Tavily API error: ${res.status}`);
  return res.json();
}
