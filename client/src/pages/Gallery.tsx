import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { LOGO_URL, NAME_URL, LINKS } from '../assets';

// ── Config ────────────────────────────────────────────────────────
const ALCHEMY_API_KEY = import.meta.env.VITE_ALCHEMY_API_KEY as string;
const CONTRACT_ADDRESS = import.meta.env.VITE_NFT_CONTRACT_ADDRESS as string;
const ALCHEMY_BASE = `https://eth-mainnet.g.alchemy.com/nft/v3/${ALCHEMY_API_KEY}`;
const SUPABASE_TRANSPARENT = 'https://psibadkdncspgikzzmnu.supabase.co/storage/v1/object/public/Whacky';

const CANVAS_PRESETS = {
  'X Post':   { w: 1600, h: 900  },
  'X Banner': { w: 1500, h: 500  },
  'Square':   { w: 1400, h: 1400 },
};

const WM_POSITIONS = ['Right Strip', 'Bottom Strip', 'Corner', 'Center'];
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

async function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => res(img);
    img.onerror = () => rej(new Error('Failed: ' + src));
    img.src = src;
  });
}

async function renderCanvas(
  canvas: HTMLCanvasElement,
  nfts: any[],
  preset: keyof typeof CANVAS_PRESETS,
  wmPos: string,
  wmContent: WMContent
) {
  const { w, h } = CANVAS_PRESETS[preset];
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  // Ocean gradient bg
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#0d2a4a');
  bg.addColorStop(0.4, '#1a5276');
  bg.addColorStop(1, '#0a1f3a');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Strip size — minimum 120px so it's always visible
  const STRIP = Math.max(Math.round(Math.min(w, h) * 0.13), 120);

  // Image area
  let imgArea = { x: 0, y: 0, w, h };
  if (wmPos === 'Right Strip')  imgArea = { x: 0, y: 0, w: w - STRIP, h };
  if (wmPos === 'Bottom Strip') imgArea = { x: 0, y: 0, w, h: h - STRIP };

  // Grid layout
  const count = nfts.length;
  const cols  = Math.ceil(Math.sqrt((count * imgArea.w) / imgArea.h));
  const cW    = imgArea.w / cols;
  const cH    = imgArea.h / Math.ceil(count / cols);

  // Draw NFTs — transparent PNGs over ocean bg
  const urls = nfts.map(resolveImage).filter(Boolean);
  for (let i = 0; i < urls.length; i++) {
    try {
      const img = await loadImg(urls[i]);
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x   = imgArea.x + col * cW;
      const y   = imgArea.y + row * cH;
      // Scale to fit (not cover) so transparent edges show ocean
      const scale = Math.min(cW / img.width, cH / img.height) * 0.9;
      const dw = img.width * scale;
      const dh = img.height * scale;
      const dx = x + (cW - dw) / 2;
      const dy = y + (cH - dh) / 2;
      ctx.drawImage(img, dx, dy, dw, dh);
    } catch { /* skip broken */ }
  }

  // Watermark
  let logo: HTMLImageElement | null = null;
  let nameImg: HTMLImageElement | null = null;
  if (wmContent !== 'name-only') {
    try { logo = await loadImg(LOGO_URL); } catch {}
  }
  if (wmContent !== 'logo-only') {
    try { nameImg = await loadImg(NAME_URL); } catch {}
  }

  ctx.save();

  if (wmPos === 'Right Strip') {
    const grad = ctx.createLinearGradient(w - STRIP, 0, w, 0);
    grad.addColorStop(0, 'rgba(10,31,58,0.85)');
    grad.addColorStop(1, 'rgba(10,31,58,0.98)');
    ctx.fillStyle = grad;
    ctx.fillRect(w - STRIP, 0, STRIP, h);

    const lSize = STRIP * 0.55;
    const cx = w - STRIP / 2;

    if (logo && nameImg) {
      const lx = cx - lSize / 2;
      const ly = h / 2 - lSize - 16;
      ctx.drawImage(logo, lx, ly, lSize, lSize);
      const nw = STRIP * 0.8;
      const nh = nw * (nameImg.height / nameImg.width);
      ctx.drawImage(nameImg, cx - nw / 2, h / 2 + 16, nw, nh);
    } else if (logo) {
      ctx.drawImage(logo, cx - lSize / 2, h / 2 - lSize / 2, lSize, lSize);
    } else if (nameImg) {
      const nw = STRIP * 0.8;
      const nh = nw * (nameImg.height / nameImg.width);
      ctx.drawImage(nameImg, cx - nw / 2, h / 2 - nh / 2, nw, nh);
    }

  } else if (wmPos === 'Bottom Strip') {
    const grad = ctx.createLinearGradient(0, h - STRIP, 0, h);
    grad.addColorStop(0, 'rgba(10,31,58,0.85)');
    grad.addColorStop(1, 'rgba(10,31,58,0.98)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, h - STRIP, w, STRIP);

    const lSize = STRIP * 0.65;
    const cy = h - STRIP / 2;

    if (logo && nameImg) {
      ctx.drawImage(logo, w / 2 - lSize - 20, cy - lSize / 2, lSize, lSize);
      const nw = lSize * 2.4;
      const nh = nw * (nameImg.height / nameImg.width);
      ctx.drawImage(nameImg, w / 2 + 20, cy - nh / 2, nw, nh);
    } else if (logo) {
      ctx.drawImage(logo, w / 2 - lSize / 2, cy - lSize / 2, lSize, lSize);
    } else if (nameImg) {
      const nw = STRIP * 1.8;
      const nh = nw * (nameImg.height / nameImg.width);
      ctx.drawImage(nameImg, w / 2 - nw / 2, cy - nh / 2, nw, nh);
    }

  } else if (wmPos === 'Corner') {
    const pad = 32;
    const lSize = Math.round(Math.min(w, h) * 0.1);

    if (logo && nameImg) {
      const nw = lSize * 2.2;
      const nh = nw * (nameImg.height / nameImg.width);
      const boxW = lSize + nw + pad * 3;
      const boxH = Math.max(lSize, nh) + pad * 2;
      ctx.fillStyle = 'rgba(10,31,58,0.85)';
      ctx.beginPath();
      ctx.roundRect(w - boxW - pad, h - boxH - pad, boxW, boxH, 20);
      ctx.fill();
      ctx.drawImage(logo, w - boxW - pad + pad, h - boxH - pad + (boxH - lSize) / 2, lSize, lSize);
      ctx.drawImage(nameImg, w - boxW - pad + pad + lSize + pad, h - boxH - pad + (boxH - nh) / 2, nw, nh);
    } else if (logo) {
      ctx.fillStyle = 'rgba(10,31,58,0.85)';
      ctx.beginPath();
      ctx.roundRect(w - lSize - pad * 2, h - lSize - pad * 2, lSize + pad, lSize + pad, 20);
      ctx.fill();
      ctx.drawImage(logo, w - lSize - pad * 1.5, h - lSize - pad * 1.5, lSize, lSize);
    } else if (nameImg) {
      const nw = Math.round(Math.min(w, h) * 0.22);
      const nh = nw * (nameImg.height / nameImg.width);
      ctx.fillStyle = 'rgba(10,31,58,0.85)';
      ctx.beginPath();
      ctx.roundRect(w - nw - pad * 2, h - nh - pad * 2, nw + pad, nh + pad, 20);
      ctx.fill();
      ctx.drawImage(nameImg, w - nw - pad * 1.5, h - nh - pad * 1.5, nw, nh);
    }

  } else { // Center overlay
    const lSize = Math.round(Math.min(w, h) * 0.14);
    ctx.globalAlpha = 0.18;
    if (logo && nameImg) {
      ctx.drawImage(logo, w / 2 - lSize - 10, h / 2 - lSize / 2, lSize, lSize);
      const nw = lSize * 2.2;
      const nh = nw * (nameImg.height / nameImg.width);
      ctx.drawImage(nameImg, w / 2 + 10, h / 2 - nh / 2, nw, nh);
    } else if (logo) {
      ctx.drawImage(logo, w / 2 - lSize / 2, h / 2 - lSize / 2, lSize, lSize);
    } else if (nameImg) {
      const nw = lSize * 3;
      const nh = nw * (nameImg.height / nameImg.width);
      ctx.drawImage(nameImg, w / 2 - nw / 2, h / 2 - nh / 2, nw, nh);
    }
    ctx.globalAlpha = 1;
  }

  ctx.restore();
}

// ── NFT Card ──────────────────────────────────────────────────────
function NFTCard({ nft, index }: { nft: any; index: number }) {
  const [hov, setHov] = useState(false);
  const src = resolveImage(nft);
  const name = nft.name || nft.title || `#${nft.tokenId}`;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: Math.min(index * 0.03, 0.6), duration: 0.35 }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        borderRadius: 16,
        overflow: 'hidden',
        background: 'rgba(255,255,255,0.06)',
        boxShadow: hov ? '0 12px 40px rgba(91,184,255,0.3), 0 0 0 2px #5bb8ff' : '0 2px 12px rgba(0,0,0,0.2)',
        transform: hov ? 'translateY(-5px)' : 'translateY(0)',
        transition: 'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
      }}
    >
      <div style={{ background: 'linear-gradient(135deg, #0d2a4a, #1a3a5c)', padding: 8, aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {src
          ? <img src={src} alt={name} style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} loading="lazy" />
          : <img src={LOGO_URL} alt="" style={{ width: '40%', opacity: 0.3 }} />
        }
      </div>
      <div style={{ padding: '8px 10px', background: 'rgba(255,255,255,0.05)' }}>
        <p style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.78rem', color: 'rgba(180,220,255,0.8)', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</p>
      </div>
    </motion.div>
  );
}

// ── Option button ─────────────────────────────────────────────────
function OptionBtn({ label, sub, active, onClick }: { label: string; sub?: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      padding: '12px 10px', borderRadius: 12,
      border: active ? '2px solid #5bb8ff' : '1.5px solid rgba(91,184,255,0.2)',
      background: active ? 'rgba(91,184,255,0.15)' : 'rgba(255,255,255,0.04)',
      cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s',
      boxShadow: active ? '0 0 20px rgba(91,184,255,0.2)' : 'none',
    }}>
      <span style={{ display: 'block', fontFamily: "'Fredoka One', cursive", fontSize: '0.88rem', color: active ? '#5bb8ff' : 'rgba(180,220,255,0.6)' }}>{label}</span>
      {sub && <span style={{ display: 'block', fontFamily: "'Nunito', sans-serif", fontSize: '0.68rem', color: active ? 'rgba(91,184,255,0.7)' : 'rgba(180,220,255,0.3)', marginTop: 2 }}>{sub}</span>}
    </button>
  );
}

// ── Canvas Preview ────────────────────────────────────────────────
function CanvasPreview({ nfts, preset, wmPos, wmContent }: {
  nfts: any[]; preset: keyof typeof CANVAS_PRESETS; wmPos: string; wmContent: WMContent;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rendering, setRendering] = useState(false);

  useEffect(() => {
    if (!nfts.length || !canvasRef.current) return;
    setRendering(true);
    renderCanvas(canvasRef.current, nfts, preset, wmPos, wmContent)
      .finally(() => setRendering(false));
  }, [nfts, preset, wmPos, wmContent]);

  const { w, h } = CANVAS_PRESETS[preset];

  return (
    <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', border: '1.5px solid rgba(91,184,255,0.2)' }}>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', display: 'block', aspectRatio: `${w}/${h}`, background: '#0d2a4a' }}
      />
      {rendering && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(13,42,74,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ fontFamily: "'Fredoka One', cursive", color: '#5bb8ff', fontSize: '0.9rem', letterSpacing: '0.1em' }}>Rendering preview…</p>
        </div>
      )}
      {!nfts.length && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ fontFamily: "'Nunito', sans-serif", color: 'rgba(180,220,255,0.3)', fontSize: '0.85rem' }}>Load your whales to see preview</p>
        </div>
      )}
    </div>
  );
}

// ── Main Gallery ──────────────────────────────────────────────────
export default function Gallery() {
  const [address, setAddress]   = useState('');
  const [nfts, setNfts]         = useState<any[]>([]);
  const [status, setStatus]     = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [statusMsg, setStatusMsg] = useState('');
  const [canvasPreset, setCanvasPreset] = useState<keyof typeof CANVAS_PRESETS>('X Post');
  const [wmPos, setWmPos]       = useState('Right Strip');
  const [wmContent, setWmContent] = useState<WMContent>('both');
  const [generating, setGenerating] = useState(false);
  const dlCanvasRef = useRef<HTMLCanvasElement>(null);

  const detect = useCallback(async () => {
    const addr = address.trim();
    if (!addr) return;
    setNfts([]); setStatus('loading'); setStatusMsg('detecting your whales…');
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
      setNfts(all); setStatus('done');
      setStatusMsg(`${all.length} whale${all.length > 1 ? 's' : ''} loaded!`);
    } catch (e: any) { setStatus('error'); setStatusMsg('Error: ' + e.message); }
  }, [address]);

  const downloadBanner = useCallback(async () => {
    if (!nfts.length) return;
    setGenerating(true);
    try {
      const canvas = dlCanvasRef.current!;
      await renderCanvas(canvas, nfts, canvasPreset, wmPos, wmContent);
      canvas.toBlob(blob => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url; link.download = 'whacky-whales-banner.png'; link.click();
        URL.revokeObjectURL(url);
      }, 'image/png');
    } finally { setGenerating(false); }
  }, [nfts, canvasPreset, wmPos, wmContent]);

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #0d2a4a 0%, #0e3460 40%, #091e38 100%)', position: 'relative' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fredoka+One&family=Nunito:wght@400;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input:focus { outline: none; border-color: #5bb8ff !important; box-shadow: 0 0 0 3px rgba(91,184,255,0.15) !important; }
      `}</style>

      <canvas ref={dlCanvasRef} style={{ display: 'none' }} />
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #5bb8ff, #2a8fd4, #5bb8ff)', zIndex: 100 }} />

      <Navbar />

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '100px 24px 120px', position: 'relative', zIndex: 2 }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center', marginBottom: 52 }}>
          <img src={LOGO_URL} alt="" style={{ height: 56, objectFit: 'contain', marginBottom: 20 }} />
          <h1 style={{ fontFamily: "'Fredoka One', cursive", fontSize: 'clamp(2rem, 5vw, 3rem)', color: '#fff', marginBottom: 12 }}>
            Your Whale Gallery
          </h1>
          <p style={{ fontFamily: "'Nunito', sans-serif", color: 'rgba(180,220,255,0.65)', fontSize: '1rem', maxWidth: 440, margin: '0 auto', lineHeight: 1.7 }}>
            Paste your wallet address, load your whales, and generate a custom banner for your X profile.
          </p>
          <p style={{ fontFamily: "'Nunito', sans-serif", color: 'rgba(91,184,255,0.5)', fontSize: '0.8rem', marginTop: 10, letterSpacing: '0.05em' }}>
            No wallet connection needed — read-only lookup
          </p>
        </motion.div>

        {/* Load section */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)', borderRadius: 20, padding: '28px 24px', marginBottom: 24, border: '1px solid rgba(91,184,255,0.15)' }}>
          <label style={{ display: 'block', fontFamily: "'Fredoka One', cursive", fontSize: '0.72rem', letterSpacing: '0.22em', color: '#5bb8ff', textTransform: 'uppercase', marginBottom: 12 }}>
            Load Your Whales
          </label>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <input
              value={address} onChange={e => setAddress(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && detect()}
              placeholder="0x... or yourname.eth"
              style={{ flex: 1, minWidth: 200, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(91,184,255,0.25)', borderRadius: 12, padding: '13px 16px', fontFamily: "'Nunito', sans-serif", fontSize: '0.92rem', color: '#fff', transition: 'border-color 0.2s' }}
            />
            <button onClick={detect} disabled={status === 'loading'}
              style={{ background: status === 'loading' ? 'rgba(91,184,255,0.2)' : 'linear-gradient(135deg, #5bb8ff, #2a8fd4)', color: status === 'loading' ? '#5bb8ff' : '#0d2a4a', border: 'none', borderRadius: 12, padding: '13px 26px', fontFamily: "'Fredoka One', cursive", fontSize: '0.95rem', cursor: status === 'loading' ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', fontWeight: 700, transition: 'transform 0.2s' }}
              onMouseEnter={e => { if (status !== 'loading') e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; }}
            >
              {status === 'loading' ? statusMsg : 'Detect My Whales'}
            </button>
          </div>
          <AnimatePresence>
            {status === 'done' && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ fontFamily: "'Nunito', sans-serif", color: '#4ecb71', fontSize: '0.85rem', marginTop: 10, fontWeight: 700 }}>✓ {statusMsg}</motion.p>}
            {status === 'error' && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ fontFamily: "'Nunito', sans-serif", color: '#ff6b6b', fontSize: '0.85rem', marginTop: 10, fontWeight: 700 }}>✕ {statusMsg}</motion.p>}
          </AnimatePresence>
        </motion.div>

        {/* NFT Grid */}
        <AnimatePresence>
          {nfts.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 20, padding: '24px', marginBottom: 24, border: '1px solid rgba(91,184,255,0.12)' }}>
              <p style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.72rem', letterSpacing: '0.22em', color: '#5bb8ff', textTransform: 'uppercase', marginBottom: 16 }}>
                Your Pod — {nfts.length} Whale{nfts.length > 1 ? 's' : ''}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(${nfts.length > 30 ? '72px' : '100px'}, 1fr))`, gap: nfts.length > 30 ? 6 : 10 }}>
                {nfts.map((nft, i) => <NFTCard key={nft.tokenId || i} nft={nft} index={i} />)}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty state */}
        {nfts.length === 0 && status !== 'loading' && (
          <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 20, padding: '48px 24px', textAlign: 'center', marginBottom: 24, border: '1px dashed rgba(91,184,255,0.15)' }}>
            <img src={LOGO_URL} alt="" style={{ height: 52, objectFit: 'contain', opacity: 0.2, marginBottom: 14 }} />
            <p style={{ fontFamily: "'Fredoka One', cursive", fontSize: '1rem', color: 'rgba(180,220,255,0.3)' }}>No whales loaded yet</p>
            <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: '0.82rem', color: 'rgba(180,220,255,0.2)', marginTop: 6 }}>Enter your wallet address above</p>
          </div>
        )}

        {/* Options + Preview side by side on desktop */}
        <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 20, alignItems: 'start' }}>

          {/* Left — controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Canvas size */}
            <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 20, padding: '22px 20px', border: '1px solid rgba(91,184,255,0.12)' }}>
              <label style={{ display: 'block', fontFamily: "'Fredoka One', cursive", fontSize: '0.72rem', letterSpacing: '0.22em', color: '#5bb8ff', textTransform: 'uppercase', marginBottom: 12 }}>Canvas Size</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {Object.entries(CANVAS_PRESETS).map(([name, { w, h }]) => (
                  <OptionBtn key={name} label={name} sub={`${w}×${h}`} active={canvasPreset === name} onClick={() => setCanvasPreset(name as any)} />
                ))}
              </div>
            </div>

            {/* Watermark position */}
            <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 20, padding: '22px 20px', border: '1px solid rgba(91,184,255,0.12)' }}>
              <label style={{ display: 'block', fontFamily: "'Fredoka One', cursive", fontSize: '0.72rem', letterSpacing: '0.22em', color: '#5bb8ff', textTransform: 'uppercase', marginBottom: 12 }}>Watermark Position</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {WM_POSITIONS.map(pos => <OptionBtn key={pos} label={pos} active={wmPos === pos} onClick={() => setWmPos(pos)} />)}
              </div>
            </div>

            {/* Watermark content */}
            <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 20, padding: '22px 20px', border: '1px solid rgba(91,184,255,0.12)' }}>
              <label style={{ display: 'block', fontFamily: "'Fredoka One', cursive", fontSize: '0.72rem', letterSpacing: '0.22em', color: '#5bb8ff', textTransform: 'uppercase', marginBottom: 12 }}>Watermark Style</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {([
                  { value: 'both', label: 'Logo + Name', preview: <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><img src={LOGO_URL} style={{ height: 20 }} /><img src={NAME_URL} style={{ height: 14 }} /></span> },
                  { value: 'logo-only', label: 'Logo Only', preview: <img src={LOGO_URL} style={{ height: 20 }} /> },
                  { value: 'name-only', label: 'Name Only', preview: <img src={NAME_URL} style={{ height: 14 }} /> },
                ] as const).map(opt => (
                  <button key={opt.value} onClick={() => setWmContent(opt.value)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 10, border: wmContent === opt.value ? '2px solid #5bb8ff' : '1px solid rgba(91,184,255,0.15)', background: wmContent === opt.value ? 'rgba(91,184,255,0.12)' : 'transparent', cursor: 'pointer', transition: 'all 0.2s' }}>
                    <span style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.85rem', color: wmContent === opt.value ? '#5bb8ff' : 'rgba(180,220,255,0.5)' }}>{opt.label}</span>
                    {opt.preview}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button onClick={downloadBanner} disabled={!nfts.length || generating}
                style={{ background: nfts.length && !generating ? 'linear-gradient(135deg, #5bb8ff, #2a8fd4)' : 'rgba(91,184,255,0.1)', color: nfts.length && !generating ? '#0d2a4a' : 'rgba(91,184,255,0.3)', border: 'none', borderRadius: 14, padding: '16px', fontFamily: "'Fredoka One', cursive", fontSize: '1rem', cursor: nfts.length && !generating ? 'pointer' : 'not-allowed', fontWeight: 700, transition: 'transform 0.2s', boxShadow: nfts.length && !generating ? '0 6px 24px rgba(91,184,255,0.3)' : 'none' }}
                onMouseEnter={e => { if (nfts.length && !generating) e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; }}
              >
                {generating ? 'Generating…' : 'Download Banner PNG'}
              </button>
              <button onClick={() => { setNfts([]); setAddress(''); setStatus('idle'); setStatusMsg(''); }}
                style={{ background: 'transparent', color: 'rgba(180,220,255,0.3)', border: '1px solid rgba(91,184,255,0.1)', borderRadius: 14, padding: '12px', fontFamily: "'Nunito', sans-serif", fontSize: '0.85rem', cursor: 'pointer', transition: 'color 0.2s, border-color 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.color = 'rgba(180,220,255,0.6)'; e.currentTarget.style.borderColor = 'rgba(91,184,255,0.3)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'rgba(180,220,255,0.3)'; e.currentTarget.style.borderColor = 'rgba(91,184,255,0.1)'; }}
              >
                Clear All
              </button>
            </div>
          </div>

          {/* Right — live preview */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.72rem', letterSpacing: '0.22em', color: '#5bb8ff', textTransform: 'uppercase' }}>Live Preview</p>
            <CanvasPreview nfts={nfts} preset={canvasPreset} wmPos={wmPos} wmContent={wmContent} />
          </div>
        </div>

        <style>{`
          @media (max-width: 700px) {
            .gallery-grid { grid-template-columns: 1fr !important; }
          }
        `}</style>

      </div>
      <Footer />
    </div>
  );
}
