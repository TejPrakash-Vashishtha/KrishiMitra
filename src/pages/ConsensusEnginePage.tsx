import React, { useState, useEffect } from "react";
import { Users, Scale, MessageSquare, ShieldCheck, CheckCircle2, Sparkles, RefreshCw, AlertTriangle, ArrowRight } from "lucide-react";
import api from "../services/api";

export default function ConsensusEnginePage() {
  const [presets, setPresets] = useState<any[]>([]);
  const [selectedDilemma, setSelectedDilemma] = useState<string>("");
  const [customQuery, setCustomQuery] = useState<string>("");
  const [result, setResult] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get("/multi-agent/presets")
      .then((res) => {
        if (res.data.success) {
          setPresets(res.data.presets || []);
          if (res.data.presets?.length > 0) {
            setSelectedDilemma(res.data.presets[0].dilemma);
          }
        }
      })
      .catch(() => {});
  }, []);

  const runDeliberation = async (dilemmaToRun?: string) => {
    setLoading(true);
    const query = dilemmaToRun || customQuery || selectedDilemma;
    try {
      const res = await api.post("/multi-agent/deliberate", {
        dilemma: query,
        cropName: "Paddy (Swarna Sub-1)",
        district: "Cuttack",
      });
      if (res.data.success) {
        setResult(res.data);
      }
    } finally {
      setLoading(false);
    }
  };

  // Run initial deliberation on load
  useEffect(() => {
    if (presets.length > 0 && !result) {
      runDeliberation(presets[0].dilemma);
    }
  }, [presets]);

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-100 text-violet-800 text-xs font-semibold mb-3">
            <Scale className="w-3.5 h-3.5" />
            <span>LangGraph / CrewAI Multi-Agent Consensus</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900">
            Autonomous Agricultural Debate & Arbiter Engine
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-2">
            Specialized Agronomy, Meteorology, Hydrology, and Economics agents debate conflicting farm priorities to synthesize a balanced, cost-effective action plan.
          </p>
        </div>

        {/* Preset Dilemmas & Custom Query Input */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
          <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Select Agricultural Dilemma</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {presets.map((p) => {
              const isSelected = selectedDilemma === p.dilemma && !customQuery;
              return (
                <button
                  key={p.id}
                  onClick={() => {
                    setSelectedDilemma(p.dilemma);
                    setCustomQuery("");
                    runDeliberation(p.dilemma);
                  }}
                  className={`p-4 rounded-2xl text-left border-2 transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? "border-violet-600 bg-violet-50/60 shadow-sm"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <div>
                    <span className="text-[10px] font-bold text-violet-700 bg-violet-100 px-2 py-0.5 rounded-md uppercase">
                      {p.crop}
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 mt-2">{p.title}</h4>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{p.dilemma}</p>
                  </div>
                  <div className="text-xs font-bold text-violet-600 mt-3 flex items-center gap-1">
                    <span>Deliberate Dilemma</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </button>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-100 flex gap-2">
            <input
              type="text"
              value={customQuery}
              onChange={(e) => setCustomQuery(e.target.value)}
              placeholder="Or enter a custom farming dilemma (e.g., 'Unseasonal hail storm during flowering with ?1,000 budget')..."
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
            <button
              onClick={() => runDeliberation()}
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs shadow-md transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span>Debate & Synthesize</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center space-y-3">
            <RefreshCw className="w-10 h-10 animate-spin text-violet-600 mx-auto" />
            <p className="text-sm font-bold text-slate-700">Autonomous Agents are debating trade-offs...</p>
            <p className="text-xs text-slate-400">Agronomy &bull; Meteorology &bull; Hydrology &bull; Economics &bull; Arbiter</p>
          </div>
        ) : result ? (
          <div className="space-y-8">
            {/* 4 Agent Proposals Grid */}
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Users className="w-4 h-4 text-violet-600" />
                <span>Round 1: Individual Agent Domain Proposals</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {result.proposals?.map((p: any, idx: number) => (
                  <div key={idx} className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2.5 mb-3">
                        <span className="text-2xl">{p.avatar}</span>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 leading-tight">{p.agentName}</h4>
                          <span className="text-[10px] font-semibold text-violet-700 bg-violet-50 px-1.5 py-0.5 rounded">
                            {p.agentRole}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs font-semibold text-slate-700 italic mb-2">"{p.stanceSummary}"</p>
                      <p className="text-xs text-slate-600 leading-relaxed mb-3">{p.recommendation}</p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 space-y-1">
                      <span className="text-[10px] font-bold text-rose-600 block">Flagged Vulnerabilities:</span>
                      {p.risksIdentified?.map((r: string, rIdx: number) => (
                        <div key={rIdx} className="text-[11px] text-slate-500 flex items-start gap-1">
                          <span className="text-rose-400">&bull;</span>
                          <span>{r}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Deliberation Theater (Debate Rounds) */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-violet-600" />
                <span>Round 2: Cross-Agent Debate & Compromise Rounds</span>
              </h3>
              <div className="space-y-3">
                {result.debateTranscript?.map((deb: any, dIdx: number) => (
                  <div key={dIdx} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-violet-800">Round {deb.roundNumber}: {deb.speaker} &rarr; {deb.targetAgent}</span>
                    </div>
                    <p className="text-slate-700"><span className="font-semibold text-rose-700">Critique:</span> {deb.critique}</p>
                    <p className="text-slate-700"><span className="font-semibold text-emerald-700">Concession / Counter:</span> {deb.concessionOrCounter}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Final Arbiter Consensus Verdict */}
            <div className="bg-gradient-to-br from-violet-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/10 pb-5">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-violet-300">Round 3: Final Synthesis</span>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-white">Unified Arbiter Consensus Verdict</h3>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <div>
                    <span className="text-[10px] text-violet-200 block">Consensus Score</span>
                    <span className="text-lg font-black text-emerald-300">{result.consensusVerdict?.consensusScore}%</span>
                  </div>
                </div>
              </div>

              <p className="text-sm text-violet-100 leading-relaxed font-medium">
                {result.consensusVerdict?.arbiterSummary}
              </p>

              {/* Action Plan Checklist */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold text-violet-300 uppercase tracking-wider">Step-by-Step Executable Action Plan:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {result.consensusVerdict?.actionPlan?.map((item: string, aIdx: number) => (
                    <div key={aIdx} className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-2.5 text-xs text-white">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Trade-Off Matrix */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-white/10 text-xs">
                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-violet-300 font-bold block mb-1">Yield vs Water</span>
                  <p className="text-slate-300">{result.consensusVerdict?.tradeOffAnalysis?.yieldVsWater}</p>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-violet-300 font-bold block mb-1">Cost vs Effectiveness</span>
                  <p className="text-slate-300">{result.consensusVerdict?.tradeOffAnalysis?.costVsEffectiveness}</p>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-violet-300 font-bold block mb-1">Soil Health</span>
                  <p className="text-slate-300">{result.consensusVerdict?.tradeOffAnalysis?.shortTermVsSoilHealth}</p>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
