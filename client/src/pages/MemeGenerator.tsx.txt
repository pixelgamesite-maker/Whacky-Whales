import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { LOGO_URL } from '../assets';

export default function MemeGenerator() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #0a1628 0%, #0d2137 50%, #081020 100%)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fredoka+One&family=Nunito:wght@400;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
      `}</style>

      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #5bb8ff, #2a8fd4, #5bb8ff)', zIndex: 100 }} />

      <div style={{ position: 'absolute', top: '20%', left: '15%', width: 400, height: 400, background: 'radial-gradient(ellipse, rgba(91,184,255,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '20%', right: '10%', width: 300, height: 300, background: 'radial-gradient(ellipse, rgba(42,143,212,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <Navbar />

      <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '120px 24px 80px', position: 'relative', zIndex: 2 }}>
        <div style={{ maxWidth: 560, width: '100%', textAlign: 'center' }}>

          <motion.img
            src={LOGO_URL}
            alt=""
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{ height: 64, marginBottom: 28, filter: 'drop-shadow(0 4px 16px rgba(91,184,255,0.25))', animation: 'float 3s ease-in-out infinite' }}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            style={{ display: 'inline-block', background: 'rgba(91,184,255,0.1)', border: '1.5px solid rgba(91,184,255,0.3)', borderRadius: 50, padding: '7px 22px', marginBottom: 28 }}
          >
            <span style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.78rem', letterSpacing: '0.18em', color: '#5bb8ff', textTransform: 'uppercase' }}>
              Coming Soon
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            style={{ fontFamily: "'Fredoka One', cursive", fontSize: 'clamp(2.4rem, 6vw, 3.8rem)', color: '#fff', lineHeight: 1.1, marginBottom: 18, textShadow: '0 2px 20px rgba(91,184,255,0.15)' }}
          >
            Meme Generator
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            style={{ fontFamily: "'Nunito', sans-serif", fontSize: '1rem', color: 'rgba(180,220,255,0.6)', lineHeight: 1.8, maxWidth: 400, margin: '0 auto 48px' }}
          >
            Create hilarious whale memes straight from your wallet. Dropping for holders very soon.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.55 }}
            style={{ background: 'rgba(255,255,255,0.03)', border: '1.5px solid rgba(91,184,255,0.12)', borderRadius: 24, padding: '48px 32px', marginBottom: 40, position: 'relative', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}
          >
            <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(91,184,255,0.06) 1px, transparent 1px)', backgroundSize: '28px 28px', pointerEvents: 'none' }} />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 24 }}>
              {[0, 1, 2, 3, 4].map(i => (
                <motion.div
                  key={i}
                  animate={{ scale: [1, 1.4, 1], opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.2, delay: i * 0.15, repeat: Infinity, ease: 'easeInOut' }}
                  style={{ width: 10, height: 10, borderRadius: '50%', background: `rgba(91,184,255,${0.3 + i * 0.14})` }}
                />
              ))}
            </div>

            <p style={{ fontFamily: "'Fredoka One', cursive", fontSize: '1rem', color: 'rgba(91,184,255,0.4)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              We're working on it
            </p>
          </motion.div>

          <motion.a
            href="/"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            style={{ display: 'inline-block', background: 'rgba(91,184,255,0.07)', border: '1.5px solid rgba(91,184,255,0.15)', color: 'rgba(180,220,255,0.6)', fontFamily: "'Fredoka One', cursive", fontSize: '0.92rem', padding: '12px 32px', borderRadius: 50, textDecoration: 'none', letterSpacing: '0.04em', transition: 'all 0.2s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(91,184,255,0.14)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(91,184,255,0.07)'; }}
          >
            Back to Home
          </motion.a>

        </div>
      </section>

      <Footer />
    </div>
  );
}
