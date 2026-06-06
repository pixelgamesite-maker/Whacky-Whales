import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Config ────────────────────────────────────────────────────────
const FOLLOW_URL = 'https://x.com/outworld3rs?s=21';
const TWEET_URL  = 'https://x.com/outworld3rs/status/2063202888868917757';
const EYES_URL   = '/Eyes.png';

const QUOTES = [
  "An Outworlder is not someone who left the world, but someone the world could no longer fully contain.",
  "We do not become Outworlders in departure, but in recognition — the moment we see ourselves without illusion.",
  "The Outworlder is what remains when identity stops asking to be understood and starts asking to be witnessed.",
  "You were never pulled into another world. You simply noticed the seams of this one.",
  "Not all transformation is movement. Some of it is the collapse of who you thought you were.",
  "The Outworlder does not lose humanity — they outgrow the version of it that was borrowed.",
  "There is no portal. Only perception breaking under the weight of truth.",
  "Every Outworlder begins the same way: a human who looked too long at themselves in silence.",
  "The world did not reject them. It simply stopped agreeing with their form.",
  "Outworlders are what people become when reality stops negotiating.",
];

const GLITCH_CHARS = '!<>-_\\/[]{}—=+*^?#∆◊◈▓░▒█▀▄';

const STORAGE_KEY = 'outworld3rs_wl_state';

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* noop */ }
  return null;
}

function saveState(data: object) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch { /* noop */ }
}

function useGlitchText(target: string, isActive: boolean) {
  const [display, setDisplay] = useState('');
  const frameRef = useRef<number>(0);
  const iterRef  = useRef(0);

  useEffect(() => {
    if (!isActive) { setDisplay(''); return; }
    iterRef.current = 0;
    const totalFrames = target.length * 2;

    const animate = () => {
      iterRef.current++;
      const progress = iterRef.current / totalFrames;
      setDisplay(
        target.split('').map((char, i) => {
          if (char === ' ') return ' ';
          if (i / target.length < progress) return char;
          return GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
        }).join('')
      );
      if (iterRef.current < totalFrames + 8) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        setDisplay(target);
      }
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, isActive]);

  return display;
}

function QuoteCycler() {
  const [idx, setIdx]       = useState(0);
  const [active, setActive] = useState(true);
  const glitched = useGlitchText(QUOTES[idx], active);

  useEffect(() => {
    const cycle = setInterval(() => {
      setActive(false);
      setTimeout(() => { setIdx(prev => (prev + 1) % QUOTES.length); setActive(true); }, 400);
    }, 5500);
    return () => clearInterval(cycle);
  }, []);

  return (
    <div style={{ minHeight: 160, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <AnimatePresence mode="wait">
        <motion.p key={idx} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.3 }}
          style={{ fontFamily: "'Courier Prime', 'Courier New', monospace", fontSize: 'clamp(0.85rem, 2.2vw, 1.05rem)', color: '#c8ff00', lineHeight: 1.85, letterSpacing: '0.03em', textAlign: 'center', maxWidth: 680, padding: '0 1.5rem', textShadow: '0 0 18px rgba(200,255,0,0.35)', wordBreak: 'break-word' }}>
          {glitched}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}

const ScanLines = () => (
  <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 1, backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.07) 2px, rgba(0,0,0,0.07) 4px)', mixBlendMode: 'overlay' }} />
);

const CRTFlicker = () => (
  <>
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Courier+Prime:wght@400;700&family=Share+Tech+Mono&display=swap');
      @keyframes flicker { 0%,100%{opacity:1} 92%{opacity:1} 93%{opacity:0.92} 94%{opacity:1} 97%{opacity:0.97} 98%{opacity:1} }
      @keyframes ticker-scroll { 0%{transform:translateX(100vw)} 100%{transform:translateX(-100%)} }
      @keyframes eyes-pulse { 0%,100%{filter:drop-shadow(0 0 8px rgba(200,255,0,0.4))} 50%{filter:drop-shadow(0 0 22px rgba(200,255,0,0.85))} }
      .crt-wrap { animation: flicker 8s infinite; }
      .ticker-inner { display: inline-block; white-space: nowrap; animation: ticker-scroll 40s linear infinite; }
      .eyes-img { animation: eyes-pulse 3s ease-in-out infinite; }
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { background: #050505; }
      ::selection { background: #c8ff00; color: #000; }
      input { background: transparent !important; }
      input::placeholder { color: rgba(200,255,0,0.25) !important; }
      ::-webkit-scrollbar { width: 4px; }
      ::-webkit-scrollbar-track { background: #050505; }
      ::-webkit-scrollbar-thumb { background: rgba(200,255,0,0.3); }
      @keyframes vline { 0%,100%{height:0;opacity:0} 10%,90%{opacity:1} 50%{height:100%;opacity:0.6} }
      .vline { animation: vline 8s ease-in-out infinite; }
    `}</style>
  </>
);

function Ticker() {
  const items = ['OUTWORLD3RS', '∆', 'THE SEAMS ARE SHOWING', '◊', 'PERCEPTION BREAKS', '∆', 'YOU WERE NEVER CONTAINED', '◊', 'REALITY STOPS NEGOTIATING', '∆'];
  return (
    <div style={{ width: '100%', overflow: 'hidden', borderBottom: '1px solid rgba(200,255,0,0.2)', height: 32, display: 'flex', alignItems: 'center', background: 'rgba(200,255,0,0.04)' }}>
      <div className="ticker-inner" style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.65rem', color: 'rgba(200,255,0,0.5)', letterSpacing: '0.22em' }}>
        {[...items, ...items].map((t, i) => <span key={i} style={{ marginRight: '3rem' }}>{t}</span>)}
      </div>
    </div>
  );
}

type TaskKey = 'follow' | 'likeQuote' | 'tagFriends';

const TASKS: { key: TaskKey; label: string; url: string; needsInput?: boolean; placeholder?: string }[] = [
  { key: 'follow',     label: 'Follow @outworld3rs',           url: FOLLOW_URL },
  { key: 'likeQuote',  label: 'Like & Quote the post',         url: TWEET_URL, needsInput: true, placeholder: 'Paste your quote tweet URL' },
  { key: 'tagFriends', label: 'Tag 2 friends in the comments', url: TWEET_URL, needsInput: true, placeholder: 'Paste your comment URL' },
];

function SuccessModal({ onClose }: { onClose: () => void }) {
  const [glitch, setGlitch] = useState(false);
  useEffect(() => { const t = setTimeout(() => setGlitch(true), 200); return () => clearTimeout(t); }, []);
  const text = useGlitchText('SIGNAL RECEIVED', glitch);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.25rem' }}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        style={{ background: '#060606', border: '1px solid rgba(200,255,0,0.4)', boxShadow: '0 0 80px rgba(200,255,0,0.18)', width: '100%', maxWidth: 340, padding: '2.5rem 2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '1.5rem', color: '#c8ff00', textShadow: '0 0 30px rgba(200,255,0,0.7)' }}>◈</div>
        <h2 style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '1.3rem', color: '#c8ff00', letterSpacing: '0.12em', marginBottom: '1rem', textShadow: '0 0 20px rgba(200,255,0,0.5)' }}>
          {text}
        </h2>
        <p style={{ fontFamily: "'Courier Prime', monospace", fontSize: '0.8rem', color: 'rgba(200,255,0,0.5)', lineHeight: 1.9, marginBottom: '2rem', letterSpacing: '0.04em' }}>
          You have been logged.<br />We review manually.<br />Watch @outworld3rs.
        </p>
        <button onClick={onClose}
          style={{ width: '100%', padding: '0.85rem', background: 'transparent', border: '1px solid #c8ff00', color: '#c8ff00', fontFamily: "'Share Tech Mono', monospace", fontWeight: 700, fontSize: '0.72rem', letterSpacing: '0.18em', textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#c8ff00'; e.currentTarget.style.color = '#000'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#c8ff00'; }}>
          CLOSE CHANNEL
        </button>
      </motion.div>
    </motion.div>
  );
}

function WhitelistModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const persisted = loadState();

  const [wallet, setWallet]   = useState<string>(persisted?.wallet || '');
  const [xHandle, setXHandle] = useState<string>(persisted?.xHandle || '');
  const [done, setDone]       = useState<Set<TaskKey>>(new Set(persisted?.done || []));
  const [inputs, setInputs]   = useState<Partial<Record<TaskKey, string>>>(persisted?.inputs || {});
  const [errors, setErrors]   = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const isSubmitted = persisted?.submitted === true;

  useEffect(() => {
    saveState({ wallet, xHandle, done: Array.from(done), inputs, submitted: isSubmitted });
  }, [wallet, xHandle, done, inputs, isSubmitted]);

  const openTask = (task: typeof TASKS[0]) => {
    window.open(task.url, '_blank', 'noopener');
    setDone(prev => {
      const next = new Set([...prev, task.key]);
      saveState({ wallet, xHandle, done: Array.from(next), inputs, submitted: isSubmitted });
      return next;
    });
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!wallet.trim()) e.wallet = 'Required';
    else if (!/^0x[a-fA-F0-9]{40}$/.test(wallet.trim())) e.wallet = 'Invalid EVM address';
    if (!xHandle.trim()) e.xHandle = 'Required';
    if (done.has('likeQuote') && !inputs.likeQuote?.trim()) e.likeQuote = 'Paste your quote tweet link';
    if (done.has('tagFriends') && !inputs.tagFriends?.trim()) e.tagFriends = 'Paste your comment link';
    return e;
  };

  const submit = async () => {
    const e = validate(); setErrors(e);
    if (Object.keys(e).length) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          evmAddress: wallet.trim(),
          xUsername: xHandle.trim(),
          quoteTweet: inputs.likeQuote?.trim() || xHandle.trim(),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Submission failed');
      }
      saveState({ wallet, xHandle, done: Array.from(done), inputs, submitted: true });
      onSuccess();
    } catch (err: any) {
      setErrors({ submit: err.message || 'Transmission failed. Try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const inp: React.CSSProperties = { width: '100%', background: 'transparent', border: '1px solid rgba(200,255,0,0.35)', color: '#c8ff00', fontFamily: "'Courier Prime', monospace", fontSize: '0.82rem', padding: '0.65rem 0.9rem', outline: 'none', boxSizing: 'border-box', letterSpacing: '0.04em', transition: 'border-color 0.2s' };
  const lbl: React.CSSProperties = { display: 'block', fontFamily: "'Share Tech Mono', monospace", fontSize: '0.58rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(200,255,0,0.5)', marginBottom: 6 };
  const errS: React.CSSProperties = { fontFamily: "'Courier Prime', monospace", fontSize: '0.62rem', color: '#ff4444', marginTop: 4, letterSpacing: '0.06em' };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.25rem' }}
      onClick={onClose}>
      <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 16, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        onClick={e => e.stopPropagation()}
        style={{ background: '#060606', border: '1px solid rgba(200,255,0,0.3)', boxShadow: '0 0 60px rgba(200,255,0,0.12), inset 0 0 40px rgba(200,255,0,0.03)', width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto', padding: '2rem 1.75rem' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
          <div>
            <p style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.58rem', letterSpacing: '0.28em', color: 'rgba(200,255,0,0.4)', marginBottom: 8, textTransform: 'uppercase' }}>∆ Transmission Protocol</p>
            <h2 style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '1.4rem', color: '#c8ff00', letterSpacing: '0.08em', textTransform: 'uppercase', textShadow: '0 0 20px rgba(200,255,0,0.4)' }}>Register Signal</h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(200,255,0,0.4)', fontFamily: 'monospace', fontSize: '1rem', padding: '2px 6px', transition: 'color 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#c8ff00')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(200,255,0,0.4)')}>✕</button>
        </div>

        {isSubmitted && (
          <div style={{ border: '1px solid rgba(200,255,0,0.4)', background: 'rgba(200,255,0,0.06)', padding: '0.85rem 1rem', marginBottom: '1.5rem', fontFamily: "'Share Tech Mono', monospace", fontSize: '0.7rem', color: '#c8ff00', letterSpacing: '0.1em', textAlign: 'center' }}>
            ◈ SIGNAL ALREADY REGISTERED
          </div>
        )}

        <label style={lbl}>Complete tasks</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: '1.75rem' }}>
          {TASKS.map(task => {
            const isDone = done.has(task.key);
            return (
              <div key={task.key}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', border: `1px solid ${isDone ? 'rgba(200,255,0,0.5)' : 'rgba(200,255,0,0.15)'}`, background: isDone ? 'rgba(200,255,0,0.07)' : 'transparent', transition: 'all 0.2s' }}>
                  <div style={{ width: 14, height: 14, border: `1px solid ${isDone ? '#c8ff00' : 'rgba(200,255,0,0.3)'}`, background: isDone ? '#c8ff00' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s' }}>
                    {isDone && <span style={{ fontSize: '0.5rem', color: '#000', fontWeight: 900 }}>✓</span>}
                  </div>
                  <span style={{ flex: 1, fontFamily: "'Share Tech Mono', monospace", fontSize: '0.75rem', color: isDone ? '#c8ff00' : 'rgba(200,255,0,0.6)', letterSpacing: '0.06em', transition: 'color 0.2s' }}>{task.label}</span>
                  <button onClick={() => openTask(task)}
                    style={{ background: 'transparent', border: `1px solid ${isDone ? 'rgba(200,255,0,0.3)' : 'rgba(200,255,0,0.5)'}`, color: isDone ? 'rgba(200,255,0,0.35)' : '#c8ff00', fontFamily: "'Share Tech Mono', monospace", fontWeight: 700, fontSize: '0.62rem', padding: '3px 10px', cursor: 'pointer', letterSpacing: '0.1em', transition: 'all 0.2s' }}>
                    {isDone ? 'DONE' : 'OPEN →'}
                  </button>
                </div>
                {task.needsInput && isDone && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} style={{ marginTop: 4 }}>
                    <input style={inp} value={inputs[task.key] || ''} onChange={e => setInputs(p => ({ ...p, [task.key]: e.target.value }))} placeholder={task.placeholder} />
                    {errors[task.key] && <p style={errS}>{errors[task.key]}</p>}
                  </motion.div>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={lbl}>EVM Wallet Address</label>
            <input style={inp} value={wallet} onChange={e => setWallet(e.target.value)} placeholder="0x…" />
            {errors.wallet && <p style={errS}>{errors.wallet}</p>}
          </div>
          <div>
            <label style={lbl}>X Handle or Profile URL</label>
            <input style={inp} value={xHandle} onChange={e => setXHandle(e.target.value)} placeholder="@handle or https://x.com/…" />
            {errors.xHandle && <p style={errS}>{errors.xHandle}</p>}
          </div>
        </div>

        {errors.submit && <p style={{ ...errS, textAlign: 'center', marginTop: '1rem' }}>{errors.submit}</p>}

        <button onClick={isSubmitted ? onClose : submit} disabled={submitting}
          style={{ width: '100%', marginTop: '1.75rem', padding: '0.9rem', background: isSubmitted ? 'rgba(200,255,0,0.1)' : submitting ? 'transparent' : '#c8ff00', border: '1px solid #c8ff00', color: isSubmitted ? '#c8ff00' : submitting ? '#c8ff00' : '#000', fontFamily: "'Share Tech Mono', monospace", fontWeight: 700, fontSize: '0.78rem', letterSpacing: '0.18em', textTransform: 'uppercase', cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1, transition: 'all 0.2s' }}
          onMouseEnter={e => { if (!submitting && !isSubmitted) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#c8ff00'; } }}
          onMouseLeave={e => { if (!submitting && !isSubmitted) { e.currentTarget.style.background = '#c8ff00'; e.currentTarget.style.color = '#000'; } }}>
          {isSubmitted ? '◈ SIGNAL REGISTERED' : submitting ? 'TRANSMITTING ···' : 'REGISTER SIGNAL →'}
        </button>
        <p style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.58rem', color: 'rgba(200,255,0,0.25)', textAlign: 'center', marginTop: '1rem', letterSpacing: '0.1em' }}>
          MANUALLY REVIEWED · NO BOTS · NO NOISE
        </p>
      </motion.div>
    </motion.div>
  );
}

type ModalState = 'idle' | 'form' | 'success';

export default function Home() {
  const [modal, setModal] = useState<ModalState>('idle');
  const [hovered, setHovered] = useState(false);

  return (
    <div className="crt-wrap" style={{ minHeight: '100vh', background: '#050505', color: '#c8ff00', fontFamily: "'Share Tech Mono', monospace", position: 'relative', overflow: 'hidden' }}>
      <CRTFlicker />
      <ScanLines />

      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        {[15, 35, 65, 85].map((left, i) => (
          <div key={i} className="vline" style={{ position: 'absolute', left: `${left}%`, top: 0, width: 1, background: 'rgba(200,255,0,0.04)', animationDelay: `${i * 2.1}s` }} />
        ))}
      </div>

      <Ticker />

      <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 32px)', padding: '3rem 1.5rem' }}>

        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }} style={{ marginBottom: '1.5rem' }}>
          <img src={EYES_URL} alt="" className="eyes-img"
            style={{ width: 'clamp(80px, 20vw, 140px)', display: 'block', filter: 'drop-shadow(0 0 12px rgba(200,255,0,0.5)) brightness(0) saturate(100%) invert(85%) sepia(60%) saturate(400%) hue-rotate(30deg)' }}
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }} style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
          <div style={{ fontSize: '0.58rem', letterSpacing: '0.38em', color: 'rgba(200,255,0,0.35)', marginBottom: '1.25rem', fontFamily: "'Share Tech Mono', monospace" }}>
            ∆ &nbsp; SIGNAL TRANSMISSION &nbsp; ◊
          </div>
          <h1 style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'clamp(2.8rem, 10vw, 6.5rem)', color: '#c8ff00', letterSpacing: '0.12em', textShadow: '0 0 40px rgba(200,255,0,0.3)', lineHeight: 1, whiteSpace: 'nowrap' }}>
            OUTWORLDERS
          </h1>
        </motion.div>

        <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.6, delay: 0.5 }}
          style={{ width: '100%', maxWidth: 480, height: 1, background: 'rgba(200,255,0,0.2)', margin: '2.5rem 0', transformOrigin: 'left' }} />

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} style={{ width: '100%' }}>
          <QuoteCycler />
        </motion.div>

        <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.6, delay: 0.9 }}
          style={{ width: '100%', maxWidth: 480, height: 1, background: 'rgba(200,255,0,0.2)', margin: '2.5rem 0', transformOrigin: 'right' }} />

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.0 }}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <button onClick={() => setModal('form')}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{ background: hovered ? '#c8ff00' : 'transparent', border: '1px solid #c8ff00', color: hovered ? '#000' : '#c8ff00', fontFamily: "'Share Tech Mono', monospace", fontWeight: 700, fontSize: '0.8rem', letterSpacing: '0.22em', textTransform: 'uppercase', padding: '1rem 3rem', cursor: 'pointer', boxShadow: hovered ? '0 0 40px rgba(200,255,0,0.35)' : '0 0 20px rgba(200,255,0,0.1)', transition: 'all 0.2s' }}>
            REGISTER YOUR SIGNAL →
          </button>
          <p style={{ fontSize: '0.58rem', color: 'rgba(200,255,0,0.3)', letterSpacing: '0.18em', marginTop: '0.25rem', fontFamily: "'Share Tech Mono', monospace" }}>
            ALLOWLIST · LIMITED SIGNAL CAPACITY
          </p>
        </motion.div>

        <div style={{ position: 'absolute', bottom: '1.5rem', left: '1.5rem', fontSize: '0.52rem', color: 'rgba(200,255,0,0.18)', letterSpacing: '0.14em', fontFamily: "'Share Tech Mono', monospace" }}>
          OUTWORLD3RS · {new Date().getFullYear()} · ◈
        </div>
        <div style={{ position: 'absolute', bottom: '1.5rem', right: '1.5rem', fontSize: '0.52rem', color: 'rgba(200,255,0,0.18)', letterSpacing: '0.14em', fontFamily: "'Share Tech Mono', monospace" }}>
          X: @OUTWORLD3RS
        </div>
      </div>

      <AnimatePresence>
        {modal === 'form' && <WhitelistModal onClose={() => setModal('idle')} onSuccess={() => setModal('success')} />}
        {modal === 'success' && <SuccessModal onClose={() => setModal('idle')} />}
      </AnimatePresence>
    </div>
  );
}
