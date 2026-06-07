import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NAME_URL, LOGO_URL, LINKS } from '../assets';

const OPENSEA_LOGO = 'https://psibadkdncspgikzzmnu.supabase.co/storage/v1/object/public/Whacky/Logo/OpenSea-logo.png';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close menu on route change / outside click
  useEffect(() => {
    if (!menuOpen) return;
    const close = () => setMenuOpen(false);
    window.addEventListener('popstate', close);
    return () => window.removeEventListener('popstate', close);
  }, [menuOpen]);

  const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'Gallery', href: '/gallery' },
  ];

  const socials = [
    {
      href: 'https://x.com/whacky_whales',
      label: 'X / Twitter',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
      bg: 'rgba(255,255,255,0.1)',
      color: '#fff',
    },
    {
      href: 'https://discord.gg/whackywhales',
      label: 'Discord',
      icon: (
        <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
        </svg>
      ),
      bg: '#5865F2',
      color: '#fff',
    },

  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fredoka+One&family=Nunito:wght@400;600;700;800&display=swap');
        .nav-link {
          font-family: 'Fredoka One', cursive;
          font-size: 0.95rem;
          color: rgba(180,220,255,0.75);
          text-decoration: none;
          padding: 8px 16px;
          border-radius: 50px;
          transition: color 0.2s, background 0.2s;
          white-space: nowrap;
        }
        .nav-link:hover { color: #fff; background: rgba(91,184,255,0.12); }
        .nav-link.active { color: #5bb8ff; background: rgba(91,184,255,0.1); }
        .nav-social-btn {
          width: 38px; height: 38px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          text-decoration: none; border: none; cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
          flex-shrink: 0;
        }
        .nav-social-btn:hover { transform: scale(1.1); box-shadow: 0 4px 14px rgba(0,0,0,0.3); }
      `}</style>

      {/* ── Backdrop when menu open ── */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setMenuOpen(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(5,14,30,0.6)', backdropFilter: 'blur(4px)', zIndex: 48 }}
          />
        )}
      </AnimatePresence>

      {/* ── Mobile slide-down menu ── */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            style={{
              position: 'fixed',
              top: 67,
              left: 12,
              right: 12,
              zIndex: 49,
              background: 'rgba(10,28,58,0.97)',
              backdropFilter: 'blur(24px)',
              borderRadius: 20,
              border: '1.5px solid rgba(91,184,255,0.18)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
              overflow: 'hidden',
              padding: '8px 0',
            }}
          >
            {/* Nav links */}
            {navLinks.map((l, i) => (
              <a
                key={l.label}
                href={l.href}
                onClick={() => setMenuOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '16px 24px',
                  fontFamily: "'Fredoka One', cursive",
                  fontSize: '1.1rem',
                  color: l.href === window.location.pathname ? '#5bb8ff' : 'rgba(180,220,255,0.85)',
                  textDecoration: 'none',
                  borderBottom: i < navLinks.length - 1 ? '1px solid rgba(91,184,255,0.07)' : 'none',
                  background: l.href === window.location.pathname ? 'rgba(91,184,255,0.08)' : 'transparent',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(91,184,255,0.1)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = l.href === window.location.pathname ? 'rgba(91,184,255,0.08)' : 'transparent'; }}
              >
                {l.label}
              </a>
            ))}

            {/* Divider */}
            <div style={{ height: 1, background: 'rgba(91,184,255,0.1)', margin: '4px 0' }} />

            {/* Socials row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 24px' }}>
              <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: '0.72rem', letterSpacing: '0.2em', color: 'rgba(180,220,255,0.4)', textTransform: 'uppercase', marginRight: 4 }}>
                Find us
              </p>
              {socials.map(s => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={s.label}
                  className="nav-social-btn"
                  style={{ background: s.bg, color: s.color }}
                >
                  {s.icon}
                </a>
              ))}

              {/* OpenSea CTA */}
              <a
                href="https://opensea.io/collection/whackywhales"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMenuOpen(false)}
                style={{
                  marginLeft: 'auto',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  background: 'linear-gradient(135deg, #5bb8ff, #2a8fd4)',
                  color: '#0d2a4a',
                  fontFamily: "'Fredoka One', cursive",
                  fontSize: '0.88rem',
                  padding: '10px 18px 10px 10px',
                  borderRadius: 50,
                  textDecoration: 'none',
                  boxShadow: '0 4px 16px rgba(91,184,255,0.3)',
                }}
              >
                <span style={{ width: 28, height: 28, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <img src={OPENSEA_LOGO} alt="" style={{ width: 18, height: 18, objectFit: 'contain' }} />
                </span>
                Get a Whale
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main navbar ── */}
      <nav style={{
        position: 'fixed', top: 3, left: 0, right: 0, zIndex: 50,
        padding: '0 16px', height: 64,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: scrolled || menuOpen ? 'rgba(13,42,74,0.95)' : 'transparent',
        backdropFilter: scrolled || menuOpen ? 'blur(20px)' : 'none',
        borderBottom: scrolled || menuOpen ? '1px solid rgba(91,184,255,0.1)' : 'none',
        transition: 'all 0.3s ease',
      }}>
        {/* Logo */}
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <img src={LOGO_URL} alt="" style={{ height: 32, objectFit: 'contain' }} />
          <img src={NAME_URL} alt="Whacky Whales" style={{ height: 24, objectFit: 'contain', filter: 'brightness(10)' }} />
        </a>

        {/* Desktop: links + socials */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }} className="desktop-nav">
          {navLinks.map(l => (
            <a key={l.label} href={l.href}
              className={`nav-link${l.href === window.location.pathname ? ' active' : ''}`}
            >{l.label}</a>
          ))}
          <div style={{ display: 'flex', gap: 8, marginLeft: 12 }}>
            {socials.map(s => (
              <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                title={s.label} className="nav-social-btn"
                style={{ background: s.bg, color: s.color }}
              >{s.icon}</a>
            ))}
          </div>
        </div>

        {/* Mobile: hamburger */}
        <button
          onClick={() => setMenuOpen(o => !o)}
          className="hamburger-btn"
          aria-label="Menu"
          style={{
            background: menuOpen ? 'rgba(91,184,255,0.15)' : 'rgba(255,255,255,0.07)',
            border: '1.5px solid rgba(91,184,255,0.2)',
            borderRadius: 12,
            width: 44, height: 44,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 5, cursor: 'pointer', padding: 0,
            transition: 'background 0.2s',
          }}
        >
          <motion.span animate={{ rotate: menuOpen ? 45 : 0, y: menuOpen ? 7 : 0 }} transition={{ duration: 0.22 }}
            style={{ display: 'block', width: 20, height: 2, background: menuOpen ? '#5bb8ff' : 'rgba(180,220,255,0.85)', borderRadius: 2, transformOrigin: 'center' }}
          />
          <motion.span animate={{ opacity: menuOpen ? 0 : 1, scaleX: menuOpen ? 0 : 1 }} transition={{ duration: 0.15 }}
            style={{ display: 'block', width: 20, height: 2, background: 'rgba(180,220,255,0.85)', borderRadius: 2 }}
          />
          <motion.span animate={{ rotate: menuOpen ? -45 : 0, y: menuOpen ? -7 : 0 }} transition={{ duration: 0.22 }}
            style={{ display: 'block', width: 20, height: 2, background: menuOpen ? '#5bb8ff' : 'rgba(180,220,255,0.85)', borderRadius: 2, transformOrigin: 'center' }}
          />
        </button>

        <style>{`
          .desktop-nav { display: flex; }
          .hamburger-btn { display: none; }
          @media (max-width: 640px) {
            .desktop-nav { display: none !important; }
            .hamburger-btn { display: flex !important; }
          }
        `}</style>
      </nav>
    </>
  );
}
