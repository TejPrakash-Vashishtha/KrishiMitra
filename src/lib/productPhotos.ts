// ============================================================
// productPhotos.ts — real crop photos for marketplace cards.
// Static imports so Vite bundles/hashes them; every product name
// maps to a photo. Unknown names fall back to the emoji card.
// Photos: Wikimedia Commons (public domain / CC).
// ============================================================
import potato from "../assets/crops/potato.jpg";
import tomato from "../assets/crops/tomato.jpg";
import onion from "../assets/crops/onion.jpg";
import maize from "../assets/crops/maize.jpg";
import brinjal from "../assets/crops/brinjal.jpg";
import banana from "../assets/crops/banana.jpg";
import wheat from "../assets/crops/wheat.jpg";
import cauliflower from "../assets/crops/cauliflower.jpg";
import chilli from "../assets/crops/chilli.jpg";
import mango from "../assets/crops/mango.jpg";
import guava from "../assets/crops/guava.jpg";
import paddy from "../assets/crops/paddy.jpg";
import honey from "../assets/crops/honey.jpg";
import flour from "../assets/crops/flour.jpg";
import pickle from "../assets/crops/pickle.jpg";
import ghee from "../assets/crops/ghee.jpg";
import jaggery from "../assets/crops/jaggery.jpg";
import groundnut from "../assets/crops/groundnut.jpg";
import sugarcane from "../assets/crops/sugarcane.jpg";

export interface PhotoMeta {
  photo: string;
  emoji: string;
}

const PRODUCT_PHOTOS: Record<string, PhotoMeta> = {
  potato: { photo: potato, emoji: "🥔" },
  tomato: { photo: tomato, emoji: "🍅" },
  onion: { photo: onion, emoji: "🧅" },
  maize: { photo: maize, emoji: "🌽" },
  corn: { photo: maize, emoji: "🌽" },
  brinjal: { photo: brinjal, emoji: "🍆" },
  eggplant: { photo: brinjal, emoji: "🍆" },
  banana: { photo: banana, emoji: "🍌" },
  wheat: { photo: wheat, emoji: "🌾" },
  atta: { photo: wheat, emoji: "🌾" },
  cauliflower: { photo: cauliflower, emoji: "🥦" },
  chilli: { photo: chilli, emoji: "🌶️" },
  "red chilli": { photo: chilli, emoji: "🌶️" },
  mango: { photo: mango, emoji: "🥭" },
  guava: { photo: guava, emoji: "🍐" },
  paddy: { photo: paddy, emoji: "🌾" },
  rice: { photo: paddy, emoji: "🍚" },
  honey: { photo: honey, emoji: "🍯" },
  flour: { photo: flour, emoji: "🌾" },
  pickle: { photo: pickle, emoji: "🥒" },
  ghee: { photo: ghee, emoji: "🧈" },
  jaggery: { photo: jaggery, emoji: "🟤" },
  groundnut: { photo: groundnut, emoji: "🥜" },
  peanut: { photo: groundnut, emoji: "🥜" },
  sugarcane: { photo: sugarcane, emoji: "🎋" },
};

/** Look up a real photo for a product name (case-insensitive, trimmed). */
export function productPhoto(name: string): PhotoMeta | null {
  const key = (name || "").trim().toLowerCase();
  if (!key) return null;
  return PRODUCT_PHOTOS[key] || null;
}

/** Emoji for a product name — falls back to a generic produce emoji. */
export function productEmoji(name: string): string {
  const meta = productPhoto(name);
  return meta ? meta.emoji : "🥗";
}
