import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function GifMaker() {
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
        <div style={{ position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%,-50%)', width: 600, height: 400, background: 'radial-gradient(ellipse, rgba(255,107,107,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 600, width: '100%', textAlign: 'center' }}>

          {/* Animated badge */}
          <motion.div
            animate={{ scale: [1, 1.06, 1], rotate: [-1, 1, -0.5, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            style={{ display: 'inline-block', background: 'linear-gradient(135deg, #ff6b6b, #ff9f43)', borderRadius: 50, padding: '8px 24px', marginBottom: 32 }}
          >
            <span style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.85rem', letterSpacing: '0.14em', color: '#fff', textTransform: 'uppercase' }}>
              Coming Soon
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{ fontSize: '5rem', marginBottom: 24 }}
          >
            🎬
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.6 }}
            style={{ fontFamily: "'Fredoka One', cursive", fontSize: 'clamp(2.4rem,6vw,4rem)', color: '#fff', lineHeight: 1.1, marginBottom: 20 }}
          >
            Whacky GIF Maker
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            style={{ fontFamily: "'Nunito', sans-serif", fontSize: '1.05rem', color: 'rgba(180,220,255,0.7)', lineHeight: 1.8, maxWidth: 440, margin: '0 auto 48px' }}
          >
            Animate your pod. Create shareable GIFs straight from your wallet — dropping for holders very soon.
          </motion.p>

          {/* Placeholder preview card */}
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.55 }}
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1.5px solid rgba(255,107,107,0.2)',
              borderRadius: 24,
              padding: '48px 32px',
              marginBottom: 40,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(45deg, transparent, transparent 18px, rgba(255,255,255,0.015) 18px, rgba(255,255,255,0.015) 20px)', pointerEvents: 'none' }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 20 }}>
              {['🐳','🎬','✨'].map((e, i) => (
                <motion.span
                  key={i}
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 1.4, delay: i * 0.3, repeat: Infinity, ease: 'easeInOut' }}
                  style={{ fontSize: '2rem' }}
                >
                  {e}
                </motion.span>
              ))}
            </div>
            <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: '0.88rem', color: 'rgba(180,220,255,0.35)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
              Connect wallet to get notified at launch
            </p>
          </motion.div>

          <motion.a
            href="/"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
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
