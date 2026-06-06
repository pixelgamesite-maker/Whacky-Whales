import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const NAME_URL = 'https://aitxwwtybpgpqxsvlxzm.supabase.co/storage/v1/object/public/Images/Whacky/Watermark-name.png';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const isGallery = window.location.pathname === '/gallery';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const links = [
    { label: 'Home', href: '/' },
    { label: 'Gallery', href: '/gallery' },
    { label: 'OpenSea', href: 'https://opensea.io/collection/whackywhales', external: true },
  ];

  return (
    <nav style={{
      position: 'fixed',
      top: 4,
      left: 0,
      right: 0,
      zIndex: 50,
      padding: '0 24px',
      height: 64,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      background: scrolled ? 'rgba(232,246,255,0.85)' : 'transparent',
      backdropFilter: scrolled ? 'blur(20px)' : 'none',
      borderBottom: scrolled ? '1px solid rgba(91,184,255,0.15)' : 'none',
      transition: 'all 0.3s ease',
    }}>
      {/* Logo */}
      <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
        <span style={{ fontSize: '1.6rem' }}>🐋</span>
        <img src={NAME_URL} alt="Whacky Whales" style={{ height: 26, objectFit: 'contain' }} />
      </a>

      {/* Desktop links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} className="nav-desktop">
        {links.map(l => (
          <a
            key={l.label}
            href={l.href}
            target={l.external ? '_blank' : undefined}
            rel={l.external ? 'noopener noreferrer' : undefined}
            style={{
              fontFamily: "'Fredoka One', cursive",
              fontSize: '0.95rem',
              color: '#0d2a4a',
              textDecoration: 'none',
              padding: '8px 16px',
              borderRadius: 50,
              background: l.href === window.location.pathname ? 'rgba(91,184,255,0.2)' : 'transparent',
              transition: 'background 0.2s, color 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(91,184,255,0.2)'; }}
            onMouseLeave={e => { if (l.href !== window.location.pathname) e.currentTarget.style.background = 'transparent'; }}
          >
            {l.label}
          </a>
        ))}

        {/* Social icons */}
        <div style={{ display: 'flex', gap: 8, marginLeft: 8 }}>
          <a href="https://x.com/whacky_whales" target="_blank" rel="noopener noreferrer"
            style={{ width: 36, height: 36, borderRadius: 50, background: '#0d2a4a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', fontSize: '0.8rem', fontFamily: "'Fredoka One', cursive", fontWeight: 700, transition: 'transform 0.2s, background 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#1a5276'; e.currentTarget.style.transform = 'scale(1.1)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#0d2a4a'; e.currentTarget.style.transform = 'scale(1)'; }}
          >X</a>
          <a href="https://discord.gg/whackywhales" target="_blank" rel="noopener noreferrer"
            style={{ width: 36, height: 36, borderRadius: 50, background: '#5865F2', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', fontSize: '0.75rem', fontFamily: "'Fredoka One', cursive", fontWeight: 700, transition: 'transform 0.2s, background 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#4752c4'; e.currentTarget.style.transform = 'scale(1.1)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#5865F2'; e.currentTarget.style.transform = 'scale(1)'; }}
          >D</a>
        </div>
      </div>

      <style>{`
        @media (max-width: 600px) {
          .nav-desktop { display: none !important; }
        }
      `}</style>
    </nav>
  );
}
