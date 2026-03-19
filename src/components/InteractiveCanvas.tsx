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
}

export function InteractiveCanvas({ 
  backgroundImage, 
  mountedArt, 
  physicalWidth, 
  physicalHeight, 
  naturalPixelsPerInch, 
  frameColor 
}: InteractiveCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [imageDims, setImageDims] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!backgroundImage) return;
    const img = new Image();
    img.src = backgroundImage;
    img.onload = () => {
      setImageDims({ width: img.width, height: img.height });
    };
  }, [backgroundImage]);

  // Ölçekleme faktörünü hesapla: Resmin ekrandaki gerçek boyutuna göre PPI'yı kalibre et
  const getScale = () => {
    if (!containerRef.current || imageDims.width === 0) return 1;
    const { clientWidth, clientHeight } = containerRef.current;
    const containerRatio = clientWidth / clientHeight;
    const imageRatio = imageDims.width / imageDims.height;

    if (containerRatio > imageRatio) {
      return clientHeight / imageDims.height;
    } else {
      return clientWidth / imageDims.width;
    }
  };

  const scale = getScale();
  // Poster boyutlarını PPI ve ekrandaki küçültme oranına göre hesapla
  // Burada 0.8 katsayısı, posterin odaya daha "gerçekçi" sığması için bir derinlik payıdır
  const widthPx = physicalWidth * naturalPixelsPerInch * scale * 0.8;
  const heightPx = physicalHeight * naturalPixelsPerInch * scale * 0.8;
  const frameThicknessPx = (naturalPixelsPerInch * scale) * 0.1; // İnce zarif çerçeve

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
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            // Hafif bir perspektif eğimi vererek duvarda gibi durmasını sağlıyoruz
            transform: 'perspective(1000px) rotateY(-2deg)'
          }}
        >
          <img 
            src={mountedArt} 
            alt="Mounted Art" 
            className="w-full h-full object-cover pointer-events-none"
            style={{
              boxShadow: frameColor ? 'inset 0 0 5px rgba(0,0,0,0.3)' : 'none'
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
