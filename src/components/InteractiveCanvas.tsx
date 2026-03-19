import { useRef, useState, useEffect, useCallback } from 'react';
import { Move } from 'lucide-react';

interface InteractiveCanvasProps {
  backgroundImage: string;
  mountedArt: string | null;
  aspectRatio: number;        // height / width
  wallCenterX: number;        // 0-1
  wallCenterY: number;        // 0-1
  wallWidthRatio: number;     // 0-1
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

  // Görüntünün container içindeki gerçek render alanı
  const [renderedImg, setRenderedImg] = useState<{
    left: number; top: number; width: number; height: number;
  } | null>(null);

  // Manuel drag pozisyonu (px, container'a göre)
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const dragging = useRef(false);
  const dragStart = useRef({ mouseX: 0, mouseY: 0, posX: 0, posY: 0 });

  const calcRenderedArea = useCallback(() => {
    const container = containerRef.current;
    const img = imgRef.current;
    if (!container || !img || !img.naturalWidth) return;

    const cW = container.clientWidth;
    const cH = container.clientHeight;
    const iW = img.naturalWidth;
    const iH = img.naturalHeight;
    const containerRatio = cW / cH;
    const imgRatio = iW / iH;

    let rW: number, rH: number;
    if (containerRatio > imgRatio) {
      rH = cH; rW = cH * imgRatio;
    } else {
      rW = cW; rH = cW / imgRatio;
    }

    const left = (cW - rW) / 2;
    const top = (cH - rH) / 2;
    setRenderedImg({ left, top, width: rW, height: rH });
  }, []);

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;
    if (img.complete && img.naturalWidth) calcRenderedArea();
    img.onload = calcRenderedArea;
    const ro = new ResizeObserver(calcRenderedArea);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [backgroundImage, calcRenderedArea]);

  // Analiz değerleri veya renderedImg değişince poster pozisyonunu sıfırla
  useEffect(() => {
    setPos(null);
  }, [wallCenterX, wallCenterY, wallWidthRatio, renderedImg]);

  // Poster boyutu
  const posterWidth = renderedImg ? renderedImg.width * wallWidthRatio * 0.38 : 100;
  const posterHeight = posterWidth * aspectRatio;

  // Poster'ın merkez pozisyonu (manuel drag yoksa analiz değerlerinden hesapla)
  const centerX = pos !== null
    ? pos.x
    : renderedImg
      ? renderedImg.left + renderedImg.width * wallCenterX
      : 200;
  const centerY = pos !== null
    ? pos.y
    : renderedImg
      ? renderedImg.top + renderedImg.height * wallCenterY
      : 200;

  // Poster'ın sol-üst köşesi
  const posterLeft = centerX - posterWidth / 2;
  const posterTop = centerY - posterHeight / 2;

  // Mouse drag handler'ları
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = true;
    dragStart.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      posX: centerX,
      posY: centerY,
    };

    const onMouseMove = (ev: MouseEvent) => {
      if (!dragging.current) return;
      const dx = ev.clientX - dragStart.current.mouseX;
      const dy = ev.clientY - dragStart.current.mouseY;
      setPos({
        x: dragStart.current.posX + dx,
        y: dragStart.current.posY + dy,
      });
    };

    const onMouseUp = () => {
      dragging.current = false;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, [centerX, centerY]);

  // Touch drag handler'ları
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    dragging.current = true;
    dragStart.current = {
      mouseX: touch.clientX,
      mouseY: touch.clientY,
      posX: centerX,
      posY: centerY,
    };

    const onTouchMove = (ev: TouchEvent) => {
      if (!dragging.current) return;
      const t = ev.touches[0];
      const dx = t.clientX - dragStart.current.mouseX;
      const dy = t.clientY - dragStart.current.mouseY;
      setPos({
        x: dragStart.current.posX + dx,
        y: dragStart.current.posY + dy,
      });
    };

    const onTouchEnd = () => {
      dragging.current = false;
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };

    window.addEventListener('touchmove', onTouchMove);
    window.addEventListener('touchend', onTouchEnd);
  }, [centerX, centerY]);

  const framePx = frameColor ? 10 : 0;

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

      {/* Poster / Çerçeve */}
      <div
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
        className="absolute z-10 select-none"
        style={{
          left: posterLeft,
          top: posterTop,
          width: posterWidth,
          height: posterHeight,
          cursor: 'grab',
          transform: `perspective(1200px) rotateY(${perspective.rotateY}deg) skewY(${perspective.skewY}deg)`,
          boxShadow: mountedArt
            ? '0 20px 60px rgba(0,0,0,0.55), 0 4px 12px rgba(0,0,0,0.3)'
            : 'none',
          border: !mountedArt
            ? '1.5px dashed rgba(255,255,255,0.3)'
            : frameColor
              ? `${framePx}px solid ${frameColor}`
              : 'none',
          borderRadius: 2,
          backgroundColor: !mountedArt ? 'rgba(255,255,255,0.04)' : 'transparent',
          userSelect: 'none',
        }}
      >
        {mountedArt ? (
          <img
            src={mountedArt}
            className="w-full h-full object-cover pointer-events-none select-none"
            draggable={false}
            alt="Wall art"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 opacity-40">
            <Move className="w-5 h-5" />
            <span className="text-[10px] font-mono uppercase tracking-widest">Drag me</span>
          </div>
        )}
      </div>
    </div>
  );
}
