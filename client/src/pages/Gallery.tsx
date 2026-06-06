import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

// ── Config ────────────────────────────────────────────────────────
const ALCHEMY_API_KEY = import.meta.env.VITE_ALCHEMY_API_KEY as string;
const CONTRACT_ADDRESS = import.meta.env.VITE_NFT_CONTRACT_ADDRESS as string;
const ALCHEMY_BASE = `https://eth-mainnet.g.alchemy.com/nft/v3/${ALCHEMY_API_KEY}`;

const LOGO_URL = 'https://aitxwwtybpgpqxsvlxzm.supabase.co/storage/v1/object/public/Images/Whacky/Watermark-logo.png';
const NAME_URL = 'https://aitxwwtybpgpqxsvlxzm.supabase.co/storage/v1/object/public/Images/Whacky/Watermark-name.png';

const CANVAS_PRESETS = {
  'X Post':   { w: 1600, h: 900  },
  'X Banner': { w: 1500, h: 500  },
  'Square':   { w: 1400, h: 1400 },
};

const WM_POSITIONS = ['Right Strip', 'Bottom Strip', 'Corner', 'Center'];

// ── Helpers ───────────────────────────────────────────────────────
function resolveImage(nft: any): string {
  const raw =
    nft.image?.cachedUrl ||
    nft.image?.thumbnailUrl ||
    nft.image?.originalUrl ||
    nft.rawMetadata?.image || '';
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

// ── Bubble bg (light) ─────────────────────────────────────────────
function MiniWaves() {
  return (
    <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, height: 80, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
      <svg viewBox="0 0 1440 80" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
        <path d="M0,40 C180,80 360,0 540,40 C720,80 900,0 1080,40 C1260,80 1350,20 1440,40 L1440,80 L0,80 Z" fill="rgba(91,184,255,0.08)" />
      </svg>
    </div>
  );
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
      transition={{ delay: Math.min(index * 0.03, 0.8), duration: 0.4 }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        borderRadius: 16,
        overflow: 'hidden',
        background: '#fff',
        boxShadow: hov
          ? '0 16px 50px rgba(91,184,255,0.35), 0 0 0 2px #5bb8ff'
          : '0 4px 16px rgba(13,42,74,0.1)',
        transform: hov ? 'translateY(-6px)' : 'translateY(0)',
        transition: 'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
        cursor: 'default',
      }}
    >
      {src ? (
        <img src={src} alt={name} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }} loading="lazy" />
      ) : (
        <div style={{ width: '100%', aspectRatio: '1', background: '#e8f4ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>🐋</div>
      )}
      <div style={{ padding: '10px 12px', background: '#fff' }}>
        <p style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.9rem', color: '#0d2a4a', textAlign: 'center' }}>{name}</p>
      </div>
    </motion.div>
  );
}

// ── Option button ─────────────────────────────────────────────────
function OptionBtn({ label, sub, active, onClick }: { label: string; sub?: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '14px 12px',
        borderRadius: 14,
        border: active ? '2px solid #5bb8ff' : '1.5px solid rgba(91,184,255,0.25)',
        background: active ? 'linear-gradient(135deg, #e8f6ff, #d0ecff)' : 'rgba(255,255,255,0.6)',
        cursor: 'pointer',
        textAlign: 'center',
        transition: 'all 0.2s',
        boxShadow: active ? '0 4px 16px rgba(91,184,255,0.25)' : 'none',
      }}
    >
      <span style={{ display: 'block', fontFamily: "'Fredoka One', cursive", fontSize: '0.95rem', color: active ? '#0d2a4a' : '#4a7fa5' }}>{label}</span>
      {sub && <span style={{ display: 'block', fontFamily: "'Nunito', sans-serif", fontSize: '0.72rem', color: active ? '#3a7aaa' : '#7aaabf', marginTop: 2 }}>{sub}</span>}
    </button>
  );
}

// ── Main Gallery ──────────────────────────────────────────────────
export default function Gallery() {
  const [address, setAddress] = useState('');
  const [nfts, setNfts] = useState<any[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [statusMsg, setStatusMsg] = useState('');
  const [canvasPreset, setCanvasPreset] = useState<keyof typeof CANVAS_PRESETS>('X Post');
  const [wmPos, setWmPos] = useState('Right Strip');
  const [generating, setGenerating] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // ── Fetch NFTs ───────────────────────────────────────────────
  const detect = useCallback(async () => {
    const addr = address.trim();
    if (!addr) return;
    setNfts([]);
    setStatus('loading');
    setStatusMsg('detecting your whales…');

    try {
      let pageKey: string | null = null;
      let all: any[] = [];

      do {
        const params = new URLSearchParams({
          owner: addr,
          contractAddresses: [CONTRACT_ADDRESS],
          withMetadata: 'true',
          pageSize: '100',
        });
        if (pageKey) params.set('pageKey', pageKey);

        const res = await fetch(`${ALCHEMY_BASE}/getNFTsForOwner?${params}`);
        if (!res.ok) throw new Error(`Alchemy error ${res.status}`);
        const data = await res.json();
        all = [...all, ...data.ownedNfts];
        pageKey = data.pageKey || null;
        setStatusMsg(`loading ${all.length} whales…`);
      } while (pageKey);

      if (!all.length) {
        setStatus('error');
        setStatusMsg('No Whacky Whales found for this address. 🐋');
        return;
      }
      setNfts(all);
      setStatus('done');
      setStatusMsg(`${all.length} whale${all.length > 1 ? 's' : ''} loaded!`);
    } catch (e: any) {
      setStatus('error');
      setStatusMsg('Error: ' + e.message);
    }
  }, [address]);

  // ── Generate banner ──────────────────────────────────────────
  const downloadBanner = useCallback(async () => {
    if (!nfts.length) return;
    setGenerating(true);

    const { w, h } = CANVAS_PRESETS[canvasPreset];
    const canvas = canvasRef.current!;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;

    // Ocean gradient background
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, '#c8e8ff');
    bg.addColorStop(0.5, '#7ec8f0');
    bg.addColorStop(1, '#1a5276');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    // Watermark strip size
    const STRIP = Math.round(Math.min(w, h) * 0.1);

    // Image area
    let imgArea = { x: 0, y: 0, w, h };
    if (wmPos === 'Right Strip')  imgArea = { x: 0, y: 0, w: w - STRIP, h };
    if (wmPos === 'Bottom Strip') imgArea = { x: 0, y: 0, w, h: h - STRIP };

    // Grid layout
    const count = nfts.length;
    const cols  = Math.ceil(Math.sqrt((count * imgArea.w) / imgArea.h));
    const rows  = Math.ceil(count / cols);
    const cW    = imgArea.w / cols;
    const cH    = imgArea.h / rows;

    // Draw NFT images
    const urls = nfts.map(resolveImage).filter(Boolean);
    for (let i = 0; i < urls.length; i++) {
      try {
        const img = await loadImg(urls[i]);
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x   = imgArea.x + col * cW;
        const y   = imgArea.y + row * cH;
        const scale = Math.max(cW / img.width, cH / img.height);
        const sw = cW / scale, sh = cH / scale;
        const sx = (img.width - sw) / 2, sy = (img.height - sh) / 2;
        ctx.drawImage(img, sx, sy, sw, sh, x, y, cW, cH);
      } catch { /* skip */ }
    }

    // Draw watermark strip
    const drawWatermark = async () => {
      let logo: HTMLImageElement | null = null;
      let nameImg: HTMLImageElement | null = null;
      try { logo = await loadImg(LOGO_URL); } catch { /* no logo */ }
      try { nameImg = await loadImg(NAME_URL); } catch { /* no name */ }

      ctx.save();

      if (wmPos === 'Right Strip') {
        // Dark strip on right
        const grad = ctx.createLinearGradient(w - STRIP, 0, w, 0);
        grad.addColorStop(0, 'rgba(13,42,74,0.9)');
        grad.addColorStop(1, 'rgba(13,42,74,0.98)');
        ctx.fillStyle = grad;
        ctx.fillRect(w - STRIP, 0, STRIP, h);

        // Logo centered vertically in strip
        if (logo) {
          const lSize = STRIP * 0.6;
          const lx = w - STRIP + (STRIP - lSize) / 2;
          const ly = h / 2 - lSize / 2 - (nameImg ? lSize * 0.4 : 0);
          ctx.drawImage(logo, lx, ly, lSize, lSize);
        }
        if (nameImg) {
          const nw = STRIP * 0.75;
          const nh = nw * (nameImg.height / nameImg.width);
          const nx = w - STRIP + (STRIP - nw) / 2;
          const ny = h / 2 + (logo ? STRIP * 0.35 : -nh / 2);
          ctx.drawImage(nameImg, nx, ny, nw, nh);
        }

      } else if (wmPos === 'Bottom Strip') {
        const grad = ctx.createLinearGradient(0, h - STRIP, 0, h);
        grad.addColorStop(0, 'rgba(13,42,74,0.9)');
        grad.addColorStop(1, 'rgba(13,42,74,0.98)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, h - STRIP, w, STRIP);

        const lSize = STRIP * 0.65;
        if (logo) ctx.drawImage(logo, w / 2 - lSize - 10, h - STRIP + (STRIP - lSize) / 2, lSize, lSize);
        if (nameImg) {
          const nw = lSize * 2.2;
          const nh = nw * (nameImg.height / nameImg.width);
          ctx.drawImage(nameImg, w / 2 + 10, h - STRIP + (STRIP - nh) / 2, nw, nh);
        }

      } else if (wmPos === 'Corner') {
        const pad = 24;
        const lSize = Math.round(Math.min(w, h) * 0.09);
        const nw = lSize * 2.0;
        const nh = nameImg ? nw * (nameImg.height / nameImg.width) : 0;
        const boxW = lSize + nw + pad * 3;
        const boxH = Math.max(lSize, nh) + pad * 2;

        ctx.fillStyle = 'rgba(13,42,74,0.82)';
        ctx.beginPath();
        ctx.roundRect(w - boxW - pad, h - boxH - pad, boxW, boxH, 16);
        ctx.fill();

        if (logo) ctx.drawImage(logo, w - boxW - pad + pad, h - boxH - pad + (boxH - lSize) / 2, lSize, lSize);
        if (nameImg) ctx.drawImage(nameImg, w - boxW - pad + pad + lSize + pad, h - boxH - pad + (boxH - nh) / 2, nw, nh);

      } else { // Center
        if (logo) {
          const lSize = Math.round(Math.min(w, h) * 0.12);
          ctx.globalAlpha = 0.15;
          ctx.drawImage(logo, w / 2 - lSize / 2, h / 2 - lSize / 2, lSize, lSize);
          ctx.globalAlpha = 1;
        }
      }

      ctx.restore();
    };

    await drawWatermark();

    canvas.toBlob(blob => {
      if (!blob) return;
      const url  = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href     = url;
      link.download = 'whacky-whales-banner.png';
      link.click();
      URL.revokeObjectURL(url);
      setGenerating(false);
    }, 'image/png');
  }, [nfts, canvasPreset, wmPos]);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #e8f6ff 0%, #c8e8ff 30%, #e8f6ff 100%)',
      position: 'relative',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fredoka+One&family=Nunito:wght@400;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input:focus { outline: none; border-color: #5bb8ff !important; box-shadow: 0 0 0 3px rgba(91,184,255,0.2) !important; }
      `}</style>

      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 4, background: 'linear-gradient(90deg, #5bb8ff, #3a9de0, #5bb8ff)', zIndex: 100 }} />

      <Navbar />
      <MiniWaves />

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '100px 24px 120px', position: 'relative', zIndex: 2 }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center', marginBottom: 52 }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 16 }}>🐋🎨</div>
          <h1 style={{ fontFamily: "'Fredoka One', cursive", fontSize: 'clamp(2rem, 5vw, 3rem)', color: '#0d2a4a', marginBottom: 12 }}>
            Your Whale Gallery
          </h1>
          <p style={{ fontFamily: "'Nunito', sans-serif", color: '#4a7fa5', fontSize: '1.05rem', maxWidth: 480, margin: '0 auto', lineHeight: 1.65 }}>
            Paste your wallet address to load your Whacky Whales, then generate a custom banner to flex on X.
          </p>
          <p style={{ fontFamily: "'Nunito', sans-serif", color: '#7aaabf', fontSize: '0.85rem', marginTop: 10, letterSpacing: '0.02em' }}>
            🔒 No wallet connection needed — read-only lookup
          </p>
        </motion.div>

        {/* Load section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          style={{
            background: 'rgba(255,255,255,0.75)',
            backdropFilter: 'blur(20px)',
            borderRadius: 24,
            padding: '32px 28px',
            marginBottom: 28,
            boxShadow: '0 4px 30px rgba(13,42,74,0.08)',
            border: '1.5px solid rgba(91,184,255,0.2)',
          }}
        >
          <label style={{ display: 'block', fontFamily: "'Fredoka One', cursive", fontSize: '0.8rem', letterSpacing: '0.2em', color: '#5bb8ff', textTransform: 'uppercase', marginBottom: 12 }}>
            Load Your Whales
          </label>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <input
              value={address}
              onChange={e => setAddress(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && detect()}
              placeholder="0x... or yourname.eth"
              style={{
                flex: 1,
                minWidth: 200,
                background: 'rgba(232,246,255,0.8)',
                border: '1.5px solid rgba(91,184,255,0.3)',
                borderRadius: 14,
                padding: '14px 18px',
                fontFamily: "'Nunito', sans-serif",
                fontSize: '0.95rem',
                color: '#0d2a4a',
                transition: 'border-color 0.2s, box-shadow 0.2s',
              }}
            />
            <button
              onClick={detect}
              disabled={status === 'loading'}
              style={{
                background: status === 'loading' ? 'rgba(91,184,255,0.3)' : 'linear-gradient(135deg, #0d2a4a, #1a5276)',
                color: '#fff',
                border: 'none',
                borderRadius: 14,
                padding: '14px 28px',
                fontFamily: "'Fredoka One', cursive",
                fontSize: '1rem',
                cursor: status === 'loading' ? 'not-allowed' : 'pointer',
                whiteSpace: 'nowrap',
                boxShadow: '0 4px 16px rgba(13,42,74,0.25)',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
              onMouseEnter={e => { if (status !== 'loading') { e.currentTarget.style.transform = 'translateY(-2px)'; } }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              {status === 'loading' ? statusMsg : '🐋 Detect My Whales'}
            </button>
          </div>

          <AnimatePresence>
            {status === 'done' && (
              <motion.p initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                style={{ fontFamily: "'Nunito', sans-serif", color: '#2e9e60', fontSize: '0.88rem', marginTop: 12, fontWeight: 700 }}>
                ✅ {statusMsg}
              </motion.p>
            )}
            {status === 'error' && (
              <motion.p initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                style={{ fontFamily: "'Nunito', sans-serif", color: '#e05050', fontSize: '0.88rem', marginTop: 12, fontWeight: 700 }}>
                ❌ {statusMsg}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>

        {/* NFT Grid */}
        <AnimatePresence>
          {nfts.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                background: 'rgba(255,255,255,0.7)',
                backdropFilter: 'blur(20px)',
                borderRadius: 24,
                padding: '28px 24px',
                marginBottom: 28,
                boxShadow: '0 4px 30px rgba(13,42,74,0.08)',
                border: '1.5px solid rgba(91,184,255,0.2)',
              }}
            >
              <p style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.8rem', letterSpacing: '0.2em', color: '#5bb8ff', textTransform: 'uppercase', marginBottom: 20 }}>
                🌊 Your Pod — {nfts.length} Whale{nfts.length > 1 ? 's' : ''}
              </p>
              <div style={{
                display: 'grid',
                gridTemplateColumns: `repeat(auto-fill, minmax(${nfts.length > 20 ? '80px' : '120px'}, 1fr))`,
                gap: nfts.length > 20 ? 8 : 12,
              }}>
                {nfts.map((nft, i) => <NFTCard key={nft.tokenId || i} nft={nft} index={i} />)}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty state */}
        {nfts.length === 0 && status !== 'loading' && (
          <div style={{
            background: 'rgba(255,255,255,0.5)',
            borderRadius: 24,
            padding: '52px 28px',
            textAlign: 'center',
            marginBottom: 28,
            border: '1.5px dashed rgba(91,184,255,0.3)',
          }}>
            <div style={{ fontSize: '3rem', marginBottom: 16, opacity: 0.5 }}>🐋</div>
            <p style={{ fontFamily: "'Fredoka One', cursive", fontSize: '1.1rem', color: '#7aaabf' }}>No whales loaded yet</p>
            <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: '0.9rem', color: '#9bbfd4', marginTop: 6 }}>Enter your wallet address above</p>
          </div>
        )}

        {/* Canvas + Watermark options */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{
            background: 'rgba(255,255,255,0.75)',
            backdropFilter: 'blur(20px)',
            borderRadius: 24,
            padding: '32px 28px',
            marginBottom: 20,
            boxShadow: '0 4px 30px rgba(13,42,74,0.08)',
            border: '1.5px solid rgba(91,184,255,0.2)',
            display: 'flex',
            flexDirection: 'column',
            gap: 28,
          }}
        >
          {/* Canvas size */}
          <div>
            <label style={{ display: 'block', fontFamily: "'Fredoka One', cursive", fontSize: '0.8rem', letterSpacing: '0.2em', color: '#5bb8ff', textTransform: 'uppercase', marginBottom: 14 }}>
              Canvas Size
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {Object.entries(CANVAS_PRESETS).map(([name, { w, h }]) => (
                <OptionBtn key={name} label={name} sub={`${w}×${h}`} active={canvasPreset === name} onClick={() => setCanvasPreset(name as any)} />
              ))}
            </div>
          </div>

          {/* Watermark position */}
          <div>
            <label style={{ display: 'block', fontFamily: "'Fredoka One', cursive", fontSize: '0.8rem', letterSpacing: '0.2em', color: '#5bb8ff', textTransform: 'uppercase', marginBottom: 14 }}>
              Watermark Position
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
              {WM_POSITIONS.map(pos => (
                <OptionBtn key={pos} label={pos} active={wmPos === pos} onClick={() => setWmPos(pos)} />
              ))}
            </div>
          </div>

          {/* Watermark preview */}
          <div style={{ background: 'rgba(232,246,255,0.6)', borderRadius: 14, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, border: '1px solid rgba(91,184,255,0.2)' }}>
            <img src={LOGO_URL} alt="Watermark" style={{ height: 40, objectFit: 'contain' }} />
            <img src={NAME_URL} alt="Whacky Whales" style={{ height: 28, objectFit: 'contain' }} />
            <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: '0.82rem', color: '#4a7fa5', lineHeight: 1.5 }}>
              Your banner will include the Whacky Whales logo & name as a watermark.
            </p>
          </div>
        </motion.div>

        {/* Action buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button
            onClick={downloadBanner}
            disabled={!nfts.length || generating}
            style={{
              background: nfts.length && !generating
                ? 'linear-gradient(135deg, #0d2a4a, #1a6fa8)'
                : 'rgba(91,184,255,0.2)',
              color: nfts.length && !generating ? '#fff' : '#7aaabf',
              border: 'none',
              borderRadius: 16,
              padding: '18px',
              fontFamily: "'Fredoka One', cursive",
              fontSize: '1.1rem',
              letterSpacing: '0.04em',
              cursor: nfts.length && !generating ? 'pointer' : 'not-allowed',
              boxShadow: nfts.length && !generating ? '0 8px 30px rgba(13,42,74,0.25)' : 'none',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={e => { if (nfts.length && !generating) e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            {generating ? '🎨 Generating…' : '⬇️ Download Banner PNG'}
          </button>
          <button
            onClick={() => { setNfts([]); setAddress(''); setStatus('idle'); setStatusMsg(''); }}
            style={{
              background: 'transparent',
              color: '#7aaabf',
              border: '1.5px solid rgba(91,184,255,0.25)',
              borderRadius: 16,
              padding: '14px',
              fontFamily: "'Nunito', sans-serif",
              fontSize: '0.9rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'border-color 0.2s, color 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#5bb8ff'; e.currentTarget.style.color = '#3a7aaa'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(91,184,255,0.25)'; e.currentTarget.style.color = '#7aaabf'; }}
          >
            Clear All
          </button>
        </div>

      </div>
      <Footer />
    </div>
  );
}
