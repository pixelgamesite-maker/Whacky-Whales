import { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const SUPABASE = 'https://aitxwwtybpgpqxsvlxzm.supabase.co/storage/v1/object/public/Images/Whacky';
const COLLECTION_COUNT = 30;

// ── Bubble background ────────────────────────────────────────────
function Bubbles() {
  const bubbles = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    size: 20 + Math.random() * 60,
    left: Math.random() * 100,
    delay: Math.random() * 8,
    duration: 6 + Math.random() * 8,
    opacity: 0.06 + Math.random() * 0.12,
  }));

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
      {bubbles.map(b => (
        <motion.div
          key={b.id}
          style={{
            position: 'absolute',
            bottom: -100,
            left: `${b.left}%`,
            width: b.size,
            height: b.size,
            borderRadius: '50%',
            border: `2px solid rgba(100,180,255,${b.opacity * 2})`,
            background: `radial-gradient(circle at 35% 35%, rgba(255,255,255,${b.opacity}), rgba(100,180,255,${b.opacity * 0.5}))`,
          }}
          animate={{ y: [-20, -window.innerHeight - 200], opacity: [0, b.opacity * 8, 0] }}
          transition={{ duration: b.duration, delay: b.delay, repeat: Infinity, ease: 'linear' }}
        />
      ))}
    </div>
  );
}

// ── Floating whale emoji ─────────────────────────────────────────
function FloatingWhale({ style }: { style?: React.CSSProperties }) {
  return (
    <motion.div
      animate={{ y: [0, -18, 0], rotate: [-3, 3, -3] }}
      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      style={{ fontSize: '3rem', display: 'inline-block', ...style }}
    >
      🐋
    </motion.div>
  );
}

// ── Collection preview grid ──────────────────────────────────────
function CollectionPreview() {
  const [hovered, setHovered] = useState<number | null>(null);
  const previews = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <section style={{ padding: '100px 24px', position: 'relative', zIndex: 2 }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          style={{ textAlign: 'center', marginBottom: 64 }}
        >
          <p style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.85rem', letterSpacing: '0.3em', color: '#5bb8ff', textTransform: 'uppercase', marginBottom: 16 }}>
            🌊 The Pod
          </p>
          <h2 style={{ fontFamily: "'Fredoka One', cursive", fontSize: 'clamp(2.2rem, 5vw, 3.5rem)', color: '#0d2a4a', lineHeight: 1.1, marginBottom: 20 }}>
            Meet the Whales
          </h2>
          <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: '1.1rem', color: '#4a7fa5', maxWidth: 520, margin: '0 auto', lineHeight: 1.7 }}>
            10,000 uniquely whacky characters swimming through the Ethereum ocean. Each one different. Each one yours.
          </p>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16 }}>
          {previews.map((n, i) => (
            <motion.a
              key={n}
              href="https://opensea.io/collection/whackywhales"
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05, duration: 0.5 }}
              onMouseEnter={() => setHovered(n)}
              onMouseLeave={() => setHovered(null)}
              style={{
                display: 'block',
                borderRadius: 20,
                overflow: 'hidden',
                boxShadow: hovered === n
                  ? '0 20px 60px rgba(91,184,255,0.4), 0 0 0 3px #5bb8ff'
                  : '0 4px 20px rgba(13,42,74,0.12)',
                transform: hovered === n ? 'translateY(-8px) scale(1.03)' : 'translateY(0) scale(1)',
                transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                textDecoration: 'none',
                background: '#e8f4ff',
              }}
            >
              <img
                src={`${SUPABASE}/Collection/${n}.png`}
                alt={`Whacky Whale #${n}`}
                style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }}
                loading="lazy"
              />
            </motion.a>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{ textAlign: 'center', marginTop: 52 }}
        >
          <a
            href="https://opensea.io/collection/whackywhales"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              background: 'linear-gradient(135deg, #2081e2, #1567c7)',
              color: '#fff',
              fontFamily: "'Fredoka One', cursive",
              fontSize: '1.1rem',
              letterSpacing: '0.04em',
              padding: '16px 40px',
              borderRadius: 50,
              textDecoration: 'none',
              boxShadow: '0 8px 30px rgba(32,129,226,0.4)',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 14px 40px rgba(32,129,226,0.5)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(32,129,226,0.4)'; }}
          >
            <img src="https://storage.googleapis.com/opensea-static/Logomark/Logomark-Blue.png" alt="" style={{ width: 24, height: 24, filter: 'brightness(10)' }} />
            View Full Collection on OpenSea
          </a>
        </motion.div>
      </div>
    </section>
  );
}

// ── About section ────────────────────────────────────────────────
function About() {
  const cards = [
    { emoji: '🎨', title: '10,000 Unique', desc: 'Every whale is hand-crafted with unique traits, accessories, and backgrounds. No two are the same.' },
    { emoji: '🌊', title: 'On Ethereum', desc: 'Fully on-chain on Ethereum mainnet. Your whale, your wallet, your asset — forever.' },
    { emoji: '🤝', title: 'Join the Pod', desc: 'Holders get access to exclusive drops, community events, and the Whacky Whales Discord.' },
    { emoji: '🖼️', title: 'Banner Maker', desc: 'Show off your whales with our custom banner generator. Perfect for your X profile.' },
  ];

  return (
    <section style={{ padding: '80px 24px', position: 'relative', zIndex: 2 }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{ textAlign: 'center', marginBottom: 60 }}
        >
          <h2 style={{ fontFamily: "'Fredoka One', cursive", fontSize: 'clamp(2rem, 4vw, 3rem)', color: '#0d2a4a', marginBottom: 16 }}>
            Why Whacky Whales?
          </h2>
          <p style={{ fontFamily: "'Nunito', sans-serif", color: '#4a7fa5', fontSize: '1.05rem', maxWidth: 480, margin: '0 auto' }}>
            Because being ordinary is overrated. Dive in.
          </p>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24 }}>
          {cards.map((c, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -6 }}
              style={{
                background: 'rgba(255,255,255,0.8)',
                backdropFilter: 'blur(20px)',
                borderRadius: 24,
                padding: '36px 28px',
                boxShadow: '0 4px 30px rgba(13,42,74,0.08)',
                border: '1px solid rgba(91,184,255,0.2)',
              }}
            >
              <div style={{ fontSize: '2.5rem', marginBottom: 16 }}>{c.emoji}</div>
              <h3 style={{ fontFamily: "'Fredoka One', cursive", fontSize: '1.3rem', color: '#0d2a4a', marginBottom: 10 }}>{c.title}</h3>
              <p style={{ fontFamily: "'Nunito', sans-serif", color: '#5a7a99', lineHeight: 1.65, fontSize: '0.95rem' }}>{c.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Banner CTA ───────────────────────────────────────────────────
function BannerCTA() {
  return (
    <section style={{ padding: '80px 24px', position: 'relative', zIndex: 2 }}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          style={{
            background: 'linear-gradient(135deg, #0d2a4a 0%, #1a5276 50%, #0d2a4a 100%)',
            borderRadius: 32,
            padding: 'clamp(40px, 6vw, 72px)',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 30px 80px rgba(13,42,74,0.35)',
          }}
        >
          {/* Decorative bubbles inside card */}
          {[...Array(6)].map((_, i) => (
            <div key={i} style={{
              position: 'absolute',
              width: 60 + i * 30,
              height: 60 + i * 30,
              borderRadius: '50%',
              border: '1px solid rgba(91,184,255,0.12)',
              top: `${10 + i * 15}%`,
              left: `${-5 + i * 18}%`,
              pointerEvents: 'none',
            }} />
          ))}

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: '3rem', marginBottom: 20 }}>🐋✨</div>
            <h2 style={{ fontFamily: "'Fredoka One', cursive", fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', color: '#fff', marginBottom: 16, lineHeight: 1.15 }}>
              Show Off Your Pod
            </h2>
            <p style={{ fontFamily: "'Nunito', sans-serif", color: 'rgba(180,220,255,0.85)', fontSize: '1.05rem', maxWidth: 460, margin: '0 auto 36px', lineHeight: 1.7 }}>
              Already holding? Generate a custom banner or grid with all your Whacky Whales and flex it on your X profile.
            </p>
            <a
              href="/gallery"
              style={{
                display: 'inline-block',
                background: 'linear-gradient(135deg, #5bb8ff, #3a9de0)',
                color: '#0d2a4a',
                fontFamily: "'Fredoka One', cursive",
                fontSize: '1.15rem',
                letterSpacing: '0.03em',
                padding: '16px 44px',
                borderRadius: 50,
                textDecoration: 'none',
                boxShadow: '0 8px 30px rgba(91,184,255,0.4)',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              🎨 Open Banner Maker
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ── Hero ─────────────────────────────────────────────────────────
function Hero() {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 500], [0, 120]);

  return (
    <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 2, padding: '120px 24px 80px' }}>
      <motion.div style={{ y }} className="hero-parallax" />

      <div style={{ textAlign: 'center', maxWidth: 780 }}>
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <FloatingWhale />
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.9rem', letterSpacing: '0.3em', color: '#5bb8ff', textTransform: 'uppercase', marginTop: 24, marginBottom: 16 }}
        >
          Welcome to the Pod 🌊
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.7 }}
          style={{
            fontFamily: "'Fredoka One', cursive",
            fontSize: 'clamp(3.5rem, 12vw, 7rem)',
            lineHeight: 1,
            background: 'linear-gradient(135deg, #0d2a4a 0%, #1a6fa8 50%, #5bb8ff 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: 8,
            letterSpacing: '-0.01em',
          }}
        >
          Whacky
        </motion.h1>
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.7 }}
          style={{
            fontFamily: "'Fredoka One', cursive",
            fontSize: 'clamp(3.5rem, 12vw, 7rem)',
            lineHeight: 1,
            background: 'linear-gradient(135deg, #5bb8ff 0%, #1a6fa8 50%, #0d2a4a 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: 32,
            letterSpacing: '-0.01em',
          }}
        >
          Whales
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.7 }}
          style={{ fontFamily: "'Nunito', sans-serif", fontSize: 'clamp(1rem, 2.5vw, 1.2rem)', color: '#3a6080', lineHeight: 1.75, maxWidth: 560, margin: '0 auto 48px' }}
        >
          10,000 uniquely whacky NFTs swimming through the Ethereum blockchain. Collect your whale. Join the pod. Make waves.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}
        >
          <a
            href="https://opensea.io/collection/whackywhales"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              background: 'linear-gradient(135deg, #0d2a4a, #1a5276)',
              color: '#fff',
              fontFamily: "'Fredoka One', cursive",
              fontSize: '1.05rem',
              padding: '15px 36px',
              borderRadius: 50,
              textDecoration: 'none',
              boxShadow: '0 8px 30px rgba(13,42,74,0.3)',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 14px 40px rgba(13,42,74,0.4)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(13,42,74,0.3)'; }}
          >
            🐳 Get a Whale
          </a>
          <a
            href="/gallery"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              background: 'rgba(255,255,255,0.7)',
              backdropFilter: 'blur(12px)',
              color: '#0d2a4a',
              fontFamily: "'Fredoka One', cursive",
              fontSize: '1.05rem',
              padding: '15px 36px',
              borderRadius: 50,
              textDecoration: 'none',
              border: '1.5px solid rgba(91,184,255,0.4)',
              boxShadow: '0 4px 20px rgba(91,184,255,0.15)',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            🎨 Banner Maker
          </a>
        </motion.div>

        {/* Scroll hint */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          style={{ marginTop: 72, color: 'rgba(91,184,255,0.5)', fontSize: '1.5rem' }}
        >
          ↓
        </motion.div>
      </div>
    </section>
  );
}

// ── Main ─────────────────────────────────────────────────────────
export default function Home() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #e8f6ff 0%, #c8e8ff 20%, #a8d8f0 50%, #d0eeff 80%, #e8f6ff 100%)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fredoka+One&family=Nunito:wght@400;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #e8f6ff; }
        ::selection { background: #5bb8ff; color: #fff; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #e8f6ff; }
        ::-webkit-scrollbar-thumb { background: rgba(91,184,255,0.5); border-radius: 3px; }
      `}</style>

      <Bubbles />

      {/* Ocean wave decoration top */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: 4,
        background: 'linear-gradient(90deg, #5bb8ff, #3a9de0, #5bb8ff)',
        zIndex: 100,
      }} />

      <Navbar />
      <Hero />
      <About />
      <CollectionPreview />
      <BannerCTA />
      <Footer />
    </div>
  );
}
