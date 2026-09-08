// ============================================================
// Agriculture Knowledge Base — curated from public agricultural
// extension data (ICAR, FAO, state agriculture departments,
// PlantVillage disease descriptions, Kaggle crop recommendation
// datasets). Stored permanently in the repo and shipped to the
// frontend so the AI has grounded data even offline.
// ============================================================

export interface SoilProfile {
  ph: [number, number];
  nitrogen: string;
  phosphorus: string;
  potassium: string;
  texture: string;
  notes: string;
}

export interface IrrigationProfile {
  stage: string;
  frequency: string;
  amount: string;
  method: string;
}

export interface DiseaseInfo {
  name: string;
  symptoms: string[];
  organic: string[];
  chemical: string[];
  cause: string;
  severityRange: string;
}

export interface CropProfile {
  name: string;
  season: string;
  sowing: string;
  harvest: string;
  temperature: string;
  rainfall: string;
  duration: string;
  idealFertilizer: string;
  soil: SoilProfile;
  irrigation: IrrigationProfile[];
  diseases: DiseaseInfo[];
}

export const CROP_KNOWLEDGE: Record<string, CropProfile> = {
  Paddy: {
    name: "Paddy (Rice)",
    season: "Kharif (June-November) and Rabi (Nov-April) in irrigated areas",
    sowing: "Transplant 25-30 day old seedlings, spacing 20x15 cm",
    harvest: "105-150 days after transplanting when 80% grains turn golden",
    temperature: "20-35°C optimal, above 40°C causes sterility",
    rainfall: "100-200 cm well distributed",
    duration: "120-150 days",
    idealFertilizer: "NPK 80:40:40 kg/ha + zinc 25 kg/ha if deficient",
    soil: {
      ph: [5.5, 7.0],
      nitrogen: "High — 80-100 kg/ha urea split in 3 doses",
      phosphorus: "Moderate — 40-50 kg/ha P2O5 at transplanting",
      potassium: "Moderate — 40 kg/ha K2O, half at transplanting, half at panicle initiation",
      texture: "Clay or clay-loam, water-retentive, puddled",
      notes: "Aerobic rice needs less water; SRI method cuts seed rate 80%",
    },
    irrigation: [
      { stage: "Transplanting to tillering", frequency: "Continuous 2-5 cm standing water", amount: "5 cm depth", method: "Flooding" },
      { stage: "Panicle initiation to flowering", frequency: "Never let field dry", amount: "5 cm depth", method: "Flooding" },
      { stage: "Maturity", frequency: "Drain 15 days before harvest", amount: "Moist soil", method: "Drainage" },
    ],
    diseases: [
      {
        name: "Bacterial Leaf Blight",
        symptoms: ["Yellow-white wilting along leaf margins", "Wavy yellow border between healthy and dead tissue", "Yellowish bacterial ooze on cuts"],
        organic: ["Drain field, dry soil for 3-4 days", "Spray copper hydroxide 1g/litre or neem oil 3ml/litre", "Apply potash to strengthen leaves"],
        chemical: ["Streptocycline 0.1g + copper oxychloride 3g per 10 litres water, spray twice 10 days apart"],
        cause: "Xanthomonas oryzae bacteria — spreads by wind-driven rain and infected seed",
        severityRange: "Low to Critical",
      },
      {
        name: "Blast Disease",
        symptoms: ["Diamond-shaped grey spots with brown edges on leaves", "Neck nodes turn black and break", "Grains remain unfilled"],
        organic: ["Avoid excess nitrogen fertilizer", "Silicon-rich amendments (rice husk ash)", "Drain excess water"],
        chemical: ["Tricyclazole 0.6g/litre or Carbendazim 1g/litre at booting and heading stage"],
        cause: "Magnaporthe oryzae fungus — thrives in humid, cloudy, overcast weather",
        severityRange: "Low to High",
      },
      {
        name: "Brown Spot",
        symptoms: ["Small round brown spots with grey or yellow halo", "Spots merge and kill whole leaf", "Poor grain filling with brown spots on grain"],
        organic: ["Balanced fertilization — this disease signals low soil potassium", "Seed treatment with hot water 52°C for 10 minutes"],
        chemical: ["Mancozeb 2.5g/litre spray at 15-day intervals"],
        cause: "Bipolaris oryzae fungus — soil exhaustion and low potassium",
        severityRange: "Low to Medium",
      },
    ],
  },
  Tomato: {
    name: "Tomato",
    season: "Winter (Oct-Feb) in plains; year-round in hills",
    sowing: "Nursery 30-40 days, transplant 60x45 cm spacing",
    harvest: "60-75 days after transplanting for green-pink stage",
    temperature: "18-27°C optimal; above 32°C causes flower drop",
    rainfall: "Moderate 60-100 cm, avoid waterlogging",
    duration: "120-150 days",
    idealFertilizer: "NPK 120:80:60 kg/ha + calcium nitrate foliar spray",
    soil: {
      ph: [6.0, 7.0],
      nitrogen: "High — 120 kg/ha split 4 doses",
      phosphorus: "High — 80 kg/ha P2O5 at transplanting",
      potassium: "High — 60 kg/ha K2O split 2 doses",
      texture: "Well-drained sandy loam rich in organic matter",
      notes: "Calcium deficiency causes blossom-end rot; mulch to keep soil moisture even",
    },
    irrigation: [
      { stage: "Seedling & vegetative", frequency: "Every 5-7 days", amount: "3-5 litres/plant", method: "Drip preferred" },
      { stage: "Flowering & fruiting", frequency: "Every 3-4 days", amount: "5-8 litres/plant", method: "Drip" },
      { stage: "Harvest stage", frequency: "Every 4 days", amount: "4-6 litres/plant", method: "Drip" },
    ],
    diseases: [
      {
        name: "Early Blight",
        symptoms: ["Dark brown spots with concentric rings (target spots)", "Lower leaves yellow and drop first", "Stem cankers near soil line"],
        organic: ["Mulch with straw to stop soil splash", "Spray neem oil 3ml + baking soda 5g/litre", "Remove and burn infected lower leaves"],
        chemical: ["Mancozeb 2.5g/litre or Chlorothalonil 2g/litre, spray every 10 days"],
        cause: "Alternaria solani fungus — humid 24-29°C weather, splashing rain",
        severityRange: "Low to High",
      },
      {
        name: "Late Blight",
        symptoms: ["Water-soaked greasy lesions with white fungal growth under leaves", "Fruits turn brown and rot quickly", "Rapid death of foliage in cool wet weather"],
        organic: ["Avoid overhead watering", "Copper-based sprays 5g/litre", "Improve air circulation with wider spacing"],
        chemical: ["Cymoxanil+Mancozeb 3g/litre or Metalaxyl 0.25% at first sign"],
        cause: "Phytophthora infestans — cool nights, high humidity, fog",
        severityRange: "Medium to Critical",
      },
      {
        name: "Leaf Curl Virus",
        symptoms: ["Leaves curl upward and become crinkled", "Yellowing of veins", "Stunted plant with no or deformed fruit"],
        organic: ["Install yellow sticky traps 10/acre for whitefly", "Spray neem oil 5ml/litre weekly", "Uproot and destroy infected plants"],
        chemical: ["Imidacloprid 0.3ml/litre for whitefly control; no cure for the virus itself"],
        cause: "Tomato leaf curl virus transmitted by whitefly (Bemisia tabaci)",
        severityRange: "Medium to Critical",
      },
    ],
  },
  Mustard: {
    name: "Mustard",
    season: "Rabi (Oct-March)",
    sowing: "Mid-October, 30x10 cm spacing, seed rate 1.5 kg/acre",
    harvest: "110-140 days when 75% siliquae turn yellow-brown",
    temperature: "10-25°C optimal, frost at flowering is dangerous",
    rainfall: "Light 30-40 cm, supplementary irrigation enough",
    duration: "110-140 days",
    idealFertilizer: "NPK 40:20:20 kg/ha + sulphur 40 kg/ha (mustard loves sulphur)",
    soil: {
      ph: [6.0, 7.5],
      nitrogen: "Moderate — 40-50 kg/ha in 2 splits",
      phosphorus: "Low-moderate — 20-30 kg/ha at sowing",
      potassium: "Low-moderate — 20 kg/ha at sowing",
      texture: "Loamy, well-drained, slightly alkaline tolerated",
      notes: "Sulphur 40 kg/ha raises oil content by 2-3%",
    },
    irrigation: [
      { stage: "Pre-flowering (30-35 DAS)", frequency: "First irrigation", amount: "4 cm", method: "Furrow/Border" },
      { stage: "Siliqua development (50-60 DAS)", frequency: "Second irrigation", amount: "4 cm", method: "Furrow" },
      { stage: "Seed fill (75-80 DAS)", frequency: "Third irrigation if dry", amount: "4 cm", method: "Furrow" },
    ],
    diseases: [
      {
        name: "Alternaria Blight",
        symptoms: ["Dark brown-black concentric rings on leaves", "Pods become blighted and shrivel", "Defoliation in humid weather"],
        organic: ["Seed treatment with hot water 50°C for 20 min", "Trichoderma seed coating", "Avoid dense sowing"],
        chemical: ["Mancozeb 2.5g/litre at 10-day intervals from 45 DAS"],
        cause: "Alternaria brassicae — cool humid cloudy weather",
        severityRange: "Low to High",
      },
      {
        name: "White Rust",
        symptoms: ["Creamy white blisters on underside of leaves", "Staghead (deformed flower) formation", "Leaves thicken and curl"],
        organic: ["Crop rotation with non-brassica crops", "Field sanitation, remove volunteer plants"],
        chemical: ["Metalaxyl+Mancozeb 2.5g/litre at disease appearance"],
        cause: "Albugo candida oomycete — cool moist conditions",
        severityRange: "Low to Medium",
      },
      {
        name: "Powdery Mildew",
        symptoms: ["White powdery coating on leaves and pods", "Premature leaf fall", "Shriveled seeds"],
        organic: ["Sulphur dust 25 kg/ha", "Baking soda 5g + neem oil 3ml/litre spray"],
        chemical: ["Wettable sulphur 2g/litre or Dinocap 1ml/litre"],
        cause: "Erysiphe cruciferarum — warm dry days with cool nights",
        severityRange: "Low to Medium",
      },
    ],
  },
  Potato: {
    name: "Potato",
    season: "Rabi winter crop (Oct-March) in plains",
    sowing: "Mid-October to early November, 60x20 cm, ridge planting",
    harvest: "80-110 days after planting when haulms yellow",
    temperature: "15-20°C optimal tuber formation, above 25°C reduces yield",
    rainfall: "Needs cool dry season; irrigation-based",
    duration: "90-120 days",
    idealFertilizer: "NPK 120:100:80 kg/ha + zinc sulphate 25 kg/ha",
    soil: {
      ph: [5.5, 6.5],
      nitrogen: "High — 120 kg/ha in 2 splits, half before earthing-up",
      phosphorus: "High — 100 kg/ha full at planting",
      potassium: "Highest — 80 kg/ha full at planting",
      texture: "Friable sandy loam, easy for tuber expansion",
      notes: "Earthing-up 25-30 DAP prevents greening; avoid fresh manure (scab)",
    },
    irrigation: [
      { stage: "Planting to emergence", frequency: "Light irrigation every 5 days", amount: "2-3 cm", method: "Furrow" },
      { stage: "Tuber initiation (20-25 DAP)", frequency: "Critical — every 4-5 days", amount: "3-4 cm", method: "Furrow/Drip" },
      { stage: "Tuber bulking (40-70 DAP)", frequency: "Every 5-7 days, most critical", amount: "4-5 cm", method: "Drip best" },
      { stage: "Maturity", frequency: "Stop irrigation 10 days before harvest", amount: "None", method: "Stop" },
    ],
    diseases: [
      {
        name: "Late Blight",
        symptoms: ["Dark water-soaked lesions on leaves with white mold under", "Brown-black streaks on stems", "Reddish-brown dry rot inside tubers"],
        organic: ["Use certified blight-free seed", "Ridge planting with good drainage", "Copper oxychloride 3g/litre preventive spray"],
        chemical: ["Cymoxanil+Mancozeb 3g/litre or Metribuzin; repeat every 7-10 days in blight weather"],
        cause: "Phytophthora infestans — cool humid nights with dew, spreads explosively",
        severityRange: "Medium to Critical",
      },
      {
        name: "Early Blight",
        symptoms: ["Brown target-like concentric spots on older leaves", "Yellow halo around spots", "Tubers get dark sunken lesions"],
        organic: ["Balanced potash fertilization", "Mulching to reduce soil splash", "Remove lower infected leaves"],
        chemical: ["Mancozeb 2.5g/litre every 10 days"],
        cause: "Alternaria solani — warm humid weather, stressed plants",
        severityRange: "Low to High",
      },
      {
        name: "Black Scurf",
        symptoms: ["Black hard sclerotia crusts on tuber skin (looks like soil that won't wash)", "Weak patchy emergence", "Stem cankers killing sprouts"],
        organic: ["Treat seed tubers with Trichoderma viride", "Plant well-sprouted seed", "Harvest promptly when mature"],
        chemical: ["Seed treatment with Pencycuron 0.25% or Carbendazim+Mancozeb"],
        cause: "Rhizoctonia solani — infected seed and cool wet soil",
        severityRange: "Low to Medium",
      },
    ],
  },
  Maize: {
    name: "Maize",
    season: "Kharif, Rabi and Zaid — year-round in irrigated areas",
    sowing: "25x15 cm spacing, seed rate 20 kg/ha, 4-5 cm depth",
    harvest: "90-110 days for grain, when husk dries and grains hard",
    temperature: "21-27°C optimal for germination and growth",
    rainfall: "60-100 cm, but critical irrigation stages needed",
    duration: "90-110 days",
    idealFertilizer: "NPK 120:60:40 kg/ha + zinc sulphate 25 kg/ha (maize is zinc hungry)",
    soil: {
      ph: [5.8, 7.5],
      nitrogen: "High — 120 kg/ha in 3 splits (knee-high, tasseling, grain fill)",
      phosphorus: "Moderate — 60 kg/ha at sowing",
      potassium: "Moderate — 40 kg/ha at sowing",
      texture: "Well-drained loams, avoid waterlogging absolutely",
      notes: "Zinc deficiency shows white bands on young leaves",
    },
    irrigation: [
      { stage: "Knee-high stage", frequency: "First critical irrigation", amount: "5 cm", method: "Furrow" },
      { stage: "Tasseling-silking", frequency: "MOST critical — never stress", amount: "6 cm", method: "Furrow/Drip" },
      { stage: "Grain filling", frequency: "Every 10 days", amount: "5 cm", method: "Furrow" },
      { stage: "Dough stage", frequency: "Last irrigation", amount: "4 cm", method: "Furrow" },
    ],
    diseases: [
      {
        name: "Turcicum Leaf Blight",
        symptoms: ["Long elliptical grey-green lesions on leaves", "Lesions have dark margins", "Damage spreads from lower leaves up"],
        organic: ["Field sanitation, plough in residue", "Resistant varieties", "Balanced N application"],
        chemical: ["Mancozeb 2.5g/litre at disease onset, 2 sprays 10 days apart"],
        cause: "Exserohilum turcicum — moderate temps with high humidity",
        severityRange: "Low to High",
      },
      {
        name: "Downy Mildew",
        symptoms: ["White downy growth on underside of striped leaves", "Chlorotic stripes along veins", "Tassels deformed into leafy structures"],
        organic: ["Remove and destroy systemically infected plants", "Avoid late planting", "Seed treatment with Trichoderma"],
        chemical: ["Metalaxyl 6g/kg seed treatment + Metalaxyl+Mancozeb spray 2.5g/litre"],
        cause: "Peronosclerospora sorghi — wet cloudy weather after sowing",
        severityRange: "Medium to Critical",
      },
      {
        name: "Stalk Rot",
        symptoms: ["Lower internodes soften and turn brown-black", "Plants lodge/fall over", "Pith shredded and discoloured"],
        organic: ["Balanced potash nutrition", "Avoid water stress followed by heavy rain", "Harvest at proper maturity"],
        chemical: ["Prevention-based: seed treatment with Carbendazim+Mancozeb 2g/kg"],
        cause: "Fusarium and Macrophomina — drought stress then wet conditions",
        severityRange: "Medium to High",
      },
    ],
  },
  Brinjal: {
    name: "Brinjal (Eggplant)",
    season: "Year-round; main crop Kharif and Rabi",
    sowing: "Nursery 35-40 days, transplant 75x60 cm",
    harvest: "60-80 days after transplanting, pick at edible stage",
    temperature: "21-30°C optimal, sensitive to frost",
    rainfall: "Moderate; well-distributed",
    duration: "150-180 days continuous picking",
    idealFertilizer: "NPK 100:50:50 kg/ha + FYM 25 t/ha",
    soil: {
      ph: [5.5, 6.8],
      nitrogen: "High — 100 kg/ha split 4-5 doses",
      phosphorus: "Moderate — 50 kg/ha at transplanting",
      potassium: "Moderate — 50 kg/ha split 2 doses",
      texture: "Sandy loam to clay loam, well-drained",
      notes: "Staking prevents fruit touch soil; mulch conserves water",
    },
    irrigation: [
      { stage: "Establishment", frequency: "Every 3-4 days", amount: "3-4 litres/plant", method: "Drip best" },
      { stage: "Flowering & fruiting", frequency: "Every 4-5 days", amount: "5-6 litres/plant", method: "Drip" },
      { stage: "Hot dry season", frequency: "Every 3 days", amount: "6-8 litres/plant", method: "Drip" },
    ],
    diseases: [
      {
        name: "Phomopsis Blight",
        symptoms: ["Brown-grey circular spots with dark rings on leaves", "Fruit rot with concentric rings", "Damping-off in nursery"],
        organic: ["Seed treatment hot water 50°C 25 min", "Trichoderma seed and soil treatment", "Crop rotation 2-3 years"],
        chemical: ["Seed treatment Carbendazim 2g/kg + Zineb sprays 2.5g/litre"],
        cause: "Phomopsis vexans — warm humid weather, rain splash",
        severityRange: "Low to High",
      },
      {
        name: "Bacterial Wilt",
        symptoms: ["Sudden wilting of whole plant without yellowing", "White bacterial ooze from cut stem", "Brown staining of vascular ring"],
        organic: ["Graft on wild eggplant rootstock", "Soil solarization", "Grow resistant varieties", "Crop rotation with paddy"],
        chemical: ["No effective chemical; preventive Streptocycline drenching 0.5g/litre"],
        cause: "Ralstonia solanacearum soil bacterium — warm wet soils",
        severityRange: "Medium to Critical",
      },
      {
        name: "Little Leaf (Phyllody)",
        symptoms: ["Flowers become green leafy structures", "Extreme stunting", "No fruit formation"],
        organic: ["Control leafhopper vector with neem oil 5ml/litre", "Uproot infected plants immediately", "Yellow sticky traps"],
        chemical: ["Imidacloprid 0.3ml/litre for vector control; infected plants have no cure"],
        cause: "Phytoplasma transmitted by leafhopper (Hishimonus phycitis)",
        severityRange: "Medium to Critical",
      },
    ],
  },
  Chilli: {
    name: "Chilli",
    season: "Rabi main season (Oct-June) for dry chilli",
    sowing: "Nursery 40-45 days, transplant 60x45 cm",
    harvest: "70-90 days after transplanting for green, 110+ for red dry",
    temperature: "18-30°C, cool nights improve colour",
    rainfall: "Moderate; rain at flowering causes flower drop",
    duration: "180-220 days",
    idealFertilizer: "NPK 100:60:50 kg/ha + FYM 20 t/ha",
    soil: {
      ph: [6.0, 7.0],
      nitrogen: "High — 100 kg/ha split 3-4 doses",
      phosphorus: "Moderate — 60 kg/ha at transplanting",
      potassium: "Moderate — 50 kg/ha split; potash improves colour and pungency",
      texture: "Well-drained loamy black or red soils",
      notes: "Water stress at fruiting increases pungency but cuts yield",
    },
    irrigation: [
      { stage: "Transplanting to flowering", frequency: "Every 7-10 days", amount: "3-4 litres/plant", method: "Drip best" },
      { stage: "Flowering & fruit set", frequency: "Every 5-6 days", amount: "5 litres/plant", method: "Drip" },
      { stage: "Red fruit drying", frequency: "Stop irrigation 15 days before harvest", amount: "None", method: "Stop" },
    ],
    diseases: [
      {
        name: "Anthracnose (Fruit Rot)",
        symptoms: ["Black sunken circular spots with orange ring on fruits", "Dieback of branch tips", "Twigs turn black and die back"],
        organic: ["Seed treatment Trichoderma 4g/kg", "Neem oil 3ml/litre weekly", "Avoid overhead irrigation"],
        chemical: ["Mancozeb 2.5g/litre + Carbendazim 1g/litre alternate sprays at 10-day interval"],
        cause: "Colletotrichum capsici — warm humid weather, rain splash",
        severityRange: "Medium to Critical",
      },
      {
        name: "Powdery Mildew",
        symptoms: ["White powdery patches on lower leaf surface", "Leaves curl, twist and drop", "Fruits remain small and dull"],
        organic: ["Sulphur dust 20-25 kg/ha", "Wettable sulphur 2g/litre spray", "Good spacing for air flow"],
        chemical: ["Dinocap 1ml/litre or Hexaconazole 1ml/litre"],
        cause: "Leveillula taurica — warm dry days with cool nights",
        severityRange: "Low to High",
      },
      {
        name: "Leaf Curl Virus",
        symptoms: ["Upward curling and puckering of leaves", "Yellowing of veins", "Severe stunting, few or no fruits"],
        organic: ["Yellow sticky traps 15/acre", "Neem oil 5ml/litre weekly for whitefly", "Remove infected plants"],
        chemical: ["Acetamiprid 0.3g/litre for whitefly; no cure for virus"],
        cause: "Chilli leaf curl virus via whitefly vector",
        severityRange: "Medium to Critical",
      },
    ],
  },
  Wheat: {
    name: "Wheat",
    season: "Rabi (Nov-April)",
    sowing: "Early November, 22.5 cm rows, 100 kg/ha seed",
    harvest: "120-140 days when grains hard and straw golden",
    temperature: "10-25°C; grain fill needs cool 15-20°C",
    rainfall: "Irrigation based in India",
    duration: "120-140 days",
    idealFertilizer: "NPK 120:60:40 kg/ha + sulphur 20 kg/ha",
    soil: {
      ph: [6.0, 7.5],
      nitrogen: "High — 120 kg/ha split 3 doses",
      phosphorus: "Moderate — 60 kg/ha at sowing",
      potassium: "Moderate — 40 kg/ha at sowing",
      texture: "Loam to clay loam with good drainage",
      notes: "Late sowing loses 1% yield per day; crown roots need moisture",
    },
    irrigation: [
      { stage: "Crown Root Initiation (21 DAS)", frequency: "FIRST and most critical", amount: "6 cm", method: "Border/Furrow" },
      { stage: "Tillering (40-45 DAS)", frequency: "Second irrigation", amount: "6 cm", method: "Border" },
      { stage: "Flowering (60-65 DAS)", frequency: "Third irrigation", amount: "6 cm", method: "Border" },
      { stage: "Grain filling (80-85 DAS)", frequency: "Fourth irrigation", amount: "6 cm", method: "Border" },
    ],
    diseases: [
      {
        name: "Yellow (Stripe) Rust",
        symptoms: ["Yellow stripes of pustules along veins", "Powder rubs off on hand", "Leaves yellow and die early"],
        organic: ["Grow resistant varieties (HD2967 etc.)", "Scout weekly in January-February"],
        chemical: ["Propiconazole 0.1% (1ml/litre) at first sign, repeat 15 days"],
        cause: "Puccinia striiformis — cool humid 10-15°C weather",
        severityRange: "Medium to Critical",
      },
      {
        name: "Karnal Bunt",
        symptoms: ["Grains partially blackened with fishy smell", "Embryo end black smudge", "Earheads look normal outside"],
        organic: ["Use clean certified seed", "Avoid excess irrigation at flowering"],
        chemical: ["Seed treatment Carbendazim 2g/kg + Propiconazole spray at heading"],
        cause: "Tilletia indica — cloudy humid weather at anthesis",
        severityRange: "Low to Medium",
      },
      {
        name: "Powdery Mildew",
        symptoms: ["White-grey powdery patches on leaves", "Tissue turns yellow then brown", "Poor grain filling"],
        organic: ["Avoid excess nitrogen", "Sulphur dust 25 kg/ha"],
        chemical: ["Wettable sulphur 2g/litre or Propiconazole 1ml/litre"],
        cause: "Blumeria graminis — cool cloudy humid weather",
        severityRange: "Low to Medium",
      },
    ],
  },
  Other: {
    name: "General Crop",
    season: "Depends on crop — Kharif (monsoon) or Rabi (winter)",
    sowing: "Follow region-specific recommendations",
    harvest: "Follow maturity indicators of the specific crop",
    temperature: "Most Indian crops do well at 15-35°C",
    rainfall: "Kharif crops 75-150 cm; Rabi crops irrigation-based",
    duration: "90-180 days depending on crop",
    idealFertilizer: "Soil-test based NPK + organic manure 10 t/ha",
    soil: {
      ph: [6.0, 7.5],
      nitrogen: "Soil-test based, typically 60-120 kg/ha",
      phosphorus: "Soil-test based, typically 40-80 kg/ha",
      potassium: "Soil-test based, typically 30-60 kg/ha",
      texture: "Well-drained loamy soil suits most crops",
      notes: "Get a free soil health card from your Krishi Vigyan Kendra",
    },
    irrigation: [
      { stage: "Establishment", frequency: "Keep topsoil moist", amount: "Light frequent", method: "Any" },
      { stage: "Vegetative growth", frequency: "Every 7-10 days", amount: "Moderate", method: "Furrow/Drip" },
      { stage: "Reproductive stage", frequency: "Never stress the crop", amount: "Full", method: "Any" },
    ],
    diseases: [
      {
        name: "Leaf Spot Complex",
        symptoms: ["Brown or black spots on leaves", "Yellow halos", "Premature defoliation"],
        organic: ["Neem oil 3ml/litre weekly", "Remove infected leaves", "Balanced nutrition"],
        chemical: ["Mancozeb 2.5g/litre at 10-day intervals"],
        cause: "Various fungi — humid weather",
        severityRange: "Low to High",
      },
      {
        name: "Root Rot / Wilt",
        symptoms: ["Yellowing and wilting starting from lower leaves", "Stunted growth", "Roots brown and rotten"],
        organic: ["Trichoderma 2.5 kg/ha with FYM", "Improve drainage", "Crop rotation"],
        chemical: ["Carbendazim 1g/litre soil drench"],
        cause: "Soil-borne fungi — waterlogged or over-irrigated soils",
        severityRange: "Medium to Critical",
      },
      {
        name: "Sucking Pest Damage",
        symptoms: ["Yellowing and curling of young leaves", "Sticky honeydew and sooty mould", "Stunted growth"],
        organic: ["Yellow sticky traps", "Neem oil 5ml/litre", "Ladybird beetle conservation"],
        chemical: ["Imidacloprid 0.3ml/litre or Acetamiprid 0.3g/litre"],
        cause: "Aphids, whitefly, jassids, thrips",
        severityRange: "Low to High",
      },
    ],
  },
};

// Verified agro-dealers (sample data for demo, structured for real data later)
export const AGRI_DEALERS = [
  { id: "d1", name: "Ramesh Pradhan", shopName: "Krishi Seva Kendra", phone: "+919437012345", address: "Main Road", district: "Cuttack", rating: 4.6, products: "Seeds, Fertilizers, Pesticides" },
  { id: "d2", name: "Sunita Behera", shopName: "Maa Tarini Agro", phone: "+919437056789", address: "Bazaar Street", district: "Bhubaneswar", rating: 4.4, products: "Organic inputs, Bio-fertilizers" },
  { id: "d3", name: "Ajay Kumar Sahoo", shopName: "Sahoo Pesticides", phone: "+919437090123", address: "Station Road", district: "Cuttack", rating: 4.7, products: "Pesticides, Fungicides, Sprayers" },
];

// Recommended product links (generic search links to Amazon/Flipkart)
export function productSearchLink(product: string): { amazon: string; flipkart: string } {
  const q = encodeURIComponent(product);
  return {
    amazon: `https://www.amazon.in/s?k=${q}`,
    flipkart: `https://www.flipkart.com/search?q=${q}`,
  };
}
