import { useRef, useState, useEffect, useCallback } from 'react';
import { Move } from 'lucide-react';

interface InteractiveCanvasProps {
  backgroundImage: string;
  mountedArt: string | null;
  aspectRatio: number;
  wallCenterX: number;
  wallCenterY: number;
  wallWidthRatio: number;
  frameColor: string | null;
  perspective?: { rotateY: number; skewY: number };
}

interface RenderedArea {
  left: number; top: number; width: number; height: number;
}

function calcArea(container: HTMLDivElement, img: HTMLImageElement): RenderedArea | null {
  if (!img.naturalWidth || !img.naturalHeight) return null;
  const cW = container.clientWidth;
  const cH = container.clientHeight;
  const imgRatio = img.naturalWidth / img.naturalHeight;
  const containerRatio = cW / cH;
  let rW: number, rH: number;
  if (containerRatio > imgRatio) { rH = cH; rW = cH * imgRatio; }
  else { rW = cW; rH = cW / imgRatio; }
  return { left: (cW - rW) / 2, top: (cH - rH) / 2, width: rW, height: rH };
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

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;
    if (img.complete && img.naturalWidth) updateArea();
    else img.addEventListener('load', updateArea);
    const ro = new ResizeObserver(updateArea);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => { img.removeEventListener('load', updateArea); ro.disconnect(); };
  }, [backgroundImage, updateArea]);

  useEffect(() => { setDragDelta({ x: 0, y: 0 }); }, [wallCenterX, wallCenterY, wallWidthRatio]);

  // Poster boyutu: wallWidthRatio'nun %55'i kadar — daha gerçekçi oda ölçeği
  const posterWidth = renderedImg ? renderedImg.width * wallWidthRatio * 0.55 : 120;
  const posterHeight = posterWidth * aspectRatio;

  const centerX = renderedImg
    ? renderedImg.left + renderedImg.width * wallCenterX + dragDelta.x
    : 0;
  const centerY = renderedImg
    ? renderedImg.top + renderedImg.height * wallCenterY + dragDelta.y
    : 0;

  const posterLeft = centerX - posterWidth / 2;
  const posterTop = centerY - posterHeight / 2;

  const startDrag = useCallback((mx: number, my: number) => {
    dragging.current = true;
    dragStart.current = { mx, my, dx: dragDelta.x, dy: dragDelta.y };
  }, [dragDelta]);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    startDrag(e.clientX, e.clientY);
    const onMove = (ev: MouseEvent) => {
      if (!dragging.current) return;
      setDragDelta({ x: dragStart.current.dx + ev.clientX - dragStart.current.mx, y: dragStart.current.dy + ev.clientY - dragStart.current.my });
    };
    const onUp = () => { dragging.current = false; window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [startDrag]);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const t = e.touches[0];
    startDrag(t.clientX, t.clientY);
    const onMove = (ev: TouchEvent) => {
      if (!dragging.current) return;
      const touch = ev.touches[0];
      setDragDelta({ x: dragStart.current.dx + touch.clientX - dragStart.current.mx, y: dragStart.current.dy + touch.clientY - dragStart.current.my });
    };
    const onEnd = () => { dragging.current = false; window.removeEventListener('touchmove', onMove); window.removeEventListener('touchend', onEnd); };
    window.addEventListener('touchmove', onMove);
    window.addEventListener('touchend', onEnd);
  }, [startDrag]);

  const frameThickness = frameColor ? Math.max(8, posterWidth * 0.025) : 0;

  // Perspektif transform — rotateY değeri yoksa bile hafif 3D efekti için
  const rotY = perspective.rotateY;
  const skewY = perspective.skewY;

  return (
    <div ref={containerRef} className="relative w-full h-full rounded-2xl overflow-hidden bg-zinc-950">
      <img
        ref={imgRef}
        src={backgroundImage}
        alt="Room"
        className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none"
        draggable={false}
      />

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
            cursor: 'grab',
            userSelect: 'none',
            transition: dragging.current ? 'none' : 'left 0.5s cubic-bezier(0.34,1.56,0.64,1), top 0.5s cubic-bezier(0.34,1.56,0.64,1)',
            // Gerçekçi 3D perspektif
            transform: `perspective(800px) rotateY(${rotY}deg) skewY(${skewY}deg)`,
            transformOrigin: 'center center',
          }}
        >
          {/* Çerçeve katmanı */}
          {frameColor && (
            <div
              className="absolute inset-0 pointer-events-none z-20"
              style={{
                boxShadow: `inset 0 0 0 ${frameThickness}px ${frameColor}`,
                // Çerçeveye hafif iç gölge — derinlik hissi
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))',
              }}
            />
          )}

          {mountedArt ? (
            <>
              <img
                src={mountedArt}
                className="w-full h-full object-cover pointer-events-none select-none"
                draggable={false}
                alt="Wall art"
                style={{ padding: frameThickness }}
              />
              {/* Gerçekçi duvar gölgesi — posterın altına */}
              <div
                className="absolute pointer-events-none"
                style={{
                  inset: -2,
                  zIndex: -1,
                  boxShadow: `
                    0 10px 40px rgba(0,0,0,0.45),
                    0 4px 12px rgba(0,0,0,0.3),
                    0 1px 3px rgba(0,0,0,0.2)
                  `,
                }}
              />
              {/* Hafif ambient ışık overlay — odanın ışığına uyum */}
              <div
                className="absolute inset-0 pointer-events-none z-10"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(0,0,0,0.08) 100%)',
                  padding: frameThickness,
                }}
              />
            </>
          ) : (
            <div
              className="w-full h-full flex flex-col items-center justify-center gap-2"
              style={{
                border: '1.5px dashed rgba(255,255,255,0.25)',
                backgroundColor: 'rgba(255,255,255,0.03)',
                borderRadius: 2,
              }}
            >
              <Move className="w-5 h-5 opacity-40" />
              <span className="text-[10px] font-mono uppercase tracking-widest opacity-30">Drag me</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
