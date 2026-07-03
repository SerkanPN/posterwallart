import React, { useEffect, useRef, useState } from 'react';
import { useStore } from '../store/useStore';

const GOOGLE_FONTS =[
  "Inter", "Montserrat", "Roboto", "Open Sans", "Oswald", "Lato", "Poppins", 
  "Playfair Display", "Raleway", "Ubuntu", "Merriweather", "Nunito", "Cinzel", 
  "Dancing Script", "Pacifico", "Caveat", "Bebas Neue", "Anton", "Josefin Sans", 
  "Lobster", "Righteous", "Permanent Marker", "Abril Fatface", "Vampiro One", 
  "Alfa Slab One", "Syncopate", "Bangers", "Creepster", "Sacramento", "Satisfy",
  "Amatic SC", "Kalam", "Courgette", "Great Vibes", "Teko", "Russo One",
  "Prata", "Vollkorn", "Lora", "Crimson Text", "Zilla Slab", "Bungee", 
  "Fredoka One", "Carter One", "Patua One", "Chewy", "Shrikhand"
];

export default function AlbumPosterBuilder() {
  const addToCart = useStore((state: any) => state.addToCart);
  const isInitialized = useRef(false);
  
  const [isFontDropdownOpen, setIsFontDropdownOpen] = useState(false);
  const [activeFont, setActiveFont] = useState("Inter");

  const [selectedLayouts, setSelectedLayouts] = useState<string[]>([]);
  const [hasAlbumData, setHasAlbumData] = useState(false);

  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    const loadScript = (src: string) => {
      return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) return resolve(true);
        const script = document.createElement('script');
        script.src = src;
        script.onload = () => resolve(true);
        script.onerror = reject;
        document.head.appendChild(script);
      });
    };

    const initScripts = async () => {
      if (!document.getElementById('font-awesome-cdn')) {
          const faLink = document.createElement('link');
          faLink.id = 'font-awesome-cdn';
          faLink.rel = 'stylesheet';
          faLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
          document.head.appendChild(faLink);
      }

      const fontUrl = `https://fonts.googleapis.com/css?family=${GOOGLE_FONTS.map(f => f.replace(/ /g, '+')).join('|')}&display=swap`;
      if (!document.getElementById('google-fonts-custom')) {
          const link = document.createElement('link');
          link.id = 'google-fonts-custom';
          link.rel = 'stylesheet';
          link.href = fontUrl;
          document.head.appendChild(link);
      }

      if (!document.getElementById('cropper-css')) {
          const cLink = document.createElement('link');
          cLink.id = 'cropper-css';
          cLink.rel = 'stylesheet';
          cLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.13/cropper.min.css';
          document.head.appendChild(cLink);
      }

      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.13/cropper.min.js');
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/fabric.js/5.3.1/fabric.min.js');
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/node-vibrant/3.1.6/vibrant.min.js');
      
      if (!document.getElementById('pro-poster-styles')) {
        const style = document.createElement('style');
        style.id = 'pro-poster-styles';
        style.innerHTML = `
          :root { 
              --bg-main: #09090b; --bg-sidebar: #18181b; --bg-input: #27272a;
              --accent: #6366f1; --accent-hover: #4f46e5; --text-main: #fafafa;
              --text-muted: #a1a1aa; --border-color: #27272a; --card-bg: #18181b;
              --danger: #ef4444; --spotify: #1db954;
          }
          .sidebar-pro-container::-webkit-scrollbar { width: 6px; height: 6px; }
          .sidebar-pro-container::-webkit-scrollbar-track { background: var(--bg-main); }
          .sidebar-pro-container::-webkit-scrollbar-thumb { background: #3a3a52; border-radius: 4px; }
          .sidebar-pro-container::-webkit-scrollbar-thumb:hover { background: #505070; }
          .sidebar-pro-container *, .sidebar-pro-container *::before, .sidebar-pro-container *::after { box-sizing: border-box; }
          
          .sidebar-pro-left { width: 340px; background: var(--bg-sidebar); padding: 30px 25px 80px 25px; border-right: 1px solid var(--border-color); display: flex; flex-direction: column; gap: 10px; overflow-y: auto; z-index: 10; flex-shrink: 0; }
          .sidebar-pro-right-wrapper { width: 340px; background: var(--bg-sidebar); border-left: 1px solid var(--border-color); display: flex; flex-direction: column; z-index: 10; flex-shrink: 0; height: 100%; position: relative; }
          .sidebar-pro-right-scroll { flex: 1; padding: 30px 25px 80px 25px; display: flex; flex-direction: column; gap: 10px; overflow-y: auto; }
          
          .sidebar-logo { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
          .sidebar-logo .icon { background: #6366f1; color: #fff; width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 1.2rem; font-family: 'Inter', sans-serif;}
          .sidebar-logo .text { font-family: 'Inter', sans-serif; font-weight: 900; font-size: 1.4rem; letter-spacing: -0.5px; color: #fff;}
          
          .accordion-btn { width: 100%; background: none; border: none; color: var(--text-muted); font-size: 0.75rem; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; text-align: left; padding: 15px 0; cursor: pointer; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); font-family: 'Inter', sans-serif; transition: color 0.15s; margin-top: 5px; }
          .accordion-btn:hover { color: #fff; }
          .accordion-btn .arrow { font-size: 0.6rem; transition: transform 0.2s; }
          .accordion-btn.open .arrow { transform: rotate(180deg); }
          .accordion-content { display: none; padding: 15px 0; }
          .accordion-content.open { display: flex; flex-direction: column; gap: 10px; }
          
          .sidebar-control { background: var(--bg-input); border: 1px solid var(--border-color); color: var(--text-main); padding: 12px 14px; border-radius: 10px; outline: none; width: 100%; font-size: 0.85rem; cursor: pointer; transition: 0.2s; font-family: 'Inter', sans-serif;}
          .sidebar-control:hover, .sidebar-control:focus { border-color: var(--accent); }
          .sidebar-control::placeholder { color: #5a5a75; }
          .poster-pro-container input[type="color"].sidebar-control { padding: 2px 5px; height: 38px; cursor: pointer; }
          .poster-pro-container input[type=range] { -webkit-appearance: none; width: 100%; background: transparent; }
          .poster-pro-container input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; height: 14px; width: 14px; border-radius: 50%; background: var(--text-main); cursor: pointer; margin-top: -5px; box-shadow: 0 0 10px rgba(0,0,0,0.5); }
          .poster-pro-container input[type=range]::-webkit-slider-runnable-track { width: 100%; height: 4px; cursor: pointer; background: var(--border-color); border-radius: 2px; }
          .btn-icon { display: flex; align-items: center; justify-content: center; font-size: 1rem; flex: 1; padding: 10px; }
          .btn-icon.active { background: var(--accent); color: #fff; border-color: var(--accent); }
          .sidebar-download-btn { display: block; width: 100%; padding: 14px; background: var(--bg-input); color: var(--text-main); text-align: center; font-weight: 800; text-transform: uppercase; font-size: 0.75rem; text-decoration: none; border-radius: 10px; transition: 0.2s; border: none; cursor: pointer; letter-spacing: 0.5px; }
          .sidebar-download-btn:hover { background: #2f2f45; transform: translateY(-1px); }
          .btn-accent { background: var(--accent); color: #fff; border: none; }
          .btn-accent:hover { background: var(--accent-hover); }
          .btn-danger { background: var(--danger); color: #fff; border: none !important;}
          .btn-danger:hover { background: #e11d48; }
          .btn-dark { background: #161622; border: 1px solid #2b2b3d; }
          .btn-dark:hover { background: #1e1e2d; }
          .main-view { flex: 1; display: flex; flex-direction: column; position: relative; }
          #top-bar { display: flex; justify-content: space-between; align-items: center; padding: 25px 40px; flex-shrink: 0; z-index: 9; width: 100%; position: sticky; top: 0; background: var(--bg-main); }
          .glitch-text { margin: 0; font-family: 'Montserrat', sans-serif; font-size: 2.4rem; font-weight: 900; color: #fff; letter-spacing: -0.5px; text-transform: uppercase; text-shadow: 2px 0 0 #ff003c, -2px 0 0 #00eaff; }
          .top-bar-left p { margin: 2px 0 0 0; color: var(--accent); font-style: italic; font-weight: 600; font-size: 0.9rem; }
          .view-toggle { display: flex; background: var(--bg-sidebar); border-radius: 50px; padding: 5px; border: 1px solid var(--border-color); }
          .toggle-btn { background: transparent; color: var(--text-muted); border: none; padding: 10px 25px; border-radius: 50px; font-weight: 800; font-size: 0.75rem; cursor: pointer; transition: 0.3s; letter-spacing: 0.5px; text-transform: uppercase;}
          .toggle-btn.active { background: var(--accent); color: #fff; box-shadow: 0 4px 10px rgba(90, 79, 203, 0.4); }
          #content-area { flex: 1; position: relative; overflow: auto; display: flex; justify-content: center; align-items: flex-start; padding: 0 40px 40px 40px; }
          #poster-frame { position: relative; background: #ffffff; box-shadow: 0 20px 50px rgba(0,0,0,0.8); transition: width 0.1s, height 0.1s; border-radius: 4px; overflow: hidden; margin-top: 20px;}
          .canvas-container { margin: 0 auto; }
          
          .grid-pro { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 30px; width: 100%; margin-top: 20px;}
          .variant-card { background: var(--card-bg); border-radius: 20px; padding: 20px; border: 1px solid var(--border-color); display: flex; flex-direction: column; align-items: center; gap: 15px; cursor: pointer; transition: 0.3s; box-shadow: 0 10px 30px rgba(0,0,0,0.3); }
          .variant-card:hover { transform: translateY(-5px); border-color: var(--accent); box-shadow: 0 15px 40px rgba(90, 79, 203, 0.2); }
          .variant-card img { width: 100%; border-radius: 12px; box-shadow: 0 8px 20px rgba(0,0,0,0.5); }
          .variant-info { text-align: center; margin-top: 5px;}
          .variant-layout { font-size: 0.65rem; color: #818cf8; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 4px; }
          .variant-theme { font-size: 1.1rem; color: #fff; font-family: 'Montserrat', sans-serif; font-weight: 900; font-style: italic; text-transform: uppercase; }
          .variant-actions { display: flex; gap: 10px; width: 100%; margin-top: 10px; opacity: 0; transition: 0.3s; }
          .variant-card:hover .variant-actions { opacity: 1; }
          
          .template-cards-container { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; width: 100%; padding: 20px 0; }
          .template-card { background: var(--bg-sidebar); border: 2px solid var(--border-color); border-radius: 16px; padding: 20px; display: flex; flex-direction: column; align-items: center; gap: 15px; cursor: pointer; transition: 0.3s; }
          .template-card:hover { border-color: var(--accent); transform: translateY(-5px); }
          .template-card.active { border-color: var(--accent); background: rgba(90, 79, 203, 0.1); box-shadow: 0 10px 30px rgba(90, 79, 203, 0.2); }
          .template-card h3 { margin: 0; font-family: 'Montserrat', sans-serif; font-size: 1.1rem; font-weight: 800; color: #fff; }
          .template-card p { margin: 0; font-size: 0.75rem; color: var(--text-muted); text-align: center; line-height: 1.4; }

          #search-results { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 80%; max-width: 1000px; height: 70%; background: var(--bg-sidebar); z-index: 100; border-radius: 24px; padding: 40px; overflow-y: auto; display: none; border: 1px solid var(--border-color); box-shadow: 0 25px 50px rgba(0,0,0,0.8); }
          .album-item { cursor: pointer; text-align: center; background: var(--bg-input); padding: 15px; border-radius: 16px; border: 1px solid transparent; transition: 0.2s;}
          .album-item:hover { border-color: var(--accent); transform: scale(1.02); }
          .album-item img { width: 100%; border-radius: 10px; margin-bottom: 10px; }
          .album-item h3 { font-size: 0.9rem; margin: 0; color: #fff;}
          .layer-item { display: flex; justify-content: space-between; align-items: center; background: var(--bg-input); padding: 10px; border-radius: 8px; font-size: 0.75rem; margin-bottom: 6px; border: 1px solid transparent;}
          .layer-item i { cursor: pointer; color: var(--text-muted); transition: 0.2s; }
          .layer-item i:hover { color: #fff; }
          #global-loader { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(14, 14, 21, 0.95); z-index: 9999; display: none; flex-direction: column; justify-content: center; align-items: center; color: #fff; }
          .spinner { border: 4px solid var(--bg-input); border-top: 4px solid var(--accent); border-radius: 50%; width: 50px; height: 50px; animation: spin 1s linear infinite; margin-bottom: 20px; }
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          .loader-text { font-size: 1.2rem; font-weight: 700; text-align: center; max-width: 80%; line-height: 1.5; font-family: 'Montserrat', sans-serif;}
          .loader-subtext { font-size: 0.85rem; color: var(--text-muted); margin-top: 10px; text-align: center; }
          
          #toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%) translateY(20px); background: var(--accent); color: #fff; padding: 12px 24px; border-radius: 50px; font-size: 13px; font-weight: 700; opacity: 0; transition: all 0.3s; z-index: 9999; pointer-events: none; font-family: 'Montserrat', sans-serif; box-shadow: 0 10px 30px rgba(0,0,0,0.5); text-transform: uppercase; letter-spacing: 1px;}
          #toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }

          /* FONT DROPDOWN CSS */
          .font-dropdown-menu { position: absolute; bottom: 100%; left: 0; width: 100%; max-height: 250px; overflow-y: auto; background: var(--bg-sidebar); border: 1px solid var(--border-color); border-radius: 10px; z-index: 10000; box-shadow: 0 -10px 30px rgba(0,0,0,0.8); display: flex; flex-direction: column; padding: 5px; margin-bottom: 5px; }
          .font-dropdown-menu::-webkit-scrollbar { width: 4px; }
          .font-dropdown-menu::-webkit-scrollbar-thumb { background: #444; border-radius: 2px; }
          .font-item { padding: 10px; cursor: pointer; color: #fff; font-size: 1rem; border-radius: 6px; transition: 0.2s; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.05); }
          .font-item:last-child { border-bottom: none; }
          .font-item:hover { background: var(--accent); }
        `;
        document.head.appendChild(style);
      }
      
      initApplicationLogic();
    };

    initScripts();

    return () => {};
  },[]);

  const handleTemplateSelection = (layout: string) => {
    setSelectedLayouts(prev => {
        const newLayouts = prev.includes(layout) ? prev.filter(l => l !== layout) : [...prev, layout];
        (window as any).selectedLayouts = newLayouts; 
        return newLayouts;
    });
  };

  const initApplicationLogic = () => {
    const w = window as any;
    
    w.selectedLayouts =[];

    w.syncReactFontState = function(fontName: string) {
        setActiveFont(fontName);
    };
    
    w.syncReactAlbumState = function(hasData: boolean) {
        setHasAlbumData(hasData);
    };

    w.toggleAccordion = function(btn: HTMLElement) {
        btn.classList.toggle('open');
        const content = btn.nextElementSibling as HTMLElement;
        if (content) content.classList.toggle('open');
    };

    w.showToast = function(msg: string) {
        let toast = document.getElementById('toast');
        if(!toast) return;
        toast.textContent = msg;
        toast.classList.add('show');
        setTimeout(() => toast!.classList.remove('show'), 3000);
    };

    w.showLoading = function(textKey: string, subtextKey = "") {
        document.getElementById('loader-text')!.innerText = textKey;
        document.getElementById('loader-subtext')!.innerText = subtextKey || "";
        document.getElementById('global-loader')!.style.display = 'flex';
    };
    
    w.hideLoading = function() {
        document.getElementById('global-loader')!.style.display = 'none';
    };

    w.getContrastYIQ = function(hexcolor: string) {
        hexcolor = hexcolor.replace("#", "");
        if(hexcolor.length === 3) hexcolor = hexcolor[0]+hexcolor[0]+hexcolor[1]+hexcolor[1]+hexcolor[2]+hexcolor[2];
        const r = parseInt(hexcolor.substr(0,2),16);
        const g = parseInt(hexcolor.substr(2,2),16);
        const b = parseInt(hexcolor.substr(4,2),16);
        const yiq = ((r*299)+(g*587)+(b*114))/1000;
        return (yiq >= 128) ? 'light' : 'dark';
    };

    w.applyWatermark = function(sourceDataUrl: string) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                if(!ctx) return resolve(sourceDataUrl);
                
                ctx.drawImage(img, 0, 0);

                ctx.fillStyle = "rgba(255, 255, 255, 0.2)"; 
                ctx.font = "bold 40px Montserrat";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";

                ctx.translate(canvas.width/2, canvas.height/2);
                ctx.rotate(-Math.PI / 6); 
                ctx.translate(-canvas.width/2, -canvas.height/2);

                const stepX = 300; 
                const stepY = 150; 
                const diag = Math.sqrt(canvas.width*canvas.width + canvas.height*canvas.height);

                for(let x = -diag; x < diag * 2; x += stepX) {
                    for(let y = -diag; y < diag * 2; y += stepY) {
                        ctx.fillText("POSTERWALLART.SHOP", x, y);
                    }
                }
                resolve(canvas.toDataURL('image/jpeg', 0.9));
            };
            img.src = sourceDataUrl;
        });
    };

    w.variantStates = {};
    w.currentVariantKey = null;
    w.currentViewMode = 'gallery';
    w.latestVariantsData = [];
    w.PROPS_TO_SAVE =['id', 'selectable', 'evented', 'lockMovementX', 'lockMovementY', 'lockScalingX', 'lockScalingY', 'lockRotation', 'hasControls', 'crossOrigin'];

    w.saveCurrentStateToMemory = function() {
        if (w.currentVariantKey && !w.isBatchGenerating) {
            try {
                w.variantStates[w.currentVariantKey] = w.canvas.toJSON(w.PROPS_TO_SAVE);
                const dynamicMultiplier = 560 / w.canvas.getHeight();
                const previewUrl = w.canvas.toDataURL({ format: 'jpeg', quality: 0.9, multiplier: dynamicMultiplier });
                
                const imgEl = document.getElementById(`preview_${w.currentVariantKey}`) as HTMLImageElement;
                if (imgEl) imgEl.src = previewUrl;

                let vItem = w.latestVariantsData.find((v: any) => v.key === w.currentVariantKey);
                if (vItem) vItem.url = previewUrl;

            } catch(e) {}
        }
    };

    w.showVariantsView = function() {
        w.saveCurrentStateToMemory(); 
        w.currentViewMode = 'gallery';
        document.getElementById('poster-frame')!.style.display = 'none';
        document.getElementById('variants-view')!.style.display = 'flex';
        document.getElementById('btn-show-gallery')!.classList.add('active');
        document.getElementById('btn-show-editor')!.classList.remove('active');
    };

    w.showSingleEditor = function() {
        w.currentViewMode = 'editor';
        document.getElementById('variants-view')!.style.display = 'none';
        document.getElementById('poster-frame')!.style.display = 'block';
        document.getElementById('btn-show-editor')!.classList.add('active');
        document.getElementById('btn-show-gallery')!.classList.remove('active');
    };

    const genreDict: any = { "alternatif": "Alternative", "caz": "Jazz", "klasik": "Classical", "elektronik": "Electronic", "rap/hip hop": "Hip Hop", "popüler": "Pop", "rock": "Rock" };
    w.translateGenre = function(genre: string) {
        if (!genre) return 'Hip Hop';
        let lower = genre.toLowerCase().trim();
        if (genreDict[lower]) return genreDict[lower];
        for (let tr in genreDict) { if (lower.includes(tr)) return genreDict[tr]; } return genre;
    };

    w.FORMAT_SIZES = { 
        '5.83x8.27': { w: 1749, h: 2481 }, '8.27x11.69': { w: 2481, h: 3507 },
        '11.69x16.54': { w: 3507, h: 4962 }, '16.54x23.39': { w: 4962, h: 7017 },
        '23.39x33.11': { w: 7017, h: 9933 }, '5x7': { w: 1500, h: 2100 },
        '6x8': { w: 1800, h: 2400 }, '8x10': { w: 2400, h: 3000 },
        '9x11': { w: 2700, h: 3300 }, '11x14': { w: 3300, h: 4200 },
        '11x17': { w: 3300, h: 5100 }, '12x16': { w: 3600, h: 4800 },
        '12x18': { w: 3600, h: 5400 }, '16x20': { w: 4800, h: 6000 },
        '16x24': { w: 4800, h: 7200 }, '18x24': { w: 5400, h: 7200 },
        '20x30': { w: 6000, h: 9000 }, '24x36': { w: 7200, h: 10800 }
    };
    w.currentFormat = '16.54x23.39'; 
    w.BASE_PREVIEW_SCALE = 0.25; 
    
    w.currentImg = ''; w.albumTitle = 'poster'; w.paletteRects =[]; w.separatorLine = null;
    w.activeAlbumData = null; w.currentSpotifyUri = null; w.isBatchGenerating = false; 
    
    w.canvas = new w.fabric.Canvas('poster-canvas', { preserveObjectStacking: true, selection: true, enableRetinaScaling: false });
    w.fabric.Object.prototype.objectCaching = false;
    w.fabric.Object.prototype.set({ transparentCorners: false, cornerColor: 'var(--accent)', borderColor: 'var(--accent)', cornerSize: 10, padding: 0, cornerStrokeColor: '#fff', cornerStyle: 'circle' });

    w.getCurrentDimensions = function() {
        return w.FORMAT_SIZES[w.currentFormat];
    };

    w.getLayoutMetrics = function() {
        const baseW = 4961; const baseH = 7016;
        const dims = w.getCurrentDimensions();
        const fitScale = Math.min(dims.w / baseW, dims.h / baseH);
        const offsetX = (dims.w - (baseW * fitScale)) / 2;
        const offsetY = (dims.h - (baseH * fitScale)) / 2;
        return {
            S: fitScale * w.BASE_PREVIEW_SCALE,
            OX: offsetX * w.BASE_PREVIEW_SCALE,
            OY: offsetY * w.BASE_PREVIEW_SCALE
        };
    };

    // --- YENİ: SMART TEXT ALGORİTMASI ---
    // Textbox kullanarak metni sınırlandırır, sığmıyorsa fontu küçültür (Hiçbir zaman "..." ile kesmez, alt satıra atar).
    w.createSmartText = function(text: string, config: any, maxWidth: number, maxHeight: number) {
        let size = config.fontSize;
        let tb = new w.fabric.Textbox(text, Object.assign({}, config, { 
            width: maxWidth, 
            fontSize: size,
            splitByGrapheme: false 
        }));
        
        while (tb.height > maxHeight && size > 15) {
            size -= (size > 80 ? 6 : 2);
            tb = new w.fabric.Textbox(text, Object.assign({}, config, { 
                width: maxWidth, 
                fontSize: size,
                splitByGrapheme: false
            }));
        }
        return tb;
    };

    w.updateFormat = function(newFormat: string) {
        w.currentFormat = newFormat;
        w.rescale((document.getElementById('zoom-slider') as HTMLInputElement).value);
        if (w.activeAlbumData) {
            w.generateAllVariants();
        }
    };

    w.rescale = function(sliderVal: string) { 
        const dims = w.getCurrentDimensions();
        let visualZoom = parseFloat(sliderVal) / w.BASE_PREVIEW_SCALE;
        let targetW = (dims.w * w.BASE_PREVIEW_SCALE) * visualZoom; 
        let targetH = (dims.h * w.BASE_PREVIEW_SCALE) * visualZoom; 
        
        w.canvas.setZoom(visualZoom);
        w.canvas.setDimensions({ width: targetW, height: targetH });
        
        const frame = document.getElementById('poster-frame'); 
        if(frame) {
            frame.style.width = targetW + 'px'; 
            frame.style.height = targetH + 'px';
        }

        w.toggleGridVisuals(); 
    };

    w.executeDeezerSearch = function() {
        const q = (document.getElementById('query') as HTMLInputElement).value; 
        if(!q) return;
        const s = document.createElement('script');
        s.src = `https://api.deezer.com/search/album?q=${encodeURIComponent(q)}&output=jsonp&callback=showDeezerResults`;
        s.onload = () => document.body.removeChild(s);
        document.body.appendChild(s);
    };

    w.showDeezerResults = function(res: any) {
        document.getElementById('search-results')!.style.display = 'block';
        document.getElementById('results-grid')!.innerHTML = res.data.map((a: any) => `
            <div class="album-item" onclick="window.fetchDeezerAlbum(${a.id})">
                <img src="${a.cover_medium}"><h3>${a.title}</h3>
            </div>
        `).join('');
    };

    w.fetchDeezerAlbum = function(id: string) {
        if (!w.selectedLayouts || w.selectedLayouts.length === 0) {
            document.getElementById('search-results')!.style.display = 'none'; 
            document.getElementById('layout-alert-modal')!.style.display = 'flex';
            return;
        }
        w.showLoading("Fetching album data..."); 
        document.getElementById('search-results')!.style.display = 'none'; 
        const s = document.createElement('script');
        s.src = `https://api.deezer.com/album/${id}?output=jsonp&callback=handleDeezerAlbumLoaded`; 
        s.onload = () => document.body.removeChild(s);
        document.body.appendChild(s);
    };

    w.handleDeezerAlbumLoaded = function(d: any) {
        w.activeAlbumData = d; w.currentSpotifyUri = null;
        w.syncReactAlbumState(true);
        w.hideLoading();
        w.generateAllVariants();
    };

    w.cropperInstance = null;
    w.openCropper = function(imgSrc: string) {
        const modal = document.getElementById('cropper-modal');
        const imgEl = document.getElementById('cropper-image') as HTMLImageElement;
        if(modal && imgEl) {
            modal.style.display = 'flex';
            imgEl.src = imgSrc;
            
            if (w.cropperInstance) w.cropperInstance.destroy();
            w.cropperInstance = new (window as any).Cropper(imgEl, {
                aspectRatio: 1, 
                viewMode: 1,
                autoCropArea: 1,
            });
        }
    };

    w.closeCropper = function() {
        document.getElementById('cropper-modal')!.style.display = 'none';
        if (w.cropperInstance) {
            w.cropperInstance.destroy();
            w.cropperInstance = null;
        }
        (document.getElementById('customUpload') as HTMLInputElement).value = '';
    };

    w.applyCroppedImage = function() {
        if (!w.cropperInstance) return;
        const canvas = w.cropperInstance.getCroppedCanvas({
            width: 1000,
            height: 1000
        });
        const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.9);
        w.closeCropper();
        
        const mockData = {
            id: "custom_" + Date.now(),
            title: "LOREM IPSUM",
            artist: { name: "DOLOR SIT AMET" },
            cover_xl: croppedDataUrl,
            release_date: new Date().toISOString().split('T')[0],
            duration: 2500,
            label: "INDEPENDENT",
            genres: { data: [{ name: "Mixed" }] },
            tracks: {
                data: [
                    { title: "Track One - Lorem Ipsum", duration: 180 },
                    { title: "Track Two - Dolor Sit", duration: 210 },
                    { title: "Track Three - Amet Consectetur", duration: 195 },
                    { title: "Track Four - Adipiscing Elit", duration: 240 },
                    { title: "Track Five - Sed Do", duration: 200 },
                    { title: "Track Six - Eiusmod Tempor", duration: 190 },
                    { title: "Track Seven - Incididunt Ut", duration: 220 },
                    { title: "Track Eight - Labore Et", duration: 185 }
                ]
            }
        };

        w.handleDeezerAlbumLoaded(mockData);
    };

    document.getElementById('customUpload')?.addEventListener('change', function(e: any) {
        const file = e.target.files[0]; 
        if(!file) return; 

        if (!w.selectedLayouts || w.selectedLayouts.length === 0) {
            document.getElementById('layout-alert-modal')!.style.display = 'flex';
            e.target.value = ''; 
            return;
        }

        const reader = new FileReader();
        reader.onload = function(f: any) {
            w.openCropper(f.target.result);
        }; 
        reader.readAsDataURL(file);
    });

    w.syncColor = function(srcId: string, targetId: string) {
        let src = document.getElementById(srcId) as HTMLInputElement;
        let target = document.getElementById(targetId) as HTMLInputElement;
        if(!src || !target) return;
        
        if (src.type === 'color') {
            target.value = src.value;
        } else if (src.type === 'text') {
            if (/^#[0-9A-Fa-f]{6}$/.test(src.value)) {
                target.value = src.value;
            }
        }
        
        if (srcId.includes('frameColorPicker')) w.updateFrameColor(target.value);
        if (srcId.includes('lineColorPicker')) w.updateLineColor(target.value);
        if (srcId.startsWith('p') && srcId.length <= 3) {
            let index = parseInt(srcId.replace('p', '')) - 1;
            w.setPalette(index, target.value);
        }
        if (srcId.includes('elemColor')) w.applyStyle('fill', target.value);
        if (srcId.includes('elemBgColor')) w.applyStyle('backgroundColor', target.value);
        if (srcId.includes('elemStrokeColor')) w.applyStyle('stroke', target.value);
        if (srcId.includes('shColor')) w.applyStyle('shadow', target.value, 'color');
    };

    w.addSpotifyCodePromise = function() {
        return new Promise(async (resolve) => {
            let uri = (document.getElementById('spotifyLink') as HTMLInputElement).value.trim();
            if(!uri) uri = 'spotify:track:4uLU6hMCjMI75M1A2tKUQC';
            
            let code = uri;
            const urlMatch = uri.match(/track\/([a-zA-Z0-9]+)/);
            if (urlMatch) code = `spotify:track:${urlMatch[1]}`;
            const uriMatch = uri.match(/spotify:track:([a-zA-Z0-9]+)/);
            if (uriMatch) code = uri;

            const logoColor = (document.getElementById('barcode-logo-color') as HTMLInputElement).value || "#ffffff";
            const barColor  = (document.getElementById('barcode-bar-color') as HTMLInputElement).value || "#ffffff";
            
            w.showLoading("Generating Custom Barcode...");

            const spotifyUrl = `https://scannables.scdn.co/uri/plain/svg/000000/white/640/${code}`;
            const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(spotifyUrl)}`;
            
            try {
                const res = await fetch(proxyUrl);
                let svgText = await res.text();
                
                const parser = new DOMParser();
                const doc = parser.parseFromString(svgText, 'image/svg+xml');
                const fetched = doc.querySelector('svg');
                
                if (fetched) {
                    const allRects = Array.from(fetched.querySelectorAll('rect'));
                    allRects.forEach((r, i) => {
                        if (i === 0) r.remove(); 
                        else r.setAttribute('fill', barColor);
                    });
                    fetched.querySelectorAll('circle').forEach(el => el.setAttribute('fill', logoColor));
                    fetched.querySelectorAll('path').forEach(el => {
                        const fill = el.getAttribute('fill');
                        if (fill && fill !== 'none') el.setAttribute('fill', logoColor);
                        const stroke = el.getAttribute('stroke');
                        if (stroke && stroke !== 'none') el.setAttribute('stroke', logoColor);
                    });
                    svgText = new XMLSerializer().serializeToString(fetched);
                }

                w.fabric.loadSVGFromString(svgText, function(objects: any, options: any) {
                    const obj = w.fabric.util.groupSVGElements(objects, options);
                    const m = w.getLayoutMetrics();
                    obj.scaleToWidth(800 * m.S);
                    
                    let layout = (document.getElementById('layoutSelect') as HTMLSelectElement).value;
                    if(layout === 'modern') {
                        obj.set({ left: m.OX + (4961 * m.S) - (350 * m.S) - (800 * m.S), top: m.OY + (7016 * m.S) - (2000 * m.S), id: 'spotify-code' });
                    } else if (layout === 'classic') {
                        obj.set({ left: m.OX + (4961 * m.S) - (350 * m.S) - (800 * m.S), top: m.OY + (7016 * m.S) - (850 * m.S), id: 'spotify-code' });
                    } else {
                        obj.set({ left: m.OX + ((4961 * m.S) / 2) - (400 * m.S), top: m.OY + (7016 * m.S) - (1200 * m.S), id: 'spotify-code' });
                    }

                    let existing = w.canvas.getObjects().find((o: any) => o.id === 'spotify-code');
                    if (existing) w.canvas.remove(existing);
                    w.canvas.add(obj); w.canvas.bringToFront(obj);
                    
                    if(!w.isBatchGenerating) { w.saveState(); w.updateLayersPanel(); }
                    w.hideLoading();
                    resolve(true);
                });
            } catch(e) {
                console.error("Barcode fetch failed", e);
                w.hideLoading();
                w.showToast("⚠ Failed to load barcode.");
                resolve(true);
            }
        });
    };
    w.addSpotifyCode = async function() { await w.addSpotifyCodePromise(); if(!w.isBatchGenerating) { w.saveState(); w.updateLayersPanel(); w.saveCurrentStateToMemory(); w.showToast("✓ Barcode Added"); } };

    w.extractPalettePromise = function(imgUrl: string) {
        return new Promise((resolve) => {
            const img = new Image(); img.crossOrigin = "anonymous"; img.src = imgUrl;
            img.onload = function() {
                w.Vibrant.from(img).getPalette().then((palette: any) => {
                    const finalColors =[ palette.Vibrant ? palette.Vibrant.hex : '#ffffff', palette.DarkVibrant ? palette.DarkVibrant.hex : '#aaaaaa', palette.LightVibrant ? palette.LightVibrant.hex : '#dddddd', palette.Muted ? palette.Muted.hex : '#555555', palette.DarkMuted ? palette.DarkMuted.hex : '#222222' ];
                    finalColors.forEach((hex, i) => { 
                        const input = document.getElementById('p' + (i + 1)) as HTMLInputElement; 
                        const txt = document.getElementById('p' + (i + 1) + '-txt') as HTMLInputElement;
                        if (input) { input.value = hex; if(txt) txt.value = hex; w.setPalette(i, hex); } 
                    });
                    resolve(true);
                }).catch(() => { resolve(true); });
            }; img.onerror = () => resolve(true);
        });
    };
    
    w.forceExtractPalette = function() { 
        if(w.currentImg) { 
            w.showLoading("Processing...");
            w.extractPalettePromise(w.currentImg).then(()=> {
                w.applyTheme((document.getElementById('themeSelect') as HTMLSelectElement).value);
                w.hideLoading();
                w.showToast("✓ Colors extracted");
            }).catch(() => w.hideLoading()); 
        } 
        else { w.showToast("⚠ Upload an image first."); } 
    };

    w.updateBlurSettingsPromise = function() {
        return new Promise((resolve) => {
            const dims = w.getCurrentDimensions();
            const on = (document.getElementById('blurToggle') as HTMLInputElement).checked; 
            const amount = parseFloat((document.getElementById('blurAmount') as HTMLInputElement).value); 
            const brightness = (document.getElementById('blurBrightness') as HTMLInputElement).value; 
            const frameColor = (document.getElementById('frameColorPicker') as HTMLInputElement).value;
            
            if(!on || !w.currentImg) { w.canvas.setBackgroundImage(null, () => { w.canvas.setBackgroundColor(frameColor, () => { w.canvas.renderAll(); resolve(true); }); }); return; }
            
            const img = new Image(); img.crossOrigin = "anonymous";
            img.onload = () => {
                const off = document.createElement('canvas'); off.width = dims.w * w.BASE_PREVIEW_SCALE; off.height = dims.h * w.BASE_PREVIEW_SCALE; 
                const ctx = off.getContext('2d'); if(ctx) { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, off.width, off.height); }
                const scaledBlur = amount * (off.width / (4961 * w.BASE_PREVIEW_SCALE)); 
                if(ctx) ctx.filter = `blur(${scaledBlur}px) brightness(${brightness})`;
                const ratio = Math.max(off.width / img.width, off.height / img.height); 
                const drawW = img.width * ratio, drawH = img.height * ratio; 
                if(ctx) ctx.drawImage(img, (off.width - drawW)/2, (off.height - drawH)/2, drawW, drawH);
                w.fabric.Image.fromURL(off.toDataURL('image/jpeg', 0.8), (fImg: any) => { 
                    fImg.set({ scaleX: 1, scaleY: 1, originX: 'left', originY: 'top' }); 
                    w.canvas.setBackgroundImage(fImg, () => { w.canvas.renderAll(); resolve(true); }); 
                });
            }; img.onerror = () => resolve(true); img.src = w.currentImg;
        });
    };
    
    w.updateBlurSettings = async function() { await w.updateBlurSettingsPromise(); w.saveCurrentStateToMemory(); };

    const months =["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    w.renderStandard = async function(d: any) {
        return new Promise(async (resolve) => {
            w.currentImg = d.cover_xl; w.albumTitle = d.title;
            const m = w.getLayoutMetrics();
            const dateArr = d.release_date.split('-'); const day = parseInt(dateArr[2]);
            const getOrdinal = (n: number) => { let s =["th", "st", "nd", "rd"], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); };
            const dateStr = `${months[parseInt(dateArr[1])-1]} ${getOrdinal(day)} ${dateArr[0]}`.trim();
            const hr = Math.floor(d.duration / 3600); const min = Math.floor((d.duration % 3600) / 60); const sec = d.duration % 60;
            const length = hr > 0 ? `${hr}:${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}` : `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;

            w.canvas.clear(); w.paletteRects =[];

            await w.updateBlurSettingsPromise();

            w.fabric.Image.fromURL(d.cover_xl, async function(img: any) {
                const px = m.OX + (250 * m.S); const py = m.OY + (250 * m.S); const contentW = (4961 - 500) * m.S; 
                img.scaleToWidth(contentW); img.set({ left: px, top: py, id: 'main-cover' }); w.canvas.add(img);
                
                let currentY = py + img.getScaledHeight() + (120 * m.S); 
                
                let boxW = 180 * m.S, boxH = 90 * m.S, gap = 20 * m.S;
                let pWidth = (boxW * 5) + (gap * 4);
                let maxTextW = contentW - pWidth - (100 * m.S); 

                let artistClean = d.artist.name.replace(/\s*\(.*?\)\s*/g, '').replace(/\s*\[.*?\]\s*/g, '').trim().toUpperCase();
                let artistText = w.createSmartText(artistClean, { left: px, top: currentY, fontSize: 90 * m.S, fontFamily: 'Inter', fontWeight: 300, fill: '#111', id: 'artist-text', lineHeight: 1.1 }, maxTextW, 200 * m.S);
                w.canvas.add(artistText); currentY += artistText.height + (15 * m.S);

                let titleClean = d.title.replace(/\s*\(.*?\)\s*/g, '').replace(/\s*\[.*?\]\s*/g, '').trim().toUpperCase();
                let titleText = w.createSmartText(titleClean, { left: px, top: currentY, fontSize: 140 * m.S, fontWeight: 700, fill: '#111', fontFamily: 'Inter', id: 'title-text', lineHeight: 1.1 }, maxTextW, 400 * m.S);
                w.canvas.add(titleText);
                
                let paletteY = currentY + titleText.height - (90 * m.S) - (13 * m.S); 
                if (paletteY < currentY) paletteY = currentY; 

                let startX = px + contentW - pWidth;
                for(let i=0; i<5; i++) {
                    let rect = new w.fabric.Rect({ left: startX + i*(boxW+gap), top: paletteY, width: boxW, height: boxH, fill: '#000', id: 'palette-rect' });
                    w.canvas.add(rect); w.paletteRects.push(rect);
                }
                
                currentY = Math.max(currentY + titleText.height, paletteY + boxH) + (40 * m.S);
                let lineCol = (document.getElementById('lineColorPicker') as HTMLInputElement).value;
                w.separatorLine = new w.fabric.Rect({ left: px, top: currentY, width: contentW, height: 8 * m.S, fill: lineCol, id: 'separator' });
                w.canvas.add(w.separatorLine); currentY += (8 * m.S) + (70 * m.S);

                let tCount = d.tracks.data.length;
                let trackFontSize = (tCount <= 10) ? 90 * m.S : (tCount <= 16) ? 75 * m.S : (tCount <= 22) ? 60 * m.S : 48 * m.S;

                let trackYLeft = currentY; let trackYRight = currentY; 
                let colW = contentW * 0.45;
                let col2X = px + contentW - colW; 
                const MAX_ALLOWED_Y = m.OY + ((7016 - 250) * m.S); 
                
                d.tracks.data.forEach((tObj: any, i: number) => {
                    let trackName = tObj.title.replace(/\s*\(.*?\)\s*/g, '').replace(/\s*\[.*?\]\s*/g, '').trim().toUpperCase();
                    let txt = new w.fabric.Textbox(trackName, { width: colW, fontSize: trackFontSize, fontFamily: 'Montserrat', fontWeight: 700, fill: '#333', id: 'track-text', lineHeight: 1.2 });
                    
                    let isCol2 = (trackYLeft + txt.height + (trackFontSize * 0.5)) > MAX_ALLOWED_Y;
                    txt.set({ left: isCol2 ? col2X : px, top: isCol2 ? trackYRight : trackYLeft }); w.canvas.add(txt);
                    
                    if(isCol2) trackYRight += txt.height + (trackFontSize * 0.5); else trackYLeft += txt.height + (trackFontSize * 0.5);
                });

                let finalGenre = w.translateGenre(d.genres?.data[0]?.name || 'Hip Hop'); let metaY = currentY;
                const metaItems =[ 
                    { l: "RELEASED ON:", v: dateStr }, 
                    { l: "RECORD LABEL:", v: d.label || 'Def Jam' }, 
                    { l: "GENRE:", v: finalGenre }, 
                    { l: "TRACKS:", v: d.tracks.data.length.toString() }, 
                    { l: "LENGTH:", v: length } 
                ];
                metaItems.forEach(mi => {
                    let mVal = new w.fabric.IText(mi.v, { left: px + contentW, top: metaY, fontSize: 55 * m.S, fontFamily: 'Inter', fill: '#555', originX: 'right', textAlign: 'right', id: 'meta-val' });
                    let mLbl = new w.fabric.IText(mi.l + " ", { left: px + contentW - mVal.width, top: metaY, fontSize: 55 * m.S, fontFamily: 'Inter', fontWeight: 700, fill: '#111', originX: 'right', textAlign: 'right', id: 'meta-lbl' });
                    w.canvas.add(mLbl, mVal); metaY += Math.max(mVal.height, mLbl.height) + (80 * m.S);
                });

                await w.extractPalettePromise(d.cover_xl); await w.applyTheme((document.getElementById('themeSelect') as HTMLSelectElement).value);
                
                await new Promise((res) => {
                    w.fabric.Image.fromURL('/musicpostershop.png', function(bImg: any) {
                        if(bImg) {
                            bImg.scaleToWidth(150 * m.S); 
                            bImg.set({ 
                                left: m.OX + ((4961 * m.S) / 2), top: m.OY + ((7016 * m.S) - (100 * m.S)), 
                                originX: 'center', originY: 'bottom', id: 'custom-site-barcode' 
                            });
                            w.canvas.add(bImg);
                        }
                        res(true);
                    }, { crossOrigin: 'anonymous' });
                });
                w.canvas.requestRenderAll(); setTimeout(() => resolve(true), 50); 
            }, { crossOrigin: 'anonymous' });
        });
    };

    w.renderMinimal = async function(d: any) {
        return new Promise(async (resolve) => {
            w.currentImg = d.cover_xl; w.albumTitle = d.title;
            const m = w.getLayoutMetrics();
            const dateArr = d.release_date.split('-'); const day = parseInt(dateArr[2]);
            const getOrdinal = (n: number) => { let s =["th", "st", "nd", "rd"], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); };
            const dateStr = `${months[parseInt(dateArr[1])-1]} ${getOrdinal(day)} ${dateArr[0]}`.trim();
            let totalMs = d.tracks.data.reduce((acc: number, t_obj: any) => acc + (t_obj.duration * 1000), 0); 
            let h = Math.floor(totalMs / 3600000); let mMin = Math.floor((totalMs % 3600000) / 60000); let durationStr = h > 0 ? `${h} HR ${mMin} MIN` : `${mMin} MIN`;

            w.canvas.clear(); w.paletteRects =[];
            let textColor = (document.getElementById('lineColorPicker') as HTMLInputElement).value || "#212121";

            await w.updateBlurSettingsPromise();

            w.fabric.Image.fromURL(d.cover_xl, async function(img: any) {
                const margin = 250 * m.S; const coverW = 4961 * 0.85 * m.S; 
                const leftColX = m.OX + ((4961 * m.S) - coverW) / 2; const rightColX = leftColX + coverW;
                img.scaleToWidth(coverW); img.set({ left: leftColX, top: m.OY + margin, id: 'main-cover' }); w.canvas.add(img);
                
                let contentY = m.OY + margin + img.getScaledHeight() + (150 * m.S); 
                let trackY = contentY; 
                let currentTrackColX = leftColX; 
                
                const MAX_ALLOWED_Y = m.OY + ((7016 - 500) * m.S); 
                
                let tCount = d.tracks.data.length;
                let trackFontSize = (tCount <= 10) ? 90 * m.S : (tCount <= 16) ? 75 * m.S : (tCount <= 22) ? 60 * m.S : 48 * m.S;
                let colW = 1000 * m.S;

                d.tracks.data.forEach((tObj: any) => {
                    let trackName = tObj.title.replace(/^\d+\.\s*/, '').replace(/\s*\(.*?\)\s*/g, '').replace(/\s*\[.*?\]\s*/g, '').trim().toUpperCase();
                    let txt = new w.fabric.Textbox(trackName, { width: colW, fontSize: trackFontSize, fontFamily: 'Montserrat', fontWeight: 700, fill: textColor, id: 'track-text', lineHeight: 1.2 });
                    if (trackY + txt.height + (trackFontSize * 0.5) > MAX_ALLOWED_Y) { currentTrackColX += colW + (200 * m.S); trackY = contentY; }
                    txt.set({ left: currentTrackColX, top: trackY }); w.canvas.add(txt); trackY += txt.height + (trackFontSize * 0.5);
                });

                let boxW = 270 * m.S, boxH = 270 * m.S, gap = 30 * m.S; let startX = rightColX - ((boxW * 5) + (gap * 4)); let paletteY = contentY;
                for(let i=0; i<5; i++) { let rect = new w.fabric.Rect({ left: startX + i*(boxW+gap), top: paletteY, width: boxW, height: boxH, fill: '#000', id: 'palette-rect' }); w.canvas.add(rect); w.paletteRects.push(rect); }

                let maxRightTextW = coverW * 0.45;
                let textStartY = paletteY + boxH + (100 * m.S);

                let artistClean = d.artist.name.replace(/\s*\(.*?\)\s*/g, '').replace(/\s*\[.*?\]\s*/g, '').trim().toUpperCase();
                let artistText = w.createSmartText(artistClean, { left: rightColX, top: textStartY, fontSize: 130 * m.S, fontFamily: 'Montserrat', fontWeight: 700, fill: textColor, originX: 'right', id: 'artist-text', textAlign: 'right', lineHeight: 1.1 }, maxRightTextW, 350 * m.S); 
                w.canvas.add(artistText);

                let titleClean = d.title.replace(/\s*\(.*?\)\s*/g, '').replace(/\s*\[.*?\]\s*/g, '').trim().toUpperCase();
                let titleText = w.createSmartText(titleClean, { left: rightColX, top: artistText.top + artistText.height + (50 * m.S), fontSize: 180 * m.S, fontFamily: 'Montserrat', fontWeight: 900, fill: textColor, originX: 'right', textAlign: 'right', id: 'title-text', lineHeight: 1 }, maxRightTextW, 1000 * m.S); 
                w.canvas.add(titleText);

                let signatureText = w.createSmartText(artistClean, { left: rightColX, top: titleText.top + titleText.height + (80 * m.S), fontSize: 250 * m.S, fontFamily: 'Sacramento', fill: textColor, originX: 'right', angle: -15, id: 'signature-text', textAlign: 'right' }, maxRightTextW * 1.2, 500 * m.S); 
                w.canvas.add(signatureText);

                let footerY = m.OY + (7016 - 250) * m.S;
                let l1 = new w.fabric.IText(`RECORD LABEL: ${d.label || 'ALBUM POSTER WALL ART'}`, { left: leftColX, top: footerY - (80 * m.S), fontSize: 50 * m.S, fontFamily: 'Montserrat', fontWeight: 700, fill: textColor, id: 'layout2-meta' });
                let l2 = new w.fabric.IText(`ALBUM LENGTH: ${durationStr}`, { left: leftColX, top: footerY, fontSize: 50 * m.S, fontFamily: 'Montserrat', fontWeight: 700, fill: textColor, id: 'layout2-meta' }); w.canvas.add(l1, l2);
                let r1 = new w.fabric.IText(`RELEASED ON`, { left: rightColX, top: footerY - (80 * m.S), fontSize: 50 * m.S, fontFamily: 'Montserrat', fontWeight: 700, fill: textColor, originX: 'right', textAlign: 'right', id: 'layout2-meta' });
                let r2 = new w.fabric.IText(dateStr.toUpperCase(), { left: rightColX, top: footerY, fontSize: 50 * m.S, fontFamily: 'Montserrat', fontWeight: 700, fill: textColor, originX: 'right', textAlign: 'right', id: 'layout2-meta' }); w.canvas.add(r1, r2);

                await w.extractPalettePromise(d.cover_xl); await w.applyTheme((document.getElementById('themeSelect') as HTMLSelectElement).value);
                
                await new Promise((res) => {
                    w.fabric.Image.fromURL('/musicpostershop.png', function(bImg: any) {
                        if(bImg) {
                            bImg.scaleToWidth(150 * m.S); 
                            bImg.set({ 
                                left: m.OX + ((4961 * m.S) / 2), top: m.OY + ((7016 * m.S) - (100 * m.S)), 
                                originX: 'center', originY: 'bottom', id: 'custom-site-barcode' 
                            });
                            w.canvas.add(bImg);
                        }
                        res(true);
                    }, { crossOrigin: 'anonymous' });
                });
                w.canvas.requestRenderAll(); setTimeout(() => resolve(true), 50);
            }, { crossOrigin: 'anonymous' });
        });
    };

    w.renderModern = async function(d: any) {
        return new Promise(async (resolve) => {
            w.currentImg = d.cover_xl; w.albumTitle = d.title;
            const m = w.getLayoutMetrics();
            
            const dateArr = d.release_date.split('-');
            const monthsEn =["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
            const dateStr = `${monthsEn[parseInt(dateArr[1])-1]} ${parseInt(dateArr[2])}, ${dateArr[0]}`;
            
            let totalMs = d.tracks.data.reduce((acc: number, t_obj: any) => acc + (t_obj.duration * 1000), 0); 
            let durationMins = Math.round(totalMs / 60000);
            
            w.canvas.clear(); w.paletteRects =[];
            let textColor = (document.getElementById('lineColorPicker') as HTMLInputElement).value || "#ffffff";

            await w.updateBlurSettingsPromise();

            w.fabric.Image.fromURL(d.cover_xl, async function(img: any) {
                const margin = 350 * m.S;
                const canvasW = 4961 * m.S;
                const coverSize = canvasW - (margin * 2);
                
                const boxW = 120 * m.S, boxH = 80 * m.S, gap = 15 * m.S;
                const pWidth = (boxW * 5) + (gap * 6);
                let maxTextW = coverSize - pWidth - (100 * m.S);

                let titleClean = d.title.toUpperCase();
                let artistClean = d.artist.name.toUpperCase();
                
                let titleText = w.createSmartText(titleClean, { left: m.OX + margin, top: m.OY + margin + (50 * m.S), fontSize: 240 * m.S, fontFamily: 'Montserrat', fontWeight: 900, fill: textColor, id: 'title-text', lineHeight: 1.1 }, maxTextW, 500 * m.S);
                w.canvas.add(titleText);
                
                let artistText = w.createSmartText(artistClean, { left: m.OX + margin, top: titleText.top + titleText.height + (30 * m.S), fontSize: 100 * m.S, fontFamily: 'Inter', fontWeight: 600, fill: textColor, id: 'artist-text', lineHeight: 1.1 }, maxTextW, 250 * m.S);
                w.canvas.add(artistText);
                
                const pHeight = boxH + (gap * 2);
                const pStartX = m.OX + canvasW - margin - pWidth;
                const pStartY = m.OY + margin + (320 * m.S) - (10 * m.S);
                
                let pBorder = new w.fabric.Rect({
                    left: pStartX, top: pStartY, width: pWidth, height: pHeight,
                    fill: 'transparent', stroke: textColor, strokeWidth: 5 * m.S, rx: 15 * m.S, ry: 15 * m.S,
                    id: 'layout2-meta' 
                });
                w.canvas.add(pBorder);
                
                for(let i=0; i<5; i++) { 
                    let rect = new w.fabric.Rect({ 
                        left: pStartX + gap + i*(boxW+gap), top: pStartY + gap, 
                        width: boxW, height: boxH, rx: 10*m.S, ry: 10*m.S, fill: '#000', id: 'palette-rect' 
                    }); 
                    w.canvas.add(rect); w.paletteRects.push(rect); 
                }
                
                const coverY = m.OY + margin + (500 * m.S);
                img.scaleToWidth(coverSize);
                img.set({ left: m.OX + margin, top: coverY, id: 'main-cover' });
                w.canvas.add(img);
                
                const bottomY = coverY + coverSize + (150 * m.S);
                let trackYLeft = bottomY;
                let trackYRight = bottomY;
                let leftColX = m.OX + margin + (50 * m.S);
                let rightColX = m.OX + margin + (1100 * m.S);
                let colW = 900 * m.S;
                
                let tCount = d.tracks.data.length;
                let trackFontSize = (tCount <= 10) ? 90 * m.S : (tCount <= 16) ? 75 * m.S : (tCount <= 22) ? 60 * m.S : 48 * m.S;
                
                const halfTracks = Math.ceil(d.tracks.data.length / 2);
                d.tracks.data.forEach((tObj: any, i: number) => {
                    let tNum = i + 1;
                    let trackName = tObj.title.replace(/^\d+\.\s*/, '').replace(/\s*\(.*?\)\s*/g, '').replace(/\s*\[.*?\]\s*/g, '').trim();
                    let tText = `${tNum}. ${trackName}`;
                    let txt = new w.fabric.Textbox(tText, { width: colW, fontSize: trackFontSize, fontFamily: 'Inter', fontWeight: 500, fill: textColor, id: 'track-text', lineHeight: 1.2 });
                    
                    if (i < halfTracks) {
                        txt.set({ left: leftColX, top: trackYLeft });
                        trackYLeft += txt.height + (trackFontSize * 0.4);
                    } else {
                        txt.set({ left: rightColX, top: trackYRight });
                        trackYRight += txt.height + (trackFontSize * 0.4);
                    }
                    w.canvas.add(txt);
                });
                
                const metaX = m.OX + canvasW - margin - (50 * m.S);
                let metaY = bottomY + (200 * m.S); 
                
                const metaItems =[
                    { l: "Album Length", v: `${durationMins} minutes` },
                    { l: "Release Date", v: dateStr },
                    { l: "Produced by", v: d.artist.name } 
                ];
                
                metaItems.forEach(mi => {
                    let mLbl = new w.fabric.IText(mi.l, { left: metaX, top: metaY, fontSize: 60 * m.S, fontFamily: 'Inter', fontWeight: 700, fill: textColor, originX: 'right', textAlign: 'right', id: 'meta-lbl' });
                    w.canvas.add(mLbl);
                    metaY += mLbl.height + (15 * m.S);
                    
                    let mVal = new w.fabric.IText(mi.v, { left: metaX, top: metaY, fontSize: 50 * m.S, fontFamily: 'Inter', fontWeight: 400, fill: textColor, opacity: 0.8, originX: 'right', textAlign: 'right', id: 'meta-val' });
                    w.canvas.add(mVal);
                    metaY += mVal.height + (80 * m.S);
                });

                await w.extractPalettePromise(d.cover_xl); 
                const currentTheme = (document.getElementById('themeSelect') as HTMLSelectElement).value;
                await w.applyTheme(currentTheme);
                
                await new Promise((res) => {
                    w.fabric.Image.fromURL('/musicpostershop.png', function(bImg: any) {
                        if(bImg) {
                            bImg.scaleToWidth(150 * m.S); 
                            bImg.set({ left: m.OX + ((4961 * m.S) / 2), top: m.OY + ((7016 * m.S) - (100 * m.S)), originX: 'center', originY: 'bottom', id: 'custom-site-barcode' });
                            w.canvas.add(bImg);
                        }
                        res(true);
                    }, { crossOrigin: 'anonymous' });
                });
                w.canvas.requestRenderAll(); 
                setTimeout(() => resolve(true), 50);
            }, { crossOrigin: 'anonymous' });
        });
    }

    w.renderVinyl = async function(d: any) {
        return new Promise(async (resolve) => {
            w.currentImg = d.cover_xl; w.albumTitle = d.title;
            const m = w.getLayoutMetrics();
            
            const dateArr = d.release_date.split('-'); 
            const year = dateArr[0];
            const monthStr = months[parseInt(dateArr[1])-1];
            const releasedStr = `RELEASED ${monthStr.toUpperCase()} ${year}`;
            
            w.canvas.clear(); w.paletteRects =[];
            let goldColor = "#dfaa54";

            await w.updateBlurSettingsPromise();

            w.fabric.Image.fromURL(d.cover_xl, async function(coverImg: any) {
                
                let fullSVG: any = null, halfSVG: any = null;

                try {
                    await new Promise((r) => w.fabric.loadSVGFromURL('/goldfull1.svg', (objs: any, opts: any) => {
                        if(objs && objs.length > 0) fullSVG = w.fabric.util.groupSVGElements(objs, opts); r(true);
                    }));
                    await new Promise((r) => w.fabric.loadSVGFromURL('/goldhalf1.svg', (objs: any, opts: any) => {
                        if(objs && objs.length > 0) halfSVG = w.fabric.util.groupSVGElements(objs, opts); r(true);
                    }));
                } catch(e) { console.error("SVG Load Error", e); }

                const canvasW = 4961 * m.S;
                const canvasH = 7016 * m.S;

                const FULL_VINYL_SCALE = 0.8;  
                const HALF_VINYL_SCALE = 0.95; 

                const padding = 400 * m.S;
                const baseVinylArea = canvasW - (padding * 2);
                
                const vinylSize = baseVinylArea * FULL_VINYL_SCALE;
                const vinylX = m.OX + (canvasW / 2); 
                const vinylY = m.OY + padding + (baseVinylArea / 2);

                const bottomAreaStartX = m.OX + padding;
                const bottomAreaEndX = m.OX + canvasW - padding;

                const coverSize = baseVinylArea * 0.35;
                const coverX = bottomAreaStartX;
                const bottomY = m.OY + canvasH - coverSize - (400 * m.S);

                const coverRightEdge = coverX + coverSize;
                const overlap = 5 * m.S; 
                
                const cdHeight = coverSize * HALF_VINYL_SCALE; 

                const boxX = coverRightEdge - overlap;
                const boxH = coverSize * 0.75; 
                const boxW = bottomAreaEndX - boxX; 
                const boxY = bottomY + (coverSize / 2) - (boxH / 2); 

                let objectsToAdd =[];

                let infoBox = new w.fabric.Rect({
                    left: boxX, top: boxY, width: boxW, height: boxH,
                    fill: '#110a08', stroke: goldColor, strokeWidth: 10 * m.S,
                    id: 'info-box'
                });
                objectsToAdd.push(infoBox);

                const visibleBoxX = boxX + (cdHeight / 2); 
                const visibleBoxW = boxW - (cdHeight / 2);
                const textCenterX = visibleBoxX + (visibleBoxW / 2);
                let maxTextW = visibleBoxW * 0.85;

                let bArtist = w.createSmartText(d.artist.name, { left: textCenterX, top: boxY + (boxH * 0.3), fontSize: 240 * m.S, fontFamily: 'Allura', fill: '#fff', originX: 'center', originY: 'center', id: 'box-text', textAlign: 'center', lineHeight: 1 }, maxTextW, boxH * 0.3);
                
                let bAlbum = w.createSmartText(d.title.toUpperCase(), { left: textCenterX, top: boxY + (boxH * 0.6), fontSize: 70 * m.S, fontFamily: 'Montserrat', fontWeight: 600, fill: '#eee', originX: 'center', originY: 'center', id: 'box-text', textAlign: 'center', lineHeight: 1.1 }, maxTextW, boxH * 0.2);

                let bDateObj = new w.fabric.IText(releasedStr, { left: textCenterX, top: boxY + (boxH * 0.8), fontSize: 50 * m.S, fontFamily: 'Montserrat', fontWeight: 400, fill: '#ccc', originX: 'center', originY: 'center', id: 'box-text' });
                
                objectsToAdd.push(bArtist, bAlbum, bDateObj);

                if (halfSVG) {
                    halfSVG.scaleToHeight(cdHeight);
                    halfSVG.set({ left: coverRightEdge - overlap, top: bottomY + (coverSize / 2), originX: 'center', originY: 'center', id: 'vinyl-half' });
                    objectsToAdd.push(halfSVG);
                }

                coverImg.scaleToWidth(coverSize);
                coverImg.set({ left: coverX, top: bottomY, id: 'main-cover' });
                objectsToAdd.push(coverImg);

                if (fullSVG) {
                    fullSVG.scaleToWidth(vinylSize);
                    fullSVG.set({ left: vinylX, top: vinylY, originX: 'center', originY: 'center', id: 'vinyl-full' });
                    objectsToAdd.push(fullSVG);
                }

                objectsToAdd.forEach(obj => w.canvas.add(obj));

                await w.extractPalettePromise(d.cover_xl); 
                const currentTheme = (document.getElementById('themeSelect') as HTMLSelectElement).value;
                await w.applyTheme(currentTheme); 
                
                await new Promise((res) => {
                    w.fabric.Image.fromURL('/musicpostershop.png', function(bImg: any) {
                        if(bImg) {
                            bImg.scaleToWidth(150 * m.S); 
                            bImg.set({ left: m.OX + ((4961 * m.S) / 2), top: m.OY + ((7016 * m.S) - (100 * m.S)), originX: 'center', originY: 'bottom', id: 'custom-site-barcode' });
                            w.canvas.add(bImg);
                        }
                        res(true);
                    }, { crossOrigin: 'anonymous' });
                });
                w.canvas.requestRenderAll();
                setTimeout(() => resolve(true), 100);

            }, { crossOrigin: 'anonymous' });
        });
    };

    w.renderClassic = async function(d: any) {
        return new Promise(async (resolve) => {
            w.currentImg = d.cover_xl; w.albumTitle = d.title;
            const m = w.getLayoutMetrics();
            
            const dateArr = d.release_date.split('-');
            const day = parseInt(dateArr[2]);
            const monthsEn =["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
            const dateStr = `${day} ${monthsEn[parseInt(dateArr[1])-1]} ${dateArr[0]}`;
            
            const recYear = parseInt(dateArr[0]);
            const recordedStr = `${recYear - 1}-${recYear}`;
            
            const hr = Math.floor(d.duration / 3600); 
            const min = Math.floor((d.duration % 3600) / 60); 
            const sec = d.duration % 60;
            const lengthStr = hr > 0 ? `${hr}:${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}` : `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;

            w.canvas.clear(); w.paletteRects =[];
            let textColor = (document.getElementById('lineColorPicker') as HTMLInputElement).value || "#111111";

            await w.updateBlurSettingsPromise();

            w.fabric.Image.fromURL(d.cover_xl, async function(img: any) {
                const margin = 350 * m.S;
                const canvasW = 4961 * m.S;
                const coverSize = canvasW - (margin * 2);
                
                img.scaleToWidth(coverSize);
                img.set({ left: m.OX + margin, top: m.OY + margin, id: 'main-cover' });
                w.canvas.add(img);
                
                let currentY = m.OY + margin + coverSize + (150 * m.S);
                
                const boxSize = 150 * m.S; 
                const gap = 20 * m.S;
                const pWidth = (boxSize * 4) + (gap * 3);
                const maxTitleW = coverSize - pWidth - (100 * m.S);
                
                let titleClean = d.title.replace(/\s*\(.*?\)\s*/g, '').replace(/\s*\[.*?\]\s*/g, '').trim().toUpperCase();
                let titleText = w.createSmartText(titleClean, { left: m.OX + margin, top: currentY, fontSize: 180 * m.S, fontFamily: 'Inter', fontWeight: 800, fill: textColor, id: 'title-text', lineHeight: 1.1 }, maxTitleW, 400 * m.S);
                w.canvas.add(titleText);
                
                let artistClean = d.artist.name.replace(/\s*\(.*?\)\s*/g, '').replace(/\s*\[.*?\]\s*/g, '').trim();
                let artistText = w.createSmartText(artistClean, { left: m.OX + margin, top: currentY + titleText.height + (20 * m.S), fontSize: 80 * m.S, fontFamily: 'Inter', fontStyle: 'italic', fontWeight: 400, fill: textColor, id: 'artist-text', lineHeight: 1.1 }, maxTitleW, 200 * m.S);
                w.canvas.add(artistText);

                const pStartX = m.OX + canvasW - margin - pWidth;
                const textCenterY = titleText.top + (titleText.height / 2);
                const pStartY = textCenterY - (boxSize / 2);

                for(let i=0; i<4; i++) { 
                    let rect = new w.fabric.Rect({ left: pStartX + i*(boxSize+gap), top: pStartY, width: boxSize, height: boxSize, fill: '#000', id: 'palette-rect' }); 
                    w.canvas.add(rect); w.paletteRects.push(rect); 
                }

                let trackStartY = currentY + titleText.height + artistText.height + (160 * m.S);
                let totalTracks = d.tracks.data.length;
                let baseCount = Math.floor(totalTracks / 4);
                let remainder = totalTracks % 4;
                
                let colSizes =[ baseCount + (remainder > 0 ? 1 : 0), baseCount + (remainder > 1 ? 1 : 0), baseCount + (remainder > 2 ? 1 : 0), baseCount ];

                let tCount = d.tracks.data.length;
                let trackFontSize = (tCount <= 12) ? 75 * m.S : (tCount <= 20) ? 60 * m.S : 50 * m.S;

                let colW = (coverSize * 0.22); 
                let gridGap = (coverSize - (colW * 4)) / 3;
                
                let trackTexts: any[] = [];
                let currentYPerCol = [trackStartY, trackStartY, trackStartY, trackStartY];

                d.tracks.data.forEach((tObj: any, i: number) => {
                    let colIndex = 0; let passed = 0;
                    for (let c = 0; c < 4; c++) { if (i < passed + colSizes[c]) { colIndex = c; break; } passed += colSizes[c]; }
                    
                    let tNum = i + 1;
                    let trackName = tObj.title.replace(/^\d+\.\s*/, '').replace(/\s*\(.*?\)\s*/g, '').replace(/\s*\[.*?\]\s*/g, '').trim();
                    let tText = `${tNum}. ${trackName}`;
                    
                    let txt = new w.fabric.Textbox(tText, { width: colW, fontSize: trackFontSize, fontFamily: 'Inter', fontWeight: 500, fill: textColor, id: 'track-text', lineHeight: 1.2 });
                    
                    txt.set({ left: m.OX + margin + (colIndex * (colW + gridGap)), top: currentYPerCol[colIndex] });
                    w.canvas.add(txt);
                    
                    currentYPerCol[colIndex] += txt.height + (trackFontSize * 0.5);
                });
                
                let footerY = m.OY + (7016 * m.S) - margin - (150 * m.S);

                const footerData =[
                    { lbl: "RELEASED", val: dateStr, align: 'left' },
                    { lbl: "RECORDED", val: recordedStr, align: 'center' },
                    { lbl: "LENGTH", val: lengthStr, align: 'right' }
                ];

                footerData.forEach((item) => {
                    let fX = 0;
                    if (item.align === 'left') fX = m.OX + margin;
                    else if (item.align === 'center') fX = m.OX + (canvasW / 2);
                    else if (item.align === 'right') fX = m.OX + canvasW - margin;

                    let lbl = new w.fabric.IText(item.lbl, { left: fX, top: footerY, fontSize: 70 * m.S, fontFamily: 'Inter', fontWeight: 800, fill: textColor, originX: item.align, textAlign: item.align, id: 'meta-lbl' });
                    let val = new w.fabric.IText(item.val, { left: fX, top: footerY + lbl.height + (20 * m.S), fontSize: 50 * m.S, fontFamily: 'Inter', fontWeight: 500, fill: textColor, originX: item.align, textAlign: item.align, id: 'meta-val' });
                    w.canvas.add(lbl, val);
                });

                await w.extractPalettePromise(d.cover_xl); 
                const currentTheme = (document.getElementById('themeSelect') as HTMLSelectElement).value;
                await w.applyTheme(currentTheme);
                
                await new Promise((res) => {
                    w.fabric.Image.fromURL('/musicpostershop.png', function(bImg: any) {
                        if(bImg) {
                            bImg.scaleToWidth(150 * m.S); 
                            bImg.set({ left: m.OX + ((4961 * m.S) / 2), top: m.OY + ((7016 * m.S) - (100 * m.S)), originX: 'center', originY: 'bottom', id: 'custom-site-barcode' });
                            w.canvas.add(bImg);
                        }
                        res(true);
                    }, { crossOrigin: 'anonymous' });
                });
                w.canvas.requestRenderAll(); 
                setTimeout(() => resolve(true), 50);

            }, { crossOrigin: 'anonymous' });
        });
    }

    w.applyTheme = async function(theme: string) {
        let layout = (document.getElementById('layoutSelect') as HTMLSelectElement).value;
        let frameColor = "#ffffff"; let textColor = "#212121"; let subTextColor = "#444444"; let descColor = "#333333"; let lineColor = "#222222";
        
        if (theme === 'light') { frameColor = "#f5f5f5"; textColor = "#212121"; subTextColor = "#444444"; descColor = "#333333"; lineColor = "#222222"; } 
        else if (theme === 'dark') { frameColor = "#111111"; textColor = "#f5f5f5"; subTextColor = "#cccccc"; descColor = "#dddddd"; lineColor = "#eeeeee"; } 
        else if (theme === 'blurry') { textColor = "#f5f5f5"; subTextColor = "#eeeeee"; descColor = "#f5f5f5"; lineColor = "#ffffff"; } 
        else if (theme === 'colorful') { 
            frameColor = (document.getElementById('p1') as HTMLInputElement).value || "#d68c5b"; 
            if (w.getContrastYIQ(frameColor) === 'light') {
                textColor = "#111111"; subTextColor = "#333333"; descColor = "#222222"; lineColor = "#000000";
            } else {
                textColor = "#f5f5f5"; subTextColor = "#eeeeee"; descColor = "#f5f5f5"; lineColor = "#ffffff";
            }
        }

        const fcInput = document.getElementById('frameColorPicker') as HTMLInputElement;
        const fcTxt = document.getElementById('frameColorPicker-txt') as HTMLInputElement;
        if(fcInput) fcInput.value = frameColor;
        if(fcTxt) fcTxt.value = frameColor;
        
        if (theme !== 'blurry' && !(document.getElementById('blurToggle') as HTMLInputElement).checked) { 
            w.canvas.setBackgroundImage(null, () => {}); 
            w.canvas.setBackgroundColor(frameColor, () => {}); 
        }

        const lcInput = document.getElementById('lineColorPicker') as HTMLInputElement;
        const lcTxt = document.getElementById('lineColorPicker-txt') as HTMLInputElement;
        if(lcInput) lcInput.value = lineColor;
        if(lcTxt) lcTxt.value = lineColor;
        if(w.separatorLine) { w.separatorLine.set('fill', lineColor); }
        
        if(theme === 'blurry') {
            (document.getElementById('blurToggle') as HTMLInputElement).checked = true;
        } else {
            (document.getElementById('blurToggle') as HTMLInputElement).checked = false;
        }
        
        await w.updateBlurSettingsPromise();

        w.canvas.getObjects().forEach((obj: any) => {
            if (['artist-text', 'meta-val', 'meta-lbl', 'title-text', 'track-text', 'signature-text', 'layout2-meta'].includes(obj.id)) { 
                if (obj.type !== 'rect') {
                    if (obj.id === 'layout2-meta' && obj.type === 'rect') {
                        obj.set('stroke', textColor);
                    } else {
                        obj.set('fill', (obj.id === 'meta-val' || (obj.id === 'artist-text' && (layout === 'standart' || layout === 'modern'))) ? subTextColor : textColor); 
                    }
                }
            }
            if (obj.id === 'desc-text') obj.set('fill', descColor);
            
            if (layout === 'modern' && obj.id === 'layout2-meta' && obj.type === 'rect') {
                obj.set('stroke', textColor);
            }
        });
        
        w.canvas.requestRenderAll();
    };

    w.handleThemeChange = async function(newTheme: string) {
        let l = (document.getElementById('layoutSelect') as HTMLSelectElement).value;
        if (!w.activeAlbumData) { await w.applyTheme(newTheme); return; }
        w.saveCurrentStateToMemory(); 
        await w.applyTheme(newTheme);
        w.currentVariantKey = `${l}_${newTheme}`;
        w.saveCurrentStateToMemory();
        w.saveState();
    };

    w.handleLayoutChange = async function(newLayout: string) {
        let t_theme = (document.getElementById('themeSelect') as HTMLSelectElement).value; 
        if (!w.activeAlbumData) { await w.applyTheme(t_theme); return; }
        w.saveCurrentStateToMemory();
        let newKey = `${newLayout}_${t_theme}`;
        if (w.variantStates[newKey]) {
            w.editVariant(newLayout, t_theme); 
        } else {
            w.currentVariantKey = newKey;
            w.showLoading("Loading editor..."); 
            w.isBatchGenerating = true;
            try {
                if(newLayout === 'standart') await w.renderStandard(w.activeAlbumData); 
                else if(newLayout === 'vinyl') await w.renderVinyl(w.activeAlbumData); 
                else if(newLayout === 'modern') await w.renderModern(w.activeAlbumData);
                else if(newLayout === 'classic') await w.renderClassic(w.activeAlbumData);
                else await w.renderMinimal(w.activeAlbumData);
            } catch(e) {} finally {
                w.isBatchGenerating = false;
                w.saveState(); w.saveCurrentStateToMemory(); w.hideLoading();
            }
        }
    };

    w.applyImageFilter = function(type: string) {
        let obj = w.canvas.getActiveObject(); if (!obj || obj.type !== 'image') return;
        obj.filters =[]; if (type === 'grayscale') obj.filters.push(new w.fabric.Image.filters.Grayscale()); if (type === 'sepia') obj.fabric.Image.filters.push(new w.fabric.Image.filters.Sepia()); if (type === 'vintage') obj.filters.push(new w.fabric.Image.filters.Vintage());
        obj.applyFilters(); w.canvas.requestRenderAll(); w.saveState(); w.saveCurrentStateToMemory();
    };

    w.updateFrameColor = function(v: string) { if (!(document.getElementById('blurToggle') as HTMLInputElement).checked) { w.canvas.setBackgroundImage(null, () => w.canvas.renderAll()); w.canvas.setBackgroundColor(v, () => w.canvas.renderAll()); } w.saveCurrentStateToMemory(); };
    w.updateLineColor = function(v: string) { if(w.separatorLine) { w.separatorLine.set('fill', v); w.canvas.requestRenderAll(); if(!w.isBatchGenerating) w.saveState(); w.saveCurrentStateToMemory(); } };
    
    w.syncPropertyToAllVariants = function(activeObj: any, prop: string, val: any, exactIndex = -1) {
        if (!activeObj || !activeObj.id || w.isBatchGenerating) return;
        
        const protectedProps = ['left', 'top', 'scaleX', 'scaleY', 'width', 'height', 'angle'];
        if (protectedProps.includes(prop)) return; 

        let allWithId = w.canvas.getObjects().filter((o: any) => o.id === activeObj.id);
        let targetIndex = exactIndex > -1 ? exactIndex : allWithId.indexOf(activeObj);
        if (targetIndex === -1) return;
        
        for (let key in w.variantStates) {
            if (key === w.currentVariantKey) continue; 
            try {
                let stateObj = w.variantStates[key];
                let objects = stateObj.objects;
                let matches = objects.filter((o: any) => o.id === activeObj.id);
                if (matches[targetIndex]) {
                    matches[targetIndex][prop] = val;
                }
            } catch(e) {}
        }
    };

    w.setPalette = function(i: number, c: string) { 
        const b = document.getElementById('p'+(i+1)) as HTMLInputElement; 
        const t = document.getElementById('p'+(i+1)+'-txt') as HTMLInputElement; 
        if(b) b.value = c; 
        if(t) t.value = c;
        if(w.paletteRects && w.paletteRects[i]) { 
            w.paletteRects[i].set('fill', c); w.canvas.requestRenderAll(); w.saveCurrentStateToMemory(); 
            w.syncPropertyToAllVariants(w.paletteRects[i], 'fill', c, i);
        } 
        const currentTheme = (document.getElementById('themeSelect') as HTMLSelectElement).value;
        if(currentTheme === 'colorful' && i === 0) w.applyTheme('colorful');
    };

    w.generateAllVariants = async function() {
        if(!w.activeAlbumData) { w.showToast("⚠ Please search and select an album first!"); return; }

        const layouts = w.selectedLayouts && w.selectedLayouts.length > 0 ? w.selectedLayouts : ['standart'];
        const totalVariants = layouts.length * 4;
        
        w.showLoading("Generating variants...", `${totalVariants} designs are being created, please wait...`); 
        w.isBatchGenerating = true; w.variantStates = {}; 
        const wasGridOn = w.isGridEnabled; if (wasGridOn) w.toggleGrid(false);

        const themes =['light', 'dark', 'blurry', 'colorful']; 
        const variantsData =[];
        await w.extractPalettePromise(w.activeAlbumData.cover_xl);

        for (let l of layouts) {
            for (let t_theme of themes) { 
                (document.getElementById('layoutSelect') as HTMLSelectElement).value = l; (document.getElementById('themeSelect') as HTMLSelectElement).value = t_theme;
                if (l === 'standart') await w.renderStandard(w.activeAlbumData); 
                else if (l === 'vinyl') await w.renderVinyl(w.activeAlbumData);
                else if (l === 'modern') await w.renderModern(w.activeAlbumData);
                else if (l === 'classic') await w.renderClassic(w.activeAlbumData);
                else await w.renderMinimal(w.activeAlbumData);
                
                let key = `${l}_${t_theme}`;
                w.variantStates[key] = w.canvas.toJSON(w.PROPS_TO_SAVE);
                
                try {
                    const dynamicMultiplier = 560 / w.canvas.getHeight();
                    const previewUrl = w.canvas.toDataURL({ format: 'jpeg', quality: 0.9, multiplier: dynamicMultiplier });
                    variantsData.push({ layout: l, theme: t_theme, url: previewUrl, key: key });
                } catch(e) {
                    variantsData.push({ layout: l, theme: t_theme, url: '', key: key });
                }
            }
        }

        w.latestVariantsData = variantsData;

        if (wasGridOn) w.toggleGrid(true); w.isBatchGenerating = false;

        const grid = document.getElementById('variants-grid');
        if(grid) {
            grid.innerHTML = variantsData.map((v) => `
                <div class="variant-card" onclick="window.editVariant('${v.layout}', '${v.theme}')">
                    <img id="preview_${v.key}" src="${v.url}">
                    <div class="variant-info">
                        <div class="variant-layout">${v.layout.toUpperCase()}</div>
                        <div class="variant-theme">${v.theme} THEME</div>
                    </div>
                    <div class="variant-actions">
                        <button onclick="event.stopPropagation(); window.downloadLowResSingle('${v.url}', '${v.layout}', '${v.theme}')" class="sidebar-download-btn btn-dark" style="padding:10px;" title="Download Preview (Low Res)"><i class="fas fa-download"></i></button>
                        <button class="sidebar-download-btn btn-accent" style="padding:10px; flex:2;">EDIT THIS POSTER</button>
                    </div>
                </div>
            `).join('');
        }

        w.currentVariantKey = `${layouts[0]}_light`;
        (document.getElementById('layoutSelect') as HTMLSelectElement).value = layouts[0]; 
        (document.getElementById('themeSelect') as HTMLSelectElement).value = 'light';
        
        w.canvas.loadFromJSON(w.variantStates[w.currentVariantKey], () => { 
            w.canvas.requestRenderAll(); w.historyStack=[]; w.redoStack=[]; w.saveState(); w.hideLoading(); w.showVariantsView(); 
        });
    };

    w.editVariant = async function(layout: string, theme: string) {
        if (!w.activeAlbumData) return; 
        
        w.saveCurrentStateToMemory();
        w.currentVariantKey = `${layout}_${theme}`;
        (document.getElementById('layoutSelect') as HTMLSelectElement).value = layout; (document.getElementById('themeSelect') as HTMLSelectElement).value = theme;
        
        w.showLoading("Loading editor..."); 
        w.isBatchGenerating = true; 
        
        try {
            if (w.variantStates[w.currentVariantKey]) {
                await new Promise(r => { w.canvas.loadFromJSON(w.variantStates[w.currentVariantKey], () => { w.canvas.requestRenderAll(); r(true); }); });
            } else {
                if (layout === 'standart') await w.renderStandard(w.activeAlbumData); 
                else if (layout === 'vinyl') await w.renderVinyl(w.activeAlbumData);
                else if (layout === 'modern') await w.renderModern(w.activeAlbumData);
                else if (layout === 'classic') await w.renderClassic(w.activeAlbumData);
                else await w.renderMinimal(w.activeAlbumData);
            }
        } catch(e) {} finally {
            w.isBatchGenerating = false; w.historyStack=[]; w.redoStack=[]; w.saveState(); w.hideLoading(); w.showSingleEditor();
        }
    };

    w.changeDpiDataUrl = function(base64: string, dpi: number) {
        const dataArray = new Uint8Array(atob(base64.split(',')[1]).split('').map(c => c.charCodeAt(0)));
        const format = 'image/png';
        const ppm = Math.round(dpi / 0.0254);
        let offset = 8;
        while (offset < dataArray.length) {
            const length = (dataArray[offset] << 24) | (dataArray[offset + 1] << 16) | (dataArray[offset + 2] << 8) | dataArray[offset + 3];
            const type = String.fromCharCode(dataArray[offset + 4], dataArray[offset + 5], dataArray[offset + 6], dataArray[offset + 7]);
            if (type === 'IHDR') {
                const newCanvasData = new Uint8Array(dataArray.length + 21);
                newCanvasData.set(dataArray.subarray(0, offset + 12 + length), 0);
                const phys = new Uint8Array([0, 0, 0, 9, 112, 72, 89, 115, (ppm >> 24) & 0xFF, (ppm >> 16) & 0xFF, (ppm >> 8) & 0xFF, ppm & 0xFF, (ppm >> 24) & 0xFF, (ppm >> 16) & 0xFF, (ppm >> 8) & 0xFF, ppm & 0xFF, 1]);
                let crc = 0xFFFFFFFF;
                for (let i = 4; i < 17; i++) { crc ^= phys[i]; for (let j = 0; j < 8; j++) { crc = (crc & 1) ? (crc >>> 1) ^ 0xEDB88320 : crc >>> 1; } }
                crc ^= 0xFFFFFFFF;
                const physCrc = new Uint8Array([ (crc >> 24) & 0xFF, (crc >> 16) & 0xFF, (crc >> 8) & 0xFF, crc & 0xFF ]);
                newCanvasData.set(phys, offset + 12 + length);
                newCanvasData.set(physCrc, offset + 12 + length + 17);
                newCanvasData.set(dataArray.subarray(offset + 12 + length), offset + 12 + length + 21);
                let binary = ''; const chunk = 8192;
                for (let i = 0; i < newCanvasData.length; i += chunk) { binary += String.fromCharCode.apply(null, Array.from(newCanvasData.subarray(i, i + chunk))); }
                return 'data:' + format + ';base64,' + btoa(binary);
            }
            offset += 12 + length;
        }
        return base64;
    };

    w.downloadPoster = function(type: string) {
        if (!w.activeAlbumData && !w.currentImg) return w.showToast("⚠ Please create a design first.");

        if (w.currentViewMode === 'gallery') {
            if (!w.latestVariantsData || w.latestVariantsData.length === 0) {
                return w.showToast("⚠ No variants to download.");
            }
            w.showLoading(`Preparing ZIP with High-Res ${type.toUpperCase()}s...`, "Processing original 300 DPI dimensions for all variants. This may take a moment.");
            
            setTimeout(async () => {
                try {
                    if (!(window as any).JSZip) {
                        await new Promise((resolve, reject) => {
                            const script = document.createElement('script');
                            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
                            script.onload = resolve;
                            script.onerror = reject;
                            document.head.appendChild(script);
                        });
                    }

                    const zip = new (window as any).JSZip();
                    const dims = w.getCurrentDimensions();
                    const cleanTitle = w.albumTitle ? w.albumTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase() : 'poster';
                    
                    const currentState = w.canvas.toJSON(w.PROPS_TO_SAVE);

                    for (let i = 0; i < w.latestVariantsData.length; i++) {
                        const v = w.latestVariantsData[i];
                        const state = w.variantStates[v.key];
                        if (!state) continue;

                        await new Promise(r => w.canvas.loadFromJSON(state, () => { r(true); }));
                        w.canvas.renderAll();

                        const multiplier = dims.w / w.canvas.getWidth();
                        const filename = `${cleanTitle}_${v.layout}_${v.theme}_300DPI.${type}`;

                        if (type === 'svg') {
                            const svgData = w.canvas.toSVG({
                                width: dims.w,
                                height: dims.h,
                                viewBox: { x: 0, y: 0, width: w.canvas.getWidth(), height: w.canvas.getHeight() }
                            });
                            zip.file(filename, svgData);
                        } else if (type === 'pdf') {
                            const imgData = w.canvas.toDataURL({ format: 'jpeg', quality: 1.0, multiplier: multiplier });
                            const { jsPDF } = w.jspdf;
                            const pdf = new jsPDF({ orientation: dims.w > dims.h ? 'landscape' : 'portrait', unit: 'px', format: [dims.w, dims.h] });
                            pdf.addImage(imgData, 'JPEG', 0, 0, dims.w, dims.h);
                            zip.file(filename, pdf.output('arraybuffer')); 
                        } else {
                            const rawUrl = w.canvas.toDataURL({ format: 'png', multiplier: multiplier });
                            const dpiUrl = w.changeDpiDataUrl(rawUrl, 300);
                            const base64Data = dpiUrl.split(',')[1]; 
                            zip.file(filename, base64Data, { base64: true }); 
                        }
                    }

                    await new Promise(r => w.canvas.loadFromJSON(currentState, () => { r(true); }));
                    w.canvas.renderAll();

                    const content = await zip.generateAsync({ type: "blob" });
                    const link = document.createElement('a');
                    link.href = URL.createObjectURL(content);
                    link.download = `${cleanTitle}_all_variants_${type.toUpperCase()}.zip`;
                    link.click();
                    URL.revokeObjectURL(link.href);

                    w.hideLoading();
                    w.showToast(`✓ ZIP File Downloaded!`);

                } catch (err) {
                    console.error(err);
                    w.hideLoading();
                    w.showToast("⚠ Error generating ZIP file.");
                }
            }, 100);

        } else {
            w.showLoading(`Preparing High-Res ${type.toUpperCase()}...`, "Processing original 300 DPI dimensions.");
            
            setTimeout(async () => {
                try {
                    const layout = (document.getElementById('layoutSelect') as HTMLSelectElement).value;
                    const theme = (document.getElementById('themeSelect') as HTMLSelectElement).value;
                    const cleanTitle = w.albumTitle ? w.albumTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase() : 'poster';
                    const filename = `${cleanTitle}_${layout}_${theme}_300DPI.${type}`;

                    const dims = w.getCurrentDimensions();
                    const multiplier = dims.w / w.canvas.getWidth();

                    if (type === 'svg') {
                        const svgData = w.canvas.toSVG({
                            width: dims.w,
                            height: dims.h,
                            viewBox: { x: 0, y: 0, width: w.canvas.getWidth(), height: w.canvas.getHeight() }
                        });
                        const blob = new Blob([svgData], { type: 'image/svg+xml' });
                        const link = document.createElement('a');
                        link.href = URL.createObjectURL(blob);
                        link.download = filename;
                        link.click();
                        URL.revokeObjectURL(link.href);

                    } else if (type === 'pdf') {
                        const imgData = w.canvas.toDataURL({ format: 'jpeg', quality: 1.0, multiplier: multiplier });
                        const { jsPDF } = w.jspdf;
                        const pdf = new jsPDF({ orientation: dims.w > dims.h ? 'landscape' : 'portrait', unit: 'px', format: [dims.w, dims.h] });
                        pdf.addImage(imgData, 'JPEG', 0, 0, dims.w, dims.h);
                        pdf.save(filename);

                    } else {
                        const rawUrl = w.canvas.toDataURL({ format: 'png', multiplier: multiplier });
                        const dpiUrl = w.changeDpiDataUrl(rawUrl, 300); 
                        const link = document.createElement('a');
                        link.href = dpiUrl;
                        link.download = filename;
                        link.click();
                    }
                    
                    w.hideLoading();
                    w.showToast(`✓ ${type.toUpperCase()} Downloaded (High Quality)!`);
                } catch (err) {
                    console.error(err);
                    w.hideLoading();
                    w.showToast("⚠ Error generating file.");
                }
            }, 100);
        }
    };

    w.downloadLowResPreviews = function() {
        if (w.currentViewMode === 'editor') {
            const dynamicMultiplier = 560 / w.canvas.getHeight();
            const rawUrl = w.canvas.toDataURL({ format: 'jpeg', quality: 0.9, multiplier: dynamicMultiplier });
            let currentLayout = (document.getElementById('layoutSelect') as HTMLSelectElement).value;
            let currentTheme = (document.getElementById('themeSelect') as HTMLSelectElement).value;
            
            w.applyWatermark(rawUrl).then((watermarkedUrl: string) => {
                w.downloadLowResSingle(watermarkedUrl, currentLayout, currentTheme);
            });
        } else {
            if (!w.latestVariantsData || w.latestVariantsData.length === 0) {
                w.showToast("⚠ No previews available.");
                return;
            }
            w.latestVariantsData.forEach((v: any) => {
                if(v.url) {
                    w.applyWatermark(v.url).then((watermarkedUrl: string) => {
                        w.downloadLowResSingle(watermarkedUrl, v.layout, v.theme);
                    });
                }
            });
        }
    };

    w.downloadLowResSingle = function(dataUrl: string, layout: string, theme: string) {
        if(!dataUrl) return;
        w.applyWatermark(dataUrl).then((watermarkedUrl: string) => {
            const link = document.createElement('a');
            link.download = `${w.albumTitle}_${layout}_${theme}_preview.jpg`;
            link.href = watermarkedUrl;
            link.click();
            w.showToast("✓ Preview Downloaded!");
        });
    };

    w.historyStack = []; w.redoStack =[]; w.isHistoryAction = false;
    w.saveState = function() { if(w.isHistoryAction || w.isBatchGenerating) return; w.redoStack =[]; w.historyStack.push(JSON.stringify(w.canvas)); w.saveCurrentStateToMemory(); };
    w.undo = function() { if (w.historyStack.length > 1) { w.isHistoryAction = true; w.redoStack.push(w.historyStack.pop()); w.canvas.loadFromJSON(w.historyStack[w.historyStack.length - 1], () => { w.canvas.renderAll(); w.updateLayersPanel(); w.isHistoryAction = false; w.saveCurrentStateToMemory(); }); } };
    w.redo = function() { if (w.redoStack.length > 0) { w.isHistoryAction = true; const state = w.redoStack.pop(); w.historyStack.push(state); w.canvas.loadFromJSON(state, () => { w.canvas.renderAll(); w.updateLayersPanel(); w.isHistoryAction = false; w.saveCurrentStateToMemory(); }); } };
    
    w.canvas.on('object:modified', (e: any) => { 
        w.saveState(); w.updateLayersPanel(); 
        if(e.target && e.target.type !== 'activeSelection') {
            w.syncPropertyToAllVariants(e.target, 'scaleX', e.target.scaleX);
            w.syncPropertyToAllVariants(e.target, 'scaleY', e.target.scaleY);
            w.syncPropertyToAllVariants(e.target, 'angle', e.target.angle);
        }
    }); 
    w.canvas.on('object:added', () => { w.updateLayersPanel(); }); w.canvas.on('object:removed', () => { w.updateLayersPanel(); });

    w.applyStyle = function(prop: string, val: any, extraProp: string = '') { 
        let obj = w.canvas.getActiveObject(); if(!obj) return; const m = w.getLayoutMetrics(); 
        
        const applyToObj = (o: any) => {
            if (prop === 'fontFamily') {
                w.syncReactFontState(val);
                o.set('fontFamily', val);
            } else if (prop === 'fontSize') { 
                o.set('fontSize', parseFloat(val) * m.S); o.set('scaleX', 1); o.set('scaleY', 1); 
            } else if (prop === 'shadow') {
                let currentShadow = o.shadow ? Object.assign({}, o.shadow) : { blur: 0, offsetX: 0, offsetY: 0, color: 'rgba(0,0,0,0.8)' };
                currentShadow[extraProp] = (extraProp === 'color') ? val : parseFloat(val) * m.S;
                o.set('shadow', new w.fabric.Shadow(currentShadow));
            } else if (prop === 'strokeWidth' || prop === 'rx' || prop === 'ry') {
                o.set(prop, parseFloat(val) * m.S);
            } else if (['left', 'top', 'charSpacing', 'lineHeight', 'opacity'].includes(prop)) {
                o.set(prop, parseFloat(val));
            } else if (prop === 'backgroundColor') {
                if (o.type === 'i-text' || o.type === 'textbox') o.set('textBackgroundColor', val);
                else o.set('fill', val); 
            } else if (prop === 'visible') {
                o.set('visible', val);
            } else {
                o.set(prop, val); 
            }
            o.set('dirty', true); o.setCoords();
            w.syncPropertyToAllVariants(o, prop, val); 
        };

        if (obj.type === 'activeSelection') { 
            obj.getObjects().forEach(applyToObj);
            obj.addWithUpdate(); 
        } else { 
            applyToObj(obj); 
        } 
        w.canvas.renderAll(); w.saveState(); 
    };
    
    w.toggleStyle = function(prop: string, val1: string, val2: string) { 
        let obj = w.canvas.getActiveObject(); if(!obj) return; 
        w.applyStyle(prop, obj.get(prop) === val1 ? val2 : val1); 
    };
    
    w.updateElementText = function(val: string) { 
        let obj = w.canvas.getActiveObject(); 
        if(obj && (obj.type === 'i-text' || obj.type === 'textbox' || obj.type === 'text')) { 
            obj.set('text', val); obj.set('dirty', true); obj.setCoords();
            w.canvas.renderAll(); w.saveState(); 
            w.syncPropertyToAllVariants(obj, 'text', val); 
        } 
    };
    
    w.deleteSelected = function() { let o = w.canvas.getActiveObjects(); if(o.length){ w.canvas.discardActiveObject(); o.forEach((x: any)=>w.canvas.remove(x)); w.saveState(); } };
    
    w.bringForward = function(manualObj: any = null) { 
        let o = manualObj || w.canvas.getActiveObject(); 
        if(o){ w.canvas.bringForward(o); w.canvas.requestRenderAll(); w.saveState(); w.updateLayersPanel(); } 
    };
    w.sendBackward = function(manualObj: any = null) { 
        let o = manualObj || w.canvas.getActiveObject(); 
        if(o){ w.canvas.sendBackwards(o); w.canvas.requestRenderAll(); w.saveState(); w.updateLayersPanel(); } 
    };
    
    w.toggleLock = function() { let o = w.canvas.getActiveObject(); if(!o) return; let l = !o.lockMovementX; o.set({ lockMovementX: l, lockMovementY: l, lockScalingX: l, lockScalingY: l, lockRotation: l, hasControls: !l, selectable: true }); w.canvas.requestRenderAll(); w.updateEditorPanel(); };

    w.replaceSelectedImage = function(file: any) {
        if (!file) return;
        let obj = w.canvas.getActiveObject();
        if (!obj || obj.type !== 'image') return w.showToast("⚠ Please select an image to replace.");
        const reader = new FileReader();
        reader.onload = function(f: any) {
            obj.setSrc(f.target.result, function() {
                obj.set('dirty', true);
                w.canvas.renderAll();
                w.saveState();
                w.saveCurrentStateToMemory();
            }, { crossOrigin: 'anonymous' });
        };
        reader.readAsDataURL(file);
    };

    w.alignObjects = function(alignType: string) {
        let activeObj = w.canvas.getActiveObject();
        if (!activeObj) return;

        const cw = w.canvas.getWidth();
        const ch = w.canvas.getHeight();

        if (activeObj.type === 'activeSelection') {
            const objs = activeObj.getObjects();
            const bound = activeObj.getBoundingRect();
            w.canvas.discardActiveObject(); 

            objs.forEach((obj: any) => {
                let wObj = obj.getScaledWidth();
                let hObj = obj.getScaledHeight();

                if (alignType === 'left') {
                    if (obj.originX === 'left') obj.set('left', bound.left);
                    else if (obj.originX === 'center') obj.set('left', bound.left + wObj/2);
                    else if (obj.originX === 'right') obj.set('left', bound.left + wObj);
                } else if (alignType === 'center') {
                    let centerX = bound.left + (bound.width / 2);
                    if (obj.originX === 'left') obj.set('left', centerX - wObj/2);
                    else if (obj.originX === 'center') obj.set('left', centerX);
                    else if (obj.originX === 'right') obj.set('left', centerX + wObj/2);
                } else if (alignType === 'right') {
                    let rightX = bound.left + bound.width;
                    if (obj.originX === 'left') obj.set('left', rightX - wObj);
                    else if (obj.originX === 'center') obj.set('left', rightX - wObj/2);
                    else if (obj.originX === 'right') obj.set('left', rightX);
                }

                if (alignType === 'top') {
                    if (obj.originY === 'top') obj.set('top', bound.top);
                    else if (obj.originY === 'center') obj.set('top', bound.top + hObj/2);
                    else if (obj.originY === 'bottom') obj.set('top', bound.top + hObj);
                } else if (alignType === 'middle') {
                    let centerY = bound.top + (bound.height / 2);
                    if (obj.originY === 'top') obj.set('top', centerY - hObj/2);
                    else if (obj.originY === 'center') obj.set('top', centerY);
                    else if (obj.originY === 'bottom') obj.set('top', centerY + hObj/2);
                } else if (alignType === 'bottom') {
                    let bottomY = bound.top + bound.height;
                    if (obj.originY === 'top') obj.set('top', bottomY - hObj);
                    else if (obj.originY === 'center') obj.set('top', bottomY - hObj/2);
                    else if (obj.originY === 'bottom') obj.set('top', bottomY);
                }
                obj.setCoords();
            });
            let sel = new w.fabric.ActiveSelection(objs, { canvas: w.canvas });
            w.canvas.setActiveObject(sel);

        } else {
            let wObj = activeObj.getScaledWidth();
            let hObj = activeObj.getScaledHeight();

            if (alignType === 'left') {
                if (activeObj.originX === 'left') activeObj.set('left', 0);
                else if (activeObj.originX === 'center') activeObj.set('left', wObj/2);
                else if (activeObj.originX === 'right') activeObj.set('left', wObj);
            } else if (alignType === 'center') {
                activeObj.centerH();
            } else if (alignType === 'right') {
                if (activeObj.originX === 'left') activeObj.set('left', cw - wObj);
                else if (activeObj.originX === 'center') activeObj.set('left', cw - wObj/2);
                else if (activeObj.originX === 'right') activeObj.set('left', cw);
            } else if (alignType === 'top') {
                if (activeObj.originY === 'top') activeObj.set('top', 0);
                else if (activeObj.originY === 'center') activeObj.set('top', hObj/2);
                else if (activeObj.originY === 'bottom') activeObj.set('top', hObj);
            } else if (alignType === 'middle') {
                activeObj.centerV();
            } else if (alignType === 'bottom') {
                if (activeObj.originY === 'top') activeObj.set('top', ch - hObj);
                else if (activeObj.originY === 'center') activeObj.set('top', ch - hObj/2);
                else if (activeObj.originY === 'bottom') activeObj.set('top', ch);
            }
            activeObj.setCoords();
            w.canvas.fire('object:modified', {target: activeObj});
        }
        
        w.canvas.requestRenderAll();
        w.saveState();
    };

    w.distributeObjects = function(axis: string) {
        let activeObj = w.canvas.getActiveObject();
        if (!activeObj || activeObj.type !== 'activeSelection') return;
        
        const objs = activeObj.getObjects();
        if (objs.length < 3) return; 

        w.canvas.discardActiveObject(); 

        const items = objs.map((obj: any) => {
            const bound = obj.getBoundingRect();
            return {
                obj,
                pos: axis === 'h' ? bound.left : bound.top,
                size: axis === 'h' ? bound.width : bound.height
            };
        }).sort((a: any, b: any) => a.pos - b.pos);

        const first = items[0];
        const last = items[items.length - 1];
        
        const totalSpan = (last.pos + last.size) - first.pos;
        const totalSize = items.reduce((sum: number, item: any) => sum + item.size, 0);
        const gap = (totalSpan - totalSize) / (items.length - 1);
        
        let cursor = first.pos + first.size + gap;

        for (let i = 1; i < items.length - 1; i++) {
            let it = items[i];
            if (axis === 'h') {
                it.obj.set('left', it.obj.left + (cursor - it.pos));
            } else {
                it.obj.set('top', it.obj.top + (cursor - it.pos));
            }
            it.obj.setCoords();
            cursor += it.size + gap;
        }

        let sel = new w.fabric.ActiveSelection(objs, { canvas: w.canvas });
        w.canvas.setActiveObject(sel);
        w.canvas.requestRenderAll();
        w.saveState();
    };

    w.isGridEnabled = false; w.GRID_SIZE = 50 * w.BASE_PREVIEW_SCALE; w.gridLines =[];
    w.toggleGridVisuals = function() {
        const dims = w.getCurrentDimensions();
        w.gridLines.forEach((l: any) => w.canvas.remove(l)); 
        w.gridLines =[];
        if (w.isGridEnabled) {
            for (let i = 0; i <= (dims.w * w.BASE_PREVIEW_SCALE / w.GRID_SIZE); i++) { let l = new w.fabric.Line([ i * w.GRID_SIZE, 0, i * w.GRID_SIZE, dims.h * w.BASE_PREVIEW_SCALE], { stroke: 'rgba(255,255,255,0.15)', strokeWidth: 1, selectable: false, evented: false, id: 'gridLine' }); w.gridLines.push(l); w.canvas.add(l); l.sendToBack(); }
            for (let i = 0; i <= (dims.h * w.BASE_PREVIEW_SCALE / w.GRID_SIZE); i++) { let l = new w.fabric.Line([ 0, i * w.GRID_SIZE, dims.w * w.BASE_PREVIEW_SCALE, i * w.GRID_SIZE], { stroke: 'rgba(255,255,255,0.15)', strokeWidth: 1, selectable: false, evented: false, id: 'gridLine' }); w.gridLines.push(l); w.canvas.add(l); l.sendToBack(); }
        } w.canvas.requestRenderAll();
    };
    w.toggleGrid = function(force: any = null) { w.isGridEnabled = (force !== null) ? force : (document.getElementById('gridToggle') as HTMLInputElement).checked; w.toggleGridVisuals(); };

    w.SNAP_DIST = 15 * w.BASE_PREVIEW_SCALE; w.guidelines =[];
    w.canvas.on('object:moving', function (e: any) {
        const obj = e.target; w.guidelines.forEach((line: any) => w.canvas.remove(line)); w.guidelines =[];
        if (w.isGridEnabled) { obj.set({ left: Math.round(obj.left / w.GRID_SIZE) * w.GRID_SIZE, top: Math.round(obj.top / w.GRID_SIZE) * w.GRID_SIZE }); return; }
        const objB = obj.getBoundingRect(), objCX = objB.left + objB.width/2, objCY = objB.top + objB.height/2;
        w.canvas.getObjects().forEach((target: any) => {
            if (target === obj || target.id === 'gridLine' || target.id === 'guideLine' || target.type === 'activeSelection') return;
            const tarB = target.getBoundingRect(), tarCX = tarB.left + tarB.width/2, tarCY = tarB.top + tarB.height/2;
            if (Math.abs(objCX - tarCX) < w.SNAP_DIST) { obj.set({ left: obj.left - (objCX - tarCX) }); w.drawGuide(tarCX, 'v'); }
            if (Math.abs(objCY - tarCY) < w.SNAP_DIST) { obj.set({ top: obj.top - (objCY - tarCY) }); w.drawGuide(tarCY, 'h'); }
            if (Math.abs(objB.left - tarB.left) < w.SNAP_DIST) { obj.set({ left: tarB.left }); w.drawGuide(tarB.left, 'v'); }
            if (Math.abs(objB.top - tarB.top) < w.SNAP_DIST) { obj.set({ top: tarB.top }); w.drawGuide(tarB.top, 'h'); }
        });
    });
    w.canvas.on('mouse:up', () => { w.guidelines.forEach((l: any) => w.canvas.remove(l)); w.guidelines =[]; });
    w.drawGuide = function(pos: number, axis: string) { const dims = w.getCurrentDimensions(); let coords = axis === 'v' ?[pos, 0, pos, dims.h * w.BASE_PREVIEW_SCALE] :[0, pos, dims.w * w.BASE_PREVIEW_SCALE, pos]; let line = new w.fabric.Line(coords, { stroke: '#e83e8c', strokeWidth: 1.5, selectable: false, evented: false, strokeDashArray:[10, 10], opacity: 0.8, id: 'guideLine' }); w.canvas.add(line); w.guidelines.push(line); };

    w.updateLayersPanel = function() {
        const list = document.getElementById('layers-panel'); if(!list) return; list.innerHTML = ''; let objs = w.canvas.getObjects();
        for (let i = objs.length - 1; i >= 0; i--) {
            let obj = objs[i]; if(obj.id === 'gridLine' || obj.id === 'guideLine') continue;
            let text = obj.type; 
            if(obj.type === 'i-text' || obj.type === 'textbox' || obj.type === 'text') text = obj.text.substring(0, 15) + '...'; 
            if(obj.id === 'main-cover') text = "Album Cover"; 
            if(obj.id === 'spotify-code') text = "Spotify Barcode";
            if(obj.id === 'vinyl-full') text = "Vinyl Disc";
            if(obj.id === 'vinyl-half') text = "Half Vinyl";
            if(obj.id === 'info-box') text = "Info Box";
            if(obj.id === 'qr-code') text = "QR Code Placeholder";
            
            let div = document.createElement('div'); div.className = 'layer-item'; if(w.canvas.getActiveObject() === obj) div.style.borderLeft = "3px solid var(--accent)";
            let nameSpan = document.createElement('span'); nameSpan.innerText = text; nameSpan.style.cursor = 'pointer'; nameSpan.style.flex = '1'; nameSpan.style.marginLeft = '8px';
            nameSpan.onclick = () => { w.canvas.setActiveObject(obj); w.canvas.requestRenderAll(); w.updateEditorPanel(); };
            
            let eyeBtn = document.createElement('i'); eyeBtn.className = obj.visible ? 'fas fa-eye' : 'fas fa-eye-slash'; eyeBtn.title = "Hide/Show";
            eyeBtn.onclick = () => { obj.set('visible', !obj.visible); w.canvas.requestRenderAll(); w.updateLayersPanel(); w.saveState(); };
            
            let toolsDiv = document.createElement('div'); toolsDiv.style.display = 'flex'; toolsDiv.style.gap = '12px';
            
            let upBtn = document.createElement('i'); upBtn.className = 'fas fa-arrow-up'; upBtn.title = "Bring Forward";
            upBtn.onclick = () => { w.bringForward(obj); };
            
            let downBtn = document.createElement('i'); downBtn.className = 'fas fa-arrow-down'; downBtn.title = "Send Backward";
            downBtn.onclick = () => { w.sendBackward(obj); };
            
            toolsDiv.appendChild(upBtn); toolsDiv.appendChild(downBtn); div.appendChild(eyeBtn); div.appendChild(nameSpan); div.appendChild(toolsDiv); list.appendChild(div);
        }
    };
    
    w.updateEditorPanel = function() {
        let obj = w.canvas.getActiveObject(); 
        let editor = document.getElementById('element-editor'); 
        let editorBtn = document.getElementById('btn-edit-selected');
        
        let textTools = document.getElementById('text-tools');
        let textHr = document.getElementById('text-hr');
        let textContentWrapper = document.getElementById('text-content-wrapper');
        let imgReplace = document.getElementById('image-replace-tool');
        let radiusCol = document.getElementById('radius-col');
        let objectAlign = document.getElementById('object-align-tools');

        if (!obj) { 
            if(editor) editor.style.display = 'none'; 
            if(editorBtn) editorBtn.style.display = 'none'; 
            return; 
        } 
        
        if(editor) {
            editor.style.display = 'flex';
            if(editorBtn) {
                editorBtn.style.display = 'flex';
                if (!editor.classList.contains('open')) w.toggleAccordion(editorBtn); 
            }
        }

        const m = w.getLayoutMetrics();

        let isMultiSelection = obj.type === 'activeSelection';
        let hasText = false;
        let referenceObj = obj;

        if (isMultiSelection) {
            const objs = obj.getObjects();
            const firstText = objs.find((o:any) => ['i-text', 'textbox', 'text'].includes(o.type));
            if (firstText) {
                hasText = true;
                referenceObj = firstText;
            }
        } else if (['i-text', 'textbox', 'text'].includes(obj.type)) {
            hasText = true;
        }

        (document.getElementById('elemX') as HTMLInputElement).value = Math.round(obj.left).toString();
        (document.getElementById('elemY') as HTMLInputElement).value = Math.round(obj.top).toString();
        (document.getElementById('elemOpacity') as HTMLInputElement).value = obj.opacity || 1;
        document.getElementById('op-val')!.innerText = Math.round((obj.opacity || 1) * 100) + '%';
        (document.getElementById('elemVisible') as HTMLSelectElement).value = obj.visible === false ? "false" : "true";

        (document.getElementById('elemStrokeWidth') as HTMLInputElement).value = obj.strokeWidth ? Math.round(obj.strokeWidth / m.S).toString() : "0";
        
        const scInput = document.getElementById('elemStrokeColor') as HTMLInputElement;
        const scTxt = document.getElementById('elemStrokeColor-txt') as HTMLInputElement;
        if(scInput) scInput.value = obj.stroke || '#ffffff';
        if(scTxt) scTxt.value = obj.stroke || '#ffffff';

        if (obj.shadow) {
            (document.getElementById('shBlur') as HTMLInputElement).value = Math.round(obj.shadow.blur / m.S).toString() || "0";
            (document.getElementById('shX') as HTMLInputElement).value = Math.round(obj.shadow.offsetX / m.S).toString() || "0";
            (document.getElementById('shY') as HTMLInputElement).value = Math.round(obj.shadow.offsetY / m.S).toString() || "0";
            
            const shInput = document.getElementById('shColor') as HTMLInputElement;
            const shTxt = document.getElementById('shColor-txt') as HTMLInputElement;
            if(shInput) shInput.value = obj.shadow.color || '#000000';
            if(shTxt) shTxt.value = obj.shadow.color || '#000000';
        } else {
            ['shBlur', 'shX', 'shY'].forEach(id => (document.getElementById(id) as HTMLInputElement).value = "0");
            const shInput = document.getElementById('shColor') as HTMLInputElement;
            const shTxt = document.getElementById('shColor-txt') as HTMLInputElement;
            if(shInput) shInput.value = '#000000';
            if(shTxt) shTxt.value = '#000000';
        }

        if(objectAlign) objectAlign.style.display = 'flex'; 

        if (hasText) {
            if(textTools) textTools.style.display = 'flex';
            if(textHr) textHr.style.display = 'block';
            if(imgReplace) imgReplace.style.display = 'none';
            if(radiusCol) radiusCol.style.display = 'none';
            
            if (textContentWrapper) textContentWrapper.style.display = isMultiSelection ? 'none' : 'block';

            if (!isMultiSelection) {
                (document.getElementById('elemText') as HTMLInputElement).value = referenceObj.text || ''; 
            }
            
            if (typeof w.syncReactFontState === 'function') w.syncReactFontState(referenceObj.fontFamily || 'Inter');
            
            (document.getElementById('elemSize') as HTMLInputElement).value = Math.round((referenceObj.fontSize * referenceObj.scaleX) / m.S).toString(); 
            
            const cInput = document.getElementById('elemColor') as HTMLInputElement;
            const cTxt = document.getElementById('elemColor-txt') as HTMLInputElement;
            if(cInput) cInput.value = referenceObj.fill || '#000000';
            if(cTxt) cTxt.value = referenceObj.fill || '#000000';
            
            (document.getElementById('elemWeight') as HTMLSelectElement).value = referenceObj.fontWeight || '400'; 
            (document.getElementById('elemSpacing') as HTMLInputElement).value = (referenceObj.charSpacing || 0).toString(); 
            (document.getElementById('elemLineHeight') as HTMLInputElement).value = (referenceObj.lineHeight || 1.2).toString(); 
            
            let bgCol = referenceObj.textBackgroundColor || 'transparent';
            const bgInput = document.getElementById('elemBgColor') as HTMLInputElement;
            const bgTxt = document.getElementById('elemBgColor-txt') as HTMLInputElement;
            let finalBg = (bgCol === 'transparent' || bgCol === 'rgba(0,0,0,0)' || !bgCol) ? '#000000' : bgCol;
            if(bgInput) bgInput.value = finalBg;
            if(bgTxt) bgTxt.value = finalBg;

        } else if (obj.type === 'image' || obj.type === 'group' || (isMultiSelection && !hasText)) {
            if(textTools) textTools.style.display = 'none';
            if(textHr) textHr.style.display = 'none';
            if(imgReplace) imgReplace.style.display = (obj.type === 'image' && !isMultiSelection) ? 'block' : 'none';
            if(radiusCol) radiusCol.style.display = 'none';
            
            const bgInput = document.getElementById('elemBgColor') as HTMLInputElement;
            const bgTxt = document.getElementById('elemBgColor-txt') as HTMLInputElement;
            if(bgInput) bgInput.value = obj.fill || '#000000';
            if(bgTxt) bgTxt.value = obj.fill || '#000000';
        } else {
            if(textTools) textTools.style.display = 'none';
            if(textHr) textHr.style.display = 'none';
            if(imgReplace) imgReplace.style.display = 'none';
            if(radiusCol) {
                radiusCol.style.display = 'block';
                (document.getElementById('elemRadius') as HTMLInputElement).value = obj.rx ? Math.round(obj.rx / m.S).toString() : "0";
            }
            const bgInput = document.getElementById('elemBgColor') as HTMLInputElement;
            const bgTxt = document.getElementById('elemBgColor-txt') as HTMLInputElement;
            if(bgInput) bgInput.value = obj.fill || '#000000';
            if(bgTxt) bgTxt.value = obj.fill || '#000000';
        }
        
        let lockBtn = document.getElementById('btn-lock');
        if(lockBtn) {
            lockBtn.innerHTML = obj.lockMovementX ? '<i class="fas fa-lock"></i>' : '<i class="fas fa-unlock"></i>'; 
            lockBtn.style.color = obj.lockMovementX ? '#ff4444' : 'var(--text-muted)';
        }
        w.updateLayersPanel();
    };
    
    w.canvas.on('selection:created', w.updateEditorPanel); w.canvas.on('selection:updated', w.updateEditorPanel); w.canvas.on('selection:cleared', () => { w.updateEditorPanel(); w.updateLayersPanel(); }); w.canvas.on('object:moving', w.updateEditorPanel); w.canvas.on('object:scaling', w.updateEditorPanel);
    
    document.addEventListener('keydown', function(e: any) {
        if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
        if (e.key === 'Delete' || e.key === 'Backspace') { w.deleteSelected(); e.preventDefault(); return; }
        
        const obj = w.canvas.getActiveObject(); 
        if (!obj) return;
        
        const m = w.getLayoutMetrics();
        const step = e.shiftKey ? (100 * m.S) : (10 * m.S);
        
        switch(e.key) { 
            case 'ArrowLeft': obj.set('left', obj.left - step); break; 
            case 'ArrowRight': obj.set('left', obj.left + step); break; 
            case 'ArrowUp': obj.set('top', obj.top - step); break; 
            case 'ArrowDown': obj.set('top', obj.top + step); break; 
        }
        
        if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) { 
            e.preventDefault(); 
            obj.setCoords(); 
            w.canvas.requestRenderAll(); 
            w.saveState(); 
            w.updateEditorPanel(); 
        }
    });

    w.handleAddToCart = function() {
        if (!w.activeAlbumData) {
            w.showToast("⚠ Please search and select an album first!");
            return;
        }
        w.showLoading("Adding to Cart...", "Processing your request...");
        
        setTimeout(() => {
            try {
                if (w.currentViewMode === 'gallery') {
                    if (!w.latestVariantsData || w.latestVariantsData.length === 0) {
                        w.showToast("⚠ No variants found. Please generate them first.");
                        return;
                    }
                    
                    w.latestVariantsData.forEach((v: any, index: number) => {
                        addToCart({
                            id: `custom_pro_${w.activeAlbumData.id}_${v.key}_${Date.now()}_${index}`,
                            name: `${w.activeAlbumData.artist.name} - ${w.activeAlbumData.title} (${v.layout.toUpperCase()} - ${v.theme})`,
                            price: 29.99,
                            image: w.activeAlbumData.cover_xl, 
                            type: 'custom_pro_album',
                            metadata: {
                                format: w.currentFormat,
                                layout: v.layout,
                                theme: v.theme,
                                designState: w.variantStates[v.key]
                            }
                        });
                    });
                    w.showToast("✓ All designs added to cart!");
                } else {
                    addToCart({
                        id: `custom_pro_${w.activeAlbumData.id}_${Date.now()}`,
                        name: `${w.activeAlbumData.artist.name} - ${w.activeAlbumData.title} Poster`,
                        price: 29.99,
                        image: w.activeAlbumData.cover_xl, 
                        type: 'custom_pro_album',
                        metadata: {
                            format: w.currentFormat,
                            layout: (document.getElementById('layoutSelect') as HTMLSelectElement).value,
                            theme: (document.getElementById('themeSelect') as HTMLSelectElement).value,
                            designState: w.canvas.toJSON(w.PROPS_TO_SAVE)
                        }
                    });
                    w.showToast("✓ Added to cart successfully!");
                }
            } catch (error: any) {
                console.error("Cart Error:", error);
                w.showToast("⚠ An error occurred.");
            } finally {
                w.hideLoading();
            }
        }, 100);
    };

    (document.getElementById('formatSelect') as HTMLSelectElement).value = '16.54x23.39';
    w.rescale((document.getElementById('zoom-slider') as HTMLInputElement).value);
    (document.getElementById('frameColorPicker') as HTMLInputElement).value = "#f5f5f5";
    (document.getElementById('frameColorPicker-txt') as HTMLInputElement).value = "#f5f5f5";
    w.updateFrameColor("#f5f5f5"); 
  };

  return (
    <div className="poster-pro-container" style={{ fontFamily: "'Inter', sans-serif", backgroundColor: "var(--bg-main)", color: "var(--text-main)", margin: 0, paddingTop: "85px", display: "flex", overflow: "hidden", height: "100vh", width: "100vw", boxSizing: "border-box", position: "relative" }}>        
        {/* Global Loader */}
        <div id="global-loader">
            <div className="spinner"></div>
            <div id="loader-text" className="loader-text"></div>
            <div id="loader-subtext" className="loader-subtext"></div>
        </div>
        
        {/* TOAST NOTIFICATION */}
        <div id="toast">✓ İşlem tamamlandı</div>

        {/* FONT SEÇİCİ DROPDOWN EKLENDİ */}
        {isFontDropdownOpen && (
            <div style={{ position: 'fixed', inset: 0, zIndex: 11000 }} onClick={() => setIsFontDropdownOpen(false)}>
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'var(--bg-sidebar)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '15px', width: '300px', maxHeight: '400px', overflowY: 'auto', boxShadow: '0 25px 50px rgba(0,0,0,0.8)' }} onClick={e => e.stopPropagation()}>
                    <h4 style={{ margin: '0 0 15px 0', textAlign: 'center', color: '#fff' }}>Select Font</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        {GOOGLE_FONTS.map(font => (
                            <div key={font} className="font-item" style={{ fontFamily: font, padding: '10px', background: activeFont === font ? 'var(--accent)' : 'transparent', borderRadius: '8px', cursor: 'pointer', textAlign: 'center', color: '#fff' }} 
                                onClick={() => {
                                    setActiveFont(font);
                                    (window as any).applyStyle('fontFamily', font);
                                    setIsFontDropdownOpen(false);
                                }}>
                                {font}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}

        {/* CROPPER MODAL (FOR CUSTOM UPLOADS) */}
        <div id="cropper-modal" style={{ display: "none", position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(14, 14, 21, 0.95)", zIndex: 11000, flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "20px" }}>
            <div style={{ background: "var(--bg-sidebar)", padding: "20px", borderRadius: "16px", width: "90%", maxWidth: "600px", display: "flex", flexDirection: "column", gap: "20px", boxShadow: "0 25px 50px rgba(0,0,0,0.5)" }}>
                <h3 style={{ margin: 0, color: "#fff", fontFamily: "'Montserrat', sans-serif" }}>Crop Your Cover</h3>
                <div style={{ width: "100%", height: "400px", background: "#000", overflow: "hidden" }}>
                    <img id="cropper-image" style={{ maxWidth: "100%", display: "block" }} />
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                    <button onClick={() => (window as any).closeCropper()} className="btn-dark" style={{ padding: "10px 20px", borderRadius: "8px", border: "none", cursor: "pointer", color: "#fff" }}>Cancel</button>
                    <button onClick={() => (window as any).applyCroppedImage()} className="btn-accent" style={{ padding: "10px 20px", borderRadius: "8px", border: "none", cursor: "pointer", color: "#fff", fontWeight: "bold" }}>Crop & Apply</button>
                </div>
            </div>
        </div>

        {/* ZORUNLU SEÇİM POPUP MODALI */}
        <div id="layout-alert-modal" style={{ display: "none", position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(14, 14, 21, 0.9)", zIndex: 10000, justifyContent: "center", alignItems: "center" }}>
            <div style={{ background: "var(--bg-sidebar)", padding: "40px", borderRadius: "20px", border: "1px solid var(--accent)", textAlign: "center", maxWidth: "400px", boxShadow: "0 25px 50px rgba(0,0,0,0.5)" }}>
                <i className="fas fa-exclamation-circle" style={{ fontSize: "3rem", color: "var(--accent)", marginBottom: "20px" }}></i>
                <h3 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: "1.5rem", margin: "0 0 10px 0", color: "#fff" }}>Selection Required</h3>
                <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "25px", lineHeight: "1.5" }}>Please select at least one layout style from the "CHOOSE YOUR LAYOUTS" screen before searching for an album.</p>
                <button onClick={() => document.getElementById('layout-alert-modal')!.style.display='none'} className="sidebar-download-btn btn-accent" style={{ width: "100%", fontSize: "1rem", padding: "12px" }}>OK, GOT IT</button>
            </div>
        </div>

        {/* LEFT SIDEBAR (GLOBAL SETTINGS) */}
        <div className="sidebar-pro-left">
            <div className="sidebar-logo">
                <div className="icon">A</div>
                <div className="text">POSTER.PRO</div>
            </div>
            
            <button className="accordion-btn open" onClick={(e) => (window as any).toggleAccordion(e.currentTarget)}>
                <i className="fas fa-music"></i> Search Music <span className="arrow">▼</span>
            </button>
            <div className="accordion-content open">
                <div style={{ position: "relative" }}>
                    <input type="text" id="query" className="sidebar-control" placeholder="Artist or Album..." onKeyDown={(e) => { 
                        if(e.key === 'Enter') {
                            if (typeof (window as any).executeDeezerSearch === 'function') {
                                (window as any).executeDeezerSearch();
                            } else {
                                (window as any).showToast("⚠ Loading engine... Please wait.");
                            }
                        }
                    }} style={{ paddingRight: "40px" }} />
                    <i className="fas fa-search" style={{ position: "absolute", right: "15px", top: "14px", color: "var(--text-muted)", cursor: "pointer" }} onClick={() => {
                        if (typeof (window as any).executeDeezerSearch === 'function') {
                            (window as any).executeDeezerSearch();
                        } else {
                            (window as any).showToast("⚠ Loading engine... Please wait.");
                        }
                    }}></i>
                </div>
            </div>

            <button className="accordion-btn open" onClick={(e) => (window as any).toggleAccordion(e.currentTarget)}>
                <i className="fas fa-expand"></i> Format Selection <span className="arrow">▼</span>
            </button>
            <div className="accordion-content open">
                <select id="formatSelect" className="sidebar-control" onChange={(e) => (window as any).updateFormat(e.target.value)}>
                    <option value="5.83x8.27">A5 (5.83" x 8.27")</option>
                    <option value="8.27x11.69">A4 (8.27" x 11.69")</option>
                    <option value="11.69x16.54">A3 (11.69" x 16.54")</option>
                    <option value="16.54x23.39" selected>A2 (16.54" x 23.39")</option>
                    <option value="23.39x33.11">A1 (23.39" x 33.11")</option>
                    <option value="5x7">5" x 7"</option>
                    <option value="6x8">6" x 8"</option>
                    <option value="8x10">8" x 10"</option>
                    <option value="9x11">9" x 11"</option>
                    <option value="11x14">11" x 14"</option>
                    <option value="11x17">11" x 17"</option>
                    <option value="12x16">12" x 16"</option>
                    <option value="12x18">12" x 18"</option>
                    <option value="16x20">16" x 20"</option>
                    <option value="16x24">16" x 24"</option>
                    <option value="18x24">18" x 24"</option>
                    <option value="20x30">20" x 30"</option>
                    <option value="24x36">24" x 36"</option>
                </select>
            </div>

            <button className="accordion-btn open" onClick={(e) => (window as any).toggleAccordion(e.currentTarget)}>
                <i className="fas fa-palette"></i> Styles & Layout <span className="arrow">▼</span>
            </button>
            <div className="accordion-content open">
                <select id="layoutSelect" className="sidebar-control" onChange={(e) => {
                    (window as any).handleLayoutChange(e.target.value);
                }}>
                    <option value="standart">Minimalist</option>
                    <option value="minimal">bBoxes</option>
                    <option value="modern">Modern</option>
                    <option value="classic">Classic</option>
                    <option value="vinyl">Vinyl Record</option>
                </select>
                <select id="themeSelect" className="sidebar-control" onChange={(e) => (window as any).handleThemeChange(e.target.value)} style={{ marginTop: "10px" }}>
                    <option value="light">Theme: Light</option>
                    <option value="dark">Theme: Dark</option>
                    <option value="blurry">Theme: Blurry</option>
                    <option value="colorful">Theme: Colorful</option>
                </select>
            </div>

            <button className="accordion-btn" onClick={(e) => (window as any).toggleAccordion(e.currentTarget)}>
                <i className="fas fa-border-style"></i> Frame & Separator <span className="arrow">▼</span>
            </button>
            <div className="accordion-content">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <div>
                        <label style={{ fontSize: "0.6rem", color: "var(--text-muted)", marginBottom: "4px", display: "block" }}>Frame BG</label>
                        <div style={{ display: "flex", gap: "5px" }}>
                            <input type="color" id="frameColorPicker" className="sidebar-control" defaultValue="#f5f5f5" onInput={(e: any) => (window as any).syncColor('frameColorPicker', 'frameColorPicker-txt')} />
                            <input type="text" id="frameColorPicker-txt" className="sidebar-control" defaultValue="#f5f5f5" style={{ padding: "5px", height: "38px" }} onInput={(e: any) => (window as any).syncColor('frameColorPicker-txt', 'frameColorPicker')} />
                        </div>
                    </div>
                    <div>
                        <label style={{ fontSize: "0.6rem", color: "var(--text-muted)", marginBottom: "4px", display: "block" }}>Line Color</label>
                        <div style={{ display: "flex", gap: "5px" }}>
                            <input type="color" id="lineColorPicker" className="sidebar-control" defaultValue="#222222" onInput={(e: any) => (window as any).syncColor('lineColorPicker', 'lineColorPicker-txt')} />
                            <input type="text" id="lineColorPicker-txt" className="sidebar-control" defaultValue="#222222" style={{ padding: "5px", height: "38px" }} onInput={(e: any) => (window as any).syncColor('lineColorPicker-txt', 'lineColorPicker')} />
                        </div>
                    </div>
                </div>
            </div>

            <button className="accordion-btn" onClick={(e) => (window as any).toggleAccordion(e.currentTarget)}>
                <i className="fas fa-smog"></i> Blur Settings <span className="arrow">▼</span>
            </button>
            <div className="accordion-content" style={{ background: "var(--bg-input)", padding: "15px", borderRadius: "12px", marginTop: "5px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.8rem", cursor: "pointer", marginBottom: "15px" }}>
                    <input type="checkbox" id="blurToggle" onChange={() => (window as any).updateBlurSettings()} style={{ width: "16px", height: "16px" }} /><span>Enable Blur BG</span>
                </label>
                <label style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginBottom: "5px" }}>Blur Amount</label>
                <input type="range" id="blurAmount" min="0" max="300" step="5" defaultValue="60" onInput={() => (window as any).updateBlurSettings()} />
                <label style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "15px", marginBottom: "5px" }}>Overlay Brightness</label>
                <input type="range" id="blurBrightness" min="0" max="1" step="0.05" defaultValue="0.6" onInput={() => (window as any).updateBlurSettings()} />
            </div>

            <button className="accordion-btn" onClick={(e) => (window as any).toggleAccordion(e.currentTarget)}>
                <i className="fas fa-swatchbook"></i> Manual Palette <span className="arrow">▼</span>
            </button>
            <div className="accordion-content">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
                    <div style={{ display: "flex", gap: "5px" }}><input type="color" id="p1" className="sidebar-control" onInput={(e: any) => (window as any).syncColor('p1', 'p1-txt')} defaultValue="#d68c5b" /><input type="text" id="p1-txt" className="sidebar-control" style={{ padding: "5px", height:"38px" }} onInput={(e: any) => (window as any).syncColor('p1-txt', 'p1')} defaultValue="#d68c5b" /></div>
                    <div style={{ display: "flex", gap: "5px" }}><input type="color" id="p2" className="sidebar-control" onInput={(e: any) => (window as any).syncColor('p2', 'p2-txt')} defaultValue="#b95856" /><input type="text" id="p2-txt" className="sidebar-control" style={{ padding: "5px", height:"38px" }} onInput={(e: any) => (window as any).syncColor('p2-txt', 'p2')} defaultValue="#b95856" /></div>
                    <div style={{ display: "flex", gap: "5px" }}><input type="color" id="p3" className="sidebar-control" onInput={(e: any) => (window as any).syncColor('p3', 'p3-txt')} defaultValue="#a83a6b" /><input type="text" id="p3-txt" className="sidebar-control" style={{ padding: "5px", height:"38px" }} onInput={(e: any) => (window as any).syncColor('p3-txt', 'p3')} defaultValue="#a83a6b" /></div>
                    <div style={{ display: "flex", gap: "5px" }}><input type="color" id="p4" className="sidebar-control" onInput={(e: any) => (window as any).syncColor('p4', 'p4-txt')} defaultValue="#772b7a" /><input type="text" id="p4-txt" className="sidebar-control" style={{ padding: "5px", height:"38px" }} onInput={(e: any) => (window as any).syncColor('p4-txt', 'p4')} defaultValue="#772b7a" /></div>
                    <div style={{ display: "flex", gap: "5px" }}><input type="color" id="p5" className="sidebar-control" onInput={(e: any) => (window as any).syncColor('p5', 'p5-txt')} defaultValue="#471868" /><input type="text" id="p5-txt" className="sidebar-control" style={{ padding: "5px", height:"38px" }} onInput={(e: any) => (window as any).syncColor('p5-txt', 'p5')} defaultValue="#471868" /></div>
                </div>
                <button className="sidebar-download-btn btn-dark" onClick={() => (window as any).forceExtractPalette()} style={{ fontSize: "0.75rem" }}>AUTO EXTRACT</button>
            </div>

            <button className="accordion-btn" onClick={(e) => (window as any).toggleAccordion(e.currentTarget)}>
                <i className="fas fa-upload"></i> Custom Upload <span className="arrow">▼</span>
            </button>
            <div className="accordion-content">
                <input type="file" id="customUpload" accept="image/*" className="sidebar-control" style={{ padding: "10px" }} />
                <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '5px' }}>Upload an image to skip searching. We will auto-fill the rest with placeholder text.</p>
            </div>
        </div>

        {/* MAIN VIEW (CANVAS) */}
        <div className="main-view">
            <div id="top-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '25px 40px', flexShrink: 0, zIndex: 50, width: '100%' }}>
                {/* Left Side */}
                <div className="top-bar-left" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                    <h2 
                        id="top_title" 
                        className="glitch-text" 
                        style={{ cursor: "pointer" }} 
                        title="Return to Home"
                        onClick={() => {
                            const w = window as any;
                            w.activeAlbumData = null;
                            w.selectedLayouts = [];
                            w.latestVariantsData =[];
                            w.variantStates = {};
                            w.currentVariantKey = null;
                            setSelectedLayouts([]);
                            setHasAlbumData(false);
                            w.showVariantsView();
                            w.canvas.clear();
                            const queryInput = document.getElementById('query') as HTMLInputElement;
                            if(queryInput) queryInput.value = '';
                        }}
                    >
                        DESIGNER
                    </h2>
                    <p id="top_subtitle" style={{ margin: '2px 0 0 0', color: 'var(--accent)', fontStyle: 'italic', fontWeight: 600, fontSize: '0.9rem' }}>Make your music visual.</p>
                </div>
                
                {/* Center Side */}
                <div style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: '10px' }}>
                    <button className="sidebar-download-btn btn-dark" style={{ width: "auto", padding: "12px 20px", margin: 0, borderRadius: "50px" }} onClick={() => (window as any).downloadPoster('png')}>PNG</button>
                    <button className="sidebar-download-btn btn-dark" style={{ width: "auto", padding: "12px 20px", margin: 0, borderRadius: "50px" }} onClick={() => (window as any).downloadPoster('pdf')}>PDF</button>
                    <button className="sidebar-download-btn btn-dark" style={{ width: "auto", padding: "12px 20px", margin: 0, borderRadius: "50px" }} onClick={() => (window as any).downloadPoster('svg')}>SVG</button>
                    
                    <button 
                        className="sidebar-download-btn" 
                        style={{ background: "var(--spotify)", color: "#fff", border: "none", padding: "12px 30px", fontSize: "0.9rem", width: "auto", margin: 0, borderRadius: "50px", boxShadow: "0 4px 15px rgba(29, 185, 84, 0.3)", marginLeft: "10px" }} 
                        onClick={() => (window as any).handleAddToCart()}
                    >
                        <i className="fas fa-shopping-cart" style={{ marginRight: "8px" }}></i> 
                        ADD TO CART
                    </button>
                </div>

                {/* Right Side */}
                <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
                    <div className="view-toggle">
                        <button onClick={() => {
                            if (!hasAlbumData) { (window as any).showToast("⚠ Please search and select an album first!"); return; }
                            (window as any).showVariantsView();
                        }} id="btn-show-gallery" className="toggle-btn">GALLERY</button>
                        <button onClick={() => {
                            if (!hasAlbumData) { (window as any).showToast("⚠ Please search and select an album first!"); return; }
                            (window as any).showSingleEditor();
                        }} id="btn-show-editor" className="toggle-btn">EDITOR</button>
                    </div>
                </div>
            </div>
            
            <div id="content-area">
                <div id="poster-frame" style={{ display: "none" }}>
                    <canvas id="poster-canvas"></canvas>
                </div>

                <div id="variants-view" style={{ display: "flex", width: "100%", flexDirection: "column", paddingBottom: "50px" }}>
                    
                    {!hasAlbumData ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', height: '100%', width: '100%', maxWidth: '1200px', margin: '0 auto', gap: '30px', paddingTop: '40px' }}>
                            <div style={{ textAlign: 'center' }}>
                                <h1 style={{ fontSize: '2.5rem', fontFamily: 'Montserrat', fontWeight: 900, marginBottom: '10px' }}>CHOOSE YOUR LAYOUTS</h1>
                                <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Select starting templates, then search for your favorite album.</p>
                            </div>
                            
                            <div className="template-cards-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', width: '100%' }}>
                                <div className={`template-card ${selectedLayouts.includes('standart') ? 'active' : ''}`} onClick={() => handleTemplateSelection('standart')} style={{ padding: '15px' }}>
                                    <img src="/minimalistsample.jpg" alt="Minimalist" style={{ width: '100%', aspectRatio: '2/3', objectFit: 'cover', borderRadius: '8px', backgroundColor: '#000' }} onError={(e: any) => { e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="150" viewBox="0 0 100 150"><rect width="100" height="150" fill="%23222232"/><text x="50" y="75" font-family="sans-serif" font-size="10" fill="%238a8a9e" text-anchor="middle" dominant-baseline="middle">PREVIEW</text></svg>' }} />
                                    <h3 style={{ marginTop: '10px' }}>Minimalist</h3>
                                </div>
                                <div className={`template-card ${selectedLayouts.includes('minimal') ? 'active' : ''}`} onClick={() => handleTemplateSelection('minimal')} style={{ padding: '15px' }}>
                                    <img src="/bboxessample.jpg" alt="bBoxes" style={{ width: '100%', aspectRatio: '2/3', objectFit: 'cover', borderRadius: '8px', backgroundColor: '#000' }} onError={(e: any) => { e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="150" viewBox="0 0 100 150"><rect width="100" height="150" fill="%23222232"/><text x="50" y="75" font-family="sans-serif" font-size="10" fill="%238a8a9e" text-anchor="middle" dominant-baseline="middle">PREVIEW</text></svg>' }} />
                                    <h3 style={{ marginTop: '10px' }}>bBoxes</h3>
                                </div>
                                <div className={`template-card ${selectedLayouts.includes('modern') ? 'active' : ''}`} onClick={() => handleTemplateSelection('modern')} style={{ padding: '15px' }}>
                                    <img src="/modernsample.jpg" alt="Modern" style={{ width: '100%', aspectRatio: '2/3', objectFit: 'cover', borderRadius: '8px', backgroundColor: '#000' }} onError={(e: any) => { e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="150" viewBox="0 0 100 150"><rect width="100" height="150" fill="%23222232"/><text x="50" y="75" font-family="sans-serif" font-size="10" fill="%238a8a9e" text-anchor="middle" dominant-baseline="middle">PREVIEW</text></svg>' }} />
                                    <h3 style={{ marginTop: '10px' }}>Modern</h3>
                                </div>
                                <div className={`template-card ${selectedLayouts.includes('classic') ? 'active' : ''}`} onClick={() => handleTemplateSelection('classic')} style={{ padding: '15px' }}>
                                    <img src="/classicsample.jpg" alt="Classic" style={{ width: '100%', aspectRatio: '2/3', objectFit: 'cover', borderRadius: '8px', backgroundColor: '#000' }} onError={(e: any) => { e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="150" viewBox="0 0 100 150"><rect width="100" height="150" fill="%23222232"/><text x="50" y="75" font-family="sans-serif" font-size="10" fill="%238a8a9e" text-anchor="middle" dominant-baseline="middle">PREVIEW</text></svg>' }} />
                                    <h3 style={{ marginTop: '10px' }}>Classic</h3>
                                </div>
                                <div className={`template-card ${selectedLayouts.includes('vinyl') ? 'active' : ''}`} onClick={() => handleTemplateSelection('vinyl')} style={{ padding: '15px' }}>
                                    <img src="/vinylsample.jpg" alt="Vinyl Record" style={{ width: '100%', aspectRatio: '2/3', objectFit: 'cover', borderRadius: '8px', backgroundColor: '#000' }} onError={(e: any) => { e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="150" viewBox="0 0 100 150"><rect width="100" height="150" fill="%23222232"/><text x="50" y="75" font-family="sans-serif" font-size="10" fill="%238a8a9e" text-anchor="middle" dominant-baseline="middle">PREVIEW</text></svg>' }} />
                                    <h3 style={{ marginTop: '10px' }}>Vinyl Record</h3>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div id="variants-grid" className="grid-pro"></div>
                    )}
                </div>
            </div>
        </div>

        {/* RIGHT SIDEBAR (TOOLS & ELEMENTS) */}
        <div className="sidebar-pro-right-wrapper">
            <div className="sidebar-pro-right-scroll">
                
                <button className="accordion-btn open" onClick={(e) => (window as any).toggleAccordion(e.currentTarget)}>
                    <i className="fas fa-search-plus"></i> View & Grid <span className="arrow">▼</span>
                </button>
                <div className="accordion-content open">
                    <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
                        <button className="sidebar-control btn-icon btn-dark" onClick={() => (window as any).undo()} title="Undo"><i className="fas fa-undo"></i></button>
                        <button className="sidebar-control btn-icon btn-dark" onClick={() => (window as any).redo()} title="Redo"><i className="fas fa-redo"></i></button>
                    </div>
                    <label style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginBottom: "5px" }}>Preview Zoom</label>
                    <input type="range" id="zoom-slider" min="0.05" max="0.25" step="0.01" defaultValue="0.08" onInput={(e: any) => (window as any).rescale(e.target.value)} />
                    <label style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.8rem", cursor: "pointer", marginTop: "15px", background: "var(--bg-input)", padding: "12px", borderRadius: "10px" }}>
                        <input type="checkbox" id="gridToggle" onChange={() => (window as any).toggleGrid()} style={{ width: "16px", height: "16px" }} /><span>Show Grid & Snap</span>
                    </label>
                </div>

                {/* EDIT SELECTED PANEL (DYNAMIC) */}
                <button className="accordion-btn" onClick={(e) => (window as any).toggleAccordion(e.currentTarget)} id="btn-edit-selected" style={{ display: "none" }}>
                    <i className="fas fa-sliders-h"></i> EDIT SELECTED <span className="arrow">▼</span>
                </button>
                <div className="accordion-content" id="element-editor" style={{ display: "none", flexDirection: "column" }}>
                    
                    {/* Align & Distribute */}
                    <div id="object-align-tools" style={{ display: "none", flexDirection: "column", gap: "5px", marginBottom: "10px" }}>
                        <label style={{ fontSize: "0.65rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "bold" }}>Align & Distribute</label>
                        <div style={{ display: "flex", gap: "4px", background: "var(--bg-input)", padding: "8px", borderRadius: "10px", alignItems: "center", justifyContent: "space-between" }}>
                            <button style={{ background:"none", border:"none", color:"var(--text-muted)", cursor:"pointer" }} title="Align Left" onClick={() => (window as any).alignObjects('left')}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="3" x2="3" y2="21" strokeWidth="2.5"/><rect x="5" y="8" width="8" height="3" rx="1"/><rect x="5" y="13" width="13" height="3" rx="1"/></svg></button>
                            <button style={{ background:"none", border:"none", color:"var(--text-muted)", cursor:"pointer" }} title="Center H" onClick={() => (window as any).alignObjects('center')}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="3" x2="12" y2="21" strokeWidth="2.5"/><rect x="6" y="8" width="12" height="3" rx="1"/><rect x="4" y="13" width="16" height="3" rx="1"/></svg></button>
                            <button style={{ background:"none", border:"none", color:"var(--text-muted)", cursor:"pointer" }} title="Align Right" onClick={() => (window as any).alignObjects('right')}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="21" y1="3" x2="21" y2="21" strokeWidth="2.5"/><rect x="11" y="8" width="8" height="3" rx="1"/><rect x="6" y="13" width="13" height="3" rx="1"/></svg></button>
                            
                            <div style={{ width: "1px", height: "18px", background: "var(--border-color)", margin: "0 2px" }}></div>
                            
                            <button style={{ background:"none", border:"none", color:"var(--text-muted)", cursor:"pointer" }} title="Align Top" onClick={() => (window as any).alignObjects('top')}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="3" x2="21" y2="3" strokeWidth="2.5"/><rect x="8" y="5" width="3" height="8" rx="1"/><rect x="13" y="5" width="3" height="13" rx="1"/></svg></button>
                            <button style={{ background:"none", border:"none", color:"var(--text-muted)", cursor:"pointer" }} title="Center V" onClick={() => (window as any).alignObjects('middle')}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12" strokeWidth="2.5"/><rect x="8" y="4" width="3" height="16" rx="1"/><rect x="13" y="6" width="3" height="12" rx="1"/></svg></button>
                            <button style={{ background:"none", border:"none", color:"var(--text-muted)", cursor:"pointer" }} title="Align Bottom" onClick={() => (window as any).alignObjects('bottom')}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="21" x2="21" y2="21" strokeWidth="2.5"/><rect x="8" y="11" width="3" height="8" rx="1"/><rect x="13" y="6" width="3" height="13" rx="1"/></svg></button>
                            
                            <div style={{ width: "1px", height: "18px", background: "var(--border-color)", margin: "0 2px" }}></div>
                            
                            <button style={{ background:"none", border:"none", color:"var(--text-muted)", cursor:"pointer" }} title="Distribute H" onClick={() => (window as any).distributeObjects('h')}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="3" x2="3" y2="21"/><line x1="21" y1="3" x2="21" y2="21"/><rect x="9" y="8" width="6" height="8" rx="1"/></svg></button>
                            <button style={{ background:"none", border:"none", color:"var(--text-muted)", cursor:"pointer" }} title="Distribute V" onClick={() => (window as any).distributeObjects('v')}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="3" x2="21" y2="3"/><line x1="3" y1="21" x2="21" y2="21"/><rect x="8" y="9" width="8" height="6" rx="1"/></svg></button>
                        </div>
                    </div>

                    <hr style={{ border: "none", borderTop: "1px solid #2b2b3d", margin: "10px 0" }} />

                    {/* Position & Size */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "5px", marginBottom: "10px" }}>
                        <label style={{ fontSize: "0.65rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "bold" }}>Position & Size</label>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px" }}>
                            <div><label style={{ fontSize: "0.6rem", color: "var(--text-muted)" }}>X Pos</label><input type="number" id="elemX" className="sidebar-control" style={{ padding: "6px" }} onInput={(e: any) => (window as any).applyStyle('left', e.target.value)} /></div>
                            <div><label style={{ fontSize: "0.6rem", color: "var(--text-muted)" }}>Y Pos</label><input type="number" id="elemY" className="sidebar-control" style={{ padding: "6px" }} onInput={(e: any) => (window as any).applyStyle('top', e.target.value)} /></div>
                            <div id="size-col"><label style={{ fontSize: "0.6rem", color: "var(--text-muted)" }}>Size / W</label><input type="number" id="elemSize" className="sidebar-control" style={{ padding: "6px" }} onInput={(e: any) => (window as any).applyStyle('fontSize', e.target.value)} /></div>
                        </div>
                    </div>

                    <hr style={{ border: "none", borderTop: "1px solid #2b2b3d", margin: "10px 0" }} />

                    {/* Text Properties */}
                    <div id="text-tools" style={{ display: "flex", flexDirection: "column", gap: "5px", marginBottom: "10px" }}>
                        <label style={{ fontSize: "0.65rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "bold" }}>Text</label>
                        
                        {/* WRAPPER FOR TEXTAREA TO HIDE ON MULTI-SELECT */}
                        <div id="text-content-wrapper">
                            <textarea id="elemText" className="sidebar-control" style={{ resize: "vertical", minHeight: "40px", marginBottom: "5px" }} onInput={(e: any) => (window as any).updateElementText(e.target.value)}></textarea>
                        </div>
                        
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", marginBottom: "5px" }}>
                            <div className="relative">
                                <label style={{ fontSize: "0.6rem", color: "var(--text-muted)" }}>Font Family</label>
                                <div className="sidebar-control flex justify-between items-center" style={{ padding: "6px" }} onClick={() => setIsFontDropdownOpen(!isFontDropdownOpen)}>
                                    <span id="elemFontValue" style={{ fontSize: '11px', overflow: 'hidden' }}>{activeFont}</span>
                                </div>
                            </div>
                            <div>
                                <label style={{ fontSize: "0.6rem", color: "var(--text-muted)" }}>Weight</label>
                                <select id="elemWeight" className="sidebar-control" style={{ padding: "6px" }} onChange={(e: any) => (window as any).applyStyle('fontWeight', e.target.value)}>
                                    <option value="300">Light</option><option value="400">Regular</option><option value="500">Medium</option><option value="600">SemiBold</option><option value="700">Bold</option><option value="900">Black</option>
                                </select>
                            </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                            <div><label style={{ fontSize: "0.6rem", color: "var(--text-muted)" }}>Letter Space</label><input type="number" id="elemSpacing" className="sidebar-control" style={{ padding: "6px" }} onInput={(e: any) => (window as any).applyStyle('charSpacing', e.target.value)} /></div>
                            <div><label style={{ fontSize: "0.6rem", color: "var(--text-muted)" }}>Line Height</label><input type="number" step="0.1" id="elemLineHeight" className="sidebar-control" style={{ padding: "6px" }} onInput={(e: any) => (window as any).applyStyle('lineHeight', e.target.value)} /></div>
                        </div>
                        
                        <div style={{ display: "flex", gap: "5px", marginTop: "5px" }}>
                            <button className="sidebar-control btn-icon btn-dark" style={{ padding:"6px" }} onClick={() => (window as any).toggleStyle('fontStyle', 'italic', 'normal')}><i className="fas fa-italic"></i></button>
                            <button className="sidebar-control btn-icon btn-dark" style={{ padding:"6px" }} onClick={() => (window as any).applyStyle('textAlign', 'left')}><i className="fas fa-align-left"></i></button>
                            <button className="sidebar-control btn-icon btn-dark" style={{ padding:"6px" }} onClick={() => (window as any).applyStyle('textAlign', 'center')}><i className="fas fa-align-center"></i></button>
                            <button className="sidebar-control btn-icon btn-dark" style={{ padding:"6px" }} onClick={() => (window as any).applyStyle('textAlign', 'right')}><i className="fas fa-align-right"></i></button>
                        </div>
                    </div>

                    <hr id="text-hr" style={{ border: "none", borderTop: "1px solid #2b2b3d", margin: "10px 0" }} />

                    {/* Image Tools */}
                    <div id="image-replace-tool" style={{ display: "none", marginBottom: "10px" }}>
                        <label style={{ fontSize: "0.65rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "bold", display: "block", marginBottom: "4px" }}>Image</label>
                        <input type="file" accept="image/*" className="sidebar-control" style={{ padding: "8px" }} onChange={(e: any) => (window as any).replaceSelectedImage(e.target.files[0])} />
                        <hr style={{ border: "none", borderTop: "1px solid #2b2b3d", margin: "15px 0 10px 0" }} />
                    </div>

                    {/* Colors & Appearance */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "5px", marginBottom: "10px" }}>
                        <label style={{ fontSize: "0.65rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "bold" }}>Appearance</label>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", marginBottom: "5px" }}>
                            <div id="color-col">
                                <label style={{ fontSize: "0.6rem", color: "var(--text-muted)" }}>Color / Fill</label>
                                <div style={{ display: "flex", gap: "5px" }}>
                                    <input type="color" id="elemColor" className="sidebar-control" style={{ padding: "2px", height: "30px", width: "40px" }} onInput={(e: any) => (window as any).syncColor('elemColor', 'elemColor-txt')} />
                                    <input type="text" id="elemColor-txt" className="sidebar-control" style={{ padding: "5px" }} onInput={(e: any) => (window as any).syncColor('elemColor-txt', 'elemColor')} />
                                </div>
                            </div>
                            <div>
                                <label style={{ fontSize: "0.6rem", color: "var(--text-muted)" }}>Background</label>
                                <div style={{ display: "flex", gap: "5px" }}>
                                    <input type="color" id="elemBgColor" className="sidebar-control" style={{ padding: "2px", height: "30px", width: "40px" }} onInput={(e: any) => (window as any).syncColor('elemBgColor', 'elemBgColor-txt')} />
                                    <input type="text" id="elemBgColor-txt" className="sidebar-control" style={{ padding: "5px" }} onInput={(e: any) => (window as any).syncColor('elemBgColor-txt', 'elemBgColor')} />
                                </div>
                            </div>
                        </div>
                        <div>
                            <label style={{ fontSize: "0.6rem", color: "var(--text-muted)", display: "flex", justifyContent: "space-between" }}>Opacity <span id="op-val">100%</span></label>
                            <input type="range" id="elemOpacity" min="0" max="1" step="0.01" defaultValue="1" onInput={(e: any) => { (window as any).applyStyle('opacity', e.target.value); document.getElementById('op-val')!.innerText = Math.round(parseFloat(e.target.value)*100)+'%'; }} />
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "5px" }}>
                            <span style={{ fontSize: "0.6rem", color: "var(--text-muted)" }}>Visible</span>
                            <select id="elemVisible" className="sidebar-control" style={{ width: "auto", padding: "4px 8px" }} onChange={(e: any) => (window as any).applyStyle('visible', e.target.value === 'true')}>
                                <option value="true">Yes</option>
                                <option value="false">No</option>
                            </select>
                        </div>
                    </div>

                    <hr style={{ border: "none", borderTop: "1px solid #2b2b3d", margin: "10px 0" }} />

                    {/* Border & Shadow */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "5px", marginBottom: "10px" }}>
                        <label style={{ fontSize: "0.65rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "bold" }}>Border & Shadow</label>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px" }}>
                            <div><label style={{ fontSize: "0.6rem", color: "var(--text-muted)" }}>B. Width</label><input type="number" id="elemStrokeWidth" className="sidebar-control" style={{ padding: "6px" }} defaultValue="0" onInput={(e: any) => (window as any).applyStyle('strokeWidth', e.target.value)} /></div>
                            <div>
                                <label style={{ fontSize: "0.6rem", color: "var(--text-muted)" }}>B. Color</label>
                                <div style={{ display: "flex", gap: "5px" }}>
                                    <input type="color" id="elemStrokeColor" className="sidebar-control" style={{ padding: "2px", height: "28px" }} defaultValue="#ffffff" onInput={(e: any) => (window as any).syncColor('elemStrokeColor', 'elemStrokeColor-txt')} />
                                    <input type="text" id="elemStrokeColor-txt" className="sidebar-control" style={{ padding: "5px", display: "none" }} defaultValue="#ffffff" onInput={(e: any) => (window as any).syncColor('elemStrokeColor-txt', 'elemStrokeColor')} />
                                </div>
                            </div>
                            <div id="radius-col"><label style={{ fontSize: "0.6rem", color: "var(--text-muted)" }}>Radius</label><input type="number" id="elemRadius" className="sidebar-control" style={{ padding: "6px" }} defaultValue="0" onInput={(e: any) => { (window as any).applyStyle('rx', e.target.value); (window as any).applyStyle('ry', e.target.value); }} /></div>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "4px", marginTop:"5px" }}>
                            <div><label style={{ fontSize: "0.55rem", color: "var(--text-muted)" }}>Sh. Blur</label><input type="number" id="shBlur" className="sidebar-control" style={{ padding: "6px" }} defaultValue="0" onInput={(e: any) => (window as any).applyStyle('shadow', e.target.value, 'blur')} /></div>
                            <div>
                                <label style={{ fontSize: "0.55rem", color: "var(--text-muted)" }}>Sh. Color</label>
                                <div style={{ display: "flex", gap: "5px" }}>
                                    <input type="color" id="shColor" className="sidebar-control" style={{ padding: "2px", height: "28px" }} defaultValue="#000000" onInput={(e: any) => (window as any).syncColor('shColor', 'shColor-txt')} />
                                    <input type="text" id="shColor-txt" className="sidebar-control" style={{ padding: "5px", display: "none" }} defaultValue="#000000" onInput={(e: any) => (window as any).syncColor('shColor-txt', 'shColor')} />
                                </div>
                            </div>
                            <div><label style={{ fontSize: "0.55rem", color: "var(--text-muted)" }}>Sh. X</label><input type="number" id="shX" className="sidebar-control" style={{ padding: "6px" }} defaultValue="0" onInput={(e: any) => (window as any).applyStyle('shadow', e.target.value, 'offsetX')} /></div>
                            <div><label style={{ fontSize: "0.55rem", color: "var(--text-muted)" }}>Sh. Y</label><input type="number" id="shY" className="sidebar-control" style={{ padding: "6px" }} defaultValue="0" onInput={(e: any) => (window as any).applyStyle('shadow', e.target.value, 'offsetY')} /></div>
                        </div>
                    </div>

                    <hr style={{ border: "none", borderTop: "1px solid #2b2b3d", margin: "10px 0" }} />

                    <label style={{ fontSize: "0.65rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "bold", marginBottom: "5px" }}>Arrange / Lock</label>
                    <div style={{ display: "flex", gap: "5px" }}>
                        <button className="sidebar-control btn-icon btn-dark" onClick={() => (window as any).bringForward()} id="btn_bring_forward_tooltip"><i className="fas fa-arrow-up"></i></button>
                        <button className="sidebar-control btn-icon btn-dark" onClick={() => (window as any).sendBackward()} id="btn_send_backward_tooltip"><i className="fas fa-arrow-down"></i></button>
                        <button className="sidebar-control btn-icon btn-dark" id="btn-lock" onClick={() => (window as any).toggleLock()}><i className="fas fa-lock"></i></button>
                        <button className="sidebar-control btn-icon btn-danger" onClick={() => (window as any).deleteSelected()} id="btn_delete_selected_tooltip"><i className="fas fa-trash"></i></button>
                    </div>
                </div>

                {/* Layers Panel */}
                <button className="accordion-btn open" onClick={(e) => (window as any).toggleAccordion(e.currentTarget)}>
                    <i className="fas fa-layer-group"></i> Layers <span className="arrow">▼</span>
                </button>
                <div className="accordion-content open">
                    <div id="layers-panel" style={{ display: "flex", flexDirection: "column", maxHeight: "200px", overflowY: "auto", background: "var(--bg-input)", borderRadius: "12px", padding: "5px", border: "1px solid var(--border-color)" }}>
                    </div>
                </div>

                {/* Spotify Module - FIXED AT BOTTOM OF SCROLL */}
                <div className="sidebar-group" style={{ background: "var(--bg-input)", padding: "15px", borderRadius: "12px", border: "1px solid rgba(29, 185, 84, 0.25)", marginTop: "auto" }}>
                    <span className="sidebar-title" style={{ color: "var(--spotify)", marginBottom: "5px", fontSize: "0.7rem" }} id="title_spotify_barcode"><i className="fab fa-spotify"></i> SPOTIFY BARCODE</span>
                    <a id="spotifySearchBtn" href="https://open.spotify.com/search" target="_blank" rel="noreferrer" className="sidebar-download-btn" style={{ background: "var(--bg-main)", color: "var(--spotify)", padding: "12px", marginBottom: "10px", border: "1px solid transparent", boxShadow: "inset 0 0 0 1px rgba(29,185,84,0.1)" }}>1. FIND ON SPOTIFY</a>
                    <input type="text" id="spotifyLink" className="sidebar-control" placeholder="2. Paste Copied Link" style={{ background: "var(--bg-main)", borderColor: "var(--border-color)", marginBottom: "10px" }} />
                    
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
                        <div>
                            <label style={{ fontSize: "0.6rem", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Logo Color</label>
                            <div style={{ display: "flex", gap: "5px" }}>
                                <input type="color" id="barcode-logo-color" defaultValue="#ffffff" className="sidebar-control" style={{ padding: "2px", height: "30px", width: "40px" }} onInput={(e:any) => (window as any).syncColor('barcode-logo-color', 'barcode-logo-color-txt')} />
                                <input type="text" id="barcode-logo-color-txt" defaultValue="#ffffff" className="sidebar-control" style={{ padding: "5px" }} onInput={(e:any) => (window as any).syncColor('barcode-logo-color-txt', 'barcode-logo-color')} />
                            </div>
                        </div>
                        <div>
                            <label style={{ fontSize: "0.6rem", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Wave Color</label>
                            <div style={{ display: "flex", gap: "5px" }}>
                                <input type="color" id="barcode-bar-color" defaultValue="#ffffff" className="sidebar-control" style={{ padding: "2px", height: "30px", width: "40px" }} onInput={(e:any) => (window as any).syncColor('barcode-bar-color', 'barcode-bar-color-txt')} />
                                <input type="text" id="barcode-bar-color-txt" defaultValue="#ffffff" className="sidebar-control" style={{ padding: "5px" }} onInput={(e:any) => (window as any).syncColor('barcode-bar-color-txt', 'barcode-bar-color')} />
                            </div>
                        </div>
                    </div>
                    
                    <button className="sidebar-download-btn" onClick={() => (window as any).addSpotifyCode()} style={{ background: "var(--spotify)", color: "#fff", border: "none", padding: "12px" }} id="btn_add_barcode">ADD / UPDATE BARCODE</button>
                </div>
            </div>
        </div>

        <div id="search-results">
            <div style={{ textAlign: "right", cursor: "pointer", fontSize: "1.5rem", color: "var(--text-muted)", marginBottom: "20px" }} onClick={(e: any) => e.currentTarget.parentElement.style.display='none'}><i className="fas fa-times"></i></div>
            <div className="grid-pro" id="results-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))" }}></div>
        </div>
    </div>
  );
}
