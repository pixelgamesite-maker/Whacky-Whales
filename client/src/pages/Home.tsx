import { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { COLLECTION_IMAGES, LINKS } from '../assets';

// ── Animated vertical strip of whale images ──────────────────────
function WhaleStrip({ images, reverse = false, speed = 18 }: { images: string[]; reverse?: boolean; speed?: number }) {
  return (
    <div style={{ overflow: 'hidden', height: '100%', position: 'relative' }}>
      <motion.div
        animate={{ y: reverse ? ['-50%', '0%'] : ['0%', '-50%'] }}
        transition={{ duration: speed, repeat: Infinity, ease: 'linear' }}
        style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
      >
        {[...images, ...images].map((src, i) => (
          <motion.div
            key={i}
            whileHover={{ scale: 1.05, zIndex: 10 }}
            style={{
              borderRadius: 16,
              overflow: 'hidden',
              boxShadow: '0 8px 32px rgba(0,30,60,0.35)',
              flexShrink: 0,
            }}
          >
            <img src={src} alt="" style={{ width: '100%', display: 'block', aspectRatio: '1', objectFit: 'cover' }} loading="lazy" />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

// ── Animated single bouncing column ─────────────────────────────
function BouncingColumn() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setCurrent(p => (p + 1) % COLLECTION_IMAGES.length), 2200);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: 320, margin: '0 auto' }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ y: -280, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0, scale: 0.95 }}
          transition={{
            y: { type: 'spring', stiffness: 260, damping: 18, mass: 0.9 },
            opacity: { duration: 0.2 },
          }}
          style={{
            borderRadius: 24,
            overflow: 'hidden',
            boxShadow: '0 24px 80px rgba(0,30,80,0.45), 0 0 0 1px rgba(91,184,255,0.2)',
          }}
        >
          <img
            src={COLLECTION_IMAGES[current]}
            alt="Whacky Whale"
            style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }}
          />
        </motion.div>
      </AnimatePresence>
      {/* Bounce shadow */}
      <motion.div
        key={current + '-shadow'}
        initial={{ scaleX: 0.3, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 0.25 }}
        transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.05 }}
        style={{
          position: 'absolute',
          bottom: -16,
          left: '10%',
          right: '10%',
          height: 20,
          background: 'radial-gradient(ellipse, rgba(0,30,80,0.6) 0%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(6px)',
        }}
      />
    </div>
  );
}

// ── Ocean wave SVG ───────────────────────────────────────────────
function OceanWave({ flip = false, color = 'rgba(255,255,255,0.06)' }: { flip?: boolean; color?: string }) {
  return (
    <div style={{ width: '100%', lineHeight: 0, transform: flip ? 'scaleY(-1)' : 'none' }}>
      <svg viewBox="0 0 1440 80" preserveAspectRatio="none" style={{ width: '100%', height: 60, display: 'block' }}>
        <path d="M0,40 C240,80 480,0 720,40 C960,80 1200,0 1440,40 L1440,80 L0,80 Z" fill={color} />
      </svg>
    </div>
  );
}

// ── Floating particle bubbles ────────────────────────────────────
function OceanParticles() {
  const particles = Array.from({ length: 14 }, (_, i) => ({
    id: i,
    size: 4 + Math.random() * 12,
    left: 5 + Math.random() * 90,
    delay: Math.random() * 10,
    duration: 8 + Math.random() * 10,
  }));

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
      {particles.map(p => (
        <motion.div
          key={p.id}
          style={{
            position: 'absolute',
            bottom: -20,
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            borderRadius: '50%',
            background: 'rgba(180,225,255,0.15)',
            border: '1px solid rgba(140,200,255,0.2)',
          }}
          animate={{ y: [-20, -(window.innerHeight + 40)], opacity: [0, 0.7, 0] }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: 'linear' }}
        />
      ))}
    </div>
  );
}

// ── Hero section ─────────────────────────────────────────────────
function Hero() {
  const strips = [
    COLLECTION_IMAGES.slice(0, 8),
    COLLECTION_IMAGES.slice(8, 16),
    COLLECTION_IMAGES.slice(16, 24),
    COLLECTION_IMAGES.slice(24, 30),
  ];

  return (
    <section style={{
      minHeight: '100vh',
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      position: 'relative',
      zIndex: 2,
      overflow: 'hidden',
    }}>
      {/* Left — text */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: 'clamp(100px, 12vw, 160px) clamp(24px, 6vw, 80px) 60px',
      }}>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{
            fontFamily: "'Nunito', sans-serif",
            fontSize: '0.8rem',
            letterSpacing: '0.3em',
            color: '#5bb8ff',
            textTransform: 'uppercase',
            fontWeight: 800,
            marginBottom: 20,
          }}
        >
          Welcome to the Pod
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.7 }}
          style={{
            fontFamily: "'Fredoka One', cursive",
            fontSize: 'clamp(3rem, 7vw, 6rem)',
            lineHeight: 1.0,
            color: '#fff',
            marginBottom: 28,
            textShadow: '0 4px 30px rgba(0,0,0,0.3)',
          }}
        >
          Whacky<br />Whales
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55 }}
          style={{
            fontFamily: "'Nunito', sans-serif",
            fontSize: 'clamp(0.95rem, 1.8vw, 1.1rem)',
            color: 'rgba(180,220,255,0.8)',
            lineHeight: 1.75,
            maxWidth: 400,
            marginBottom: 44,
          }}
        >
          10,000 uniquely whacky NFTs swimming through the Ethereum blockchain. Collect your whale. Join the pod. Make waves.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}
        >
          <a
            href={LINKS.opensea}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: 'linear-gradient(135deg, #5bb8ff, #2a8fd4)',
              color: '#0d2a4a',
              fontFamily: "'Fredoka One', cursive",
              fontSize: '1rem',
              padding: '14px 32px',
              borderRadius: 50,
              textDecoration: 'none',
              fontWeight: 700,
              boxShadow: '0 8px 30px rgba(91,184,255,0.35)',
              transition: 'transform 0.2s, box-shadow 0.2s',
              display: 'inline-block',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 14px 40px rgba(91,184,255,0.5)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 8px 30px rgba(91,184,255,0.35)'; }}
          >
            Get a Whale
          </a>
          <a
            href="/gallery"
            style={{
              background: 'rgba(255,255,255,0.08)',
              color: '#fff',
              fontFamily: "'Fredoka One', cursive",
              fontSize: '1rem',
              padding: '14px 32px',
              borderRadius: 50,
              textDecoration: 'none',
              border: '1.5px solid rgba(255,255,255,0.2)',
              transition: 'background 0.2s, transform 0.2s',
              display: 'inline-block',
              backdropFilter: 'blur(8px)',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.transform = ''; }}
          >
            Banner Maker
          </a>
        </motion.div>
      </div>

      {/* Right — scrolling strips */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 8,
        padding: '80px 24px 80px 8px',
        height: '100vh',
        maskImage: 'linear-gradient(to bottom, transparent 0%, black 12%, black 88%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 12%, black 88%, transparent 100%)',
      }}>
        {strips.map((imgs, i) => (
          <WhaleStrip key={i} images={imgs} reverse={i % 2 === 1} speed={14 + i * 3} />
        ))}
      </div>

      {/* Mobile: show bouncing single image instead */}
      <style>{`
        @media (max-width: 700px) {
          .hero-strips { display: none !important; }
          .hero-text { grid-column: 1 / -1 !important; padding: 120px 24px 60px !important; align-items: center; text-align: center; }
          .hero-text p:first-child { margin: 0 auto; }
        }
      `}</style>
    </section>
  );
}

// ── Stats bar ────────────────────────────────────────────────────
function StatsBar() {
  const stats = [
    { value: '10,000', label: 'Total Supply' },
    { value: '1,561', label: 'Unique Holders' },
    { value: 'ETH', label: 'Blockchain' },
    { value: '100%', label: 'On-Chain' },
  ];

  return (
    <div style={{
      background: 'rgba(255,255,255,0.05)',
      backdropFilter: 'blur(20px)',
      borderTop: '1px solid rgba(255,255,255,0.08)',
      borderBottom: '1px solid rgba(255,255,255,0.08)',
      padding: '32px 24px',
      position: 'relative',
      zIndex: 2,
    }}>
      <div style={{
        maxWidth: 900,
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 24,
        textAlign: 'center',
      }}>
        {stats.map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
          >
            <p style={{ fontFamily: "'Fredoka One', cursive", fontSize: 'clamp(1.4rem, 3vw, 2.2rem)', color: '#5bb8ff', marginBottom: 4 }}>{s.value}</p>
            <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: '0.78rem', color: 'rgba(180,220,255,0.55)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{s.label}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ── Collection showcase — animated single bouncing image ─────────
function CollectionShowcase() {
  return (
    <section style={{ padding: '120px 24px', position: 'relative', zIndex: 2 }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}>

        {/* Bouncing image */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <BouncingColumn />
        </motion.div>

        {/* Text */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: '0.75rem', letterSpacing: '0.3em', color: '#5bb8ff', textTransform: 'uppercase', fontWeight: 800, marginBottom: 16 }}>
            The Collection
          </p>
          <h2 style={{ fontFamily: "'Fredoka One', cursive", fontSize: 'clamp(2rem, 4vw, 3.2rem)', color: '#fff', lineHeight: 1.1, marginBottom: 20 }}>
            Meet the Whales
          </h2>
          <p style={{ fontFamily: "'Nunito', sans-serif", color: 'rgba(180,220,255,0.7)', fontSize: '1rem', lineHeight: 1.8, marginBottom: 36 }}>
            10,000 uniquely whacky characters swimming through the Ethereum ocean. Each one is algorithmically generated with hundreds of unique traits — no two are ever the same.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 40 }}>
            {[
              { title: 'Unique Traits', desc: 'Hundreds of hand-crafted accessories, backgrounds, and expressions.' },
              { title: 'True Ownership', desc: 'Your whale lives on Ethereum. Your wallet, your asset, forever.' },
              { title: 'Pod Benefits', desc: 'Holders get exclusive access to drops, events, and the community.' },
            ].map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}
              >
                <div style={{
                  width: 8, height: 8, borderRadius: '50%', background: '#5bb8ff',
                  flexShrink: 0, marginTop: 8,
                  boxShadow: '0 0 10px rgba(91,184,255,0.6)',
                }} />
                <div>
                  <p style={{ fontFamily: "'Fredoka One', cursive", fontSize: '1rem', color: '#fff', marginBottom: 4 }}>{f.title}</p>
                  <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: '0.88rem', color: 'rgba(180,220,255,0.6)', lineHeight: 1.6 }}>{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <a
            href={LINKS.opensea}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-block',
              background: 'linear-gradient(135deg, #5bb8ff, #2a8fd4)',
              color: '#0d2a4a',
              fontFamily: "'Fredoka One', cursive",
              fontSize: '1rem',
              padding: '14px 36px',
              borderRadius: 50,
              textDecoration: 'none',
              boxShadow: '0 8px 30px rgba(91,184,255,0.3)',
              transition: 'transform 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; }}
          >
            View on OpenSea
          </a>
        </motion.div>
      </div>

      <style>{`
        @media (max-width: 700px) {
          .showcase-grid { grid-template-columns: 1fr !important; gap: 48px !important; }
        }
      `}</style>
    </section>
  );
}

// ── Banner CTA ───────────────────────────────────────────────────
function BannerCTA() {
  return (
    <section style={{ padding: '0 24px 120px', position: 'relative', zIndex: 2 }}>
      <OceanWave color="rgba(255,255,255,0.04)" />
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        style={{
          maxWidth: 860,
          margin: '0 auto',
          background: 'rgba(255,255,255,0.05)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(91,184,255,0.2)',
          borderRadius: 32,
          padding: 'clamp(48px, 7vw, 80px)',
          textAlign: 'center',
          boxShadow: '0 30px 80px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Glow orb */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 400, height: 200,
          background: 'radial-gradient(ellipse, rgba(91,184,255,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: '0.75rem', letterSpacing: '0.3em', color: '#5bb8ff', textTransform: 'uppercase', fontWeight: 800, marginBottom: 16 }}>
          For Holders
        </p>
        <h2 style={{ fontFamily: "'Fredoka One', cursive", fontSize: 'clamp(1.8rem, 4vw, 3rem)', color: '#fff', marginBottom: 16, lineHeight: 1.1 }}>
          Show Off Your Pod
        </h2>
        <p style={{ fontFamily: "'Nunito', sans-serif", color: 'rgba(180,220,255,0.7)', fontSize: '1rem', maxWidth: 460, margin: '0 auto 40px', lineHeight: 1.75 }}>
          Generate a custom banner or grid with all your Whacky Whales. Perfect for your X profile header.
        </p>
        <a
          href="/gallery"
          style={{
            display: 'inline-block',
            background: 'linear-gradient(135deg, #5bb8ff, #2a8fd4)',
            color: '#0d2a4a',
            fontFamily: "'Fredoka One', cursive",
            fontSize: '1.05rem',
            padding: '16px 48px',
            borderRadius: 50,
            textDecoration: 'none',
            boxShadow: '0 8px 30px rgba(91,184,255,0.35)',
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 14px 40px rgba(91,184,255,0.5)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 8px 30px rgba(91,184,255,0.35)'; }}
        >
          Open Banner Maker
        </a>
      </motion.div>
    </section>
  );
}

// ── Main ─────────────────────────────────────────────────────────
export default function Home() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #0d2a4a 0%, #0e3460 30%, #0a2545 60%, #091e38 100%)',
      position: 'relative',
      overflow: 'hidden',
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

      {/* Top accent line */}
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
