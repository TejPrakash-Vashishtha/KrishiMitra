// Local farming knowledge base for AI assistant responses
// This provides answers when the backend API is not available

interface KnowledgeEntry {
  keywords: string[];
  response: string;
}

const knowledgeBase: KnowledgeEntry[] = [
  // Paddy/Rice diseases
  {
    keywords: ["paddy", "rice", "blast", "blast disease"],
    response: `**Paddy Blast Disease Control:**

🌾 **Chemical Control:**
• Tricyclazole 75% WP (0.6g/L) - Most effective systemic fungicide
• Isoprothiolane 40% EC (1.5ml/L)
• Carbendazim 50% WP (1g/L)

🌱 **Cultural Practices:**
• Use resistant varieties like Swarna, IR-64, MTU-7029
• Avoid excess nitrogen fertilizer
• Maintain proper plant spacing (20x10 cm)
• Drain field periodically to reduce humidity
• Remove infected plant debris

💡 **Bio-control:**
• Pseudomonas fluorescens (2g/L)
• Trichoderma viride (4g/L) in soil

⚠️ Apply fungicides at early infection stage for best results. Repeat after 10-15 days if needed.`
  },
  {
    keywords: ["tomato", "fertilizer", "flowering", "tomato flowering"],
    response: `**Best Fertilizer for Tomato Flowering:**

🍅 **Recommended NPK Ratio:**
• Use 10-26-26 or 13-0-45 (SOP) during flowering
• Avoid high nitrogen - it promotes leaves over flowers

🔬 **Micronutrients for Flowering:**
• Boron (0.2% spray) - improves flower setting
• Calcium (0.5% spray) - prevents blossom end rot
• Zinc (0.1% spray) - boosts flower development

📦 **Application Schedule:**
1. At transplanting: DAP (5g/plant)
2. 30 days: Urea + MOP
3. Flowering start: NPK 10-26-26 (10g/plant)
4. Fruit setting: SOP (5g/plant) weekly

🌿 **Organic Options:**
• Vermicompost (200g/plant)
• Bone meal (50g/plant)
• Cow urine spray (10% dilution)

💡 Tip: Avoid over-watering during flowering. Reduce irrigation frequency.`
  },
  {
    keywords: ["odisha", "rainy", "rain", "kharif", "crops", "monsoon"],
    response: `**Best Crops for Odisha Rainy Season (Kharif):**

🌧️ **Top Recommended Crops:**

1. **Paddy (Rice)** - Main kharif crop
   • Varieties: Swarna, MTU-7029, CR-1009
   • Sowing: June-July
   • Yield: 25-30 quintals/acre

2. **Pulses (Moong/Greengram)**
   • Duration: 60-65 days
   • Price: ₹70-80/kg
   • Low input cost

3. **Groundnut**
   • Variety: JL-24, TAG-24
   • Well-drained sandy loam soil
   • Yield: 8-10 quintals/acre

4. **Maize (Corn)**
   • Hybrid: HQPM-1, Bio-9681
   • Quick harvest (90-100 days)

5. **Vegetables:**
   • Okra (Ladies Finger)
   • Brinjal (Eggplant)
   • Bottle Gourd

📋 **Government Support:**
• PMFBY insurance available
• Input subsidy for flood-affected areas
• Free seeds through KVK centers`
  },
  {
    keywords: ["neem", "oil", "pesticide", "neem oil"],
    response: `**Neem Oil Usage for Pest Control:**

🌿 **Preparation:**
• Mix 5ml neem oil + 2ml liquid soap in 1 liter water
• Shake well before spraying
• Spray in evening (avoids sun damage to oil)

🐛 **Effective Against:**
• Aphids, Whiteflies, Mealybugs
• Thrips, Leaf miners
• Caterpillars (early stage)
• Spider mites

📅 **Application Schedule:**
• Preventive: Every 15 days
• Curative: Every 7 days for 3 applications
• Best time: Early morning or late evening

⚠️ **Do Not Mix With:**
• Copper-based fungicides
• Bordeaux mixture
• Other oils

💰 **Cost:** ₹200-300 per liter (treats 0.5 acre)

✅ **Benefits:**
• Organic and safe
• No residue on crops
• Safe for beneficial insects
• Can be used up to harvest`
  },
  {
    keywords: ["irrigation", "drip", "water", "drip irrigation"],
    response: `**Drip Irrigation Setup Guide:**

💧 **Components Needed:**
• Main pipeline (PVC 63mm)
• Sub-main (PVC 32mm)
• Laterals (LDPE 16mm, 4mm emitter spacing)
• Filter (Disc/Sand filter)
• Fertigation unit (Venturi/Injector)

📐 **Layout:**
• Row spacing: 1.5-2m for vegetables
• Emitter spacing: 30-60cm (crop dependent)
• Operating pressure: 1-1.5 kg/cm²

💰 **Cost Estimate:**
• Vegetables: ₹40,000-50,000/acre
• Fruits: ₹60,000-70,000/acre
• Government subsidy: 55-75% (PMKSY)

📅 **Maintenance:**
• Clean filters weekly
• Flush lines monthly
• Check emitters for clogging
• Use acid treatment quarterly

📊 **Water Savings:** 40-60% compared to flood irrigation

🏛️ **Subsidy Available:**
• Apply throughDistrict Agriculture Office
• Online: Contact your state agriculture department website`
  },
  {
    keywords: ["soil", "testing", "soil health", "soil test"],
    response: `**Soil Testing Guide:**

🧪 **How to Collect Soil Sample:**
1. Take 15-20 samples from field in zigzag pattern
2. Collect from 0-15cm depth
3. Mix thoroughly, take 500g as representative sample
4. Air dry in shade (do not sun dry)
5. Send to nearest Krishi Vigyan Kendra (KVK)

📊 **Key Parameters Tested:**
• pH (ideal: 6.5-7.5)
• Organic Carbon (should be >0.5%)
• Nitrogen (N)
• Phosphorus (P)
• Potassium (K)
• Micronutrients (Zn, Fe, Mn, Cu, B)

💰 **Cost:** Free at government labs, ₹200-500 at private labs

📍 **Where to Get Tested:**
• Soil Testing Laboratory (District level)
• Krishi Vigyan Kendra (KVK)
• Agricultural University labs
• Mobile soil testing vans

📋 **Interpreting Results:**
• pH < 6.0: Add lime (2-4 tons/acre)
• pH > 8.0: Add gypsum (2-3 tons/acre)
• Low N: Apply Urea
• Low P: Apply DAP/TSP
• Low K: Apply MOP

💡 Test soil before every kharif and rabi season.`
  },
  {
    keywords: ["schemes", "government", "subsidy", "loan", "pm", "pmkisan", "kisan"],
    response: `**Government Schemes for Farmers:**

🏛️ **PM-KISAN:**
• ₹6,000/year in 3 installments (₹2,000 each)
• Direct benefit transfer to bank account
• Apply: pmkisan.gov.in

🛡️ **PMFBY (Crop Insurance):**
• Premium: 2% (kharif), 1.5% (rabi) of sum insured
• Covers natural calamities, pests, diseases
• Apply before sowing deadline

💰 **Kisan Credit Card (KCC):**
• Credit limit based on land holding
• Interest: 4% (with subsidy), else 7%
• Covers cultivation + animal husbandry

🌾 **PM Krishi Sinchayee Yojana:**
• 55% subsidy on drip/sprinkler irrigation
• Apply through District Agriculture Officer

🌱 **Soil Health Card:**
• Free soil testing
• Recommended fertilizer doses
• Available at all soil testing labs

🚜 **Sub-Mission on Agricultural Mechanization (SMAM):**
• 50-80% subsidy on farm equipment
• Apply: smam.gov.in

📞 **Helpline:** 1800-180-1551 (Kisan Call Center)`
  },
  {
    keywords: ["organic", "farming", "natural", "zero budget"],
    response: `**Organic Farming Guide:**

🌿 **Starting Organic Farming:**
1. Convert gradually (3-year transition period)
2. Stop all chemical fertilizers and pesticides
3. Build soil health with organic matter
4. Use bio-fertilizers and bio-pesticides

🔬 **Essential Inputs:**
• Jeevamrutha (fermented cow dung + urine)
• Beejamrutha (seed treatment)
• Neem cake (300kg/acre)
• Vermicompost (2 tons/acre)

🐛 **Bio-Pesticides:**
• Trichoderma (2g/L) - fungal diseases
• Pseudomonas (2g/L) - bacterial diseases
• Beauveria bassiana (5g/L) - insects
• Neem oil (5ml/L) - general pest control

📊 **Certification:**
• NPOP (National Programme for Organic Production)
• Participatory Guarantee System (PGS)
• Organic certification takes 2-3 years

💰 **Market & Premium:**
• 20-40% price premium
• Sell through organic mandis
• Online platforms: BigHaat, KisanKraft

🏛️ **Support Available:**
• PKVY scheme (₹50,000/ha support)
• Organic clusters formation
• Marketing support through government`
  },
  {
    keywords: ["wheat", "disease", "rust", "yellow rust", "brown rust"],
    response: `**Wheat Disease Control (Rust):**

🌾 **Types of Rust:**
• Yellow Rust (Stripe): Yellow-orange pustules in stripes
• Brown Rust: Brown circular pustules
• Black Rust (Stem): Large dark pustules on stem

💊 **Chemical Control:**
• Propiconazole 25% EC (1ml/L) - Early stage
• Tebuconazole 25.9% EC (0.5ml/L)
• Hexaconazole 5% EC (1ml/L)

🌱 **Cultural Practices:**
• Use resistant varieties (HD-3226, WH-1270)
• Early sowing (by Nov 15)
• Avoid excess nitrogen
• Proper spacing (20cm between rows)

📅 **Spray Schedule:**
1. First spray: At appearance of rust
2. Second spray: After 10-15 days

⚠️ **Important:**
• Spray at first sign of infection
• Cover both surfaces of leaves
• Do not spray during rain

💡 Monitor field weekly during February-March`
  },
  {
    keywords: ["fertilizer", "urea", "npk", "dose", "recommendation"],
    response: `**Fertilizer Dose Recommendations:**

📊 **General NPK Guide (kg/ha):**

🌾 **Paddy:** N:120, P:60, K:40
🌾 **Wheat:** N:120, P:60, K:40
🍅 **Tomato:** N:100, P:50, K:50
🥔 **Potato:** N:180, P:80, K:150
🫘 **Groundnut:** N:25, P:50, K:50
🌽 **Maize:** N:150, P:70, K:70

🔬 **Application Timing:**
• Basal (at sowing): Full P + 1/3 N + Full K
• Top dress 1: 30 days - 1/3 N
• Top dress 2: 60 days - 1/3 N

📋 **Urea Equivalent:**
• 1 bag DAP (50kg) = 2 bags Urea for N
• Apply Urea in 2-3 split doses
• Never apply on wet leaves

💡 **Tips:**
• Get soil test done first
• Apply based on recommended dose
• Use leaf color chart for N management
• Mix with soil, don't leave on surface`
  }
];

// Find the best matching response for a query
export function findFarmingAnswer(query: string): string {
  const lowerQuery = query.toLowerCase();

  // Score each entry based on keyword matches
  let bestMatch: KnowledgeEntry | null = null;
  let bestScore = 0;

  for (const entry of knowledgeBase) {
    let score = 0;
    for (const keyword of entry.keywords) {
      if (lowerQuery.includes(keyword.toLowerCase())) {
        score += keyword.length; // Longer keyword match = higher score
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = entry;
    }
  }

  if (bestMatch && bestScore > 0) {
    return bestMatch.response;
  }

  // Generic fallback response
  return `Thank you for your question: "${query}"

I'm KrishiMitra AI, your farming assistant. Here are some topics I can help with:

🌾 **Crop Diseases:** Paddy blast, wheat rust, tomato blight, and more
🧪 **Fertilizers:** NPK recommendations, organic options, soil health
🌧️ **Weather & Season:** Best crops for your season and region
🏛️ **Government Schemes:** PM-KISAN, PMFBY, KCC, and subsidies
💧 **Irrigation:** Drip systems, water management
🐛 **Pest Control:** Neem oil, bio-pesticides, IPM

**Popular Questions:**
• How to control paddy blast disease?
• Which fertilizer is best for tomato flowering?
• What crops are suitable for Odisha rainy season?
• How to set up drip irrigation?
• Government schemes for farmers?

Please ask about any specific farming topic, and I'll provide detailed guidance! 🌱`;
}

// Quick greeting responses
export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}
