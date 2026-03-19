import { useRef, useState, useEffect, useCallback } from 'react';
import { Move } from 'lucide-react';

interface InteractiveCanvasProps {
  backgroundImage: string;
  mountedArt: string | null;
  aspectRatio: number;
  wallCenterX: number;   // 0-1
  wallCenterY: number;   // 0-1
  wallWidthRatio: number; // 0-1
  frameColor: string | null;
  perspective?: { rotateY: number; skewY: number };
}

interface RenderedArea {
  left: number;
  top: number;
  width: number;
  height: number;
}

function calcArea(container: HTMLDivElement, img: HTMLImageElement): RenderedArea | null {
  if (!img.naturalWidth || !img.naturalHeight) return null;
  const cW = container.clientWidth;
  const cH = container.clientHeight;
  const imgRatio = img.naturalWidth / img.naturalHeight;
  const containerRatio = cW / cH;
  let rW: number, rH: number;
  if (containerRatio > imgRatio) {
    rH = cH; rW = cH * imgRatio;
  } else {
    rW = cW; rH = cW / imgRatio;
  }
  return {
    left: (cW - rW) / 2,
    top: (cH - rH) / 2,
    width: rW,
    height: rH,
  };
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
  const [renderedImg, setRenderedImg] = useState<RenderedArea | null>(null);

  // Drag: piksel cinsinden delta (0,0 = analiz konumu)
  const [dragDelta, setDragDelta] = useState({ x: 0, y: 0 });
  const dragging = useRef(false);
  const dragStart = useRef({ mx: 0, my: 0, dx: 0, dy: 0 });

  const updateArea = useCallback(() => {
    const container = containerRef.current;
    const img = imgRef.current;
    if (!container || !img) return;
    const area = calcArea(container, img);
    if (area) setRenderedImg(area);
  }, []);

  // Görsel yüklenince ve container resize'da alan hesapla
  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;

    const onLoad = () => updateArea();

    if (img.complete && img.naturalWidth) {
      // Zaten yüklüyse hemen hesapla
      updateArea();
    } else {
      img.addEventListener('load', onLoad);
    }

    const ro = new ResizeObserver(updateArea);
    if (containerRef.current) ro.observe(containerRef.current);

    return () => {
      img.removeEventListener('load', onLoad);
      ro.disconnect();
    };
  }, [backgroundImage, updateArea]);

  // Analiz koordinatları değişince drag sıfırla
  useEffect(() => {
    setDragDelta({ x: 0, y: 0 });
  }, [wallCenterX, wallCenterY, wallWidthRatio]);

  // Poster boyutu
  const posterWidth = renderedImg ? renderedImg.width * wallWidthRatio * 0.38 : 120;
  const posterHeight = posterWidth * aspectRatio;

  // Poster merkezi — renderedImg varsa analiz koordinatları + drag delta
  const centerX = renderedImg
    ? renderedImg.left + renderedImg.width * wallCenterX + dragDelta.x
    : 0;
  const centerY = renderedImg
    ? renderedImg.top + renderedImg.height * wallCenterY + dragDelta.y
    : 0;

  const posterLeft = centerX - posterWidth / 2;
  const posterTop = centerY - posterHeight / 2;

  const startDrag = useCallback((startMX: number, startMY: number) => {
    dragging.current = true;
    dragStart.current = {
      mx: startMX,
      my: startMY,
      dx: dragDelta.x,
      dy: dragDelta.y,
    };
  }, [dragDelta]);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    startDrag(e.clientX, e.clientY);

    const onMove = (ev: MouseEvent) => {
      if (!dragging.current) return;
      setDragDelta({
        x: dragStart.current.dx + (ev.clientX - dragStart.current.mx),
        y: dragStart.current.dy + (ev.clientY - dragStart.current.my),
      });
    };
    const onUp = () => {
      dragging.current = false;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [startDrag]);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const t = e.touches[0];
    startDrag(t.clientX, t.clientY);

    const onMove = (ev: TouchEvent) => {
      if (!dragging.current) return;
      const touch = ev.touches[0];
      setDragDelta({
        x: dragStart.current.dx + (touch.clientX - dragStart.current.mx),
        y: dragStart.current.dy + (touch.clientY - dragStart.current.my),
      });
    };
    const onEnd = () => {
      dragging.current = false;
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
    };
    window.addEventListener('touchmove', onMove);
    window.addEventListener('touchend', onEnd);
  }, [startDrag]);

  const framePx = frameColor ? 10 : 0;

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full rounded-2xl overflow-hidden bg-zinc-950"
    >
      <img
        ref={imgRef}
        src={backgroundImage}
        alt="Room"
        className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none"
        draggable={false}
      />

      {/* Poster — renderedImg hazır olmadan render etme */}
      {renderedImg && (
        <div
          onMouseDown={onMouseDown}
          onTouchStart={onTouchStart}
          className="absolute z-10 select-none"
          style={{
            left: posterLeft,
            top: posterTop,
            width: posterWidth,
            height: posterHeight,
            cursor: dragging.current ? 'grabbing' : 'grab',
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
            transition: dragging.current ? 'none' : 'left 0.4s ease, top 0.4s ease',
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
      )}
    </div>
  );
}
