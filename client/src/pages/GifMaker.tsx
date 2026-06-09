import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { LOGO_URL } from '../assets';

// ── Config ────────────────────────────────────────────────────────
const ALCHEMY_API_KEY = import.meta.env.VITE_ALCHEMY_API_KEY as string;
const CONTRACT_ADDRESS = import.meta.env.VITE_NFT_CONTRACT_ADDRESS as string;
const ALCHEMY_BASE = `https://eth-mainnet.g.alchemy.com/nft/v3/${ALCHEMY_API_KEY}`;
const SIZE_MAP = {
  small:  640,
  medium: 800,
  large:  1000,
} as const;

type SizeKey = keyof typeof SIZE_MAP;

function resolveImage(nft: any): string {
  const raw = nft.image?.cachedUrl || nft.image?.originalUrl || '';
  return raw.startsWith('ipfs://') ? 'https://ipfs.io/ipfs/' + raw.slice(7) : raw;
}

// ── Main Component ────────────────────────────────────────────────
export default function GifMaker() {
  const [frames, setFrames]             = useState<string[]>([]);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [speed, setSpeed]               = useState(400);
  const [size, setSize]                 = useState<SizeKey>('medium');
  const [isPlaying, setIsPlaying]       = useState(false);
  const [address, setAddress]           = useState('');
  const [status, setStatus]             = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [statusMsg, setStatusMsg]       = useState('');
  const [downloadUrl, setDownloadUrl]   = useState('');
  const [generating, setGenerating]     = useState(false);

  const intervalRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileInputRef  = useRef<HTMLInputElement>(null);

  // ── Playback ──────────────────────────────────────────────────
  const play = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setCurrentFrame(prev => (prev + 1) % frames.length);
    }, speed);
  }, [frames.length, speed]);

  useEffect(() => {
    if (isPlaying && frames.length > 0) {
      play();
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isPlaying, play, frames.length]);

  // ── Detect NFTs ───────────────────────────────────────────────
  const detect = useCallback(async () => {
    const addr = address.trim();
    if (!addr) return;
    setFrames([]);
    setDownloadUrl('');
    setCurrentFrame(0);
    setIsPlaying(false);
    setStatus('loading');
    setStatusMsg('detecting your whales…');

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
        setStatusMsg(`loading ${all.length} whale${all.length !== 1 ? 's' : ''}…`);
      } while (pageKey);

      if (!all.length) {
        setStatus('error');
        setStatusMsg('No Whacky Whales found for this address.');
        return;
      }

      const urls = all.map(nft => resolveImage(nft)).filter(Boolean);
      setFrames(urls);
      setCurrentFrame(0);
      setIsPlaying(true);
      setStatus('done');
      setStatusMsg(`${all.length} whale${all.length > 1 ? 's' : ''} loaded!`);
    } catch (e: any) {
      setStatus('error');
      setStatusMsg('Failed to fetch NFTs. Check address or try again.');
    }
  }, [address]);

  // ── File Upload ───────────────────────────────────────────────
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const urls = Array.from(files).map(f => URL.createObjectURL(f));
    setFrames(urls);
    setCurrentFrame(0);
    setIsPlaying(true);
    setStatus('done');
    setStatusMsg(`${urls.length} image${urls.length > 1 ? 's' : ''} loaded!`);
    setDownloadUrl('');
  };

  // ── Clear ─────────────────────────────────────────────────────
  const handleClear = () => {
    setFrames([]);
    setCurrentFrame(0);
    setIsPlaying(false);
    setAddress('');
    setStatus('idle');
    setStatusMsg('');
    setDownloadUrl('');
  };

  // ── Make GIF ──────────────────────────────────────────────────
  const handleMakeGif = () => {
    if (!frames.length) return;
    setGenerating(true);
    setDownloadUrl('');

    import('gifshot').then((gifshot) => {
      gifshot.default.createGIF(
        {
          images: frames,
          gifWidth:      SIZE_MAP[size],
          gifHeight:     SIZE_MAP[size],
          interval:      speed / 1000,
          numFrames:     frames.length,
          frameDuration: speed / 1000,
          text:          '',
          showFrameText: false,
        },
        (obj: { error: boolean; errorMsg?: string; image: string }) => {
          setGenerating(false);
          if (!obj.error) {
            setDownloadUrl(obj.image);
          } else {
            setStatus('error');
            setStatusMsg(`GIF failed: ${obj.errorMsg || 'unknown error'}`);
          }
        }
      );
    });
  };

  const loopLength = frames.length ? ((frames.length * speed) / 1000).toFixed(1) : '0.0';
  const estSize    = Math.round(frames.length * 15.6);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #0a1628 0%, #0d2137 50%, #081020 100%)',
      color: '#fff',
      position: 'relative',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fredoka+One&family=Nunito:wght@400;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input:focus { outline: none; border-color: #5bb8ff !important; box-shadow: 0 0 0 3px rgba(91,184,255,0.15) !important; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
      `}</style>

      {/* Top accent bar */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #5bb8ff, #2a8fd4, #5bb8ff)', zIndex: 100 }} />

      <Navbar />

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '100px 20px 120px', position: 'relative', zIndex: 2 }}>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{ textAlign: 'center', marginBottom: 40 }}
        >
          <img src={LOGO_URL} alt="" style={{ height: 52, marginBottom: 16, filter: 'drop-shadow(0 4px 12px rgba(91,184,255,0.3))' }} />
          <h1 style={{ fontFamily: "'Fredoka One', cursive", fontSize: 'clamp(1.8rem, 5vw, 2.6rem)', color: '#fff', marginBottom: 10, textShadow: '0 2px 20px rgba(91,184,255,0.2)' }}>
            GIF Maker
          </h1>
          <p style={{ fontFamily: "'Nunito', sans-serif", color: 'rgba(180,220,255,0.55)', fontSize: '0.95rem', maxWidth: 420, margin: '0 auto', lineHeight: 1.6 }}>
            Turn your Whacky Whales into a clean looping GIF.
          </p>
          <p style={{ fontFamily: "'Nunito', sans-serif", color: 'rgba(91,184,255,0.4)', fontSize: '0.78rem', marginTop: 8, letterSpacing: '0.04em' }}>
            ↓ paste wallet or upload images. ↓
          </p>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 }}>

          {/* ── Preview Panel ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            style={{
              background: 'rgba(255,255,255,0.03)',
              borderRadius: 24,
              border: '1.5px solid rgba(91,184,255,0.15)',
              padding: 24,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 420,
              boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
            }}
          >
            {/* Frame display */}
            <div style={{
              width: '100%',
              aspectRatio: '1',
              borderRadius: 18,
              overflow: 'hidden',
              border: '1.5px solid rgba(91,184,255,0.2)',
              background: 'linear-gradient(160deg, #a8c8e0 0%, #8fb8d4 45%, #b0cce4 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            }}>
              <AnimatePresence mode="wait">
                {frames.length > 0 ? (
                  <motion.img
                    key={currentFrame}
                    src={frames[currentFrame]}
                    alt={`Frame ${currentFrame + 1}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.1 }}
                    style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                  />
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{ textAlign: 'center', padding: 24 }}
                  >
                    <img src={LOGO_URL} alt="" style={{ height: 48, opacity: 0.2, marginBottom: 14 }} />
                    <p style={{ fontFamily: "'Nunito', sans-serif", color: 'rgba(10,40,80,0.5)', fontSize: '0.88rem', fontWeight: 700 }}>
                      no whales loaded
                    </p>
                    <p style={{ fontFamily: "'Nunito', sans-serif", color: 'rgba(10,40,80,0.35)', fontSize: '0.75rem', marginTop: 4 }}>
                      load a wallet or upload images
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Frame counter */}
            {frames.length > 0 && (
              <p style={{ fontFamily: "'Nunito', sans-serif", color: 'rgba(91,184,255,0.5)', fontSize: '0.78rem', marginTop: 14, letterSpacing: '0.06em' }}>
                frame {currentFrame + 1} / {frames.length}
              </p>
            )}

            {/* Play/Pause toggle */}
            {frames.length > 0 && (
              <button
                onClick={() => setIsPlaying(p => !p)}
                style={{
                  marginTop: 12,
                  background: isPlaying ? 'rgba(91,184,255,0.12)' : 'rgba(91,184,255,0.2)',
                  border: '1.5px solid rgba(91,184,255,0.3)',
                  borderRadius: 12,
                  padding: '8px 24px',
                  color: '#5bb8ff',
                  fontFamily: "'Fredoka One', cursive",
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  letterSpacing: '0.06em',
                  transition: 'all 0.2s',
                }}
              >
                {isPlaying ? '⏸ pause' : '▶ play'}
              </button>
            )}

            {/* Download GIF */}
            <AnimatePresence>
              {downloadUrl && (
                <motion.a
                  href={downloadUrl}
                  download="whacky-whales.gif"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  style={{
                    display: 'block',
                    width: '100%',
                    marginTop: 16,
                    background: 'linear-gradient(135deg, #5bb8ff, #2a8fd4)',
                    color: '#0a1628',
                    border: 'none',
                    borderRadius: 16,
                    padding: '16px',
                    fontFamily: "'Fredoka One', cursive",
                    fontSize: '1rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textAlign: 'center',
                    textDecoration: 'none',
                    boxShadow: '0 6px 28px rgba(91,184,255,0.35)',
                    letterSpacing: '0.04em',
                  }}
                >
                  ↓ download gif
                </motion.a>
              )}
            </AnimatePresence>
          </motion.div>

          {/* ── Controls Panel ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.5 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
          >

            {/* Load Wallet */}
            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 20, padding: '22px 20px', border: '1.5px solid rgba(91,184,255,0.1)' }}>
              <label style={{ display: 'block', fontFamily: "'Fredoka One', cursive", fontSize: '0.7rem', letterSpacing: '0.25em', color: '#5bb8ff', textTransform: 'uppercase', marginBottom: 14 }}>
                Load Your Whales
              </label>

              <input
                type="text"
                placeholder="0x… or yourname.eth"
                value={address}
                onChange={e => setAddress(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && detect()}
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1.5px solid rgba(91,184,255,0.15)',
                  borderRadius: 12,
                  padding: '13px 16px',
                  color: '#fff',
                  fontFamily: "'Nunito', sans-serif",
                  fontSize: '0.85rem',
                  marginBottom: 10,
                  transition: 'border-color 0.2s',
                }}
              />

              <button
                onClick={detect}
                disabled={status === 'loading' || !address.trim()}
                style={{
                  width: '100%',
                  background: address.trim() && status !== 'loading'
                    ? 'linear-gradient(135deg, #5bb8ff, #2a8fd4)'
                    : 'rgba(91,184,255,0.08)',
                  color: address.trim() && status !== 'loading' ? '#0a1628' : 'rgba(91,184,255,0.3)',
                  border: 'none',
                  borderRadius: 14,
                  padding: '14px',
                  fontFamily: "'Fredoka One', cursive",
                  fontSize: '0.95rem',
                  cursor: address.trim() && status !== 'loading' ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s',
                  boxShadow: address.trim() && status !== 'loading' ? '0 6px 28px rgba(91,184,255,0.25)' : 'none',
                  letterSpacing: '0.03em',
                  marginBottom: 10,
                }}
              >
                {status === 'loading' ? 'detecting…' : 'detect my whales'}
              </button>

              {/* Status message */}
              <AnimatePresence>
                {statusMsg && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    style={{
                      fontFamily: "'Nunito', sans-serif",
                      fontSize: '0.8rem',
                      color: status === 'error' ? '#ff6b8a' : status === 'done' ? '#5bb8ff' : 'rgba(180,220,255,0.5)',
                      marginBottom: 10,
                      animation: status === 'loading' ? 'pulse 1.2s ease-in-out infinite' : 'none',
                    }}
                  >
                    {statusMsg}
                  </motion.p>
                )}
              </AnimatePresence>

              {/* Divider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '4px 0 10px' }}>
                <div style={{ flex: 1, height: 1, background: 'rgba(91,184,255,0.1)' }} />
                <span style={{ fontFamily: "'Nunito', sans-serif", color: 'rgba(180,220,255,0.3)', fontSize: '0.78rem' }}>or</span>
                <div style={{ flex: 1, height: 1, background: 'rgba(91,184,255,0.1)' }} />
              </div>

              <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1.5px solid rgba(91,184,255,0.15)',
                  borderRadius: 14,
                  padding: '13px',
                  color: 'rgba(180,220,255,0.6)',
                  fontFamily: "'Fredoka One', cursive",
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  letterSpacing: '0.03em',
                }}
              >
                upload images
              </button>
              <input ref={fileInputRef} type="file" multiple accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
            </div>

            {/* GIF Size */}
            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 20, padding: '22px 20px', border: '1.5px solid rgba(91,184,255,0.1)' }}>
              <label style={{ display: 'block', fontFamily: "'Fredoka One', cursive", fontSize: '0.7rem', letterSpacing: '0.25em', color: '#5bb8ff', textTransform: 'uppercase', marginBottom: 14 }}>
                GIF Size (Square)
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {(Object.keys(SIZE_MAP) as SizeKey[]).map(s => (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    style={{
                      padding: '14px 8px',
                      borderRadius: 14,
                      border: size === s ? '2px solid #5bb8ff' : '1.5px solid rgba(91,184,255,0.15)',
                      background: size === s ? 'rgba(91,184,255,0.12)' : 'rgba(255,255,255,0.03)',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.2s',
                      boxShadow: size === s ? '0 0 24px rgba(91,184,255,0.15)' : 'none',
                    }}
                  >
                    <span style={{ display: 'block', fontFamily: "'Fredoka One', cursive", fontSize: '0.85rem', color: size === s ? '#5bb8ff' : 'rgba(180,220,255,0.7)', textTransform: 'capitalize' }}>{s}</span>
                    <span style={{ display: 'block', fontFamily: "'Nunito', sans-serif", fontSize: '0.65rem', color: size === s ? 'rgba(91,184,255,0.7)' : 'rgba(180,220,255,0.3)', marginTop: 2, fontWeight: 600 }}>{SIZE_MAP[s]}px</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Speed */}
            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 20, padding: '22px 20px', border: '1.5px solid rgba(91,184,255,0.1)' }}>
              <label style={{ display: 'block', fontFamily: "'Fredoka One', cursive", fontSize: '0.7rem', letterSpacing: '0.25em', color: '#5bb8ff', textTransform: 'uppercase', marginBottom: 14 }}>
                Speed — {speed}ms per frame
              </label>
              <input
                type="range" min="100" max="1000" step="50" value={speed}
                onChange={e => setSpeed(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#5bb8ff', height: 6, cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: '0.7rem', color: 'rgba(180,220,255,0.3)' }}>Fast</span>
                <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: '0.7rem', color: 'rgba(180,220,255,0.3)' }}>Slow</span>
              </div>
            </div>

            {/* Stats */}
            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 20, padding: '20px', border: '1.5px solid rgba(91,184,255,0.1)' }}>
              {[
                { label: 'Frames',      value: frames.length,     color: '#fff' },
                { label: 'Loop Length', value: `${loopLength}s`,  color: '#fff' },
                { label: 'Est. Size',   value: `${estSize} KB`,   color: '#5bb8ff' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.7rem', letterSpacing: '0.18em', color: 'rgba(180,220,255,0.4)', textTransform: 'uppercase' }}>{label}</span>
                  <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: '0.9rem', color, fontWeight: 700 }}>{value}</span>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                onClick={handleMakeGif}
                disabled={generating || frames.length === 0}
                style={{
                  background: frames.length && !generating
                    ? 'linear-gradient(135deg, #5bb8ff, #2a8fd4)'
                    : 'rgba(91,184,255,0.08)',
                  color: frames.length && !generating ? '#0a1628' : 'rgba(91,184,255,0.3)',
                  border: 'none',
                  borderRadius: 16,
                  padding: '18px',
                  fontFamily: "'Fredoka One', cursive",
                  fontSize: '1.05rem',
                  cursor: frames.length && !generating ? 'pointer' : 'not-allowed',
                  fontWeight: 700,
                  transition: 'all 0.2s',
                  boxShadow: frames.length && !generating ? '0 6px 28px rgba(91,184,255,0.35)' : 'none',
                  letterSpacing: '0.03em',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                }}
              >
                {generating && (
                  <div style={{ width: 18, height: 18, border: '2.5px solid rgba(10,22,40,0.3)', borderTopColor: '#0a1628', borderRadius: '50%', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
                )}
                {generating ? 'generating…' : 'make gif'}
              </button>

              <button
                onClick={handleClear}
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
        </div>

        <p style={{ textAlign: 'center', marginTop: 48, fontFamily: "'Nunito', sans-serif", color: 'rgba(180,220,255,0.2)', fontSize: '0.78rem', fontStyle: 'italic' }}>
          made by whales, for whales.
        </p>
      </div>

      <Footer />
    </div>
  );
}
