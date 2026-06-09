import { useState, useEffect, useRef, useCallback } from 'react';
import { COLLECTION_IMAGES, CONTRACT_ADDRESS } from '../assets';

const SUPABASE = 'https://aitxwwtybpgpqxsvlxzm.supabase.co/storage/v1/object/public/Images/Whacky';
const ALCHEMY_KEY = import.meta.env.VITE_ALCHEMY_KEY; // or hardcode if preferred
const ALCHEMY_URL = `https://eth-mainnet.g.alchemy.com/nft/v3/${ALCHEMY_KEY}`;

const DEFAULT_FRAMES = COLLECTION_IMAGES.slice(9, 20); // 10.png to 20.png

const SIZE_MAP = {
  small: 640,
  medium: 800,
  large: 1000,
};

interface AlchemyNFT {
  tokenId: string;
  image: { cachedUrl?: string; originalUrl?: string };
  name?: string;
}

export default function GifMaker() {
  const [frames, setFrames] = useState<string[]>(DEFAULT_FRAMES);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [speed, setSpeed] = useState(400);
  const [size, setSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [isPlaying, setIsPlaying] = useState(true);
  const [walletAddress, setWalletAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [downloadUrl, setDownloadUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const play = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setCurrentFrame((prev) => (prev + 1) % frames.length);
    }, speed);
  }, [frames.length, speed]);

  useEffect(() => {
    if (isPlaying && frames.length > 0) {
      play();
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, play, frames.length]);

  // ── Alchemy: detect user's Whacky Whales ─────────────────────
  const detectWhales = async () => {
    if (!walletAddress.trim()) return;
    setIsLoading(true);
    setError('');
    setDownloadUrl('');

    try {
      const response = await fetch(
        `${ALCHEMY_URL}/getNFTsForOwner?owner=${walletAddress}&contractAddresses[]=${CONTRACT_ADDRESS}&withMetadata=true&pageSize=100`
      );
      const data = await response.json();

      if (!data.ownedNfts || data.ownedNfts.length === 0) {
        setError('No Whacky Whales found in this wallet.');
        setFrames(DEFAULT_FRAMES);
        setIsLoading(false);
        return;
      }

      // Build Supabase URLs from token IDs
      const userFrames = data.ownedNfts.map((nft: AlchemyNFT) => {
        const id = parseInt(nft.tokenId, 10);
        return `${SUPABASE}/Collection/${id}.png`;
      });

      setFrames(userFrames);
      setCurrentFrame(0);
      setIsPlaying(true);
    } catch (err) {
      setError('Failed to fetch NFTs. Check wallet address or try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // ── File upload fallback ───────────────────────────────────────
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const urls = Array.from(files).map((file) => URL.createObjectURL(file));
    setFrames(urls);
    setCurrentFrame(0);
    setIsPlaying(true);
    setError('');
    setDownloadUrl('');
  };

  const handleClear = () => {
    setFrames(DEFAULT_FRAMES);
    setCurrentFrame(0);
    setIsPlaying(true);
    setWalletAddress('');
    setError('');
    setDownloadUrl('');
  };

  // ── GIF generation with gifshot ───────────────────────────────
  const handleMakeGif = () => {
    setIsLoading(true);
    setDownloadUrl('');

    // Dynamic import so it doesn't bloat initial bundle
    import('gifshot').then((gifshot) => {
      gifshot.default.createGIF(
        {
          images: frames,
          gifWidth: SIZE_MAP[size],
          gifHeight: SIZE_MAP[size],
          interval: speed / 1000,
          numFrames: frames.length,
          frameDuration: speed / 1000,
          fontWeight: 'normal',
          fontSize: '16px',
          fontFamily: 'sans-serif',
          text: '',
          showFrameText: false,
        },
        (obj: { error: boolean; errorCode?: string; errorMsg?: string; image: string }) => {
          setIsLoading(false);
          if (!obj.error) {
            setDownloadUrl(obj.image);
          } else {
            setError(`GIF generation failed: ${obj.errorMsg || 'Unknown error'}`);
          }
        }
      );
    });
  };

  const loopLength = ((frames.length * speed) / 1000).toFixed(1);
  const estSize = Math.round(frames.length * 15.6);

  return (
    <div className="min-h-screen bg-[#111] text-white">
      {/* Header */}
      <div className="text-center pt-16 pb-10 px-4">
        <p className="text-gray-500 tracking-[0.2em] text-xs uppercase mb-3">
          The Whale Kit · GIF Maker
        </p>
        <h1 className="text-6xl md:text-7xl font-black mb-4 tracking-tight">
          make it loop.
        </h1>
        <p className="text-gray-400 text-lg mb-6">
          Turn your whales into a clean looping GIF.
        </p>
        <p className="text-gray-600 text-sm">↓ wallet or upload. ↓</p>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Preview Panel */}
          <div className="bg-[#1a1a1a] rounded-2xl p-6 md:p-10 flex flex-col items-center justify-center min-h-[500px] border border-white/5">
            <div className="bg-[#0a0a0a] rounded-xl p-4 md:p-6 shadow-2xl">
              <div
                className="relative bg-[#1a1a1a] rounded-lg overflow-hidden flex items-center justify-center"
                style={{ width: '100%', maxWidth: SIZE_MAP[size] }}
              >
                <img
                  src={frames[currentFrame]}
                  alt={`Frame ${currentFrame + 1}`}
                  className="w-full h-auto object-contain rounded-lg"
                  style={{ maxWidth: SIZE_MAP[size] }}
                />
              </div>
            </div>
            <p className="text-gray-500 text-sm mt-6 font-mono">
              frame {currentFrame + 1} / {frames.length}
            </p>
          </div>

          {/* Controls Panel */}
          <div className="bg-[#1a1a1a] rounded-2xl p-6 md:p-8 border border-white/5 space-y-8">
            
            {/* Load Section */}
            <div>
              <h3 className="text-gray-500 text-xs tracking-[0.15em] uppercase mb-4 font-medium">
                Load Your Whales
              </h3>
              <input
                type="text"
                placeholder="0x79d0BA3A91ccF1dC060e858c7a111da5a..."
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                className="w-full bg-[#222] border border-white/10 rounded-lg px-4 py-3 mb-3 text-white placeholder-gray-600 focus:outline-none focus:border-white/30 font-mono text-sm"
              />
              <button
                onClick={detectWhales}
                disabled={isLoading || !walletAddress.trim()}
                className="w-full bg-white text-black font-semibold py-3 rounded-lg hover:bg-gray-200 transition-colors mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'detecting...' : 'detect my whales'}
              </button>

              {error && (
                <p className="text-red-400 text-sm mt-2 mb-3 font-mono">{error}</p>
              )}

              <div className="flex items-center gap-4 mb-4">
                <div className="h-px flex-1 bg-white/10" />
                <span className="text-gray-500 text-sm">or</span>
                <div className="h-px flex-1 bg-white/10" />
              </div>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full bg-[#222] border border-white/10 text-white font-semibold py-3 rounded-lg hover:bg-[#2a2a2a] transition-colors"
              >
                upload images
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />

              <p className="text-green-400 text-sm mt-3 font-mono">
                {frames.length} whales loaded
              </p>
            </div>

            {/* Size Selector */}
            <div>
              <h3 className="text-gray-500 text-xs tracking-[0.15em] uppercase mb-4 font-medium">
                GIF Size (Square)
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {(Object.keys(SIZE_MAP) as Array<'small' | 'medium' | 'large'>).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    className={`py-3 px-2 rounded-lg border transition-all ${
                      size === s
                        ? 'bg-white text-black border-white'
                        : 'bg-[#222] text-white border-white/10 hover:border-white/30'
                    }`}
                  >
                    <div className="font-semibold text-sm capitalize">{s}</div>
                    <div className="text-xs opacity-60 mt-0.5">{SIZE_MAP[s]}px</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Speed Slider */}
            <div>
              <h3 className="text-gray-500 text-xs tracking-[0.15em] uppercase mb-4 font-medium">
                Speed — {speed}ms per frame
              </h3>
              <input
                type="range"
                min="100"
                max="1000"
                step="50"
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
                className="w-full h-2 bg-[#333] rounded-lg appearance-none cursor-pointer accent-white"
              />
              <div className="flex justify-between text-xs text-gray-600 mt-2">
                <span>Fast</span>
                <span>Slow</span>
              </div>
            </div>

            {/* Stats */}
            <div className="bg-[#222] rounded-lg p-5 space-y-3 border border-white/5">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 uppercase tracking-wider text-xs">Frames</span>
                <span className="text-white font-mono">{frames.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 uppercase tracking-wider text-xs">Loop Length</span>
                <span className="text-white font-mono">{loopLength}s</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 uppercase tracking-wider text-xs">Est. Size</span>
                <span className="text-green-400 font-mono">{estSize} KB</span>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3 pt-2">
              <button
                onClick={handleMakeGif}
                disabled={isLoading || frames.length === 0}
                className="w-full bg-white text-black font-bold py-4 rounded-lg hover:bg-gray-200 transition-colors text-base disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'generating...' : 'make gif'}
              </button>

              {downloadUrl && (
                <a
                  href={downloadUrl}
                  download="whacky-whales.gif"
                  className="block w-full bg-green-500 text-white font-bold py-4 rounded-lg hover:bg-green-600 transition-colors text-base text-center"
                >
                  download gif
                </a>
              )}

              <button
                onClick={handleClear}
                className="w-full bg-[#222] text-white font-semibold py-3 rounded-lg hover:bg-[#333] transition-colors border border-white/10"
              >
                clear all
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
