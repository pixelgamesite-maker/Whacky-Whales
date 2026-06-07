import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, useScroll, useTransform, AnimatePresence, useDragControls } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { COLLECTION_IMAGES, LINKS } from '../assets';

const SUPABASE_TRANSPARENT = 'https://psibadkdncspgikzzmnu.supabase.co/storage/v1/object/public/Whacky';
const OPENSEA_LOGO = 'https://psibadkdncspgikzzmnu.supabase.co/storage/v1/object/public/Whacky/Logo/OpenSea-logo.png';

// Handpicked whale IDs spread across the 10k collection for variety
const FLOATING_WHALE_IDS = [42, 388, 751, 1204, 1893, 2417, 3056, 3782, 4501, 5123, 5899, 6340, 7012, 7654, 8201, 8876, 9333, 9701, 420, 1337];
const FLOATING_WHALES = FLOATING_WHALE_IDS.map(id => `${SUPABASE_TRANSPARENT}/nft_${id}.png`);

// Grid whales — use first 20 from transparent bucket for the bouncing grid
const GRID_WHALE_IDS = [101, 202, 303, 404, 505, 606, 707, 808, 909, 1010, 1111, 1212, 1313, 1414, 1515, 1616, 1717, 1818, 1919, 2020];
const GRID_WHALES = GRID_WHALE_IDS.map(id => `${SUPABASE_TRANSPARENT}/nft_${id}.png`);

// ── Ocean particles ──────────────────────────────────────────────
function OceanParticles() {
  const particles = Array.from({ length: 14 }, (_, i) => ({
    id: i,
    size: 4 + (i * 7.3) % 12,
    left: 5 + (i * 17.1) % 90,
    delay: (i * 2.3) % 10,
    duration: 10 + (i * 3.1) % 10,
  }));
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
      {particles.map(p => (
        <motion.div
          key={p.id}
          style={{
            position: 'absolute', bottom: -20, left: `${p.left}%`,
            width: p.size, height: p.size, borderRadius: '50%',
            background: 'rgba(180,225,255,0.12)',
            border: '1px solid rgba(140,200,255,0.18)',
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

// ── Floating interactive whales ──────────────────────────────────
// Each whale drifts on its own sine-wave path; draggable; on mobile
// they respond to device orientation (gyroscope tilt).
function FloatingWhales() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [gyro, setGyro] = useState({ x: 0, y: 0 });
  const [sizes] = useState(() =>
    FLOATING_WHALES.map((_, i) => ({
      size: 56 + (i * 19.3) % 52,           // 56–108 px
      startX: 4 + (i * 4.7) % 88,           // % across container
      startY: 5 + (i * 5.1) % 85,           // % down container
      driftX: 18 + (i * 6.1) % 28,          // px drift amplitude X
      driftY: 14 + (i * 7.3) % 24,          // px drift amplitude Y
      duration: 6 + (i * 1.7) % 8,          // seconds per cycle
      delay: (i * 1.1) % 6,
      rotate: -12 + (i * 4.9) % 24,         // slight tilt
      rotateCycle: (i % 2 === 0 ? 8 : -8),  // wobble range
    }))
  );

  // Gyroscope
  useEffect(() => {
    const handler = (e: DeviceOrientationEvent) => {
      const x = Math.max(-1, Math.min(1, (e.gamma ?? 0) / 30));
      const y = Math.max(-1, Math.min(1, (e.beta  ?? 0) / 40));
      setGyro({ x, y });
    };
    window.addEventListener('deviceorientation', handler, true);
    return () => window.removeEventListener('deviceorientation', handler, true);
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute', inset: 0,
        pointerEvents: 'none',   // container doesn't block clicks — whales handle their own
        zIndex: 1,
        overflow: 'hidden',
      }}
    >
      {FLOATING_WHALES.map((src, i) => {
        const s = sizes[i];
        return (
          <motion.div
            key={i}
            drag
            dragMomentum
            dragElastic={0.18}
            whileDrag={{ scale: 1.18, zIndex: 20, filter: 'drop-shadow(0 8px 24px rgba(91,184,255,0.7))' }}
            style={{
              position: 'absolute',
              left: `${s.startX}%`,
              top:  `${s.startY}%`,
              width: s.size,
              height: s.size,
              cursor: 'grab',
              pointerEvents: 'auto',
              userSelect: 'none',
              touchAction: 'none',
            }}
            // Continuous swim animation
            animate={{
              x: [
                0,
                s.driftX + gyro.x * 20,
                -s.driftX / 2 + gyro.x * 20,
                0,
              ],
              y: [
                0,
                -s.driftY + gyro.y * 14,
                s.driftY / 2 + gyro.y * 14,
                0,
              ],
              rotate: [s.rotate, s.rotate + s.rotateCycle, s.rotate - s.rotateCycle / 2, s.rotate],
            }}
            transition={{
              duration: s.duration,
              delay: s.delay,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            whileHover={{
              scale: 1.14,
              filter: 'drop-shadow(0 6px 18px rgba(91,184,255,0.55))',
              transition: { duration: 0.2 },
            }}
          >
            <img
              src={src}
              alt=""
              draggable={false}
              style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
            />
          </motion.div>
        );
      })}
    </div>
  );
}

// ── HERO ─────────────────────────────────────────────────────────
function Hero() {
  return (
    <section style={{
      minHeight: '100vh',
      position: 'relative',
      zIndex: 2,
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
    }}>
      {/* Swimming whales live behind the text */}
      <FloatingWhales />

      {/* Copy — centred on mobile, left on desktop */}
      <div className="hero-text" style={{
        position: 'relative',
        zIndex: 3,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: 'clamp(100px, 12vw, 160px) clamp(24px, 6vw, 80px) 60px',
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
          style={{ fontFamily: "'Fredoka One', cursive", fontSize: 'clamp(3rem, 7vw, 6rem)', lineHeight: 1.0, color: '#fff', marginBottom: 28, textShadow: '0 4px 30px rgba(0,0,0,0.3)' }}
        >
          Whacky<br />Whales
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }}
          style={{ fontFamily: "'Nunito', sans-serif", fontSize: 'clamp(0.95rem, 1.8vw, 1.1rem)', color: 'rgba(180,220,255,0.8)', lineHeight: 1.75, maxWidth: 400, marginBottom: 44 }}
        >
          10,000 uniquely whacky NFTs swimming through the Ethereum blockchain. Collect your whale. Join the pod. Make waves.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
          style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}
        >
          {/* Get a Whale */}
          <a
            href={LINKS.opensea}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: 'linear-gradient(135deg, #5bb8ff, #2a8fd4)',
              color: '#0d2a4a',
              fontFamily: "'Fredoka One', cursive",
              fontSize: '1.1rem',
              padding: '14px 32px 14px 16px',
              borderRadius: 50,
              textDecoration: 'none',
              fontWeight: 700,
              boxShadow: '0 8px 30px rgba(91,184,255,0.35)',
              transition: 'transform 0.2s, box-shadow 0.2s',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 12,
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 14px 40px rgba(91,184,255,0.5)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 8px 30px rgba(91,184,255,0.35)'; }}
          >
            {/* Bigger OpenSea logo */}
            <span style={{
              width: 40, height: 40, borderRadius: '50%',
              background: 'rgba(13,42,74,0.22)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <img src={OPENSEA_LOGO} alt="OpenSea" style={{ width: 28, height: 28, objectFit: 'contain', display: 'block' }} />
            </span>
            Get a Whale
          </a>

          {/* Grid Maker */}
          <a
            href="/gallery"
            style={{
              background: 'rgba(255,255,255,0.08)',
              color: '#fff',
              fontFamily: "'Fredoka One', cursive",
              fontSize: '1.1rem',
              padding: '14px 32px',
              borderRadius: 50,
              textDecoration: 'none',
              border: '1.5px solid rgba(255,255,255,0.18)',
              transition: 'background 0.2s, transform 0.2s',
              display: 'inline-block',
              backdropFilter: 'blur(8px)',
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
    <div style={{
      background: 'rgba(255,255,255,0.05)',
      backdropFilter: 'blur(20px)',
      borderTop: '1px solid rgba(255,255,255,0.07)',
      borderBottom: '1px solid rgba(255,255,255,0.07)',
      padding: '32px 24px',
      position: 'relative', zIndex: 2,
    }}>
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
// Each column independently bounces its strip of whales up and down.
function BouncingColumn({ images, reverse = false, speed = 14, colIndex = 0 }:
  { images: string[]; reverse?: boolean; speed?: number; colIndex?: number }) {

  return (
    <div style={{ overflow: 'hidden', height: '100%', position: 'relative' }}>
      <motion.div
        animate={{
          y: reverse ? ['-50%', '0%'] : ['0%', '-50%'],
        }}
        transition={{
          duration: speed,
          repeat: Infinity,
          ease: 'linear',
          // Small bounce overlay: we nest a second motion to add the "bounce" feel
        }}
        style={{ display: 'flex', flexDirection: 'column', gap: 6 }}
      >
        {[...images, ...images].map((src, i) => (
          <motion.div
            key={i}
            // Each cell gets a subtle individual bounce offset
            animate={{
              y: [0, -(4 + (i % 3) * 3), 0, (3 + (i % 2) * 2), 0],
              scale: [1, 1.03, 1, 0.98, 1],
            }}
            transition={{
              duration: 2.2 + (i % 4) * 0.4,
              delay: (i * 0.18 + colIndex * 0.7) % 3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            whileHover={{ scale: 1.1, zIndex: 10, filter: 'drop-shadow(0 0 12px rgba(91,184,255,0.6))' }}
            style={{
              borderRadius: 14,
              overflow: 'hidden',
              flexShrink: 0,
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(0,20,50,0.35)',
            }}
          >
            <img
              src={src}
              alt=""
              loading="lazy"
              style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }}
            />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

// ── COLLECTION SECTION ───────────────────────────────────────────
function CollectionShowcase() {
  // Split 20 grid whales into 4 columns of 5
  const columns = [
    GRID_WHALES.slice(0, 5),
    GRID_WHALES.slice(5, 10),
    GRID_WHALES.slice(10, 15),
    GRID_WHALES.slice(15, 20),
  ];

  return (
    <section style={{ padding: '100px 24px 120px', position: 'relative', zIndex: 2 }}>
      <Wave />
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        <motion.div
          initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 48 }}
        >
          <div style={{ height: 2, width: 40, background: '#5bb8ff', borderRadius: 2 }} />
          <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: '0.72rem', letterSpacing: '0.32em', color: '#5bb8ff', textTransform: 'uppercase', fontWeight: 800 }}>
            The Collection
          </p>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 1fr', gap: 72, alignItems: 'center' }} className="showcase-layout">

          {/* LEFT — single animated bouncing grid (4 columns, continuous scroll + bounce) */}
          <motion.div
            initial={{ opacity: 0, x: -32 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.65 }}
          >
            <div style={{
              border: '3px solid #1a3a5c',
              borderRadius: 20,
              overflow: 'hidden',
              boxShadow: '0 0 0 1px rgba(91,184,255,0.12), 6px 6px 0 #0a2040, 0 30px 60px rgba(0,10,30,0.5)',
              background: 'rgba(8,20,42,0.7)',
              backdropFilter: 'blur(10px)',
            }}>
              {/* 4-column bouncing grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 6,
                padding: 6,
                height: 460,
                maskImage: 'linear-gradient(to bottom, transparent 0%, black 8%, black 92%, transparent 100%)',
                WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 8%, black 92%, transparent 100%)',
              }}>
                {columns.map((col, i) => (
                  <BouncingColumn
                    key={i}
                    images={col}
                    reverse={i % 2 === 1}
                    speed={12 + i * 2}
                    colIndex={i}
                  />
                ))}
              </div>

              {/* Footer bar */}
              <div style={{
                padding: '14px 20px',
                borderTop: '1px solid rgba(91,184,255,0.1)',
                background: 'rgba(5,15,30,0.9)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: '0.72rem', color: 'rgba(180,220,255,0.4)', letterSpacing: '0.16em', textTransform: 'uppercase' }}>
                  10,000 Supply · More revealed soon
                </p>
                <div style={{ display: 'flex', gap: 4 }}>
                  {[0,1,2].map(d => (
                    <div key={d} style={{ width: 6, height: 6, borderRadius: '50%', background: d === 0 ? '#5bb8ff' : 'rgba(91,184,255,0.25)' }} />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* RIGHT — text */}
          <motion.div
            initial={{ opacity: 0, x: 32 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.65 }}
            style={{ display: 'flex', flexDirection: 'column' }}
          >
            <h2 style={{ fontFamily: "'Fredoka One', cursive", fontSize: 'clamp(2.2rem,4vw,3.4rem)', color: '#fff', lineHeight: 1.1, marginBottom: 20 }}>
              Meet the<br />Whales
            </h2>
            <p style={{ fontFamily: "'Nunito', sans-serif", color: 'rgba(180,220,255,0.68)', fontSize: '1rem', lineHeight: 1.85, marginBottom: 38 }}>
              10,000 uniquely whacky characters swimming through the Ethereum ocean. Each one is algorithmically generated with hundreds of unique traits — no two are ever the same.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 44 }}>
              {[
                { title: 'Unique Traits', desc: 'Hundreds of hand-crafted accessories, backgrounds, and expressions.' },
                { title: 'True Ownership', desc: 'Your whale lives on Ethereum. Your wallet, your asset, forever.' },
                { title: 'Pod Benefits', desc: 'Holders get exclusive access to drops, events, and the community.' },
              ].map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.14 }}
                  style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}
                >
                  <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#5bb8ff', flexShrink: 0, marginTop: 7, boxShadow: '0 0 12px rgba(91,184,255,0.65)' }} />
                  <div>
                    <p style={{ fontFamily: "'Fredoka One', cursive", fontSize: '1.05rem', color: '#fff', marginBottom: 4 }}>{f.title}</p>
                    <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: '0.88rem', color: 'rgba(180,220,255,0.58)', lineHeight: 1.65 }}>{f.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* View on OpenSea — bigger logo */}
            <a
              href={LINKS.opensea}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 12, alignSelf: 'flex-start',
                background: 'linear-gradient(135deg, #5bb8ff, #2a8fd4)',
                color: '#0d2a4a',
                fontFamily: "'Fredoka One', cursive",
                fontSize: '1.1rem',
                padding: '14px 32px 14px 16px',
                borderRadius: 50,
                textDecoration: 'none',
                boxShadow: '0 8px 30px rgba(91,184,255,0.3)',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 14px 40px rgba(91,184,255,0.5)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 8px 30px rgba(91,184,255,0.3)'; }}
            >
              <span style={{
                width: 40, height: 40, borderRadius: '50%',
                background: 'rgba(13,42,74,0.22)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <img src={OPENSEA_LOGO} alt="OpenSea" style={{ width: 28, height: 28, objectFit: 'contain' }} />
              </span>
              View on OpenSea
            </a>
          </motion.div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .showcase-layout { grid-template-columns: 1fr !important; gap: 52px !important; }
        }
      `}</style>
    </section>
  );
}

// ── BANNER CTA ───────────────────────────────────────────────────
function BannerCTA() {
  return (
    <section style={{ padding: '0 24px 120px', position: 'relative', zIndex: 2 }}>
      <Wave opacity={0.04} />
      <motion.div
        initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
        style={{
          maxWidth: 860, margin: '0 auto',
          background: 'rgba(255,255,255,0.05)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(91,184,255,0.18)',
          borderRadius: 32, padding: 'clamp(48px,7vw,80px)',
          textAlign: 'center',
          boxShadow: '0 30px 80px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.09)',
          position: 'relative', overflow: 'hidden',
        }}
      >
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 420, height: 210, background: 'radial-gradient(ellipse, rgba(91,184,255,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: '0.75rem', letterSpacing: '0.3em', color: '#5bb8ff', textTransform: 'uppercase', fontWeight: 800, marginBottom: 16 }}>For Holders</p>
        <h2 style={{ fontFamily: "'Fredoka One', cursive", fontSize: 'clamp(1.8rem,4vw,3rem)', color: '#fff', marginBottom: 16, lineHeight: 1.1 }}>Show Off Your Pod</h2>
        <p style={{ fontFamily: "'Nunito', sans-serif", color: 'rgba(180,220,255,0.68)', fontSize: '1rem', maxWidth: 460, margin: '0 auto 40px', lineHeight: 1.75 }}>
          Generate a custom grid with all your Whacky Whales. Perfect for your X profile.
        </p>
        <a
          href="/gallery"
          style={{
            display: 'inline-block',
            background: 'linear-gradient(135deg, #5bb8ff, #2a8fd4)',
            color: '#0d2a4a', fontFamily: "'Fredoka One', cursive", fontSize: '1.05rem',
            padding: '16px 48px', borderRadius: 50, textDecoration: 'none',
            boxShadow: '0 8px 30px rgba(91,184,255,0.35)',
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}
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
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #0d2a4a 0%, #0e3460 30%, #0a2545 60%, #091e38 100%)',
      position: 'relative', overflow: 'hidden',
    }}>
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
      <BannerCTA />
      <Footer />
    </div>
  );
}
