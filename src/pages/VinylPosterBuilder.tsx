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

const DEFAULT_VINYL_COLORS = [
  '#f5f5f5', '#e8dcc8', '#d9cfc1', '#c9b8a3',
  '#111111', '#2b2b2b', '#8fae94', '#c98a7d',
  '#e0c36c', '#a3b8d9', '#d9a3c9', '#9dd9c9',
];

const DPI = 300;
const BASE_MAX_W = 420;
const BASE_MAX_H = 560;

const EDIT_TYPES = {
  TOP_LEFT: 'v-top-left',
  TOP_RIGHT: 'v-top-right',
  SONG_TITLE: 'v-song-title',
  BOTTOM: 'v-bottom',
  VINYL: 'v-vinyl',
};

function parseSize(value) {
  const [w, h] = value.split('x').map(Number);
  return { w, h };
}

function fitContain(wIn, hIn, maxW, maxH) {
  const aspect = wIn / hIn;
  let width = maxW;
  let height = width / aspect;
  if (height > maxH) {
    height = maxH;
    width = height * aspect;
  }
  return { width: Math.round(width), height: Math.round(height) };
}

function buildGrooveSpiralChars(text, opts) {
  const { cx, cy, innerRadius, outerRadius, fontSize, color, fontFamily, letterSpacing } = opts;
  const clean = (text || '').replace(/\s+/g, ' ').trim().toUpperCase();
  const source = clean.length ? clean + '   ' : '   ';

  const pitch = fontSize * 1.05; 
  const radialPerAngle = pitch / (Math.PI * 2);
  const charWidth = (fontSize * 0.62) + letterSpacing; 

  const chars = [];
  let angle = 0;
  let radius = innerRadius;
  let charIndex = 0;
  let guard = 0;

  while (radius < outerRadius && guard < 20000) {
    guard++;
    const ch = source[charIndex % source.length];
    charIndex++;
    const drawAngle = angle - Math.PI / 2;
    const x = cx + radius * Math.cos(drawAngle);
    const y = cy + radius * Math.sin(drawAngle);
    const rotationDeg = (drawAngle * 180) / Math.PI + 90;

    if (ch !== ' ') {
      chars.push(new fabric.Text(ch, {
        left: x,
        top: y,
        fontSize,
        fill: color,
        fontFamily,
        fontWeight: 700,
        originX: 'center',
        originY: 'center',
        angle: rotationDeg,
        selectable: false,
        evented: false,
      }));
    }

    const angleStep = charWidth / Math.max(radius, fontSize);
    angle += angleStep;
    radius += radialPerAngle * angleStep;
  }
  return chars;
}

export default function VinylPosterPage({ navigate }) {
  const canvasElRef = useRef(null);
  const fabricRef = useRef(null);
  const containerRef = useRef(null);
  const bgRectRef = useRef(null);
  const bgImageRef = useRef(null);
  const bgOverlayRef = useRef(null);
  const vinylGroupRef = useRef(null);

  const [openSections, setOpenSections] = useState({
    search: true,
    size: true,
    texts: true,
    song: true,
    vinyl: true,
    background: false,
    multiExport: true,
    download: true,
  });

  const [canvasSize, setCanvasSize] = useState('30x40');
  const [containerDims, setContainerDims] = useState(fitContain(30, 40, BASE_MAX_W, BASE_MAX_H));

  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);

  const [topLeftText, setTopLeftText] = useState('ARTIST NAME');
  const [topLeftColor, setTopLeftColor] = useState('#212121');
  const [topRightText, setTopRightText] = useState('1992');
  const [topRightColor, setTopRightColor] = useState('#212121');
  const [bottomText, setBottomText] = useState('UNKNOWN ALBUM');
  const [bottomColor, setBottomColor] = useState('#555555');
  const [songTitleText, setSongTitleText] = useState('SONG NAME');
  const [songTitleColor, setSongTitleColor] = useState('#212121');

  // Extended Vinyl Properties
  const [vinylScale, setVinylScale] = useState(78); 
  const [vinylFontFamily, setVinylFontFamily] = useState('DM Sans, sans-serif');
  const [vinylTextColor, setVinylTextColor] = useState('#181818');
  const [vinylTextSize, setVinylTextSize] = useState(12);
  const [vinylLetterSpacing, setVinylLetterSpacing] = useState(0);
  const [vinylLabelColor, setVinylLabelColor] = useState('#e8e8e8');
  const [vinylLabelSize, setVinylLabelSize] = useState(12.5);
  const [vinylLyrics, setVinylLyrics] = useState(
    'LOREM IPSUM DOLOR SIT AMET CONSECTETUR ADIPISCING ELIT SED DO EIUSMOD TEMPOR INCIDIDUNT UT LABORE ET DOLORE MAGNA ALIQUA'
  );

  const [bgType, setBgType] = useState('color');
  const [bgColor, setBgColor] = useState('#f5f5f5');
  const [bgBlur, setBgBlur] = useState(10);
  const [bgImageUrl, setBgImageUrl] = useState(null);

  const [exportColors, setExportColors] = useState(
    DEFAULT_VINYL_COLORS.map((c) => ({ color: c, checked: true }))
  );

  const [selectedType, setSelectedType] = useState(null);
  const [alignBarVisible, setAlignBarVisible] = useState(false);
  const [toast, setToast] = useState('');

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2200);
  }, []);

  const toggleAccordion = (key) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // ---- Canvas init ----
  useEffect(() => {
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
      fontSize: 18,
      fontFamily: 'DM Sans, sans-serif',
      fontWeight: 700,
      fill: topLeftColor,
      charSpacing: 100,
      data: { edType: EDIT_TYPES.TOP_LEFT },
    });
    canvas.add(topLeft);

    const topRight = new fabric.IText(topRightText, {
      left: containerDims.width * 0.92,
      top: containerDims.height * 0.08,
      originX: 'right',
      fontSize: 18,
      fontFamily: 'DM Sans, sans-serif',
      fontWeight: 700,
      fill: topRightColor,
      charSpacing: 100,
      data: { edType: EDIT_TYPES.TOP_RIGHT },
    });
    canvas.add(topRight);

    const songTitle = new fabric.Textbox(songTitleText, {
      left: containerDims.width / 2,
      top: containerDims.height * 0.12,
      width: containerDims.width * 0.84,
      originX: 'center',
      textAlign: 'center',
      fontSize: 36,
      fontFamily: 'Josefin Sans, sans-serif',
      fontWeight: 800,
      fill: songTitleColor,
      charSpacing: 100,
      data: { edType: EDIT_TYPES.SONG_TITLE },
    });
    canvas.add(songTitle);

    const bottom = new fabric.IText(bottomText, {
      left: containerDims.width / 2,
      top: containerDims.height * 0.92,
      originX: 'center',
      fontSize: 14,
      fontFamily: 'DM Sans, sans-serif',
      fontWeight: 600,
      fill: bottomColor,
      charSpacing: 50,
      data: { edType: EDIT_TYPES.BOTTOM },
    });
    canvas.add(bottom);

    canvas.textLeftRef = topLeft;
    canvas.textRightRef = topRight;
    canvas.textSongRef = songTitle;
    canvas.textBottomRef = bottom;

    buildVinylGroup(canvas, containerDims, vinylTextSize, vinylLyrics, vinylScale, vinylFontFamily, vinylTextColor, vinylLabelColor, vinylLabelSize, vinylLetterSpacing);

    canvas.on('selection:created', onSelectionChange);
    canvas.on('selection:updated', onSelectionChange);
    canvas.on('selection:cleared', () => {
      setSelectedType(null);
      setAlignBarVisible(false);
    });

    canvas.on('text:changed', (e) => {
      const t = e.target;
      if (!t || !t.data) return;
      const v = t.text;
      switch (t.data.edType) {
        case EDIT_TYPES.TOP_LEFT: setTopLeftText(v); break;
        case EDIT_TYPES.TOP_RIGHT: setTopRightText(v); break;
        case EDIT_TYPES.SONG_TITLE: setSongTitleText(v); break;
        case EDIT_TYPES.BOTTOM: setBottomText(v); break;
        default: break;
      }
    });

    // Font pre-loading setup
    const link = document.createElement('link');
    link.href = `https://fonts.googleapis.com/css?family=${GOOGLE_FONTS.map(f => f.replace(/ /g, '+')).join('|')}&display=swap`;
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    canvas.renderAll();

    return () => {
      canvas.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onSelectionChange(e) {
    const obj = e.selected && e.selected.length === 1 ? e.selected[0] : null;
    if (obj && obj.data) {
      setSelectedType(obj.data.edType);
    } else {
      setSelectedType('multi');
    }
    setAlignBarVisible(true);
  }

  function buildVinylGroup(canvas, dims, textSize, lyrics, scalePct, fontFam, textCol, labelCol, labelPct, letterSpc) {
    if (vinylGroupRef.current) {
      canvas.remove(vinylGroupRef.current);
    }
    const size = dims.width * (scalePct / 100);
    const cx = size / 2;
    const cy = size / 2;
    const outerR = size / 2 - 2;

    const labelR = outerR * (labelPct / 100);
    const holeR = outerR * 0.015;

    const edge = new fabric.Circle({
      left: cx, top: cy, radius: outerR, fill: '', stroke: '#d8d8d8', strokeWidth: 1,
      originX: 'center', originY: 'center', selectable: false, evented: false,
    });
    const label = new fabric.Circle({
      left: cx, top: cy, radius: labelR, fill: labelCol, stroke: '#c9c9c9', strokeWidth: 1,
      originX: 'center', originY: 'center', selectable: false, evented: false,
    });
    const hole = new fabric.Circle({
      left: cx, top: cy, radius: holeR, fill: '#111111',
      originX: 'center', originY: 'center', selectable: false, evented: false,
    });

    const spiralChars = buildGrooveSpiralChars(lyrics, {
      cx, cy,
      innerRadius: labelR + textSize * 0.6,
      outerRadius: outerR - textSize * 0.3,
      fontSize: textSize,
      color: textCol,
      fontFamily: fontFam,
      letterSpacing: letterSpc
    });

    const group = new fabric.Group(
      [edge, ...spiralChars, label, hole],
      {
        left: dims.width / 2,
        top: dims.height * 0.58,
        originX: 'center',
        originY: 'center',
        data: { edType: EDIT_TYPES.VINYL },
      }
    );
    canvas.add(group);
    vinylGroupRef.current = group;
    canvas.renderAll();
  }

  const rebuildVinyl = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    buildVinylGroup(canvas, containerDims, vinylTextSize, vinylLyrics, vinylScale, vinylFontFamily, vinylTextColor, vinylLabelColor, vinylLabelSize, vinylLetterSpacing);
  }, [containerDims, vinylTextSize, vinylLyrics, vinylScale, vinylFontFamily, vinylTextColor, vinylLabelColor, vinylLabelSize, vinylLetterSpacing]);

  // ---- Canvas size change ----
  const updateCanvasSize = (value) => {
    setCanvasSize(value);
    const { w, h } = parseSize(value);
    const dims = fitContain(w, h, BASE_MAX_W, BASE_MAX_H);
    setContainerDims(dims);
    const canvas = fabricRef.current;
    if (!canvas) return;
    canvas.setWidth(dims.width);
    canvas.setHeight(dims.height);
    bgRectRef.current.set({ width: dims.width, height: dims.height });
    bgOverlayRef.current.set({ width: dims.width, height: dims.height });
    canvas.textLeftRef.set({ left: dims.width * 0.08, top: dims.height * 0.08 });
    canvas.textRightRef.set({ left: dims.width * 0.92, top: dims.height * 0.08 });
    canvas.textSongRef.set({ left: dims.width / 2, top: dims.height * 0.12, width: dims.width * 0.84 });
    canvas.textBottomRef.set({ left: dims.width / 2, top: dims.height * 0.92 });
    buildVinylGroup(canvas, dims, vinylTextSize, vinylLyrics, vinylScale, vinylFontFamily, vinylTextColor, vinylLabelColor, vinylLabelSize, vinylLetterSpacing);
    canvas.renderAll();
  };

  // ---- Text + color updates ----
  const updateTextColor = (ref, setter, hex) => {
    setter(hex);
    ref.set({ fill: hex });
    fabricRef.current && fabricRef.current.renderAll();
  };

  const updateTextContent = (ref, setter, value) => {
    setter(value);
    ref.set({ text: value });
    fabricRef.current && fabricRef.current.renderAll();
  };

  useEffect(() => {
    const canvas = fabricRef.current;
    if (canvas && canvas.textLeftRef) canvas.textLeftRef.set({ text: topLeftText, fill: topLeftColor });
    canvas && canvas.renderAll();
  }, [topLeftText, topLeftColor]);

  useEffect(() => {
    const canvas = fabricRef.current;
    if (canvas && canvas.textRightRef) canvas.textRightRef.set({ text: topRightText, fill: topRightColor });
    canvas && canvas.renderAll();
  }, [topRightText, topRightColor]);

  useEffect(() => {
    const canvas = fabricRef.current;
    if (canvas && canvas.textSongRef) canvas.textSongRef.set({ text: songTitleText, fill: songTitleColor });
    canvas && canvas.renderAll();
  }, [songTitleText, songTitleColor]);

  useEffect(() => {
    const canvas = fabricRef.current;
    if (canvas && canvas.textBottomRef) canvas.textBottomRef.set({ text: bottomText, fill: bottomColor });
    canvas && canvas.renderAll();
  }, [bottomText, bottomColor]);

  useEffect(() => {
    rebuildVinyl();
  }, [rebuildVinyl]);

  // ---- Background ----
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas || !bgRectRef.current) return;
    if (bgType === 'color') {
      bgRectRef.current.set({ fill: bgColor, visible: true });
      if (bgImageRef.current) bgImageRef.current.set({ visible: false });
      bgOverlayRef.current.set({ visible: false });
    } else {
      bgRectRef.current.set({ visible: false });
      if (bgImageRef.current) {
        bgImageRef.current.set({ visible: true });
        bgOverlayRef.current.set({ visible: true });
      }
    }
    canvas.renderAll();
  }, [bgType, bgColor]);

  const updateBgColor = (hex) => {
    setBgColor(hex);
  };

  const updateVinylBgBlur = (val) => {
    setBgBlur(val);
    if (bgImageRef.current) {
      bgImageRef.current.filters = [new fabric.Image.filters.Blur({ blur: val / 100 })];
      bgImageRef.current.applyFilters();
      fabricRef.current.renderAll();
    }
  };

  const handleVinylCoverUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target.result;
      setBgImageUrl(url);
      fabric.Image.fromURL(url, (img) => {
        const canvas = fabricRef.current;
        if (bgImageRef.current) canvas.remove(bgImageRef.current);
        const scale = Math.max(
          containerDims.width / img.width,
          containerDims.height / img.height
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
        canvas.insertAt(img, 1, false);
        bgImageRef.current = img;
        bgOverlayRef.current.bringToFront();
        canvas.renderAll();
      }, { crossOrigin: 'anonymous' });
    };
    reader.readAsDataURL(file);
  };

  // ---- iTunes search ----
  const searchSong = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    setSearchResults([]);
    try {
      const res = await fetch(
        `https://itunes.apple.com/search?term=${encodeURIComponent(searchQuery)}&entity=song&limit=8`
      );
      const data = await res.json();
      setSearchResults(data.results || []);
    } catch (err) {
      showToast('Search failed');
    } finally {
      setSearching(false);
    }
  };

  const fetchLyrics = async (artist, title) => {
    try {
      const res = await fetch(
        `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`
      );
      if (!res.ok) return null;
      const data = await res.json();
      if (!data.lyrics) return null;
      return data.lyrics
        .replace(/\r/g, '')
        .split('\n')
        .filter(Boolean)
        .join(' ')
        .toUpperCase();
    } catch (err) {
      return null;
    }
  };

  const applySearchResult = async (track) => {
    const year = track.releaseDate ? new Date(track.releaseDate).getFullYear().toString() : '';
    updateTextContent(fabricRef.current.textLeftRef, setTopLeftText, (track.artistName || '').toUpperCase());
    updateTextContent(fabricRef.current.textRightRef, setTopRightText, year);
    updateTextContent(fabricRef.current.textSongRef, setSongTitleText, (track.trackName || '').toUpperCase());
    updateTextContent(fabricRef.current.textBottomRef, setBottomText, (track.collectionName || '').toUpperCase());

    showToast('Song data applied. Fetching lyrics...');
    const lyrics = await fetchLyrics(track.artistName, track.trackName);
    if (lyrics) {
      setVinylLyrics(lyrics);
      showToast('Lyrics found and applied to the vinyl spiral.');
    } else {
      showToast('Lyrics not found automatically. Paste them manually if needed.');
    }
  };

  // ---- Alignment ----
  const edAlign = (mode) => {
    const canvas = fabricRef.current;
    const obj = canvas.getActiveObject();
    if (!obj) return;
    const cw = canvas.getWidth();
    const ch = canvas.getHeight();
    const bound = obj.getBoundingRect();
    let dx = 0, dy = 0;
    switch (mode) {
      case 'left': dx = -bound.left; break;
      case 'cx': dx = cw / 2 - (bound.left + bound.width / 2); break;
      case 'right': dx = cw - (bound.left + bound.width); break;
      case 'top': dy = -bound.top; break;
      case 'cy': dy = ch / 2 - (bound.top + bound.height / 2); break;
      case 'bottom': dy = ch - (bound.top + bound.height); break;
      default: break;
    }
    obj.set({ left: obj.left + dx, top: obj.top + dy });
    obj.setCoords();
    canvas.renderAll();
  };

  const edDistribute = (axis) => {
    const canvas = fabricRef.current;
    const active = canvas.getActiveObject();
    if (!active || active.type !== 'activeSelection') return;
    const objs = active.getObjects().slice();
    if (objs.length < 3) return;
    if (axis === 'h') {
      objs.sort((a, b) => a.left - b.left);
      const first = objs[0], last = objs[objs.length - 1];
      const total = last.left - first.left;
      const step = total / (objs.length - 1);
      objs.forEach((o, i) => { o.set({ left: first.left + step * i }); o.setCoords(); });
    } else {
      objs.sort((a, b) => a.top - b.top);
      const first = objs[0], last = objs[objs.length - 1];
      const total = last.top - first.top;
      const step = total / (objs.length - 1);
      objs.forEach((o, i) => { o.set({ top: first.top + step * i }); o.setCoords(); });
    }
    canvas.renderAll();
  };

  // ---- Export helpers ----
  const getMultiplier = () => {
    const { w } = parseSize(canvasSize);
    return (w * DPI) / containerDims.width;
  };

  const getCheckedColors = () => {
    const checked = exportColors.filter((c) => c.checked).map((c) => c.color);
    return checked.length ? checked : [bgType === 'color' ? bgColor : '#ffffff'];
  };

  const withSwappedColor = async (color, fn) => {
    const canvas = fabricRef.current;
    const prevType = bgType;
    const prevColor = bgColor;
    bgRectRef.current.set({ fill: color, visible: true });
    if (bgImageRef.current) bgImageRef.current.set({ visible: false });
    bgOverlayRef.current.set({ visible: false });
    canvas.discardActiveObject();
    canvas.renderAll();
    await fn();
    bgRectRef.current.set({ fill: prevColor, visible: prevType === 'color' });
    if (bgImageRef.current) bgImageRef.current.set({ visible: prevType === 'blur' });
    bgOverlayRef.current.set({ visible: prevType === 'blur' });
    canvas.renderAll();
  };

  const downloadPNG = async () => {
    const canvas = fabricRef.current;
    const zip = new JSZip();
    const colors = getCheckedColors();
    const multiplier = getMultiplier();
    for (let i = 0; i < colors.length; i++) {
      const color = colors[i];
      await withSwappedColor(color, async () => {
        const dataUrl = canvas.toDataURL({ format: 'png', multiplier });
        const base64 = dataUrl.split(',')[1];
        zip.file(`vinyl-poster-${color.replace('#', '')}.png`, base64, { base64: true });
      });
    }
    const blob = await zip.generateAsync({ type: 'blob' });
    triggerDownload(blob, 'vinyl-poster-png.zip');
    showToast('PNG export ready');
  };

  const downloadPDF = async () => {
    const canvas = fabricRef.current;
    const zip = new JSZip();
    const colors = getCheckedColors();
    const multiplier = getMultiplier();
    const { w, h } = parseSize(canvasSize);
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
        zip.file(`vinyl-poster-${color.replace('#', '')}.pdf`, pdfBlob);
      });
    }
    const blob = await zip.generateAsync({ type: 'blob' });
    triggerDownload(blob, 'vinyl-poster-pdf.zip');
    showToast('PDF export ready');
  };

  const downloadSVG = async () => {
    const canvas = fabricRef.current;
    const zip = new JSZip();
    const colors = getCheckedColors();
    for (let i = 0; i < colors.length; i++) {
      const color = colors[i];
      await withSwappedColor(color, async () => {
        const svg = canvas.toSVG();
        zip.file(`vinyl-poster-${color.replace('#', '')}.svg`, svg);
      });
    }
    const blob = await zip.generateAsync({ type: 'blob' });
    triggerDownload(blob, 'vinyl-poster-svg.zip');
    showToast('SVG export ready');
  };

  const triggerDownload = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // ---- Multi export color rows ----
  const updateExportColor = (idx, value) => {
    setExportColors((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], color: value };
      return next;
    });
  };

  const toggleExportColor = (idx) => {
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

        .spotify-poster-page .search-row { display: flex; gap: 6px; padding: 0 16px 10px; align-items: flex-start; }
        .spotify-poster-page .search-row .form-row { flex: 1; padding: 0; }

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
        .spotify-poster-page .form-row textarea { min-height: 76px; resize: vertical; line-height: 1.5; }

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

        .spotify-poster-page .loading-spinner {
          width: 16px; height: 16px; border: 2px solid var(--panel-border);
          border-top-color: var(--accent); border-radius: 50%; animation: vinyl-spin 0.7s linear infinite;
        }
        @keyframes vinyl-spin { to { transform: rotate(360deg); } }

        .spotify-poster-page .search-results { padding: 0 16px 12px; max-height: 220px; overflow-y: auto; }
        .spotify-poster-page .search-result-item { border-radius: 6px; padding: 6px; }
        .spotify-poster-page .search-result-item:hover { background: var(--input-bg); }

        .spotify-poster-page #canvas-area {
          flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
          background: #0d0d0d; padding: 30px; overflow: hidden; position: relative;
        }
        .spotify-poster-page #canvas-area::before {
          content: ''; position: absolute; inset: 0;
          background: radial-gradient(ellipse at center, #1a1a1a 0%, #0d0d0d 70%); pointer-events: none;
        }
        .spotify-poster-page #poster-wrapper {
          position: relative; z-index: 1; display: flex; flex-direction: column; align-items: center; gap: 20px;
        }
        .spotify-poster-page #poster-container {
          position: relative; overflow: hidden;
          box-shadow: 0 32px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.05);
          border-radius: 4px; transition: width 0.4s cubic-bezier(0.4,0,0.2,1), height 0.4s cubic-bezier(0.4,0,0.2,1);
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

        .spotify-poster-page #ed-align-bar {
          position: absolute; top: 10px; left: 50%; transform: translateX(-50%); background: #111;
          border: 1px solid var(--panel-border); border-radius: 8px; display: none; align-items: center;
          gap: 2px; padding: 4px 6px; z-index: 500; box-shadow: 0 4px 16px rgba(0,0,0,0.6);
        }
        .spotify-poster-page #ed-align-bar.ed-bar-visible { display: flex; }
        .spotify-poster-page .ed-ab-btn {
          width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;
          background: none; border: none; color: var(--spotify-subtext); border-radius: 5px; cursor: pointer;
          transition: all 0.15s;
        }
        .spotify-poster-page .ed-ab-btn:hover { background: #1a1a1a; color: var(--spotify-text); }
        .spotify-poster-page .ed-ab-sep { width: 1px; height: 18px; background: var(--panel-border); margin: 0 3px; }

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
        .spotify-poster-page .pf-2col { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
        .spotify-poster-page .pf-3col { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 4px; }
        .spotify-poster-page .pf-color-row { display: flex; gap: 6px; align-items: center; }
        .spotify-poster-page .pf-color-row input[type=text] { flex: 1; }
        .spotify-poster-page .pf-range-row { display: flex; align-items: center; gap: 6px; }
        .spotify-poster-page .pf-range-val { font-size: 10px; color: var(--accent); font-weight: 600; min-width: 32px; text-align: right; }
        .spotify-poster-page .pf-toggle-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
        .spotify-poster-page .pf-toggle-row > span { font-size: 11px; color: var(--spotify-subtext); }
        .spotify-poster-page .pf-divider { border: none; border-top: 1px solid #1e1e1e; margin: 10px 0; }
        .spotify-poster-page .pf-btn-row { display: flex; gap: 4px; }
        .spotify-poster-page .pf-btn {
          flex: 1; padding: 5px 4px; background: var(--input-bg); border: 1px solid var(--input-border);
          border-radius: 4px; color: var(--spotify-subtext); font-size: 10px; cursor: pointer;
          font-family: 'DM Sans', sans-serif; transition: all 0.15s; text-align: center;
        }
        .spotify-poster-page .pf-btn:hover { background: #252525; color: var(--spotify-text); }
      `}</style>
      <div id="panel">
        <div className="panel-header">
          <div className="title-group">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="3" /><circle cx="12" cy="12" r="1" fill="currentColor" />
            </svg>
            <h1>Vinyl Poster</h1>
          </div>
          <button className="back-btn" onClick={() => navigate('/song-poster')}>&#10229; Back</button>
        </div>

        <button className={`accordion-btn${openSections.search ? ' open' : ''}`} onClick={() => toggleAccordion('search')}>
          &#128269; Search Song (iTunes)<span className="arrow">&#9660;</span>
        </button>
        <div className={`accordion-content${openSections.search ? ' open' : ''}`}>
          <div className="search-row">
            <div className="form-row">
              <input
                type="text"
                id="search-input"
                placeholder="Song or artist name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') searchSong(); }}
              />
            </div>
            <button className="btn btn-primary" style={{ width: 'auto', margin: 0, padding: '7px 12px' }} onClick={searchSong}>
              Search
            </button>
          </div>
          {searching && <div className="loading-spinner" id="search-spinner" style={{ margin: '8px auto' }} />}
          <div className="search-results" id="search-results">
            {searchResults.map((track: any) => (
              <div key={track.trackId} className="search-result-item" onClick={() => applySearchResult(track)} style={{ cursor: 'pointer', display: 'flex', gap: '8px', alignItems: 'center', padding: '6px 0' }}>
                {track.artworkUrl60 && <img src={track.artworkUrl60} alt="" width={36} height={36} />}
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 600 }}>{track.trackName}</div>
                  <div style={{ fontSize: '10px', color: '#888' }}>{track.artistName}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button className={`accordion-btn${openSections.size ? ' open' : ''}`} onClick={() => toggleAccordion('size')}>
          &#128208; Canvas Size<span className="arrow">&#9660;</span>
        </button>
        <div className={`accordion-content${openSections.size ? ' open' : ''}`}>
          <div className="form-row">
            <label>Print Size</label>
            <select id="canvas-size" value={canvasSize} onChange={(e) => updateCanvasSize(e.target.value)}>
              {PRINT_SIZES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>

        <button className={`accordion-btn${openSections.texts ? ' open' : ''}`} onClick={() => toggleAccordion('texts')}>
          &#128294; Top &amp; Bottom Texts<span className="arrow">&#9660;</span>
        </button>
        <div className={`accordion-content${openSections.texts ? ' open' : ''}`}>
          <div className="form-row">
            <label>Artist Name (Top Left) Text</label>
            <input type="text" id="v-label-input" value={topLeftText}
              onChange={(e) => updateTextContent(fabricRef.current.textLeftRef, setTopLeftText, e.target.value)} />
          </div>
          <div className="form-row">
            <label>Artist Name (Top Left) Color</label>
            <div className="color-row">
              <input type="color" id="c-v-tl" value={topLeftColor}
                onChange={(e) => updateTextColor(fabricRef.current.textLeftRef, setTopLeftColor, e.target.value)} />
              <input type="text" id="c-v-tl-t" value={topLeftColor}
                onChange={(e) => updateTextColor(fabricRef.current.textLeftRef, setTopLeftColor, e.target.value)} />
            </div>
          </div>

          <div className="form-row" style={{ marginTop: '12px' }}>
            <label>Year (Top Right) Text</label>
            <input type="text" id="v-year-input" value={topRightText}
              onChange={(e) => updateTextContent(fabricRef.current.textRightRef, setTopRightText, e.target.value)} />
          </div>
          <div className="form-row">
            <label>Year Color</label>
            <div className="color-row">
              <input type="color" id="c-v-tr" value={topRightColor}
                onChange={(e) => updateTextColor(fabricRef.current.textRightRef, setTopRightColor, e.target.value)} />
              <input type="text" id="c-v-tr-t" value={topRightColor}
                onChange={(e) => updateTextColor(fabricRef.current.textRightRef, setTopRightColor, e.target.value)} />
            </div>
          </div>

          <div className="form-row" style={{ marginTop: '12px' }}>
            <label>Bottom Text (Album Name / Optional)</label>
            <input type="text" id="v-bottom-input" value={bottomText}
              onChange={(e) => updateTextContent(fabricRef.current.textBottomRef, setBottomText, e.target.value)} />
          </div>
          <div className="form-row">
            <label>Bottom Text Color</label>
            <div className="color-row">
              <input type="color" id="c-v-bot" value={bottomColor}
                onChange={(e) => updateTextColor(fabricRef.current.textBottomRef, setBottomColor, e.target.value)} />
              <input type="text" id="c-v-bot-t" value={bottomColor}
                onChange={(e) => updateTextColor(fabricRef.current.textBottomRef, setBottomColor, e.target.value)} />
            </div>
          </div>
        </div>

        <button className={`accordion-btn${openSections.song ? ' open' : ''}`} onClick={() => toggleAccordion('song')}>
          &#127925; Song Details<span className="arrow">&#9660;</span>
        </button>
        <div className={`accordion-content${openSections.song ? ' open' : ''}`}>
          <div className="form-row">
            <label>Song Title Text</label>
            <input type="text" id="v-song-title-input" value={songTitleText}
              onChange={(e) => updateTextContent(fabricRef.current.textSongRef, setSongTitleText, e.target.value)} />
          </div>
          <div className="form-row">
            <label>Song Title Color</label>
            <div className="color-row">
              <input type="color" id="c-v-st" value={songTitleColor}
                onChange={(e) => updateTextColor(fabricRef.current.textSongRef, setSongTitleColor, e.target.value)} />
              <input type="text" id="c-v-st-t" value={songTitleColor}
                onChange={(e) => updateTextColor(fabricRef.current.textSongRef, setSongTitleColor, e.target.value)} />
            </div>
          </div>
        </div>

        <button className={`accordion-btn${openSections.background ? ' open' : ''}`} onClick={() => toggleAccordion('background')}>
          &#128444;&#65039; Main Background<span className="arrow">&#9660;</span>
        </button>
        <div className={`accordion-content${openSections.background ? ' open' : ''}`}>
          <div className="form-row">
            <label>Background Type</label>
            <select id="v-bg-type" value={bgType} onChange={(e) => setBgType(e.target.value)}>
              <option value="color">Solid Color</option>
              <option value="blur">Blurred Image</option>
            </select>
          </div>

          {bgType === 'color' && (
            <div id="v-bg-color-section">
              <div className="form-row">
                <label>Background Color</label>
                <div className="color-row">
                  <input type="color" id="v-bg-color" value={bgColor} onChange={(e) => updateBgColor(e.target.value)} />
                  <input type="text" id="v-bg-color-txt" value={bgColor} onChange={(e) => updateBgColor(e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {bgType === 'blur' && (
            <div id="v-bg-blur-section">
              <div className="form-row">
                <label>Blur</label>
                <div className="range-row">
                  <input type="range" min="0" max="40" value={bgBlur} id="v-blur-val"
                    onChange={(e) => updateVinylBgBlur(Number(e.target.value))} />
                  <span className="range-val" id="v-blur-display">{bgBlur}px</span>
                </div>
              </div>
              <div className="upload-area" onClick={() => document.getElementById('v-cover-upload')?.click()} style={{ marginTop: '12px' }}>
                <input type="file" id="v-cover-upload" accept="image/*" onChange={handleVinylCoverUpload}
                  style={{ opacity: 0, position: 'absolute', inset: 0, cursor: 'pointer' }} />
                <p>Click to upload image</p>
              </div>
            </div>
          )}
        </div>

        <button className={`accordion-btn${openSections.multiExport ? ' open' : ''}`} onClick={() => toggleAccordion('multiExport')}>
          &#127912; Multi-Color Export (Batch Output)<span className="arrow">&#9660;</span>
        </button>
        <div className={`accordion-content${openSections.multiExport ? ' open' : ''}`}>
          <p style={{ fontSize: '10px', color: '#777', marginBottom: '10px' }}>
            Checked colors are applied to the background in sequence and saved together as a ZIP when you download.
          </p>
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
        <div id="ed-align-bar" className={alignBarVisible ? 'ed-bar-visible' : ''}>
          <button className="ed-ab-btn" title="Align Left" onClick={() => edAlign('left')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="3" x2="3" y2="21" strokeWidth="2.5" /><rect x="5" y="8" width="8" height="3" rx="1" /><rect x="5" y="13" width="13" height="3" rx="1" />
            </svg>
          </button>
          <button className="ed-ab-btn" title="Center X" onClick={() => edAlign('cx')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="3" x2="12" y2="21" strokeWidth="2.5" /><rect x="6" y="8" width="12" height="3" rx="1" /><rect x="4" y="13" width="16" height="3" rx="1" />
            </svg>
          </button>
          <button className="ed-ab-btn" title="Align Right" onClick={() => edAlign('right')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="21" y1="3" x2="21" y2="21" strokeWidth="2.5" /><rect x="11" y="8" width="8" height="3" rx="1" /><rect x="6" y="13" width="13" height="3" rx="1" />
            </svg>
          </button>
          <div className="ed-ab-sep" />
          <button className="ed-ab-btn" title="Align Top" onClick={() => edAlign('top')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="3" x2="21" y2="3" strokeWidth="2.5" /><rect x="8" y="5" width="3" height="8" rx="1" /><rect x="13" y="5" width="3" height="13" rx="1" />
            </svg>
          </button>
          <button className="ed-ab-btn" title="Center Y" onClick={() => edAlign('cy')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="12" x2="21" y2="12" strokeWidth="2.5" /><rect x="8" y="4" width="3" height="16" rx="1" /><rect x="13" y="6" width="3" height="12" rx="1" />
            </svg>
          </button>
          <button className="ed-ab-btn" title="Align Bottom" onClick={() => edAlign('bottom')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="21" x2="21" y2="21" strokeWidth="2.5" /><rect x="8" y="11" width="3" height="8" rx="1" /><rect x="13" y="6" width="3" height="13" rx="1" />
            </svg>
          </button>
          <div className="ed-ab-sep" />
          <button className="ed-ab-btn" title="Distribute H" onClick={() => edDistribute('h')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="3" x2="3" y2="21" /><line x1="21" y1="3" x2="21" y2="21" /><rect x="9" y="8" width="6" height="8" rx="1" />
            </svg>
          </button>
          <button className="ed-ab-btn" title="Distribute V" onClick={() => edDistribute('v')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="3" x2="21" y2="3" /><line x1="3" y1="21" x2="21" y2="21" /><rect x="8" y="9" width="8" height="6" rx="1" />
            </svg>
          </button>
        </div>

        <div id="poster-wrapper">
          <div id="poster-container" style={{ width: containerDims.width, height: containerDims.height }}>
            <canvas ref={canvasElRef} />
          </div>
        </div>
      </div>

      <div id="props-panel">
        <div id="props-header">
          Properties
          <span id="props-selected-name">
            {selectedType === EDIT_TYPES.TOP_LEFT && 'Artist Name'}
            {selectedType === EDIT_TYPES.TOP_RIGHT && 'Year'}
            {selectedType === EDIT_TYPES.SONG_TITLE && 'Song Title'}
            {selectedType === EDIT_TYPES.BOTTOM && 'Bottom Text'}
            {selectedType === EDIT_TYPES.VINYL && 'Vinyl Record'}
            {selectedType === 'multi' && 'Multiple'}
          </span>
        </div>
        <div id="props-body">
          {!selectedType && (
            <div id="props-empty-state">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" />
              </svg>
              <p>Click an element on the canvas</p>
            </div>
          )}
          {selectedType === EDIT_TYPES.TOP_LEFT && (
            <div id="props-fields">
              <div className="pf-section">
                <div className="pf-section-title">Artist Name (Top Left)</div>
                <div className="pf-row">
                  <label>Text</label>
                  <input type="text" value={topLeftText}
                    onChange={(e) => updateTextContent(fabricRef.current.textLeftRef, setTopLeftText, e.target.value)} />
                </div>
                <div className="pf-row">
                  <label>Color</label>
                  <div className="pf-color-row">
                    <input type="color" value={topLeftColor}
                      onChange={(e) => updateTextColor(fabricRef.current.textLeftRef, setTopLeftColor, e.target.value)} />
                    <input type="text" value={topLeftColor}
                      onChange={(e) => updateTextColor(fabricRef.current.textLeftRef, setTopLeftColor, e.target.value)} />
                  </div>
                </div>
              </div>
            </div>
          )}
          {selectedType === EDIT_TYPES.TOP_RIGHT && (
            <div id="props-fields">
              <div className="pf-section">
                <div className="pf-section-title">Year (Top Right)</div>
                <div className="pf-row">
                  <label>Text</label>
                  <input type="text" value={topRightText}
                    onChange={(e) => updateTextContent(fabricRef.current.textRightRef, setTopRightText, e.target.value)} />
                </div>
                <div className="pf-row">
                  <label>Color</label>
                  <div className="pf-color-row">
                    <input type="color" value={topRightColor}
                      onChange={(e) => updateTextColor(fabricRef.current.textRightRef, setTopRightColor, e.target.value)} />
                    <input type="text" value={topRightColor}
                      onChange={(e) => updateTextColor(fabricRef.current.textRightRef, setTopRightColor, e.target.value)} />
                  </div>
                </div>
              </div>
            </div>
          )}
          {selectedType === EDIT_TYPES.SONG_TITLE && (
            <div id="props-fields">
              <div className="pf-section">
                <div className="pf-section-title">Song Title</div>
                <div className="pf-row">
                  <label>Text</label>
                  <input type="text" value={songTitleText}
                    onChange={(e) => updateTextContent(fabricRef.current.textSongRef, setSongTitleText, e.target.value)} />
                </div>
                <div className="pf-row">
                  <label>Color</label>
                  <div className="pf-color-row">
                    <input type="color" value={songTitleColor}
                      onChange={(e) => updateTextColor(fabricRef.current.textSongRef, setSongTitleColor, e.target.value)} />
                    <input type="text" value={songTitleColor}
                      onChange={(e) => updateTextColor(fabricRef.current.textSongRef, setSongTitleColor, e.target.value)} />
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
                    onChange={(e) => updateTextContent(fabricRef.current.textBottomRef, setBottomText, e.target.value)} />
                </div>
                <div className="pf-row">
                  <label>Color</label>
                  <div className="pf-color-row">
                    <input type="color" value={bottomColor}
                      onChange={(e) => updateTextColor(fabricRef.current.textBottomRef, setBottomColor, e.target.value)} />
                    <input type="text" value={bottomColor}
                      onChange={(e) => updateTextColor(fabricRef.current.textBottomRef, setBottomColor, e.target.value)} />
                  </div>
                </div>
              </div>
            </div>
          )}
          {selectedType === EDIT_TYPES.VINYL && (
            <div id="props-fields">
              <div className="pf-section">
                <div className="pf-section-title">Vinyl Record &amp; Lyrics</div>
                
                <div className="pf-row">
                  <label>Overall Size (%)</label>
                  <div className="pf-range-row">
                    <input type="range" min="10" max="150" value={vinylScale} onChange={(e) => setVinylScale(Number(e.target.value))} />
                    <span className="pf-range-val">{vinylScale}%</span>
                  </div>
                </div>

                <div className="pf-row">
                  <label>Spiral Font Family</label>
                  <select className="sidebar-control" value={vinylFontFamily} onChange={(e) => setVinylFontFamily(e.target.value)}>
                    <option value="DM Sans, sans-serif">DM Sans</option>
                    {GOOGLE_FONTS.map(f => <option key={f} value={`${f}, sans-serif`}>{f}</option>)}
                  </select>
                </div>

                <div className="pf-row">
                  <label>Spiral Text Color</label>
                  <div className="color-row">
                    <input type="color" value={vinylTextColor} onChange={(e) => setVinylTextColor(e.target.value)} />
                    <input type="text" value={vinylTextColor} onChange={(e) => setVinylTextColor(e.target.value)} />
                  </div>
                </div>

                <div className="pf-row">
                  <label>Spiral Text Size</label>
                  <div className="range-row">
                    <input type="range" min="6" max="40" value={vinylTextSize} onChange={(e) => setVinylTextSize(Number(e.target.value))} />
                    <span className="range-val">{vinylTextSize}px</span>
                  </div>
                </div>

                <div className="pf-row">
                  <label>Letter Spacing</label>
                  <div className="range-row">
                    <input type="range" min="0" max="10" step="0.5" value={vinylLetterSpacing} onChange={(e) => setVinylLetterSpacing(Number(e.target.value))} />
                    <span className="range-val">{vinylLetterSpacing}px</span>
                  </div>
                </div>

                <div className="pf-row">
                  <label>Center Label Color</label>
                  <div className="color-row">
                    <input type="color" value={vinylLabelColor} onChange={(e) => setVinylLabelColor(e.target.value)} />
                    <input type="text" value={vinylLabelColor} onChange={(e) => setVinylLabelColor(e.target.value)} />
                  </div>
                </div>

                <div className="pf-row">
                  <label>Center Label Size (%)</label>
                  <div className="range-row">
                    <input type="range" min="5" max="50" value={vinylLabelSize} onChange={(e) => setVinylLabelSize(Number(e.target.value))} />
                    <span className="range-val">{vinylLabelSize}%</span>
                  </div>
                </div>

                <div className="pf-row">
                  <label>Lyrics / Text Content</label>
                  <textarea
                    style={{
                      width: '100%', background: 'var(--input-bg)', border: '1px solid var(--input-border)',
                      borderRadius: '5px', color: 'var(--spotify-text)', padding: '6px 8px', fontSize: '11px',
                      fontFamily: 'inherit', minHeight: '90px', resize: 'vertical',
                    }}
                    value={vinylLyrics}
                    onChange={(e) => setVinylLyrics(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}
          {selectedType === 'multi' && (
            <div id="props-fields">
              <div className="pf-section">
                <div className="pf-section-title">Multiple Selection</div>
                <p style={{ fontSize: '11px', color: '#888' }}>
                  Use the align/distribute toolbar above the canvas, or drag the group directly.
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
