import { useRef, useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Move } from 'lucide-react';

interface InteractiveCanvasProps {
  backgroundImage: string;
  mountedArt: string | null;
  physicalWidth: number;
  physicalHeight: number;
  naturalPixelsPerInch: number;
  frameColor: string | null;
  perspective?: { rotateY: number; skewY: number };
}

export function InteractiveCanvas({ 
  backgroundImage, 
  mountedArt, 
  physicalWidth, 
  physicalHeight, 
  naturalPixelsPerInch, 
  frameColor,
  perspective = { rotateY: 0, skewY: 0 }
}: InteractiveCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [displayScale, setDisplayScale] = useState(1);

  useEffect(() => {
    if (!backgroundImage || !containerRef.current) return;

    const img = new Image();
    img.src = backgroundImage;
    img.onload = () => {
      const container = containerRef.current;
      if (!container || container.clientHeight === 0 || container.clientWidth === 0) return;
      
      const containerRatio = container.clientWidth / container.clientHeight;
      const imgRatio = img.width / (img.height || 1);

      let renderedWidth;
      if (containerRatio > imgRatio) {
        renderedWidth = container.clientHeight * imgRatio;
      } else {
        renderedWidth = container.clientWidth;
      }

      const newScale = renderedWidth / (img.width || 1);
      if (!isNaN(newScale) && isFinite(newScale) && newScale > 0) {
        setDisplayScale(newScale);
      }
    };

    const handleResize = () => {
      if (img.complete) img.onload?.(new Event('load'));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [backgroundImage]);

  const safeDisplayScale = isNaN(displayScale) || displayScale <= 0 ? 1 : displayScale;
  const safeNaturalPPI = isNaN(naturalPixelsPerInch) || naturalPixelsPerInch <= 0 ? 15 : naturalPixelsPerInch;
  
  const effectivePPI = safeNaturalPPI * safeDisplayScale;
  
  const safePhysicalWidth = isNaN(physicalWidth) || physicalWidth <= 0 ? 24 : physicalWidth;
  const safePhysicalHeight = isNaN(physicalHeight) || physicalHeight <= 0 ? 36 : physicalHeight;

  const widthPx = safePhysicalWidth * effectivePPI;
  const heightPx = safePhysicalHeight * effectivePPI;
  const frameThicknessPx = effectivePPI * 0.05;

  return (
    <div 
      ref={containerRef} 
      className="relative w-full h-full rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950 flex items-center justify-center shadow-2xl"
    >
      {backgroundImage && (
        <img 
          src={backgroundImage} 
          alt="Room" 
          className="absolute inset-0 w-full h-full object-contain pointer-events-none" 
        />
      )}

      {mountedArt ? (
        <motion.div
          drag
          dragConstraints={containerRef}
          dragElastic={0}
          dragMomentum={false}
          className="absolute cursor-grab active:cursor-grabbing flex items-center justify-center"
          style={{ 
            width: widthPx, 
            height: heightPx,
            padding: frameColor ? `${frameThicknessPx}px` : '0px',
            backgroundColor: frameColor || 'transparent',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
            transform: `perspective(1000px) rotateY(${perspective.rotateY}deg) skewY(${perspective.skewY}deg)`
          }}
        >
          <img 
            src={mountedArt} 
            alt="Mounted Art" 
            className="w-full h-full object-cover pointer-events-none"
            style={{
              boxShadow: frameColor ? 'inset 0 0 10px rgba(0,0,0,0.5)' : 'none'
            }}
            draggable={false}
          />
        </motion.div>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="bg-black/50 backdrop-blur-sm px-6 py-3 rounded-full border border-zinc-800 text-sm font-mono text-zinc-400 uppercase tracking-widest flex items-center gap-3">
            <Move className="w-4 h-4" />
            <span>Select art to mount</span>
          </div>
        </div>
      )}
    </div>
  );
}
