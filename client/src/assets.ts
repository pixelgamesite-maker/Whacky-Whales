// ── Supabase base URL ─────────────────────────────────────────────
const SUPABASE = 'https://aitxwwtybpgpqxsvlxzm.supabase.co/storage/v1/object/public/Images/Whacky';

// ── Brand assets ──────────────────────────────────────────────────
export const LOGO_URL      = `${SUPABASE}/Watermark-logo.png`;
export const NAME_URL      = `${SUPABASE}/Watermark-name.png`;

// ── Collection preview images (1–30) ─────────────────────────────
export const COLLECTION_IMAGES = Array.from(
  { length: 30 },
  (_, i) => `${SUPABASE}/Collection/${i + 1}.png`
);

// ── Social links ──────────────────────────────────────────────────
export const LINKS = {
  opensea:  'https://opensea.io/collection/whackywhales',
  twitter:  'https://x.com/whacky_whales',
  discord:  'https://discord.gg/whackywhales',
} as const;

// ── Contract ──────────────────────────────────────────────────────
export const CONTRACT_ADDRESS = '0x9c890D7e4d9beCb20f7b612D5Df3c4157a0837dC';
