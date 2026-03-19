import { useRef, useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { Move } from 'lucide-react';

interface InteractiveCanvasProps {
  backgroundImage: string;
  mountedArt: string | null;
  aspectRatio: number;        // yükseklik / genişlik (örn: 36/24 = 1.5)
  wallCenterX: number;        // 0-1, duvarın yatay merkezi (görüntüye oranla)
  wallCenterY: number;        // 0-1, duvarın dikey merkezi (görüntüye oranla)
  wallWidthRatio: number;     // 0-1, duvarın genişliği (görüntü genişliğine oranla)
  frameColor: string | null;
  perspective?: { rotateY: number; skewY: number };
}

export function InteractiveCanvas({
  backgroundImage,
  mountedArt,
  aspectRatio,
  wallCenterX,
  wallCenterY,
  wallWidthRatio,
  frameColor,
  perspective = { rotateY: 0, skewY: 0 },
}: InteractiveCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Görüntünün container içindeki gerçek render alanı (px)
  const [renderedImg, setRenderedImg] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);

  // Poster'ın sürükleme offseti
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  // Görüntü yüklenince ve container boyutu değişince rendered alanı hesapla
  const calcRenderedArea = useCallback(() => {
    const container = containerRef.current;
    const img = imgRef.current;
    if (!container || !img || !img.naturalWidth) return;

    const cW = container.clientWidth;
    const cH = container.clientHeight;
    const iW = img.naturalWidth;
    const iH = img.naturalHeight;

    // object-contain hesabı
    const containerRatio = cW / cH;
    const imgRatio = iW / iH;

    let rW: number, rH: number;
    if (containerRatio > imgRatio) {
      rH = cH;
      rW = cH * imgRatio;
    } else {
      rW = cW;
      rH = cW / imgRatio;
    }

    const left = (cW - rW) / 2;
    const top = (cH - rH) / 2;

    setRenderedImg({ left, top, width: rW, height: rH });
    // Yeni analiz gelince drag offset'i sıfırla
    setDragOffset({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;
    if (img.complete && img.naturalWidth) {
      calcRenderedArea();
    }
    img.onload = calcRenderedArea;

    const ro = new ResizeObserver(calcRenderedArea);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [backgroundImage, calcRenderedArea]);

  // Analiz değerleri değişince drag sıfırla
  useEffect(() => {
    setDragOffset({ x: 0, y: 0 });
  }, [wallCenterX, wallCenterY, wallWidthRatio]);

  // Poster boyutunu hesapla
  const posterWidth = renderedImg ? renderedImg.width * wallWidthRatio * 0.38 : 0;
  const posterHeight = posterWidth * aspectRatio;

  // Poster'ın canvas içindeki merkez pozisyonu
  const posterCenterX = renderedImg
    ? renderedImg.left + renderedImg.width * wallCenterX + dragOffset.x
    : 0;
  const posterCenterY = renderedImg
    ? renderedImg.top + renderedImg.height * wallCenterY + dragOffset.y
    : 0;

  const framePadding = frameColor ? 8 : 0;
  const FRAME_BORDER = 12; // px, çerçeve kalınlığı

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full rounded-2xl overflow-hidden bg-zinc-950"
    >
      {/* Oda fotoğrafı */}
      <img
        ref={imgRef}
        src={backgroundImage}
        alt="Room"
        className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none"
        draggable={false}
      />

      {/* Poster / Çerçeve — sadece renderedImg hesaplandıktan sonra göster */}
      {renderedImg && (
        <motion.div
          drag
          dragConstraints={containerRef}
          dragElastic={0}
          dragMomentum={false}
          onDragStart={() => setIsDragging(true)}
          onDragEnd={(_, info) => {
            setIsDragging(false);
            setDragOffset(prev => ({
              x: prev.x + info.offset.x,
              y: prev.y + info.offset.y,
            }));
          }}
          className="absolute cursor-grab active:cursor-grabbing z-10"
          style={{
            width: posterWidth + framePadding * 2,
            height: posterHeight + framePadding * 2,
            left: posterCenterX - (posterWidth + framePadding * 2) / 2,
            top: posterCenterY - (posterHeight + framePadding * 2) / 2,
            backgroundColor: frameColor || 'transparent',
            boxShadow: mountedArt
              ? `0 20px 60px rgba(0,0,0,0.55), 0 4px 12px rgba(0,0,0,0.3)${frameColor ? `, inset 0 0 0 ${FRAME_BORDER}px ${frameColor}` : ''}`
              : 'none',
            border: !mountedArt ? '1.5px dashed rgba(255,255,255,0.25)' : 'none',
            transform: `perspective(1200px) rotateY(${perspective.rotateY}deg) skewY(${perspective.skewY}deg)`,
            borderRadius: 2,
          }}
        >
          {mountedArt ? (
            <img
              src={mountedArt}
              className="w-full h-full object-cover pointer-events-none select-none"
              style={{ padding: framePadding }}
              draggable={false}
              alt="Wall art"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2 opacity-30">
              <Move className="w-5 h-5" />
              <span className="text-[10px] font-mono uppercase tracking-widest">Empty Frame</span>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
