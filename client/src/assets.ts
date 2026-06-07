const SUPABASE = 'https://aitxwwtybpgpqxsvlxzm.supabase.co/storage/v1/object/public/Images/Whacky';
const SUPABASE_TRANSPARENT = 'https://psibadkdncspgikzzmnu.supabase.co/storage/v1/object/public/Whacky';

export const LOGO_URL = `${SUPABASE}/Watermark-logo.png`;
export const NAME_URL = `${SUPABASE}/Watermark-name.png`;

export const COLLECTION_IMAGES = Array.from(
  { length: 30 },
  (_, i) => `${SUPABASE}/Collection/${i + 1}.png`
);

export const LINKS = {
  opensea: 'https://opensea.io/collection/whackywhales',
  twitter: 'https://x.com/whacky_whales',
  discord: 'https://discord.gg/whackywhales',
} as const;

export const CONTRACT_ADDRESS = '0x9c890D7e4d9beCb20f7b612D5Df3c4157a0837dC';

export function getTransparentUrl(tokenId: string | number): string {
  const id = typeof tokenId === 'string' ? parseInt(tokenId, 16) : tokenId;
  return `${SUPABASE_TRANSPARENT}/nft_${id}.png`;
}
