import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const SUPABASE_TRANSPARENT = 'https://psibadkdncspgikzzmnu.supabase.co/storage/v1/object/public/Whacky';
const SAMPLE_IDS = [231, 317, 866, 1742, 2048];
const SAMPLE_WHALES = SAMPLE_IDS.map(id => `${SUPABASE_TRANSPARENT}/nft_${id}.png`);

export default function WhackyPod() {
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
      `}</style>

      {/* Top accent line */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #5bb8ff, #2a8fd4, #5bb8ff)', zIndex: 100 }} />

      <Navbar />

      <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '120px 24px 80px', position: 'relative', zIndex: 2 }}>

        {/* Background glow */}
        <div style={{ position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%,-50%)', width: 700, height: 500, background: 'radial-gradient(ellipse, rgba(168,85,247,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 700, width: '100%', textAlign: 'center' }}>

          {/* Badge */}
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
            style={{ display: 'inline-block', background: 'linear-gradient(135deg, #a855f7, #6366f1)', borderRadius: 50, padding: '8px 24px', marginBottom: 32 }}
          >
            <span style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.85rem', letterSpacing: '0.14em', color: '#fff', textTransform: 'uppercase' }}>
              Under Construction
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{ fontSize: '5rem', marginBottom: 24 }}
          >
            🎮
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.6 }}
            style={{ fontFamily: "'Fredoka One', cursive", fontSize: 'clamp(2.4rem,6vw,4rem)', color: '#fff', lineHeight: 1.1, marginBottom: 20 }}
          >
            Whacky Pod
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            style={{ fontFamily: "'Nunito', sans-serif", fontSize: '1.05rem', color: 'rgba(180,220,255,0.7)', lineHeight: 1.8, maxWidth: 500, margin: '0 auto 48px' }}
          >
            The Whacky Whales game is taking shape. Our team is cooking up something special — details will drop to the community as development progresses.
          </motion.p>

          {/* Construction display */}
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.55 }}
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1.5px solid rgba(168,85,247,0.18)',
              borderRadius: 28,
              padding: '40px 32px',
              marginBottom: 40,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Diagonal stripe overlay */}
            <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(45deg, transparent, transparent 22px, rgba(168,85,247,0.025) 22px, rgba(168,85,247,0.025) 24px)', pointerEvents: 'none' }} />

            {/* Whale lineup */}
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 12, marginBottom: 28, position: 'relative' }}>
              {SAMPLE_WHALES.map((src, i) => (
                <motion.div
                  key={i}
                  animate={{ y: [0, -(6 + i * 2), 0] }}
                  transition={{ duration: 1.8 + i * 0.25, delay: i * 0.2, repeat: Infinity, ease: 'easeInOut' }}
                  style={{
                    width: 52 + (i === 2 ? 16 : 0),
                    height: 52 + (i === 2 ? 16 : 0),
                    borderRadius: 12,
                    overflow: 'hidden',
                    border: '2px solid rgba(168,85,247,0.25)',
                    background: 'rgba(168,85,247,0.08)',
                    flexShrink: 0,
                  }}
                >
                  <img src={src} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </motion.div>
              ))}
            </div>

            {/* Progress bar mockup */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: '0.75rem', color: 'rgba(180,220,255,0.45)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>Development Progress</span>
                <span style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.8rem', color: 'rgba(168,85,247,0.7)' }}>Early Stage</span>
              </div>
              <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 6, overflow: 'hidden' }}>
                <motion.div
                  initial={{ width: '0%' }}
                  animate={{ width: '22%' }}
                  transition={{ delay: 0.8, duration: 1.2, ease: 'easeOut' }}
                  style={{ height: '100%', background: 'linear-gradient(90deg, #a855f7, #6366f1)', borderRadius: 6 }}
                />
              </div>
            </div>

            <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: '0.82rem', color: 'rgba(180,220,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Holders get early access & updates first
            </p>
          </motion.div>

          {/* Teaser features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65, duration: 0.5 }}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 40 }}
          >
            {[
              { icon: '🐋', label: 'Play as your whale' },
              { icon: '🌊', label: 'Ocean battles' },
              { icon: '🏆', label: 'Holder rewards' },
            ].map((f, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1.5px solid rgba(168,85,247,0.1)', borderRadius: 16, padding: '20px 12px' }}>
                <div style={{ fontSize: '1.6rem', marginBottom: 8 }}>{f.icon}</div>
                <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: '0.78rem', color: 'rgba(180,220,255,0.45)', lineHeight: 1.5 }}>{f.label}</p>
              </div>
            ))}
          </motion.div>

          <motion.a
            href="/"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.75 }}
            style={{
              display: 'inline-block',
              background: 'rgba(255,255,255,0.06)',
              border: '1.5px solid rgba(255,255,255,0.12)',
              color: 'rgba(180,220,255,0.7)',
              fontFamily: "'Fredoka One', cursive",
              fontSize: '0.95rem',
              padding: '12px 32px',
              borderRadius: 50,
              textDecoration: 'none',
              transition: 'background 0.2s, transform 0.2s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.1)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLElement).style.transform = ''; }}
          >
            ← Back to Home
          </motion.a>
        </div>
      </section>

      <Footer />
    </div>
  );
}
