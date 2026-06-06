import { useState, useEffect } from 'react';
import { NAME_URL, LOGO_URL, LINKS } from '../assets';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const links = [
    { label: 'Home', href: '/' },
    { label: 'Gallery', href: '/gallery' },
    { label: 'OpenSea', href: LINKS.opensea, external: true },
  ];

  return (
    <>
      <style>{`
        .nav-link {
          font-family: 'Fredoka One', cursive;
          font-size: 0.95rem;
          color: rgba(180,220,255,0.75);
          text-decoration: none;
          padding: 8px 16px;
          border-radius: 50px;
          transition: color 0.2s, background 0.2s;
        }
        .nav-link:hover { color: #fff; background: rgba(91,184,255,0.12); }
        .nav-link.active { color: #5bb8ff; background: rgba(91,184,255,0.1); }
        .nav-social {
          width: 36px; height: 36px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          text-decoration: none; font-family: 'Fredoka One', cursive;
          font-size: 0.8rem; font-weight: 700;
          transition: transform 0.2s, background 0.2s;
        }
        .nav-social:hover { transform: scale(1.1); }
        @media (max-width: 600px) { .nav-desktop { display: none !important; } }
      `}</style>

      <nav style={{
        position: 'fixed',
        top: 3,
        left: 0,
        right: 0,
        zIndex: 50,
        padding: '0 24px',
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: scrolled ? 'rgba(13,42,74,0.92)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(91,184,255,0.1)' : 'none',
        transition: 'all 0.3s ease',
      }}>
        {/* Logo */}
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <img src={LOGO_URL} alt="" style={{ height: 32, objectFit: 'contain' }} />
          <img src={NAME_URL} alt="Whacky Whales" style={{ height: 24, objectFit: 'contain', filter: 'brightness(10)' }} />
        </a>

        {/* Desktop links */}
        <div className="nav-desktop" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {links.map(l => (
            <a
              key={l.label}
              href={l.href}
              target={l.external ? '_blank' : undefined}
              rel={l.external ? 'noopener noreferrer' : undefined}
              className={`nav-link${l.href === window.location.pathname ? ' active' : ''}`}
            >
              {l.label}
            </a>
          ))}

          <div style={{ display: 'flex', gap: 8, marginLeft: 12 }}>
            <a href={LINKS.twitter} target="_blank" rel="noopener noreferrer"
              className="nav-social"
              style={{ background: 'rgba(255,255,255,0.08)', color: '#fff' }}
            >X</a>
            <a href={LINKS.discord} target="_blank" rel="noopener noreferrer"
              className="nav-social"
              style={{ background: '#5865F2', color: '#fff' }}
            >D</a>
          </div>
        </div>
      </nav>
    </>
  );
}
