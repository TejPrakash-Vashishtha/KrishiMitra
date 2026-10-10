// ============================================================
// processingRecipes.ts — Feature A: "Process Your Produce"
//
// Maps raw crops (as stored in farmer_inventory) to value-added
// processed product ideas. Each idea carries:
//  - an emoji + short description
//  - a YouTube search query (Hindi-first) for how-to videos
//  - a price multiplier vs. the raw crop's mandi/farm-gate rate,
//    used as the offline fallback when the AI suggestion fails
//
// YouTube search links are used (instead of hardcoded video IDs)
// so they never go stale.
// ============================================================

export interface ProductIdea {
  name: string;
  emoji: string;
  description: string;
  /** YouTube search query for the how-to video (Hindi-first) */
  youtubeQuery: string;
  /** Typical retail price as a multiple of the raw crop price per kg */
  priceMultiplier: number;
}

interface RecipeBook {
  [cropKey: string]: ProductIdea[];
}

const RECIPES: RecipeBook = {
  potato: [
    { name: "Potato Chips", emoji: "🍟", description: "Thin-fried crispy wafers — sells 6–8× the raw rate", youtubeQuery: "potato chips making at home business hindi", priceMultiplier: 7 },
    { name: "French Fries", emoji: "🥔", description: "Frozen/fresh fries for local hotels & cafes", youtubeQuery: "french fries making business at home hindi", priceMultiplier: 5 },
    { name: "Aloo Papad", emoji: "🫓", description: "Sun-dried papad — long shelf life, festival demand", youtubeQuery: "aloo papad banana ka tarika hindi", priceMultiplier: 4 },
    { name: "Potato Starch", emoji: "🧪", description: "Industrial starch for food & textile units", youtubeQuery: "potato starch extraction at home", priceMultiplier: 3 },
  ],
  tomato: [
    { name: "Tomato Ketchup", emoji: "🥫", description: "Classic sauce — hotels, shops, tiffin centers buy in bulk", youtubeQuery: "tomato ketchup making at home hindi", priceMultiplier: 6 },
    { name: "Tomato Puree", emoji: "🧃", description: "Cooking puree — sells year-round, easy to pack", youtubeQuery: "tomato puree making for business hindi", priceMultiplier: 4 },
    { name: "Tomato Pickle", emoji: "🥒", description: "Spicy homemade pickle — high margin, festive gifting", youtubeQuery: "tamatar ka achar banana hindi", priceMultiplier: 5 },
    { name: "Sun-dried Tomato", emoji: "🌞", description: "Premium ingredient for pizzerias & bakeries", youtubeQuery: "sun dried tomato at home hindi", priceMultiplier: 8 },
  ],
  paddy: [
    { name: "Rice Flour", emoji: "🌾", description: "Milled flour for snacks, dosa, bakery", youtubeQuery: "rice flour mill business hindi", priceMultiplier: 2.5 },
    { name: "Puffed Rice", emoji: "🍿", description: "Murmura — roadside & packed snack demand", youtubeQuery: "puffed rice murmura making machine hindi", priceMultiplier: 4 },
    { name: "Flattened Rice", emoji: "🥣", description: "Poha — everyday breakfast staple, quick turnover", youtubeQuery: "poha chura making business hindi", priceMultiplier: 3.5 },
    { name: "Rice Bran Oil", emoji: "🛢️", description: "Healthy cooking oil from bran (co-op scale)", youtubeQuery: "rice bran oil extraction hindi", priceMultiplier: 6 },
  ],
  wheat: [
    { name: "Wheat Flour (Atta)", emoji: "🌾", description: "Stone-ground atta — steady daily demand", youtubeQuery: "atta chakki business at home hindi", priceMultiplier: 2 },
    { name: "Sooji / Rava", emoji: "🥣", description: "Semolina for upma & halwa", youtubeQuery: "sooji rava making from wheat hindi", priceMultiplier: 2.5 },
    { name: "Bakery Biscuits", emoji: "🍪", description: "Wheat biscuits — local shop consignment", youtubeQuery: "wheat biscuit making at home hindi", priceMultiplier: 5 },
  ],
  mango: [
    { name: "Mango Pickle", emoji: "🥒", description: "Aam ka achar — evergreen household staple", youtubeQuery: "aam ka achar banana hindi", priceMultiplier: 4 },
    { name: "Mango Pulp", emoji: "🥤", description: "Pulp for juice shops & ice cream makers", youtubeQuery: "mango pulp making for business hindi", priceMultiplier: 3.5 },
    { name: "Aam Papad", emoji: "🍬", description: "Dried mango bar — kids' favorite, long shelf life", youtubeQuery: "aam papad banana hindi", priceMultiplier: 6 },
    { name: "Mango Jam", emoji: "🍯", description: "Spread for bakery & general stores", youtubeQuery: "mango jam making at home hindi", priceMultiplier: 5 },
  ],
  onion: [
    { name: "Onion Powder", emoji: "🧂", description: "Dehydrated powder — masala companies buy it", youtubeQuery: "onion powder making at home hindi", priceMultiplier: 5 },
    { name: "Fried Onions (Birista)", emoji: "🧅", description: "Ready-fried birista for hotels & caterers", youtubeQuery: "birista fried onion business hindi", priceMultiplier: 4 },
    { name: "Onion Paste", emoji: "🥫", description: "Cooking paste — tiffin & restaurant supply", youtubeQuery: "onion paste making for business hindi", priceMultiplier: 3 },
  ],
  maize: [
    { name: "Corn Flour", emoji: "🌽", description: "Makki ka atta — winter demand across north India", youtubeQuery: "corn flour makki atta making hindi", priceMultiplier: 2.5 },
    { name: "Corn Flakes", emoji: "🥣", description: "Breakfast flakes — urban retail demand", youtubeQuery: "corn flakes making at home hindi", priceMultiplier: 6 },
    { name: "Popcorn Kernels", emoji: "🍿", description: "Sorted popping corn — cinema & home packs", youtubeQuery: "popcorn making business hindi", priceMultiplier: 4 },
  ],
  chilli: [
    { name: "Chilli Powder", emoji: "🌶️", description: "Ground masala — every kitchen buys it", youtubeQuery: "red chilli powder making business hindi", priceMultiplier: 2.5 },
    { name: "Red Chilli Pickle", emoji: "🥒", description: "Lal mirch ka achar — high-margin specialty", youtubeQuery: "lal mirch ka achar banana hindi", priceMultiplier: 4 },
    { name: "Chilli Flakes", emoji: "🍕", description: "Pizza/pasta flakes — urban shops & online", youtubeQuery: "chilli flakes making at home hindi", priceMultiplier: 4 },
  ],
  groundnut: [
    { name: "Groundnut Oil", emoji: "🛢️", description: "Cold-pressed oil — premium health market", youtubeQuery: "groundnut oil extraction at home hindi", priceMultiplier: 3.5 },
    { name: "Peanut Butter", emoji: "🥜", description: "Export-grade demand, sells at 8–10× raw rate", youtubeQuery: "peanut butter making at home hindi", priceMultiplier: 8 },
    { name: "Roasted Peanuts", emoji: "🥜", description: "Bhuna moongfali — roadside & packed snack", youtubeQuery: "roasted peanuts business hindi", priceMultiplier: 3 },
  ],
  sugarcane: [
    { name: "Jaggery (Gur)", emoji: "🟤", description: "Organic gur blocks — premium & export demand", youtubeQuery: "gur jaggery making at home hindi", priceMultiplier: 3 },
    { name: "Sugarcane Juice Powder", emoji: "🥤", description: "Instant juice mix for shops", youtubeQuery: "sugarcane juice powder making hindi", priceMultiplier: 5 },
    { name: "Molasses", emoji: "🍯", description: "Kakvi — bakery & alcohol industry input", youtubeQuery: "kakvi molasses making hindi", priceMultiplier: 2.5 },
  ],
  brinjal: [
    { name: "Brinjal Pickle", emoji: "🥒", description: "Baingan ka achar — regional specialty", youtubeQuery: "baingan ka achar banana hindi", priceMultiplier: 4 },
    { name: "Sun-dried Brinjal", emoji: "🌞", description: "Dried vadi — off-season sale at premium", youtubeQuery: "sukhi baingan making hindi", priceMultiplier: 3.5 },
  ],
  banana: [
    { name: "Banana Chips", emoji: "🍌", description: "Kerala-style chips — national snack demand", youtubeQuery: "banana chips making business hindi", priceMultiplier: 5 },
    { name: "Banana Powder", emoji: "🥤", description: "Baby food & shake powder — health segment", youtubeQuery: "banana powder making at home hindi", priceMultiplier: 6 },
  ],
  cauliflower: [
    { name: "Frozen Cauliflower", emoji: "🥦", description: "Blanched packs for urban retail", youtubeQuery: "frozen cauliflower packing business hindi", priceMultiplier: 3 },
    { name: "Gobi Pickle", emoji: "🥒", description: "Mixed pickle ingredient — bulk to achar brands", youtubeQuery: "gobi gajar shalgam achar hindi", priceMultiplier: 3.5 },
  ],
};

// Aliases for common Hindi/local names farmers use in inventory
const CROP_ALIASES: Record<string, string> = {
  aalu: "potato", "aloo": "potato", "batata": "potato",
  tamatar: "tomato",
  dhaan: "paddy", "chawal": "paddy",
  gehu: "wheat",
  aam: "mango",
  pyaz: "onion", "pyaaj": "onion",
  makka: "maize",
  mirch: "chilli", "lal mirch": "chilli",
  moongfali: "groundnut", "peanut": "groundnut",
  ganna: "sugarcane", "sugarcane juice": "sugarcane",
  baingan: "brinjal",
  kela: "banana",
  gobhi: "cauliflower", "phool gobhi": "cauliflower",
};

/** Normalize a crop name (handles "Potato ", "potato", "Aalu" etc.) */
export function normalizeCropKey(cropName: string): string {
  const raw = (cropName || "").trim().toLowerCase();
  return CROP_ALIASES[raw] || raw;
}

/** Get product ideas for a crop; generic fallback for unknown crops. */
export function getProductIdeas(cropName: string): ProductIdea[] {
  const key = normalizeCropKey(cropName);
  const known = RECIPES[key];
  if (known && known.length > 0) return known;
  const friendly = (cropName || "your crop").trim();
  return [
    { name: `${friendly} Pickle`, emoji: "🥒", description: "Homemade pickle — festival & daily demand", youtubeQuery: `${friendly} pickle making at home hindi`, priceMultiplier: 4 },
    { name: `${friendly} Powder`, emoji: "🧂", description: "Sun-dried powder for masala & food brands", youtubeQuery: `${friendly} powder making at home hindi`, priceMultiplier: 3.5 },
    { name: `${friendly} Papad/Vadi`, emoji: "🫓", description: "Dried snack — long shelf life, easy courier", youtubeQuery: `${friendly} papad making at home hindi`, priceMultiplier: 3 },
  ];
}

/** Fallback price range when the AI suggestion is unavailable. */
export function fallbackPriceRange(rawPricePerKg: number, multiplier: number): { min: number; max: number } {
  const safe = Math.max(rawPricePerKg, 8); // never suggest absurdly low floors
  return {
    min: Math.max(10, Math.round(safe * multiplier * 0.85)),
    max: Math.max(25, Math.round(safe * multiplier * 1.15)),
  };
}

/** YouTube search URL for a product idea (opens in new tab). */
export function youtubeSearchUrl(query: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}
