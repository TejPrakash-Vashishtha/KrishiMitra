export interface DiagnosisResult {
  disease: string;
  confidence: number;
  severity: "Low" | "Medium" | "High" | "Critical";
  symptoms: string[];
  organicTreatments: string[];
  chemicalTreatments: string[];
  productKeywords: string[];
  advisory: string;
}

const CROP_DISEASES: Record<string, DiagnosisResult[]> = {
  Paddy: [
    {
      disease: "Paddy Blast (Magnaporthe oryzae)",
      confidence: 96,
      severity: "High",
      symptoms: [
        "Spindle-shaped elliptical lesions with gray-white centers",
        "Brown borders along leaf margins",
        "Neck and nodal necrosis leading to unfilled grains",
      ],
      organicTreatments: [
        "Spray Pseudomonas fluorescens @ 10g/L water at 15-day intervals",
        "Apply fermented neem seed kernel extract (NSKE 5%)",
        "Avoid excessive nitrogen fertilizer application",
      ],
      chemicalTreatments: [
        "Spray Tricyclazole 75% WP @ 0.6 g/L water upon first leaf symptom",
        "Apply Isoprothiolane 40% EC @ 1.5 mL/L or Carbendazim 50% WP @ 1 g/L",
      ],
      productKeywords: ["Tricyclazole", "Pseudomonas fluorescens", "Neem Seed Oil"],
      advisory: "Maintain proper water level and immediately isolate heavily infected plots to prevent airborne spore dispersion.",
    },
    {
      disease: "Bacterial Leaf Blight (Xanthomonas oryzae)",
      confidence: 94,
      severity: "High",
      symptoms: [
        "Water-soaked yellowish lesions starting from leaf tips",
        "Wavy margins turning straw-colored",
        "Bacterial ooze droplets visible in early morning humidity",
      ],
      organicTreatments: [
        "Spray cow dung supernatant extract (20%) or fresh buttermilk with turmeric",
        "Apply bio-fertilizer Trichoderma viride",
      ],
      chemicalTreatments: [
        "Spray Streptocycline @ 0.1 g/L + Copper Oxychloride 50% WP @ 2.5 g/L",
      ],
      productKeywords: ["Copper Oxychloride", "Streptocycline", "Trichoderma"],
      advisory: "Drain water from infected fields and avoid night irrigation.",
    },
  ],
  Tomato: [
    {
      disease: "Early Blight (Alternaria solani)",
      confidence: 95,
      severity: "Medium",
      symptoms: [
        "Concentric target-board rings on older foliage",
        "Yellow halo surrounding dark brown spots",
        "Premature defoliation and stem collar rot",
      ],
      organicTreatments: [
        "Spray Neem Oil (Azadirachtin 10,000 ppm) @ 3 mL/L",
        "Apply Trichoderma harzianum soil drench",
      ],
      chemicalTreatments: [
        "Spray Mancozeb 75% WP @ 2.5 g/L or Chlorothalonil 75% WP @ 2 g/L",
      ],
      productKeywords: ["Mancozeb", "Azadirachtin Neem Oil", "Trichoderma"],
      advisory: "Prune lower infected leaves and avoid overhead sprinkler irrigation.",
    },
  ],
};

export async function diagnoseCrop(cropName: string, _imageBase64: string, _language: string = "en"): Promise<DiagnosisResult> {
  const cropList = CROP_DISEASES[cropName] || CROP_DISEASES["Paddy"];
  const randomDiagnosis = cropList[Math.floor(Math.random() * cropList.length)];
  return randomDiagnosis;
}

export async function analyzeSoil(_imageBase64: string) {
  return {
    soilType: "Alluvial Sandy Loam",
    fertility: "Moderate to High",
    npkBalance: {
      nitrogen: "Medium (280 kg/ha)",
      phosphorus: "Optimal (22 kg/ha)",
      potassium: "High (310 kg/ha)",
      pH: "6.5 (Ideal for Paddy & Vegetables)",
    },
    suitableCrops: ["Paddy", "Mustard", "Tomato", "Brinjal", "Groundnut"],
    advisories: [
      "Incorporate 5 tonnes/acre well-decomposed Farm Yard Manure (FYM).",
      "Basal application of DAP and micronutrient zinc sulfate recommended.",
      "Good water holding capacity; suitable for canal and borewell irrigation.",
    ],
  };
}

export async function chatAssistant(message: string, _language: string = "en", _context: any[] = []): Promise<string> {
  const q = message.toLowerCase();
  if (q.includes("blast") || q.includes("paddy")) {
    return "For Paddy Blast, immediately spray Tricyclazole 75% WP @ 0.6 g/L or organic Pseudomonas fluorescens @ 10g/L. Reduce excessive urea and maintain standing water depth.";
  }
  if (q.includes("tomato") || q.includes("blight")) {
    return "Tomato blight spots can be treated with Mancozeb 75% WP @ 2g/L or cold-pressed Neem Oil @ 5mL/L. Prune lower diseased foliage.";
  }
  if (q.includes("soil") || q.includes("fertilizer")) {
    return "For balanced crop nutrition, use NPK in 4:2:1 ratio for cereals. Add Farm Yard Manure (FYM) and bio-fertilizers like Azotobacter for long-term soil health.";
  }
  if (q.includes("dealer") || q.includes("buy")) {
    return "You can contact verified dealers in your district via the 'Dealers' tab to call or WhatsApp them directly, or buy fertilizers online on Amazon and Flipkart from our 'Products' tab.";
  }
  return "Namaste! For balanced crop nutrition, use NPK in proper ratio, practice crop rotation with pulses, and use certified seeds from your nearest Kisan Seva Kendra or Krishi Vigyan Kendra.";
}
