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
  const [imageDims, setImageDims] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!backgroundImage) return;
    const img = new Image();
    img.src = backgroundImage;
    img.onload = () => setImageDims({ width: img.width, height: img.height });
  }, [backgroundImage]);

  const getScale = () => {
    if (!containerRef.current || imageDims.width === 0) return 1;
    const { clientWidth, clientHeight } = containerRef.current;
    const containerRatio = clientWidth / clientHeight;
    const imageRatio = imageDims.width / imageDims.height;
    return containerRatio > imageRatio ? clientHeight / imageDims.height : clientWidth / imageDims.width;
  };

  const scale = getScale();
  const widthPx = physicalWidth * naturalPixelsPerInch * scale;
  const heightPx = physicalHeight * naturalPixelsPerInch * scale;
  const frameThicknessPx = (naturalPixelsPerInch * scale) * 0.05;

  return (
    <div ref={containerRef} className="relative w-full h-full rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950 flex items-center justify-center shadow-2xl">
      {backgroundImage && <img src={backgroundImage} alt="Room" className="absolute inset-0 w-full h-full object-contain pointer-events-none" />}

      {mountedArt ? (
        <motion.div
          drag
          dragConstraints={containerRef}
          className="absolute cursor-grab active:cursor-grabbing flex items-center justify-center z-10"
          style={{ 
            width: widthPx, 
            height: heightPx,
            padding: frameColor ? `${frameThicknessPx}px` : '0px',
            backgroundColor: frameColor || 'transparent',
            boxShadow: '0 30px 60px rgba(0,0,0,0.6)',
            // NANO BANANA 2 PERSPEKTİF VERİSİ BURADA
            transform: `perspective(1200px) rotateY(${perspective.rotateY}deg) skewY(${perspective.skewY}deg)`
          }}
        >
          <img src={mountedArt} alt="Mounted Art" className="w-full h-full object-cover pointer-events-none rounded-sm" draggable={false} />
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
