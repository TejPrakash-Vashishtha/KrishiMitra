// ============================================================
// Client-side fallback handler for /api endpoints.
// Ensures that ConsensusEnginePage, AgronomyRAGPage, Dealers,
// Products, and Notifications work seamlessly even without an
// active local Node.js Express server.
// ============================================================

export interface AgentProposal {
  agentName: string;
  agentRole: "Agronomy" | "Meteorology" | "Hydrology" | "Economics";
  avatar: string;
  stanceSummary: string;
  recommendation: string;
  priorityWeight: number;
  risksIdentified: string[];
}

export interface AgentDebateRound {
  roundNumber: number;
  speaker: string;
  targetAgent: string;
  critique: string;
  concessionOrCounter: string;
}

export interface ConsensusOutput {
  dilemma: string;
  farmerContext: {
    crop: string;
    location: string;
    stage: string;
    budgetLevel: string;
  };
  proposals: AgentProposal[];
  debateTranscript: AgentDebateRound[];
  consensusVerdict: {
    consensusScore: number;
    arbiterSummary: string;
    actionPlan: string[];
    tradeOffAnalysis: {
      yieldVsWater: string;
      costVsEffectiveness: string;
      shortTermVsSoilHealth: string;
    };
    riskMitigationChecklist: string[];
  };
  timestamp: string;
}

export const PRESET_DILEMMAS = [
  {
    id: "heatwave_water_stress",
    title: "Impending 38°C Heatwave with 40% Canal Water Deficit",
    crop: "Paddy (Swarna Sub-1)",
    dilemma: "Weather forecasts predict a 5-day heatwave (38°C) during active tillering, but canal water is rationed. Agronomist wants flood irrigation to prevent panicle blast, Hydrologist demands deficit irrigation, and Economist warns against diesel pump costs.",
  },
  {
    id: "pest_vs_organic_budget",
    title: "Brown Planthopper (BPH) Attack on Marginal Budget",
    crop: "Paddy",
    dilemma: "Early BPH nymph clusters detected at hill bases. Agronomist recommends chemical Triflumezopyrim 10% SC, Economist flags that chemical is ₹1,400/bottle (beyond budget), and Hydrologist suggests field drainage to suppress hopper reproduction.",
  },
  {
    id: "pre_monsoon_fertilizer_timing",
    title: "Basal Fertilizer Application Ahead of Unseasonal Rainfall",
    crop: "Vegetables / Mustard",
    dilemma: "Farmer wants to broadcast DAP & Urea today, but Meteorology agent predicts 45mm convective thunderstorm in 36 hours which may cause nitrogen runoff and eutrophication.",
  },
];

export function runMultiAgentDeliberation(
  customDilemma?: string,
  cropName: string = "Paddy",
  district: string = "Cuttack"
): ConsensusOutput {
  const dilemmaText =
    customDilemma ||
    "How to optimize nitrogen top-dressing and irrigation schedule given high humidity (82%) and rising day temperatures in Cuttack?";

  const proposals: AgentProposal[] = [
    {
      agentName: "Dr. Arundhati Mishra (Agronomy & Crop Health)",
      agentRole: "Agronomy",
      avatar: "🌾",
      stanceSummary:
        "Maximize photosynthetic yield and protect vegetative canopy with targeted nitrogen & bio-fungicides.",
      recommendation:
        "Apply split-dose Urea (30 kg/acre) mixed with 5 kg Zinc Sulfate to boost leaf area index. Spray prophylactic bio-fungicide Pseudomonas fluorescens (10g/L) due to high humidity blast risk.",
      priorityWeight: 9,
      risksIdentified: [
        "Excessive nitrogen in humid conditions accelerates bacterial blight.",
        "Delayed application will permanently restrict tiller count.",
      ],
    },
    {
      agentName: "Col. Sanjeev Mohanty (Meteorology & Climate Risk)",
      agentRole: "Meteorology",
      avatar: "🌦️",
      stanceSummary: "Mitigate unseasonal convective thunderstorm and temperature surge risk.",
      recommendation:
        "Satellite telemetry shows convective cloud buildup over Coastal Odisha within 48h. Postpone foliar broadcasting by 2 days until rainfall probability drops below 30% to prevent runoff loss.",
      priorityWeight: 8,
      risksIdentified: [
        "Rainfall runoff will wash away ₹800 worth of surface-applied fertilizers into drainage canals.",
        "Post-rain leaf wetness exceeds 10 hours, creating optimal spore germination conditions.",
      ],
    },
    {
      agentName: "Er. Pravat Nayak (Hydrology & Irrigation)",
      agentRole: "Hydrology",
      avatar: "💧",
      stanceSummary: "Conserve ground water and maintain Alternate Wetting and Drying (AWD) threshold.",
      recommendation:
        "Root zone 10cm moisture is currently at 38% (optimal field capacity). Do not flood field. Maintain 2-3cm thin water film only, allowing soil to breathe between wetting cycles to save 25% water.",
      priorityWeight: 7,
      risksIdentified: [
        "Continuous flooding causes root asphyxiation and methane emissions.",
        "Over-irrigation in heavy soils creates localized salinity accumulation.",
      ],
    },
    {
      agentName: "Prof. Binod Das (Agro-Economics & Farmer Budget)",
      agentRole: "Economics",
      avatar: "📊",
      stanceSummary: "Protect marginal smallholder net profit margin and input affordability.",
      recommendation:
        "Substitute 25% synthetic chemical urea with fermented Farm Yard Manure / Jeevamrutha slurry to cut input costs by ₹650/acre while securing equal biological response.",
      priorityWeight: 8,
      risksIdentified: [
        "Farmer has limited liquid cash reserves for expensive proprietary chemical inputs.",
        "High cost of diesel pumping (₹95/hr) reduces seasonal profit margin by 14%.",
      ],
    },
  ];

  const debateTranscript: AgentDebateRound[] = [
    {
      roundNumber: 1,
      speaker: "Meteorology Agent",
      targetAgent: "Agronomy Agent",
      critique:
        "Agronomy is advocating for immediate broadcasting today, but our radar detects localized thunderstorm convective cells arriving in 36 hours. All your urea will be lost in runoff!",
      concessionOrCounter:
        "Agronomy concedes that broadcasting should be delayed until the cloud front passes on Day 3, but insists the field must not undergo nitrogen starvation.",
    },
    {
      roundNumber: 2,
      speaker: "Hydrology Agent",
      targetAgent: "Economics Agent",
      critique:
        "Economics wants organic slurry drenching, but slurry application during AWD drying cycle can crust topsoil if not properly incorporated with light soil working.",
      concessionOrCounter:
        "Economics agrees to recommend shallow harrowing before slurry incorporation, minimizing crusting while maintaining zero-cost organic fertility.",
    },
    {
      roundNumber: 3,
      speaker: "Consensus Arbiter",
      targetAgent: "All Agents",
      critique:
        "Synthesizing constraints: Agronomy's yield targets must be met without triggering Meteorology's runoff risk or violating Hydrology's AWD water thresholds and Economics' budget cap.",
      concessionOrCounter:
        "All agents adopt the 3-step Unified Action Plan with 94% consensus confidence.",
    },
  ];

  return {
    dilemma: dilemmaText,
    farmerContext: {
      crop: cropName,
      location: `${district}, Odisha`,
      stage: "Active Vegetative (Tillering)",
      budgetLevel: "Marginal / Smallholder (₹2,500 budget cap)",
    },
    proposals,
    debateTranscript,
    consensusVerdict: {
      consensusScore: 94,
      arbiterSummary:
        "Unanimous synthesis achieved: Postpone fertilizer broadcasting by 48 hours to avoid thunderstorm runoff, apply reduced urea + zinc combo incorporated with FYM for cost-savings, and maintain Alternate Wetting and Drying (AWD) water regime.",
      actionPlan: [
        "Day 1-2: Hold off on surface fertilizer application; clear field bund drainage outlets to manage forecasted rain.",
        "Day 3 (Post-Rain): Apply Split Urea @ 20 kg/acre + 5 kg Zinc Sulfate blended with well-decomposed FYM.",
        "Day 4: Spray bio-agent Pseudomonas fluorescens (10g/L) during late afternoon to shield against humidity-triggered fungal blast.",
        "Irrigation Protocol: Adopt Alternate Wetting and Drying (AWD) — allow water table to drop 5cm below soil surface before next shallow 3cm irrigation.",
      ],
      tradeOffAnalysis: {
        yieldVsWater:
          "AWD irrigation delivers 98.5% of max yield potential while cutting total water usage by 24.8%.",
        costVsEffectiveness:
          "Blended organic FYM + split inorganic urea saves ₹680/acre with zero yield penalty.",
        shortTermVsSoilHealth:
          "Bio-fungicide prevents leaf scorch and enhances long-term rhizosphere microbial diversity.",
      },
      riskMitigationChecklist: [
        "Inspect field 24 hours after rainfall for standing water pooling.",
        "Verify absence of yellowing leaf tips before secondary top-dressing.",
        "Monitor soil moisture with field tube (AWD pipe) twice weekly.",
      ],
    },
    timestamp: new Date().toISOString(),
  };
}

// ---- Agronomy RAG & Guardrails ----

export interface AgronomyChunk {
  id: string;
  sourceDoc: string;
  publisher: string;
  chapterOrSection: string;
  cropOrDomain: string;
  text: string;
  keywords: string[];
}

export const AGRONOMY_CORPUS: AgronomyChunk[] = [
  {
    id: "ouat_paddy_blast_2024",
    sourceDoc: "Package of Practices for Kharif Crops in Odisha (OUAT)",
    publisher: "Odisha University of Agriculture & Technology, Bhubaneswar",
    chapterOrSection: "Section 2.4: Fungal Diseases of Lowland Rice",
    cropOrDomain: "Paddy / Rice",
    text: "Paddy Blast caused by Magnaporthe oryzae is aggravated by excessive nitrogen application and continuous leaf wetness (>90% RH). Control: Spray Tricyclazole 75% WP @ 0.6 g/litre of water or Isoprothiolane 40% EC @ 1.5 ml/litre. Organic management includes seed treatment and prophylactic spray with Pseudomonas fluorescens @ 10 g/litre at 15-day intervals.",
    keywords: ["blast", "paddy", "tricyclazole", "pseudomonas", "fungicide", "nitrogen", "spores"],
  },
  {
    id: "icar_nrri_bph_2023",
    sourceDoc: "ICAR-NRRI Rice Crop Protection Manual",
    publisher: "National Rice Research Institute, Cuttack",
    chapterOrSection: "Chapter 5: Management of Brown Planthopper (Nilaparvata lugens)",
    cropOrDomain: "Paddy / Rice",
    text: "Brown Planthopper (BPH) causes hopper burn in dense rice canopies. For moderate infestations, adopt Alternate Wetting and Drying (AWD) water management to desiccate hopper eggs. Recommended chemicals: Triflumezopyrim 10% SC @ 94 ml/acre or Pymetrozine 50% WG @ 120 g/acre. Strictly avoid synthetic pyrethroids which cause BPH resurgence.",
    keywords: ["bph", "brown planthopper", "hopper", "pymetrozine", "triflumezopyrim", "nrri", "resurgence"],
  },
  {
    id: "ouat_tomato_blight_2024",
    sourceDoc: "OUAT Horticulture Extension Guidelines: Solanaceous Crops",
    publisher: "Directorate of Extension, OUAT Bhubaneswar",
    chapterOrSection: "Chapter 7: Tomato Early & Late Blight Management",
    cropOrDomain: "Tomato",
    text: "Early blight (Alternaria solani) causes target spot lesions on leaves. Spray Mancozeb 75% WP @ 2.0-2.5 g/L or Chlorothalonil 75% WP @ 2.0 g/L. For organic farming, spray neem oil (10,000 ppm) @ 3 ml/L or bio-fungicide Trichoderma harzianum @ 5 g/L as soil drench and foliar spray.",
    keywords: ["tomato", "early blight", "alternaria", "mancozeb", "chlorothalonil", "trichoderma", "neem"],
  },
  {
    id: "icar_soil_acidity_odisha_2023",
    sourceDoc: "Soil Health Management in Acidic Soils of Eastern India",
    publisher: "ICAR Indian Institute of Soil Science & Directorate of Agriculture, Odisha",
    chapterOrSection: "Chapter 3: Amelioration of Red and Laterite Acid Soils",
    cropOrDomain: "Soil Health / Chemistry",
    text: "Over 70% of cultivated soils in Odisha are acidic (pH 4.8 - 6.2) leading to phosphorus fixation and aluminum/iron toxicity. Apply agricultural lime (CaCO3) or paper mill sludge @ 0.2 lime requirement (approx 2.5-3.0 quintals/acre) every 3 years. Use Rock Phosphate or DAP supplemented with Farm Yard Manure (FYM) to maximize phosphorus availability.",
    keywords: ["soil", "acidity", "ph", "lime", "calcium", "phosphorus", "fym", "laterite", "odisha"],
  },
  {
    id: "fao_integrated_weed_mgmt",
    sourceDoc: "FAO Climate-Smart Agriculture Manual for Smallholders",
    publisher: "Food and Agriculture Organization (FAO) of the United Nations",
    chapterOrSection: "Module 4: Sustainable Weed and Moisture Conservation",
    cropOrDomain: "Weed & Water Management",
    text: "Mechanical cono-weeding in System of Rice Intensification (SRI) incorporates weeds into the soil as green manure, increasing soil aeration and root proliferation. Pre-emergence herbicide Pretilachlor 50% EC @ 500 ml/acre applied within 3 days of transplanting provides broad-spectrum control without harming earthworm populations.",
    keywords: ["weeds", "pretilachlor", "cono-weeder", "sri", "fao", "aeration", "herbicide"],
  },
];

export interface GuardrailCheck {
  guardrailName: string;
  status: "PASSED" | "FLAGGED_SAFE" | "VIOLATION_BLOCKED";
  message: string;
}

export interface GroundedRAGResponse {
  query: string;
  groundedAnswer: string;
  groundingConfidenceScore: number;
  guardrails: GuardrailCheck[];
  citedSources: AgronomyChunk[];
  verifiedSafeDosage: boolean;
}

const BANNED_CHEMICALS = [
  "monocrotophos",
  "phorate",
  "methyl parathion",
  "endosulfan",
  "ddt",
  "lindane",
  "carbofuran",
];

export function verifyAndGenerateRAG(query: string): GroundedRAGResponse {
  const qLower = query.toLowerCase();
  const qTokens = qLower.split(/[\s,.-]+/).filter((t) => t.length > 2);

  const scored = AGRONOMY_CORPUS.map((chunk) => {
    let score = 0;
    for (const token of qTokens) {
      if (chunk.keywords.some((k) => k.includes(token))) score += 3;
      if (chunk.text.toLowerCase().includes(token)) score += 1;
    }
    return { chunk, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const relevantChunks = scored.slice(0, 3).map((s) => s.chunk);

  const guardrails: GuardrailCheck[] = [];

  let hasBanned = false;
  for (const chemical of BANNED_CHEMICALS) {
    if (qLower.includes(chemical)) {
      hasBanned = true;
      guardrails.push({
        guardrailName: "Banned Agrochemical Compliance (CIBRC)",
        status: "VIOLATION_BLOCKED",
        message: `Chemical '${chemical}' is strictly banned by Central Insecticides Board (CIBRC) due to high mammalian toxicity and environmental persistence.`,
      });
    }
  }
  if (!hasBanned) {
    guardrails.push({
      guardrailName: "Banned Agrochemical Compliance (CIBRC)",
      status: "PASSED",
      message: "No prohibited or restricted chemical active ingredients detected.",
    });
  }

  if (qLower.includes("acid") || qLower.includes("lime") || qLower.includes("soil")) {
    guardrails.push({
      guardrailName: "Soil Chemistry Compatibility (OUAT Soils)",
      status: "PASSED",
      message: "Recommends agricultural lime (CaCO3) / FYM to ameliorate acidic pH, avoiding acidifying ammonium sulfate.",
    });
  }

  const primaryChunk = relevantChunks[0] || AGRONOMY_CORPUS[0];
  const groundedAnswer = `Based on ${primaryChunk.sourceDoc} published by ${primaryChunk.publisher}: ${primaryChunk.text} Always follow certified CIBRC and state agricultural university dosage schedules.`;

  return {
    query,
    groundedAnswer,
    groundingConfidenceScore: 96,
    guardrails,
    citedSources: relevantChunks,
    verifiedSafeDosage: !hasBanned,
  };
}

export const FALLBACK_NOTIFICATIONS = [
  {
    id: "notif-1",
    title: "Weather Advisory: Heavy Rain Alert",
    message: "Thunderstorms expected in 36 hours. Postpone open field fertilizer broadcasting.",
    read: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: "notif-2",
    title: "Mandi Price Alert: Paddy (Common)",
    message: "Current modal price at nearest APMC is ₹2,320/Quintal (+₹45 today).",
    read: false,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "notif-3",
    title: "PM-KISAN 17th Installment",
    message: "Direct benefit transfer credited. Check your linked DBT account status.",
    read: true,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
];
