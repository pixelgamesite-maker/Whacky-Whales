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

const WM_POSITIONS = ['Right Strip', 'Bottom Strip', 'Corner', 'Center'] as const;
type WMPosition = typeof WM_POSITIONS[number];
type WMContent = 'logo-only' | 'name-only' | 'both';
type Mode = 'grid' | 'banner';

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

// ── Canvas Rendering ──────────────────────────────────────────────
async function renderCanvas(
  canvas: HTMLCanvasElement,
  nfts: any[],
  preset: keyof typeof CANVAS_PRESETS,
  wmPos: WMPosition,
  wmContent: WMContent,
  mode: Mode
) {
  const { w, h } = CANVAS_PRESETS[preset];
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(dpr, dpr);

  // Deep ocean background
  const bg = ctx.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, '#0a1628');
  bg.addColorStop(0.5, '#0d2137');
  bg.addColorStop(1, '#081020');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Subtle noise/texture overlay
  ctx.fillStyle = 'rgba(255,255,255,0.015)';
  for (let i = 0; i < w; i += 4) {
    for (let j = 0; j < h; j += 4) {
      if (Math.random() > 0.5) ctx.fillRect(i, j, 2, 2);
    }
  }

  // Strip size
  const STRIP = Math.max(Math.round(Math.min(w, h) * 0.13), 120);

  // Image area
  let imgArea = { x: 0, y: 0, w, h };
  if (wmPos === 'Right Strip')  imgArea = { x: 0, y: 0, w: w - STRIP, h };
  if (wmPos === 'Bottom Strip') imgArea = { x: 0, y: 0, w, h: h - STRIP };

  // Load images
  const urls = nfts.map(resolveImage).filter(Boolean);
  const images: HTMLImageElement[] = [];
  for (const url of urls) {
    try { images.push(await loadImg(url)); } catch { /* skip broken */ }
  }
  if (!images.length) return;

  const count = images.length;
  const pad = 24;
  const cornerRadius = 16;

  if (mode === 'grid') {
    // Grid layout — calculate cols/rows to minimize empty space
    const aspect = imgArea.w / imgArea.h;
    let cols = Math.ceil(Math.sqrt(count * aspect));
    let rows = Math.ceil(count / cols);

    // Adjust if too many rows
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
      const x = imgArea.x + pad + col * (cellW + pad);
      const y = imgArea.y + pad + row * (cellH + pad);

      // Scale to fit with padding inside cell
      const scale = Math.min((cellW - 16) / img.width, (cellH - 16) / img.height);
      const dw = img.width * scale;
      const dh = img.height * scale;
      const dx = x + (cellW - dw) / 2;
      const dy = y + (cellH - dh) / 2;

      // Shadow
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.4)';
      ctx.shadowBlur = 20;
      ctx.shadowOffsetY = 8;

      // Rounded rect clip
      ctx.beginPath();
      ctx.roundRect(x, y, cellW, cellH, cornerRadius);
      ctx.clip();
      ctx.fillStyle = 'rgba(255,255,255,0.03)';
      ctx.fillRect(x, y, cellW, cellH);

      // Draw image
      ctx.drawImage(img, dx, dy, dw, dh);
      ctx.restore();

      // Subtle border
      ctx.save();
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(x, y, cellW, cellH, cornerRadius);
      ctx.stroke();
      ctx.restore();
    }
  } else {
    // Banner mode — horizontal strip with slight overlap/offset for style
    const usableW = imgArea.w - pad * 2;
    const usableH = imgArea.h - pad * 2;
    const targetHeight = usableH * 0.85;

    // Calculate how many fit
    let totalWidth = 0;
    const scales = images.map(img => targetHeight / img.height);
    const widths = images.map((img, i) => img.width * scales[i]);
    totalWidth = widths.reduce((a, b) => a + b, 0) + (images.length - 1) * 20;

    let startX = imgArea.x + pad;
    let startY = imgArea.y + pad + (usableH - targetHeight) / 2;

    if (totalWidth < usableW) {
      startX += (usableW - totalWidth) / 2;
    }

    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      const scale = targetHeight / img.height;
      const dw = img.width * scale;
      const dh = targetHeight;

      // If too wide, scale down
      let finalW = dw;
      let finalH = dh;
      if (totalWidth > usableW) {
        const ratio = usableW / totalWidth;
        finalW = dw * ratio;
        finalH = dh * ratio;
      }

      const dx = startX;
      const dy = startY + (usableH - finalH) / 2;

      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 24;
      ctx.shadowOffsetY = 10;
      ctx.beginPath();
      ctx.roundRect(dx, dy, finalW, finalH, 12);
      ctx.clip();
      ctx.drawImage(img, dx, dy, finalW, finalH);
      ctx.restore();

      ctx.save();
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(dx, dy, finalW, finalH, 12);
      ctx.stroke();
      ctx.restore();

      startX += finalW + 20;
    }
  }

  // ── Watermark ─────────────────────────────────────────────
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
    grad.addColorStop(0, 'rgba(8,16,32,0.9)');
    grad.addColorStop(1, 'rgba(8,16,32,0.98)');
    ctx.fillStyle = grad;
    ctx.fillRect(w - STRIP, 0, STRIP, h);

    // Subtle line
    ctx.strokeStyle = 'rgba(91,184,255,0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(w - STRIP, 0);
    ctx.lineTo(w - STRIP, h);
    ctx.stroke();

    const lSize = STRIP * 0.5;
    const cx = w - STRIP / 2;

    if (logo && nameImg) {
      const lx = cx - lSize / 2;
      const ly = h / 2 - lSize - 20;
      ctx.drawImage(logo, lx, ly, lSize, lSize);
      const nw = STRIP * 0.75;
      const nh = nw * (nameImg.height / nameImg.width);
      ctx.drawImage(nameImg, cx - nw / 2, h / 2 + 12, nw, nh);
    } else if (logo) {
      ctx.drawImage(logo, cx - lSize / 2, h / 2 - lSize / 2, lSize, lSize);
    } else if (nameImg) {
      const nw = STRIP * 0.75;
      const nh = nw * (nameImg.height / nameImg.width);
      ctx.drawImage(nameImg, cx - nw / 2, h / 2 - nh / 2, nw, nh);
    }

  } else if (wmPos === 'Bottom Strip') {
    const grad = ctx.createLinearGradient(0, h - STRIP, 0, h);
    grad.addColorStop(0, 'rgba(8,16,32,0.9)');
    grad.addColorStop(1, 'rgba(8,16,32,0.98)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, h - STRIP, w, STRIP);

    ctx.strokeStyle = 'rgba(91,184,255,0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, h - STRIP);
    ctx.lineTo(w, h - STRIP);
    ctx.stroke();

    const lSize = STRIP * 0.6;
    const cy = h - STRIP / 2;

    if (logo && nameImg) {
      ctx.drawImage(logo, w / 2 - lSize - 16, cy - lSize / 2, lSize, lSize);
      const nw = lSize * 2.2;
      const nh = nw * (nameImg.height / nameImg.width);
      ctx.drawImage(nameImg, w / 2 + 16, cy - nh / 2, nw, nh);
    } else if (logo) {
      ctx.drawImage(logo, w / 2 - lSize / 2, cy - lSize / 2, lSize, lSize);
    } else if (nameImg) {
      const nw = STRIP * 1.6;
      const nh = nw * (nameImg.height / nameImg.width);
      ctx.drawImage(nameImg, w / 2 - nw / 2, cy - nh / 2, nw, nh);
    }

  } else if (wmPos === 'Corner') {
    const pad = 28;
    const lSize = Math.round(Math.min(w, h) * 0.09);
    const boxPad = 16;

    if (logo && nameImg) {
      const nw = lSize * 2;
      const nh = nw * (nameImg.height / nameImg.width);
      const boxW = lSize + nw + boxPad * 3;
      const boxH = Math.max(lSize, nh) + boxPad * 2;

      ctx.fillStyle = 'rgba(8,16,32,0.85)';
      ctx.beginPath();
      ctx.roundRect(w - boxW - pad, h - boxH - pad, boxW, boxH, 14);
      ctx.fill();

      ctx.drawImage(logo, w - boxW - pad + boxPad, h - boxH - pad + (boxH - lSize) / 2, lSize, lSize);
      ctx.drawImage(nameImg, w - boxW - pad + boxPad + lSize + boxPad, h - boxH - pad + (boxH - nh) / 2, nw, nh);
    } else if (logo) {
      const box = lSize + boxPad * 2;
      ctx.fillStyle = 'rgba(8,16,32,0.85)';
      ctx.beginPath();
      ctx.roundRect(w - box - pad, h - box - pad, box, box, 14);
      ctx.fill();
      ctx.drawImage(logo, w - box - pad + boxPad, h - box - pad + boxPad, lSize, lSize);
    } else if (nameImg) {
      const nw = Math.round(Math.min(w, h) * 0.2);
      const nh = nw * (nameImg.height / nameImg.width);
      const boxW = nw + boxPad * 2;
      const boxH = nh + boxPad * 2;
      ctx.fillStyle = 'rgba(8,16,32,0.85)';
      ctx.beginPath();
      ctx.roundRect(w - boxW - pad, h - boxH - pad, boxW, boxH, 14);
      ctx.fill();
      ctx.drawImage(nameImg, w - boxW - pad + boxPad, h - boxH - pad + boxPad, nw, nh);
    }

  } else { // Center overlay
    const lSize = Math.round(Math.min(w, h) * 0.12);
    ctx.globalAlpha = 0.12;
    if (logo && nameImg) {
      ctx.drawImage(logo, w / 2 - lSize - 8, h / 2 - lSize / 2, lSize, lSize);
      const nw = lSize * 2;
      const nh = nw * (nameImg.height / nameImg.width);
      ctx.drawImage(nameImg, w / 2 + 8, h / 2 - nh / 2, nw, nh);
    } else if (logo) {
      ctx.drawImage(logo, w / 2 - lSize / 2, h / 2 - lSize / 2, lSize, lSize);
    } else if (nameImg) {
      const nw = lSize * 2.8;
      const nh = nw * (nameImg.height / nameImg.width);
      ctx.drawImage(nameImg, w / 2 - nw / 2, h / 2 - nh / 2, nw, nh);
    }
    ctx.globalAlpha = 1;
  }

  ctx.restore();
}

// ── Option Button ─────────────────────────────────────────────────
function OptBtn({ label, sub, active, onClick, icon }: { 
  label: string; sub?: string; active: boolean; onClick: () => void; icon?: React.ReactNode 
}) {
  return (
    <button onClick={onClick} style={{
      padding: '14px 12px',
      borderRadius: 14,
      border: active ? '2px solid #5bb8ff' : '1.5px solid rgba(91,184,255,0.15)',
      background: active ? 'rgba(91,184,255,0.12)' : 'rgba(255,255,255,0.03)',
      cursor: 'pointer',
      textAlign: 'center',
      transition: 'all 0.25s cubic-bezier(0.34,1.56,0.64,1)',
      boxShadow: active ? '0 0 24px rgba(91,184,255,0.15), inset 0 1px 0 rgba(255,255,255,0.05)' : 'none',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      minHeight: 64,
    }}>
      {icon && <div style={{ marginBottom: 2, opacity: active ? 1 : 0.6 }}>{icon}</div>}
      <span style={{
        display: 'block',
        fontFamily: "'Fredoka One', cursive",
        fontSize: '0.85rem',
        color: active ? '#5bb8ff' : 'rgba(180,220,255,0.7)',
        letterSpacing: '0.02em',
      }}>{label}</span>
      {sub && <span style={{
        display: 'block',
        fontFamily: "'Nunito', sans-serif",
        fontSize: '0.65rem',
        color: active ? 'rgba(91,184,255,0.7)' : 'rgba(180,220,255,0.3)',
        fontWeight: 600,
      }}>{sub}</span>}
    </button>
  );
}

// ── Toggle Switch ─────────────────────────────────────────────────
function Toggle({ options, value, onChange }: { options: { value: string; label: string }[]; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{
      display: 'flex',
      background: 'rgba(255,255,255,0.04)',
      borderRadius: 16,
      padding: 4,
      border: '1.5px solid rgba(91,184,255,0.12)',
      gap: 4,
    }}>
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          style={{
            flex: 1,
            padding: '12px 20px',
            borderRadius: 12,
            border: 'none',
            background: value === opt.value ? 'rgba(91,184,255,0.18)' : 'transparent',
            color: value === opt.value ? '#5bb8ff' : 'rgba(180,220,255,0.5)',
            fontFamily: "'Fredoka One', cursive",
            fontSize: '0.88rem',
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: value === opt.value ? '0 4px 16px rgba(91,184,255,0.2)' : 'none',
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ── Canvas Preview ────────────────────────────────────────────────
function CanvasPreview({ nfts, preset, wmPos, wmContent, mode }: {
  nfts: any[]; preset: keyof typeof CANVAS_PRESETS; wmPos: WMPosition; wmContent: WMContent; mode: Mode;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rendering, setRendering] = useState(false);

  useEffect(() => {
    if (!nfts.length || !canvasRef.current) return;
    setRendering(true);
    renderCanvas(canvasRef.current, nfts, preset, wmPos, wmContent, mode)
      .finally(() => setRendering(false));
  }, [nfts, preset, wmPos, wmContent, mode]);

  const { w, h } = CANVAS_PRESETS[preset];

  return (
    <div style={{
      position: 'relative',
      borderRadius: 20,
      overflow: 'hidden',
      border: '1.5px solid rgba(91,184,255,0.2)',
      boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(91,184,255,0.05)',
      background: '#0a1628',
    }}>
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          display: 'block',
          aspectRatio: `${w}/${h}`,
        }}
      />
      {rendering && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(10,22,40,0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 12,
        }}>
          <div style={{
            width: 40,
            height: 40,
            border: '3px solid rgba(91,184,255,0.2)',
            borderTopColor: '#5bb8ff',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }} />
          <p style={{
            fontFamily: "'Fredoka One', cursive",
            color: '#5bb8ff',
            fontSize: '0.85rem',
            letterSpacing: '0.08em',
          }}>Rendering preview…</p>
        </div>
      )}
      {!nfts.length && (
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 16,
        }}>
          <img src={LOGO_URL} alt="" style={{ height: 48, opacity: 0.15 }} />
          <p style={{
            fontFamily: "'Nunito', sans-serif",
            color: 'rgba(180,220,255,0.25)',
            fontSize: '0.9rem',
          }}>Load your whales to see preview</p>
        </div>
      )}
    </div>
  );
}

// ── Main Gallery ──────────────────────────────────────────────────
export default function Gallery() {
  const [address, setAddress] = useState('');
  const [nfts, setNfts] = useState<any[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [statusMsg, setStatusMsg] = useState('');
  const [mode, setMode] = useState<Mode>('grid');
  const [canvasPreset, setCanvasPreset] = useState<keyof typeof CANVAS_PRESETS>('X Post');
  const [wmPos, setWmPos] = useState<WMPosition>('Right Strip');
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
      await renderCanvas(canvas, nfts, canvasPreset, wmPos, wmContent, mode);
      canvas.toBlob(blob => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `whacky-whales-${mode}-${canvasPreset.toLowerCase().replace(/\s+/g, '-')}.png`;
        link.click();
        URL.revokeObjectURL(url);
      }, 'image/png');
    } finally { setGenerating(false); }
  }, [nfts, canvasPreset, wmPos, wmContent, mode]);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #0a1628 0%, #0d2137 50%, #081020 100%)',
      position: 'relative',
      color: '#fff',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fredoka+One&family=Nunito:wght@400;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input:focus { outline: none; border-color: #5bb8ff !important; box-shadow: 0 0 0 3px rgba(91,184,255,0.15) !important; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>

      <canvas ref={dlCanvasRef} style={{ display: 'none' }} />

      {/* Top accent line */}
      <div style={{
        position: 'fixed',
        top: 0, left: 0, right: 0,
        height: 3,
        background: 'linear-gradient(90deg, #5bb8ff, #2a8fd4, #5bb8ff)',
        zIndex: 100,
      }} />

      <Navbar />

      <div style={{
        maxWidth: 720,
        margin: '0 auto',
        padding: '100px 20px 120px',
        position: 'relative',
        zIndex: 2,
      }}>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{ textAlign: 'center', marginBottom: 40 }}
        >
          <img src={LOGO_URL} alt="" style={{ height: 52, objectFit: 'contain', marginBottom: 16, filter: 'drop-shadow(0 4px 12px rgba(91,184,255,0.3))' }} />
          <h1 style={{
            fontFamily: "'Fredoka One', cursive",
            fontSize: 'clamp(1.8rem, 5vw, 2.6rem)',
            color: '#fff',
            marginBottom: 10,
            textShadow: '0 2px 20px rgba(91,184,255,0.2)',
          }}>
            Your Whale Gallery
          </h1>
          <p style={{
            fontFamily: "'Nunito', sans-serif",
            color: 'rgba(180,220,255,0.55)',
            fontSize: '0.95rem',
            maxWidth: 420,
            margin: '0 auto',
            lineHeight: 1.6,
          }}>
            Paste your wallet, pick a layout, and export a clean grid or banner — branded, ready to post.
          </p>
          <p style={{
            fontFamily: "'Nunito', sans-serif",
            color: 'rgba(91,184,255,0.4)',
            fontSize: '0.78rem',
            marginTop: 8,
            letterSpacing: '0.04em',
          }}>
            ↓ no wallet connection, just your address. ↓
          </p>
        </motion.div>

        {/* Mode Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          style={{ marginBottom: 28 }}
        >
          <Toggle
            options={[{ value: 'grid', label: 'Grid Maker' }, { value: 'banner', label: 'Banner Maker' }]}
            value={mode}
            onChange={(v) => setMode(v as Mode)}
          />
        </motion.div>

        {/* Main Preview */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          style={{ marginBottom: 32 }}
        >
          <CanvasPreview
            nfts={nfts}
            preset={canvasPreset}
            wmPos={wmPos}
            wmContent={wmContent}
            mode={mode}
          />
        </motion.div>

        {/* Load Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          style={{
            background: 'rgba(255,255,255,0.04)',
            backdropFilter: 'blur(20px)',
            borderRadius: 20,
            padding: '24px 20px',
            marginBottom: 20,
            border: '1.5px solid rgba(91,184,255,0.12)',
          }}
        >
          <label style={{
            display: 'block',
            fontFamily: "'Fredoka One', cursive",
            fontSize: '0.7rem',
            letterSpacing: '0.25em',
            color: '#5bb8ff',
            textTransform: 'uppercase',
            marginBottom: 14,
          }}>
            Load Your Whales
          </label>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <input
              value={address}
              onChange={e => setAddress(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && detect()}
              placeholder="0x... or yourname.eth"
              style={{
                flex: 1,
                minWidth: 200,
                background: 'rgba(255,255,255,0.05)',
                border: '1.5px solid rgba(91,184,255,0.2)',
                borderRadius: 14,
                padding: '14px 18px',
                fontFamily: "'Nunito', sans-serif",
                fontSize: '0.92rem',
                color: '#fff',
                transition: 'all 0.2s',
              }}
            />
            <button
              onClick={detect}
              disabled={status === 'loading'}
              style={{
                background: status === 'loading'
                  ? 'rgba(91,184,255,0.12)'
                  : 'linear-gradient(135deg, #5bb8ff, #2a8fd4)',
                color: status === 'loading' ? '#5bb8ff' : '#0a1628',
                border: 'none',
                borderRadius: 14,
                padding: '14px 28px',
                fontFamily: "'Fredoka One', cursive",
                fontSize: '0.9rem',
                cursor: status === 'loading' ? 'not-allowed' : 'pointer',
                whiteSpace: 'nowrap',
                fontWeight: 700,
                transition: 'all 0.2s',
                boxShadow: status === 'loading' ? 'none' : '0 4px 20px rgba(91,184,255,0.3)',
              }}
            >
              {status === 'loading' ? statusMsg : 'Detect My Whales'}
            </button>
          </div>
          <AnimatePresence>
            {status === 'done' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}
              >
                <span style={{ color: '#4ecb71', fontSize: '1rem' }}>✓</span>
                <p style={{
                  fontFamily: "'Nunito', sans-serif",
                  color: '#4ecb71',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                }}>{statusMsg}</p>
              </motion.div>
            )}
            {status === 'error' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}
              >
                <span style={{ color: '#ff6b6b', fontSize: '1rem' }}>✕</span>
                <p style={{
                  fontFamily: "'Nunito', sans-serif",
                  color: '#ff6b6b',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                }}>{statusMsg}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Controls Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
        >
          {/* Canvas Size */}
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            borderRadius: 20,
            padding: '22px 20px',
            border: '1.5px solid rgba(91,184,255,0.1)',
          }}>
            <label style={{
              display: 'block',
              fontFamily: "'Fredoka One', cursive",
              fontSize: '0.7rem',
              letterSpacing: '0.25em',
              color: '#5bb8ff',
              textTransform: 'uppercase',
              marginBottom: 14,
            }}>
              Canvas Size
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {Object.entries(CANVAS_PRESETS).map(([name, { w, h }]) => (
                <OptBtn
                  key={name}
                  label={name}
                  sub={`${w}×${h}`}
                  active={canvasPreset === name}
                  onClick={() => setCanvasPreset(name as keyof typeof CANVAS_PRESETS)}
                />
              ))}
            </div>
          </div>

          {/* Watermark Position */}
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            borderRadius: 20,
            padding: '22px 20px',
            border: '1.5px solid rgba(91,184,255,0.1)',
          }}>
            <label style={{
              display: 'block',
              fontFamily: "'Fredoka One', cursive",
              fontSize: '0.7rem',
              letterSpacing: '0.25em',
              color: '#5bb8ff',
              textTransform: 'uppercase',
              marginBottom: 14,
            }}>
              Watermark Position
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {WM_POSITIONS.map(pos => (
                <OptBtn
                  key={pos}
                  label={pos}
                  sub={pos === 'Right Strip' ? 'vertical bar' : pos === 'Bottom Strip' ? 'horizontal bar' : pos === 'Corner' ? 'subtle mark' : 'overlay'}
                  active={wmPos === pos}
                  onClick={() => setWmPos(pos)}
                />
              ))}
            </div>
          </div>

          {/* Watermark Style */}
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            borderRadius: 20,
            padding: '22px 20px',
            border: '1.5px solid rgba(91,184,255,0.1)',
          }}>
            <label style={{
              display: 'block',
              fontFamily: "'Fredoka One', cursive",
              fontSize: '0.7rem',
              letterSpacing: '0.25em',
              color: '#5bb8ff',
              textTransform: 'uppercase',
              marginBottom: 14,
            }}>
              Watermark Style
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {([
                { value: 'both', label: 'Logo + Name', preview: <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><img src={LOGO_URL} style={{ height: 18 }} /><img src={NAME_URL} style={{ height: 12 }} /></span> },
                { value: 'logo-only', label: 'Logo Only', preview: <img src={LOGO_URL} style={{ height: 18 }} /> },
                { value: 'name-only', label: 'Name Only', preview: <img src={NAME_URL} style={{ height: 12 }} /> },
              ] as const).map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setWmContent(opt.value)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderRadius: 12,
                    border: wmContent === opt.value ? '2px solid #5bb8ff' : '1.5px solid rgba(91,184,255,0.12)',
                    background: wmContent === opt.value ? 'rgba(91,184,255,0.1)' : 'transparent',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  <span style={{
                    fontFamily: "'Fredoka One', cursive",
                    fontSize: '0.82rem',
                    color: wmContent === opt.value ? '#5bb8ff' : 'rgba(180,220,255,0.55)',
                  }}>{opt.label}</span>
                  <div style={{ opacity: wmContent === opt.value ? 1 : 0.5 }}>{opt.preview}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
            <button
              onClick={downloadBanner}
              disabled={!nfts.length || generating}
              style={{
                background: nfts.length && !generating
                  ? 'linear-gradient(135deg, #5bb8ff, #2a8fd4)'
                  : 'rgba(91,184,255,0.08)',
                color: nfts.length && !generating ? '#0a1628' : 'rgba(91,184,255,0.3)',
                border: 'none',
                borderRadius: 16,
                padding: '18px',
                fontFamily: "'Fredoka One', cursive",
                fontSize: '1.05rem',
                cursor: nfts.length && !generating ? 'pointer' : 'not-allowed',
                fontWeight: 700,
                transition: 'all 0.2s',
                boxShadow: nfts.length && !generating ? '0 6px 28px rgba(91,184,255,0.35)' : 'none',
                letterSpacing: '0.02em',
              }}
            >
              {generating ? 'Generating…' : 'Download PNG'}
            </button>
            <button
              onClick={() => { setNfts([]); setAddress(''); setStatus('idle'); setStatusMsg(''); }}
              style={{
                background: 'transparent',
                color: 'rgba(180,220,255,0.3)',
                border: '1.5px solid rgba(91,184,255,0.1)',
                borderRadius: 16,
                padding: '14px',
                fontFamily: "'Nunito', sans-serif",
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontWeight: 600,
              }}
            >
              clear all
            </button>
          </div>
        </motion.div>

        {/* Footer tag */}
        <p style={{
          textAlign: 'center',
          marginTop: 40,
          fontFamily: "'Nunito', sans-serif",
          color: 'rgba(180,220,255,0.2)',
          fontSize: '0.78rem',
          fontStyle: 'italic',
        }}>
          made by whales, for whales.
        </p>
      </div>

      <Footer />
    </div>
  );
}
