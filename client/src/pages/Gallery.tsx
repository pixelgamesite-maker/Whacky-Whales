import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { LOGO_URL, NAME_URL } from '../assets';

// ── Config ──────────────────────────────────────────────────────────
const ALCHEMY_API_KEY = import.meta.env.VITE_ALCHEMY_API_KEY as string;
const CONTRACT_ADDRESS = import.meta.env.VITE_NFT_CONTRACT_ADDRESS as string;
const ALCHEMY_BASE = `https://eth-mainnet.g.alchemy.com/nft/v3/${ALCHEMY_API_KEY}`;
const SUPABASE_TRANSPARENT = 'https://psibadkdncspgikzzmnu.supabase.co/storage/v1/object/public/Whacky';

// 35 whales for the inline preview board on the gallery page
const GALLERY_PREVIEW_IDS = [
  231, 317, 866, 1742, 2048, 3399, 4700, 5010, 6123, 7456,
  8001, 8899, 9101, 150, 600, 1100, 2200, 3300, 4400, 5500,
  6600, 7700, 8800, 9900, 450, 1450, 2450, 3450, 4450, 5450,
  6450, 7450, 8450, 9450, 750,
];
const GALLERY_PREVIEW_WHALES = GALLERY_PREVIEW_IDS.map(
  id => `${SUPABASE_TRANSPARENT}/nft_${id}.png`
);

const CANVAS_PRESETS = {
  'X Post':   { w: 1600, h: 900  },
  'X Banner': { w: 1500, h: 500  },
  'Square':   { w: 1400, h: 1400 },
};

const WM_POSITIONS = ['Right Strip', 'Bottom Strip', 'Corner', 'Center'] as const;
type WMPosition = typeof WM_POSITIONS[number];
type WMContent = 'logo-only' | 'name-only' | 'both';

// ── Helpers ───────────────────────────────────────────────────────
function getTransparentUrl(tokenId: string | number): string {
  const id = typeof tokenId === 'string'
    ? (tokenId.startsWith('0x') ? parseInt(tokenId, 16) : parseInt(tokenId, 10))
    : tokenId;
  return `${SUPABASE_TRANSPARENT}/nft_${id}.png`;
}

function resolveImage(nft: any): string {
  const tokenId = nft.tokenId || nft.id?.tokenId;
  if (tokenId) return getTransparentUrl(tokenId);
  const raw = nft.image?.cachedUrl || nft.image?.originalUrl || '';
  return raw.startsWith('ipfs://') ? 'https://ipfs.io/ipfs/' + raw.slice(7) : raw;
}

function resolveName(nft: any): string {
  return nft.name || nft.title || `Whale #${nft.tokenId}`;
}

async function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => res(img);
    img.onerror = () => rej(new Error('Failed: ' + src));
    img.src = src;
  });
}

// ── Canvas Rendering ──────────────────────────────────────────────
async function renderCanvas(
  canvas: HTMLCanvasElement,
  nfts: any[],
  preset: keyof typeof CANVAS_PRESETS,
  wmPos: WMPosition,
  wmContent: WMContent,
) {
  const { w, h } = CANVAS_PRESETS[preset];
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(dpr, dpr);

  // Deep ocean background
  const bg = ctx.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, '#a8c8e0');
  bg.addColorStop(0.5, '#8fb8d4');
  bg.addColorStop(1, '#b0cce4');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Load images
  const urls = nfts.map(resolveImage).filter(Boolean);
  const images: HTMLImageElement[] = [];
  for (const url of urls) {
    try { images.push(await loadImg(url)); } catch { /* skip broken */ }
  }
  if (!images.length) return;

  const count = images.length;
  const pad = 28;

  // Strip size
  const STRIP = Math.max(Math.round(Math.min(w, h) * 0.13), 120);

  // Image area (minus watermark strip)
  let imgArea = { x: 0, y: 0, w, h };
  if (wmPos === 'Right Strip')  imgArea = { x: 0, y: 0, w: w - STRIP, h };
  if (wmPos === 'Bottom Strip') imgArea = { x: 0, y: 0, w, h: h - STRIP };

  // Grid layout
  const aspect = imgArea.w / imgArea.h;
  let cols = Math.ceil(Math.sqrt(count * aspect));
  let rows = Math.ceil(count / cols);

  while (rows > 1 && (rows - 1) * cols >= count) {
    rows--;
    cols = Math.ceil(count / rows);
  }

  const cellW = (imgArea.w - pad * (cols + 1)) / cols;
  const cellH = (imgArea.h - pad * (rows + 1)) / rows;

  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    const col = i % cols;
    const row = Math.floor(i / cols);
    const cx = imgArea.x + pad + col * (cellW + pad) + cellW / 2;
    const cy = imgArea.y + pad + row * (cellH + pad) + cellH / 2;

    const scale = Math.min((cellW - 20) / img.width, (cellH - 20) / img.height);
    const dw = img.width * scale;
    const dh = img.height * scale;

    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.25)';
    ctx.shadowBlur = 16;
    ctx.shadowOffsetY = 6;
    ctx.drawImage(img, cx - dw / 2, cy - dh / 2, dw, dh);
    ctx.restore();
  }

  // ── Watermark ─────────────────────────────────────────────────
  let logo: HTMLImageElement | null = null;
  let nameImg: HTMLImageElement | null = null;
  if (wmContent !== 'name-only') { try { logo = await loadImg(LOGO_URL); } catch {} }
  if (wmContent !== 'logo-only') { try { nameImg = await loadImg(NAME_URL); } catch {} }

  ctx.save();

  if (wmPos === 'Right Strip') {
    const grad = ctx.createLinearGradient(w - STRIP, 0, w, 0);
    grad.addColorStop(0, 'rgba(8,16,32,0.92)');
    grad.addColorStop(1, 'rgba(8,16,32,0.98)');
    ctx.fillStyle = grad;
    ctx.fillRect(w - STRIP, 0, STRIP, h);

    ctx.strokeStyle = 'rgba(91,184,255,0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(w - STRIP, 0);
    ctx.lineTo(w - STRIP, h);
    ctx.stroke();

    const lSize = STRIP * 0.48;
    const cx = w - STRIP / 2;

    if (logo && nameImg) {
      ctx.drawImage(logo, cx - lSize / 2, h / 2 - lSize - 18, lSize, lSize);
      const nw = STRIP * 0.72;
      const nh = nw * (nameImg.height / nameImg.width);
      ctx.drawImage(nameImg, cx - nw / 2, h / 2 + 10, nw, nh);
    } else if (logo) {
      ctx.drawImage(logo, cx - lSize / 2, h / 2 - lSize / 2, lSize, lSize);
    } else if (nameImg) {
      const nw = STRIP * 0.72;
      const nh = nw * (nameImg.height / nameImg.width);
      ctx.drawImage(nameImg, cx - nw / 2, h / 2 - nh / 2, nw, nh);
    }

  } else if (wmPos === 'Bottom Strip') {
    const grad = ctx.createLinearGradient(0, h - STRIP, 0, h);
    grad.addColorStop(0, 'rgba(8,16,32,0.92)');
    grad.addColorStop(1, 'rgba(8,16,32,0.98)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, h - STRIP, w, STRIP);

    ctx.strokeStyle = 'rgba(91,184,255,0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, h - STRIP);
    ctx.lineTo(w, h - STRIP);
    ctx.stroke();

    const lSize = STRIP * 0.58;
    const cy = h - STRIP / 2;

    if (logo && nameImg) {
      ctx.drawImage(logo, w / 2 - lSize - 14, cy - lSize / 2, lSize, lSize);
      const nw = lSize * 2.1;
      const nh = nw * (nameImg.height / nameImg.width);
      ctx.drawImage(nameImg, w / 2 + 14, cy - nh / 2, nw, nh);
    } else if (logo) {
      ctx.drawImage(logo, w / 2 - lSize / 2, cy - lSize / 2, lSize, lSize);
    } else if (nameImg) {
      const nw = STRIP * 1.5;
      const nh = nw * (nameImg.height / nameImg.width);
      ctx.drawImage(nameImg, w / 2 - nw / 2, cy - nh / 2, nw, nh);
    }

  } else if (wmPos === 'Corner') {
    const pad = 28;
    const lSize = Math.round(Math.min(w, h) * 0.085);
    const boxPad = 14;

    if (logo && nameImg) {
      const nw = lSize * 1.9;
      const nh = nw * (nameImg.height / nameImg.width);
      const boxW = lSize + nw + boxPad * 3;
      const boxH = Math.max(lSize, nh) + boxPad * 2;

      ctx.fillStyle = 'rgba(8,16,32,0.88)';
      ctx.beginPath();
      ctx.roundRect(w - boxW - pad, h - boxH - pad, boxW, boxH, 12);
      ctx.fill();

      ctx.drawImage(logo, w - boxW - pad + boxPad, h - boxH - pad + (boxH - lSize) / 2, lSize, lSize);
      ctx.drawImage(nameImg, w - boxW - pad + boxPad + lSize + boxPad, h - boxH - pad + (boxH - nh) / 2, nw, nh);
    } else if (logo) {
      const box = lSize + boxPad * 2;
      ctx.fillStyle = 'rgba(8,16,32,0.88)';
      ctx.beginPath();
      ctx.roundRect(w - box - pad, h - box - pad, box, box, 12);
      ctx.fill();
      ctx.drawImage(logo, w - box - pad + boxPad, h - box - pad + boxPad, lSize, lSize);
    } else if (nameImg) {
      const nw = Math.round(Math.min(w, h) * 0.18);
      const nh = nw * (nameImg.height / nameImg.width);
      const boxW = nw + boxPad * 2;
      const boxH = nh + boxPad * 2;
      ctx.fillStyle = 'rgba(8,16,32,0.88)';
      ctx.beginPath();
      ctx.roundRect(w - boxW - pad, h - boxH - pad, boxW, boxH, 12);
      ctx.fill();
      ctx.drawImage(nameImg, w - boxW - pad + boxPad, h - boxH - pad + boxPad, nw, nh);
    }

  } else { // Center — glass pill watermark
    const lSize = Math.round(Math.min(w, h) * 0.13);

    let contentW = lSize;
    let contentH = lSize;
    if (logo && nameImg) {
      const nw = lSize * 1.9;
      const nh = nw * (nameImg.height / nameImg.width);
      contentW = lSize + nw + 24;
      contentH = Math.max(lSize, nh);
    } else if (nameImg) {
      contentW = lSize * 2.6;
      contentH = contentW * (nameImg.height / nameImg.width);
    }

    const boxPad = 28;
    const boxW = contentW + boxPad * 2;
    const boxH = contentH + boxPad * 2;
    const bx = w / 2 - boxW / 2;
    const by = h / 2 - boxH / 2;
    const radius = 24;

    // Glass background
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(bx, by, boxW, boxH, radius);
    ctx.clip();

    ctx.fillStyle = 'rgba(10, 22, 48, 0.52)';
    ctx.fillRect(bx, by, boxW, boxH);

    const sheen = ctx.createLinearGradient(bx, by, bx, by + boxH * 0.5);
    sheen.addColorStop(0, 'rgba(255,255,255,0.13)');
    sheen.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = sheen;
    ctx.fillRect(bx, by, boxW, boxH);

    ctx.restore();

    // Glass border + glow
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(bx, by, boxW, boxH, radius);
    ctx.strokeStyle = 'rgba(91,184,255,0.35)';
    ctx.lineWidth = 1.5;
    ctx.shadowColor = 'rgba(91,184,255,0.25)';
    ctx.shadowBlur = 32;
    ctx.stroke();
    ctx.restore();

    // Content
    ctx.save();
    ctx.globalAlpha = 0.82;
    if (logo && nameImg) {
      const nw = lSize * 1.9;
      const nh = nw * (nameImg.height / nameImg.width);
      ctx.drawImage(logo, w / 2 - (lSize + nw + 24) / 2, h / 2 - lSize / 2, lSize, lSize);
      ctx.drawImage(nameImg, w / 2 - (lSize + nw + 24) / 2 + lSize + 24, h / 2 - nh / 2, nw, nh);
    } else if (logo) {
      ctx.drawImage(logo, w / 2 - lSize / 2, h / 2 - lSize / 2, lSize, lSize);
    } else if (nameImg) {
      const nw = lSize * 2.6;
      const nh = nw * (nameImg.height / nameImg.width);
      ctx.drawImage(nameImg, w / 2 - nw / 2, h / 2 - nh / 2, nw, nh);
    }
    ctx.restore();
  }

  ctx.restore();
}

// ── UI Components ─────────────────────────────────────────────────

function OptBtn({ label, sub, active, onClick }: { label: string; sub?: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      padding: '14px 12px',
      borderRadius: 14,
      border: active ? '2px solid #5bb8ff' : '1.5px solid rgba(91,184,255,0.15)',
      background: active ? 'rgba(91,184,255,0.12)' : 'rgba(255,255,255,0.03)',
      cursor: 'pointer',
      textAlign: 'center',
      transition: 'all 0.25s cubic-bezier(0.34,1.56,0.64,1)',
      boxShadow: active ? '0 0 24px rgba(91,184,255,0.15)' : 'none',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      minHeight: 64,
    }}>
      <span style={{ display: 'block', fontFamily: "'Fredoka One', cursive", fontSize: '0.85rem', color: active ? '#5bb8ff' : 'rgba(180,220,255,0.7)', letterSpacing: '0.02em' }}>{label}</span>
      {sub && <span style={{ display: 'block', fontFamily: "'Nunito', sans-serif", fontSize: '0.65rem', color: active ? 'rgba(91,184,255,0.7)' : 'rgba(180,220,255,0.3)', fontWeight: 600 }}>{sub}</span>}
    </button>
  );
}

function CanvasPreview({ nfts, preset, wmPos, wmContent }: {
  nfts: any[]; preset: keyof typeof CANVAS_PRESETS; wmPos: WMPosition; wmContent: WMContent;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rendering, setRendering] = useState(false);

  useEffect(() => {
    if (!nfts.length || !canvasRef.current) return;
    setRendering(true);
    renderCanvas(canvasRef.current, nfts, preset, wmPos, wmContent).finally(() => setRendering(false));
  }, [nfts, preset, wmPos, wmContent]);

  const { w, h } = CANVAS_PRESETS[preset];

  return (
    <div style={{
      position: 'relative',
      borderRadius: 20,
      overflow: 'hidden',
      border: '3px solid #1a1a1a',
      boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(91,184,255,0.05)',
      background: '#0a0a0a',
    }}>
      <canvas ref={canvasRef} style={{ width: '100%', display: 'block', aspectRatio: `${w}/${h}` }} />
      {rendering && (
        <div style={{
          position: 'absolute', inset: 0, background: 'rgba(10,22,40,0.85)',
          backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12,
        }}>
          <div style={{ width: 40, height: 40, border: '3px solid rgba(91,184,255,0.2)', borderTopColor: '#5bb8ff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <p style={{ fontFamily: "'Fredoka One', cursive", color: '#5bb8ff', fontSize: '0.85rem', letterSpacing: '0.08em' }}>Rendering preview…</p>
        </div>
      )}
      {!nfts.length && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
          <img src={LOGO_URL} alt="" style={{ height: 48, opacity: 0.15 }} />
          <p style={{ fontFamily: "'Nunito', sans-serif", color: 'rgba(180,220,255,0.25)', fontSize: '0.9rem' }}>Load your whales to see preview</p>
        </div>
      )}
    </div>
  );
}

// ── Inline Preview Board ──────────────────────────────────────────
function GalleryPreviewBoard() {
  const COLS = 7;
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.55 }}
      style={{ marginBottom: 36 }}
    >
      <div style={{
        borderRadius: 22,
        border: '2px solid rgba(91,184,255,0.18)',
        overflow: 'hidden',
        boxShadow: '0 0 0 1px rgba(91,184,255,0.07), 0 20px 56px rgba(0,10,30,0.45)',
        background: 'linear-gradient(160deg, #a8c8e0 0%, #8fb8d4 45%, #b0cce4 100%)',
      }}>
        {/* NFT grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${COLS}, 1fr)`,
          gap: 6,
          padding: 10,
        }}>
          {GALLERY_PREVIEW_WHALES.map((src, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.82 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.018, duration: 0.28 }}
              whileHover={{ scale: 1.1, zIndex: 10, filter: 'drop-shadow(0 4px 10px rgba(10,50,100,0.3))' }}
              style={{
                borderRadius: 9,
                overflow: 'hidden',
                aspectRatio: '1',
                background: 'rgba(255,255,255,0.22)',
                position: 'relative',
                cursor: 'pointer',
              }}
            >
              <img
                src={src}
                alt={`Whale #${GALLERY_PREVIEW_IDS[i]}`}
                loading="lazy"
                style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
              />
            </motion.div>
          ))}
        </div>

        {/* Footer bar */}
        <div style={{
          padding: '10px 18px',
          borderTop: '1px solid rgba(10,50,100,0.1)',
          background: 'rgba(10,40,80,0.1)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <p style={{
            fontFamily: "'Nunito', sans-serif",
            fontSize: '0.66rem',
            color: 'rgba(10,40,80,0.55)',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            fontWeight: 700,
          }}>
            whackywhales · @whackywhales
          </p>
          <div style={{ display: 'flex', gap: 4 }}>
            {[0,1,2].map(d => (
              <div key={d} style={{ width: 5, height: 5, borderRadius: '50%', background: d === 0 ? '#2a6fa8' : 'rgba(10,60,120,0.22)' }} />
            ))}
          </div>
        </div>
      </div>

      <p style={{
        fontFamily: "'Nunito', sans-serif",
        fontSize: '0.76rem',
        color: 'rgba(180,220,255,0.35)',
        textAlign: 'center',
        marginTop: 10,
        letterSpacing: '0.04em',
      }}>
        Load your wallet below to build your own grid
      </p>
    </motion.div>
  );
}

// ── Main Gallery ──────────────────────────────────────────────────
export default function Gallery() {
  const [address, setAddress] = useState('');
  const [allNfts, setAllNfts] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [statusMsg, setStatusMsg] = useState('');
  const [canvasPreset, setCanvasPreset] = useState<keyof typeof CANVAS_PRESETS>('X Post');
  const [wmPos, setWmPos] = useState<WMPosition>('Right Strip');
  const [wmContent, setWmContent] = useState<WMContent>('both');
  const [displayCount, setDisplayCount] = useState<number | 'all'>('all');
  const [generating, setGenerating] = useState(false);
  const dlCanvasRef = useRef<HTMLCanvasElement>(null);

  // Derived: which NFTs actually render
  const activeNfts = useMemo(() => {
    let list = allNfts.filter(n => selectedIds.has(n.tokenId || n.id?.tokenId));
    if (!list.length && allNfts.length) list = allNfts;
    if (displayCount !== 'all' && list.length > displayCount) return list.slice(0, displayCount);
    return list;
  }, [allNfts, selectedIds, displayCount]);

  const detect = useCallback(async () => {
    const addr = address.trim();
    if (!addr) return;
    setAllNfts([]); setSelectedIds(new Set()); setStatus('loading'); setStatusMsg('detecting your whales…');
    try {
      let pageKey: string | null = null;
      let all: any[] = [];
      do {
        const params = new URLSearchParams({ owner: addr, withMetadata: 'true', pageSize: '100' });
        params.append('contractAddresses[]', CONTRACT_ADDRESS);
        if (pageKey) params.set('pageKey', pageKey);
        const res = await fetch(`${ALCHEMY_BASE}/getNFTsForOwner?${params}`);
        if (!res.ok) throw new Error(`Alchemy error ${res.status}`);
        const data = await res.json();
        all = [...all, ...data.ownedNfts];
        pageKey = data.pageKey || null;
        setStatusMsg(`loading ${all.length} whales…`);
      } while (pageKey);

      if (!all.length) { setStatus('error'); setStatusMsg('No Whacky Whales found for this address.'); return; }

      setAllNfts(all);
      setSelectedIds(new Set(all.map(n => n.tokenId || n.id?.tokenId)));
      setStatus('done');
      setStatusMsg(`${all.length} whale${all.length > 1 ? 's' : ''} loaded!`);
    } catch (e: any) { setStatus('error'); setStatusMsg('Error: ' + e.message); }
  }, [address]);

  const toggleNft = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(allNfts.map(n => n.tokenId || n.id?.tokenId)));
  }, [allNfts]);

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const downloadGrid = useCallback(async () => {
    if (!activeNfts.length) return;
    setGenerating(true);
    try {
      const canvas = dlCanvasRef.current!;
      await renderCanvas(canvas, activeNfts, canvasPreset, wmPos, wmContent);
      canvas.toBlob(blob => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `whacky-whales-grid-${canvasPreset.toLowerCase().replace(/\s+/g, '-')}.png`;
        link.click();
        URL.revokeObjectURL(url);
      }, 'image/png');
    } finally { setGenerating(false); }
  }, [activeNfts, canvasPreset, wmPos, wmContent]);

  const countOptions = useMemo(() => {
    const opts: (number | 'all')[] = ['all'];
    const total = allNfts.length;
    if (total >= 5) opts.push(5);
    if (total >= 10) opts.push(10);
    if (total >= 15) opts.push(15);
    if (total >= 20) opts.push(20);
    if (total > 20 && !opts.includes(total)) opts.push(total);
    return opts;
  }, [allNfts.length]);

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #0a1628 0%, #0d2137 50%, #081020 100%)', position: 'relative', color: '#fff' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fredoka+One&family=Nunito:wght@400;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input:focus { outline: none; border-color: #5bb8ff !important; box-shadow: 0 0 0 3px rgba(91,184,255,0.15) !important; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .nft-scroll::-webkit-scrollbar { height: 6px; }
        .nft-scroll::-webkit-scrollbar-track { background: rgba(255,255,255,0.03); border-radius: 4px; }
        .nft-scroll::-webkit-scrollbar-thumb { background: rgba(91,184,255,0.3); border-radius: 4px; }
      `}</style>

      <canvas ref={dlCanvasRef} style={{ display: 'none' }} />
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #5bb8ff, #2a8fd4, #5bb8ff)', zIndex: 100 }} />
      <Navbar />

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '100px 20px 120px', position: 'relative', zIndex: 2 }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} style={{ textAlign: 'center', marginBottom: 36 }}>
          <img src={LOGO_URL} alt="" style={{ height: 52, objectFit: 'contain', marginBottom: 16, filter: 'drop-shadow(0 4px 12px rgba(91,184,255,0.3))' }} />
          <h1 style={{ fontFamily: "'Fredoka One', cursive", fontSize: 'clamp(1.8rem, 5vw, 2.6rem)', color: '#fff', marginBottom: 10, textShadow: '0 2px 20px rgba(91,184,255,0.2)' }}>
            Your Whale Gallery
          </h1>
          <p style={{ fontFamily: "'Nunito', sans-serif", color: 'rgba(180,220,255,0.55)', fontSize: '0.95rem', maxWidth: 420, margin: '0 auto', lineHeight: 1.6 }}>
            Paste your wallet, pick your whales, and export a clean grid ready to post.
          </p>
          <p style={{ fontFamily: "'Nunito', sans-serif", color: 'rgba(91,184,255,0.4)', fontSize: '0.78rem', marginTop: 8, letterSpacing: '0.04em' }}>
            ↓ no wallet connection, just your address. ↓
          </p>
        </motion.div>

        {/* Inline preview board — shown when no whales loaded yet */}
        {!allNfts.length && <GalleryPreviewBoard />}

        {/* Main Canvas Preview */}
        {allNfts.length > 0 && (
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2, duration: 0.5 }} style={{ marginBottom: 32 }}>
            <CanvasPreview nfts={activeNfts} preset={canvasPreset} wmPos={wmPos} wmContent={wmContent} />
          </motion.div>
        )}

        {/* Load Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.5 }}
          style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(20px)', borderRadius: 20, padding: '24px 20px', marginBottom: 20, border: '1.5px solid rgba(91,184,255,0.12)' }}
        >
          <label style={{ display: 'block', fontFamily: "'Fredoka One', cursive", fontSize: '0.7rem', letterSpacing: '0.25em', color: '#5bb8ff', textTransform: 'uppercase', marginBottom: 14 }}>
            Load Your Whales
          </label>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <input
              value={address} onChange={e => setAddress(e.target.value)} onKeyDown={e => e.key === 'Enter' && detect()}
              placeholder="0x... or yourname.eth"
              style={{ flex: 1, minWidth: 200, background: 'rgba(255,255,255,0.05)', border: '1.5px solid rgba(91,184,255,0.2)', borderRadius: 14, padding: '14px 18px', fontFamily: "'Nunito', sans-serif", fontSize: '0.92rem', color: '#fff', transition: 'all 0.2s' }}
            />
            <button
              onClick={detect} disabled={status === 'loading'}
              style={{
                background: status === 'loading' ? 'rgba(91,184,255,0.12)' : 'linear-gradient(135deg, #5bb8ff, #2a8fd4)',
                color: status === 'loading' ? '#5bb8ff' : '#0a1628', border: 'none', borderRadius: 14, padding: '14px 28px',
                fontFamily: "'Fredoka One', cursive", fontSize: '0.9rem', cursor: status === 'loading' ? 'not-allowed' : 'pointer',
                whiteSpace: 'nowrap', fontWeight: 700, transition: 'all 0.2s', boxShadow: status === 'loading' ? 'none' : '0 4px 20px rgba(91,184,255,0.3)',
              }}
            >
              {status === 'loading' ? statusMsg : 'Detect My Whales'}
            </button>
          </div>
          <AnimatePresence>
            {status === 'done' && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: '#4ecb71', fontSize: '1rem' }}>✓</span>
                <p style={{ fontFamily: "'Nunito', sans-serif", color: '#4ecb71', fontSize: '0.85rem', fontWeight: 700 }}>{statusMsg}</p>
              </motion.div>
            )}
            {status === 'error' && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: '#ff6b6b', fontSize: '1rem' }}>✕</span>
                <p style={{ fontFamily: "'Nunito', sans-serif", color: '#ff6b6b', fontSize: '0.85rem', fontWeight: 700 }}>{statusMsg}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* NFT Selector */}
        <AnimatePresence>
          {allNfts.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
              style={{ marginBottom: 24 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, padding: '0 4px' }}>
                <label style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.7rem', letterSpacing: '0.25em', color: '#5bb8ff', textTransform: 'uppercase' }}>
                  Your Pod — {selectedIds.size} selected
                </label>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={selectAll} style={{ background: 'transparent', border: '1px solid rgba(91,184,255,0.2)', borderRadius: 8, padding: '6px 12px', color: '#5bb8ff', fontFamily: "'Nunito', sans-serif", fontSize: '0.75rem', cursor: 'pointer', fontWeight: 700 }}>
                    Select All
                  </button>
                  <button onClick={deselectAll} style={{ background: 'transparent', border: '1px solid rgba(255,107,107,0.2)', borderRadius: 8, padding: '6px 12px', color: '#ff6b6b', fontFamily: "'Nunito', sans-serif", fontSize: '0.75rem', cursor: 'pointer', fontWeight: 700 }}>
                    Deselect All
                  </button>
                </div>
              </div>

              {/* Pod grid — light blue board like preview board */}
              <div style={{
                background: 'linear-gradient(160deg, #a8c8e0 0%, #8fb8d4 45%, #b0cce4 100%)',
                borderRadius: 18,
                border: '2px solid rgba(91,184,255,0.25)',
                boxShadow: '0 0 0 1px rgba(91,184,255,0.07), 0 12px 40px rgba(0,10,30,0.3)',
                padding: 12,
                marginBottom: 4,
              }}>
                <div className="nft-scroll" style={{ display: 'flex', gap: 10, overflowX: 'auto', padding: '4px 4px 8px', scrollSnapType: 'x mandatory' }}>
                {allNfts.map((nft, i) => {
                  const id = nft.tokenId || nft.id?.tokenId;
                  const isSelected = selectedIds.has(id);
                  const src = resolveImage(nft);
                  return (
                    <button
                      key={id || i}
                      onClick={() => toggleNft(id)}
                      style={{
                        flex: '0 0 auto',
                        scrollSnapAlign: 'start',
                        width: 84,
                        borderRadius: 14,
                        border: isSelected ? '2.5px solid #2a6fa8' : '2px solid rgba(255,255,255,0.5)',
                        background: isSelected
                          ? 'rgba(42,111,168,0.25)'
                          : 'rgba(255,255,255,0.55)',
                        padding: 6,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        position: 'relative',
                      }}
                    >
                      <div style={{
                        width: '100%',
                        aspectRatio: '1',
                        borderRadius: 10,
                        overflow: 'hidden',
                        background: 'rgba(255,255,255,0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: 1,
                      }}>
                        <img
                          src={src}
                          alt=""
                          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                          loading="lazy"
                        />
                      </div>
                      <p style={{
                        fontFamily: "'Nunito', sans-serif",
                        fontSize: '0.65rem',
                        color: isSelected ? '#0d4a7a' : 'rgba(10,50,100,0.6)',
                        textAlign: 'center',
                        marginTop: 6,
                        fontWeight: isSelected ? 700 : 500,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}>
                        #{id}
                      </p>
                      {isSelected && (
                        <div style={{
                          position: 'absolute', top: 4, right: 4,
                          width: 18, height: 18, borderRadius: '50%',
                          background: '#2a6fa8', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                        </div>
                      )}
                    </button>
                  );
                })}
                </div>
                {/* Board footer */}
                <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(10,50,100,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: '0.62rem', color: 'rgba(10,40,80,0.5)', letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 700 }}>
                    whackywhales · @whackywhales
                  </p>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {[0,1,2].map(d => (
                      <div key={d} style={{ width: 5, height: 5, borderRadius: '50%', background: d === 0 ? '#2a6fa8' : 'rgba(10,60,120,0.22)' }} />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Count Selector */}
        <AnimatePresence>
          {allNfts.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 20, padding: '22px 20px', marginBottom: 20, border: '1.5px solid rgba(91,184,255,0.1)' }}
            >
              <label style={{ display: 'block', fontFamily: "'Fredoka One', cursive", fontSize: '0.7rem', letterSpacing: '0.25em', color: '#5bb8ff', textTransform: 'uppercase', marginBottom: 14 }}>
                Whales on Grid
              </label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {countOptions.map(opt => (
                  <button
                    key={opt}
                    onClick={() => setDisplayCount(opt)}
                    style={{
                      padding: '10px 18px',
                      borderRadius: 10,
                      border: displayCount === opt ? '2px solid #5bb8ff' : '1.5px solid rgba(91,184,255,0.15)',
                      background: displayCount === opt ? 'rgba(91,184,255,0.12)' : 'rgba(255,255,255,0.03)',
                      color: displayCount === opt ? '#5bb8ff' : 'rgba(180,220,255,0.6)',
                      fontFamily: "'Fredoka One', cursive",
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      minWidth: 56,
                    }}
                  >
                    {opt === 'all' ? 'All' : opt}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Controls */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.5 }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Canvas Size */}
          <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 20, padding: '22px 20px', border: '1.5px solid rgba(91,184,255,0.1)' }}>
            <label style={{ display: 'block', fontFamily: "'Fredoka One', cursive", fontSize: '0.7rem', letterSpacing: '0.25em', color: '#5bb8ff', textTransform: 'uppercase', marginBottom: 14 }}>
              Canvas Size
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {Object.entries(CANVAS_PRESETS).map(([name, { w, h }]) => (
                <OptBtn key={name} label={name} sub={`${w}×${h}`} active={canvasPreset === name} onClick={() => setCanvasPreset(name as keyof typeof CANVAS_PRESETS)} />
              ))}
            </div>
          </div>

          {/* Watermark Position */}
          <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 20, padding: '22px 20px', border: '1.5px solid rgba(91,184,255,0.1)' }}>
            <label style={{ display: 'block', fontFamily: "'Fredoka One', cursive", fontSize: '0.7rem', letterSpacing: '0.25em', color: '#5bb8ff', textTransform: 'uppercase', marginBottom: 14 }}>
              Watermark Position
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {WM_POSITIONS.map(pos => (
                <OptBtn key={pos} label={pos} sub={pos === 'Right Strip' ? 'vertical bar' : pos === 'Bottom Strip' ? 'horizontal bar' : pos === 'Corner' ? 'subtle mark' : 'glass overlay'} active={wmPos === pos} onClick={() => setWmPos(pos)} />
              ))}
            </div>
          </div>

          {/* Watermark Style */}
          <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 20, padding: '22px 20px', border: '1.5px solid rgba(91,184,255,0.1)' }}>
            <label style={{ display: 'block', fontFamily: "'Fredoka One', cursive", fontSize: '0.7rem', letterSpacing: '0.25em', color: '#5bb8ff', textTransform: 'uppercase', marginBottom: 14 }}>
              Watermark Style
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {([
                { value: 'both', label: 'Logo + Name', preview: <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><img src={LOGO_URL} style={{ height: 18 }} /><img src={NAME_URL} style={{ height: 12 }} /></span> },
                { value: 'logo-only', label: 'Logo Only', preview: <img src={LOGO_URL} style={{ height: 18 }} /> },
                { value: 'name-only', label: 'Name Only', preview: <img src={NAME_URL} style={{ height: 12 }} /> },
              ] as const).map(opt => (
                <button key={opt.value} onClick={() => setWmContent(opt.value)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: 12, border: wmContent === opt.value ? '2px solid #5bb8ff' : '1.5px solid rgba(91,184,255,0.12)', background: wmContent === opt.value ? 'rgba(91,184,255,0.1)' : 'transparent', cursor: 'pointer', transition: 'all 0.2s' }}>
                  <span style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.82rem', color: wmContent === opt.value ? '#5bb8ff' : 'rgba(180,220,255,0.55)' }}>{opt.label}</span>
                  <div style={{ opacity: wmContent === opt.value ? 1 : 0.5 }}>{opt.preview}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
            <button
              onClick={downloadGrid} disabled={!activeNfts.length || generating}
              style={{
                background: activeNfts.length && !generating ? 'linear-gradient(135deg, #5bb8ff, #2a8fd4)' : 'rgba(91,184,255,0.08)',
                color: activeNfts.length && !generating ? '#0a1628' : 'rgba(91,184,255,0.3)',
                border: 'none', borderRadius: 16, padding: '18px',
                fontFamily: "'Fredoka One', cursive", fontSize: '1.05rem',
                cursor: activeNfts.length && !generating ? 'pointer' : 'not-allowed',
                fontWeight: 700, transition: 'all 0.2s',
                boxShadow: activeNfts.length && !generating ? '0 6px 28px rgba(91,184,255,0.35)' : 'none',
                letterSpacing: '0.02em',
              }}
            >
              {generating ? 'Generating…' : 'Download PNG'}
            </button>
            <button
              onClick={() => { setAllNfts([]); setSelectedIds(new Set()); setAddress(''); setStatus('idle'); setStatusMsg(''); setDisplayCount('all'); }}
              style={{
                background: 'transparent', color: 'rgba(180,220,255,0.3)',
                border: '1.5px solid rgba(91,184,255,0.1)', borderRadius: 16, padding: '14px',
                fontFamily: "'Nunito', sans-serif", fontSize: '0.85rem', cursor: 'pointer',
                transition: 'all 0.2s', fontWeight: 600,
              }}
            >
              clear all
            </button>
          </div>
        </motion.div>

        <p style={{ textAlign: 'center', marginTop: 40, fontFamily: "'Nunito', sans-serif", color: 'rgba(180,220,255,0.2)', fontSize: '0.78rem', fontStyle: 'italic' }}>
          made by whales, for whales.
        </p>
      </div>
      <Footer />
    </div>
  );
}
