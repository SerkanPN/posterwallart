import { useRef, useState, useEffect, useCallback } from 'react';
import { Move } from 'lucide-react';

interface InteractiveCanvasProps {
  backgroundImage: string;
  mountedArt: string | null;
  aspectRatio: number;
  wallCenterX: number;       // 0-1, görüntüye göre
  wallCenterY: number;       // 0-1, görüntüye göre
  posterWidthRatio: number;  // 0-1, render edilmiş görüntü genişliğine göre
  frameColor: string | null;
  perspective?: { rotateY: number; skewY: number };
}

export function InteractiveCanvas({
  backgroundImage,
  mountedArt,
  aspectRatio,
  wallCenterX,
  wallCenterY,
  posterWidthRatio,
  frameColor,
  perspective = { rotateY: 0, skewY: 0 },
}: InteractiveCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Görüntünün container içindeki render alanı (px)
  const [imgRect, setImgRect] = useState<{ left: number; top: number; width: number; height: number } | null>(null);

  // Drag offset (px)
  const [drag, setDrag] = useState({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const dragOrigin = useRef({ mx: 0, my: 0, ox: 0, oy: 0 });

  // Görüntünün container içindeki gerçek render alanını hesapla
  const measure = useCallback(() => {
    const c = containerRef.current;
    const img = imgRef.current;
    if (!c || !img || !img.naturalWidth) return;

    const cw = c.clientWidth;
    const ch = c.clientHeight;
    const ir = img.naturalWidth / img.naturalHeight;
    const cr = cw / ch;

    let rw: number, rh: number;
    if (cr > ir) { rh = ch; rw = ch * ir; }
    else { rw = cw; rh = cw / ir; }

    setImgRect({ left: (cw - rw) / 2, top: (ch - rh) / 2, width: rw, height: rh });
  }, []);

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;

    if (img.complete && img.naturalWidth) {
      measure();
    } else {
      img.addEventListener('load', measure);
    }

    const ro = new ResizeObserver(measure);
    if (containerRef.current) ro.observe(containerRef.current);

    return () => {
      img?.removeEventListener('load', measure);
      ro.disconnect();
    };
  }, [backgroundImage, measure]);

  // Analiz değerleri değişince drag sıfırla
  useEffect(() => {
    setDrag({ x: 0, y: 0 });
  }, [wallCenterX, wallCenterY, posterWidthRatio]);

  // Poster px boyutları
  const posterW = imgRect ? imgRect.width * posterWidthRatio : 0;
  const posterH = posterW * aspectRatio;
  const frameThickness = frameColor ? Math.max(8, posterW * 0.03) : 0;

  // Poster merkez pozisyonu (canvas'a göre, px)
  const cx = imgRect ? imgRect.left + imgRect.width * wallCenterX + drag.x : 0;
  const cy = imgRect ? imgRect.top + imgRect.height * wallCenterY + drag.y : 0;

  // Drag handlers
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    isDragging.current = true;
    dragOrigin.current = { mx: e.clientX, my: e.clientY, ox: drag.x, oy: drag.y };
  }, [drag]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return;
    setDrag({
      x: dragOrigin.current.ox + e.clientX - dragOrigin.current.mx,
      y: dragOrigin.current.oy + e.clientY - dragOrigin.current.my,
    });
  }, []);

  const onPointerUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  if (!imgRect || posterW === 0) {
    return (
      <div ref={containerRef} className="relative w-full h-full rounded-2xl overflow-hidden bg-zinc-950">
        <img
          ref={imgRef}
          src={backgroundImage}
          alt="Room"
          className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none"
          draggable={false}
        />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full h-full rounded-2xl overflow-hidden bg-zinc-950">
      {/* Oda görseli */}
      <img
        ref={imgRef}
        src={backgroundImage}
        alt="Room"
        className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none"
        draggable={false}
      />

      {/* Poster / Boş çerçeve */}
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{
          position: 'absolute',
          left: cx - posterW / 2,
          top: cy - posterH / 2,
          width: posterW,
          height: posterH,
          cursor: isDragging.current ? 'grabbing' : 'grab',
          userSelect: 'none',
          touchAction: 'none',
          transform: `perspective(900px) rotateY(${perspective.rotateY}deg) skewY(${perspective.skewY}deg)`,
          transformOrigin: 'center center',
          transition: isDragging.current ? 'none' : 'left 0.45s cubic-bezier(0.34,1.4,0.64,1), top 0.45s cubic-bezier(0.34,1.4,0.64,1)',
          zIndex: 10,
          borderRadius: 2,
          // Çerçeve
          ...(frameColor
            ? { outline: `${frameThickness}px solid ${frameColor}` }
            : !mountedArt
              ? { border: '2px dashed rgba(255,255,255,0.35)' }
              : {}),
          // Gölge (sadece poster varsa)
          boxShadow: mountedArt
            ? '0 16px 50px rgba(0,0,0,0.55), 0 4px 14px rgba(0,0,0,0.35)'
            : 'none',
        }}
      >
        {mountedArt ? (
          <>
            <img
              src={mountedArt}
              draggable={false}
              alt="Wall art"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
                pointerEvents: 'none',
                userSelect: 'none',
              }}
            />
            {/* Hafif ambient ışık yansıması */}
            <div style={{
              position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 2,
              background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(0,0,0,0.08) 100%)',
            }} />
          </>
        ) : (
          <div style={{
            width: '100%', height: '100%',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: 8,
            backgroundColor: 'rgba(255,255,255,0.03)',
          }}>
            <Move size={20} style={{ opacity: 0.4 }} />
            <span style={{ fontSize: 10, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.3 }}>
              Drag me
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
