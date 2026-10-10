import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BarChart3, Info, Users, AlertTriangle, CheckCircle2, XCircle, Landmark,
  RefreshCw, Flag, ExternalLink, Sigma,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import {
  SCHEMES, computeGapStats, matchSchemes, loadSchemes,
  type Scheme, type SchemeGapStat,
} from "../lib/schemesData";

// ============================================================
// Phase 4 — Gap Visibility Dashboard (demo/pitch page)
//
// THE HONEST-MATH RULE: every percentage is computed ONLY over the
// farmers who are matched-eligible for that scheme (the Phase-1
// engine re-runs over every profile). Eligible farmers who never
// answered are excluded from the denominator, and "no data yet" is
// shown rather than a fabricated number.
//
// Phase 5 data ("applied but got no response") is surfaced as a raw
// count only — no status tracking, no follow-up promises.
// ============================================================

function GapBar({ pct }: { pct: number }) {
  return (
    <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full bg-gradient-to-r from-amber-400 to-rose-500 transition-all"
        style={{ width: `${Math.max(2, Math.min(100, pct))}%` }}
      />
    </div>
  );
}

function GapRow({
  scheme, stat, reports,
}: {
  scheme: Scheme;
  stat: SchemeGapStat | undefined;
  reports: number;
}) {
  const { t } = useLanguage();
  const noData = !stat || stat.answered === 0;
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-extrabold text-slate-900 leading-tight">{t(`scheme${scheme.key}Name`)}</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">{scheme.hindi_name}</p>
        </div>
        <a
          href={scheme.official_apply_url}
          target="_blank"
          rel="noreferrer"
          className="shrink-0 text-slate-300 hover:text-indigo-500 transition-colors"
          title={t("officialPortal")}
        >
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      {/* The headline — honest denominator */}
      {noData ? (
        <div className="mt-4 rounded-xl bg-slate-50 border border-slate-200 p-4 text-center">
          <p className="text-xs font-bold text-slate-500">{t("noDataYet")}</p>
          <p className="text-[10px] text-slate-400 mt-1">
            {stat && stat.eligibleFarmers > 0
              ? t("eligibleWaiting").replace("{n}", String(stat.eligibleFarmers))
              : t("noEligibleYet")}
          </p>
        </div>
      ) : (
        <>
          <p className="mt-4 text-3xl font-extrabold text-slate-900 leading-none">
            {stat.gapPct}%
            <span className="text-xs font-semibold text-slate-400 ml-2">{t("eligibleNotReceiving")}</span>
          </p>
          <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
            <b className="text-slate-700">{stat.gapPct}%</b> {t("gapWhoAre")}
            <b className="text-slate-700"> {t("gapEligibleFor")} {t(`scheme${scheme.key}Name`).split(" (")[0]}</b> {t("gapReport")}
            {stat.gapPct === 0 ? t("gapReceiving") : t("gapNotReceiving")}
          </p>
          <div className="mt-3">
            <GapBar pct={stat.gapPct ?? 0} />
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 mt-3 text-[11px]">
            <span className="flex items-center gap-1.5 text-slate-600">
              <Sigma className="w-3.5 h-3.5 text-indigo-400" />
              <b>{stat.eligibleFarmers}</b>&nbsp;{t("matchedEligible")}
            </span>
            <span className="flex items-center gap-1.5 text-slate-600">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              <b>{stat.answered}</b>&nbsp;{t("answered")}
            </span>
            <span className="flex items-center gap-1.5 text-emerald-700">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <b>{stat.received}</b>&nbsp;{t("received")}
            </span>
            <span className="flex items-center gap-1.5 text-amber-700">
              <XCircle className="w-3.5 h-3.5" />
              <b>{stat.notReceived}</b>&nbsp;{t("notReceived")}
            </span>
          </div>
        </>
      )}

      {/* Phase 5: raw report count — no promises attached */}
      {reports > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2 text-[11px] text-slate-500">
          <Flag className="w-3.5 h-3.5 text-rose-400 shrink-0" />
          <span>
            {t("reportsLine").replace("{n}", String(reports))}
          </span>
        </div>
      )}

      {/* Method note — the honesty box */}
      <p className="mt-3 pt-3 border-t border-slate-100 text-[10px] text-slate-400 leading-relaxed">
        {t("methodNote")}
      </p>
    </div>
  );
}

export default function SchemeGapInsightsPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [stats, setStats] = useState<Record<string, SchemeGapStat>>({});
  const [schemes, setSchemes] = useState<Scheme[]>(SCHEMES);
  const [loading, setLoading] = useState(true);
  const [myMatches, setMyMatches] = useState<string[]>([]);

  const load = () => {
    setLoading(true);
    computeGapStats()
      .then(setStats)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadSchemes().then((s) => s.length > 0 && setSchemes(s));
    load();
  }, []);

  // This farmer's own eligible schemes (for the personal context strip)
  useEffect(() => {
    if (!user) return;
    const p = {
      state: user.state || "",
      age: user.age ?? null,
      land_acres: user.land_acres ?? null,
      crop_type: user.crop_type ?? null,
      aadhaar_linked: user.aadhaar_linked ?? false,
      bank_account_linked: user.bank_account_linked ?? false,
      land_records_uploaded: user.land_records_uploaded ?? false,
      is_income_tax_payer: user.is_income_tax_payer ?? false,
    };
    setMyMatches(matchSchemes(p).matched.map((m) => m.scheme.id));
  }, [user]);

  const ordered = schemes
    .slice()
    .sort((a, b) => {
      const gapA = stats[a.id]?.gapPct;
      const gapB = stats[b.id]?.gapPct;
      // schemes with a measured gap first, then unknowns
      return (gapB ?? -1) - (gapA ?? -1);
    });

  return (
    <div className="min-h-[80vh] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto">
            <BarChart3 className="w-7 h-7 text-amber-600" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">{t("gapPageTitle")}</h1>
          <p className="text-sm text-slate-500 max-w-xl mx-auto leading-relaxed">
            {t("gapPageSub")}
          </p>
        </div>

        {/* Personal context */}
        {user && myMatches.length > 0 && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-900 leading-relaxed">
            <b>{t("youQualifyFor").replace("{n}", String(myMatches.length))}</b>{" "}
            {t("yourAnswersFeed")}
            <Link to="/schemes" className="font-bold underline"> {t("answerOnSchemesPage")}</Link>.
          </div>
        )}

        {/* Honesty banner */}
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-900 leading-relaxed">
            <b>{t("howToReadLabel")}</b> {t("howToRead")}{" "}
            {user ? "" : t("logInToContribute")}
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-3 py-16">
            <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
            <span className="text-sm text-slate-500">{t("reRunningEngine")}</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ordered.map((s) => (
              <GapRow key={s.id} scheme={s} stat={stats[s.id]} reports={stats[s.id]?.noResponseReports ?? 0} />
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="text-center space-y-2 pt-2">
          <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400">
            <Landmark className="w-3.5 h-3.5" />
            <span>{t("beneficiaryContext")}</span>
          </div>
          <Link to="/schemes" className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:underline">
            <AlertTriangle className="w-3.5 h-3.5" /> {t("backToMatches")}
          </Link>
        </div>
      </div>
    </div>
  );
}
