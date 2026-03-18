// API clients for SEO/GEO data sources

export async function fetchSimilarWeb(url: string) {
  const token = process.env.APIFY_API_KEY;
  const input = {
    urls: [url],
    include_similar_sites: false,
    include_indepth_data: true,
  };
  const res = await fetch(
    `https://api.apify.com/v2/acts/radeance~similarweb-scraper/run-sync-get-dataset-items?token=${token}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }
  );
  if (!res.ok) throw new Error(`SimilarWeb API error: ${res.status}`);
  const data = await res.json();
  return data[0] || null;
}

export async function fetchAhrefs(url: string) {
  const token = process.env.APIFY_API_KEY;
  const domain = new URL(url).hostname.replace("www.", "");
  const input = {
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
  };
  const res = await fetch(
    `https://api.apify.com/v2/acts/radeance~ahrefs-scraper/run-sync-get-dataset-items?token=${token}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }
  );
  if (!res.ok) throw new Error(`Ahrefs API error: ${res.status}`);
  const data = await res.json();
  return data[0] || null;
}

export async function fetchSemrush(url: string) {
  const token = process.env.APIFY_API_KEY;
  const domain = new URL(url).hostname.replace("www.", "");
  const input = { urls: [domain] };
  const res = await fetch(
    `https://api.apify.com/v2/acts/radeance~semrush-scraper/run-sync-get-dataset-items?token=${token}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }
  );
  if (!res.ok) throw new Error(`Semrush API error: ${res.status}`);
  const data = await res.json();
  return data[0] || null;
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
