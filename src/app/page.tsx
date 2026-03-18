"use client";
import { useState, useEffect, useCallback } from "react";

interface ScoreItem {
  score: number;
  details: string;
}

interface AnalysisResult {
  id: string;
  status: string;
  progress: number;
  step?: string;
  scores?: {
    traffic: ScoreItem;
    aiTraffic: ScoreItem;
    domainAuthority: ScoreItem;
    techInfra: ScoreItem;
    coreWebVitals: ScoreItem;
    onPageSeo: ScoreItem;
    content: ScoreItem;
    thirdParty: ScoreItem;
    overall: number;
  };
  results?: any;
  errors?: string[];
}

function ScoreRing({ score, size = 120 }: { score: number; size?: number }) {
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const pct = score / 10;
  const color = score >= 7 ? "#22c55e" : score >= 4 ? "#eab308" : "#ef4444";
  return (
    <svg width={size} height={size} className="block">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1f2937" strokeWidth="10" />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="10"
        strokeDasharray={`${pct * circ} ${circ}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        className="transition-all duration-1000"
      />
      <text x="50%" y="50%" textAnchor="middle" dy="0.35em" fill={color} fontSize={size * 0.28} fontWeight="bold">
        {score}
      </text>
    </svg>
  );
}

function ScoreBar({ label, item }: { label: string; item: ScoreItem }) {
  const color = item.score >= 7 ? "bg-green-500" : item.score >= 4 ? "bg-yellow-500" : "bg-red-500";
  return (
    <div className="mb-4">
      <div className="flex justify-between mb-1">
        <span className="text-sm font-medium text-gray-300">{label}</span>
        <span className="text-sm font-bold text-white">{item.score}/10</span>
      </div>
      <div className="w-full bg-gray-800 rounded-full h-2.5">
        <div className={`${color} h-2.5 rounded-full transition-all duration-1000`} style={{ width: `${item.score * 10}%` }} />
      </div>
      <p className="text-xs text-gray-500 mt-1">{item.details}</p>
    </div>
  );
}

function RawDataSection({ title, data }: { title: string; data: any }) {
  const [open, setOpen] = useState(false);
  if (!data) return null;
  return (
    <div className="border border-gray-800 rounded-lg mb-3">
      <button onClick={() => setOpen(!open)} className="w-full px-4 py-3 flex justify-between items-center text-left hover:bg-gray-900 rounded-lg">
        <span className="text-sm font-medium text-gray-300">{title}</span>
        <span className="text-gray-500 text-xs">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <pre className="px-4 pb-4 text-xs text-gray-400 overflow-auto max-h-96">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);

  const poll = useCallback(async (id: string) => {
    const res = await fetch(`/api/analyze?id=${id}`);
    const data = await res.json();
    setAnalysis(data);
    if (data.status === "running") {
      setTimeout(() => poll(id), 3000);
    } else {
      setLoading(false);
    }
  }, []);

  const startAnalysis = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setAnalysis(null);
    const res = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: url.trim() }),
    });
    const data = await res.json();
    setAnalysis({ ...data, progress: 0 });
    poll(data.id);
  };

  return (
    <main className="max-w-4xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-3">
          SEO + GEO Analyzer
        </h1>
        <p className="text-gray-400 text-lg">
          Comprehensive website analysis powered by SimilarWeb, Ahrefs, Semrush & PageSpeed
        </p>
      </div>

      {/* Input */}
      <div className="flex gap-3 mb-10">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && startAnalysis()}
          placeholder="Enter website URL (e.g. onspace.ai)"
          className="flex-1 px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
        <button
          onClick={startAnalysis}
          disabled={loading || !url.trim()}
          className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors"
        >
          {loading ? "Analyzing..." : "Analyze"}
        </button>
      </div>

      {/* Progress */}
      {analysis?.status === "running" && (
        <div className="mb-10 p-6 bg-gray-900 rounded-2xl border border-gray-800">
          <div className="flex justify-between mb-2">
            <span className="text-sm text-gray-400">{analysis.step || "Starting..."}</span>
            <span className="text-sm text-blue-400 font-mono">{analysis.progress || 0}%</span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-3">
            <div
              className="bg-blue-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${analysis.progress || 0}%` }}
            />
          </div>
        </div>
      )}

      {/* Results */}
      {analysis?.status === "done" && analysis.scores && (
        <div className="space-y-8">
          {/* Overall Score */}
          <div className="p-8 bg-gray-900 rounded-2xl border border-gray-800 flex items-center gap-8">
            <ScoreRing score={analysis.scores.overall} size={140} />
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">Overall Score</h2>
              <p className="text-gray-400">
                {analysis.scores.overall >= 7
                  ? "Strong foundation — focus on optimization"
                  : analysis.scores.overall >= 4
                  ? "Decent base — significant room for improvement"
                  : "Needs attention — critical issues found"}
              </p>
              {analysis.errors && analysis.errors.length > 0 && (
                <div className="mt-3">
                  {analysis.errors.map((e, i) => (
                    <p key={i} className="text-xs text-red-400">⚠️ {e}</p>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Score Breakdown */}
          <div className="p-8 bg-gray-900 rounded-2xl border border-gray-800">
            <h2 className="text-xl font-bold text-white mb-6">Score Breakdown</h2>
            <ScoreBar label="📈 Traffic & Growth" item={analysis.scores.traffic} />
            <ScoreBar label="🤖 AI Traffic (GEO)" item={analysis.scores.aiTraffic} />
            <ScoreBar label="🏆 Domain Authority" item={analysis.scores.domainAuthority} />
            <ScoreBar label="⚡ Core Web Vitals" item={analysis.scores.coreWebVitals} />
            <ScoreBar label="🔧 Technical Infrastructure" item={analysis.scores.techInfra} />
            <ScoreBar label="📝 On-Page SEO" item={analysis.scores.onPageSeo} />
            <ScoreBar label="📚 Content Strategy" item={analysis.scores.content} />
            <ScoreBar label="🌐 Third-Party Presence" item={analysis.scores.thirdParty} />
          </div>

          {/* Raw Data */}
          <div className="p-8 bg-gray-900 rounded-2xl border border-gray-800">
            <h2 className="text-xl font-bold text-white mb-4">Raw Data</h2>
            <RawDataSection title="SimilarWeb" data={analysis.results?.similarweb} />
            <RawDataSection title="Ahrefs" data={analysis.results?.ahrefs} />
            <RawDataSection title="Semrush" data={analysis.results?.semrush} />
            <RawDataSection title="PageSpeed (Mobile)" data={analysis.results?.pagespeed?.mobile?.lighthouseResult?.audits} />
            <RawDataSection title="PageSpeed (Desktop)" data={analysis.results?.pagespeed?.desktop?.lighthouseResult?.audits} />
            <RawDataSection title="Third-Party Presence (Tavily)" data={analysis.results?.tavily} />
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-16 text-center text-gray-600 text-sm">
        Built by 小K — OnSpace AI Growth Team
      </footer>
    </main>
  );
}
