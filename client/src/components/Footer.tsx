const NAME_URL = 'https://aitxwwtybpgpqxsvlxzm.supabase.co/storage/v1/object/public/Images/Whacky/Watermark-name.png';

export default function Footer() {
  return (
    <footer style={{
      background: '#0d2a4a',
      color: 'rgba(180,220,255,0.7)',
      padding: '52px 24px 32px',
      position: 'relative',
      zIndex: 2,
    }}>
      {/* Ocean wave top */}
      <div style={{ position: 'absolute', top: -1, left: 0, right: 0, overflow: 'hidden', lineHeight: 0 }}>
        <svg viewBox="0 0 1440 60" preserveAspectRatio="none" style={{ width: '100%', height: 60, display: 'block' }}>
          <path d="M0,30 C360,60 720,0 1080,30 C1260,45 1380,15 1440,30 L1440,0 L0,0 Z"
            fill="url(#footerGrad)" />
          <defs>
            <linearGradient id="footerGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#c8e8ff" />
              <stop offset="100%" stopColor="#0d2a4a" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 32, marginBottom: 40 }}>

          {/* Brand */}
          <div style={{ maxWidth: 280 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <span style={{ fontSize: '1.6rem' }}>🐋</span>
              <img src={NAME_URL} alt="Whacky Whales" style={{ height: 26, objectFit: 'contain', filter: 'brightness(2)' }} />
            </div>
            <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: '0.9rem', lineHeight: 1.65, color: 'rgba(180,220,255,0.6)' }}>
              The most whacky NFT collection swimming through the blockchain ocean. Join the pod today.
            </p>
          </div>

          {/* Links */}
          <div style={{ display: 'flex', gap: 48, flexWrap: 'wrap' }}>
            <div>
              <p style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.8rem', letterSpacing: '0.2em', color: '#5bb8ff', textTransform: 'uppercase', marginBottom: 14 }}>Collection</p>
              {[
                { label: 'OpenSea', href: 'https://opensea.io/collection/whackywhales' },
                { label: 'Gallery', href: '/gallery' },
                { label: 'Banner Maker', href: '/gallery' },
              ].map(l => (
                <a key={l.label} href={l.href} target={l.href.startsWith('http') ? '_blank' : undefined}
                  rel={l.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  style={{ display: 'block', fontFamily: "'Nunito', sans-serif", fontSize: '0.9rem', color: 'rgba(180,220,255,0.6)', textDecoration: 'none', marginBottom: 8, transition: 'color 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#5bb8ff'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'rgba(180,220,255,0.6)'; }}
                >{l.label}</a>
              ))}
            </div>

            <div>
              <p style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.8rem', letterSpacing: '0.2em', color: '#5bb8ff', textTransform: 'uppercase', marginBottom: 14 }}>Community</p>
              {[
                { label: 'X / Twitter', href: 'https://x.com/whacky_whales' },
                { label: 'Discord', href: 'https://discord.gg/whackywhales' },
              ].map(l => (
                <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'block', fontFamily: "'Nunito', sans-serif", fontSize: '0.9rem', color: 'rgba(180,220,255,0.6)', textDecoration: 'none', marginBottom: 8, transition: 'color 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#5bb8ff'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'rgba(180,220,255,0.6)'; }}
                >{l.label}</a>
              ))}
            </div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid rgba(91,184,255,0.1)', paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: '0.82rem', color: 'rgba(180,220,255,0.4)' }}>
            © {new Date().getFullYear()} Whacky Whales — All rights reserved
          </p>
          <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: '0.82rem', color: 'rgba(180,220,255,0.4)' }}>
            🐋 Made with love for the pod
          </p>
        </div>
      </div>
    </footer>
  );
}
