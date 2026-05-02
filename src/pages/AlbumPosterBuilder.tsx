import React, { useEffect, useRef, useState } from 'react';
import { useStore } from '../store/useStore';

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

export default function AlbumPosterBuilder() {
  const addToCart = useStore((state: any) => state.addToCart);
  const isInitialized = useRef(false);
  
  const [isFontDropdownOpen, setIsFontDropdownOpen] = useState(false);
  const [activeFont, setActiveFont] = useState("Inter");

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

      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/fabric.js/5.3.1/fabric.min.js');
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/node-vibrant/3.1.6/vibrant.min.js');
      
      if (!document.getElementById('pro-poster-styles')) {
        const style = document.createElement('style');
        style.id = 'pro-poster-styles';
        style.innerHTML = `
          :root { 
              --bg-main: #0e0e15; --bg-sidebar: #181824; --bg-input: #222232;
              --accent: #5a4fcb; --accent-hover: #6b5cdb; --text-main: #f8fafc;
              --text-muted: #8a8a9e; --border-color: #2b2b3d; --card-bg: #1e1e2d;
              --danger: #f43f5e; --spotify: #1DB954;
          }
          .poster-pro-container::-webkit-scrollbar { width: 6px; height: 6px; }
          .poster-pro-container::-webkit-scrollbar-track { background: var(--bg-main); }
          .poster-pro-container::-webkit-scrollbar-thumb { background: #3a3a52; border-radius: 4px; }
          .poster-pro-container::-webkit-scrollbar-thumb:hover { background: #505070; }
          .poster-pro-container *, .poster-pro-container *::before, .poster-pro-container *::after { box-sizing: border-box; }
          
          .sidebar-pro-left { width: 340px; background: var(--bg-sidebar); padding: 30px 25px; border-right: 1px solid var(--border-color); display: flex; flex-direction: column; gap: 24px; overflow-y: auto; z-index: 1000; flex-shrink: 0; }
          .sidebar-pro-right-wrapper { width: 340px; background: var(--bg-sidebar); border-left: 1px solid var(--border-color); display: flex; flex-direction: column; z-index: 1000; flex-shrink: 0; height: 100%; }
          .sidebar-pro-right-scroll { flex: 1; padding: 30px 25px; display: flex; flex-direction: column; gap: 24px; overflow-y: auto; }
          
          .sidebar-logo { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
          .sidebar-logo .icon { background: #ffd000; color: #000; width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 1.2rem; font-family: 'Montserrat', sans-serif;}
          .sidebar-logo .text { font-family: 'Montserrat', sans-serif; font-weight: 900; font-size: 1.4rem; letter-spacing: -0.5px; color: #fff;}
          .sidebar-group { display: flex; flex-direction: column; gap: 10px; }
          .sidebar-title { font-size: 0.65rem; text-transform: uppercase; color: var(--text-muted); font-weight: 800; letter-spacing: 1px; display: flex; align-items: center; gap: 8px;}
          .sidebar-control { background: var(--bg-input); border: 1px solid var(--border-color); color: var(--text-main); padding: 12px 14px; border-radius: 10px; outline: none; width: 100%; font-size: 0.85rem; cursor: pointer; transition: 0.2s; font-family: 'Inter', sans-serif;}
          .sidebar-control:hover, .sidebar-control:focus { border-color: var(--accent); }
          .sidebar-control::placeholder { color: #5a5a75; }
          .poster-pro-container input[type="color"].sidebar-control { padding: 2px 5px; height: 42px; cursor: pointer; }
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
          #top-bar { display: flex; justify-content: space-between; align-items: center; padding: 25px 40px; flex-shrink: 0; z-index: 50; width: 100%; }
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
          #search-results { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 80%; max-width: 1000px; height: 70%; background: var(--bg-sidebar); z-index: 5000; border-radius: 24px; padding: 40px; overflow-y: auto; display: none; border: 1px solid var(--border-color); box-shadow: 0 25px 50px rgba(0,0,0,0.8); }
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
          
          /* Branding section styling */
          .branding-row { display: flex; align-items: center; gap: 10px; padding: 8px 0; border-bottom: 1px solid var(--border-color); }
          .branding-row:last-child { border-bottom: none; }
          .branding-label { font-size: 0.8rem; flex: 1; }
          .opacity-row { display: flex; align-items: center; gap: 8px; margin-top: 4px; margin-bottom: 8px; }
          .opacity-label { font-size: 0.65rem; color: var(--text-muted); width: 55px; flex-shrink: 0; }
        `;
        document.head.appendChild(style);
      }
      
      initApplicationLogic();
    };

    initScripts();

    return () => {
      // Cleanup if needed
    };
  }, []);

  const initApplicationLogic = () => {
    const w = window as any;
    
    w.syncReactFontState = function(fontName: string) {
        setActiveFont(fontName);
    };

    w.showLoading = function(textKey: string, subtextKey = "") {
        document.getElementById('loader-text')!.innerText = textKey;
        document.getElementById('loader-subtext')!.innerText = subtextKey || "";
        document.getElementById('global-loader')!.style.display = 'flex';
    };
    
    w.hideLoading = function() {
        document.getElementById('global-loader')!.style.display = 'none';
    };

    w.variantStates = {};
    w.currentVariantKey = null;
    w.currentViewMode = 'gallery';
    w.latestVariantsData = [];
    w.PROPS_TO_SAVE = ['id', 'selectable', 'evented', 'lockMovementX', 'lockMovementY', 'lockScalingX', 'lockScalingY', 'lockRotation', 'hasControls', 'crossOrigin'];

    w.saveCurrentStateToMemory = function() {
        if (w.currentVariantKey && !w.isBatchGenerating) {
            try {
                w.variantStates[w.currentVariantKey] = w.canvas.toJSON(w.PROPS_TO_SAVE);
                const previewUrl = w.canvas.toDataURL({ format: 'jpeg', quality: 0.8, multiplier: 0.4 });
                const imgEl = document.getElementById(`preview_${w.currentVariantKey}`) as HTMLImageElement;
                if (imgEl) imgEl.src = previewUrl;
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
        'a2': { w: 4961, h: 7016 },
        '2x3': { w: 4000, h: 6000 }, 
        '3x4': { w: 6000, h: 8000 }, 
        '4x5': { w: 8000, h: 10000 } 
    };
    w.currentFormat = 'a2';
    w.BASE_PREVIEW_SCALE = 0.25; 
    
    w.currentImg = ''; w.albumTitle = 'poster'; w.paletteRects = []; w.separatorLine = null;
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

    w.updateFormat = function(newFormat: string) {
        w.currentFormat = newFormat;
        w.rescale((document.getElementById('zoom-slider') as HTMLInputElement).value);
        if (w.activeAlbumData) {
            w.generateAllVariants();
        } else if (w.currentImg) {
            document.getElementById('layoutSelect')!.dispatchEvent(new Event('change'));
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
        w.showLoading("Fetching album data..."); 
        document.getElementById('search-results')!.style.display = 'none'; 
        const s = document.createElement('script');
        s.src = `https://api.deezer.com/album/${id}?output=jsonp&callback=handleDeezerAlbumLoaded`; 
        s.onload = () => document.body.removeChild(s);
        document.body.appendChild(s);
    };

    w.handleDeezerAlbumLoaded = function(d: any) {
        w.activeAlbumData = d; w.currentSpotifyUri = null; (document.getElementById('spotifyLink') as HTMLInputElement).value = "";
        const spotifySearchBtn = document.getElementById('spotifySearchBtn') as HTMLAnchorElement;
        const query = encodeURIComponent(d.artist.name + " " + d.title);
        spotifySearchBtn.href = `https://open.spotify.com/search/${query}/albums`;
        w.hideLoading();
        w.generateAllVariants();
    };

    // ============================================================
    // BRANDING & QR
    // ============================================================
    w.getBrandingColor = function() {
        const theme = (document.getElementById('themeSelect') as HTMLSelectElement).value;
        return (theme === 'dark' || theme === 'blurry' || theme === 'colorful') ? "#eeeeee" : "#222222";
    };

    w.getBrandingWebText = function() {
        return document.getElementById('brandingWebText') ? 
               (document.getElementById('brandingWebText') as HTMLInputElement).value || 'musicposter.shop' : 
               'musicposter.shop';
    };

    w.getBrandingQRUrl = function() {
        return document.getElementById('brandingQRUrl') ? 
               (document.getElementById('brandingQRUrl') as HTMLInputElement).value || 'https://musicposter.shop' : 
               'https://musicposter.shop';
    };

    w.updateOpacityDisplays = function() {
        const tOp = document.getElementById('textOpacity') as HTMLInputElement;
        const qOp = document.getElementById('qrOpacity') as HTMLInputElement;
        const tVal = document.getElementById('textOpacityVal');
        const qVal = document.getElementById('qrOpacityVal');
        if (tVal && tOp) tVal.textContent = parseFloat(tOp.value).toFixed(1);
        if (qVal && qOp) qVal.textContent = parseFloat(qOp.value).toFixed(1);
    };

    w.applyBrandingSettings = function() {
        w.updateOpacityDisplays();
        
        const showText = (document.getElementById('textToggle') as HTMLInputElement).checked;
        const textOpacity = parseFloat((document.getElementById('textOpacity') as HTMLInputElement).value);
        const showQR = (document.getElementById('qrToggle') as HTMLInputElement).checked;
        const qrOpacity = parseFloat((document.getElementById('qrOpacity') as HTMLInputElement).value);

        const textObj = w.canvas.getObjects().find((o:any) => o.id === 'branding-text');
        const qrObj = w.canvas.getObjects().find((o:any) => o.id === 'branding-qr');

        if (textObj) textObj.set({ visible: showText, opacity: textOpacity });
        if (qrObj) qrObj.set({ visible: showQR, opacity: qrOpacity });

        w.canvas.requestRenderAll();
        if (!w.isBatchGenerating) { w.saveCurrentStateToMemory(); }
    };

    w.refreshBranding = async function() {
        await w.initBrandingObjects();
        if (!w.isBatchGenerating) {
            w.saveState();
            w.saveCurrentStateToMemory();
            w.updateLayersPanel();
        }
    };

    w.initBrandingObjects = async function() {
        return new Promise(async (resolve) => {
            const elemColor = w.getBrandingColor();
            const webText = w.getBrandingWebText();
            const qrUrl = w.getBrandingQRUrl();
            const m = w.getLayoutMetrics();

            const showText = (document.getElementById('textToggle') as HTMLInputElement).checked;
            const textOpacity = parseFloat((document.getElementById('textOpacity') as HTMLInputElement).value);
            const showQR = (document.getElementById('qrToggle') as HTMLInputElement).checked;
            const qrOpacity = parseFloat((document.getElementById('qrOpacity') as HTMLInputElement).value);

            // Eski branding objelerini sil
            const oldObjs = w.canvas.getObjects().filter((o:any) => o.id === 'branding-text' || o.id === 'branding-qr');
            oldObjs.forEach((o:any) => w.canvas.remove(o));

            const bottomY = m.OY + (7016 * m.S) - (120 * m.S);
            const canvasCenterX = m.OX + (4961 * m.S) / 2;

            // 1. Text Objesi
            let textObj = new w.fabric.IText(webText, {
                fontSize: 55 * m.S,
                fontFamily: 'Inter',
                fontWeight: 700,
                fill: elemColor,
                originX: 'center',
                originY: 'center',
                left: canvasCenterX,
                top: bottomY,
                id: 'branding-text',
                visible: showText,
                opacity: textOpacity,
                selectable: true
            });
            w.canvas.add(textObj);
            w.canvas.bringToFront(textObj);

            // 2. QR Objesi (Pure Canvas Generator)
            const qrSize = Math.round(256 * m.S * 3); 
            const qrDataUrl = await w.generateQRDataURL(qrUrl, Math.min(qrSize, 512), elemColor);
            
            if (qrDataUrl) {
                w.fabric.Image.fromURL(qrDataUrl, function(qrImg: any) {
                    if (!qrImg) { 
                        w.positionBrandingObjects(textObj, null, m, bottomY, canvasCenterX, showText, showQR);
                        resolve(true); return; 
                    }
                    qrImg.scaleToHeight(85 * m.S);
                    qrImg.set({
                        originX: 'center',
                        originY: 'center',
                        id: 'branding-qr',
                        visible: showQR,
                        opacity: qrOpacity,
                        selectable: true
                    });
                    w.canvas.add(qrImg);
                    w.canvas.bringToFront(qrImg);
                    
                    w.positionBrandingObjects(textObj, qrImg, m, bottomY, canvasCenterX, showText, showQR);
                    w.canvas.requestRenderAll();
                    resolve(true);
                });
            } else {
                w.positionBrandingObjects(textObj, null, m, bottomY, canvasCenterX, showText, showQR);
                w.canvas.requestRenderAll();
                resolve(true);
            }
        });
    };

    w.positionBrandingObjects = function(textObj: any, qrObj: any, m: any, bottomY: number, canvasCenterX: number, showText: boolean, showQR: boolean) {
        const gap = 30 * m.S;
        if (textObj && qrObj && showText && showQR) {
            let tW = textObj.getScaledWidth();
            let qW = qrObj.getScaledWidth();
            let totalW = qW + gap + tW;
            let startX = canvasCenterX - (totalW / 2);
            qrObj.set({ left: startX + (qW / 2), top: bottomY });
            textObj.set({ left: startX + qW + gap + (tW / 2), top: bottomY });
        } else if (textObj && showText) {
            textObj.set({ left: canvasCenterX, top: bottomY });
        } else if (qrObj && showQR) {
            qrObj.set({ left: canvasCenterX, top: bottomY });
        }
    };

    w.generateQRDataURL = function(text: string, size: number, color: string) {
        color = color || '#000000';
        return new Promise((resolve) => {
            const container = document.getElementById('qr-hidden');
            if(!container) return resolve(null);
            container.innerHTML = '';
            
            try {
                const qr = new (window as any).QRCode(container, {
                    text: text || 'https://musicposter.shop',
                    width: size || 256,
                    height: size || 256,
                    colorDark: color,
                    colorLight: 'rgba(0,0,0,0)',
                    correctLevel: (window as any).QRCode.CorrectLevel.M
                });
                
                setTimeout(() => {
                    const img = container.querySelector('img');
                    if (img && img.src) { resolve(img.src); } 
                    else {
                        const cvs = container.querySelector('canvas');
                        if (cvs) { resolve(cvs.toDataURL()); } 
                        else { resolve(null); }
                    }
                }, 100);
            } catch(e) { resolve(null); }
        });
    };

    // Spotify barcode
    w.addSpotifyCodePromise = function() {
        return new Promise((resolve) => {
            let uri = (document.getElementById('spotifyLink') as HTMLInputElement).value.trim();
            if(!uri) uri = 'spotify:track:4uLU6hMCjMI75M1A2tKUQC';
            let url = `https://scannables.scdn.co/uri/plain/png/000000/white/640/${uri}`;
            w.fabric.Image.fromURL(url, function(img: any) {
                if(!img) return resolve(true);
                const m = w.getLayoutMetrics();
                img.scaleToWidth(800 * m.S);
                img.set({ left: m.OX + ((4961 * m.S) / 2) - (400 * m.S), top: m.OY + (7016 * m.S) - (1200 * m.S), id: 'spotify-code' });
                let existing = w.canvas.getObjects().find((o: any) => o.id === 'spotify-code');
                if (existing) w.canvas.remove(existing);
                w.canvas.add(img); w.canvas.bringToFront(img);
                if(!w.isBatchGenerating) { w.saveState(); w.updateLayersPanel(); }
                resolve(true);
            }, { crossOrigin: 'anonymous' });
        });
    };
    
    w.addSpotifyCode = async function() { 
        await w.addSpotifyCodePromise(); 
        if(!w.isBatchGenerating) { w.saveState(); w.updateLayersPanel(); w.saveCurrentStateToMemory(); } 
    };

    // ============================================================
    // PALETTE EXTRACTION
    // ============================================================
    w.extractPalettePromise = function(imgUrl: string) {
        return new Promise((resolve) => {
            const img = new Image(); img.crossOrigin = "anonymous"; img.src = imgUrl;
            img.onload = function() {
                w.Vibrant.from(img).getPalette().then((palette: any) => {
                    const finalColors = [
                        palette.Vibrant ? palette.Vibrant.hex : '#ffffff',
                        palette.DarkVibrant ? palette.DarkVibrant.hex : '#aaaaaa',
                        palette.LightVibrant ? palette.LightVibrant.hex : '#dddddd',
                        palette.Muted ? palette.Muted.hex : '#555555',
                        palette.DarkMuted ? palette.DarkMuted.hex : '#222222'
                    ];
                    finalColors.forEach((hex, i) => {
                        const input = document.getElementById('p' + (i + 1)) as HTMLInputElement;
                        if (input) { input.value = hex; w.setPalette(i, hex); }
                    });
                    resolve(true);
                }).catch(() => resolve(true));
            };
            img.onerror = () => resolve(true);
        });
    };

    w.forceExtractPalette = function() {
        if(w.currentImg) {
            w.showLoading("Processing...");
            w.extractPalettePromise(w.currentImg).then(() => {
                w.applyTheme((document.getElementById('themeSelect') as HTMLSelectElement).value);
                w.hideLoading();
            }).catch(() => w.hideLoading());
        } else { alert('Please upload or select an image first!'); }
    };

    // ============================================================
    // BLUR BACKGROUND
    // ============================================================
    w.updateBlurSettingsPromise = function() {
        return new Promise((resolve) => {
            const dims = w.getCurrentDimensions();
            const on = (document.getElementById('blurToggle') as HTMLInputElement).checked;
            const amount = parseFloat((document.getElementById('blurAmount') as HTMLInputElement).value);
            const brightness = (document.getElementById('blurBrightness') as HTMLInputElement).value;
            const frameColor = (document.getElementById('frameColorPicker') as HTMLInputElement).value;
            if(!on || !w.currentImg) {
                w.canvas.setBackgroundImage(null, () => { w.canvas.setBackgroundColor(frameColor, () => { w.canvas.renderAll(); resolve(true); }); });
                return;
            }
            const img = new Image(); img.crossOrigin = "anonymous";
            img.onload = () => {
                const off = document.createElement('canvas');
                off.width = dims.w * w.BASE_PREVIEW_SCALE;
                off.height = dims.h * w.BASE_PREVIEW_SCALE;
                const ctx = off.getContext('2d');
                if(ctx) {
                    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, off.width, off.height);
                    const scaledBlur = amount * (off.width / (4961 * w.BASE_PREVIEW_SCALE));
                    ctx.filter = `blur(${scaledBlur}px) brightness(${brightness})`;
                    const ratio = Math.max(off.width / img.width, off.height / img.height);
                    const drawW = img.width * ratio, drawH = img.height * ratio;
                    ctx.drawImage(img, (off.width - drawW)/2, (off.height - drawH)/2, drawW, drawH);
                }
                w.fabric.Image.fromURL(off.toDataURL('image/jpeg', 0.8), (fImg: any) => {
                    fImg.set({ scaleX: 1, scaleY: 1, originX: 'left', originY: 'top' });
                    w.canvas.setBackgroundImage(fImg, () => { w.canvas.renderAll(); resolve(true); });
                });
            };
            img.onerror = () => resolve(true); img.src = w.currentImg;
        });
    };
    w.updateBlurSettings = async function() { await w.updateBlurSettingsPromise(); w.saveCurrentStateToMemory(); };

    document.getElementById('customUpload')?.addEventListener('change', function(e: any) {
        const file = e.target.files[0]; if(!file) return;
        const reader = new FileReader();
        reader.onload = function(f: any) {
            w.currentImg = f.target.result;
            let existingImg = w.canvas.getObjects().find((o: any) => o.id === 'main-cover');
            w.fabric.Image.fromURL(w.currentImg, async function(newImg: any) {
                const m = w.getLayoutMetrics();
                newImg.set({ id: 'main-cover' });
                if (existingImg) {
                    newImg.set({ left: existingImg.left, top: existingImg.top });
                    newImg.scaleToWidth(existingImg.getScaledWidth());
                    w.canvas.remove(existingImg);
                } else {
                    newImg.set({ left: m.OX + (250 * m.S), top: m.OY + (250 * m.S) });
                    newImg.scaleToWidth((4961 - 500) * m.S);
                }
                w.canvas.add(newImg); newImg.sendToBack();
                await w.extractPalettePromise(w.currentImg);
                await w.updateBlurSettingsPromise();
                w.saveState(); w.saveCurrentStateToMemory();
            });
        };
        reader.readAsDataURL(file);
    });

    // ============================================================
    // RENDERERS (STANDART, MINIMAL, VINYL)
    // ============================================================
    const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    
    w.renderStandard = async function(d: any) {
        return new Promise(async (resolve) => {
            w.currentImg = d.cover_xl; w.albumTitle = d.title;
            const m = w.getLayoutMetrics();
            const dateArr = d.release_date.split('-');
            const day = parseInt(dateArr[2]);
            const getOrdinal = (n: number) => { let s=["th","st","nd","rd"],v=n%100; return n+(s[(v-20)%10]||s[v]||s[0]); };
            const dateStr = `${months[parseInt(dateArr[1])-1]} ${getOrdinal(day)} ${dateArr[0]}`.trim();
            const hr = Math.floor(d.duration/3600), min = Math.floor((d.duration%3600)/60), sec = d.duration%60;
            const length = hr > 0 ? `${hr}:${min.toString().padStart(2,'0')}:${sec.toString().padStart(2,'0')}` : `${min.toString().padStart(2,'0')}:${sec.toString().padStart(2,'0')}`;

            w.canvas.clear(); w.paletteRects = [];
            await document.fonts.load('100px Inter');
            await document.fonts.load('700 140px Inter');
            await document.fonts.load('500 55px Inter');
            await document.fonts.load('700 60px Montserrat');

            w.fabric.Image.fromURL(d.cover_xl, async function(img: any) {
                const px = m.OX + (250*m.S), py = m.OY + (250*m.S), contentW = (4961-500)*m.S;
                img.scaleToWidth(contentW); img.set({ left: px, top: py, id: 'main-cover' }); w.canvas.add(img);

                let currentY = py + img.getScaledHeight() + (120*m.S);
                let artistClean = d.artist.name.replace(/\s*\(.*?\)\s*/g,'').replace(/\s*\[.*?\]\s*/g,'').trim().toUpperCase();
                let artistText = new w.fabric.IText(artistClean, { left: px, top: currentY, fontSize: 90*m.S, fontFamily: 'Inter', fontWeight: 300, fill: '#111', id: 'artist-text' });
                w.canvas.add(artistText); currentY += artistText.height + (15*m.S);

                let titleClean = d.title.replace(/\s*\(.*?\)\s*/g,'').replace(/\s*\[.*?\]\s*/g,'').trim().toUpperCase();
                let titleText = new w.fabric.IText(titleClean, { left: px, top: currentY, fontSize: 140*m.S, fontWeight: 700, fill: '#111', fontFamily: 'Inter', id: 'title-text' });
                w.canvas.add(titleText);

                let paletteY = currentY + titleText.height - (90*m.S) - (13*m.S);
                let boxW = 180*m.S, boxH = 90*m.S, gap = 20*m.S;
                let startX = px + contentW - ((boxW*5)+(gap*4));
                for(let i=0; i<5; i++) {
                    let rect = new w.fabric.Rect({ left: startX+i*(boxW+gap), top: paletteY, width: boxW, height: boxH, fill: '#000', id: 'palette-rect' });
                    w.canvas.add(rect); w.paletteRects.push(rect);
                }

                currentY = Math.max(currentY + titleText.height, paletteY + boxH) + (20*m.S);
                let lineCol = (document.getElementById('lineColorPicker') as HTMLInputElement).value;
                w.separatorLine = new w.fabric.Rect({ left: px, top: currentY, width: contentW, height: 8*m.S, fill: lineCol, id: 'separator' });
                w.canvas.add(w.separatorLine); currentY += (8*m.S) + (70*m.S);

                let trackY1 = currentY, trackY2 = currentY;
                let col2X = px + (contentW * 0.376);
                const MAX_Y = m.OY + ((7016-250)*m.S);
                d.tracks.data.forEach((tObj: any) => {
                    let trackName = tObj.title.replace(/\s*\(.*?\)\s*/g,'').replace(/\s*\[.*?\]\s*/g,'').trim().toUpperCase();
                    let txt = new w.fabric.IText(trackName, { fontSize: 60*m.S, fontFamily: 'Montserrat', fontWeight: 700, fill: '#333', id: 'track-text' });
                    let isCol2 = (trackY1 + txt.height + (30*m.S)) > MAX_Y;
                    txt.set({ left: isCol2 ? col2X : px, top: isCol2 ? trackY2 : trackY1 });
                    w.canvas.add(txt);
                    if(isCol2) trackY2 += txt.height + (30*m.S); else trackY1 += txt.height + (30*m.S);
                });

                let finalGenre = w.translateGenre(d.genres?.data[0]?.name || 'Hip Hop');
                let metaY = currentY;
                const metaItems = [
                    { l: "Released on:", v: dateStr },
                    { l: "Record Label:", v: d.label || 'Def Jam' },
                    { l: "Genre:", v: finalGenre },
                    { l: "Tracks:", v: d.tracks.data.length.toString() },
                    { l: "Length:", v: length }
                ];
                metaItems.forEach(mi => {
                    let mVal = new w.fabric.IText(mi.v, { left: px+contentW, top: metaY, fontSize: 55*m.S, fontFamily: 'Inter', fill: '#555', originX: 'right', textAlign: 'right', id: 'meta-val' });
                    let mLbl = new w.fabric.IText(mi.l+" ", { left: px+contentW-mVal.width, top: metaY, fontSize: 55*m.S, fontFamily: 'Inter', fontWeight: 700, fill: '#111', originX: 'right', textAlign: 'right', id: 'meta-lbl' });
                    w.canvas.add(mLbl, mVal); metaY += Math.max(mVal.height, mLbl.height) + (80*m.S);
                });

                await w.extractPalettePromise(d.cover_xl);
                await w.applyTheme((document.getElementById('themeSelect') as HTMLSelectElement).value);
                w.canvas.requestRenderAll();
                setTimeout(() => resolve(true), 50);
            }, { crossOrigin: 'anonymous' });
        });
    };

    w.renderMinimal = async function(d: any) {
        return new Promise(async (resolve) => {
            w.currentImg = d.cover_xl; w.albumTitle = d.title;
            const m = w.getLayoutMetrics();
            const dateArr = d.release_date.split('-');
            const day = parseInt(dateArr[2]);
            const getOrdinal = (n: number) => { let s=["th","st","nd","rd"],v=n%100; return n+(s[(v-20)%10]||s[v]||s[0]); };
            const dateStr = `${months[parseInt(dateArr[1])-1]} ${getOrdinal(day)} ${dateArr[0]}`.trim();
            let totalMs = d.tracks.data.reduce((acc: number, t: any) => acc + (t.duration*1000), 0);
            let h = Math.floor(totalMs/3600000), mMin = Math.floor((totalMs%3600000)/60000);
            let durationStr = h > 0 ? `${h} HR ${mMin} MIN` : `${mMin} MIN`;

            w.canvas.clear(); w.paletteRects = [];
            await document.fonts.load('100px Inter');
            await document.fonts.load('700 140px Inter');
            await document.fonts.load('500 55px Inter');
            await document.fonts.load('700 60px Montserrat');
            await document.fonts.load('400 80px Allura');
            let textColor = (document.getElementById('lineColorPicker') as HTMLInputElement).value || "#212121";

            w.fabric.Image.fromURL(d.cover_xl, async function(img: any) {
                const margin = 250*m.S, coverW = 4961*0.85*m.S;
                const leftColX = m.OX + ((4961*m.S)-coverW)/2;
                const rightColX = leftColX + coverW;
                img.scaleToWidth(coverW); img.set({ left: leftColX, top: m.OY+margin, id: 'main-cover' }); w.canvas.add(img);

                let contentY = m.OY+margin+img.getScaledHeight()+(150*m.S);
                let trackY = contentY, currentTrackColX = leftColX;
                const MAX_Y = m.OY + ((7016-300)*m.S);

                d.tracks.data.forEach((tObj: any) => {
                    let trackName = tObj.title.replace(/^\d+\.\s*/,'').replace(/\s*\(.*?\)\s*/g,'').replace(/\s*\[.*?\]\s*/g,'').trim().toUpperCase();
                    let txt = new w.fabric.IText(trackName, { fontSize: 60*m.S, fontFamily: 'Montserrat', fontWeight: 700, fill: textColor, id: 'track-text' });
                    if (trackY + txt.height + (35*m.S) > MAX_Y) { currentTrackColX += (1200*m.S); trackY = contentY; }
                    txt.set({ left: currentTrackColX, top: trackY }); w.canvas.add(txt);
                    trackY += txt.height + (35*m.S);
                });

                let boxW=270*m.S, boxH=270*m.S, gap=30*m.S;
                let startX = rightColX - ((boxW*5)+(gap*4));
                for(let i=0; i<5; i++) {
                    let rect = new w.fabric.Rect({ left: startX+i*(boxW+gap), top: contentY, width: boxW, height: boxH, fill: '#000', id: 'palette-rect' });
                    w.canvas.add(rect); w.paletteRects.push(rect);
                }

                let textStartY = contentY + boxH + (100*m.S);
                let artistClean = d.artist.name.replace(/\s*\(.*?\)\s*/g,'').replace(/\s*\[.*?\]\s*/g,'').trim();
                let artistText = new w.fabric.IText(artistClean.toUpperCase(), { left: rightColX, top: textStartY, fontSize: 130*m.S, fontFamily: 'Montserrat', fontWeight: 700, fill: textColor, originX: 'right', id: 'artist-text' }); w.canvas.add(artistText);
                let titleClean = d.title.replace(/\s*\(.*?\)\s*/g,'').replace(/\s*\[.*?\]\s*/g,'').trim().toUpperCase();
                let titleText = new w.fabric.Textbox(titleClean, { left: rightColX, top: artistText.top+artistText.height+(50*m.S), width: (4961*m.S)/2, fontSize: 180*m.S, fontFamily: 'Montserrat', fontWeight: 900, fill: textColor, originX: 'right', textAlign: 'right', id: 'title-text' }); w.canvas.add(titleText);
                let signatureText = new w.fabric.IText(artistClean, { left: rightColX, top: titleText.top+titleText.height+(100*m.S), fontSize: 250*m.S, fontFamily: 'Allura', fill: textColor, originX: 'right', angle: -15, id: 'signature-text' }); w.canvas.add(signatureText);

                let footerY = m.OY + (7016-250)*m.S;
                let l1 = new w.fabric.IText(`RECORD LABEL: ${d.label||'ALBUM POSTER WALL ART'}`, { left: leftColX, top: footerY-(80*m.S), fontSize: 50*m.S, fontFamily: 'Montserrat', fontWeight: 700, fill: textColor, id: 'layout2-meta' });
                let l2 = new w.fabric.IText(`ALBUM LENGTH: ${durationStr}`, { left: leftColX, top: footerY, fontSize: 50*m.S, fontFamily: 'Montserrat', fontWeight: 700, fill: textColor, id: 'layout2-meta' });
                let r1 = new w.fabric.IText('RELEASED ON', { left: rightColX, top: footerY-(80*m.S), fontSize: 50*m.S, fontFamily: 'Montserrat', fontWeight: 700, fill: textColor, originX: 'right', textAlign: 'right', id: 'layout2-meta' });
                let r2 = new w.fabric.IText(dateStr.toUpperCase(), { left: rightColX, top: footerY, fontSize: 50*m.S, fontFamily: 'Montserrat', fontWeight: 700, fill: textColor, originX: 'right', textAlign: 'right', id: 'layout2-meta' });
                w.canvas.add(l1, l2, r1, r2);

                await w.extractPalettePromise(d.cover_xl);
                await w.applyTheme((document.getElementById('themeSelect') as HTMLSelectElement).value);
                w.canvas.requestRenderAll();
                setTimeout(() => resolve(true), 50);
            }, { crossOrigin: 'anonymous' });
        });
    };

    // --- VINYL AWARD RENDERER (Uses the exact requested SVG files) ---
    w.renderVinyl = async function(d: any) {
        return new Promise(async (resolve) => {
            w.currentImg = d.cover_xl; w.albumTitle = d.title;
            const m = w.getLayoutMetrics();
            
            const dateArr = d.release_date.split('-');
            const monthsNames = ["JANUARY","FEBRUARY","MARCH","APRIL","MAY","JUNE","JULY","AUGUST","SEPTEMBER","OCTOBER","NOVEMBER","DECEMBER"];
            const dateStr = `${monthsNames[parseInt(dateArr[1])-1]} ${dateArr[0]}`.trim(); 
            const exactDate = `${dateArr[2]}.${dateArr[1]}.${dateArr[0]}`; 

            w.canvas.clear(); w.paletteRects = [];
            
            const canvasW = 4961 * m.S;
            const centerX = m.OX + (canvasW / 2);
            const vinylY = m.OY + (400 * m.S);
            const vinylSize = 3500 * m.S;

            w.fabric.Image.fromURL('/goldfull.svg', function(vinylImg: any) {
                if (vinylImg) {
                    vinylImg.scaleToWidth(vinylSize);
                    vinylImg.set({ 
                        originX: 'center', originY: 'top', left: centerX, top: vinylY, 
                        id: 'vinyl-base', shadow: new w.fabric.Shadow({ color: 'rgba(0,0,0,0.6)', blur: 40*m.S, offsetY: 20*m.S }) 
                    });
                    w.canvas.add(vinylImg);
                }

                // PLAK GÖBEĞİ (CENTER LABEL)
                const labelRadius = 550 * m.S; 
                const labelCenterY = vinylY + (vinylSize / 2);
                
                w.fabric.Image.fromURL(d.cover_xl, function(coverImg: any) {
                    coverImg.scaleToWidth(labelRadius * 2);
                    coverImg.set({
                        originX: 'center', originY: 'center', left: centerX, top: labelCenterY,
                        clipPath: new w.fabric.Circle({ radius: labelRadius, originX: 'center', originY: 'center' }), 
                        selectable: false
                    });
                    w.canvas.add(coverImg);

                    w.canvas.add(new w.fabric.Circle({ radius: 35 * m.S, fill: '#0e0e15', originX: 'center', originY: 'center', left: centerX, top: labelCenterY, selectable: false }));

                    w.canvas.add(new w.fabric.IText(`Released by ${d.label || 'MusicPoster'}`, { fontSize: 35*m.S, fontFamily: 'Inter', fontWeight: 600, fill: '#fff', originX: 'center', left: centerX, top: labelCenterY - (350*m.S), id: 'vinyl-txt-1' }));
                    w.canvas.add(new w.fabric.IText(d.artist.name, { fontSize: 180*m.S, fontFamily: 'Allura', fill: '#fff', originX: 'center', left: centerX, top: labelCenterY - (250*m.S), id: 'vinyl-txt-2' }));
                    w.canvas.add(new w.fabric.IText(d.title.toUpperCase(), { fontSize: 60*m.S, fontFamily: 'Montserrat', fontWeight: 900, fill: '#fff', originX: 'center', left: centerX, top: labelCenterY + (150*m.S), id: 'vinyl-txt-3' }));
                    w.canvas.add(new w.fabric.IText(d.artist.name, { fontSize: 50*m.S, fontFamily: 'Montserrat', fontStyle: 'italic', fill: '#ccc', originX: 'center', left: centerX, top: labelCenterY + (250*m.S), id: 'vinyl-txt-4' }));
                    w.canvas.add(new w.fabric.IText(exactDate, { fontSize: 40*m.S, fontFamily: 'Inter', fontWeight: 600, fill: '#ccc', originX: 'center', left: centerX, top: labelCenterY + (400*m.S), id: 'vinyl-txt-5' }));

                    // 3. ALT KISIM: KÜÇÜK KAPAK VE YARIM PLAK 
                    const bottomY = m.OY + (4600 * m.S);
                    const smallCoverW = 1500 * m.S;
                    const smallCoverX = m.OX + (400 * m.S);
                    const plaqueCenterY = bottomY + (smallCoverW/2);

                    w.fabric.Image.fromURL(d.cover_xl, function(smCover: any) {
                        smCover.scaleToWidth(smallCoverW);
                        smCover.set({ left: smallCoverX, top: bottomY, id: 'small-cover', shadow: new w.fabric.Shadow({ color: 'rgba(0,0,0,0.6)', blur: 30*m.S, offsetX: 10*m.S, offsetY: 10*m.S }) });
                        
                        w.fabric.Image.fromURL('/goldhalf.svg', function(halfImg: any) {
                            if (halfImg) {
                                halfImg.scaleToHeight(smallCoverW * 0.95);
                                halfImg.set({ originY: 'center', left: smallCoverX + smallCoverW - (150*m.S), top: plaqueCenterY, id: 'half-vinyl' });
                                w.canvas.add(halfImg);
                            }
                            
                            w.canvas.add(smCover); 

                            // 4. SAĞ ALT METALİK PLAKET
                            const plaqueX = smallCoverX + smallCoverW + (600 * m.S);
                            const plaqueW = canvasW - plaqueX - (400 * m.S);
                            const plaqueH = 1000 * m.S;

                            const plaqueBg = new w.fabric.Rect({
                                left: plaqueX, top: plaqueCenterY, originY: 'center', width: plaqueW, height: plaqueH,
                                stroke: '#d4af37', strokeWidth: 10 * m.S, id: 'plaque-bg',
                                shadow: new w.fabric.Shadow({ color: 'rgba(0,0,0,0.5)', blur: 20*m.S, offsetX: 10*m.S, offsetY: 10*m.S })
                            });
                            plaqueBg.set('fill', new w.fabric.Gradient({
                                type: 'linear', coords: { x1: 0, y1: 0, x2: plaqueW, y2: 0 },
                                colorStops: [ { offset: 0, color: '#110a05' }, { offset: 0.5, color: '#2a1708' }, { offset: 1, color: '#110a05' } ]
                            }));
                            w.canvas.add(plaqueBg);

                            const pCenterX = plaqueX + (plaqueW/2);
                            w.canvas.add(new w.fabric.IText(d.artist.name, { fontSize: 220*m.S, fontFamily: 'Allura', fill: '#fff', originX: 'center', originY: 'center', left: pCenterX, top: plaqueCenterY - (150*m.S), id: 'plaque-txt-1' }));
                            w.canvas.add(new w.fabric.IText("YOUR CUSTOM TEXT GOES HERE", { fontSize: 60*m.S, fontFamily: 'Montserrat', fontWeight: 600, fill: '#fff', originX: 'center', originY: 'center', left: pCenterX, top: plaqueCenterY + (80*m.S), id: 'plaque-txt-2' }));
                            w.canvas.add(new w.fabric.IText(`RELEASED ${dateStr}`, { fontSize: 45*m.S, fontFamily: 'Inter', fontWeight: 400, fill: '#ccc', originX: 'center', originY: 'center', left: pCenterX, top: plaqueCenterY + (200*m.S), id: 'plaque-txt-3' }));

                            (document.getElementById('blurToggle') as HTMLInputElement).checked = true;
                            (document.getElementById('blurAmount') as HTMLInputElement).value = "100";
                            (document.getElementById('blurBrightness') as HTMLInputElement).value = "0.2";
                            w.updateBlurSettings().then(() => {
                                w.canvas.requestRenderAll();
                                setTimeout(() => resolve(true), 50);
                            });

                        }, { crossOrigin: 'anonymous' });
                    }, { crossOrigin: 'anonymous' });
                }, { crossOrigin: 'anonymous' });
            }, { crossOrigin: 'anonymous' });
        });
    };

    // ============================================================
    // THEME APPLICATION
    // ============================================================
    w.applyTheme = async function(theme: string) {
        let layout = (document.getElementById('layoutSelect') as HTMLSelectElement).value;
        let frameColor="#ffffff", textColor="#212121", subTextColor="#444444", descColor="#333333", lineColor="#222222", isBlur=false;

        if (theme==='light') { frameColor="#f5f5f5"; textColor="#212121"; subTextColor="#444444"; descColor="#333333"; lineColor="#222222"; }
        else if (theme==='dark') { frameColor="#111111"; textColor="#f5f5f5"; subTextColor="#cccccc"; descColor="#dddddd"; lineColor="#eeeeee"; }
        else if (theme==='blurry') { isBlur=true; textColor="#f5f5f5"; subTextColor="#eeeeee"; descColor="#f5f5f5"; lineColor="#ffffff"; }
        else if (theme==='colorful') { frameColor=(document.getElementById('p1') as HTMLInputElement).value||"#d68c5b"; textColor="#f5f5f5"; subTextColor="#eeeeee"; descColor="#f5f5f5"; lineColor="#ffffff"; }

        (document.getElementById('frameColorPicker') as HTMLInputElement).value = frameColor;
        if (!isBlur) { w.canvas.setBackgroundImage(null, ()=>{}); w.canvas.setBackgroundColor(frameColor, ()=>{}); }
        (document.getElementById('lineColorPicker') as HTMLInputElement).value = lineColor;
        if(w.separatorLine) w.separatorLine.set('fill', lineColor);
        (document.getElementById('blurToggle') as HTMLInputElement).checked = isBlur;
        await w.updateBlurSettingsPromise();

        w.canvas.getObjects().forEach((obj: any) => {
            if (['artist-text','meta-val','meta-lbl','title-text','track-text','signature-text','layout2-meta'].includes(obj.id)) {
                if (obj.type !== 'rect') obj.set('fill', (obj.id==='meta-val'||(obj.id==='artist-text'&&layout==='standart')) ? subTextColor : textColor);
            }
            if (obj.id==='desc-text') obj.set('fill', descColor);
        });

        if(w.currentSpotifyUri || (document.getElementById('spotifyLink') as HTMLInputElement).value.trim()) await w.addSpotifyCodePromise();
        await w.initBrandingObjects();
        w.canvas.requestRenderAll();
    };

    w.handleThemeChange = async function(newTheme: string) {
        if (!w.activeAlbumData) { await w.applyTheme(newTheme); return; }
        w.saveCurrentStateToMemory();
        await w.applyTheme(newTheme);
        let l = (document.getElementById('layoutSelect') as HTMLSelectElement).value;
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
            w.showLoading("Loading into editor...");
            w.isBatchGenerating = true;
            try {
                if(newLayout==='standart') await w.renderStandard(w.activeAlbumData);
                else if(newLayout==='minimal') await w.renderMinimal(w.activeAlbumData);
                else if(newLayout==='vinyl') await w.renderVinyl(w.activeAlbumData);
            } catch(e) { console.error(e); }
            finally {
                w.isBatchGenerating = false;
                w.saveState(); w.saveCurrentStateToMemory(); w.hideLoading();
            }
        }
    };

    w.applyImageFilter = function(type: string) {
        let obj = w.canvas.getActiveObject(); if(!obj || obj.type!=='image') return;
        obj.filters = [];
        if (type==='grayscale') obj.filters.push(new w.fabric.Image.filters.Grayscale());
        if (type==='sepia') obj.filters.push(new w.fabric.Image.filters.Sepia());
        if (type==='vintage') obj.filters.push(new w.fabric.Image.filters.Vintage());
        obj.applyFilters(); w.canvas.requestRenderAll(); w.saveState(); w.saveCurrentStateToMemory();
    };

    w.updateFrameColor = function(v: string) {
        if (!(document.getElementById('blurToggle') as HTMLInputElement).checked) {
            w.canvas.setBackgroundImage(null, ()=>w.canvas.renderAll());
            w.canvas.setBackgroundColor(v, ()=>w.canvas.renderAll());
        }
        w.saveCurrentStateToMemory();
    };
    w.updateLineColor = function(v: string) {
        if(w.separatorLine) { w.separatorLine.set('fill', v); w.canvas.requestRenderAll(); if(!w.isBatchGenerating) w.saveState(); w.saveCurrentStateToMemory(); }
    };
    
    // YENİ EKLENTİ: GLOBAL SENKRONİZASYON MOTORU
    w.syncPropertyToAllVariants = function(activeObj: any, prop: string, val: any, exactIndex = -1) {
        if (!activeObj || !activeObj.id || w.isBatchGenerating) return;
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
                    if (prop === 'fontSize') { matches[targetIndex].scaleX = 1; matches[targetIndex].scaleY = 1; }
                }
            } catch(e) {}
        }
    };

    w.setPalette = function(i: number, c: string) {
        if(w.paletteRects && w.paletteRects[i]) { 
            w.paletteRects[i].set('fill', c); w.canvas.requestRenderAll(); w.saveCurrentStateToMemory(); 
            w.syncPropertyToAllVariants(w.paletteRects[i], 'fill', c, i); // Senkronize et
        }
    };

    // ============================================================
    // GENERATE ALL VARIANTS
    // ============================================================
    w.confirmGenerateAll = function() {
        if(Object.keys(w.variantStates).length > 0) {
            if(!confirm('This will regenerate all variants. Are you sure?')) return;
        }
        w.generateAllVariants();
    };

    w.generateAllVariants = async function() {
        if(!w.activeAlbumData) { alert('Please search and select an album first!'); return; }
        w.showLoading("Generating all variants...", "Please wait...");
        w.isBatchGenerating = true; w.variantStates = {};
        const wasGridOn = w.isGridEnabled; if(wasGridOn) w.toggleGrid(false);

        const layouts = ['standart','minimal','vinyl'];
        const themes = ['light','dark','blurry','colorful'];
        const variantsData: any = [];
        await w.extractPalettePromise(w.activeAlbumData.cover_xl);

        for (let l of layouts) {
            for (let t_theme of themes) {
                (document.getElementById('layoutSelect') as HTMLSelectElement).value = l;
                (document.getElementById('themeSelect') as HTMLSelectElement).value = t_theme;
                if (l==='standart') await w.renderStandard(w.activeAlbumData);
                else if (l==='minimal') await w.renderMinimal(w.activeAlbumData);
                else if (l==='vinyl') await w.renderVinyl(w.activeAlbumData);
                
                let key = `${l}_${t_theme}`;
                w.variantStates[key] = w.canvas.toJSON(w.PROPS_TO_SAVE);
                
                try {
                    const previewUrl = w.canvas.toDataURL({ format: 'jpeg', quality: 0.8, multiplier: 0.4 });
                    variantsData.push({ layout: l, theme: t_theme, url: previewUrl, key: key });
                } catch(e) {
                    variantsData.push({ layout: l, theme: t_theme, url: '', key: key });
                }
            }
        }

        w.latestVariantsData = variantsData;
        if(wasGridOn) w.toggleGrid(true); w.isBatchGenerating = false;

        const grid = document.getElementById('variants-grid');
        if(grid) {
            grid.innerHTML = variantsData.map((v: any) => `
                <div class="variant-card" onclick="window.editVariant('${v.layout}','${v.theme}')">
                    <img id="preview_${v.key}" src="${v.url}">
                    <div class="variant-info">
                        <div class="variant-layout">${v.layout==='standart' ? 'Minimalist' : (v.layout==='minimal' ? 'bBoxes' : 'Gold Vinyl')}</div>
                        <div class="variant-theme">${v.theme} THEME</div>
                    </div>
                    <div class="variant-actions">
                        <button class="sidebar-download-btn btn-accent" style="padding:10px; width:100%;">EDIT THIS POSTER</button>
                    </div>
                </div>
            `).join('');
        }

        w.currentVariantKey = 'standart_light';
        (document.getElementById('layoutSelect') as HTMLSelectElement).value = 'standart';
        (document.getElementById('themeSelect') as HTMLSelectElement).value = 'light';
        w.canvas.loadFromJSON(w.variantStates[w.currentVariantKey], () => {
            w.canvas.requestRenderAll(); w.historyStack=[]; w.redoStack=[]; w.saveState(); w.hideLoading(); w.showVariantsView();
        });
    };

    w.editVariant = async function(layout: string, theme: string) {
        if (!w.activeAlbumData) return;
        w.saveCurrentStateToMemory();
        w.currentVariantKey = `${layout}_${theme}`;
        (document.getElementById('layoutSelect') as HTMLSelectElement).value = layout;
        (document.getElementById('themeSelect') as HTMLSelectElement).value = theme;
        w.showLoading("Loading into editor...");
        w.isBatchGenerating = true;
        try {
            if (w.variantStates[w.currentVariantKey]) {
                await new Promise(r => { w.canvas.loadFromJSON(w.variantStates[w.currentVariantKey], () => { w.canvas.requestRenderAll(); r(true); }); });
            } else {
                if (layout==='standart') await w.renderStandard(w.activeAlbumData);
                else if (layout==='minimal') await w.renderMinimal(w.activeAlbumData);
                else if (layout==='vinyl') await w.renderVinyl(w.activeAlbumData);
            }
        } catch(e) { console.error(e); }
        finally {
            w.isBatchGenerating = false; w.historyStack=[]; w.redoStack=[]; w.saveState(); w.hideLoading(); w.showSingleEditor();
        }
    };

    // ============================================================
    // HISTORY (UNDO/REDO) & OBJECT MODIFICATIONS
    // ============================================================
    w.historyStack = []; w.redoStack = []; w.isHistoryAction = false;
    w.saveState = function() {
        if(w.isHistoryAction || w.isBatchGenerating) return;
        w.redoStack = []; w.historyStack.push(JSON.stringify(w.canvas));
        w.saveCurrentStateToMemory();
    };
    w.undo = function() {
        if (w.historyStack.length > 1) {
            w.isHistoryAction = true; w.redoStack.push(w.historyStack.pop());
            w.canvas.loadFromJSON(w.historyStack[w.historyStack.length-1], () => { w.canvas.renderAll(); w.updateLayersPanel(); w.isHistoryAction = false; w.saveCurrentStateToMemory(); });
        }
    };
    w.redo = function() {
        if (w.redoStack.length > 0) {
            w.isHistoryAction = true; const state = w.redoStack.pop(); w.historyStack.push(state);
            w.canvas.loadFromJSON(state, () => { w.canvas.renderAll(); w.updateLayersPanel(); w.isHistoryAction = false; w.saveCurrentStateToMemory(); });
        }
    };
    
    // Yakalanan her hareketi hem history'ye atar hem de SENKRONİZE EDER
    w.canvas.on('object:modified', (e: any) => { 
        w.saveState(); w.updateLayersPanel(); 
        if(e.target) {
            if (e.target.type === 'activeSelection') {
                 e.target.getObjects().forEach((o: any) => {
                     w.syncPropertyToAllVariants(o, 'scaleX', o.scaleX);
                     w.syncPropertyToAllVariants(o, 'scaleY', o.scaleY);
                     w.syncPropertyToAllVariants(o, 'angle', o.angle);
                 });
            } else {
                 w.syncPropertyToAllVariants(e.target, 'scaleX', e.target.scaleX);
                 w.syncPropertyToAllVariants(e.target, 'scaleY', e.target.scaleY);
                 w.syncPropertyToAllVariants(e.target, 'angle', e.target.angle);
            }
        }
    });
    w.canvas.on('object:added', () => { w.updateLayersPanel(); });
    w.canvas.on('object:removed', () => { w.updateLayersPanel(); });

    // ============================================================
    // ELEMENT EDITING
    // ============================================================
    w.applyStyle = function(prop: string, val: any) {
        let obj = w.canvas.getActiveObject(); if(!obj) return;
        const m = w.getLayoutMetrics();
        if (obj.type==='activeSelection') {
            obj.getObjects().forEach((o: any) => {
                if (prop==='fontSize' && o.set) { o.set('fontSize', parseFloat(val)*m.S); o.set('scaleX',1); o.set('scaleY',1); }
                else o.set(prop, val);
                w.syncPropertyToAllVariants(o, prop, o.get(prop));
            });
        } else {
            if (prop==='fontSize' && obj.set) { obj.set('fontSize', parseFloat(val)*m.S); obj.set('scaleX',1); obj.set('scaleY',1); }
            else obj.set(prop, val);
            w.syncPropertyToAllVariants(obj, prop, obj.get(prop));
        }
        w.canvas.requestRenderAll(); w.saveState();
    };
    w.toggleStyle = function(prop: string, val1: string, val2: string) { let obj=w.canvas.getActiveObject(); if(!obj) return; w.applyStyle(prop, obj.get(prop)===val1 ? val2 : val1); };
    w.updateElementText = function(val: string) { 
        let obj=w.canvas.getActiveObject(); 
        if(obj&&(obj.type==='i-text'||obj.type==='textbox')) { 
            obj.set('text',val); w.canvas.requestRenderAll(); w.saveState(); 
            w.syncPropertyToAllVariants(obj, 'text', val);
        } 
    };
    w.deleteSelected = function() { let o=w.canvas.getActiveObjects(); if(o.length){ w.canvas.discardActiveObject(); o.forEach((x: any)=>w.canvas.remove(x)); w.saveState(); } };
    w.bringForward = function() { let o=w.canvas.getActiveObject(); if(o){ w.canvas.bringForward(o); w.saveState(); } };
    w.sendBackward = function() { let o=w.canvas.getActiveObject(); if(o){ w.canvas.sendBackwards(o); w.saveState(); } };
    w.toggleLock = function() {
        let o=w.canvas.getActiveObject(); if(!o) return;
        let l=!o.lockMovementX;
        o.set({ lockMovementX:l, lockMovementY:l, lockScalingX:l, lockScalingY:l, lockRotation:l, hasControls:!l, selectable:true });
        w.canvas.requestRenderAll(); w.updateEditorPanel();
    };

    w.alignObjects = function(alignType: string) {
        let activeObj = w.canvas.getActiveObject(); if(!activeObj) return;
        if (activeObj.type==='activeSelection') {
            const objs = activeObj.getObjects();
            const aWidth=activeObj.width, aHeight=activeObj.height;
            objs.forEach((obj: any) => {
                let wObj=obj.width*obj.scaleX, hObj=obj.height*obj.scaleY;
                let leftEdge=-aWidth/2, rightEdge=aWidth/2, topEdge=-aHeight/2, bottomEdge=aHeight/2;
                if (alignType==='left') { if(obj.originX==='left') obj.set({left:leftEdge}); else if(obj.originX==='center') obj.set({left:leftEdge+wObj/2}); else obj.set({left:leftEdge+wObj}); }
                else if (alignType==='center') { if(obj.originX==='left') obj.set({left:-wObj/2}); else if(obj.originX==='center') obj.set({left:0}); else obj.set({left:wObj/2}); }
                else if (alignType==='right') { if(obj.originX==='left') obj.set({left:rightEdge-wObj}); else if(obj.originX==='center') obj.set({left:rightEdge-wObj/2}); else obj.set({left:rightEdge}); }
                if (alignType==='top') { if(obj.originY==='top') obj.set({top:topEdge}); else if(obj.originY==='center') obj.set({top:topEdge+hObj/2}); else obj.set({top:topEdge+hObj}); }
                else if (alignType==='middle') { if(obj.originY==='top') obj.set({top:-hObj/2}); else if(obj.originY==='center') obj.set({top:0}); else obj.set({top:hObj/2}); }
                else if (alignType==='bottom') { if(obj.originY==='top') obj.set({top:bottomEdge-h}); else if(obj.originY==='center') obj.set({top:bottomEdge-hObj/2}); else obj.set({top:bottomEdge}); }
            });
            activeObj.setCoords();
        } else {
            const cw=w.canvas.getWidth(), ch=w.canvas.getHeight();
            let wObj=activeObj.getScaledWidth(), hObj=activeObj.getScaledHeight();
            if (alignType==='left') { if(activeObj.originX==='left') activeObj.set({left:0}); else if(activeObj.originX==='center') activeObj.set({left:wObj/2}); else activeObj.set({left:wObj}); }
            else if (alignType==='center') { activeObj.centerH(); }
            else if (alignType==='right') { if(activeObj.originX==='left') activeObj.set({left:cw-wObj}); else if(activeObj.originX==='center') activeObj.set({left:cw-wObj/2}); else activeObj.set({left:cw}); }
            else if (alignType==='top') { if(activeObj.originY==='top') activeObj.set({top:0}); else if(activeObj.originY==='center') activeObj.set({top:hObj/2}); else activeObj.set({top:hObj}); }
            else if (alignType==='middle') { activeObj.centerV(); }
            else if (alignType==='bottom') { if(activeObj.originY==='top') activeObj.set({top:ch-hObj}); else if(activeObj.originY==='center') activeObj.set({top:ch-hObj/2}); else activeObj.set({top:ch}); }
            activeObj.setCoords();
        }
        w.canvas.requestRenderAll(); w.saveState();
    };

    document.addEventListener('keydown', function(e: any) {
        if (['INPUT','TEXTAREA'].includes(e.target.tagName)) return;
        if (e.key==='Delete'||e.key==='Backspace') { w.deleteSelected(); e.preventDefault(); return; }
        const obj=w.canvas.getActiveObject(); if(!obj) return;
        const m=w.getLayoutMetrics(), step=e.shiftKey ? (50*m.S) : (5*m.S);
        switch(e.key) { case 'ArrowLeft': obj.set('left',obj.left-step); break; case 'ArrowRight': obj.set('left',obj.left+step); break; case 'ArrowUp': obj.set('top',obj.top-step); break; case 'ArrowDown': obj.set('top',obj.top+step); break; }
        if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)) { e.preventDefault(); obj.setCoords(); w.canvas.requestRenderAll(); w.saveState(); w.updateEditorPanel(); }
    });

    // ============================================================
    // SETTINGS
    // ============================================================
    w.toggleSettings = function() {
        const p=document.getElementById('settingsPanel');
        if(p) p.style.display=p.style.display==='none'?'block':'none';
    };

    w.saveAppSettings = function() {
        const lang=(document.getElementById('langSelect') as HTMLSelectElement).value;
        localStorage.setItem('app_lang', lang);
        localStorage.setItem('branding_web_text', (document.getElementById('brandingWebText') as HTMLInputElement).value);
        localStorage.setItem('branding_qr_url', (document.getElementById('brandingQRUrl') as HTMLInputElement).value);
        w.toggleSettings();
        if (w.canvas.getObjects().find((o: any) => o.id==='branding-text' || o.id==='branding-qr')) {
            w.refreshBranding();
        }
    };

    document.addEventListener('DOMContentLoaded', () => {
        const savedLang = localStorage.getItem('app_lang') || 'en';
        if(document.getElementById('langSelect')) (document.getElementById('langSelect') as HTMLSelectElement).value = savedLang;
        const savedText = localStorage.getItem('branding_web_text');
        const savedUrl = localStorage.getItem('branding_qr_url');
        if (savedText && document.getElementById('brandingWebText')) (document.getElementById('brandingWebText') as HTMLInputElement).value = savedText;
        if (savedUrl && document.getElementById('brandingQRUrl')) (document.getElementById('brandingQRUrl') as HTMLInputElement).value = savedUrl;
        w.updateOpacityDisplays();
    });

  };

  return (
    <div className="poster-pro-container" style={{ fontFamily: "'Inter', sans-serif", backgroundColor: "var(--bg-main)", color: "var(--text-main)", margin: 0, padding: 0, display: "flex", overflow: "hidden", height: "100vh", width: "100vw" }}>
        
        <div id="qr-hidden" style={{ position: "absolute", left: "-9999px", top: "-9999px" }}></div>

        {/* Global Loader */}
        <div id="global-loader">
            <div className="spinner"></div>
            <div id="loader-text" className="loader-text"></div>
            <div id="loader-subtext" className="loader-subtext"></div>
        </div>

        {/* LEFT SIDEBAR (GLOBAL SETTINGS) */}
        <div className="sidebar-pro-left">
            <div className="sidebar-logo">
                <div className="icon">A</div>
                <div className="text">POSTER.PRO</div>
            </div>
            
            <div className="sidebar-group">
                <span className="sidebar-title" id="title_search_music"><i className="fas fa-music"></i> Search Music</span>
                <div style={{ position: "relative" }}>
                    <input type="text" id="query" className="sidebar-control" placeholder="Artist or Album..." onKeyDown={(e) => { 
                        if(e.key === 'Enter') {
                            if (typeof (window as any).executeDeezerSearch === 'function') {
                                (window as any).executeDeezerSearch();
                            } else {
                                alert("Loading editor engine... Please wait a few seconds.");
                            }
                        }
                    }} style={{ paddingRight: "40px" }} />
                    <i className="fas fa-search" style={{ position: "absolute", right: "15px", top: "14px", color: "var(--text-muted)", cursor: "pointer" }} onClick={() => {
                        if (typeof (window as any).executeDeezerSearch === 'function') {
                            (window as any).executeDeezerSearch();
                        } else {
                            alert("Loading editor engine... Please wait a few seconds.");
                        }
                    }}></i>
                </div>
            </div>

            <div className="sidebar-group">
                <span className="sidebar-title" id="title_format_selection"><i className="fas fa-expand"></i> Format Selection</span>
                <select id="formatSelect" className="sidebar-control" onChange={(e) => (window as any).updateFormat(e.target.value)}>
                    <option value="a2" id="opt_format_a2">A2 (4961x7016 px)</option>
                    <option value="2x3" id="opt_format_2x3">2:3 (4000x6000 px)</option>
                    <option value="3x4" id="opt_format_3x4">3:4 (6000x8000 px)</option>
                    <option value="4x5" id="opt_format_4x5">4:5 (8000x10000 px)</option>
                </select>
            </div>

            <div className="sidebar-group">
                <span className="sidebar-title" id="title_templates_theme"><i className="fas fa-palette"></i> Styles & Layout</span>
                <select id="layoutSelect" className="sidebar-control" onChange={(e) => (window as any).handleLayoutChange(e.target.value)}>
                    <option value="standart" id="opt_layout_minimalist">Minimalist</option>
                    <option value="minimal" id="opt_layout_bbox">bBoxes</option>
                    <option value="vinyl" id="opt_layout_vinyl">Gold Vinyl Award</option>
                </select>
                <select id="themeSelect" className="sidebar-control" onChange={(e) => (window as any).handleThemeChange(e.target.value)} style={{ marginTop: "5px" }}>
                    <option value="light" id="opt_theme_light">Theme: Light</option>
                    <option value="dark" id="opt_theme_dark">Theme: Dark</option>
                    <option value="blurry" id="opt_theme_blurry">Theme: Blurry</option>
                    <option value="colorful" id="opt_theme_colorful">Theme: Colorful</option>
                </select>
            </div>

            <div className="sidebar-group">
                <span className="sidebar-title" id="title_frame_separator">Frame & Separator</span>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <div><label style={{ fontSize: "0.6rem", color: "var(--text-muted)", marginBottom: "4px", display: "block" }} id="lbl_frame_bg">Frame BG</label><input type="color" id="frameColorPicker" className="sidebar-control" defaultValue="#f5f5f5" onInput={(e: any) => (window as any).updateFrameColor(e.target.value)} /></div>
                    <div><label style={{ fontSize: "0.6rem", color: "var(--text-muted)", marginBottom: "4px", display: "block" }} id="lbl_line_color">Line Color</label><input type="color" id="lineColorPicker" className="sidebar-control" defaultValue="#222222" onInput={(e: any) => (window as any).updateLineColor(e.target.value)} /></div>
                </div>
            </div>

            <div className="sidebar-group" style={{ background: "var(--bg-input)", padding: "15px", borderRadius: "12px" }}>
                <span className="sidebar-title" id="title_blur_settings" style={{ marginBottom: "10px" }}>Blur Settings</span>
                <label style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.8rem", cursor: "pointer", marginBottom: "15px" }}>
                    <input type="checkbox" id="blurToggle" onChange={() => (window as any).updateBlurSettings()} style={{ width: "16px", height: "16px" }} /><span id="lbl_enable_blur_bg">Enable Blur BG</span>
                </label>
                <label style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginBottom: "5px" }} id="lbl_blur_amount">Blur Amount</label>
                <input type="range" id="blurAmount" min="0" max="300" step="5" defaultValue="150" onInput={() => (window as any).updateBlurSettings()} />
                <label style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "15px", marginBottom: "5px" }} id="lbl_overlay_brightness">Overlay Brightness</label>
                <input type="range" id="blurBrightness" min="0" max="1" step="0.05" defaultValue="0.4" onInput={() => (window as any).updateBlurSettings()} />
            </div>

            <div className="sidebar-group">
                <span className="sidebar-title" id="title_manual_palette">Manual Palette</span>
                <div style={{ display: "flex", gap: "5px" }}>
                    <input type="color" id="p1" className="sidebar-control" onInput={(e: any) => (window as any).setPalette(0, e.target.value)} defaultValue="#d68c5b" />
                    <input type="color" id="p2" className="sidebar-control" onInput={(e: any) => (window as any).setPalette(1, e.target.value)} defaultValue="#b95856" />
                    <input type="color" id="p3" className="sidebar-control" onInput={(e: any) => (window as any).setPalette(2, e.target.value)} defaultValue="#a83a6b" />
                    <input type="color" id="p4" className="sidebar-control" onInput={(e: any) => (window as any).setPalette(3, e.target.value)} defaultValue="#772b7a" />
                    <input type="color" id="p5" className="sidebar-control" onInput={(e: any) => (window as any).setPalette(4, e.target.value)} defaultValue="#471868" />
                </div>
                <button className="sidebar-download-btn btn-dark" onClick={() => (window as any).forceExtractPalette()} style={{ marginTop: "5px", fontSize: "0.65rem" }} id="btn_auto_extract_colors">AUTO EXTRACT</button>
            </div>

            <div className="sidebar-group">
                <span className="sidebar-title" id="title_or_upload_custom">Custom Upload</span>
                <input type="file" id="customUpload" accept="image/*" className="sidebar-control" style={{ padding: "10px" }} />
            </div>
        </div>

        {/* MAIN VIEW (CANVAS) */}
        <div className="main-view">
            <div id="top-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '25px 40px', width: '100%' }}>
                <div className="top-bar-left" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                    <h2 id="top_title" className="glitch-text">DESIGNER</h2>
                    <p id="top_subtitle" style={{ margin: '2px 0 0 0', color: 'var(--accent)', fontStyle: 'italic', fontWeight: 600, fontSize: '0.9rem' }}>Make your music visual.</p>
                </div>
                
                <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                    <button 
                        className="sidebar-download-btn" 
                        style={{ background: "var(--spotify)", color: "#fff", border: "none", padding: "12px 30px", fontSize: "0.9rem", width: "auto", margin: 0, borderRadius: "50px", boxShadow: "0 4px 15px rgba(29, 185, 84, 0.3)" }} 
                        onClick={() => (window as any).handleAddToCart()}
                    >
                        <i className="fas fa-shopping-cart" style={{ marginRight: "8px" }}></i> 
                        ADD TO CART
                    </button>
                </div>

                <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
                    <div className="view-toggle">
                        <button onClick={() => (window as any).showVariantsView()} id="btn-show-gallery" className="toggle-btn active">GALLERY</button>
                        <button onClick={() => (window as any).showSingleEditor()} id="btn-show-editor" className="toggle-btn">EDITOR</button>
                    </div>
                </div>
            </div>
            
            <div id="content-area">
                <div id="poster-frame" style={{ display: "none" }}>
                    <canvas id="poster-canvas"></canvas>
                </div>

                <div id="variants-view" style={{ display: "flex", width: "100%", flexDirection: "column", paddingBottom: "50px" }}>
                    <div id="variants-grid" className="grid-pro">
                        <div style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "1rem", padding: "50px", gridColumn: "1 / -1", background: "var(--bg-sidebar)", borderRadius: "20px", border: "1px dashed var(--border-color)" }} id="msg_no_design_created">
                            No design has been created yet. Search for an album to generate beautiful variants.
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* RIGHT SIDEBAR (TOOLS & ELEMENTS) */}
        <div className="sidebar-pro-right-wrapper">
            <div className="sidebar-pro-right-scroll">
                <div className="sidebar-group" style={{ flexDirection: "row", gap: "10px" }}>
                    <button className="sidebar-control btn-icon btn-dark" onClick={() => (window as any).undo()} title="Undo" id="btn_undo_tooltip"><i className="fas fa-undo"></i></button>
                    <button className="sidebar-control btn-icon btn-dark" onClick={() => (window as any).redo()} title="Redo" id="btn_redo_tooltip"><i className="fas fa-redo"></i></button>
                </div>

                <div className="sidebar-group">
                    <span className="sidebar-title" id="title_preview_zoom">Preview Zoom</span>
                    <input type="range" id="zoom-slider" min="0.05" max="0.25" step="0.01" defaultValue="0.08" onInput={(e: any) => (window as any).rescale(e.target.value)} />
                    <label style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.8rem", cursor: "pointer", marginTop: "5px", background: "var(--bg-input)", padding: "12px", borderRadius: "10px" }}>
                        <input type="checkbox" id="gridToggle" onChange={() => (window as any).toggleGrid()} style={{ width: "16px", height: "16px" }} /><span id="lbl_grid_toggle">Show Grid & Snap</span>
                    </label>
                </div>

                {/* EDIT SELECTED PANEL */}
                <div className="sidebar-group" id="element-editor" style={{ display: "none", paddingTop: "15px", borderTop: "1px solid var(--border-color)", marginTop: "5px" }}>
                    <span className="sidebar-title" style={{ color: "#fff" }} id="title_edit_selected">EDIT SELECTED</span>
                    
                    <div id="basic-tools" style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "5px" }}>
                        <div>
                            <label style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginBottom: "4px", display: "block" }} id="lbl_text_content">Text Content</label>
                            <textarea id="elemText" className="sidebar-control" style={{ resize: "vertical", minHeight: "45px", cursor: "text" }} onInput={(e: any) => (window as any).updateElementText(e.target.value)}></textarea>
                        </div>
                        
                        <div className="relative">
                            <label style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginBottom: "4px", display: "block" }} id="lbl_font_family">Font Family</label>
                            <div 
                                className="sidebar-control flex justify-between items-center bg-[#222232]" 
                                onClick={() => setIsFontDropdownOpen(!isFontDropdownOpen)}
                            >
                                <span id="elemFontValue" style={{ fontFamily: activeFont, fontSize: '14px' }}>{activeFont}</span>
                                <i className={`fas fa-chevron-${isFontDropdownOpen ? 'up' : 'down'}`}></i>
                            </div>
                            {isFontDropdownOpen && (
                                <div className="absolute top-full left-0 w-full mt-1 bg-[#181824] border border-[#2b2b3d] rounded-lg max-h-[220px] overflow-y-auto z-[9999] shadow-2xl">
                                {GOOGLE_FONTS.map(font => (
                                    <div 
                                        key={font}
                                        className="p-3 hover:bg-[#5a4fcb] cursor-pointer text-white border-b border-[#2b2b3d] last:border-0 transition-colors"
                                        style={{ fontFamily: font, fontSize: '18px' }}
                                        onClick={() => {
                                            setActiveFont(font);
                                            setIsFontDropdownOpen(false);
                                            if (typeof (window as any).applyStyle === 'function') {
                                                (window as any).applyStyle('fontFamily', font);
                                            }
                                        }}
                                    >
                                        {font}
                                    </div>
                                ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div id="image-filters" style={{ display: "none", flexDirection: "column", gap: "5px", marginBottom: "5px" }}>
                        <label style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginBottom: "2px" }} id="lbl_image_filters">Image Filters</label>
                        <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
                            <button className="sidebar-control btn-icon btn-dark" style={{ fontSize: "0.75rem" }} onClick={() => (window as any).applyImageFilter('none')} id="btn_filter_normal">Normal</button>
                            <button className="sidebar-control btn-icon btn-dark" style={{ fontSize: "0.75rem" }} onClick={() => (window as any).applyImageFilter('grayscale')} id="btn_filter_bw">B&W</button>
                            <button className="sidebar-control btn-icon btn-dark" style={{ fontSize: "0.75rem" }} onClick={() => (window as any).applyImageFilter('sepia')} id="btn_filter_sepia">Sepia</button>
                            <button className="sidebar-control btn-icon btn-dark" style={{ fontSize: "0.75rem" }} onClick={() => (window as any).applyImageFilter('vintage')} id="btn_filter_vintage">Vintage</button>
                        </div>
                    </div>

                    <div id="size-color-row" style={{ display: "flex", gap: "10px", marginTop: "5px" }}>
                        <div id="size-col" style={{ flex: 1, display: "flex", flexDirection: "column", gap: "5px" }}>
                            <label style={{ fontSize: "0.7rem", color: "var(--text-muted)" }} id="lbl_size_px">Size (px)</label>
                            <input type="number" id="elemSize" className="sidebar-control" style={{ cursor: "text", padding: "10px" }} onInput={(e: any) => (window as any).applyStyle('fontSize', e.target.value)} />
                        </div>
                        <div id="color-col" style={{ flex: 1, display: "flex", flexDirection: "column", gap: "5px" }}>
                            <label style={{ fontSize: "0.7rem", color: "var(--text-muted)" }} id="lbl_color">Color</label>
                            <input type="color" id="elemColor" className="sidebar-control" onInput={(e: any) => (window as any).applyStyle('fill', e.target.value)} />
                        </div>
                    </div>

                    <div id="text-style-align" style={{ display: "flex", flexDirection: "column", gap: "5px", marginTop: "10px" }}>
                        <label style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginBottom: "2px" }} id="lbl_text_style_align">Style & Align</label>
                        <div style={{ display: "flex", gap: "5px" }}>
                            <button className="sidebar-control btn-icon btn-dark" onClick={() => (window as any).toggleStyle('fontWeight', 'bold', 'normal')} id="btn_style_bold_tooltip"><i className="fas fa-bold"></i></button>
                            <button className="sidebar-control btn-icon btn-dark" onClick={() => (window as any).toggleStyle('fontStyle', 'italic', 'normal')} id="btn_style_italic_tooltip"><i className="fas fa-italic"></i></button>
                            <button className="sidebar-control btn-icon btn-dark" onClick={() => (window as any).applyStyle('textAlign', 'left')} id="btn_align_left_tooltip"><i className="fas fa-align-left"></i></button>
                            <button className="sidebar-control btn-icon btn-dark" onClick={() => (window as any).applyStyle('textAlign', 'center')} id="btn_align_center_tooltip"><i className="fas fa-align-center"></i></button>
                            <button className="sidebar-control btn-icon btn-dark" onClick={() => (window as any).applyStyle('textAlign', 'right')} id="btn_align_right_tooltip"><i className="fas fa-align-right"></i></button>
                        </div>
                    </div>

                    <div id="object-align-tools" style={{ display: "none", flexDirection: "column", gap: "5px", marginTop: "10px" }}>
                        <label style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginBottom: "2px" }} id="lbl_object_align">Align Objects</label>
                        <div style={{ display: "flex", gap: "5px" }}>
                            <button className="sidebar-control btn-icon btn-dark" onClick={() => (window as any).alignObjects('left')} title="Align Left"><i className="fas fa-align-left"></i></button>
                            <button className="sidebar-control btn-icon btn-dark" onClick={() => (window as any).alignObjects('center')} title="Align Center"><i className="fas fa-align-center"></i></button>
                            <button className="sidebar-control btn-icon btn-dark" onClick={() => (window as any).alignObjects('right')} title="Align Right"><i className="fas fa-align-right"></i></button>
                            <button className="sidebar-control btn-icon btn-dark" onClick={() => (window as any).alignObjects('top')} title="Align Top"><i className="fas fa-align-left" style={{ transform: "rotate(90deg)" }}></i></button>
                            <button className="sidebar-control btn-icon btn-dark" onClick={() => (window as any).alignObjects('middle')} title="Align Middle"><i className="fas fa-align-center" style={{ transform: "rotate(90deg)" }}></i></button>
                            <button className="sidebar-control btn-icon btn-dark" onClick={() => (window as any).alignObjects('bottom')} title="Align Bottom"><i className="fas fa-align-right" style={{ transform: "rotate(90deg)" }}></i></button>
                        </div>
                    </div>

                    <label style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "15px", marginBottom: "5px" }} id="lbl_opacity">Opacity</label>
                    <input type="range" id="elemOpacity" min="0" max="1" step="0.01" defaultValue="1" onInput={(e: any) => (window as any).applyStyle('opacity', parseFloat(e.target.value))} />

                    <label style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "15px" }} id="lbl_arrange_options">Arrange & Options</label>
                    <div style={{ display: "flex", gap: "5px" }}>
                        <button className="sidebar-control btn-icon btn-dark" onClick={() => (window as any).bringForward()} id="btn_bring_forward_tooltip"><i className="fas fa-arrow-up"></i></button>
                        <button className="sidebar-control btn-icon btn-dark" onClick={() => (window as any).sendBackward()} id="btn_send_backward_tooltip"><i className="fas fa-arrow-down"></i></button>
                        <button className="sidebar-control btn-icon btn-dark" id="btn-lock" onClick={() => (window as any).toggleLock()}><i className="fas fa-lock"></i></button>
                        <button className="sidebar-control btn-icon btn-danger" onClick={() => (window as any).deleteSelected()} id="btn_delete_selected_tooltip"><i className="fas fa-trash"></i></button>
                    </div>
                </div>

                <div className="sidebar-group" style={{ marginTop: "5px", borderTop: "1px solid var(--border-color)", paddingTop: "15px" }}>
                    <span className="sidebar-title" id="title_layers"><i className="fas fa-layer-group"></i> Layers</span>
                    <div id="layers-panel" style={{ display: "flex", flexDirection: "column", maxHeight: "200px", overflowY: "auto", background: "var(--bg-input)", borderRadius: "12px", padding: "5px", border: "1px solid var(--border-color)" }}>
                    </div>
                </div>

                <div className="sidebar-group" style={{ background: "var(--bg-input)", padding: "15px", borderRadius: "12px", border: "1px solid rgba(29, 185, 84, 0.25)", marginTop: "auto" }}>
                    <span className="sidebar-title" style={{ color: "var(--spotify)", marginBottom: "5px", fontSize: "0.7rem" }} id="title_spotify_barcode"><i className="fab fa-spotify"></i> SPOTIFY BARCODE</span>
                    <a id="spotifySearchBtn" href="https://open.spotify.com/search" target="_blank" rel="noreferrer" className="sidebar-download-btn" style={{ background: "var(--bg-main)", color: "var(--spotify)", padding: "12px", marginBottom: "10px", border: "1px solid transparent", boxShadow: "inset 0 0 0 1px rgba(29,185,84,0.1)" }}>1. FIND ON SPOTIFY</a>
                    <input type="text" id="spotifyLink" className="sidebar-control" placeholder="2. Paste Copied Link" style={{ background: "var(--bg-main)", borderColor: "var(--border-color)", marginBottom: "10px" }} />
                    <button className="sidebar-download-btn" onClick={() => (window as any).addSpotifyCode()} style={{ background: "var(--spotify)", color: "#fff", border: "none", padding: "12px" }} id="btn_add_barcode">ADD BARCODE</button>
                </div>

                {/* YENİ MOCKUP BUTONU BURAYA EKLENDİ */}
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", paddingTop: "5px", marginTop: "10px" }}>
                    <button className="sidebar-download-btn btn-accent" onClick={() => (window as any).downloadMockup()} style={{ marginBottom: "5px" }}><i className="far fa-images"></i> EXPORT MOCKUP</button>
                    
                    <button className="sidebar-download-btn btn-dark" onClick={() => (window as any).downloadPoster()}><i className="far fa-image"></i> EXPORT IMAGE</button>
                    <button className="sidebar-download-btn btn-danger" onClick={() => (window as any).downloadPDF()}><i className="far fa-file-pdf"></i> EXPORT HIGH-RES PDF</button>
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
