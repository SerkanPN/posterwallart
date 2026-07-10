import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as fabric from 'fabric';
import jsPDF from 'jspdf';
import { AlertTriangle, Lock, MessageCircle, X } from 'lucide-react';

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

const EXTENDED_PALETTE = [
  { name: 'Dove', hex: '#e5e5e5' }, { name: 'Smoke', hex: '#b3b3b3' }, { name: 'Grey', hex: '#808080' },
  { name: 'Coal', hex: '#333333' }, { name: 'Black', hex: '#000000' }, { name: 'Sun', hex: '#ffdb58' },
  { name: 'Yellow', hex: '#ffc107' }, { name: 'Orange', hex: '#ff8c00' }, { name: 'Red', hex: '#cc0000' },
  { name: 'Mocha', hex: '#654321' }, { name: 'Lav', hex: '#b399ff' }, { name: 'Purple', hex: '#660066' },
  { name: 'Pink', hex: '#ff99cc' }, { name: 'Peach', hex: '#ff9980' }, { name: 'Plum', hex: '#990033' },
  { name: 'Sky', hex: '#66ccff' }, { name: 'Blue', hex: '#0066cc' }, { name: 'Navy', hex: '#000066' },
  { name: 'Denim', hex: '#336699' }, { name: 'Petrol', hex: '#003333' }, { name: 'Mint', hex: '#66ffcc' },
  { name: 'Teal', hex: '#009999' }, { name: 'Lime', hex: '#33cc33' }, { name: 'Green', hex: '#008000' },
  { name: 'Forest', hex: '#003300' }
];

const PRESETS = [
  {
    id: 'first-heartbeat',
    label: 'First Heartbeat',
    desc: 'Capture the rhythm of a new life. Perfect for gender reveals or nursery decor.',
    texts: {
      tl: 'BABY BOY', tr: '14.05.2026', title: 'FIRST HEARTBEAT', sub: '142 BPM', b1: 'ULTRASOUND RECORDING', b2: 'MEMORIAL HOSPITAL'
    },
    colors: { bg: '#fdf2f8', title: '#831843', sub: '#be185d', div: '#fbcfe8', bottom: '#9d174d', top: '#9d174d' },
    wave: { type: 'gradient', solid: '#000000', stops: 2, grad: ['#f472b6', '#38bdf8', '#000000', '#000000', '#000000'] }
  },
  {
    id: 'first-cry',
    label: 'First Cry',
    desc: 'The beautiful sound of arriving into the world. A warm, aesthetic sunset gradient.',
    texts: {
      tl: 'LEO ALEXANDER', tr: '08:42 AM', title: 'HELLO WORLD', sub: 'THE FIRST CRY', b1: 'WELCOME TO THE FAMILY', b2: '3.2 KG - 51 CM'
    },
    colors: { bg: '#fffbeb', title: '#78350f', sub: '#b45309', div: '#fde68a', bottom: '#92400e', top: '#92400e' },
    wave: { type: 'gradient', solid: '#000000', stops: 3, grad: ['#fbbf24', '#f59e0b', '#ea580c', '#000000', '#000000'] }
  },
  {
    id: 'first-word',
    label: 'First Word',
    desc: 'A playful and bright template to immortalize the very first word spoken by your child.',
    texts: {
      tl: "EMMA'S FIRST WORD", tr: '9 MONTHS OLD', title: '"MAMA"', sub: 'RECORDED AT HOME', b1: 'A MOMENT TO REMEMBER', b2: '12.10.2025'
    },
    colors: { bg: '#f0fdf4', title: '#14532d', sub: '#166534', div: '#bbf7d0', bottom: '#15803d', top: '#15803d' },
    wave: { type: 'solid', solid: '#22c55e', stops: 2, grad: ['#000000', '#000000', '#000000', '#000000', '#000000'] }
  },
  {
    id: 'first-laugh',
    label: 'First Laugh',
    desc: 'The best sound in the world. Refreshing teal and mint tones.',
    texts: {
      tl: 'BABY MILA', tr: '00:00:15', title: 'PURE JOY', sub: 'THE FIRST LAUGH', b1: 'THE BEST SOUND IN THE WORLD', b2: 'SUNDAY MORNING'
    },
    colors: { bg: '#f0fdfa', title: '#064e3b', sub: '#065f46', div: '#a7f3d0', bottom: '#047857', top: '#047857' },
    wave: { type: 'gradient', solid: '#000000', stops: 2, grad: ['#2dd4bf', '#0ea5e9', '#000000', '#000000', '#000000'] }
  },
  {
    id: 'proposal',
    label: 'The Proposal',
    desc: 'Turn a hidden voice recording of a marriage proposal into a timeless piece of art.',
    texts: {
      tl: 'WILL YOU MARRY ME?', tr: '24.08.2025', title: 'SHE SAID YES', sub: 'THE PROPOSAL', b1: 'HIDDEN AUDIO RECORDING', b2: 'CENTRAL PARK, NEW YORK'
    },
    colors: { bg: '#fef2f2', title: '#7f1d1d', sub: '#991b1b', div: '#fecaca', bottom: '#b91c1c', top: '#b91c1c' },
    wave: { type: 'gradient', solid: '#000000', stops: 3, grad: ['#ef4444', '#b91c1c', '#7f1d1d', '#000000', '#000000'] }
  },
  {
    id: 'wedding-dance',
    label: 'First Dance',
    desc: 'Elegant, timeless, and classic. A luxurious monochrome and gold theme.',
    texts: {
      tl: 'SARAH & JOHN', tr: 'OUR WEDDING DAY', title: 'OUR FIRST DANCE', sub: 'PERFECT BY ED SHEERAN', b1: 'FOREVER AND ALWAYS', b2: '15TH OF SEPTEMBER'
    },
    colors: { bg: '#fafafa', title: '#171717', sub: '#404040', div: '#e5e5e5', bottom: '#262626', top: '#262626' },
    wave: { type: 'gradient', solid: '#000000', stops: 3, grad: ['#fcd34d', '#d97706', '#b45309', '#000000', '#000000'] }
  },
  {
    id: 'i-love-you',
    label: 'I Love You Message',
    desc: 'Perfect for long-distance relationships or simple affectionate gestures.',
    texts: {
      tl: 'FROM ALEX', tr: 'TO SOPHIA', title: 'I LOVE YOU', sub: 'A LATE NIGHT VOICE MESSAGE', b1: 'DISTANCE MEANS NOTHING', b2: '3400 KILOMETERS AWAY'
    },
    colors: { bg: '#faf5ff', title: '#312e81', sub: '#3730a3', div: '#e0e7ff', bottom: '#4338ca', top: '#4338ca' },
    wave: { type: 'gradient', solid: '#000000', stops: 2, grad: ['#818cf8', '#c084fc', '#000000', '#000000', '#000000'] }
  },
  {
    id: 'memorial',
    label: 'In Loving Memory',
    desc: 'A solemn and respectful tribute. Preserve an old voicemail or video recording.',
    texts: {
      tl: 'GRANDPA GEORGE', tr: '1940 - 2025', title: '"I AM ALWAYS WITH YOU"', sub: 'A SAVED VOICEMAIL', b1: 'IN LOVING MEMORY', b2: 'FOREVER IN OUR HEARTS'
    },
    colors: { bg: '#f4f4f5', title: '#171717', sub: '#404040', div: '#d4d4d8', bottom: '#52525b', top: '#52525b' },
    wave: { type: 'solid', solid: '#27272a', stops: 2, grad: ['#000000', '#000000', '#000000', '#000000', '#000000'] }
  },
  {
    id: 'pet-memorial',
    label: 'Pet Memorial',
    desc: 'Immortalize your best friend’s bark, meow, or purr. Warm, earthy colors.',
    texts: {
      tl: 'CHARLIE THE GOLDEN', tr: '2012 - 2025', title: 'HAPPY BARKS', sub: 'THE BEST BOY', b1: 'THE SOUND OF HOME', b2: 'WE WILL MISS YOU'
    },
    colors: { bg: '#fff7ed', title: '#451a03', sub: '#78350f', div: '#fef3c7', bottom: '#92400e', top: '#92400e' },
    wave: { type: 'gradient', solid: '#000000', stops: 2, grad: ['#d97706', '#92400e', '#000000', '#000000', '#000000'] }
  },
  {
    id: 'song-chorus',
    label: 'Iconic Song Chorus',
    desc: 'A vibrant cyberpunk aesthetic for displaying the exact soundwave of a legendary solo.',
    texts: {
      tl: 'PINK FLOYD', tr: '1979', title: 'COMFORTABLY NUMB', sub: 'THE GUITAR SOLO (04:30 - 06:22)', b1: 'THE WALL', b2: 'HARVEST RECORDS'
    },
    colors: { bg: '#09090b', title: '#f4f4f5', sub: '#a1a1aa', div: '#27272a', bottom: '#d4d4d8', top: '#d4d4d8' },
    wave: { type: 'gradient', solid: '#000000', stops: 3, grad: ['#2dd4bf', '#818cf8', '#f472b6', '#000000', '#000000'] }
  },
  {
    id: 'movie-quote',
    label: 'Movie Quote',
    desc: 'Cinematic layout for your favorite movie or TV show dialogue.',
    texts: {
      tl: 'MATTHEW MCCONAUGHEY', tr: '2014', title: 'INTERSTELLAR', sub: '"LOVE IS THE ONE THING WE\'RE CAPABLE OF PERCEIVING..."', b1: 'DIRECTED BY CHRISTOPHER NOLAN', b2: 'HANS ZIMMER SCORE'
    },
    colors: { bg: '#0f172a', title: '#e0e7ff', sub: '#a5b4fc', div: '#1e293b', bottom: '#c7d2fe', top: '#c7d2fe' },
    wave: { type: 'gradient', solid: '#000000', stops: 2, grad: ['#38bdf8', '#facc15', '#000000', '#000000', '#000000'] }
  },
  {
    id: 'graduation',
    label: 'Graduation Speech',
    desc: 'Commemorate an academic achievement. Perfect for valedictorian speeches.',
    texts: {
      tl: 'MICHAEL CHANG', tr: 'CLASS OF 2026', title: 'THE SPEECH', sub: 'VALEDICTORIAN ADDRESS', b1: 'HARVARD UNIVERSITY', b2: 'THE BEGINNING OF EVERYTHING'
    },
    colors: { bg: '#f8fafc', title: '#0f172a', sub: '#334155', div: '#e2e8f0', bottom: '#475569', top: '#475569' },
    wave: { type: 'gradient', solid: '#000000', stops: 2, grad: ['#1d4ed8', '#0f172a', '#000000', '#000000', '#000000'] }
  },
  {
    id: 'inside-joke',
    label: 'Inside Joke / Laughter',
    desc: 'Capture uncontrollable laughter or an inside joke shared among close friends.',
    texts: {
      tl: 'THE SQUAD', tr: 'SUMMER TRIP \'25', title: 'YOU HAD TO BE THERE', sub: '5 MINUTES OF UNCONTROLLABLE LAUGHTER', b1: 'ROAD TRIP TO MALIBU', b2: 'BEST MEMORIES'
    },
    colors: { bg: '#fdf4ff', title: '#4a044e', sub: '#701a75', div: '#fce7f3', bottom: '#86198f', top: '#86198f' },
    wave: { type: 'gradient', solid: '#000000', stops: 4, grad: ['#f43f5e', '#a855f7', '#3b82f6', '#10b981', '#000000'] }
  },
  {
    id: 'time-capsule',
    label: 'Time Capsule',
    desc: 'A voice memo recorded for the future. Futuristic and encrypted aesthetic.',
    texts: {
      tl: 'TOP SECRET', tr: 'DO NOT OPEN UNTIL 2035', title: 'TIME CAPSULE', sub: 'A MESSAGE TO MY FUTURE SELF', b1: 'RECORDED ON JANUARY 1ST, 2026', b2: 'ENCRYPTED AUDIO'
    },
    colors: { bg: '#020617', title: '#38bdf8', sub: '#0ea5e9', div: '#0f172a', bottom: '#7dd3fc', top: '#7dd3fc' },
    wave: { type: 'gradient', solid: '#000000', stops: 2, grad: ['#0ea5e9', '#4f46e5', '#000000', '#000000', '#000000'] }
  },
  {
    id: 'space-voyager',
    label: 'Space Voyager',
    desc: 'Inspired by the Voyager Golden Record. Deep space aesthetics for scientific audio clips.',
    texts: {
      tl: 'NASA RECORDING', tr: '1977', title: 'THE SOUND OF EARTH', sub: 'VOYAGER GOLDEN RECORD', b1: 'INTERSTELLAR MISSION', b2: 'CARL SAGAN'
    },
    colors: { bg: '#000000', title: '#fef08a', sub: '#fde047', div: '#27272a', bottom: '#fde047', top: '#fde047' },
    wave: { type: 'solid', solid: '#eab308', stops: 2, grad: ['#000000', '#000000', '#000000', '#000000', '#000000'] }
  }
];

const DPI = 300;
const BASE_MAX_W = 600;
const BASE_MAX_H = 800;

const EDIT_TYPES = {
  MAIN_TITLE: 'sw-main-title',
  SUB_TITLE: 'sw-sub-title',
  DIVIDER: 'sw-divider',
  BOTTOM_1: 'sw-bottom-1',
  BOTTOM_2: 'sw-bottom-2',
  SOUNDWAVE: 'sw-soundwave',
  TOP_LEFT: 'sw-top-left',
  TOP_RIGHT: 'sw-top-right',
  QR_CODE: 'sw-qrcode'
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
    const x = i / (count - 1);
    let envelope = Math.sin(x * Math.PI); 
    envelope = Math.pow(envelope, 0.6); 
    const noise1 = Math.random();
    const noise2 = Math.random() * Math.random(); 
    const spike = Math.random() > 0.92 ? Math.random() : 0;
    let val = (noise1 * 0.3 + noise2 * 0.6 + spike * 0.4) * envelope;
    val = Math.max(0.02, Math.min(1, val));
    peaks.push(val);
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
  const wavePathRef = useRef<fabric.Path | null>(null);
  const qrCodeRef = useRef<fabric.Image | null>(null);

  const isRebuildingRef = useRef<boolean>(false);
  const rawAudioDataRef = useRef<Float32Array | null>(null);

  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [showReviewModal, setShowReviewModal] = useState<boolean>(false);
  const [userConfirmed, setUserConfirmed] = useState<boolean>(false);
  const [previewImage, setPreviewImage] = useState<string>('');

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    presets: true,
    size: false,
    soundwave: false,
    qrcode: false,
    background: false
  });

  const [activePreset, setActivePreset] = useState<string>('custom');

  const [canvasSize, setCanvasSize] = useState<string>('30x40');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('landscape');
  const [containerDims, setContainerDims] = useState(() => {
    const { w, h } = parseAndOrientSize('30x40', 'landscape');
    return fitContain(w, h, BASE_MAX_W, BASE_MAX_H);
  });
  const [zoom, setZoom] = useState<number>(1); 

  const [topLeftText, setTopLeftText] = useState('ELECTRIC HEARTBEAT');
  const [topLeftColor, setTopLeftColor] = useState('#000000');
  const [topLeftFontFamily, setTopLeftFontFamily] = useState('Montserrat, sans-serif');
  const [topLeftFontSize, setTopLeftFontSize] = useState(12);
  const [topLeftCharSpacing, setTopLeftCharSpacing] = useState(100);
  const [topLeftFontWeight, setTopLeftFontWeight] = useState('700');
  const [topLeftFontStyle, setTopLeftFontStyle] = useState('normal');

  const [topRightText, setTopRightText] = useState('14.05.2026');
  const [topRightColor, setTopRightColor] = useState('#000000');
  const [topRightFontFamily, setTopRightFontFamily] = useState('Montserrat, sans-serif');
  const [topRightFontSize, setTopRightFontSize] = useState(12);
  const [topRightCharSpacing, setTopRightCharSpacing] = useState(100);
  const [topRightFontWeight, setTopRightFontWeight] = useState('700');
  const [topRightFontStyle, setTopRightFontStyle] = useState('normal');

  const [mainTitleText, setMainTitleText] = useState('ELECTRIC HEARTBEAT');
  const [mainTitleColor, setMainTitleColor] = useState('#000000');
  const [mainTitleFontFamily, setMainTitleFontFamily] = useState('Montserrat, sans-serif');
  const [mainTitleFontSize, setMainTitleFontSize] = useState(24);
  const [mainTitleCharSpacing, setMainTitleCharSpacing] = useState(150);
  const [mainTitleFontWeight, setMainTitleFontWeight] = useState('700');
  const [mainTitleFontStyle, setMainTitleFontStyle] = useState('normal');

  const [subTitleText, setSubTitleText] = useState('THE COAST');
  const [subTitleColor, setSubTitleColor] = useState('#333333');
  const [subTitleFontFamily, setSubTitleFontFamily] = useState('Montserrat, sans-serif');
  const [subTitleFontSize, setSubTitleFontSize] = useState(12);
  const [subTitleCharSpacing, setSubTitleCharSpacing] = useState(200);
  const [subTitleFontWeight, setSubTitleFontWeight] = useState('400');
  const [subTitleFontStyle, setSubTitleFontStyle] = useState('normal');

  const [dividerColor, setDividerColor] = useState('#999999');

  const [bottom1Text, setBottom1Text] = useState('OUR SONG');
  const [bottom1Color, setBottom1Color] = useState('#333333');
  const [bottom1FontFamily, setBottom1FontFamily] = useState('Montserrat, sans-serif');
  const [bottom1FontSize, setBottom1FontSize] = useState(9);
  const [bottom1CharSpacing, setBottom1CharSpacing] = useState(100);
  const [bottom1FontWeight, setBottom1FontWeight] = useState('600');
  const [bottom1FontStyle, setBottom1FontStyle] = useState('normal');

  const [bottom2Text, setBottom2Text] = useState('2026');
  const [bottom2Color, setBottom2Color] = useState('#333333');
  const [bottom2FontFamily, setBottom2FontFamily] = useState('Montserrat, sans-serif');
  const [bottom2FontSize, setBottom2FontSize] = useState(9);
  const [bottom2CharSpacing, setBottom2CharSpacing] = useState(100);
  const [bottom2FontWeight, setBottom2FontWeight] = useState('600');
  const [bottom2FontStyle, setBottom2FontStyle] = useState('normal');

  const [waveMode, setWaveMode] = useState<'random' | 'audio'>('random'); 
  const [waveFillType, setWaveFillType] = useState<'solid' | 'gradient'>('gradient');
  const [waveSolidColor, setWaveSolidColor] = useState('#008000');
  
  const [waveGradientStops, setWaveGradientStops] = useState<number>(3);
  const [waveGradientColors, setWaveGradientColors] = useState<string[]>(['#66ffcc', '#008000', '#003300', '#000000', '#000000']);
  const [waveGradientAngle, setWaveGradientAngle] = useState<number>(0);

  const [waveDensity, setWaveDensity] = useState(240); 
  const [waveThickness, setWaveThickness] = useState(1.5);
  const [waveHeightScale, setWaveHeightScale] = useState(50); 
  const [waveWidthScale, setWaveWidthScale] = useState(80); 

  const [bgColor, setBgColor] = useState('#fbfbfb');

  const [showQR, setShowQR] = useState(false);
  const [qrLink, setQrLink] = useState('https://musicposters.shop');
  const [qrSize, setQrSize] = useState(25);

  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [toast, setToast] = useState<string>('');

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2200);
  }, []);

  const toggleAccordion = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const applyDynamicLayout = useCallback((canvas: any, dims: {width: number, height: number}, qrEnabled: boolean, currentQrSize: number) => {
    if (!canvas) return;
    isRebuildingRef.current = true;
    const cw = dims.width;
    const ch = dims.height;
    const cy = ch / 2;
    const yOffset = qrEnabled ? -(currentQrSize + 15) : 0;

    if (canvas.textLeftRef) canvas.textLeftRef.set({ left: cw * 0.08, top: ch * 0.08 }).setCoords();
    if (canvas.textRightRef) canvas.textRightRef.set({ left: cw * 0.92, top: ch * 0.08 }).setCoords();
    if (canvas.textTitleRef) canvas.textTitleRef.set({ left: cw / 2, top: cy + 100 + yOffset }).setCoords();
    if (canvas.textSubRef) canvas.textSubRef.set({ left: cw / 2, top: cy + 130 + yOffset }).setCoords();
    if (canvas.dividerRef) canvas.dividerRef.set({ x1: cw * 0.35, y1: cy + 155 + yOffset, x2: cw * 0.65, y2: cy + 155 + yOffset }).setCoords();
    if (canvas.textBottom1Ref) canvas.textBottom1Ref.set({ left: cw / 2, top: cy + 175 + yOffset }).setCoords();
    if (canvas.textBottom2Ref) canvas.textBottom2Ref.set({ left: cw / 2, top: cy + 195 + yOffset }).setCoords();

    canvas.requestRenderAll();
    isRebuildingRef.current = false;
  }, []);

  const applyPreset = (presetId: string) => {
    setActivePreset(presetId);
    if (presetId === 'custom') return;

    const preset = PRESETS.find(p => p.id === presetId);
    if (!preset) return;

    setTopLeftText(preset.texts.tl);
    setTopRightText(preset.texts.tr);
    setMainTitleText(preset.texts.title);
    setSubTitleText(preset.texts.sub);
    setBottom1Text(preset.texts.b1);
    setBottom2Text(preset.texts.b2);

    setBgColor(preset.colors.bg);
    setMainTitleColor(preset.colors.title);
    setSubTitleColor(preset.colors.sub);
    setDividerColor(preset.colors.div);
    setBottom1Color(preset.colors.bottom);
    setBottom2Color(preset.colors.bottom);
    setTopLeftColor(preset.colors.top);
    setTopRightColor(preset.colors.top);

    setWaveFillType(preset.wave.type as 'solid' | 'gradient');
    setWaveSolidColor(preset.wave.solid);
    setWaveGradientStops(preset.wave.stops);
    setWaveGradientColors(preset.wave.grad);

    showToast('Template applied successfully');
  };

  useEffect(() => {
    if (!canvasElRef.current) return;
    
    const canvas = new fabric.Canvas(canvasElRef.current, {
      width: containerDims.width,
      height: containerDims.height,
      backgroundColor: bgColor,
      preserveObjectStacking: true,
      selection: !isLocked,
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

    const cy = containerDims.height / 2;
    const cw = containerDims.width;
    const yOffset = showQR ? -(qrSize + 15) : 0;

    const topLeft = new fabric.IText(topLeftText, {
      left: cw * 0.08,
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
      left: cw * 0.92,
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
      left: cw / 2,
      top: cy + 100 + yOffset,
      width: cw * 0.8,
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

    const subTitle = new fabric.Textbox(subTitleText, {
      left: cw / 2,
      top: cy + 130 + yOffset,
      width: cw * 0.8,
      originX: 'center',
      textAlign: 'center',
      fontSize: subTitleFontSize,
      fontFamily: subTitleFontFamily,
      fontWeight: subTitleFontWeight,
      fontStyle: subTitleFontStyle,
      fill: subTitleColor,
      charSpacing: subTitleCharSpacing,
      data: { edType: EDIT_TYPES.SUB_TITLE },
    });
    canvas.add(subTitle);

    const divider = new fabric.Line([cw * 0.35, cy + 155 + yOffset, cw * 0.65, cy + 155 + yOffset], {
      stroke: dividerColor,
      strokeWidth: 1,
      selectable: true,
      data: { edType: EDIT_TYPES.DIVIDER },
    });
    canvas.add(divider);

    const bottom1 = new fabric.Textbox(bottom1Text, {
      left: cw / 2,
      top: cy + 175 + yOffset,
      width: cw * 0.8,
      originX: 'center',
      textAlign: 'center',
      fontSize: bottom1FontSize,
      fontFamily: bottom1FontFamily,
      fontWeight: bottom1FontWeight,
      fontStyle: bottom1FontStyle,
      fill: bottom1Color,
      charSpacing: bottom1CharSpacing,
      data: { edType: EDIT_TYPES.BOTTOM_1 },
    });
    canvas.add(bottom1);

    const bottom2 = new fabric.Textbox(bottom2Text, {
      left: cw / 2,
      top: cy + 195 + yOffset,
      width: cw * 0.8,
      originX: 'center',
      textAlign: 'center',
      fontSize: bottom2FontSize,
      fontFamily: bottom2FontFamily,
      fontWeight: bottom2FontWeight,
      fontStyle: bottom2FontStyle,
      fill: bottom2Color,
      charSpacing: bottom2CharSpacing,
      data: { edType: EDIT_TYPES.BOTTOM_2 },
    });
    canvas.add(bottom2);

    (canvas as any).textLeftRef = topLeft;
    (canvas as any).textRightRef = topRight;
    (canvas as any).textTitleRef = mainTitle;
    (canvas as any).textSubRef = subTitle;
    (canvas as any).dividerRef = divider;
    (canvas as any).textBottom1Ref = bottom1;
    (canvas as any).textBottom2Ref = bottom2;

    buildSoundwavePath(canvas, containerDims);
    buildQRCode(canvas, containerDims);

    if (!isLocked) {
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
          case EDIT_TYPES.SUB_TITLE: setSubTitleText(v); break;
          case EDIT_TYPES.BOTTOM_1: setBottom1Text(v); break;
          case EDIT_TYPES.BOTTOM_2: setBottom2Text(v); break;
          default: break;
        }
      });
    }

    const fontWeightsStr = ':100,100i,300,300i,400,400i,500,500i,600,600i,700,700i,800,800i,900,900i';
    const link = document.createElement('link');
    link.href = `https://fonts.googleapis.com/css?family=${GOOGLE_FONTS.map(f => f.replace(/ /g, '+') + fontWeightsStr).join('|')}&display=swap`;
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    canvas.renderAll();

    return () => {
      canvas.dispose();
    };
  }, [isLocked]);

  useEffect(() => {
    applyDynamicLayout(fabricRef.current, containerDims, showQR, qrSize);
  }, [showQR, containerDims, applyDynamicLayout, qrSize]);

  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    canvas.setZoom(zoom);
    canvas.setWidth(containerDims.width * zoom);
    canvas.setHeight(containerDims.height * zoom);
    canvas.renderAll();
  }, [zoom, containerDims]);

  function onSelectionChange(e: any) {
    if (isRebuildingRef.current || isLocked) return;
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
      
      const simulatedUniqueId = Math.random().toString(36).substring(2, 9);
      setQrLink(`https://musicposters.shop/listen/${simulatedUniqueId}`);
      setShowQR(true);
      
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

  const getGradient = (width: number, height: number) => {
    const rad = (waveGradientAngle * Math.PI) / 180;
    
    const x1 = (width / 2) - Math.cos(rad) * (width / 2);
    const y1 = (height / 2) - Math.sin(rad) * (height / 2);
    const x2 = (width / 2) + Math.cos(rad) * (width / 2);
    const y2 = (height / 2) + Math.sin(rad) * (height / 2);

    const activeColors = waveGradientColors.slice(0, waveGradientStops);
    const colorStops = activeColors.map((color, i) => ({
      offset: i / (activeColors.length - 1),
      color: color
    }));

    return new fabric.Gradient({
      type: 'linear',
      coords: { x1, y1, x2, y2 },
      colorStops
    });
  };

  function buildSoundwavePath(canvas: fabric.Canvas, dims: { width: number; height: number }) {
    isRebuildingRef.current = true;
    
    const wasSelected = wavePathRef.current && canvas.getActiveObject() === wavePathRef.current;

    if (wavePathRef.current) {
      canvas.remove(wavePathRef.current);
    }

    let peaks: number[] = [];
    if (waveMode === 'audio' && rawAudioDataRef.current) {
      peaks = extractPeaksFromAudio(rawAudioDataRef.current, waveDensity);
    } else {
      peaks = generateAestheticPeaks(waveDensity);
    }

    const totalWidth = dims.width * (waveWidthScale / 100);
    const step = totalWidth / waveDensity;
    const startX = 0; 
    const maxHeight = dims.height * (waveHeightScale / 100);

    let pathString = '';
    
    for(let i=0; i<waveDensity; i++) {
        const x = startX + i * step;
        const h = peaks[i] * maxHeight;
        pathString += `M ${x} ${-h/2} L ${x} ${h/2} `;
    }

    const wavePath = new fabric.Path(pathString, {
        strokeWidth: waveThickness,
        fill: '',
        strokeLineCap: 'round',
        strokeLineJoin: 'round',
        originX: 'center',
        originY: 'center',
        left: dims.width / 2,
        top: dims.height * 0.40, 
        objectCaching: false,
        selectable: !isLocked,
        data: { edType: EDIT_TYPES.SOUNDWAVE },
    });

    if (waveFillType === 'solid') {
      wavePath.set({ stroke: waveSolidColor });
    } else {
      const bound = wavePath.getBoundingRect();
      wavePath.set({ stroke: getGradient(bound.width, bound.height) });
    }
    
    canvas.add(wavePath);
    wavePathRef.current = wavePath;

    if (wasSelected && !isLocked) {
      canvas.setActiveObject(wavePath);
    }
    
    canvas.requestRenderAll();
    isRebuildingRef.current = false;
  }

  function buildQRCode(canvas: fabric.Canvas, dims: { width: number; height: number }) {
    if (qrCodeRef.current) {
      canvas.remove(qrCodeRef.current);
      qrCodeRef.current = null;
    }

    if (!showQR || !qrLink.trim()) {
      canvas.requestRenderAll();
      return;
    }

    isRebuildingRef.current = true;
    const apiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrLink)}`;

    fabric.Image.fromURL(apiUrl, { crossOrigin: 'anonymous' }).then((img) => {
      img.set({
        left: dims.width / 2,
        top: (dims.height / 2) + 195,
        originX: 'center',
        originY: 'center',
        scaleX: qrSize / img.width!,
        scaleY: qrSize / img.height!,
        selectable: !isLocked,
        data: { edType: EDIT_TYPES.QR_CODE }
      });
      canvas.add(img);
      qrCodeRef.current = img;
      canvas.requestRenderAll();
      isRebuildingRef.current = false;
    }).catch(() => {
      isRebuildingRef.current = false;
    });
  }

  const rebuildSoundwave = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    buildSoundwavePath(canvas, containerDims);
  }, [containerDims, waveMode, waveDensity, waveThickness, waveWidthScale, waveHeightScale, waveFillType, waveSolidColor, waveGradientColors, waveGradientStops, waveGradientAngle, isLocked]);

  const rebuildQRCode = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    buildQRCode(canvas, containerDims);
  }, [containerDims, showQR, qrLink, qrSize, isLocked]);

  useEffect(() => {
    const handler = setTimeout(() => {
      rebuildQRCode();
    }, 400);
    return () => clearTimeout(handler);
  }, [rebuildQRCode]);

  const handleSizeOrOrientationChange = (newSize: string, newOrient: 'portrait' | 'landscape') => {
    if(isLocked) return;
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
    
    buildSoundwavePath(canvas, dims);
    buildQRCode(canvas, dims);
    applyDynamicLayout(canvas, dims, showQR, qrSize);
  };

  const updateTextContent = (ref: any, setter: (val: string) => void, value: string) => {
    setter(value);
    if(ref) {
      ref.set({ text: value });
      fabricRef.current?.requestRenderAll();
    }
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
    if (canvas && canvas.textSubRef) {
      isRebuildingRef.current = true;
      canvas.textSubRef.set({
        text: subTitleText,
        fill: subTitleColor,
        fontFamily: subTitleFontFamily,
        fontSize: subTitleFontSize,
        charSpacing: subTitleCharSpacing,
        fontWeight: subTitleFontWeight,
        fontStyle: subTitleFontStyle
      });
      canvas.requestRenderAll();
      isRebuildingRef.current = false;
    }
  }, [subTitleText, subTitleColor, subTitleFontFamily, subTitleFontSize, subTitleCharSpacing, subTitleFontWeight, subTitleFontStyle]);

  useEffect(() => {
    const canvas = fabricRef.current as any;
    if (canvas && canvas.dividerRef) {
      isRebuildingRef.current = true;
      canvas.dividerRef.set({ stroke: dividerColor });
      canvas.requestRenderAll();
      isRebuildingRef.current = false;
    }
  }, [dividerColor]);

  useEffect(() => {
    const canvas = fabricRef.current as any;
    if (canvas && canvas.textBottom1Ref) {
      isRebuildingRef.current = true;
      canvas.textBottom1Ref.set({
        text: bottom1Text,
        fill: bottom1Color,
        fontFamily: bottom1FontFamily,
        fontSize: bottom1FontSize,
        charSpacing: bottom1CharSpacing,
        fontWeight: bottom1FontWeight,
        fontStyle: bottom1FontStyle
      });
      canvas.requestRenderAll();
      isRebuildingRef.current = false;
    }
  }, [bottom1Text, bottom1Color, bottom1FontFamily, bottom1FontSize, bottom1CharSpacing, bottom1FontWeight, bottom1FontStyle]);

  useEffect(() => {
    const canvas = fabricRef.current as any;
    if (canvas && canvas.textBottom2Ref) {
      isRebuildingRef.current = true;
      canvas.textBottom2Ref.set({
        text: bottom2Text,
        fill: bottom2Color,
        fontFamily: bottom2FontFamily,
        fontSize: bottom2FontSize,
        charSpacing: bottom2CharSpacing,
        fontWeight: bottom2FontWeight,
        fontStyle: bottom2FontStyle
      });
      canvas.requestRenderAll();
      isRebuildingRef.current = false;
    }
  }, [bottom2Text, bottom2Color, bottom2FontFamily, bottom2FontSize, bottom2CharSpacing, bottom2FontWeight, bottom2FontStyle]);

  useEffect(() => {
    const handler = setTimeout(() => {
      rebuildSoundwave();
    }, 100);
    return () => clearTimeout(handler);
  }, [rebuildSoundwave]);

  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas || !bgRectRef.current) return;
    bgRectRef.current.set({ fill: bgColor });
    canvas.requestRenderAll();
  }, [bgColor]);

  const updateGradientColor = (index: number, val: string) => {
    const newColors = [...waveGradientColors];
    newColors[index] = val;
    setWaveGradientColors(newColors);
  };

  const handleAlign = (mode: string) => {
    if(isLocked) return;
    const canvas = fabricRef.current;
    if (!canvas) return;
    const activeObj = canvas.getActiveObject();
    if (!activeObj) {
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

      activeObj.set({ left: activeObj.left! + dx, top: activeObj.top! + dy });
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

        obj.set({ left: obj.left! + dx, top: obj.top! + dy });
        obj.setCoords();
      });

      const newSelection = new fabric.ActiveSelection(objects, { canvas });
      canvas.setActiveObject(newSelection);
      canvas.requestRenderAll();
    }
  };

  const edDistribute = (axis: string) => {
    if(isLocked) return;
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
        o.set({ left: o.left! + ((firstL + step * i) - obL) }); 
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
        o.set({ top: o.top! + ((firstT + step * i) - obT) }); 
        o.setCoords(); 
      });
    }
    
    const newSelection = new fabric.ActiveSelection(objs, { canvas });
    canvas.setActiveObject(newSelection);
    canvas.requestRenderAll();
  };

  const handleGroup = () => {
    if(isLocked) return;
    const canvas = fabricRef.current;
    if (!canvas) return;
    const activeObj = canvas.getActiveObject();
    if (!activeObj || activeObj.type !== 'activeSelection') {
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
  };

  const handleUngroup = () => {
    if(isLocked) return;
    const canvas = fabricRef.current;
    if (!canvas) return;
    const activeObj = canvas.getActiveObject();
    if (!activeObj || activeObj.type !== 'group') {
      return;
    }
    
    (activeObj as fabric.Group).toActiveSelection();
    canvas.requestRenderAll();
    setSelectedType('multi');
  };

  const getMultiplier = () => {
    const { w } = parseAndOrientSize(canvasSize, orientation);
    return (w * DPI) / containerDims.width;
  };

  const triggerDownloadAction = async (format: 'png' | 'pdf' | 'svg') => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    
    canvas.discardActiveObject();
    canvas.renderAll();
    
    const multiplier = getMultiplier();
    const { w, h } = parseAndOrientSize(canvasSize, orientation);

    if (format === 'png') {
      const dataUrl = canvas.toDataURL({ format: 'png', multiplier });
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `soundwave-poster.png`;
      a.click();
    } else if (format === 'pdf') {
      const dataUrl = canvas.toDataURL({ format: 'png', multiplier });
      const pdf = new jsPDF({ orientation: w > h ? 'landscape' : 'portrait', unit: 'in', format: [w, h] });
      pdf.addImage(dataUrl, 'PNG', 0, 0, w, h);
      pdf.save(`soundwave-poster.pdf`);
    } else if (format === 'svg') {
      const svg = canvas.toSVG();
      const blob = new Blob([svg], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `soundwave-poster.svg`;
      a.click();
      URL.revokeObjectURL(url);
    }

    setShowReviewModal(false);
    setIsLocked(true);
  };

  const handleDownloadMasterpieceClick = () => {
    const canvas = fabricRef.current;
    if (canvas) {
      canvas.discardActiveObject();
      canvas.requestRenderAll();
      try {
        const dataUrl = canvas.toDataURL({ format: 'png', multiplier: 2.0 });
        setPreviewImage(dataUrl);
      } catch (err) {
        setPreviewImage('');
      }
    }
    setShowReviewModal(true);
  };

  return (
    <div className={`soundwave-poster-page ${isLocked ? 'locked-mode' : ''}`}>
      <style>{`
        .soundwave-poster-page {
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

        .soundwave-poster-page.locked-mode #panel,
        .soundwave-poster-page.locked-mode #props-panel {
          display: none;
        }

        .soundwave-poster-page.locked-mode #canvas-area {
          padding-top: 100px;
        }

        .soundwave-poster-page #panel {
          width: 300px;
          min-width: 300px;
          background: var(--panel-bg);
          border-right: 1px solid var(--panel-border);
          overflow-y: auto;
          display: flex;
          flex-direction: column;
        }
        .soundwave-poster-page #panel::-webkit-scrollbar { width: 3px; }
        .soundwave-poster-page #panel::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }
        .soundwave-poster-page .panel-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 16px; border-bottom: 1px solid var(--panel-border); flex-shrink: 0;
        }
        .soundwave-poster-page .title-group { display: flex; align-items: center; gap: 8px; }
        .soundwave-poster-page .title-group h1 {
          font-size: 13px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; margin: 0;
        }
        .soundwave-poster-page .back-btn {
          background: none; border: 1px solid var(--panel-border); color: var(--spotify-subtext);
          font-size: 11px; padding: 6px 10px; border-radius: 6px; cursor: pointer; font-family: inherit;
          transition: all 0.15s;
        }
        .soundwave-poster-page .back-btn:hover { color: var(--spotify-text); border-color: #333; }

        .soundwave-poster-page .form-row { padding: 0 16px 12px; }
        .soundwave-poster-page .form-row label {
          display: block; font-size: 10px; color: var(--spotify-subtext); margin-bottom: 5px;
          text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600;
        }
        .soundwave-poster-page .form-row input[type=text],
        .soundwave-poster-page .form-row select,
        .soundwave-poster-page .form-row textarea {
          width: 100%; background: var(--input-bg); border: 1px solid var(--input-border);
          border-radius: 6px; color: var(--spotify-text); padding: 8px 10px; font-size: 12px;
          font-family: inherit; outline: none; transition: border-color 0.15s; box-sizing: border-box;
        }
        .soundwave-poster-page .form-row input[type=text]:focus,
        .soundwave-poster-page .form-row select:focus,
        .soundwave-poster-page .form-row textarea:focus { border-color: var(--accent); }
        .soundwave-poster-page .form-row select option { background: #1a1a1a; }

        .soundwave-poster-page .color-row { display: flex; gap: 8px; align-items: center; padding: 0 16px 12px; }
        .soundwave-poster-page .color-row input[type=color] {
          width: 34px; height: 30px; border: none; border-radius: 6px; padding: 2px;
          background: var(--input-bg); cursor: pointer; flex-shrink: 0;
        }
        .soundwave-poster-page .color-row input[type=text] {
          flex: 1; background: var(--input-bg); border: 1px solid var(--input-border);
          border-radius: 6px; color: var(--spotify-text); padding: 6px 8px; font-size: 11px; font-family: inherit;
        }

        .soundwave-poster-page .range-row { display: flex; align-items: center; gap: 8px; padding: 0 16px 12px; }
        .soundwave-poster-page .range-row input[type=range] { flex: 1; accent-color: var(--accent); cursor: pointer; }
        .soundwave-poster-page .range-val { font-size: 10px; color: var(--accent); font-weight: 600; min-width: 34px; text-align: right; }

        .soundwave-poster-page .upload-area {
          position: relative; border: 1px dashed var(--panel-border); border-radius: 8px;
          padding: 22px 12px; text-align: center; cursor: pointer; margin: 0 16px 4px;
          transition: border-color 0.15s;
        }
        .soundwave-poster-page .upload-area:hover { border-color: var(--accent); }
        .soundwave-poster-page .upload-area p { font-size: 11px; color: var(--spotify-subtext); margin: 0; }

        .soundwave-poster-page .btn {
          border: none; border-radius: 6px; padding: 9px 14px; font-size: 12px; font-weight: 600;
          cursor: pointer; font-family: inherit; transition: opacity 0.15s;
        }
        .soundwave-poster-page .btn:hover { opacity: 0.85; }
        .soundwave-poster-page .btn-primary { background: var(--accent); color: #000; }
        .soundwave-poster-page .btn-secondary {
          background: var(--input-bg); color: var(--spotify-text); border: 1px solid var(--input-border); flex: 1;
        }

        .soundwave-poster-page .canvas-header-actions {
          display: flex; gap: 8px; margin-bottom: 24px; z-index: 50; position: relative;
        }
        
        .soundwave-poster-page .btn-masterpiece {
          background: linear-gradient(to right, #4f46e5, #9333ea);
          color: white;
          padding: 12px 32px;
          font-size: 14px;
          border-radius: 30px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          box-shadow: 0 10px 25px rgba(79, 70, 229, 0.4);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .soundwave-poster-page .btn-masterpiece:hover {
          transform: translateY(-2px);
          box-shadow: 0 15px 30px rgba(79, 70, 229, 0.6);
        }

        .soundwave-poster-page #canvas-area {
          flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: flex-start;
          background: #0d0d0d; padding: 30px; overflow: auto; position: relative;
        }
        .soundwave-poster-page #canvas-area::before {
          content: ''; position: absolute; inset: 0;
          background: radial-gradient(ellipse at center, #1a1a1a 0%, #0d0d0d 70%); pointer-events: none;
        }
        .soundwave-poster-page #poster-wrapper {
          position: relative; z-index: 1; display: flex; flex-direction: column; align-items: center; gap: 20px;
          padding: 40px;
        }
        .soundwave-poster-page #poster-container {
          position: relative; overflow: hidden;
          box-shadow: 0 32px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.05);
          border-radius: 4px;
          transform-origin: center center;
          transition: transform 0.15s ease-out, width 0.4s cubic-bezier(0.4,0,0.2,1), height 0.4s cubic-bezier(0.4,0,0.2,1);
        }

        .soundwave-poster-page .accordion-btn {
          width: 100%; background: none; border: none; color: var(--spotify-subtext);
          font-size: 10px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase;
          text-align: left; padding: 16px; cursor: pointer; display: flex; justify-content: space-between;
          align-items: center; border-bottom: 1px solid var(--panel-border); font-family: 'DM Sans', sans-serif;
          transition: color 0.15s;
        }
        .soundwave-poster-page .accordion-btn:hover { color: var(--spotify-text); }
        .soundwave-poster-page .accordion-btn .arrow { font-size: 9px; transition: transform 0.2s; }
        .soundwave-poster-page .accordion-btn.open .arrow { transform: rotate(180deg); }
        .soundwave-poster-page .accordion-content { display: none; padding: 14px 0; border-bottom: 1px solid var(--panel-border); }
        .soundwave-poster-page .accordion-content.open { display: block; }

        .soundwave-poster-page .sw-toast {
          position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%) translateY(20px);
          background: var(--accent); color: #000; padding: 10px 20px; border-radius: 24px;
          font-size: 13px; font-weight: 600; opacity: 0; transition: all 0.3s; z-index: 9999; pointer-events: none;
        }
        .soundwave-poster-page .sw-toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }

        .soundwave-poster-page #props-panel {
          width: 260px; min-width: 260px; background: var(--panel-bg); border-left: 1px solid var(--panel-border);
          overflow-y: auto; flex-shrink: 0; display: flex; flex-direction: column;
        }
        .soundwave-poster-page #props-panel::-webkit-scrollbar { width: 3px; }
        .soundwave-poster-page #props-panel::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }
        .soundwave-poster-page #props-header {
          padding: 14px 16px 10px; border-bottom: 1px solid var(--panel-border); font-size: 10px;
          font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--spotify-subtext);
          display: flex; align-items: center; justify-content: space-between; flex-shrink: 0;
        }
        .soundwave-poster-page #props-selected-name { color: var(--accent); font-size: 10px; font-weight: 600; letter-spacing: 0; text-transform: none; }
        .soundwave-poster-page #props-body { flex: 1; overflow-y: auto; padding: 12px 14px; }
        .soundwave-poster-page #props-body::-webkit-scrollbar { width: 3px; }
        .soundwave-poster-page #props-body::-webkit-scrollbar-thumb { background: #333; }
        .soundwave-poster-page #props-empty-state { padding: 32px 16px; text-align: center; color: #444; font-size: 11px; line-height: 1.7; }
        .soundwave-poster-page #props-empty-state svg { margin-bottom: 12px; }

        .soundwave-poster-page .pf-section { margin-bottom: 4px; }
        .soundwave-poster-page .pf-section-title { font-size: 9px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #555; margin: 12px 0 6px; }
        .soundwave-poster-page .pf-row { margin-bottom: 7px; }
        .soundwave-poster-page .pf-row label { display: block; font-size: 10px; color: var(--spotify-subtext); margin-bottom: 3px; }
        .soundwave-poster-page .pf-row input[type=text],
        .soundwave-poster-page .pf-row input[type=number],
        .soundwave-poster-page .pf-row select {
          width: 100%; background: var(--input-bg); border: 1px solid var(--input-border); border-radius: 5px;
          color: var(--spotify-text); padding: 5px 8px; font-size: 11px; font-family: 'DM Sans', sans-serif; outline: none;
          transition: border-color 0.15s;
        }
        .soundwave-poster-page .pf-row input:focus, .soundwave-poster-page .pf-row select:focus { border-color: var(--accent); }
        .soundwave-poster-page .pf-row select option { background: #1a1a1a; }
        .soundwave-poster-page .pf-row input[type=range] { width: 100%; accent-color: var(--accent); cursor: pointer; }
        .soundwave-poster-page .pf-row input[type=color] { width: 30px; height: 26px; border: none; border-radius: 4px; cursor: pointer; padding: 2px; background: var(--input-bg); }
        .soundwave-poster-page .pf-color-row { display: flex; gap: 6px; align-items: center; }
        .soundwave-poster-page .pf-color-row input[type=text] { flex: 1; }
        .soundwave-poster-page .pf-range-row { display: flex; align-items: center; gap: 6px; }
        .soundwave-poster-page .pf-range-val { font-size: 10px; color: var(--accent); font-weight: 600; min-width: 32px; text-align: right; }

        .soundwave-poster-page .global-tools-panel {
          padding: 14px 16px;
          border-bottom: 1px solid var(--panel-border);
          background: #0f0f0f;
          flex-shrink: 0;
        }
        .soundwave-poster-page .gt-section-title {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--spotify-subtext);
          margin-bottom: 8px;
        }
        .soundwave-poster-page .gt-align-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 4px;
          margin-bottom: 8px;
        }
        .soundwave-poster-page .gt-align-btn {
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
        .soundwave-poster-page .gt-align-btn:hover {
          background: #1a1a1a;
          border-color: var(--accent);
          color: var(--spotify-text);
        }
        .soundwave-poster-page .gt-align-btn svg {
          width: 14px;
          height: 14px;
        }
        .soundwave-poster-page .gt-group-row {
          display: flex;
          gap: 6px;
          margin-bottom: 12px;
        }
        .soundwave-poster-page .gt-group-btn {
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
        .soundwave-poster-page .gt-group-btn:hover {
          background: var(--accent);
          color: #000;
          border-color: var(--accent);
        }
        .soundwave-poster-page .gt-zoom-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .soundwave-poster-page .gt-zoom-row input[type=range] {
          flex: 1;
          accent-color: var(--accent);
          cursor: pointer;
        }
        .soundwave-poster-page .gt-zoom-val {
          font-size: 11px;
          font-weight: 600;
          color: var(--accent);
          min-width: 32px;
          text-align: right;
        }
        .soundwave-poster-page .gt-zoom-reset {
          background: #222;
          border: 1px solid #333;
          color: #fff;
          font-size: 9px;
          padding: 2px 6px;
          border-radius: 4px;
          cursor: pointer;
        }
        .soundwave-poster-page .gt-zoom-reset:hover {
          background: #333;
        }
        .orient-group {
          display: flex; gap: 8px; margin-top: 8px;
        }
        .pf-checkbox-row {
          display: flex; align-items: center; gap: 8px; margin-bottom: 12px; cursor: pointer;
        }
        .pf-checkbox-row input[type=checkbox] {
          width: 16px; height: 16px; cursor: pointer; accent-color: var(--accent);
        }

        .review-modal-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.95); backdrop-filter: blur(15px);
          display: flex; align-items: flex-start; justify-content: center; z-index: 9999; overflow-y: auto; padding: 40px 20px;
        }
        .review-modal-content {
          max-width: 900px; width: 100%; display: flex; flex-direction: column; align-items: center; gap: 30px;
        }
        
        .review-warning-box {
          background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2);
          padding: 16px 24px; border-radius: 12px; display: flex; gap: 16px; align-items: center; width: 100%;
        }
        
        .review-preview-img {
          width: auto; max-height: 75vh; object-fit: contain; box-shadow: 0 20px 60px rgba(0,0,0,0.8);
          border: 1px solid rgba(255,255,255,0.1); border-radius: 4px;
        }

        .review-action-area {
          width: 100%; display: flex; flex-direction: column; align-items: center; gap: 24px;
        }
        
        .review-checkbox-wrapper {
          display: flex; align-items: center; gap: 12px; cursor: pointer;
          background: #1a1a1a; padding: 16px 24px; border-radius: 12px; border: 1px solid #333; transition: border-color 0.2s;
          width: 100%; justify-content: center;
        }
        .review-checkbox-wrapper:hover { border-color: #555; }
        .review-checkbox-wrapper input[type=checkbox] {
          width: 24px; height: 24px; accent-color: var(--accent); cursor: pointer;
        }

        .review-btn-grid {
          display: flex; gap: 12px; width: 100%; justify-content: center; flex-wrap: wrap;
        }
        .review-btn-grid button {
          padding: 16px 32px; border-radius: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; font-size: 14px; min-width: 240px;
        }

        .readonly-banner {
          background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3);
          color: #fca5a5; padding: 16px 24px; border-radius: 16px; display: flex; align-items: center; justify-content: space-between;
          max-width: 800px; margin: 0 auto 30px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); width: 100%;
        }
      `}</style>

      {showReviewModal && (
        <div className="review-modal-overlay">
          <div className="review-modal-content">
            
            <div className="review-warning-box">
              <AlertTriangle className="w-8 h-8 text-red-400 shrink-0" />
              <div>
                <h3 className="text-red-400 font-black uppercase tracking-wider mb-1">Final Review</h3>
                <p className="text-red-200/80 text-sm leading-relaxed">
                  Please review your design carefully. Check all spellings, dates, and color choices.
                </p>
              </div>
            </div>

            {previewImage && <img src={previewImage} alt="Preview" className="review-preview-img" />}

            <div className="review-action-area">
              <label className="review-checkbox-wrapper">
                <input type="checkbox" checked={userConfirmed} onChange={(e) => setUserConfirmed(e.target.checked)} />
                <span className="text-sm text-zinc-300 font-medium">
                  <strong className="text-white block mb-1">I approve my design.</strong> I confirm that all details are exactly how I want them to be printed.
                </span>
              </label>

              <div className="review-btn-grid">
                <button 
                  className={`btn ${userConfirmed ? 'btn-primary' : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border-none'}`}
                  disabled={!userConfirmed}
                  onClick={() => triggerDownloadAction('pdf')}
                >
                  Download PDF (Print)
                </button>
                <button 
                  className={`btn ${userConfirmed ? 'btn-secondary' : 'bg-zinc-900 text-zinc-600 border-zinc-800 cursor-not-allowed'}`}
                  disabled={!userConfirmed}
                  onClick={() => triggerDownloadAction('png')}
                >
                  Download PNG
                </button>
                <button 
                  className={`btn ${userConfirmed ? 'btn-secondary' : 'bg-zinc-900 text-zinc-600 border-zinc-800 cursor-not-allowed'}`}
                  disabled={!userConfirmed}
                  onClick={() => triggerDownloadAction('svg')}
                >
                  Download SVG
                </button>
              </div>

              <button 
                className="mt-4 text-zinc-500 hover:text-white text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2"
                onClick={() => setShowReviewModal(false)}
              >
                <X className="w-4 h-4" /> Cancel & Go Back to Editing
              </button>
            </div>

          </div>
        </div>
      )}

      <div id="panel" className={isLocked ? 'hidden' : ''}>
        <div className="panel-header">
          <div className="title-group">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M2 12h4l3-9 5 18 3-9h5" />
            </svg>
            <h1>Soundwave Poster</h1>
          </div>
          <button className="back-btn" onClick={() => navigate('/trend-posters')}>&#10229; Back</button>
        </div>

        <button className={`accordion-btn${openSections.presets ? ' open' : ''}`} onClick={() => toggleAccordion('presets')}>
          &#127912; Templates & Presets<span className="arrow">&#9660;</span>
        </button>
        <div className={`accordion-content${openSections.presets ? ' open' : ''}`}>
          <div className="form-row">
            <label>Select Theme</label>
            <select value={activePreset} onChange={(e) => applyPreset(e.target.value)}>
              <option value="custom">Custom Design...</option>
              <optgroup label="Family & Baby">
                <option value="first-heartbeat">First Heartbeat</option>
                <option value="first-cry">First Cry</option>
                <option value="first-word">First Word</option>
                <option value="first-laugh">First Laugh</option>
              </optgroup>
              <optgroup label="Love & Wedding">
                <option value="proposal">The Proposal</option>
                <option value="wedding-dance">First Dance</option>
                <option value="i-love-you">I Love You Message</option>
              </optgroup>
              <optgroup label="Memories & Tributes">
                <option value="memorial">In Loving Memory</option>
                <option value="pet-memorial">Pet Memorial</option>
              </optgroup>
              <optgroup label="Music & Pop Culture">
                <option value="song-chorus">Iconic Song Chorus</option>
                <option value="movie-quote">Movie Quote</option>
              </optgroup>
              <optgroup label="Milestones & Other">
                <option value="graduation">Graduation Speech</option>
                <option value="inside-joke">Inside Joke / Laughter</option>
                <option value="time-capsule">Time Capsule</option>
                <option value="space-voyager">Space Voyager</option>
              </optgroup>
            </select>
          </div>
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

        <button className={`accordion-btn${openSections.background ? ' open' : ''}`} onClick={() => toggleAccordion('background')}>
          &#128444;&#65039; Background<span className="arrow">&#9660;</span>
        </button>
        <div className={`accordion-content${openSections.background ? ' open' : ''}`}>
          <div className="form-row">
            <label>Background Color</label>
            <div className="color-row">
              <input type="color" value={bgColor} onChange={(e) => updateBgColor(e.target.value)} />
              <input type="text" value={bgColor} onChange={(e) => updateBgColor(e.target.value)} />
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
            <label>Fill Type</label>
            <select value={waveFillType} onChange={(e) => setWaveFillType(e.target.value as 'solid' | 'gradient')}>
              <option value="solid">Solid Color</option>
              <option value="gradient">Gradient</option>
            </select>
          </div>

          {waveFillType === 'solid' && (
             <div className="form-row">
             <label>Solid Color</label>
             <div className="color-row">
               <input type="color" value={waveSolidColor} onChange={(e) => setWaveSolidColor(e.target.value)} />
               <input type="text" value={waveSolidColor} onChange={(e) => setWaveSolidColor(e.target.value)} />
             </div>
           </div>
          )}

          {waveFillType === 'gradient' && (
            <>
              <div className="form-row">
                <label>Number of Colors</label>
                <div className="pf-range-row">
                  <input type="range" min="2" max="5" value={waveGradientStops} onChange={(e) => setWaveGradientStops(Number(e.target.value))} />
                  <span className="pf-range-val">{waveGradientStops}</span>
                </div>
              </div>
              <div className="form-row">
                <label>Gradient Angle</label>
                <div className="pf-range-row">
                  <input type="range" min="0" max="360" value={waveGradientAngle} onChange={(e) => setWaveGradientAngle(Number(e.target.value))} />
                  <span className="pf-range-val">{waveGradientAngle}°</span>
                </div>
              </div>
              {[...Array(waveGradientStops)].map((_, i) => (
                <div className="form-row" key={`grad-stop-${i}`}>
                  <label>Color {i + 1}</label>
                  <div className="color-row">
                    <input type="color" value={waveGradientColors[i]} onChange={(e) => updateGradientColor(i, e.target.value)} />
                    <input type="text" value={waveGradientColors[i]} onChange={(e) => updateGradientColor(i, e.target.value)} />
                  </div>
                </div>
              ))}
            </>
          )}

          <div className="form-row">
            <label>Line Density</label>
            <div className="pf-range-row">
              <input type="range" min="50" max="800" step="10" value={waveDensity} onChange={(e) => setWaveDensity(Number(e.target.value))} />
              <span className="pf-range-val">{waveDensity}</span>
            </div>
          </div>
          
          <div className="form-row">
            <label>Line Thickness</label>
            <div className="pf-range-row">
              <input type="range" min="0.5" max="10" step="0.5" value={waveThickness} onChange={(e) => setWaveThickness(Number(e.target.value))} />
              <span className="pf-range-val">{waveThickness}px</span>
            </div>
          </div>

          <div className="form-row">
            <label>Wave Height Scale (%)</label>
            <div className="pf-range-row">
              <input type="range" min="10" max="250" value={waveHeightScale} onChange={(e) => setWaveHeightScale(Number(e.target.value))} />
              <span className="pf-range-val">{waveHeightScale}%</span>
            </div>
          </div>

          <div className="form-row">
            <label>Wave Width Scale (%)</label>
            <div className="pf-range-row">
              <input type="range" min="10" max="100" value={waveWidthScale} onChange={(e) => setWaveWidthScale(Number(e.target.value))} />
              <span className="pf-range-val">{waveWidthScale}%</span>
            </div>
          </div>
        </div>

        <button className={`accordion-btn${openSections.qrcode ? ' open' : ''}`} onClick={() => toggleAccordion('qrcode')}>
          &#128241; QR Code Settings<span className="arrow">&#9660;</span>
        </button>
        <div className={`accordion-content${openSections.qrcode ? ' open' : ''}`}>
          <label className="pf-checkbox-row" style={{ padding: '0 16px' }}>
            <input type="checkbox" checked={showQR} onChange={(e) => setShowQR(e.target.checked)} />
            <span style={{ fontSize: '12px', fontWeight: 'bold' }}>Show QR Code</span>
          </label>

          {showQR && (
            <>
              <div className="form-row">
                <label>QR Link / Audio URL</label>
                <input type="text" value={qrLink} placeholder="https://..." onChange={(e) => setQrLink(e.target.value)} />
              </div>
              <div className="form-row">
                <label>QR Size</label>
                <div className="pf-range-row">
                  <input type="range" min="15" max="100" value={qrSize} onChange={(e) => setQrSize(Number(e.target.value))} />
                  <span className="pf-range-val">{qrSize}px</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div id="canvas-area" ref={containerRef} className={isLocked ? 'locked-mode' : ''}>
        
        {isLocked && (
          <div className="readonly-banner">
            <div>
              <div className="flex items-center gap-2 text-red-200 font-bold mb-1">
                <Lock className="w-4 h-4" /> Design Locked (Read-Only Mode)
              </div>
              <p className="text-xs text-red-300/80">Your design has been finalized. If you made a mistake, please contact support.</p>
            </div>
            <button className="flex items-center gap-2 bg-red-950 border border-red-900 text-red-200 px-4 py-2 rounded-xl text-xs font-bold hover:bg-red-900 transition-colors cursor-pointer">
              <MessageCircle className="w-4 h-4" /> Open Support Ticket
            </button>
          </div>
        )}

        {!isLocked && (
          <div className="canvas-header-actions">
            <button className="btn btn-masterpiece" onClick={handleDownloadMasterpieceClick}>
              Download Masterpiece
            </button>
          </div>
        )}

        <div id="poster-wrapper">
          <div id="poster-container" style={{ 
            width: containerDims.width * zoom, 
            height: containerDims.height * zoom
          }}>
            <canvas ref={canvasElRef} />
          </div>
        </div>
      </div>

      <div id="props-panel" className={isLocked ? 'hidden' : ''}>
        <div id="props-header">
          Properties
          <span id="props-selected-name">
            {selectedType === EDIT_TYPES.TOP_LEFT && 'Top Left Text'}
            {selectedType === EDIT_TYPES.TOP_RIGHT && 'Top Right Text'}
            {selectedType === EDIT_TYPES.MAIN_TITLE && 'Main Title'}
            {selectedType === EDIT_TYPES.SUB_TITLE && 'Subtitle'}
            {selectedType === EDIT_TYPES.DIVIDER && 'Divider Line'}
            {selectedType === EDIT_TYPES.BOTTOM_1 && 'Bottom Text 1'}
            {selectedType === EDIT_TYPES.BOTTOM_2 && 'Bottom Text 2'}
            {selectedType === EDIT_TYPES.SOUNDWAVE && 'Soundwave'}
            {selectedType === EDIT_TYPES.QR_CODE && 'QR Code'}
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
                    <input type="range" min="12" max="150" value={mainTitleFontSize} onChange={(e) => setMainTitleFontSize(Number(e.target.value))} />
                    <span className="pf-range-val">{mainTitleFontSize}px</span>
                  </div>
                </div>
                <div className="pf-row">
                  <label>Letter Spacing</label>
                  <div className="pf-range-row">
                    <input type="range" min="0" max="600" step="10" value={mainTitleCharSpacing} onChange={(e) => setMainTitleCharSpacing(Number(e.target.value))} />
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

          {selectedType === EDIT_TYPES.SUB_TITLE && (
            <div id="props-fields">
              <div className="pf-section">
                <div className="pf-section-title">Subtitle</div>
                <div className="pf-row">
                  <label>Text</label>
                  <input type="text" value={subTitleText}
                    onChange={(e) => setSubTitleText(e.target.value)} />
                </div>
                <div className="pf-row">
                  <label>Font Family</label>
                  <select value={subTitleFontFamily} onChange={(e) => setSubTitleFontFamily(e.target.value)}>
                    <option value="DM Sans, sans-serif">DM Sans</option>
                    {GOOGLE_FONTS.map(f => <option key={f} value={`${f}, sans-serif`}>{f}</option>)}
                  </select>
                </div>
                <div className="pf-row">
                  <label>Font Style</label>
                  <FontStyleSelector weight={subTitleFontWeight} style={subTitleFontStyle} onChange={(w, s) => { setSubTitleFontWeight(w); setSubTitleFontStyle(s); }} />
                </div>
                <div className="pf-row">
                  <label>Font Size</label>
                  <div className="pf-range-row">
                    <input type="range" min="8" max="72" value={subTitleFontSize} onChange={(e) => setSubTitleFontSize(Number(e.target.value))} />
                    <span className="pf-range-val">{subTitleFontSize}px</span>
                  </div>
                </div>
                <div className="pf-row">
                  <label>Letter Spacing</label>
                  <div className="pf-range-row">
                    <input type="range" min="0" max="600" step="10" value={subTitleCharSpacing} onChange={(e) => setSubTitleCharSpacing(Number(e.target.value))} />
                    <span className="pf-range-val">{subTitleCharSpacing}</span>
                  </div>
                </div>
                <div className="pf-row">
                  <label>Color</label>
                  <div className="pf-color-row">
                    <input type="color" value={subTitleColor}
                      onChange={(e) => setSubTitleColor(e.target.value)} />
                    <input type="text" value={subTitleColor}
                      onChange={(e) => setSubTitleColor(e.target.value)} />
                  </div>
                </div>
              </div>
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
                    <input type="range" min="8" max="72" value={topRightFontSize} onChange={(e) => setRightFontSize(Number(e.target.value))} />
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

          {selectedType === EDIT_TYPES.DIVIDER && (
            <div id="props-fields">
              <div className="pf-section">
                <div className="pf-section-title">Divider Line</div>
                <div className="pf-row">
                  <label>Color</label>
                  <div className="pf-color-row">
                    <input type="color" value={dividerColor}
                      onChange={(e) => setDividerColor(e.target.value)} />
                    <input type="text" value={dividerColor}
                      onChange={(e) => setDividerColor(e.target.value)} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedType === EDIT_TYPES.BOTTOM_1 && (
            <div id="props-fields">
              <div className="pf-section">
                <div className="pf-section-title">Bottom Text 1</div>
                <div className="pf-row">
                  <label>Text</label>
                  <input type="text" value={bottom1Text}
                    onChange={(e) => setBottom1Text(e.target.value)} />
                </div>
                <div className="pf-row">
                  <label>Font Family</label>
                  <select value={bottom1FontFamily} onChange={(e) => setBottom1FontFamily(e.target.value)}>
                    <option value="DM Sans, sans-serif">DM Sans</option>
                    {GOOGLE_FONTS.map(f => <option key={f} value={`${f}, sans-serif`}>{f}</option>)}
                  </select>
                </div>
                <div className="pf-row">
                  <label>Font Style</label>
                  <FontStyleSelector weight={bottom1FontWeight} style={bottom1FontStyle} onChange={(w, s) => { setBottom1FontWeight(w); setBottom1FontStyle(s); }} />
                </div>
                <div className="pf-row">
                  <label>Font Size</label>
                  <div className="pf-range-row">
                    <input type="range" min="6" max="72" value={bottom1FontSize} onChange={(e) => setBottom1FontSize(Number(e.target.value))} />
                    <span className="pf-range-val">{bottom1FontSize}px</span>
                  </div>
                </div>
                <div className="pf-row">
                  <label>Letter Spacing</label>
                  <div className="pf-range-row">
                    <input type="range" min="0" max="400" step="10" value={bottom1CharSpacing} onChange={(e) => setBottom1CharSpacing(Number(e.target.value))} />
                    <span className="pf-range-val">{bottom1CharSpacing}</span>
                  </div>
                </div>
                <div className="pf-row">
                  <label>Color</label>
                  <div className="pf-color-row">
                    <input type="color" value={bottom1Color}
                      onChange={(e) => setBottom1Color(e.target.value)} />
                    <input type="text" value={bottom1Color}
                      onChange={(e) => setBottom1Color(e.target.value)} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedType === EDIT_TYPES.BOTTOM_2 && (
            <div id="props-fields">
              <div className="pf-section">
                <div className="pf-section-title">Bottom Text 2</div>
                <div className="pf-row">
                  <label>Text</label>
                  <input type="text" value={bottom2Text}
                    onChange={(e) => setBottom2Text(e.target.value)} />
                </div>
                <div className="pf-row">
                  <label>Font Family</label>
                  <select value={bottom2FontFamily} onChange={(e) => setBottom2FontFamily(e.target.value)}>
                    <option value="DM Sans, sans-serif">DM Sans</option>
                    {GOOGLE_FONTS.map(f => <option key={f} value={`${f}, sans-serif`}>{f}</option>)}
                  </select>
                </div>
                <div className="pf-row">
                  <label>Font Style</label>
                  <FontStyleSelector weight={bottom2FontWeight} style={bottom2FontStyle} onChange={(w, s) => { setBottom2FontWeight(w); setBottom2FontStyle(s); }} />
                </div>
                <div className="pf-row">
                  <label>Font Size</label>
                  <div className="pf-range-row">
                    <input type="range" min="6" max="72" value={bottom2FontSize} onChange={(e) => setBottom2FontSize(Number(e.target.value))} />
                    <span className="pf-range-val">{bottom2FontSize}px</span>
                  </div>
                </div>
                <div className="pf-row">
                  <label>Letter Spacing</label>
                  <div className="pf-range-row">
                    <input type="range" min="0" max="400" step="10" value={bottom2CharSpacing} onChange={(e) => setBottom2CharSpacing(Number(e.target.value))} />
                    <span className="pf-range-val">{bottom2CharSpacing}</span>
                  </div>
                </div>
                <div className="pf-row">
                  <label>Color</label>
                  <div className="pf-color-row">
                    <input type="color" value={bottom2Color}
                      onChange={(e) => setBottom2Color(e.target.value)} />
                    <input type="text" value={bottom2Color}
                      onChange={(e) => setBottom2Color(e.target.value)} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedType === 'group' && (
            <div id="props-fields">
              <div className="pf-section">
                <div className="pf-section-title">Group Properties</div>
              </div>
            </div>
          )}

          {selectedType === 'multi' && (
            <div id="props-fields">
              <div className="pf-section">
                <div className="pf-section-title">Multiple Selection</div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className={`sw-toast ${toast ? 'show' : ''}`}>&#10003; {toast}</div>
    </div>
  );
}
