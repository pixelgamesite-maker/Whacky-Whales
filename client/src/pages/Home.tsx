import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, animate } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { LINKS, COLLECTION_IMAGES } from '../assets'; // ← works if your bundler resolves .ts

const SUPABASE_TRANSPARENT = 'https://psibadkdncspgikzzmnu.supabase.co/storage/v1/object/public/Whacky';
const SUPABASE_BASE = 'https://psibadkdncspgikzzmnu.supabase.co/storage/v1/object/public/Whacky/Transparent';
const OPENSEA_LOGO = 'https://psibadkdncspgikzzmnu.supabase.co/storage/v1/object/public/Whacky/Logo/OpenSea-logo.png';

// 10 whales spread across the collection
const FLOATING_WHALE_IDS = [6446, 6447, 6448, 6449, 6450, 6451, 6452, 6453, 6454, 6455];
const FLOATING_WHALES = FLOATING_WHALE_IDS.map(id => `${SUPABASE_BASE}/nft_${id}.png`);

// 20 whales for the bouncing grid
const GRID_WHALE_IDS = [101, 303, 505, 707, 909, 1111, 1313, 1515, 1717, 1919,
                        2121, 2323, 2525, 2727, 2929, 3131, 3333, 3535, 3737, 3939];
const GRID_WHALES = GRID_WHALE_IDS.map(id => `${SUPABASE_TRANSPARENT}/nft_${id}.png`);

// 35 whales for the inline preview board
const PREVIEW_WHALE_IDS = [
  231, 317, 866, 1742, 2048, 3399, 4700, 5010, 6123, 7456,
  8001, 8899, 9101, 150, 600, 1100, 2200, 3300, 4400, 5500,
  6600, 7700, 8800, 9900, 450, 1450, 2450, 3450, 4450, 5450,
  6450, 7450, 8450, 9450, 750,
];
const PREVIEW_WHALES = PREVIEW_WHALE_IDS.map(id => `${SUPABASE_TRANSPARENT}/nft_${id}.png`);

// Deterministic positions — manually spread across the viewport so nothing clusters
const WHALE_CONFIGS = [
  { x: 8,  y: 10, size: 72,  driftX: 22, driftY: 18, dur: 7,  delay: 0   },
  { x: 78, y: 8,  size: 64,  driftX: 18, driftY: 22, dur: 9,  delay: 1.2 },
  { x: 55, y: 20, size: 80,  driftX: 25, driftY: 16, dur: 8,  delay: 0.5 },
  { x: 20, y: 45, size: 60,  driftX: 20, driftY: 24, dur: 10, delay: 2.1 },
  { x: 82, y: 40, size: 88,  driftX: 16, driftY: 20, dur: 7,  delay: 3.0 },
  { x: 40, y: 62, size: 68,  driftX: 24, driftY: 14, dur: 9,  delay: 1.7 },
  { x: 10, y: 72, size: 76,  driftX: 19, driftY: 21, dur: 8,  delay: 0.9 },
  { x: 68, y: 68, size: 56,  driftX: 22, driftY: 18, dur: 11, delay: 2.5 },
  { x: 30, y: 82, size: 84,  driftX: 17, driftY: 23, dur: 7,  delay: 1.4 },
  { x: 85, y: 78, size: 62,  driftX: 21, driftY: 17, dur: 10, delay: 3.3 },
];

// ── Ocean particles ──────────────────────────────────────────────
function OceanParticles() {
  const particles = Array.from({ length: 14 }, (_, i) => ({
    id: i, size: 4 + (i * 7.3) % 12,
    left: 5 + (i * 17.1) % 90,
    delay: (i * 2.3) % 10, duration: 10 + (i * 3.1) % 10,
  }));
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
      {particles.map(p => (
        <motion.div key={p.id}
          style={{
            position: 'absolute', bottom: -20, left: `${p.left}%`,
            width: p.size, height: p.size, borderRadius: '50%',
            background: 'rgba(180,225,255,0.12)', border: '1px solid rgba(140,200,255,0.18)',
          }}
          animate={{ y: [-20, -(800 + p.size * 10)], opacity: [0, 0.6, 0] }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: 'linear' }}
        />
      ))}
    </div>
  );
}

// ── Wave divider ─────────────────────────────────────────────────
function Wave({ flip = false, opacity = 0.06 }: { flip?: boolean; opacity?: number }) {
  return (
    <div style={{ width: '100%', lineHeight: 0, transform: flip ? 'scaleY(-1)' : 'none', pointerEvents: 'none' }}>
      <svg viewBox="0 0 1440 80" preserveAspectRatio="none" style={{ width: '100%', height: 56, display: 'block' }}>
        <path d="M0,40 C240,80 480,0 720,40 C960,80 1200,0 1440,40 L1440,80 L0,80 Z" fill={`rgba(255,255,255,${opacity})`} />
      </svg>
    </div>
  );
}

// ── Single draggable + gyro whale ───────────────────────────────
function FloatingWhale({ src, config, gyro }: {
  src: string;
  config: typeof WHALE_CONFIGS[0];
  gyro: { x: number; y: number };
}) {
  const swimX = useMotionValue(0);
  const swimY = useMotionValue(0);
  const springX = useSpring(swimX, { stiffness: 40, damping: 12 });
  const springY = useSpring(swimY, { stiffness: 40, damping: 12 });

  useEffect(() => {
    let cancelled = false;
    let start: number | null = null;

    function tick(now: number) {
      if (cancelled) return;
      if (start === null) start = now;
      const t = ((now - start) / 1000 + config.delay) % config.dur;
      const angle = (t / config.dur) * Math.PI * 2;
      swimX.set(Math.sin(angle) * config.driftX + gyro.x * 28);
      swimY.set(Math.cos(angle * 0.7) * config.driftY + gyro.y * 18);
      requestAnimationFrame(tick);
    }

    const raf = requestAnimationFrame(tick);
    return () => { cancelled = true; cancelAnimationFrame(raf); };
  }, [gyro.x, gyro.y]);

  return (
    <motion.div
      drag
      dragMomentum={false}
      dragElastic={0.12}
      whileDrag={{ scale: 1.2, zIndex: 30, filter: 'drop-shadow(0 8px 24px rgba(91,184,255,0.8))' }}
      whileHover={{ scale: 1.12, filter: 'drop-shadow(0 4px 16px rgba(91,184,255,0.55))' }}
      style={{
        position: 'absolute',
        left: `${config.x}%`,
        top:  `${config.y}%`,
        x: springX,
        y: springY,
        width: config.size,
        height: config.size,
        cursor: 'grab',
        touchAction: 'none',
        userSelect: 'none',
        zIndex: 4,
      }}
    >
      <img
        src={src}
        alt=""
        draggable={false}
        style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', pointerEvents: 'none' }}
      />
    </motion.div>
  );
}

// ── Floating whales container — handles gyro + iOS permission ───
function FloatingWhales() {
  const [gyro, setGyro] = useState({ x: 0, y: 0 });
  const [gyroGranted, setGyroGranted] = useState(false);

  const startGyro = () => {
    const handler = (e: DeviceOrientationEvent) => {
      setGyro({
        x: Math.max(-1, Math.min(1, (e.gamma ?? 0) / 30)),
        y: Math.max(-1, Math.min(1, (e.beta  ?? 0) / 40)),
      });
    };
    window.addEventListener('deviceorientation', handler, true);
    setGyroGranted(true);
  };

  useEffect(() => {
    const DoE = DeviceOrientationEvent as any;
    if (typeof DoE.requestPermission !== 'function') {
      startGyro();
    }
  }, []);

  const requestIosGyro = async () => {
    const DoE = DeviceOrientationEvent as any;
    if (typeof DoE.requestPermission === 'function') {
      const result = await DoE.requestPermission();
      if (result === 'granted') startGyro();
    }
  };

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 1, overflow: 'hidden', pointerEvents: 'none' }}>
      {FLOATING_WHALES.map((src, i) => (
        <div key={i} style={{ pointerEvents: 'auto' }}>
          <FloatingWhale src={src} config={WHALE_CONFIGS[i]} gyro={gyro} />
        </div>
      ))}

      {!gyroGranted && typeof (DeviceOrientationEvent as any).requestPermission === 'function' && (
        <button
          onClick={requestIosGyro}
          style={{
            position: 'absolute', bottom: 24, right: 24,
            background: 'rgba(91,184,255,0.15)',
            border: '1px solid rgba(91,184,255,0.4)',
            borderRadius: 50, padding: '10px 18px',
            color: '#5bb8ff', fontFamily: "'Nunito', sans-serif",
            fontSize: '0.8rem', fontWeight: 700,
            cursor: 'pointer', backdropFilter: 'blur(8px)',
            pointerEvents: 'auto', zIndex: 10,
          }}
        >
          Enable Tilt
        </button>
      )}
    </div>
  );
}

// ── HERO ─────────────────────────────────────────────────────────
function Hero() {
  return (
    <section style={{ minHeight: '100vh', position: 'relative', zIndex: 2, overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
      <FloatingWhales />

      <div className="hero-text" style={{
        position: 'relative', zIndex: 5,
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: 'clamp(100px,12vw,160px) clamp(24px,6vw,80px) 60px',
        maxWidth: 560,
      }}>
        <motion.p
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          style={{ fontFamily: "'Nunito', sans-serif", fontSize: '0.78rem', letterSpacing: '0.3em', color: '#5bb8ff', textTransform: 'uppercase', fontWeight: 800, marginBottom: 20 }}
        >
          Welcome to the Pod
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32, duration: 0.7 }}
          style={{ fontFamily: "'Fredoka One', cursive", fontSize: 'clamp(3rem,7vw,6rem)', lineHeight: 1.0, color: '#fff', marginBottom: 28, textShadow: '0 4px 30px rgba(0,0,0,0.5)' }}
        >
          Whacky<br />Whales
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }}
          style={{ fontFamily: "'Nunito', sans-serif", fontSize: 'clamp(0.95rem,1.8vw,1.1rem)', color: 'rgba(180,220,255,0.85)', lineHeight: 1.75, maxWidth: 400, marginBottom: 44 }}
        >
          10,000 uniquely whacky NFTs swimming through the Ethereum blockchain. Collect your whale. Join the pod. Make waves.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
          style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}
        >
          <a href={LINKS.opensea} target="_blank" rel="noopener noreferrer"
            style={{
              background: 'linear-gradient(135deg, #5bb8ff, #2a8fd4)', color: '#0d2a4a',
              fontFamily: "'Fredoka One', cursive", fontSize: '1.1rem',
              padding: '14px 32px 14px 16px', borderRadius: 50, textDecoration: 'none',
              boxShadow: '0 8px 30px rgba(91,184,255,0.35)', transition: 'transform 0.2s, box-shadow 0.2s',
              display: 'inline-flex', alignItems: 'center', gap: 12,
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 14px 40px rgba(91,184,255,0.5)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 8px 30px rgba(91,184,255,0.35)'; }}
          >
            <span style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(13,42,74,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <img src={OPENSEA_LOGO} alt="OpenSea" style={{ width: 28, height: 28, objectFit: 'contain' }} />
            </span>
            Get a Whale
          </a>

          <a href="/gallery"
            style={{
              background: 'rgba(255,255,255,0.08)', color: '#fff',
              fontFamily: "'Fredoka One', cursive", fontSize: '1.1rem',
              padding: '14px 32px', borderRadius: 50, textDecoration: 'none',
              border: '1.5px solid rgba(255,255,255,0.18)', transition: 'background 0.2s, transform 0.2s',
              display: 'inline-block', backdropFilter: 'blur(8px)',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.transform = ''; }}
          >
            Grid Maker
          </a>
        </motion.div>
      </div>

      <style>{`
        @media (max-width: 700px) {
          .hero-text { max-width: 100% !important; align-items: center; text-align: center; padding: 120px 24px 60px !important; }
        }
      `}</style>
    </section>
  );
}

// ── STATS BAR ────────────────────────────────────────────────────
function StatsBar() {
  const stats = [
    { value: '10,000', label: 'Total Supply' },
    { value: '1,561',  label: 'Unique Holders' },
    { value: 'ETH',    label: 'Blockchain' },
    { value: '100%',   label: 'On-Chain' },
  ];
  return (
    <div style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(255,255,255,0.07)', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '32px 24px', position: 'relative', zIndex: 2 }}>
      <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 24, textAlign: 'center' }}>
        {stats.map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
            <p style={{ fontFamily: "'Fredoka One', cursive", fontSize: 'clamp(1.4rem,3vw,2.2rem)', color: '#5bb8ff', marginBottom: 4 }}>{s.value}</p>
            <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: '0.78rem', color: 'rgba(180,220,255,0.5)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{s.label}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ── Bouncing grid column ─────────────────────────────────────────
function BouncingColumn({ images, reverse = false, speed = 14, colIndex = 0 }:
  { images: string[]; reverse?: boolean; speed?: number; colIndex?: number }) {
  return (
    <div style={{ overflow: 'hidden', height: '100%', position: 'relative' }}>
      <motion.div
        animate={{ y: reverse ? ['-50%', '0%'] : ['0%', '-50%'] }}
        transition={{ duration: speed, repeat: Infinity, ease: 'linear' }}
        style={{ display: 'flex', flexDirection: 'column', gap: 6 }}
      >
        {[...images, ...images].map((src, i) => (
          <motion.div key={i}
            animate={{ y: [0, -(4 + (i % 3) * 3), 0, (3 + (i % 2) * 2), 0], scale: [1, 1.03, 1, 0.98, 1] }}
            transition={{ duration: 2.2 + (i % 4) * 0.4, delay: (i * 0.18 + colIndex * 0.7) % 3, repeat: Infinity, ease: 'easeInOut' }}
            whileHover={{ scale: 1.1, zIndex: 10, filter: 'drop-shadow(0 0 12px rgba(91,184,255,0.6))' }}
            style={{ borderRadius: 14, overflow: 'hidden', flexShrink: 0, cursor: 'pointer', boxShadow: '0 4px 16px rgba(0,20,50,0.35)' }}
          >
            <img src={src} alt="" loading="lazy" style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }} />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

// ── COLLECTION SECTION ───────────────────────────────────────────
function CollectionShowcase() {
  const columns = [GRID_WHALES.slice(0,5), GRID_WHALES.slice(5,10), GRID_WHALES.slice(10,15), GRID_WHALES.slice(15,20)];
  return (
    <section style={{ padding: '100px 24px 120px', position: 'relative', zIndex: 2 }}>
      <Wave />
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 48 }}>
          <div style={{ height: 2, width: 40, background: '#5bb8ff', borderRadius: 2 }} />
          <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: '0.72rem', letterSpacing: '0.32em', color: '#5bb8ff', textTransform: 'uppercase', fontWeight: 800 }}>The Collection</p>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 1fr', gap: 72, alignItems: 'center' }} className="showcase-layout">
          <motion.div initial={{ opacity: 0, x: -32 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.65 }}>
            <div style={{ border: '3px solid #1a3a5c', borderRadius: 20, overflow: 'hidden', boxShadow: '0 0 0 1px rgba(91,184,255,0.12), 6px 6px 0 #0a2040, 0 30px 60px rgba(0,10,30,0.5)', background: 'rgba(8,20,42,0.7)', backdropFilter: 'blur(10px)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6, padding: 6, height: 460,
                maskImage: 'linear-gradient(to bottom, transparent 0%, black 8%, black 92%, transparent 100%)',
                WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 8%, black 92%, transparent 100%)' }}>
                {columns.map((col, i) => <BouncingColumn key={i} images={col} reverse={i % 2 === 1} speed={12 + i * 2} colIndex={i} />)}
              </div>
              <div style={{ padding: '14px 20px', borderTop: '1px solid rgba(91,184,255,0.1)', background: 'rgba(5,15,30,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: '0.72rem', color: 'rgba(180,220,255,0.4)', letterSpacing: '0.16em', textTransform: 'uppercase' }}>10,000 Supply · More revealed soon</p>
                <div style={{ display: 'flex', gap: 4 }}>
                  {[0,1,2].map(d => <div key={d} style={{ width: 6, height: 6, borderRadius: '50%', background: d === 0 ? '#5bb8ff' : 'rgba(91,184,255,0.25)' }} />)}
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 32 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.65 }} style={{ display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ fontFamily: "'Fredoka One', cursive", fontSize: 'clamp(2.2rem,4vw,3.4rem)', color: '#fff', lineHeight: 1.1, marginBottom: 20 }}>Meet the<br />Whales</h2>
            <p style={{ fontFamily: "'Nunito', sans-serif", color: 'rgba(180,220,255,0.68)', fontSize: '1rem', lineHeight: 1.85, marginBottom: 38 }}>
              10,000 uniquely whacky characters swimming through the Ethereum ocean. Each one is algorithmically generated with hundreds of unique traits — no two are ever the same.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 44 }}>
              {[
                { title: 'Unique Traits', desc: 'Hundreds of hand-crafted accessories, backgrounds, and expressions.' },
                { title: 'True Ownership', desc: 'Your whale lives on Ethereum. Your wallet, your asset, forever.' },
                { title: 'Pod Benefits', desc: 'Holders get exclusive access to drops, events, and the community.' },
              ].map((f, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.14 }}
                  style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                  <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#5bb8ff', flexShrink: 0, marginTop: 7, boxShadow: '0 0 12px rgba(91,184,255,0.65)' }} />
                  <div>
                    <p style={{ fontFamily: "'Fredoka One', cursive", fontSize: '1.05rem', color: '#fff', marginBottom: 4 }}>{f.title}</p>
                    <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: '0.88rem', color: 'rgba(180,220,255,0.58)', lineHeight: 1.65 }}>{f.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
            <a href={LINKS.opensea} target="_blank" rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 12, alignSelf: 'flex-start', background: 'linear-gradient(135deg, #5bb8ff, #2a8fd4)', color: '#0d2a4a', fontFamily: "'Fredoka One', cursive", fontSize: '1.1rem', padding: '14px 32px 14px 16px', borderRadius: 50, textDecoration: 'none', boxShadow: '0 8px 30px rgba(91,184,255,0.3)', transition: 'transform 0.2s, box-shadow 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 14px 40px rgba(91,184,255,0.5)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 8px 30px rgba(91,184,255,0.3)'; }}
            >
              <span style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(13,42,74,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <img src={OPENSEA_LOGO} alt="OpenSea" style={{ width: 28, height: 28, objectFit: 'contain' }} />
              </span>
              View on OpenSea
            </a>
          </motion.div>
        </div>
      </div>
      <style>{`@media (max-width: 900px) { .showcase-layout { grid-template-columns: 1fr !important; gap: 52px !important; } }`}</style>
    </section>
  );
}

// ── INLINE PREVIEW GRID ──────────────────────────────────────────
function PreviewGrid() {
  // 7 cols × 5 rows = 35 NFTs in a static inline board, sky-blue/gray tinted
  const cols = 7;
  return (
    <section style={{ padding: '0 24px 100px', position: 'relative', zIndex: 2 }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 32 }}>
          <div style={{ height: 2, width: 40, background: '#5bb8ff', borderRadius: 2 }} />
          <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: '0.72rem', letterSpacing: '0.32em', color: '#5bb8ff', textTransform: 'uppercase', fontWeight: 800 }}>Your Pod Preview</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 32 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
          style={{
            borderRadius: 24,
            border: '2px solid rgba(91,184,255,0.18)',
            overflow: 'hidden',
            boxShadow: '0 0 0 1px rgba(91,184,255,0.08), 0 24px 60px rgba(0,10,30,0.4)',
            background: 'linear-gradient(160deg, #b0cce4 0%, #8fb8d8 40%, #a8c8e0 100%)',
          }}
        >
          {/* Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            gap: 6,
            padding: 12,
          }}>
            {PREVIEW_WHALES.map((src, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.85 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.025, duration: 0.35 }}
                whileHover={{ scale: 1.08, zIndex: 10, filter: 'drop-shadow(0 4px 12px rgba(10,50,100,0.35))' }}
                style={{
                  borderRadius: 10,
                  overflow: 'hidden',
                  aspectRatio: '1',
                  background: 'rgba(255,255,255,0.18)',
                  cursor: 'pointer',
                  position: 'relative',
                }}
              >
                <img
                  src={src}
                  alt={`Whale #${PREVIEW_WHALE_IDS[i]}`}
                  loading="lazy"
                  style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                />
              </motion.div>
            ))}
          </div>

          {/* Footer bar */}
          <div style={{
            padding: '12px 20px',
            borderTop: '1px solid rgba(10,50,100,0.12)',
            background: 'rgba(10,40,80,0.12)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: '0.7rem', color: 'rgba(10,40,80,0.6)', letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 700 }}>
              whackywhales · @whackywhales
            </p>
            <div style={{ display: 'flex', gap: 4 }}>
              {[0,1,2].map(d => <div key={d} style={{ width: 6, height: 6, borderRadius: '50%', background: d === 0 ? '#2a6fa8' : 'rgba(10,60,120,0.25)' }} />)}
            </div>
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.4 }}
          style={{ fontFamily: "'Nunito', sans-serif", fontSize: '0.82rem', color: 'rgba(180,220,255,0.45)', textAlign: 'center', marginTop: 16 }}
        >
          Build your own grid with the <a href="/gallery" style={{ color: '#5bb8ff', textDecoration: 'none', fontWeight: 700 }}>Grid Maker →</a>
        </motion.p>
      </div>
    </section>
  );
}

// ── WHAT'S NEXT ──────────────────────────────────────────────────
function WhatsNext() {
  const items = [
    {
      title: 'Holder-Gated Access',
      body: 'Server access will be gated for holders, with whitelist raffles and collaborations with respected communities available exclusively to holders.',
    },
    {
      title: 'Community First',
      body: 'The team will continue showing up every day — connecting with the community, listening to feedback, and exploring every opportunity to create value for holders.',
    },
    {
      title: 'Whacky Whales Game',
      body: 'A Whacky Whales game is currently being considered. More details will be shared with the community when development plans start taking shape.',
    },
  ];

  return (
    <section style={{ padding: '0 24px 120px', position: 'relative', zIndex: 2 }}>
      <Wave opacity={0.04} />
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
          <div style={{ height: 2, width: 40, background: '#5bb8ff', borderRadius: 2 }} />
          <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: '0.72rem', letterSpacing: '0.32em', color: '#5bb8ff', textTransform: 'uppercase', fontWeight: 800 }}>Roadmap</p>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
          style={{ fontFamily: "'Fredoka One', cursive", fontSize: 'clamp(2rem,4vw,3rem)', color: '#fff', marginBottom: 56, lineHeight: 1.1 }}
        >
          What's Next?
        </motion.h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24 }} className="whats-next-grid">
          {items.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.14, duration: 0.55 }}
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1.5px solid rgba(91,184,255,0.12)',
                borderRadius: 24,
                padding: '36px 28px',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* subtle glow in corner */}
              <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'radial-gradient(circle, rgba(91,184,255,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
              <h3 style={{ fontFamily: "'Fredoka One', cursive", fontSize: '1.25rem', color: '#fff', marginBottom: 12 }}>{item.title}</h3>
              <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: '0.92rem', color: 'rgba(180,220,255,0.62)', lineHeight: 1.75 }}>{item.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
      <style>{`@media (max-width: 800px) { .whats-next-grid { grid-template-columns: 1fr !important; } }`}</style>
    </section>
  );
}

// ── TOOLS GRID ───────────────────────────────────────────────────
function ToolsGrid() {
  const [gifFrameIndex, setGifFrameIndex] = useState(9);

  useEffect(() => {
    const interval = setInterval(() => {
      setGifFrameIndex((prev) => (prev >= 19 ? 9 : prev + 1));
    }, 400);
    return () => clearInterval(interval);
  }, []);

  const glassPanel = {
    position: 'relative' as const,
    height: '100%',
    background: 'rgba(15, 23, 42, 0.78)',
    backdropFilter: 'blur(14px)',
    WebkitBackdropFilter: 'blur(14px)',
    padding: '36px 28px 28px',
    display: 'flex',
    flexDirection: 'column' as const,
    minHeight: 280,
    zIndex: 2,
  };

  return (
    <section style={{ padding: '0 24px 120px', position: 'relative', zIndex: 2 }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
          <div style={{ height: 2, width: 40, background: '#5bb8ff', borderRadius: 2 }} />
          <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: '0.72rem', letterSpacing: '0.32em', color: '#5bb8ff', textTransform: 'uppercase', fontWeight: 800 }}>Whale Tools</p>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
          style={{ fontFamily: "'Fredoka One', cursive", fontSize: 'clamp(2rem,4vw,3rem)', color: '#fff', marginBottom: 48, lineHeight: 1.1 }}
        >
          Holder Toolkit
        </motion.h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 20 }} className="tools-grid">

          {/* Grid Maker — 1.png to 10.png background */}
          <motion.a
            href="/gallery"
            initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0 }}
            className="tool-card"
            style={{
              display: 'block', textDecoration: 'none', borderRadius: 24, overflow: 'hidden',
              border: '1.5px solid rgba(91,184,255,0.22)',
              position: 'relative', cursor: 'pointer',
              boxShadow: '0 8px 32px rgba(0,10,30,0.3)',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 16px 48px rgba(91,184,255,0.2)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px rgba(0,10,30,0.3)'; }}
          >
            <div style={{ position: 'absolute', inset: 0, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gridTemplateRows: 'repeat(2, 1fr)', gap: 2, opacity: 0.4 }}>
              {COLLECTION_IMAGES.slice(0, 10).map((src, i) => (
                <img key={i} src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              ))}
            </div>
            <div style={glassPanel}>
              <div style={{ display: 'inline-block', background: 'rgba(91,184,255,0.15)', border: '1px solid rgba(91,184,255,0.3)', borderRadius: 50, padding: '4px 14px', marginBottom: 16 }}>
                <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: '0.65rem', letterSpacing: '0.18em', color: '#5bb8ff', fontWeight: 800, textTransform: 'uppercase' }}>Live</span>
              </div>
              <h3 style={{ fontFamily: "'Fredoka One', cursive", fontSize: '1.45rem', color: '#fff', marginBottom: 10 }}>Grid Maker</h3>
              <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: '0.88rem', color: 'rgba(180,220,255,0.75)', lineHeight: 1.65, flexGrow: 1 }}>
                Generate a custom grid of your entire pod. Perfect for your X banner or profile.
              </p>
              <div style={{ marginTop: 20 }}>
                <span style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.9rem', color: '#5bb8ff', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  Open tool →
                </span>
              </div>
            </div>
          </motion.a>

          {/* GIF Maker — 10.png to 20.png cycling background */}
          <motion.a
            href="/gif-maker"
            initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.12 }}
            className="tool-card"
            style={{
              display: 'block', textDecoration: 'none', borderRadius: 24, overflow: 'hidden',
              border: '1.5px solid rgba(255, 159, 67, 0.22)',
              position: 'relative', cursor: 'pointer',
              boxShadow: '0 8px 32px rgba(0,10,30,0.3)',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 16px 48px rgba(255,159,67,0.2)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px rgba(0,10,30,0.3)'; }}
          >
            <div style={{ position: 'absolute', inset: 0, opacity: 0.4 }}>
              <img src={COLLECTION_IMAGES[gifFrameIndex]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'opacity 0.3s' }} />
            </div>
            <div style={glassPanel}>
              <div style={{ display: 'inline-block', background: 'rgba(255, 159, 67, 0.15)', border: '1px solid rgba(255, 159, 67, 0.3)', borderRadius: 50, padding: '4px 14px', marginBottom: 16 }}>
                <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: '0.65rem', letterSpacing: '0.18em', color: '#ff9f43', fontWeight: 800, textTransform: 'uppercase' }}>Live</span>
              </div>
              <h3 style={{ fontFamily: "'Fredoka One', cursive", fontSize: '1.45rem', color: '#fff', marginBottom: 10 }}>Whacky GIF Maker</h3>
              <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: '0.88rem', color: 'rgba(180,220,255,0.75)', lineHeight: 1.65, flexGrow: 1 }}>
                Animate your pod. Create shareable GIFs straight from your wallet.
              </p>
              <div style={{ marginTop: 20 }}>
                <span style={{ display: 'inline-block', background: '#fff', color: '#111', fontFamily: "'Fredoka One', cursive", fontSize: '0.85rem', padding: '10px 18px', borderRadius: 12, textDecoration: 'none' }}>
                  Open tool →
                </span>
              </div>
            </div>
          </motion.a>

          {/* Meme Generator — upside down image background */}
          <motion.a
            href="/meme-generator"
            initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.18 }}
            className="tool-card"
            style={{
              display: 'block', textDecoration: 'none', borderRadius: 24, overflow: 'hidden',
              border: '1.5px solid rgba(168, 85, 247, 0.22)',
              position: 'relative', cursor: 'pointer',
              boxShadow: '0 8px 32px rgba(0,10,30,0.3)',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 16px 48px rgba(168,85,247,0.2)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px rgba(0,10,30,0.3)'; }}
          >
            <div style={{ position: 'absolute', inset: 0, opacity: 0.4 }}>
              <img src={COLLECTION_IMAGES[14]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transform: 'scaleY(-1)' }} />
            </div>
            <div style={glassPanel}>
              <div style={{ display: 'inline-block', background: 'rgba(168, 85, 247, 0.15)', border: '1px solid rgba(168, 85, 247, 0.3)', borderRadius: 50, padding: '4px 14px', marginBottom: 16 }}>
                <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: '0.65rem', letterSpacing: '0.18em', color: '#a855f7', fontWeight: 800, textTransform: 'uppercase' }}>In Development</span>
              </div>
              <h3 style={{ fontFamily: "'Fredoka One', cursive", fontSize: '1.45rem', color: '#fff', marginBottom: 10 }}>Meme Generator</h3>
              <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: '0.88rem', color: 'rgba(180,220,255,0.75)', lineHeight: 1.65, flexGrow: 1 }}>
                Create hilarious memes with your Whacky Whales. Flip, caption, and share.
              </p>
              <div style={{ marginTop: 20 }}>
                <span style={{ display: 'inline-block', background: '#fff', color: '#111', fontFamily: "'Fredoka One', cursive", fontSize: '0.85rem', padding: '10px 18px', borderRadius: 12, textDecoration: 'none' }}>
                  Open tool →
                </span>
              </div>
            </div>
          </motion.a>

          {/* Whacky Pod — Pod.png background */}
          <motion.a
            href="/whacky-pod"
            initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.24 }}
            className="tool-card"
            style={{
              display: 'block', textDecoration: 'none', borderRadius: 24, overflow: 'hidden',
              border: '1.5px solid rgba(34, 197, 94, 0.22)',
              position: 'relative', cursor: 'pointer',
              boxShadow: '0 8px 32px rgba(0,10,30,0.3)',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 16px 48px rgba(34,197,94,0.2)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px rgba(0,10,30,0.3)'; }}
          >
            <div style={{ position: 'absolute', inset: 0, opacity: 0.4 }}>
              <img src="/Pod.png" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            </div>
            <div style={glassPanel}>
              <div style={{ display: 'inline-block', background: 'rgba(34, 197, 94, 0.15)', border: '1px solid rgba(34, 197, 94, 0.3)', borderRadius: 50, padding: '4px 14px', marginBottom: 16 }}>
                <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: '0.65rem', letterSpacing: '0.18em', color: '#22c55e', fontWeight: 800, textTransform: 'uppercase' }}>In Development</span>
              </div>
              <h3 style={{ fontFamily: "'Fredoka One', cursive", fontSize: '1.45rem', color: '#fff', marginBottom: 10 }}>Whacky Pod</h3>
              <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: '0.88rem', color: 'rgba(180,220,255,0.75)', lineHeight: 1.65, flexGrow: 1 }}>
                The Whacky Whales game. Details dropping to the community as plans take shape.
              </p>
              <div style={{ marginTop: 20 }}>
                <span style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.9rem', color: '#22c55e', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  Preview →
                </span>
              </div>
            </div>
          </motion.a>

        </div>
      </div>
      <style>{`
        @media (max-width: 1024px) { .tools-grid { grid-template-columns: repeat(2, 1fr) !important; } }
        @media (max-width: 800px) { .tools-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </section>
  );
}

// ── BANNER CTA ───────────────────────────────────────────────────
function BannerCTA() {
  return (
    <section style={{ padding: '0 24px 120px', position: 'relative', zIndex: 2 }}>
      <Wave opacity={0.04} />
      <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
        style={{ maxWidth: 860, margin: '0 auto', background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(24px)', border: '1px solid rgba(91,184,255,0.18)', borderRadius: 32, padding: 'clamp(48px,7vw,80px)', textAlign: 'center', boxShadow: '0 30px 80px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.09)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 420, height: 210, background: 'radial-gradient(ellipse, rgba(91,184,255,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: '0.75rem', letterSpacing: '0.3em', color: '#5bb8ff', textTransform: 'uppercase', fontWeight: 800, marginBottom: 16 }}>For Holders</p>
        <h2 style={{ fontFamily: "'Fredoka One', cursive", fontSize: 'clamp(1.8rem,4vw,3rem)', color: '#fff', marginBottom: 16, lineHeight: 1.1 }}>Show Off Your Pod</h2>
        <p style={{ fontFamily: "'Nunito', sans-serif", color: 'rgba(180,220,255,0.68)', fontSize: '1rem', maxWidth: 460, margin: '0 auto 40px', lineHeight: 1.75 }}>
          Generate a custom grid with all your Whacky Whales. Perfect for your X profile.
        </p>
        <a href="/gallery"
          style={{ display: 'inline-block', background: 'linear-gradient(135deg, #5bb8ff, #2a8fd4)', color: '#0d2a4a', fontFamily: "'Fredoka One', cursive", fontSize: '1.05rem', padding: '16px 48px', borderRadius: 50, textDecoration: 'none', boxShadow: '0 8px 30px rgba(91,184,255,0.35)', transition: 'transform 0.2s, box-shadow 0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 14px 40px rgba(91,184,255,0.5)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 8px 30px rgba(91,184,255,0.35)'; }}
        >
          Open Grid Maker
        </a>
      </motion.div>
    </section>
  );
}

// ── MAIN ─────────────────────────────────────────────────────────
export default function Home() {
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #0d2a4a 0%, #0e3460 30%, #0a2545 60%, #091e38 100%)', position: 'relative', overflow: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fredoka+One&family=Nunito:wght@400;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0d2a4a; }
        ::selection { background: #5bb8ff; color: #0d2a4a; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #0d2a4a; }
        ::-webkit-scrollbar-thumb { background: rgba(91,184,255,0.4); border-radius: 3px; }
      `}</style>
      <OceanParticles />
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #5bb8ff, #2a8fd4, #5bb8ff)', zIndex: 100 }} />
      <Navbar />
      <Hero />
      <StatsBar />
      <CollectionShowcase />
      <PreviewGrid />
      <WhatsNext />
      <ToolsGrid />
      <BannerCTA />
      <Footer />
    </div>
  );
}
