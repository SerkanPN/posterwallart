import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as fabric from 'fabric';
import JSZip from 'jszip';
import jsPDF from 'jspdf';

const GOOGLE_FONTS = [
  "Inter", "Montserrat", "Roboto", "Open Sans", "Oswald", "Lato", "Poppins", 
  "Playfair Display", "Raleway", "Ubuntu", "Merriweather", "Nunito", "Cinzel", 
  "Dancing Script", "Pacifico", "Caveat", "Bebas Neue", "Anton", "Josefin Sans", 
  "Lobster", "Righteous", "Permanent Marker", "Abril Fatface", "Vampiro One", 
  "Alfa Slab One", "Syncopate", "Bangers", "Creepster", "Sacramento", "Satisfy",
  "Amatic SC", "Kalam", "Courgette", "Great Vibes", "Teko", "Russo One",
  "Prata", "Vollkorn", "Lora", "Crimson Text", "Zilla Slab", "Bungee", 
  "Fredoka One", "Carter One", "Patua One", "Chewy", "Shrikhand"
];

const PRINT_SIZES = [
  { value: '5.83x8.27', label: 'A5 (5.83" x 8.27")' },
  { value: '8.27x11.69', label: 'A4 (8.27" x 11.69")' },
  { value: '11.69x16.54', label: 'A3 (11.69" x 16.54")' },
  { value: '16.54x23.39', label: 'A2 (16.54" x 23.39")' },
  { value: '23.39x33.11', label: 'A1 (23.39" x 33.11")' },
  { value: '5x7', label: '5" x 7"' },
  { value: '6x8', label: '6" x 8"' },
  { value: '8x10', label: '8" x 10"' },
  { value: '9x11', label: '9" x 11"' },
  { value: '11x14', label: '11" x 14"' },
  { value: '11x17', label: '11" x 17"' },
  { value: '11.7x16.5', label: '11.7" x 16.5"' },
  { value: '12x16', label: '12" x 16"' },
  { value: '12x18', label: '12" x 18"' },
  { value: '16x20', label: '16" x 20"' },
  { value: '16x24', label: '16" x 24"' },
  { value: '16.5x23.4', label: '16.5" x 23.4"' },
  { value: '18x24', label: '18" x 24"' },
  { value: '20x30', label: '20" x 30"' },
  { value: '22x34', label: '22" x 34"' },
  { value: '23.4x33.1', label: '23.4" x 33.1"' },
  { value: '24x32', label: '24" x 32"' },
  { value: '24x36', label: '24" x 36"' },
  { value: '26x36', label: '26" x 36"' },
  { value: '28x40', label: '28" x 40"' },
  { value: '30x40', label: '30" x 40"' },
  { value: '40x50', label: '40" x 50"' },
  { value: '50x60', label: '50" x 60"' },
  { value: '60x80', label: '60" x 80"' },
  { value: '68x80', label: '68" x 80"' },
  { value: '88x104', label: '88" x 104"' },
];

const DEFAULT_POSTER_COLORS = [
  '#f5f5f5', '#e8dcc8', '#d9cfc1', '#c9b8a3',
  '#111111', '#2b2b2b', '#8fae94', '#c98a7d',
  '#e0c36c', '#a3b8d9', '#d9a3c9', '#9dd9c9',
];

const DPI = 300;
const BASE_MAX_W = 420;
const BASE_MAX_H = 560;

const EDIT_TYPES = {
  TOP_LEFT: 'sw-top-left',
  TOP_RIGHT: 'sw-top-right',
  MAIN_TITLE: 'sw-main-title',
  BOTTOM: 'sw-bottom',
  SOUNDWAVE: 'sw-soundwave',
};

interface OrientedSize {
  w: number;
  h: number;
}

function parseAndOrientSize(value: string, orientation: 'portrait' | 'landscape'): OrientedSize {
  const [w, h] = value.split('x').map(Number);
  if (orientation === 'landscape') {
    return { w: Math.max(w, h), h: Math.min(w, h) };
  }
  return { w: Math.min(w, h), h: Math.max(w, h) };
}

function fitContain(wIn: number, hIn: number, maxW: number, maxH: number) {
  const aspect = wIn / hIn;
  let width = maxW;
  let height = width / aspect;
  if (height > maxH) {
    height = maxH;
    width = height * aspect;
  }
  return { width: Math.round(width), height: Math.round(height) };
}

function generateAestheticPeaks(count: number): number[] {
  const peaks: number[] = [];
  for (let i = 0; i < count; i++) {
    const envelope = Math.sin((i / (count - 1)) * Math.PI);
    const noise = 0.2 + 0.8 * Math.random();
    peaks.push(envelope * noise);
  }
  return peaks;
}

interface FontStyleSelectorProps {
  weight: string;
  style: string;
  onChange: (w: string, s: string) => void;
}

const FontStyleSelector: React.FC<FontStyleSelectorProps> = ({ weight, style, onChange }) => (
  <select value={`${weight}-${style}`} onChange={(e) => {
    const [w, s] = e.target.value.split('-');
    onChange(w, s);
  }}>
    <option value="100-normal">Thin (100)</option>
    <option value="100-italic">Thin Italic</option>
    <option value="300-normal">Light (300)</option>
    <option value="300-italic">Light Italic</option>
    <option value="400-normal">Regular (400)</option>
    <option value="400-italic">Italic (400)</option>
    <option value="500-normal">Medium (500)</option>
    <option value="500-italic">Medium Italic</option>
    <option value="600-normal">Semi-Bold (600)</option>
    <option value="600-italic">Semi-Bold Italic</option>
    <option value="700-normal">Bold (700)</option>
    <option value="700-italic">Bold Italic</option>
    <option value="800-normal">Extra-Bold (800)</option>
    <option value="800-italic">Extra-Bold Italic</option>
    <option value="900-normal">Black (900)</option>
    <option value="900-italic">Black Italic</option>
  </select>
);

interface SoundwavePosterPageProps {
  navigate: (path: string) => void;
}

export default function SoundwavePosterPage({ navigate }: SoundwavePosterPageProps) {
  const canvasElRef = useRef<HTMLCanvasElement | null>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const bgRectRef = useRef<fabric.Rect | null>(null);
  const bgImageRef = useRef<fabric.Image | null>(null);
  const bgOverlayRef = useRef<fabric.Rect | null>(null);
  const waveGroupRef = useRef<fabric.Group | null>(null);

  const isRebuildingRef = useRef<boolean>(false);
  const rawAudioDataRef = useRef<Float32Array | null>(null);

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    size: true,
    texts: true,
    soundwave: true,
    background: false,
    multiExport: true,
    download: true,
  });

  const [canvasSize, setCanvasSize] = useState<string>('30x40');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [containerDims, setContainerDims] = useState(() => {
    const { w, h } = parseAndOrientSize('30x40', 'portrait');
    return fitContain(w, h, BASE_MAX_W, BASE_MAX_H);
  });
  const [zoom, setZoom] = useState<number>(1); 

  const [topLeftText, setTopLeftText] = useState('I LOVE YOU');
  const [topLeftColor, setTopLeftColor] = useState('#212121');
  const [topLeftFontFamily, setTopLeftFontFamily] = useState('Montserrat, sans-serif');
  const [topLeftFontSize, setTopLeftFontSize] = useState(18);
  const [topLeftCharSpacing, setTopLeftCharSpacing] = useState(100);
  const [topLeftFontWeight, setTopLeftFontWeight] = useState('700');
  const [topLeftFontStyle, setTopLeftFontStyle] = useState('normal');

  const [topRightText, setTopRightText] = useState('00:00:00');
  const [topRightColor, setTopRightColor] = useState('#212121');
  const [topRightFontFamily, setTopRightFontFamily] = useState('Montserrat, sans-serif');
  const [topRightFontSize, setTopRightFontSize] = useState(18);
  const [topRightCharSpacing, setTopRightCharSpacing] = useState(100);
  const [topRightFontWeight, setTopRightFontWeight] = useState('700');
  const [topRightFontStyle, setTopRightFontStyle] = useState('normal');

  const [bottomText, setBottomText] = useState('OUR SPECIAL MOMENT');
  const [bottomColor, setBottomColor] = useState('#555555');
  const [bottomFontFamily, setBottomFontFamily] = useState('Montserrat, sans-serif');
  const [bottomFontSize, setBottomFontSize] = useState(14);
  const [bottomCharSpacing, setBottomCharSpacing] = useState(50);
  const [bottomFontWeight, setBottomFontWeight] = useState('700');
  const [bottomFontStyle, setBottomFontStyle] = useState('normal');

  const [mainTitleText, setMainTitleText] = useState('SOUNDWAVE');
  const [mainTitleColor, setMainTitleColor] = useState('#212121');
  const [mainTitleFontFamily, setMainTitleFontFamily] = useState('Josefin Sans, sans-serif');
  const [mainTitleFontSize, setMainTitleFontSize] = useState(36);
  const [mainTitleCharSpacing, setMainTitleCharSpacing] = useState(100);
  const [mainTitleFontWeight, setMainTitleFontWeight] = useState('800');
  const [mainTitleFontStyle, setMainTitleFontStyle] = useState('normal');

  const [waveMode, setWaveMode] = useState<'random' | 'audio'>('random'); 
  const [waveColor, setWaveColor] = useState('#181818');
  const [waveBarCount, setWaveBarCount] = useState(60);
  const [waveBarWidth, setWaveBarWidth] = useState(3);
  const [waveBarGap, setWaveBarGap] = useState(2);
  const [waveBarRadius, setWaveBarRadius] = useState(2);
  const [waveHeightScale, setWaveHeightScale] = useState(120);

  const [bgType, setBgType] = useState<'color' | 'blur'>('color');
  const [bgColor, setBgColor] = useState('#f5f5f5');
  const [bgBlur, setBgBlur] = useState(10);
  const [bgImageUrl, setBgImageUrl] = useState<string | null>(null);

  const [exportColors, setExportColors] = useState(
    DEFAULT_POSTER_COLORS.map((c) => ({ color: c, checked: true }))
  );

  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [toast, setToast] = useState<string>('');

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2200);
  }, []);

  const toggleAccordion = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  useEffect(() => {
    if (!canvasElRef.current) return;
    
    const canvas = new fabric.Canvas(canvasElRef.current, {
      width: containerDims.width,
      height: containerDims.height,
      backgroundColor: '#f5f5f5',
      preserveObjectStacking: true,
      selection: true,
    });
    fabricRef.current = canvas;

    const bgRect = new fabric.Rect({
      left: 0,
      top: 0,
      width: containerDims.width,
      height: containerDims.height,
      fill: bgColor,
      selectable: false,
      evented: false,
    });
    canvas.add(bgRect);
    bgRectRef.current = bgRect;

    const overlay = new fabric.Rect({
      left: 0,
      top: 0,
      width: containerDims.width,
      height: containerDims.height,
      fill: 'rgba(0,0,0,0.5)',
      selectable: false,
      evented: false,
      visible: false,
    });
    canvas.add(overlay);
    bgOverlayRef.current = overlay;

    const topLeft = new fabric.IText(topLeftText, {
      left: containerDims.width * 0.08,
      top: containerDims.height * 0.08,
      fontSize: topLeftFontSize,
      fontFamily: topLeftFontFamily,
      fontWeight: topLeftFontWeight,
      fontStyle: topLeftFontStyle,
      fill: topLeftColor,
      charSpacing: topLeftCharSpacing,
      data: { edType: EDIT_TYPES.TOP_LEFT },
    });
    canvas.add(topLeft);

    const topRight = new fabric.IText(topRightText, {
      left: containerDims.width * 0.92,
      top: containerDims.height * 0.08,
      originX: 'right',
      fontSize: topRightFontSize,
      fontFamily: topRightFontFamily,
      fontWeight: topRightFontWeight,
      fontStyle: topRightFontStyle,
      fill: topRightColor,
      charSpacing: topRightCharSpacing,
      data: { edType: EDIT_TYPES.TOP_RIGHT },
    });
    canvas.add(topRight);

    const mainTitle = new fabric.Textbox(mainTitleText, {
      left: containerDims.width / 2,
      top: containerDims.height * 0.12,
      width: containerDims.width * 0.84,
      originX: 'center',
      textAlign: 'center',
      fontSize: mainTitleFontSize,
      fontFamily: mainTitleFontFamily,
      fontWeight: mainTitleFontWeight,
      fontStyle: mainTitleFontStyle,
      fill: mainTitleColor,
      charSpacing: mainTitleCharSpacing,
      data: { edType: EDIT_TYPES.MAIN_TITLE },
    });
    canvas.add(mainTitle);

    const bottom = new fabric.IText(bottomText, {
      left: containerDims.width / 2,
      top: containerDims.height * 0.92,
      originX: 'center',
      fontSize: bottomFontSize,
      fontFamily: bottomFontFamily,
      fontWeight: bottomFontWeight,
      fontStyle: bottomFontStyle,
      fill: bottomColor,
      charSpacing: bottomCharSpacing,
      data: { edType: EDIT_TYPES.BOTTOM },
    });
    canvas.add(bottom);

    (canvas as any).textLeftRef = topLeft;
    (canvas as any).textRightRef = topRight;
    (canvas as any).textTitleRef = mainTitle;
    (canvas as any).textBottomRef = bottom;

    buildSoundwaveGroup(canvas, containerDims, waveBarCount, waveBarWidth, waveBarGap, waveBarRadius, waveColor, waveHeightScale);

    canvas.on('selection:created', onSelectionChange);
    canvas.on('selection:updated', onSelectionChange);
    
    canvas.on('selection:cleared', () => {
      if (isRebuildingRef.current) return;
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.closest('#panel') || activeEl.closest('#props-panel'))) return;
      setSelectedType(null);
    });

    canvas.on('text:changed', (e: any) => {
      const t = e.target;
      if (!t || !t.data) return;
      const v = t.text;
      switch (t.data.edType) {
        case EDIT_TYPES.TOP_LEFT: setTopLeftText(v); break;
        case EDIT_TYPES.TOP_RIGHT: setTopRightText(v); break;
        case EDIT_TYPES.MAIN_TITLE: setMainTitleText(v); break;
        case EDIT_TYPES.BOTTOM: setBottomText(v); break;
        default: break;
      }
    });

    const fontWeightsStr = ':100,100i,300,300i,400,400i,500,500i,600,600i,700,700i,800,800i,900,900i';
    const link = document.createElement('link');
    link.href = `https://fonts.googleapis.com/css?family=${GOOGLE_FONTS.map(f => f.replace(/ /g, '+') + fontWeightsStr).join('|')}&display=swap`;
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    canvas.renderAll();

    return () => {
      canvas.dispose();
    };
  }, []);

  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    canvas.setZoom(zoom);
    canvas.setWidth(containerDims.width * zoom);
    canvas.setHeight(containerDims.height * zoom);
    canvas.renderAll();
  }, [zoom, containerDims]);

  function onSelectionChange(e: any) {
    if (isRebuildingRef.current) return;
    const obj = e.selected && e.selected.length === 1 ? e.selected[0] : null;
    if (obj) {
      if (obj.data && obj.data.edType) {
        setSelectedType(obj.data.edType);
      } else if (obj.type === 'group') {
        setSelectedType('group');
      } else {
        setSelectedType('multi');
      }
    } else {
      setSelectedType('multi');
    }
  }

  const extractPeaksFromAudio = (rawData: Float32Array, count: number): number[] => {
    const blockSize = Math.floor(rawData.length / count);
    const peaks: number[] = [];
    for (let i = 0; i < count; i++) {
      let max = 0;
      for (let j = 0; j < blockSize; j++) {
        let val = Math.abs(rawData[i * blockSize + j]);
        if (val > max) max = val;
      }
      peaks.push(max);
    }
    const globalMax = Math.max(...peaks) || 1;
    return peaks.map(p => p / globalMax);
  };

  const processAudioFile = async (file: File) => {
    try {
      showToast('Processing audio...');
      const arrayBuffer = await file.arrayBuffer();
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
      rawAudioDataRef.current = audioBuffer.getChannelData(0);
      rebuildSoundwave();
      showToast('Soundwave generated successfully.');
    } catch (err) {
      showToast('Error processing audio file.');
    }
  };

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      setWaveMode('audio');
      processAudioFile(file);
    }
  };

  function buildSoundwaveGroup(
    canvas: fabric.Canvas, 
    dims: { width: number; height: number }, 
    count: number, 
    barWidth: number, 
    barGap: number, 
    barRadius: number, 
    color: string, 
    heightScale: number
  ) {
    isRebuildingRef.current = true;
    
    const wasSelected = waveGroupRef.current && canvas.getActiveObject() === waveGroupRef.current;

    if (waveGroupRef.current) {
      canvas.remove(waveGroupRef.current);
    }

    let peaks: number[] = [];
    if (waveMode === 'audio' && rawAudioDataRef.current) {
      peaks = extractPeaksFromAudio(rawAudioDataRef.current, count);
    } else {
      peaks = generateAestheticPeaks(count);
    }

    const totalWidth = (barWidth * count) + (barGap * (count - 1));
    const startX = -totalWidth / 2;
    const maxHeight = dims.height * (heightScale / 100);

    const bars = peaks.map((p, index) => {
      const h = Math.max(p * maxHeight, barWidth);
      return new fabric.Rect({
        left: startX + (index * (barWidth + barGap)),
        top: -h / 2,
        width: barWidth,
        height: h,
        fill: color,
        rx: barRadius,
        ry: barRadius,
        originX: 'left',
        originY: 'top',
        selectable: false,
        evented: false,
      });
    });

    const group = new fabric.Group(bars, {
      left: dims.width / 2,
      top: dims.height * 0.55,
      originX: 'center',
      originY: 'center',
      objectCaching: true,
      data: { edType: EDIT_TYPES.SOUNDWAVE },
    });
    
    canvas.add(group);
    waveGroupRef.current = group;

    if (wasSelected) {
      canvas.setActiveObject(group);
    }
    
    canvas.requestRenderAll();
    isRebuildingRef.current = false;
  }

  const rebuildSoundwave = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    buildSoundwaveGroup(canvas, containerDims, waveBarCount, waveBarWidth, waveBarGap, waveBarRadius, waveColor, waveHeightScale);
  }, [containerDims, waveMode, waveBarCount, waveBarWidth, waveBarGap, waveBarRadius, waveColor, waveHeightScale]);

  const handleSizeOrOrientationChange = (newSize: string, newOrient: 'portrait' | 'landscape') => {
    setCanvasSize(newSize);
    setOrientation(newOrient);
    
    const { w, h } = parseAndOrientSize(newSize, newOrient);
    const dims = fitContain(w, h, BASE_MAX_W, BASE_MAX_H);
    setContainerDims(dims);
    
    const canvas = fabricRef.current;
    if (!canvas) return;
    
    canvas.setWidth(dims.width * zoom);
    canvas.setHeight(dims.height * zoom);
    if (bgRectRef.current) bgRectRef.current.set({ width: dims.width, height: dims.height });
    if (bgOverlayRef.current) bgOverlayRef.current.set({ width: dims.width, height: dims.height });
    
    const anyCanvas = canvas as any;
    if (anyCanvas.textLeftRef) anyCanvas.textLeftRef.set({ left: dims.width * 0.08, top: dims.height * 0.08 });
    if (anyCanvas.textRightRef) anyCanvas.textRightRef.set({ left: dims.width * 0.92, top: dims.height * 0.08 });
    if (anyCanvas.textTitleRef) anyCanvas.textTitleRef.set({ left: dims.width / 2, top: dims.height * 0.12, width: dims.width * 0.84 });
    if (anyCanvas.textBottomRef) anyCanvas.textBottomRef.set({ left: dims.width / 2, top: dims.height * 0.92 });
    
    buildSoundwaveGroup(canvas, dims, waveBarCount, waveBarWidth, waveBarGap, waveBarRadius, waveColor, waveHeightScale);
    canvas.requestRenderAll();
  };

  const updateTextContent = (ref: any, setter: (val: string) => void, value: string) => {
    setter(value);
    ref.set({ text: value });
    fabricRef.current && fabricRef.current.requestRenderAll();
  };

  useEffect(() => {
    const canvas = fabricRef.current as any;
    if (canvas && canvas.textLeftRef) {
      isRebuildingRef.current = true;
      canvas.textLeftRef.set({
        text: topLeftText,
        fill: topLeftColor,
        fontFamily: topLeftFontFamily,
        fontSize: topLeftFontSize,
        charSpacing: topLeftCharSpacing,
        fontWeight: topLeftFontWeight,
        fontStyle: topLeftFontStyle
      });
      canvas.requestRenderAll();
      isRebuildingRef.current = false;
    }
  }, [topLeftText, topLeftColor, topLeftFontFamily, topLeftFontSize, topLeftCharSpacing, topLeftFontWeight, topLeftFontStyle]);

  useEffect(() => {
    const canvas = fabricRef.current as any;
    if (canvas && canvas.textRightRef) {
      isRebuildingRef.current = true;
      canvas.textRightRef.set({
        text: topRightText,
        fill: topRightColor,
        fontFamily: topRightFontFamily,
        fontSize: topRightFontSize,
        charSpacing: topRightCharSpacing,
        fontWeight: topRightFontWeight,
        fontStyle: topRightFontStyle
      });
      canvas.requestRenderAll();
      isRebuildingRef.current = false;
    }
  }, [topRightText, topRightColor, topRightFontFamily, topRightFontSize, topRightCharSpacing, topRightFontWeight, topRightFontStyle]);

  useEffect(() => {
    const canvas = fabricRef.current as any;
    if (canvas && canvas.textTitleRef) {
      isRebuildingRef.current = true;
      canvas.textTitleRef.set({
        text: mainTitleText,
        fill: mainTitleColor,
        fontFamily: mainTitleFontFamily,
        fontSize: mainTitleFontSize,
        charSpacing: mainTitleCharSpacing,
        fontWeight: mainTitleFontWeight,
        fontStyle: mainTitleFontStyle
      });
      canvas.requestRenderAll();
      isRebuildingRef.current = false;
    }
  }, [mainTitleText, mainTitleColor, mainTitleFontFamily, mainTitleFontSize, mainTitleCharSpacing, mainTitleFontWeight, mainTitleFontStyle]);

  useEffect(() => {
    const canvas = fabricRef.current as any;
    if (canvas && canvas.textBottomRef) {
      isRebuildingRef.current = true;
      canvas.textBottomRef.set({
        text: bottomText,
        fill: bottomColor,
        fontFamily: bottomFontFamily,
        fontSize: bottomFontSize,
        charSpacing: bottomCharSpacing,
        fontWeight: bottomFontWeight,
        fontStyle: bottomFontStyle
      });
      canvas.requestRenderAll();
      isRebuildingRef.current = false;
    }
  }, [bottomText, bottomColor, bottomFontFamily, bottomFontSize, bottomCharSpacing, bottomFontWeight, bottomFontStyle]);

  useEffect(() => {
    const handler = setTimeout(() => {
      rebuildSoundwave();
    }, 100);
    return () => clearTimeout(handler);
  }, [rebuildSoundwave]);

  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas || !bgRectRef.current) return;
    if (bgType === 'color') {
      bgRectRef.current.set({ fill: bgColor, visible: true });
      if (bgImageRef.current) bgImageRef.current.set({ visible: false });
      if (bgOverlayRef.current) bgOverlayRef.current.set({ visible: false });
    } else {
      bgRectRef.current.set({ visible: false });
      if (bgImageRef.current) {
        bgImageRef.current.set({ visible: true });
        if (bgOverlayRef.current) bgOverlayRef.current.set({ visible: true });
      }
    }
    canvas.requestRenderAll();
  }, [bgType, bgColor]);

  const updateBgColor = (hex: string) => {
    setBgColor(hex);
  };

  const updateBgBlur = (val: number) => {
    setBgBlur(val);
    if (bgImageRef.current) {
      bgImageRef.current.filters = [new fabric.Image.filters.Blur({ blur: val / 100 })];
      bgImageRef.current.applyFilters();
      fabricRef.current?.requestRenderAll();
    }
  };

  const handleBgCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target?.result as string;
      setBgImageUrl(url);
      fabric.Image.fromURL(url).then((img) => {
        const canvas = fabricRef.current;
        if (!canvas) return;
        if (bgImageRef.current) canvas.remove(bgImageRef.current);
        const scale = Math.max(
          containerDims.width / img.width!,
          containerDims.height / img.height!
        ) * 1.15;
        img.set({
          left: containerDims.width / 2,
          top: containerDims.height / 2,
          originX: 'center',
          originY: 'center',
          scaleX: scale,
          scaleY: scale,
          selectable: false,
          evented: false,
          visible: bgType === 'blur',
        });
        img.filters = [new fabric.Image.filters.Blur({ blur: bgBlur / 100 })];
        img.applyFilters();
        canvas.insertAt(0, img); 
        bgImageRef.current = img;
        if (bgOverlayRef.current) canvas.bringObjectToFront(bgOverlayRef.current);
        canvas.requestRenderAll();
      });
    };
    reader.readAsDataURL(file);
  };

  const handleAlign = (mode: string) => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const activeObj = canvas.getActiveObject();
    if (!activeObj) {
      showToast('Select an item to align.');
      return;
    }

    const cw = containerDims.width;
    const ch = containerDims.height;
    const zoomFactor = canvas.getZoom();

    if (activeObj.type !== 'activeSelection') {
      const bound = activeObj.getBoundingRect();
      
      const lLeft = bound.left / zoomFactor;
      const lTop = bound.top / zoomFactor;
      const lWidth = bound.width / zoomFactor;
      const lHeight = bound.height / zoomFactor;

      let dx = 0, dy = 0;

      if (mode === 'left') dx = -lLeft;
      else if (mode === 'cx') dx = (cw / 2) - (lLeft + lWidth / 2);
      else if (mode === 'right') dx = cw - (lLeft + lWidth);
      else if (mode === 'top') dy = -lTop;
      else if (mode === 'cy') dy = (ch / 2) - (lTop + lHeight / 2);
      else if (mode === 'bottom') dy = ch - (lTop + lHeight);

      activeObj.set({ left: activeObj.left + dx, top: activeObj.top + dy });
      activeObj.setCoords();
      canvas.requestRenderAll();
    } else {
      const groupBounds = activeObj.getBoundingRect();
      const groupL = groupBounds.left / zoomFactor;
      const groupT = groupBounds.top / zoomFactor;
      const groupW = groupBounds.width / zoomFactor;
      const groupH = groupBounds.height / zoomFactor;

      const objects = (activeObj as fabric.ActiveSelection).getObjects();
      canvas.discardActiveObject(); 

      objects.forEach(obj => {
        const oBound = obj.getBoundingRect();
        const olL = oBound.left / zoomFactor;
        const olT = oBound.top / zoomFactor;
        const olW = oBound.width / zoomFactor;
        const olH = oBound.height / zoomFactor;

        let dx = 0, dy = 0;
        if (mode === 'left') dx = groupL - olL;
        else if (mode === 'cx') dx = (groupL + groupW / 2) - (olL + olW / 2);
        else if (mode === 'right') dx = (groupL + groupW) - (olL + olW);
        else if (mode === 'top') dy = groupT - olT;
        else if (mode === 'cy') dy = (groupT + groupH / 2) - (olT + olH / 2);
        else if (mode === 'bottom') dy = (groupT + groupH) - (olT + olH);

        obj.set({ left: obj.left + dx, top: obj.top + dy });
        obj.setCoords();
      });

      const newSelection = new fabric.ActiveSelection(objects, { canvas });
      canvas.setActiveObject(newSelection);
      canvas.requestRenderAll();
    }
  };

  const edDistribute = (axis: string) => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (!active || active.type !== 'activeSelection') return;
    const zoomFactor = canvas.getZoom();
    const objs = (active as fabric.ActiveSelection).getObjects().slice();
    if (objs.length < 3) return;

    canvas.discardActiveObject();

    if (axis === 'h') {
      objs.sort((a, b) => (a.getBoundingRect().left / zoomFactor) - (b.getBoundingRect().left / zoomFactor));
      const firstL = objs[0].getBoundingRect().left / zoomFactor;
      const lastL = objs[objs.length - 1].getBoundingRect().left / zoomFactor;
      const total = lastL - firstL;
      const step = total / (objs.length - 1);
      
      objs.forEach((o, i) => { 
        const obL = o.getBoundingRect().left / zoomFactor;
        o.set({ left: o.left + ((firstL + step * i) - obL) }); 
        o.setCoords(); 
      });
    } else {
      objs.sort((a, b) => (a.getBoundingRect().top / zoomFactor) - (b.getBoundingRect().top / zoomFactor));
      const firstT = objs[0].getBoundingRect().top / zoomFactor;
      const lastT = objs[objs.length - 1].getBoundingRect().top / zoomFactor;
      const total = lastT - firstT;
      const step = total / (objs.length - 1);

      objs.forEach((o, i) => { 
        const obT = o.getBoundingRect().top / zoomFactor;
        o.set({ top: o.top + ((firstT + step * i) - obT) }); 
        o.setCoords(); 
      });
    }
    
    const newSelection = new fabric.ActiveSelection(objs, { canvas });
    canvas.setActiveObject(newSelection);
    canvas.requestRenderAll();
  };

  const handleGroup = () => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const activeObj = canvas.getActiveObject();
    if (!activeObj || activeObj.type !== 'activeSelection') {
      showToast('Select multiple items to group.');
      return;
    }
    
    (activeObj as fabric.ActiveSelection).toGroup();
    canvas.requestRenderAll();
    
    const newGroup = canvas.getActiveObject();
    if (newGroup) {
      newGroup.set({
        data: { edType: 'group' }
      });
    }
    setSelectedType('group');
    showToast('Items grouped successfully.');
  };

  const handleUngroup = () => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const activeObj = canvas.getActiveObject();
    if (!activeObj || activeObj.type !== 'group') {
      showToast('Select a group to ungroup.');
      return;
    }
    
    (activeObj as fabric.Group).toActiveSelection();
    canvas.requestRenderAll();
    setSelectedType('multi');
    showToast('Group separated.');
  };

  const getMultiplier = () => {
    const { w } = parseAndOrientSize(canvasSize, orientation);
    return (w * DPI) / containerDims.width;
  };

  const getCheckedColors = () => {
    const checked = exportColors.filter((c) => c.checked).map((c) => c.color);
    return checked.length ? checked : [bgType === 'color' ? bgColor : '#ffffff'];
  };

  const withSwappedColor = async (color: string, fn: () => Promise<void>) => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const prevType = bgType;
    const prevColor = bgColor;
    if (bgRectRef.current) bgRectRef.current.set({ fill: color, visible: true });
    if (bgImageRef.current) bgImageRef.current.set({ visible: false });
    if (bgOverlayRef.current) bgOverlayRef.current.set({ visible: false });
    canvas.discardActiveObject();
    canvas.renderAll();
    await fn();
    if (bgRectRef.current) bgRectRef.current.set({ fill: prevColor, visible: prevType === 'color' });
    if (bgImageRef.current) bgImageRef.current.set({ visible: prevType === 'blur' });
    if (bgOverlayRef.current) bgOverlayRef.current.set({ visible: prevType === 'blur' });
    canvas.renderAll();
  };

  const downloadPNG = async () => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const zip = new JSZip();
    const colors = getCheckedColors();
    const multiplier = getMultiplier();
    for (let i = 0; i < colors.length; i++) {
      const color = colors[i];
      await withSwappedColor(color, async () => {
        const dataUrl = canvas.toDataURL({ format: 'png', multiplier });
        const base64 = dataUrl.split(',')[1];
        zip.file(`soundwave-poster-${color.replace('#', '')}.png`, base64, { base64: true });
      });
    }
    const blob = await zip.generateAsync({ type: 'blob' });
    triggerDownload(blob, 'soundwave-poster-png.zip');
    showToast('PNG export ready');
  };

  const downloadPDF = async () => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const zip = new JSZip();
    const colors = getCheckedColors();
    const multiplier = getMultiplier();
    const { w, h } = parseAndOrientSize(canvasSize, orientation);
    for (let i = 0; i < colors.length; i++) {
      const color = colors[i];
      await withSwappedColor(color, async () => {
        const dataUrl = canvas.toDataURL({ format: 'png', multiplier });
        const pdf = new jsPDF({
          orientation: w > h ? 'landscape' : 'portrait',
          unit: 'in',
          format: [w, h],
        });
        pdf.addImage(dataUrl, 'PNG', 0, 0, w, h);
        const pdfBlob = pdf.output('blob');
        zip.file(`soundwave-poster-${color.replace('#', '')}.pdf`, pdfBlob);
      });
    }
    const blob = await zip.generateAsync({ type: 'blob' });
    triggerDownload(blob, 'soundwave-poster-pdf.zip');
    showToast('PDF export ready');
  };

  const downloadSVG = async () => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const zip = new JSZip();
    const colors = getCheckedColors();
    for (let i = 0; i < colors.length; i++) {
      const color = colors[i];
      await withSwappedColor(color, async () => {
        const svg = canvas.toSVG();
        zip.file(`soundwave-poster-${color.replace('#', '')}.svg`, svg);
      });
    }
    const blob = await zip.generateAsync({ type: 'blob' });
    triggerDownload(blob, 'soundwave-poster-svg.zip');
    showToast('SVG export ready');
  };

  const triggerDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const updateExportColor = (idx: number, value: string) => {
    setExportColors((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], color: value };
      return next;
    });
  };

  const toggleExportColor = (idx: number) => {
    setExportColors((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], checked: !next[idx].checked };
      return next;
    });
  };

  return (
    <div className="spotify-poster-page">
      <style>{`
        .spotify-poster-page {
          --panel-bg: #0d0d0d;
          --panel-border: #1e1e1e;
          --spotify-text: #ffffff;
          --spotify-subtext: #8a8a8a;
          --accent: #1DB954;
          --input-bg: #161616;
          --input-border: #262626;
          display: flex;
          height: 100vh;
          width: 100%;
          background: #000;
          color: var(--spotify-text);
          font-family: 'DM Sans', sans-serif;
          overflow: hidden;
        }
        .spotify-poster-page #panel {
          width: 300px;
          min-width: 300px;
          background: var(--panel-bg);
          border-right: 1px solid var(--panel-border);
          overflow-y: auto;
          display: flex;
          flex-direction: column;
        }
        .spotify-poster-page #panel::-webkit-scrollbar { width: 3px; }
        .spotify-poster-page #panel::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }
        .spotify-poster-page .panel-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 16px; border-bottom: 1px solid var(--panel-border); flex-shrink: 0;
        }
        .spotify-poster-page .title-group { display: flex; align-items: center; gap: 8px; }
        .spotify-poster-page .title-group h1 {
          font-size: 13px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; margin: 0;
        }
        .spotify-poster-page .back-btn {
          background: none; border: 1px solid var(--panel-border); color: var(--spotify-subtext);
          font-size: 11px; padding: 6px 10px; border-radius: 6px; cursor: pointer; font-family: inherit;
          transition: all 0.15s;
        }
        .spotify-poster-page .back-btn:hover { color: var(--spotify-text); border-color: #333; }

        .spotify-poster-page .form-row { padding: 0 16px 12px; }
        .spotify-poster-page .form-row label {
          display: block; font-size: 10px; color: var(--spotify-subtext); margin-bottom: 5px;
          text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600;
        }
        .spotify-poster-page .form-row input[type=text],
        .spotify-poster-page .form-row select,
        .spotify-poster-page .form-row textarea {
          width: 100%; background: var(--input-bg); border: 1px solid var(--input-border);
          border-radius: 6px; color: var(--spotify-text); padding: 8px 10px; font-size: 12px;
          font-family: inherit; outline: none; transition: border-color 0.15s; box-sizing: border-box;
        }
        .spotify-poster-page .form-row input[type=text]:focus,
        .spotify-poster-page .form-row select:focus,
        .spotify-poster-page .form-row textarea:focus { border-color: var(--accent); }
        .spotify-poster-page .form-row select option { background: #1a1a1a; }

        .spotify-poster-page .color-row { display: flex; gap: 8px; align-items: center; padding: 0 16px 12px; }
        .spotify-poster-page .color-row input[type=color] {
          width: 34px; height: 30px; border: none; border-radius: 6px; padding: 2px;
          background: var(--input-bg); cursor: pointer; flex-shrink: 0;
        }
        .spotify-poster-page .color-row input[type=text] {
          flex: 1; background: var(--input-bg); border: 1px solid var(--input-border);
          border-radius: 6px; color: var(--spotify-text); padding: 6px 8px; font-size: 11px; font-family: inherit;
        }

        .spotify-poster-page .range-row { display: flex; align-items: center; gap: 8px; padding: 0 16px 12px; }
        .spotify-poster-page .range-row input[type=range] { flex: 1; accent-color: var(--accent); cursor: pointer; }
        .spotify-poster-page .range-val { font-size: 10px; color: var(--accent); font-weight: 600; min-width: 34px; text-align: right; }

        .spotify-poster-page .upload-area {
          position: relative; border: 1px dashed var(--panel-border); border-radius: 8px;
          padding: 22px 12px; text-align: center; cursor: pointer; margin: 0 16px 4px;
          transition: border-color 0.15s;
        }
        .spotify-poster-page .upload-area:hover { border-color: var(--accent); }
        .spotify-poster-page .upload-area p { font-size: 11px; color: var(--spotify-subtext); margin: 0; }

        .spotify-poster-page .btn {
          border: none; border-radius: 6px; padding: 9px 14px; font-size: 12px; font-weight: 600;
          cursor: pointer; font-family: inherit; transition: opacity 0.15s;
        }
        .spotify-poster-page .btn:hover { opacity: 0.85; }
        .spotify-poster-page .btn-primary { background: var(--accent); color: #000; }
        .spotify-poster-page .btn-secondary {
          background: var(--input-bg); color: var(--spotify-text); border: 1px solid var(--input-border); flex: 1;
        }
        .spotify-poster-page .btn-download-group { display: flex; gap: 6px; padding: 0 16px 4px; }

        .spotify-poster-page #canvas-area {
          flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: flex-start;
          background: #0d0d0d; padding: 30px; overflow: auto; position: relative;
        }
        .spotify-poster-page #canvas-area::before {
          content: ''; position: absolute; inset: 0;
          background: radial-gradient(ellipse at center, #1a1a1a 0%, #0d0d0d 70%); pointer-events: none;
        }
        .spotify-poster-page #poster-wrapper {
          position: relative; z-index: 1; display: flex; flex-direction: column; align-items: center; gap: 20px;
          padding: 80px;
        }
        .spotify-poster-page #poster-container {
          position: relative; overflow: hidden;
          box-shadow: 0 32px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.05);
          border-radius: 4px;
          transform-origin: center center;
          transition: transform 0.15s ease-out, width 0.4s cubic-bezier(0.4,0,0.2,1), height 0.4s cubic-bezier(0.4,0,0.2,1);
        }

        .spotify-poster-page .accordion-btn {
          width: 100%; background: none; border: none; color: var(--spotify-subtext);
          font-size: 10px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase;
          text-align: left; padding: 16px; cursor: pointer; display: flex; justify-content: space-between;
          align-items: center; border-bottom: 1px solid var(--panel-border); font-family: 'DM Sans', sans-serif;
          transition: color 0.15s;
        }
        .spotify-poster-page .accordion-btn:hover { color: var(--spotify-text); }
        .spotify-poster-page .accordion-btn .arrow { font-size: 9px; transition: transform 0.2s; }
        .spotify-poster-page .accordion-btn.open .arrow { transform: rotate(180deg); }
        .spotify-poster-page .accordion-content { display: none; padding: 14px 0; border-bottom: 1px solid var(--panel-border); }
        .spotify-poster-page .accordion-content.open { display: block; }

        .spotify-poster-page #toast {
          position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%) translateY(20px);
          background: var(--accent); color: #000; padding: 10px 20px; border-radius: 24px;
          font-size: 13px; font-weight: 600; opacity: 0; transition: all 0.3s; z-index: 9999; pointer-events: none;
        }
        .spotify-poster-page #toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }

        .spotify-poster-page #props-panel {
          width: 260px; min-width: 260px; background: var(--panel-bg); border-left: 1px solid var(--panel-border);
          overflow-y: auto; flex-shrink: 0; display: flex; flex-direction: column;
        }
        .spotify-poster-page #props-panel::-webkit-scrollbar { width: 3px; }
        .spotify-poster-page #props-panel::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }
        .spotify-poster-page #props-header {
          padding: 14px 16px 10px; border-bottom: 1px solid var(--panel-border); font-size: 10px;
          font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--spotify-subtext);
          display: flex; align-items: center; justify-content: space-between; flex-shrink: 0;
        }
        .spotify-poster-page #props-selected-name { color: var(--accent); font-size: 10px; font-weight: 600; letter-spacing: 0; text-transform: none; }
        .spotify-poster-page #props-body { flex: 1; overflow-y: auto; padding: 12px 14px; }
        .spotify-poster-page #props-body::-webkit-scrollbar { width: 3px; }
        .spotify-poster-page #props-body::-webkit-scrollbar-thumb { background: #333; }
        .spotify-poster-page #props-empty-state { padding: 32px 16px; text-align: center; color: #444; font-size: 11px; line-height: 1.7; }
        .spotify-poster-page #props-empty-state svg { margin-bottom: 12px; }

        .spotify-poster-page .pf-section { margin-bottom: 4px; }
        .spotify-poster-page .pf-section-title { font-size: 9px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #555; margin: 12px 0 6px; }
        .spotify-poster-page .pf-row { margin-bottom: 7px; }
        .spotify-poster-page .pf-row label { display: block; font-size: 10px; color: var(--spotify-subtext); margin-bottom: 3px; }
        .spotify-poster-page .pf-row input[type=text],
        .spotify-poster-page .pf-row input[type=number],
        .spotify-poster-page .pf-row select {
          width: 100%; background: var(--input-bg); border: 1px solid var(--input-border); border-radius: 5px;
          color: var(--spotify-text); padding: 5px 8px; font-size: 11px; font-family: 'DM Sans', sans-serif; outline: none;
          transition: border-color 0.15s;
        }
        .spotify-poster-page .pf-row input:focus, .spotify-poster-page .pf-row select:focus { border-color: var(--accent); }
        .spotify-poster-page .pf-row select option { background: #1a1a1a; }
        .spotify-poster-page .pf-row input[type=range] { width: 100%; accent-color: var(--accent); cursor: pointer; }
        .spotify-poster-page .pf-row input[type=color] { width: 30px; height: 26px; border: none; border-radius: 4px; cursor: pointer; padding: 2px; background: var(--input-bg); }
        .spotify-poster-page .pf-color-row { display: flex; gap: 6px; align-items: center; }
        .spotify-poster-page .pf-color-row input[type=text] { flex: 1; }
        .spotify-poster-page .pf-range-row { display: flex; align-items: center; gap: 6px; }
        .spotify-poster-page .pf-range-val { font-size: 10px; color: var(--accent); font-weight: 600; min-width: 32px; text-align: right; }

        .spotify-poster-page .global-tools-panel {
          padding: 14px 16px;
          border-bottom: 1px solid var(--panel-border);
          background: #0f0f0f;
          flex-shrink: 0;
        }
        .spotify-poster-page .gt-section-title {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--spotify-subtext);
          margin-bottom: 8px;
        }
        .spotify-poster-page .gt-align-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 4px;
          margin-bottom: 8px;
        }
        .spotify-poster-page .gt-align-btn {
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--input-bg);
          border: 1px solid var(--input-border);
          color: var(--spotify-subtext);
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.15s;
        }
        .spotify-poster-page .gt-align-btn:hover {
          background: #1a1a1a;
          border-color: var(--accent);
          color: var(--spotify-text);
        }
        .spotify-poster-page .gt-align-btn svg {
          width: 14px;
          height: 14px;
        }
        .spotify-poster-page .gt-group-row {
          display: flex;
          gap: 6px;
          margin-bottom: 12px;
        }
        .spotify-poster-page .gt-group-btn {
          flex: 1;
          height: 28px;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          background: var(--input-bg);
          border: 1px solid var(--input-border);
          color: var(--spotify-text);
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.15s;
        }
        .spotify-poster-page .gt-group-btn:hover {
          background: var(--accent);
          color: #000;
          border-color: var(--accent);
        }
        .spotify-poster-page .gt-zoom-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .spotify-poster-page .gt-zoom-row input[type=range] {
          flex: 1;
          accent-color: var(--accent);
          cursor: pointer;
        }
        .spotify-poster-page .gt-zoom-val {
          font-size: 11px;
          font-weight: 600;
          color: var(--accent);
          min-width: 32px;
          text-align: right;
        }
        .spotify-poster-page .gt-zoom-reset {
          background: #222;
          border: 1px solid #333;
          color: #fff;
          font-size: 9px;
          padding: 2px 6px;
          border-radius: 4px;
          cursor: pointer;
        }
        .spotify-poster-page .gt-zoom-reset:hover {
          background: #333;
        }
        .orient-group {
          display: flex; gap: 8px; margin-top: 8px;
        }
      `}</style>
      <div id="panel">
        <div className="panel-header">
          <div className="title-group">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M2 12h4l3-9 5 18 3-9h5" />
            </svg>
            <h1>Soundwave Poster</h1>
          </div>
          <button className="back-btn" onClick={() => navigate('/song-poster')}>&#10229; Back</button>
        </div>

        <button className={`accordion-btn${openSections.size ? ' open' : ''}`} onClick={() => toggleAccordion('size')}>
          &#128208; Canvas Size<span className="arrow">&#9660;</span>
        </button>
        <div className={`accordion-content${openSections.size ? ' open' : ''}`}>
          <div className="form-row">
            <label>Print Size</label>
            <select value={canvasSize} onChange={(e) => handleSizeOrOrientationChange(e.target.value, orientation)}>
              {PRINT_SIZES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            <div className="orient-group">
              <button 
                className={`btn ${orientation === 'portrait' ? 'btn-primary' : 'btn-secondary'}`} 
                onClick={() => handleSizeOrOrientationChange(canvasSize, 'portrait')}
              >
                Portrait
              </button>
              <button 
                className={`btn ${orientation === 'landscape' ? 'btn-primary' : 'btn-secondary'}`} 
                onClick={() => handleSizeOrOrientationChange(canvasSize, 'landscape')}
              >
                Landscape
              </button>
            </div>
          </div>
        </div>

        <button className={`accordion-btn${openSections.texts ? ' open' : ''}`} onClick={() => toggleAccordion('texts')}>
          &#128294; Typographic Details<span className="arrow">&#9660;</span>
        </button>
        <div className={`accordion-content${openSections.texts ? ' open' : ''}`}>
          <div className="form-row">
            <label>Top Left Text</label>
            <input type="text" value={topLeftText}
              onChange={(e) => updateTextContent(fabricRef.current?.textLeftRef, setTopLeftText, e.target.value)} />
          </div>
          <div className="form-row">
            <label>Top Left Color</label>
            <div className="color-row">
              <input type="color" value={topLeftColor}
                onChange={(e) => setTopLeftColor(e.target.value)} />
              <input type="text" value={topLeftColor}
                onChange={(e) => setTopLeftColor(e.target.value)} />
            </div>
          </div>

          <div className="form-row" style={{ marginTop: '12px' }}>
            <label>Top Right Text</label>
            <input type="text" value={topRightText}
              onChange={(e) => updateTextContent(fabricRef.current?.textRightRef, setTopRightText, e.target.value)} />
          </div>
          <div className="form-row">
            <label>Top Right Color</label>
            <div className="color-row">
              <input type="color" value={topRightColor}
                onChange={(e) => setTopRightColor(e.target.value)} />
              <input type="text" value={topRightColor}
                onChange={(e) => setTopRightColor(e.target.value)} />
            </div>
          </div>

          <div className="form-row" style={{ marginTop: '12px' }}>
            <label>Main Title</label>
            <input type="text" value={mainTitleText}
              onChange={(e) => updateTextContent(fabricRef.current?.textTitleRef, setMainTitleText, e.target.value)} />
          </div>
          <div className="form-row">
            <label>Main Title Color</label>
            <div className="color-row">
              <input type="color" value={mainTitleColor}
                onChange={(e) => setMainTitleColor(e.target.value)} />
              <input type="text" value={mainTitleColor}
                onChange={(e) => setMainTitleColor(e.target.value)} />
            </div>
          </div>

          <div className="form-row" style={{ marginTop: '12px' }}>
            <label>Bottom Text</label>
            <input type="text" value={bottomText}
              onChange={(e) => updateTextContent(fabricRef.current?.textBottomRef, setBottomText, e.target.value)} />
          </div>
          <div className="form-row">
            <label>Bottom Text Color</label>
            <div className="color-row">
              <input type="color" value={bottomColor}
                onChange={(e) => setBottomColor(e.target.value)} />
              <input type="text" value={bottomColor}
                onChange={(e) => setBottomColor(e.target.value)} />
            </div>
          </div>
        </div>

        <button className={`accordion-btn${openSections.soundwave ? ' open' : ''}`} onClick={() => toggleAccordion('soundwave')}>
          &#127925; Soundwave Settings<span className="arrow">&#9660;</span>
        </button>
        <div className={`accordion-content${openSections.soundwave ? ' open' : ''}`}>
          <div className="form-row">
            <label>Generation Mode</label>
            <select value={waveMode} onChange={(e) => {
              setWaveMode(e.target.value as 'random' | 'audio');
              if (e.target.value === 'random') rebuildSoundwave();
            }}>
              <option value="random">Random Aesthetic Wave</option>
              <option value="audio">Custom Audio Upload</option>
            </select>
          </div>

          {waveMode === 'audio' && (
            <div className="upload-area" onClick={() => document.getElementById('sw-audio-upload')?.click()} style={{ marginBottom: '12px' }}>
              <input type="file" id="sw-audio-upload" accept="audio/*" onChange={handleAudioUpload}
                style={{ opacity: 0, position: 'absolute', inset: 0, cursor: 'pointer' }} />
              <p>Click to upload MP3/WAV</p>
            </div>
          )}

          <div className="form-row">
            <label>Wave Color</label>
            <div className="color-row">
              <input type="color" value={waveColor} onChange={(e) => setWaveColor(e.target.value)} />
              <input type="text" value={waveColor} onChange={(e) => setWaveColor(e.target.value)} />
            </div>
          </div>
        </div>

        <button className={`accordion-btn${openSections.background ? ' open' : ''}`} onClick={() => toggleAccordion('background')}>
          &#128444;&#65039; Main Background<span className="arrow">&#9660;</span>
        </button>
        <div className={`accordion-content${openSections.background ? ' open' : ''}`}>
          <div className="form-row">
            <label>Background Type</label>
            <select value={bgType} onChange={(e) => setBgType(e.target.value as 'color' | 'blur')}>
              <option value="color">Solid Color</option>
              <option value="blur">Blurred Image</option>
            </select>
          </div>

          {bgType === 'color' && (
            <div id="v-bg-color-section">
              <div className="form-row">
                <label>Background Color</label>
                <div className="color-row">
                  <input type="color" value={bgColor} onChange={(e) => updateBgColor(e.target.value)} />
                  <input type="text" value={bgColor} onChange={(e) => updateBgColor(e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {bgType === 'blur' && (
            <div id="v-bg-blur-section">
              <div className="form-row">
                <label>Blur</label>
                <div className="range-row">
                  <input type="range" min="0" max="40" value={bgBlur} onChange={(e) => updateBgBlur(Number(e.target.value))} />
                  <span className="range-val">{bgBlur}px</span>
                </div>
              </div>
              <div className="upload-area" onClick={() => document.getElementById('bg-cover-upload')?.click()} style={{ marginTop: '12px' }}>
                <input type="file" id="bg-cover-upload" accept="image/*" onChange={handleBgCoverUpload}
                  style={{ opacity: 0, position: 'absolute', inset: 0, cursor: 'pointer' }} />
                <p>Click to upload image</p>
              </div>
            </div>
          )}
        </div>

        <button className={`accordion-btn${openSections.multiExport ? ' open' : ''}`} onClick={() => toggleAccordion('multiExport')}>
          &#127912; Multi-Color Export<span className="arrow">&#9660;</span>
        </button>
        <div className={`accordion-content${openSections.multiExport ? ' open' : ''}`}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {exportColors.map((item, i) => (
              <div className="pf-color-row multi-export-item" key={i}>
                <input type="checkbox" checked={item.checked} className="export-color-check"
                  style={{ cursor: 'pointer' }} onChange={() => toggleExportColor(i)} />
                <input type="color" value={item.color} className="export-color-picker"
                  onChange={(e) => updateExportColor(i, e.target.value)}
                  style={{ width: '26px', height: '26px', border: 'none', padding: '0', background: 'transparent', cursor: 'pointer' }} />
                <input type="text" value={item.color} style={{ fontSize: '10px', padding: '4px' }}
                  onChange={(e) => {
                    let v = e.target.value;
                    if (/^#[0-9a-fA-F]{3}$/i.test(v)) v = '#' + v[1] + v[1] + v[2] + v[2] + v[3] + v[3];
                    if (/^#[0-9a-fA-F]{6}$/i.test(v)) updateExportColor(i, v);
                  }} />
              </div>
            ))}
          </div>
        </div>

        <button className={`accordion-btn${openSections.download ? ' open' : ''}`} onClick={() => toggleAccordion('download')}>
          &#11015;&#65039; Download<span className="arrow">&#9660;</span>
        </button>
        <div className={`accordion-content${openSections.download ? ' open' : ''}`}>
          <div className="btn-download-group">
            <button className="btn btn-secondary" onClick={downloadPNG}>PNG (ZIP)</button>
            <button className="btn btn-secondary" onClick={downloadPDF}>PDF (ZIP)</button>
            <button className="btn btn-secondary" onClick={downloadSVG}>SVG (ZIP)</button>
          </div>
        </div>
      </div>

      <div id="canvas-area" ref={containerRef}>
        <div id="poster-wrapper">
          <div id="poster-container" style={{ 
            width: containerDims.width * zoom, 
            height: containerDims.height * zoom
          }}>
            <canvas ref={canvasElRef} />
          </div>
        </div>
      </div>

      <div id="props-panel">
        <div id="props-header">
          Properties
          <span id="props-selected-name">
            {selectedType === EDIT_TYPES.TOP_LEFT && 'Top Left Text'}
            {selectedType === EDIT_TYPES.TOP_RIGHT && 'Top Right Text'}
            {selectedType === EDIT_TYPES.MAIN_TITLE && 'Main Title'}
            {selectedType === EDIT_TYPES.BOTTOM && 'Bottom Text'}
            {selectedType === EDIT_TYPES.SOUNDWAVE && 'Soundwave'}
            {selectedType === 'group' && 'Group'}
            {selectedType === 'multi' && 'Multiple'}
          </span>
        </div>

        <div className="global-tools-panel">
          <div className="gt-section-title">ALIGNMENT</div>
          <div className="gt-align-grid">
            <button className="gt-align-btn" title="Align Left" onClick={() => handleAlign('left')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="3" x2="3" y2="21" strokeWidth="2.5" /><rect x="5" y="8" width="8" height="3" rx="1" /><rect x="5" y="13" width="13" height="3" rx="1" />
              </svg>
            </button>
            <button className="gt-align-btn" title="Center X" onClick={() => handleAlign('cx')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="3" x2="12" y2="21" strokeWidth="2.5" /><rect x="6" y="8" width="12" height="3" rx="1" /><rect x="4" y="13" width="16" height="3" rx="1" />
              </svg>
            </button>
            <button className="gt-align-btn" title="Align Right" onClick={() => handleAlign('right')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="21" y1="3" x2="21" y2="21" strokeWidth="2.5" /><rect x="11" y="8" width="8" height="3" rx="1" /><rect x="6" y="13" width="13" height="3" rx="1" />
              </svg>
            </button>
            <button className="gt-align-btn" title="Distribute H" onClick={() => edDistribute('h')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="3" x2="3" y2="21" /><line x1="21" y1="3" x2="21" y2="21" /><rect x="9" y="8" width="6" height="8" rx="1" />
              </svg>
            </button>
            <button className="gt-align-btn" title="Align Top" onClick={() => handleAlign('top')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="3" x2="21" y2="3" strokeWidth="2.5" /><rect x="8" y="5" width="3" height="8" rx="1" /><rect x="13" y="5" width="3" height="13" rx="1" />
              </svg>
            </button>
            <button className="gt-align-btn" title="Center Y" onClick={() => handleAlign('cy')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="12" x2="21" y2="12" strokeWidth="2.5" /><rect x="8" y="4" width="3" height="16" rx="1" /><rect x="13" y="6" width="3" height="12" rx="1" />
              </svg>
            </button>
            <button className="gt-align-btn" title="Align Bottom" onClick={() => handleAlign('bottom')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="21" x2="21" y2="21" strokeWidth="2.5" /><rect x="8" y="11" width="3" height="8" rx="1" /><rect x="13" y="6" width="3" height="13" rx="1" />
              </svg>
            </button>
            <button className="gt-align-btn" title="Distribute V" onClick={() => edDistribute('v')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="3" x2="21" y2="3" /><line x1="3" y1="21" x2="21" y2="21" /><rect x="8" y="9" width="8" height="6" rx="1" />
              </svg>
            </button>
          </div>

          <div className="gt-section-title" style={{ marginTop: '10px' }}>GROUPING</div>
          <div className="gt-group-row">
            <button className="gt-group-btn" title="Group Selected" onClick={handleGroup}>Group</button>
            <button className="gt-group-btn" title="Ungroup" onClick={handleUngroup}>Ungroup</button>
          </div>

          <div className="gt-section-title">ZOOM</div>
          <div className="gt-zoom-row">
            <input 
              type="range" 
              min="0.5" 
              max="10" 
              step="0.1" 
              value={zoom} 
              onChange={(e) => setZoom(Number(e.target.value))} 
            />
            <span className="gt-zoom-val">{Math.round(zoom * 100)}%</span>
            <button className="gt-zoom-reset" onClick={() => setZoom(1)}>Reset</button>
          </div>
        </div>

        <div id="props-body">
          {!selectedType && (
            <div id="props-empty-state">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" />
              </svg>
              <p>Click an element on the canvas to change its properties.</p>
            </div>
          )}

          {selectedType === EDIT_TYPES.TOP_LEFT && (
            <div id="props-fields">
              <div className="pf-section">
                <div className="pf-section-title">Top Left Text</div>
                <div className="pf-row">
                  <label>Text</label>
                  <input type="text" value={topLeftText}
                    onChange={(e) => setTopLeftText(e.target.value)} />
                </div>
                <div className="pf-row">
                  <label>Font Family</label>
                  <select value={topLeftFontFamily} onChange={(e) => setTopLeftFontFamily(e.target.value)}>
                    <option value="DM Sans, sans-serif">DM Sans</option>
                    {GOOGLE_FONTS.map(f => <option key={f} value={`${f}, sans-serif`}>{f}</option>)}
                  </select>
                </div>
                <div className="pf-row">
                  <label>Font Style</label>
                  <FontStyleSelector weight={topLeftFontWeight} style={topLeftFontStyle} onChange={(w, s) => { setTopLeftFontWeight(w); setTopLeftFontStyle(s); }} />
                </div>
                <div className="pf-row">
                  <label>Font Size</label>
                  <div className="pf-range-row">
                    <input type="range" min="8" max="72" value={topLeftFontSize} onChange={(e) => setTopLeftFontSize(Number(e.target.value))} />
                    <span className="pf-range-val">{topLeftFontSize}px</span>
                  </div>
                </div>
                <div className="pf-row">
                  <label>Letter Spacing</label>
                  <div className="pf-range-row">
                    <input type="range" min="0" max="400" step="10" value={topLeftCharSpacing} onChange={(e) => setTopLeftCharSpacing(Number(e.target.value))} />
                    <span className="pf-range-val">{topLeftCharSpacing}</span>
                  </div>
                </div>
                <div className="pf-row">
                  <label>Color</label>
                  <div className="pf-color-row">
                    <input type="color" value={topLeftColor}
                      onChange={(e) => setTopLeftColor(e.target.value)} />
                    <input type="text" value={topLeftColor}
                      onChange={(e) => setTopLeftColor(e.target.value)} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedType === EDIT_TYPES.TOP_RIGHT && (
            <div id="props-fields">
              <div className="pf-section">
                <div className="pf-section-title">Top Right Text</div>
                <div className="pf-row">
                  <label>Text</label>
                  <input type="text" value={topRightText}
                    onChange={(e) => setTopRightText(e.target.value)} />
                </div>
                <div className="pf-row">
                  <label>Font Family</label>
                  <select value={topRightFontFamily} onChange={(e) => setTopRightFontFamily(e.target.value)}>
                    <option value="DM Sans, sans-serif">DM Sans</option>
                    {GOOGLE_FONTS.map(f => <option key={f} value={`${f}, sans-serif`}>{f}</option>)}
                  </select>
                </div>
                <div className="pf-row">
                  <label>Font Style</label>
                  <FontStyleSelector weight={topRightFontWeight} style={topRightFontStyle} onChange={(w, s) => { setTopRightFontWeight(w); setTopRightFontStyle(s); }} />
                </div>
                <div className="pf-row">
                  <label>Font Size</label>
                  <div className="pf-range-row">
                    <input type="range" min="8" max="72" value={topRightFontSize} onChange={(e) => setTopRightFontSize(Number(e.target.value))} />
                    <span className="pf-range-val">{topRightFontSize}px</span>
                  </div>
                </div>
                <div className="pf-row">
                  <label>Letter Spacing</label>
                  <div className="pf-range-row">
                    <input type="range" min="0" max="400" step="10" value={topRightCharSpacing} onChange={(e) => setTopRightCharSpacing(Number(e.target.value))} />
                    <span className="pf-range-val">{topRightCharSpacing}</span>
                  </div>
                </div>
                <div className="pf-row">
                  <label>Color</label>
                  <div className="pf-color-row">
                    <input type="color" value={topRightColor}
                      onChange={(e) => setTopRightColor(e.target.value)} />
                    <input type="text" value={topRightColor}
                      onChange={(e) => setTopRightColor(e.target.value)} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedType === EDIT_TYPES.MAIN_TITLE && (
            <div id="props-fields">
              <div className="pf-section">
                <div className="pf-section-title">Main Title</div>
                <div className="pf-row">
                  <label>Text</label>
                  <input type="text" value={mainTitleText}
                    onChange={(e) => setMainTitleText(e.target.value)} />
                </div>
                <div className="pf-row">
                  <label>Font Family</label>
                  <select value={mainTitleFontFamily} onChange={(e) => setMainTitleFontFamily(e.target.value)}>
                    <option value="Josefin Sans, sans-serif">Josefin Sans</option>
                    {GOOGLE_FONTS.map(f => <option key={f} value={`${f}, sans-serif`}>{f}</option>)}
                  </select>
                </div>
                <div className="pf-row">
                  <label>Font Style</label>
                  <FontStyleSelector weight={mainTitleFontWeight} style={mainTitleFontStyle} onChange={(w, s) => { setMainTitleFontWeight(w); setMainTitleFontStyle(s); }} />
                </div>
                <div className="pf-row">
                  <label>Font Size</label>
                  <div className="pf-range-row">
                    <input type="range" min="12" max="100" value={mainTitleFontSize} onChange={(e) => setMainTitleFontSize(Number(e.target.value))} />
                    <span className="pf-range-val">{mainTitleFontSize}px</span>
                  </div>
                </div>
                <div className="pf-row">
                  <label>Letter Spacing</label>
                  <div className="pf-range-row">
                    <input type="range" min="0" max="400" step="10" value={mainTitleCharSpacing} onChange={(e) => setMainTitleCharSpacing(Number(e.target.value))} />
                    <span className="pf-range-val">{mainTitleCharSpacing}</span>
                  </div>
                </div>
                <div className="pf-row">
                  <label>Color</label>
                  <div className="pf-color-row">
                    <input type="color" value={mainTitleColor}
                      onChange={(e) => setMainTitleColor(e.target.value)} />
                    <input type="text" value={mainTitleColor}
                      onChange={(e) => setMainTitleColor(e.target.value)} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedType === EDIT_TYPES.BOTTOM && (
            <div id="props-fields">
              <div className="pf-section">
                <div className="pf-section-title">Bottom Text</div>
                <div className="pf-row">
                  <label>Text</label>
                  <input type="text" value={bottomText}
                    onChange={(e) => setBottomText(e.target.value)} />
                </div>
                <div className="pf-row">
                  <label>Font Family</label>
                  <select value={bottomFontFamily} onChange={(e) => setBottomFontFamily(e.target.value)}>
                    <option value="DM Sans, sans-serif">DM Sans</option>
                    {GOOGLE_FONTS.map(f => <option key={f} value={`${f}, sans-serif`}>{f}</option>)}
                  </select>
                </div>
                <div className="pf-row">
                  <label>Font Style</label>
                  <FontStyleSelector weight={bottomFontWeight} style={bottomFontStyle} onChange={(w, s) => { setBottomFontWeight(w); setBottomFontStyle(s); }} />
                </div>
                <div className="pf-row">
                  <label>Font Size</label>
                  <div className="pf-range-row">
                    <input type="range" min="8" max="72" value={bottomFontSize} onChange={(e) => setBottomFontSize(Number(e.target.value))} />
                    <span className="pf-range-val">{bottomFontSize}px</span>
                  </div>
                </div>
                <div className="pf-row">
                  <label>Letter Spacing</label>
                  <div className="pf-range-row">
                    <input type="range" min="0" max="400" step="10" value={bottomCharSpacing} onChange={(e) => setBottomCharSpacing(Number(e.target.value))} />
                    <span className="pf-range-val">{bottomCharSpacing}</span>
                  </div>
                </div>
                <div className="pf-row">
                  <label>Color</label>
                  <div className="pf-color-row">
                    <input type="color" value={bottomColor}
                      onChange={(e) => setBottomColor(e.target.value)} />
                    <input type="text" value={bottomColor}
                      onChange={(e) => setBottomColor(e.target.value)} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedType === EDIT_TYPES.SOUNDWAVE && (
            <div id="props-fields">
              <div className="pf-section">
                <div className="pf-section-title">Soundwave Styling</div>
                
                <div className="pf-row">
                  <label>Bar Count</label>
                  <div className="pf-range-row">
                    <input type="range" min="10" max="200" value={waveBarCount} onChange={(e) => setWaveBarCount(Number(e.target.value))} />
                    <span className="pf-range-val">{waveBarCount}</span>
                  </div>
                </div>

                <div className="pf-row">
                  <label>Bar Width</label>
                  <div className="pf-range-row">
                    <input type="range" min="1" max="20" step="0.5" value={waveBarWidth} onChange={(e) => setWaveBarWidth(Number(e.target.value))} />
                    <span className="pf-range-val">{waveBarWidth}px</span>
                  </div>
                </div>

                <div className="pf-row">
                  <label>Bar Gap</label>
                  <div className="pf-range-row">
                    <input type="range" min="0" max="10" step="0.5" value={waveBarGap} onChange={(e) => setWaveBarGap(Number(e.target.value))} />
                    <span className="pf-range-val">{waveBarGap}px</span>
                  </div>
                </div>

                <div className="pf-row">
                  <label>Corner Radius</label>
                  <div className="pf-range-row">
                    <input type="range" min="0" max="10" value={waveBarRadius} onChange={(e) => setWaveBarRadius(Number(e.target.value))} />
                    <span className="pf-range-val">{waveBarRadius}px</span>
                  </div>
                </div>

                <div className="pf-row">
                  <label>Max Height Scale (%)</label>
                  <div className="pf-range-row">
                    <input type="range" min="10" max="200" value={waveHeightScale} onChange={(e) => setWaveHeightScale(Number(e.target.value))} />
                    <span className="pf-range-val">{waveHeightScale}%</span>
                  </div>
                </div>

                <div className="pf-row">
                  <label>Wave Color</label>
                  <div className="color-row">
                    <input type="color" value={waveColor} onChange={(e) => setWaveColor(e.target.value)} />
                    <input type="text" value={waveColor} onChange={(e) => setWaveColor(e.target.value)} />
                  </div>
                </div>

              </div>
            </div>
          )}

          {selectedType === 'group' && (
            <div id="props-fields">
              <div className="pf-section">
                <div className="pf-section-title">Group Properties</div>
                <p style={{ fontSize: '11px', color: '#888', lineHeight: '1.6' }}>
                  These items are currently grouped and behave as a single element. 
                  Use the tools above to ungroup or align them.
                </p>
              </div>
            </div>
          )}

          {selectedType === 'multi' && (
            <div id="props-fields">
              <div className="pf-section">
                <div className="pf-section-title">Multiple Selection</div>
                <p style={{ fontSize: '11px', color: '#888' }}>
                  Use the toolbar above to align objects or combine them into a group.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div id="toast" className={toast ? 'show' : ''}>&#10003; {toast || 'Done'}</div>
    </div>
  );
}
