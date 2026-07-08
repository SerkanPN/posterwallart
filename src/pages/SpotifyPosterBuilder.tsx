import React, { useEffect, useRef, useState } from 'react';

export default function SpotifyPosterBuilder() {
  const [posterMode, setPosterMode] = useState<'select' | 'spotify' | 'vinyl'>('select');
  const canvasElRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<any>(null);
  const [dimensions, setDimensions] = useState({ width: 420, height: 525 });

  useEffect(() => {
    if (posterMode === 'select') return;

    let active = true;
    let canvas: any = null;

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

    const initApp = async () => {
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/fabric.js/5.3.0/fabric.min.js');
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js');

      if (!active) return;
      if (!canvasElRef.current) return;

      const w = window as any;
      const fabric = w.fabric;
      w.POSTER_MODE = posterMode;

      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.dispose();
        fabricCanvasRef.current = null;
      }

      canvas = new fabric.Canvas(canvasElRef.current, {
        preserveObjectStacking: true,
        backgroundColor: posterMode === 'vinyl' ? '#f5f5f5' : '#121212',
        selection: true
      });
      fabricCanvasRef.current = canvas;

      // ══════════════════════════════════════════════════════════════
      // CONFIGURATIONS & RESIZING
      // ══════════════════════════════════════════════════════════════

      w.toggleAccordion = function(btn: HTMLElement) {
        btn.classList.toggle('open');
        const content = btn.nextElementSibling as HTMLElement;
        if (content) content.classList.toggle('open');
      };

      w.CANVAS_SIZES = {
        '5.83x8.27': [5.83, 8.27], '8.27x11.69':[8.27, 11.69],
        '11.69x16.54': [11.69, 16.54], '16.54x23.39': [16.54, 23.39],
        '23.39x33.11': [23.39, 33.11], '5x7': [5,7], '6x8': [6,8],
        '8x10': [8,10], '9x11': [9,11], '11x14': [11,14], '11x17': [11,17],
        '11.7x16.5': [11.7,16.5], '12x16': [12,16], '12x18':[12,18],
        '16x20': [16,20], '16x24': [16,24], '16.5x23.4':[16.5,23.4],
        '18x24': [18,24], '20x30': [20,30], '22x34':[22,34],
        '23.4x33.1':[23.4,33.1], '24x32': [24,32], '24x36': [24,36],
        '26x36': [26,36], '28x40': [28,40], '30x40':[30,40],
        '40x50': [40, 50], '50x60': [50,60], '60x80': [60,80], 
        '68x80': [68,80], '88x104': [88,104]
      };

      const BASE_WIDTH = 800;

      w.updateCanvasSize = function() {
        const selectEl = document.getElementById('canvas-size') as HTMLSelectElement;
        if(!selectEl) return;
        const key = selectEl.value;
        const [w_size, h_size] = w.CANVAS_SIZES[key];
        const ratio = w_size / h_size;
        const baseHeight = BASE_WIDTH / ratio;

        const area = document.getElementById('canvas-area');
        if(!area) return;
        const areaW = area.clientWidth - 80;
        const areaH = area.clientHeight - 80;

        let scale;
        if (areaW / ratio <= areaH) {
          scale = areaW / BASE_WIDTH;
        } else {
          scale = areaH / baseHeight;
        }

        const pw = Math.floor(BASE_WIDTH * scale);
        const ph = Math.floor(baseHeight * scale);

        setDimensions({ width: pw, height: ph });

        canvas.setDimensions({ width: pw, height: ph });
        canvas.setZoom(scale);
        canvas.requestRenderAll();
      };

      window.addEventListener('resize', w.updateCanvasSize);

      w.timeToSeconds = function(timeStr: string) {
        const parts = timeStr.split(':');
        if (parts.length !== 2) return 0;
        return parseInt(parts[0]) * 60 + parseInt(parts[1]);
      };

      w.secondsToTime = function(secs: number) {
        const m = Math.floor(secs / 60);
        const s = Math.floor(secs % 60);
        return `${m}:${s < 10 ? '0' : ''}${s}`;
      };

      w.handleStartTimeChange = function() {
        const startStr = (document.getElementById('time-start') as HTMLInputElement).value;
        const endStr = (document.getElementById('time-end') as HTMLInputElement).value;
        
        const s = w.timeToSeconds(startStr);
        const e = w.timeToSeconds(endStr);
        if (e > 0 && s <= e) {
          let pct = (s / e) * 100;
          if (pct < 0) pct = 0;
          if (pct > 100) pct = 100;
          const pval = document.getElementById('progress-val') as HTMLInputElement;
          if(pval) pval.value = pct.toString();
          const pdisp = document.getElementById('progress-display');
          if(pdisp) pdisp.textContent = Math.round(pct) + '%';
          w.updateProgressOnCanvas(pct, startStr, endStr);
        }
      };

      w.handleEndTimeChange = function() {
        w.handleStartTimeChange(); 
      };

      w.updateProgress = function(val: string) {
        const pdisp = document.getElementById('progress-display');
        if(pdisp) pdisp.textContent = Math.round(parseFloat(val)) + '%';
        
        const endStr = (document.getElementById('time-end') as HTMLInputElement).value;
        const e = w.timeToSeconds(endStr);
        if (e > 0) {
          const newSecs = (parseFloat(val) / 100) * e;
          const newTimeStr = w.secondsToTime(newSecs);
          const tstart = document.getElementById('time-start') as HTMLInputElement;
          if(tstart) tstart.value = newTimeStr;
          w.updateProgressOnCanvas(parseFloat(val), newTimeStr, endStr);
        }
      };

      w.updateProgressOnCanvas = function(pct: number, startText: string, endText: string) {
        const track = canvas.getObjects().find((o: any) => o.id === 'progress-track');
        const fill = canvas.getObjects().find((o: any) => o.id === 'progress-fill');
        const tStart = canvas.getObjects().find((o: any) => o.id === 'time-start-el');
        const tEnd = canvas.getObjects().find((o: any) => o.id === 'time-end-el');

        if (track && fill) {
          const maxWidth = track.width || 500;
          fill.set('width', (maxWidth * pct) / 100);
        }
        if (tStart) tStart.set('text', startText);
        if (tEnd) tEnd.set('text', endText);
        canvas.requestRenderAll();
      };

      // ══════════════════════════════════════════════════════════════
      // REAL-TIME COVER ART TRANSFORMS & STYLING
      // ══════════════════════════════════════════════════════════════

      w.setCoverBorderProp = function(prop: string, val: any) {
        const cover = canvas.getObjects().find((o: any) => o.id === 'cover');
        if (!cover) return;

        if (prop === 'borderRadius') {
          let clipPath = cover.clipPath;
          if (!clipPath) {
            clipPath = new fabric.Rect({
              originX: 'center',
              originY: 'center',
              width: cover.width,
              height: cover.height
            });
            cover.set('clipPath', clipPath);
          }
          clipPath.set({ rx: parseFloat(val), ry: parseFloat(val) });
        } else if (prop === 'borderWidth') {
          cover.set('strokeWidth', parseFloat(val));
        } else if (prop === 'borderColor') {
          cover.set('stroke', val);
        } else if (prop === 'borderStyle') {
          if (val === 'dashed') cover.set('strokeDashArray', [10, 5]);
          else if (val === 'dotted') cover.set('strokeDashArray', [2, 2]);
          else if (val === 'none') { cover.set('strokeWidth', 0); }
          else cover.set('strokeDashArray', null);
        } else if (prop === 'shadow') {
          cover.set('shadow', new fabric.Shadow({
            color: 'rgba(0,0,0,0.8)',
            blur: parseFloat(val) * 2,
            offsetX: 0,
            offsetY: parseFloat(val)
          }));
        } else if (prop === 'imageX') {
          cover.set('left', 150 + parseFloat(val));
        } else if (prop === 'imageY') {
          cover.set('top', 180 + parseFloat(val));
        } else if (prop === 'imageScale') {
          cover.set('scaleX', (parseFloat(val) / 100));
          cover.set('scaleY', (parseFloat(val) / 100));
        }
        canvas.requestRenderAll();
      };

      // ══════════════════════════════════════════════════════════════
      // BACKGROUND LOGIC (BLUR / SOLID COLOR)
      // ══════════════════════════════════════════════════════════════
      w.currentCoverSrc = '';
      w.vCurrentCoverSrc = '';

      w.updateBgBlur = function() {
        if(w.POSTER_MODE === 'vinyl') return;
        const blurEl = document.getElementById('blur-val') as HTMLInputElement;
        if (!blurEl) return;
        const blurVal = parseInt(blurEl.value);
        const brightnessEl = document.getElementById('brightness-val') as HTMLInputElement;
        const brightnessVal = brightnessEl ? parseFloat(brightnessEl.value) / 100 : 1;

        const blurDisp = document.getElementById('blur-display');
        if (blurDisp) blurDisp.textContent = blurVal + 'px';
        const brightDisp = document.getElementById('brightness-display');
        if (brightDisp) brightDisp.textContent = Math.round(brightnessVal * 100) + '%';

        if (!w.currentCoverSrc) return;

        fabric.Image.fromURL(w.currentCoverSrc, (img: any) => {
          const key = (document.getElementById('canvas-size') as HTMLSelectElement).value;
          const [w_size, h_size] = w.CANVAS_SIZES[key];
          const ratio = w_size / h_size;
          const baseHeight = BASE_WIDTH / ratio;

          img.set({
            originX: 'center',
            originY: 'center',
            left: BASE_WIDTH / 2,
            top: baseHeight / 2,
            selectable: false,
            evented: false,
            id: 'bg-image'
          });

          const canvasRatio = BASE_WIDTH / baseHeight;
          const imgRatio = img.width / img.height;
          let scale;
          if (imgRatio > canvasRatio) {
            scale = baseHeight / img.height;
          } else {
            scale = BASE_WIDTH / img.width;
          }
          img.setScaleX(scale * 1.1);
          img.setScaleY(scale * 1.1);

          img.filters = [];
          if (blurVal > 0) {
            img.filters.push(new fabric.Image.filters.Blur({ blur: blurVal / 10 }));
          }
          img.filters.push(new fabric.Image.filters.Brightness({ brightness: brightnessVal - 1 }));
          img.applyFilters();

          const oldBg = canvas.getObjects().find((o: any) => o.id === 'bg-image');
          if (oldBg) canvas.remove(oldBg);

          canvas.add(img);
          img.sendToBack();
          canvas.requestRenderAll();
        }, { crossOrigin: 'anonymous' });
      };

      w.updateVinylBgBlur = function() {
        if(w.POSTER_MODE !== 'vinyl') return;
        const blurEl = document.getElementById('v-blur-val') as HTMLInputElement;
        if (!blurEl) return;
        const blurVal = parseInt(blurEl.value);

        const blurDisp = document.getElementById('v-blur-display');
        if (blurDisp) blurDisp.textContent = blurVal + 'px';

        if (!w.vCurrentCoverSrc) return;

        fabric.Image.fromURL(w.vCurrentCoverSrc, (img: any) => {
          const key = (document.getElementById('canvas-size') as HTMLSelectElement).value;
          const [w_size, h_size] = w.CANVAS_SIZES[key];
          const ratio = w_size / h_size;
          const baseHeight = BASE_WIDTH / ratio;

          img.set({
            originX: 'center',
            originY: 'center',
            left: BASE_WIDTH / 2,
            top: baseHeight / 2,
            selectable: false,
            evented: false,
            id: 'bg-image'
          });

          const canvasRatio = BASE_WIDTH / baseHeight;
          const imgRatio = img.width / img.height;
          let scale;
          if (imgRatio > canvasRatio) {
            scale = baseHeight / img.height;
          } else {
            scale = BASE_WIDTH / img.width;
          }
          img.setScaleX(scale * 1.1);
          img.setScaleY(scale * 1.1);

          img.filters = [];
          if (blurVal > 0) {
            img.filters.push(new fabric.Image.filters.Blur({ blur: blurVal / 10 }));
          }
          img.applyFilters();

          const oldBg = canvas.getObjects().find((o: any) => o.id === 'bg-image');
          if (oldBg) canvas.remove(oldBg);

          canvas.add(img);
          img.sendToBack();
          canvas.requestRenderAll();
        }, { crossOrigin: 'anonymous' });
      };

      w.applyAutoContrast = async function(bgHex: string) {
        if (w.POSTER_MODE !== 'vinyl') return;
        let hex = bgHex.replace('#', '');
        if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
        const r = parseInt(hex.substr(0,2), 16) || 255;
        const g = parseInt(hex.substr(2,2), 16) || 255;
        const b = parseInt(hex.substr(4,2), 16) || 255;
        const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
        const isDark = yiq < 128;

        const mainTextCol = isDark ? '#ffffff' : '#212121';
        const subTextCol  = isDark ? '#cccccc' : '#555555';
        const labelCol    = isDark ? '#eeeeee' : '#e0e0e0';

        const updateFill = (id: string, col: string) => {
          const obj = canvas.getObjects().find((o: any) => o.id === id);
          if (obj) obj.set('fill', col);
        };

        updateFill('v-top-left', mainTextCol);
        updateFill('v-top-right', mainTextCol);
        updateFill('v-song-title', mainTextCol);
        updateFill('v-bottom', subTextCol);

        const setInp = (id: string, col: string) => { 
          const el = document.getElementById(id) as HTMLInputElement; if(el) el.value = col; 
          const txt = document.getElementById(id+'-t') as HTMLInputElement; if(txt) txt.value = col;
        };
        setInp('c-v-tl', mainTextCol);
        setInp('c-v-tr', mainTextCol);
        setInp('c-v-st', mainTextCol);
        setInp('c-v-bot', subTextCol);

        const lblInp = document.getElementById('c-v-lbl') as HTMLInputElement;
        if(lblInp) lblInp.value = labelCol;

        // Await the spiral drawing cleanly before completing contrast cycle
        await w.updateVinylSpiral(); 
      };

      w.updateBgColor = function() {
        const colorId = w.POSTER_MODE === 'vinyl' ? 'v-bg-color' : 'bg-color';
        const txtId = w.POSTER_MODE === 'vinyl' ? 'v-bg-color-txt' : 'bg-color-txt';
        const colorEl = document.getElementById(colorId) as HTMLInputElement;
        const txtEl = document.getElementById(txtId) as HTMLInputElement;
        if(!colorEl) return;
        const color = colorEl.value;
        
        canvas.setBackgroundColor(color, canvas.renderAll.bind(canvas));
        if(txtEl) txtEl.value = color;
        
        if (w.POSTER_MODE === 'vinyl') w.applyAutoContrast(color);
      };

      w.updateBg = function() {
        if(w.POSTER_MODE === 'vinyl') return;
        const type = (document.getElementById('bg-type') as HTMLSelectElement).value;
        const bgColorSection = document.getElementById('bg-color-section');
        const bgBlurSection = document.getElementById('bg-blur-section');
        const oldBg = canvas.getObjects().find((o: any) => o.id === 'bg-image');

        if (type === 'color') {
          if(bgColorSection) bgColorSection.style.display = 'block';
          if(bgBlurSection) bgBlurSection.style.display = 'none';
          if(oldBg) canvas.remove(oldBg);
          w.updateBgColor();
        } else {
          if(bgColorSection) bgColorSection.style.display = 'none';
          if(bgBlurSection) bgBlurSection.style.display = 'block';
          // Set backgroundColor as null to avoid drawing color on top of image
          canvas.setBackgroundColor(null, canvas.renderAll.bind(canvas));
          w.updateBgBlur();
        }
      };

      w.updateVinylBg = function() {
        if(w.POSTER_MODE !== 'vinyl') return;
        const type = (document.getElementById('v-bg-type') as HTMLSelectElement).value;
        const bgColorSection = document.getElementById('v-bg-color-section');
        const bgBlurSection = document.getElementById('v-bg-blur-section');
        const oldBg = canvas.getObjects().find((o: any) => o.id === 'bg-image');

        if (type === 'color') {
          if(bgColorSection) bgColorSection.style.display = 'block';
          if(bgBlurSection) bgBlurSection.style.display = 'none';
          if(oldBg) canvas.remove(oldBg);
          w.updateBgColor();
        } else {
          if(bgColorSection) bgColorSection.style.display = 'none';
          if(bgBlurSection) bgBlurSection.style.display = 'block';
          canvas.setBackgroundColor(null, canvas.renderAll.bind(canvas));
          w.applyAutoContrast('#121212'); 
          w.updateVinylBgBlur();
        }
      };

      w.updateOverlay = function() {
        const ov = document.getElementById('overlay-val') as HTMLInputElement;
        if(!ov) return;
        const val = parseFloat(ov.value) / 100;
        document.getElementById('overlay-display')!.textContent = ov.value + '%';
        
        let overlayObj = canvas.getObjects().find((o: any) => o.id === 'bg-overlay');
        if (!overlayObj) {
          overlayObj = new fabric.Rect({
            left: 0,
            top: 0,
            width: BASE_WIDTH,
            height: 2000, 
            fill: 'rgba(0,0,0,0)',
            selectable: false,
            evented: false,
            id: 'bg-overlay'
          });
          canvas.add(overlayObj);
        }
        overlayObj.set('fill', `rgba(0,0,0,${val})`);
        
        const bgImg = canvas.getObjects().find((o: any) => o.id === 'bg-image');
        if (bgImg) {
          bgImg.sendToBack();
          overlayObj.bringForward();
        } else {
          overlayObj.sendToBack();
        }
        canvas.requestRenderAll();
      };

      // ══════════════════════════════════════════════════════════════
      // INTERACTIVE CANVAS ELEMENT UPDATES (SPOTIFY)
      // ══════════════════════════════════════════════════════════════

      w.setCoverImage = function(src: string) {
        w.currentCoverSrc = src;
        fabric.Image.fromURL(src, (img: any) => {
          const coverObj = canvas.getObjects().find((o: any) => o.id === 'cover');
          
          img.set({
            left: coverObj ? coverObj.left : 150,
            top: coverObj ? coverObj.top : 180,
            id: 'cover',
            hasControls: true,
            lockScalingFlip: true,
            crossOrigin: 'anonymous'
          });

          img.scaleToWidth(500);

          if (coverObj) {
            canvas.remove(coverObj);
          }
          canvas.add(img);
          canvas.requestRenderAll();
          w.updateBg();
        }, { crossOrigin: 'anonymous' });
      };

      w.handleCoverUpload = function(event: any) {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e: any) => w.setCoverImage(e.target.result);
        reader.readAsDataURL(file);
      };

      w.handleVinylCoverUpload = function(event: any) {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e: any) => {
          w.vCurrentCoverSrc = e.target.result;
          w.updateVinylBg();
        };
        reader.readAsDataURL(file);
      };

      w.updateTextColor = function(id: string, color: string) {
        const obj = canvas.getObjects().find((o: any) => o.id === id);
        if (obj) {
          obj.set('fill', color);
          canvas.requestRenderAll();
        }
      };

      w.syncColor = function(colorId: string, textId: string) {
        const txtEl = document.getElementById(textId) as HTMLInputElement;
        const colEl = document.getElementById(colorId) as HTMLInputElement;
        if(!txtEl || !colEl) return;
        let txt = txtEl.value.trim();
        
        if (/^#[0-9A-Fa-f]{3}$/.test(txt)) {
          txt = '#' + txt[1]+txt[1] + txt[2]+txt[2] + txt[3]+txt[3];
        }
        
        if (/^#[0-9A-Fa-f]{6}$/.test(txt)) {
          colEl.value = txt;
          colEl.dispatchEvent(new Event('input', { bubbles: true }));
        }
      };

      // ══════════════════════════════════════════════════════════════
      // BARCODE GRAPHIC GENERATION
      // ══════════════════════════════════════════════════════════════
      w.currentTrackUri = '';
      w.cachedSvgText = null;

      w.fetchSvgRaw = async function() {
        const spotifyUrl = `https://scannables.scdn.co/uri/plain/svg/ffffff/black/640/${w.currentTrackUri}`;
        const url = `https://api.allorigins.win/raw?url=${encodeURIComponent(spotifyUrl)}`;
        try {
          const res = await fetch(url);
          if (!res.ok) return null;
          const text = await res.text();
          if (text.includes('<svg')) return text;
        } catch(e) {
          console.log('Fetch error:', e);
        }
        return null;
      };

      w.renderBarcodeFromCache = function() {
        if (!w.cachedSvgText) return;

        const logoColor = (document.getElementById('barcode-logo-color') as HTMLInputElement).value;
        const barColor  = (document.getElementById('barcode-bar-color') as HTMLInputElement).value;

        const parser = new DOMParser();
        const doc = parser.parseFromString(w.cachedSvgText, 'image/svg+xml');
        const fetched = doc.querySelector('svg');
        if (!fetched) return;

        const allRects = Array.from(fetched.querySelectorAll('rect'));
        allRects.forEach((r, i) => {
          if (i === 0) r.remove(); 
          else r.setAttribute('fill', barColor);
        });

        fetched.querySelectorAll('circle').forEach(el => r.setAttribute('fill', logoColor));
        fetched.querySelectorAll('path').forEach(el => {
          const fill = el.getAttribute('fill');
          if (fill && fill !== 'none') el.setAttribute('fill', logoColor);
          const stroke = el.getAttribute('stroke');
          if (stroke && stroke !== 'none') el.setAttribute('stroke', logoColor);
        });

        const svgSerializer = new XMLSerializer();
        const customizedSvgStr = svgSerializer.serializeToString(fetched);
        const svgUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(customizedSvgStr);

        const barcodeHeight = parseInt((document.getElementById('barcode-height') as HTMLInputElement)?.value || '48');

        fabric.Image.fromURL(svgUrl, (img: any) => {
          const oldBarcode = canvas.getObjects().find((o: any) => o.id === 'barcode');
          let left = 400, top = 950;
          if (oldBarcode) {
            left = oldBarcode.left;
            top = oldBarcode.top;
            canvas.remove(oldBarcode);
          }
          img.set({
            originX: 'center',
            originY: 'center',
            left: left,
            top: top,
            height: barcodeHeight,
            id: 'barcode'
          });
          const initialRatio = (fetched.viewBox.baseVal.width / fetched.viewBox.baseVal.height) || 4;
          img.set('width', barcodeHeight * initialRatio);

          const chk = document.getElementById('show-barcode') as HTMLInputElement;
          if (chk && chk.checked) {
            img.set('visible', true);
          } else {
            img.set('visible', false);
          }

          canvas.add(img);
          canvas.requestRenderAll();
        }, { crossOrigin: 'anonymous' });
      };

      w.drawBarcode = async function() {
        if (!w.currentTrackUri) return;
        w.cachedSvgText = await w.fetchSvgRaw();

        if (!w.cachedSvgText) {
          w.showToast('Barkod yüklenemedi');
          return;
        }
        w.renderBarcodeFromCache();
      };

      w.handleSpotifyInput = function() {
        const input = (document.getElementById('spotify-uri') as HTMLInputElement).value.trim();
        let uri = null;
        const urlMatch = input.match(/track\/([a-zA-Z0-9]+)/);
        if (urlMatch) uri = `spotify:track:${urlMatch[1]}`;
        const uriMatch = input.match(/spotify:track:([a-zA-Z0-9]+)/);
        if (uriMatch) uri = input;

        if (uri) {
          w.currentTrackUri = uri;
          w.cachedSvgText = null;
          w.drawBarcode();
        }
      };

      w.updateBarcode = function() {
        const show = (document.getElementById('show-barcode') as HTMLInputElement).checked;
        const bObj = canvas.getObjects().find((o: any) => o.id === 'barcode');
        if (bObj) {
          bObj.set('visible', show);
          canvas.requestRenderAll();
        }
      };

      w.updateBarcodeStyle = function() {
        if (w.cachedSvgText) w.renderBarcodeFromCache();
        else if (w.currentTrackUri) w.drawBarcode();
      };

      w.updateBarcodeHeight = function(val: string) {
        document.getElementById('barcode-height-display')!.textContent = val + 'px';
        const bObj = canvas.getObjects().find((o: any) => o.id === 'barcode');
        if (bObj) {
          bObj.set('height', parseFloat(val));
          canvas.requestRenderAll();
        }
      };

      w.showToast = function(msg: string) {
        const toast = document.getElementById('toast');
        if(!toast) return;
        toast.textContent = msg;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3500);
      };

      // ══════════════════════════════════════════════════════════════
      // VINYL POSTER - SPIRAL SVG LOGIC IN FABRIC
      // ══════════════════════════════════════════════════════════════

      w.setVinylProp = function(prop: string, val: any) {
        if (prop === 'overallSize') {
          const vinyl = canvas.getObjects().find((o: any) => o.id === 'v-vinyl');
          if (vinyl) {
            vinyl.set({
              scaleX: parseFloat(val) / 100,
              scaleY: parseFloat(val) / 100
            });
          }
        } else if (prop === 'letterSpacing') {
          (document.getElementById('vinyl-letter-spacing') as HTMLInputElement).value = val;
          w.updateVinylSpiral();
        } else if (prop === 'textSize') {
          (document.getElementById('vinyl-text-size') as HTMLInputElement).value = val;
          w.updateVinylSpiral();
        } else if (prop === 'textColor') {
          (document.getElementById('c-v-st-t') as HTMLInputElement).value = val;
          (document.getElementById('c-v-st') as HTMLInputElement).value = val;
          w.updateVinylSpiral();
        } else if (prop === 'labelColor') {
          (document.getElementById('c-v-lbl') as HTMLInputElement).value = val;
          w.updateVinylSpiral();
        } else if (prop === 'labelSize') {
          (document.getElementById('vinyl-center-label-size') as HTMLInputElement).value = val;
          w.updateVinylSpiral();
        } else if (prop === 'fontFamily') {
          (document.getElementById('vinyl-font-family') as HTMLInputElement).value = val;
          w.updateVinylSpiral();
        }
        canvas.requestRenderAll();
      };

      // Return dynamic SVG compilation inside a robust, awaitsafe Promise hook
      w.updateVinylSpiral = function() {
        return new Promise<void>((resolve) => {
          if (w.POSTER_MODE !== 'vinyl') return resolve();

          const fs = parseInt((document.getElementById('vinyl-text-size') as HTMLInputElement)?.value || "12");
          const input = (document.getElementById('vinyl-lyrics-input') as HTMLTextAreaElement)?.value || "LOREM IPSUM...";
          const textColor = (document.getElementById('c-v-st-t') as HTMLInputElement)?.value || "#212121";
          const labelColor = (document.getElementById('c-v-lbl') as HTMLInputElement)?.value || "#e0e0e0";
          const labelSize = parseInt((document.getElementById('vinyl-center-label-size') as HTMLInputElement)?.value || "80");
          const spacingMultiplier = parseFloat((document.getElementById('vinyl-letter-spacing') as HTMLInputElement)?.value || "2");
          const selectedFont = (document.getElementById('vinyl-font-family') as HTMLInputElement)?.value || "'DM Sans', sans-serif";

          const textLen = input.length * (fs * 0.6); 
          const minR = labelSize + 20;
          const spacing = fs * 1.2;
          
          const standardLoops = (380 - minR) / spacing;
          const standardLen = Math.PI * spacing * standardLoops * standardLoops + 2 * Math.PI * minR * standardLoops;
          
          let loops = standardLoops;
          let maxR = 380;
          
          if (textLen > standardLen) {
              const a = Math.PI * spacing;
              const b = 2 * Math.PI * minR;
              const c = -textLen;
              loops = (-b + Math.sqrt(b*b - 4*a*c)) / (2*a);
              maxR = minR + loops * spacing;
          }
          
          let svgSize = 800;
          let cx = 400;
          let cy = 400;
          
          if (maxR > 380) {
              svgSize = (maxR + 30) * 2;
              cx = svgSize / 2;
              cy = svgSize / 2;
          }

          let points = [];
          let steps = Math.ceil(loops * 100);
          
          for(let i=0; i<=steps; i++) {
              let t = -Math.PI/2 + (i/steps) * loops * Math.PI * 2;
              let r = minR + ((maxR - minR) * (i/steps));
              let x = cx + r * Math.cos(t);
              let y = cy + r * Math.sin(t);
              if(i===0) points.push(`M ${x} ${y}`);
              else points.push(`L ${x} ${y}`);
          }

          const pathD = points.join(' ');

          let finalStr = input.trim();
          if (textLen < standardLen) {
             let repeats = Math.ceil(standardLen / (textLen + 20));
             let arr = [];
             for(let k=0; k<repeats; k++) arr.push(finalStr);
             finalStr = arr.join(' • ');
          }
          finalStr = finalStr.toUpperCase().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

          const svgStr = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgSize} ${svgSize}" width="${svgSize}" height="${svgSize}">
            <defs>
              <path id="v-spiral-path" d="${pathD}" fill="none" />
            </defs>
            <circle cx="${cx}" cy="${cy}" r="${maxR + 15}" fill="none" />
            <circle cx="${cx}" cy="${cy}" r="${minR * 0.95}" fill="none" stroke="#2a2a2a" stroke-width="1" />
            <circle cx="${cx}" cy="${cy}" r="${minR * 0.97}" fill="none" stroke="#2a2a2a" stroke-width="1" />
            <text fill="${textColor}" font-size="${fs}" letter-spacing="${spacingMultiplier}" font-family="${selectedFont}" font-weight="700">
              <textPath href="#v-spiral-path" startOffset="0%">${finalStr}</textPath>
            </text>
            <circle cx="${cx}" cy="${cy}" r="${labelSize}" fill="${labelColor}" id="v-label-disc" />
            <circle cx="${cx}" cy="${cy}" r="${labelSize / 10}" fill="#111111" />
          </svg>`;

          const svgUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgStr);

          fabric.Image.fromURL(svgUrl, (img: any) => {
            const oldVinyl = canvas.getObjects().find((o: any) => o.id === 'v-vinyl');
            let left = 400, top = 550;
            let scaleX = oldVinyl ? oldVinyl.scaleX : 1;
            let scaleY = oldVinyl ? oldVinyl.scaleY : 1;
            let angle = oldVinyl ? oldVinyl.angle : 0;
            if (oldVinyl) {
              left = oldVinyl.left;
              top = oldVinyl.top;
              canvas.remove(oldVinyl);
            }
            img.set({
              originX: 'center',
              originY: 'center',
              left: left,
              top: top,
              scaleX: scaleX,
              scaleY: scaleY,
              angle: angle,
              id: 'v-vinyl',
              hasControls: true
            });
            canvas.add(img);
            canvas.requestRenderAll();
            resolve();
          }, { crossOrigin: 'anonymous' });
        });
      };

      w.fetchLyrics = async function(artist: string, title: string) {
        try {
          let a = encodeURIComponent(artist.split(',')[0].trim());
          let t = encodeURIComponent(title.replace(/\(.*\)/g, '').trim());
          let res = await fetch(`https://api.lyrics.ovh/v1/${a}/${t}`);
          if (res.ok) {
            let data = await res.json();
            if (data.lyrics) {
              return data.lyrics.replace(/\n/g, ' • ').replace(/\r/g, '').toUpperCase();
            }
          }
        } catch(e) {}
        return null;
      };

      // ══════════════════════════════════════════════════════════════
      // SEARCH RESULTS & DATA INJECTIONS
      // ══════════════════════════════════════════════════════════════

      w.searchSong = async function() {
        const q = (document.getElementById('search-input') as HTMLInputElement).value.trim();
        if (!q) return;

        const spinner = document.getElementById('search-spinner');
        const results = document.getElementById('search-results');
        if(spinner) spinner.style.display = 'block';
        if(results) results.style.display = 'none';

        try {
          const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(q)}&entity=song&limit=6`);
          const data = await res.json();
          if(spinner) spinner.style.display = 'none';

          if (!data.results || data.results.length === 0) {
            w.showToast('Sonuç bulunamadı');
            return;
          }

          if(results) {
              results.innerHTML = '';
              data.results.forEach((item: any) => {
                const div = document.createElement('div');
                div.className = 'search-result-item';
                div.innerHTML = `
                  <img src="${item.artworkUrl100}" alt="">
                  <div class="result-info">
                    <p>${item.trackName}</p>
                    <span>${item.artistName}</span>
                  </div>`;
                div.onclick = () => {
                  w.applySearchResult(item);
                  results.style.display = 'none';
                };
                results.appendChild(div);
              });
              results.style.display = 'block';
          }
        } catch(e: any) {
          if(spinner) spinner.style.display = 'none';
          w.showToast('Arama hatası: ' + e.message);
        }
      };

      w.applySearchResult = async function(item: any) {
        if(w.POSTER_MODE === 'spotify') {
            const titleObj = canvas.getObjects().find((o: any) => o.id === 'song-title');
            const artistObj = canvas.getObjects().find((o: any) => o.id === 'song-artist');
            if(titleObj) titleObj.set('text', item.trackName);
            if(artistObj) artistObj.set('text', item.artistName);
            
            const tinp = document.getElementById('song-title-input') as HTMLInputElement;
            const ainp = document.getElementById('song-artist-input') as HTMLInputElement;
            if(tinp) tinp.value = item.trackName;
            if(ainp) ainp.value = item.artistName;

            if (item.trackTimeMillis) {
              const totalSecs = item.trackTimeMillis / 1000;
              const endStr = w.secondsToTime(totalSecs);
              const tend = document.getElementById('time-end') as HTMLInputElement;
              if(tend) tend.value = endStr;
              w.handleStartTimeChange();
            }

            const artUrl = item.artworkUrl100.replace('100x100bb', '600x600bb');
            w.setCoverImage(artUrl);
            w.showToast('✓ ' + item.trackName + ' yüklendi');
        } 
        else if (w.POSTER_MODE === 'vinyl') {
            const vTitleObj = canvas.getObjects().find((o: any) => o.id === 'v-song-title');
            if(vTitleObj) vTitleObj.set('text', item.trackName.toUpperCase());

            const tinp = document.getElementById('v-song-title-input') as HTMLInputElement;
            if(tinp) tinp.value = item.trackName.toUpperCase();
            
            const year = new Date(item.releaseDate).getFullYear() || "1992";
            const yearObj = canvas.getObjects().find((o: any) => o.id === 'v-top-right');
            if(yearObj) yearObj.set('text', year.toString());
            const yearInp = document.getElementById('v-year-input') as HTMLInputElement;
            if(yearInp) yearInp.value = year.toString();

            const album = item.collectionName ? item.collectionName.toUpperCase() : "UNKNOWN ALBUM";
            const bottomObj = canvas.getObjects().find((o: any) => o.id === 'v-bottom');
            if (bottomObj) bottomObj.set('text', album);
            const bottomInp = document.getElementById('v-bottom-input') as HTMLInputElement;
            if (bottomInp) bottomInp.value = album;

            let artistLabel = item.artistName || 'ARTIST NAME';
            const labelObj = canvas.getObjects().find((o: any) => o.id === 'v-top-left');
            if (labelObj) labelObj.set('text', artistLabel.toUpperCase());
            const labelInp = document.getElementById('v-label-input') as HTMLInputElement;
            if (labelInp) labelInp.value = artistLabel.toUpperCase();

            w.showToast('Sözler aranıyor...');
            let lyrics = await w.fetchLyrics(item.artistName, item.trackName);
            
            const linp = document.getElementById('vinyl-lyrics-input') as HTMLTextAreaElement;
            if(lyrics) {
                if(linp) linp.value = lyrics;
                w.showToast('✓ Sözler ve şarkı yüklendi');
            } else {
                if(linp) linp.value = "LOREM IPSUM DOLOR SIT AMET CONSECTETUR ADIPISCING ELIT SED DO EIUSMOD TEMPOR INCIDIDUNT UT LABORE ET DOLORE MAGNA ALIQUA";
                w.showToast('Sözler bulunamadı, varsayılan metin eklendi');
            }
            w.updateVinylSpiral();
        }
      };

      w.getExportFilename = function(ext: string) {
        let artist = 'artist';
        let song = 'song';
        
        if(w.POSTER_MODE === 'spotify') {
            artist = ((document.getElementById('song-artist-input') as HTMLInputElement)?.value || 'artist').replace(/[^a-z0-9]/gi, '-').toLowerCase();
            song = ((document.getElementById('song-title-input') as HTMLInputElement)?.value || 'song').replace(/[^a-z0-9]/gi, '-').toLowerCase();
        } else {
            artist = ((document.getElementById('v-label-input') as HTMLInputElement)?.value || 'artist').replace(/[^a-z0-9]/gi, '-').toLowerCase();
            song = ((document.getElementById('v-song-title-input') as HTMLInputElement)?.value || 'song').replace(/[^a-z0-9]/gi, '-').toLowerCase();
        }
        
        const size = (document.getElementById('canvas-size') as HTMLSelectElement).value;
        const now = new Date();
        const date = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
        const hour = String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0');
        return `${artist}-${song}-${size}-${date}-${hour}.${ext}`;
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

      // ══════════════════════════════════════════════════════════════
      // EXPORT PIPELINE (PNG / PDF / SVG & BATCH COLOR ZIP)
      // ══════════════════════════════════════════════════════════════

      w.exportVinylLoop = async function(format: string) {
          canvas.discardActiveObject().requestRenderAll();
          const items = document.querySelectorAll('.multi-export-item');
          const colorsToExport: string[] = [];
          items.forEach((item: any) => {
              const chk = item.querySelector('.export-color-check') as HTMLInputElement;
              const pck = item.querySelector('.export-color-picker') as HTMLInputElement;
              if (chk && chk.checked && pck) {
                  colorsToExport.push(pck.value);
              }
          });

          if (colorsToExport.length === 0) {
              w.showToast('Lütfen dışa aktarmak için en az bir renk seçin.');
              return;
          }

          const originalBg = canvas.backgroundColor;
          const bgImg = canvas.getObjects().find((o: any) => o.id === 'bg-image');
          const originalBgImgVisible = bgImg ? bgImg.visible : false;

          w.showToast(`${colorsToExport.length} renk için ZIP hazırlanıyor... Lütfen bekleyin.`);

          const key = (document.getElementById('canvas-size') as HTMLSelectElement).value;
          const [wIn, hIn] = w.CANVAS_SIZES[key];
          
          let targetWidthPx = Math.round(wIn * 300);
          let targetHeightPx = Math.round(hIn * 300);
          let scaleMultiplier = targetWidthPx / BASE_WIDTH;

          const zip = new (window as any).JSZip();
          const folder = zip.folder(`vinyl-posters-${format}`);

          for (let i = 0; i < colorsToExport.length; i++) {
              const color = colorsToExport[i];
              canvas.setBackgroundColor(color, canvas.renderAll.bind(canvas));
              if(bgImg) bgImg.set('visible', false); 
              
              // Dynamically wait for contrast and SVG render load cycles completely
              await w.applyAutoContrast(color);
              
              await new Promise(r => setTimeout(r, 100));

              try {
                  let baseFilename = w.getExportFilename(format);
                  let filename = baseFilename.replace(`.${format}`, `-${color.replace('#', '')}.${format}`);

                  if (format === 'png') {
                      const base64Data = canvas.toDataURL({
                        format: 'png',
                        multiplier: scaleMultiplier,
                        enableRetinaScaling: false
                      });
                      const dpiFixedData = w.changeDpiDataUrl(base64Data, 300);
                      const base64Content = dpiFixedData.split(',')[1];
                      folder.file(filename, base64Content, {base64: true});
                  } else if (format === 'pdf') {
                      const { jsPDF } = w.jspdf;
                      const pdf = new jsPDF({ orientation: wIn > hIn ? 'landscape' : 'portrait', unit: 'in', format: [wIn, hIn] });
                      const imgData = canvas.toDataURL({
                        format: 'jpeg',
                        multiplier: scaleMultiplier,
                        quality: 0.95
                      });
                      pdf.addImage(imgData, 'JPEG', 0, 0, wIn, hIn);
                      const pdfArrayBuffer = pdf.output('arraybuffer');
                      folder.file(filename, pdfArrayBuffer);
                  } else if (format === 'svg') {
                      const svgContent = canvas.toSVG({
                        width: targetWidthPx,
                        height: targetHeightPx,
                        viewBox: {
                          x: 0,
                          y: 0,
                          width: BASE_WIDTH,
                          height: BASE_WIDTH / (wIn / hIn)
                        }
                      });
                      folder.file(filename, svgContent);
                  }
              } catch(e) {
                  console.error(e);
              }
          }

          zip.generateAsync({type:"blob"}).then(function(content: Blob) {
              const url = URL.createObjectURL(content);
              const link = document.createElement('a');
              link.download = `Vinyl-Posters-${new Date().getTime()}.zip`;
              link.href = url;
              link.click();
              URL.revokeObjectURL(url);
              w.showToast(`✓ ZIP dosyası indirildi!`);
          });

          canvas.setBackgroundColor(originalBg, canvas.renderAll.bind(canvas));
          if(bgImg) bgImg.set('visible', originalBgImgVisible);
          const currentType = (document.getElementById('v-bg-type') as HTMLSelectElement)?.value || 'color';
          if (currentType === 'color') w.applyAutoContrast(originalBg);
          else w.applyAutoContrast('#121212');
      };

      w.downloadPNG = async function() {
        canvas.discardActiveObject().requestRenderAll();
        if (w.POSTER_MODE === 'vinyl') { await w.exportVinylLoop('png'); return; }

        w.showToast('PNG hazırlanıyor...');
        const key = (document.getElementById('canvas-size') as HTMLSelectElement).value;
        const [wIn, hIn] = w.CANVAS_SIZES[key];
        
        let targetWidthPx = Math.round(wIn * 300);
        let scaleMultiplier = targetWidthPx / BASE_WIDTH;

        try {
          const base64Data = canvas.toDataURL({
            format: 'png',
            multiplier: scaleMultiplier,
            enableRetinaScaling: false
          });
          const dpiFixedData = w.changeDpiDataUrl(base64Data, 300);
          const link = document.createElement('a');
          link.download = w.getExportFilename('png'); 
          link.href = dpiFixedData; 
          link.click();
          w.showToast('✓ PNG indirildi!');
        } catch(e: any) { w.showToast('Hata: ' + e.message); }
      };

      w.downloadPDF = async function() {
        canvas.discardActiveObject().requestRenderAll();
        if (w.POSTER_MODE === 'vinyl') { await w.exportVinylLoop('pdf'); return; }

        w.showToast('PDF hazırlanıyor...');
        const key = (document.getElementById('canvas-size') as HTMLSelectElement).value;
        const [wIn, hIn] = w.CANVAS_SIZES[key];
        
        let targetWidthPx = Math.round(wIn * 300);
        let scaleMultiplier = targetWidthPx / BASE_WIDTH;

        try {
          const imgData = canvas.toDataURL({
            format: 'jpeg',
            multiplier: scaleMultiplier,
            quality: 0.95
          });
          const { jsPDF } = w.jspdf;
          const pdf = new jsPDF({ orientation: wIn > hIn ? 'landscape' : 'portrait', unit: 'in', format: [wIn, hIn] });
          pdf.addImage(imgData, 'JPEG', 0, 0, wIn, hIn);
          pdf.save(w.getExportFilename('pdf'));
          w.showToast('✓ PDF indirildi!');
        } catch(e: any) { w.showToast('Hata: ' + e.message); }
      };

      w.downloadSVG = async function() {
        canvas.discardActiveObject().requestRenderAll();
        if (w.POSTER_MODE === 'vinyl') { await w.exportVinylLoop('svg'); return; }

        w.showToast('SVG hazırlanıyor...');
        const key = (document.getElementById('canvas-size') as HTMLSelectElement).value;
        const [wIn, hIn] = w.CANVAS_SIZES[key];
        
        let targetWidthPx = Math.round(wIn * 300);
        let targetHeightPx = Math.round(hIn * 300);

        try {
          const svgContent = canvas.toSVG({
            width: targetWidthPx,
            height: targetHeightPx,
            viewBox: {
              x: 0,
              y: 0,
              width: BASE_WIDTH,
              height: BASE_WIDTH / (wIn / hIn)
            }
          });
          const blob = new Blob([svgContent], { type: 'image/svg+xml' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.download = w.getExportFilename('svg'); 
          link.href = url; 
          link.click();
          URL.revokeObjectURL(url);
          w.showToast('✓ SVG indirildi!');
        } catch(e: any) { w.showToast('Hata: ' + e.message); }
      };

      // ══════════════════════════════════════════════════════════════
      // PROPERTIES MANAGER & SELECTION ENGINE
      // ══════════════════════════════════════════════════════════════

      w.ED_LABELS = {
        'label-top':  'Top Label', 'cover': 'Cover Art', 'song-title': 'Song Title', 
        'song-artist':'Artist Name', 'heart': 'Heart Icon', 'progress-track': 'Progress Track',
        'progress-fill': 'Progress Fill', 'time-start-el': 'Start Time', 'time-end-el': 'End Time',
        'play': 'Play Button', 'btn-shuffle':'Shuffle Button', 'btn-prev': 'Previous Button', 
        'btn-next': 'Next Button', 'btn-repeat': 'Repeat Button', 'barcode': 'Spotify Barcode',
        'v-top-left': 'Artist Name', 'v-top-right': 'Year', 'v-song-title': 'Vinyl Song Title',
        'v-vinyl': 'Vinyl Record Graphic', 'v-bottom': 'Bottom Text'
      };

      w.edAlign = function(mode: string) {
        const activeObjs = canvas.getActiveObjects();
        if (!activeObjs.length) return;
        
        const key = (document.getElementById('canvas-size') as HTMLSelectElement).value;
        const [wIn, hIn] = w.CANVAS_SIZES[key];
        const canvasHeight = BASE_WIDTH / (wIn / hIn);

        activeObjs.forEach((obj: any) => {
          const width = obj.width * obj.scaleX;
          const height = obj.height * obj.scaleY;

          if (mode === 'left')   obj.set({ left: 0 + obj.originX * width });
          if (mode === 'right')  obj.set({ left: BASE_WIDTH - (1 - obj.originX) * width });
          if (mode === 'cx')     obj.set({ left: BASE_WIDTH / 2 });
          if (mode === 'top')    obj.set({ top: 0 + obj.originY * height });
          if (mode === 'bottom') obj.set({ top: canvasHeight - (1 - obj.originY) * height });
          if (mode === 'cy')     obj.set({ top: canvasHeight / 2 });
        });
        canvas.requestRenderAll();
        w.edUpdatePanel();
      };

      w.edDistribute = function(axis: string) {
        const activeObjs = canvas.getActiveObjects();
        if (activeObjs.length < 3) return;

        const sorted = [...activeObjs].sort((a: any, b: any) => {
          return axis === 'h' ? a.left - b.left : a.top - b.top;
        });

        const first = sorted[0];
        const last = sorted[sorted.length - 1];

        if (axis === 'h') {
          const totalDistance = last.left - first.left;
          const step = totalDistance / (sorted.length - 1);
          sorted.forEach((obj: any, idx: number) => {
            obj.set('left', first.left + idx * step);
          });
        } else {
          const totalDistance = last.top - first.top;
          const step = totalDistance / (sorted.length - 1);
          sorted.forEach((obj: any, idx: number) => {
            obj.set('top', first.top + idx * step);
          });
        }
        canvas.requestRenderAll();
      };

      w.edUpdateAlignBar = function() {
        const selLength = canvas.getActiveObjects().length;
        document.getElementById('ed-align-bar')!.classList.toggle('ed-bar-visible', selLength > 0);
      };

      w.edUpdatePanel = function() {
        const empty  = document.getElementById('props-empty-state');
        const fields = document.getElementById('props-fields');
        const nameEl = document.getElementById('props-selected-name');

        const activeObjs = canvas.getActiveObjects();

        if (activeObjs.length === 0) {
          if(empty) empty.style.display = ''; 
          if(fields) fields.style.display = 'none';
          if(nameEl) nameEl.textContent = ''; return;
        }

        if(empty) empty.style.display = 'none'; 
        if(fields) fields.style.display = '';

        if (activeObjs.length > 1) {
          if(nameEl) nameEl.textContent = activeObjs.length + ' elements';
          if(fields) fields.innerHTML = w.edBuildMulti();
          return;
        }

        const obj = activeObjs[0];
        const id = obj.id;
        if(nameEl) nameEl.textContent = w.ED_LABELS[id] || id || 'Custom Shape';
        if(fields) fields.innerHTML = w.edBuildSingle(obj);
      };

      w.edSetFabricProp = function(prop: string, val: any) {
        const activeObjs = canvas.getActiveObjects();
        activeObjs.forEach((o: any) => {
          o.set(prop, val);
          if (prop === 'text' && o.id) {
            const map: any = { 
                'song-title': 'song-title-input', 'song-artist': 'song-artist-input', 'label-top': 'label-top-input',
                'v-top-left': 'v-label-input', 'v-top-right': 'v-year-input', 'v-song-title': 'v-song-title-input',
                'v-bottom': 'v-bottom-input'
            };
            const inp = document.getElementById(map[o.id]) as HTMLInputElement; if (inp) inp.value = val;
          }
        });
        canvas.requestRenderAll();
      };

      w.edBuildSingle = function(obj: any) {
        const id = obj.id;
        const left = Math.round(obj.left || 0);
        const top  = Math.round(obj.top || 0);
        const cw   = Math.round(obj.width * obj.scaleX);
        const ch   = Math.round(obj.height * obj.scaleY);
        const op   = Math.round((obj.opacity || 1) * 100);
        const vis  = obj.visible !== false;

        function cpair(initColor: string, oninput: string) {
          return `<div class="pf-color-row"><input type="color" value="${initColor}" oninput="const v=this.value; ${oninput.replace(/"/g,"'")}; this.nextElementSibling.value=v;"><input type="text" value="${initColor}" oninput="let v=this.value; if(/^#[0-9a-fA-F]{3}$/i.test(v)){v='#'+v[1]+v[1]+v[2]+v[2]+v[3]+v[3];} if(/^#[0-9a-fA-F]{6}$/i.test(v)){${oninput.replace(/this\.value/g,"v").replace(/"/g,"'")}; this.previousElementSibling.value=v;}"></div>`;
        }
        function rrow(min:number,max:number,step:number,val:number,oninput:string,unit='px') {
          return `<div class="pf-range-row"><input type="range" min="${min}" max="${max}" step="${step}" value="${val}" oninput="${oninput.replace(/"/g,"'")}; this.nextElementSibling.textContent=this.value+'${unit}'"><span class="pf-range-val">${val}${unit}</span></div>`;
        }

        const fontOpts = `<option value="'Abril Fatface', serif">Abril Fatface</option><option value="'Alfa Slab One', serif">Alfa Slab One</option><option value="'Anton', sans-serif">Anton</option><option value="'Archivo Black', sans-serif">Archivo Black</option><option value="'Bangers', cursive">Bangers</option><option value="'Bebas Neue', sans-serif">Bebas Neue</option><option value="'Bodoni Moda', serif">Bodoni Moda</option><option value="'Caveat', cursive">Caveat</option><option value="'Cinzel', serif">Cinzel</option><option value="'Cormorant Garamond', serif">Cormorant Garamond</option><option value="'Courgette', cursive">Courgette</option><option value="'DM Sans', sans-serif">DM Sans</option><option value="'Dancing Script', cursive">Dancing Script</option><option value="'EB Garamond', serif">EB Garamond</option><option value="'Fjalla One', sans-serif">Fjalla One</option><option value="'Great Vibes', cursive">Great Vibes</option><option value="'Inter', sans-serif">Inter</option><option value="'Josefin Sans', sans-serif">Josefin Sans</option><option value="'Kanit', sans-serif">Kanit</option><option value="'Lato', sans-serif">Lato</option><option value="'Libre Baskerville', serif">Libre Baskerville</option><option value="'Lobster', cursive">Lobster</option><option value="'Lora', serif">Lora</option><option value="'Merriweather', serif">Merriweather</option><option value="'Montserrat', sans-serif">Montserrat</option><option value="'Open Sans', sans-serif">Open Sans</option><option value="'Oswald', sans-serif">Oswald</option><option value="'PT Serif', serif">PT Serif</option><option value="'Pacifico', cursive">Pacifico</option><option value="'Patua One', serif">Patua One</option><option value="'Permanent Marker', cursive">Permanent Marker</option><option value="'Playfair Display', serif">Playfair Display</option><option value="'Poppins', sans-serif">Poppins</option><option value="'Prata', serif">Prata</option><option value="'Raleway', sans-serif">Raleway</option><option value="'Righteous', cursive">Righteous</option><option value="'Roboto', sans-serif">Roboto</option><option value="'Sacramento', cursive">Sacramento</option><option value="'Satisfy', cursive">Satisfy</option><option value="'Teko', sans-serif">Teko</option><option value="'Ubuntu', sans-serif">Ubuntu</option><option value="'Yellowtail', cursive">Yellowtail</option>`;

        let html = `<div class="pf-section"><div class="pf-section-title">Position &amp; Size</div><div class="pf-2col"><div class="pf-row"><label>X Position</label><input type="number" value="${left}" oninput="window.edSetFabricProp('left', parseFloat(this.value))"></div><div class="pf-row"><label>Y Position</label><input type="number" value="${top}" oninput="window.edSetFabricProp('top', parseFloat(this.value))"></div></div><div class="pf-2col"><div class="pf-row"><label>Width (px)</label><input type="number" value="${cw}" disabled></div><div class="pf-row"><label>Height (px)</label><input type="number" value="${ch}" disabled></div></div></div><hr class="pf-divider"><div class="pf-section"><div class="pf-section-title">Visibility & Rotation</div><div class="pf-toggle-row"><span>Visible</span><label class="toggle"><input type="checkbox" ${vis?'checked':''} onchange="window.edSetFabricProp('visible', this.checked)"><span class="slider"></span></label></div><div class="pf-row"><label>Opacity</label>${rrow(0,100,1,op, `window.edSetFabricProp('opacity', parseFloat(this.value)/100)`, '%')}</div><div class="pf-row"><label>Rotation</label>${rrow(0,360,1,Math.round(obj.angle||0), `window.edSetFabricProp('angle', parseFloat(this.value))`, '°')}</div></div>`;

        if (obj instanceof fabric.Text || obj instanceof fabric.IText) {
          const txt = (obj.text || '').replace(/"/g,'&quot;');
          const fs  = obj.fontSize || 14;
          const fw  = obj.fontWeight || 'normal';
          const col = obj.fill || '#ffffff';
          const ls  = obj.charSpacing || 0;
          const lh  = obj.lineHeight || 1.2;
          const ff  = obj.fontFamily;

          html += `<hr class="pf-divider"><div class="pf-section"><div class="pf-section-title">Text properties</div><div class="pf-row"><label>Content</label><input type="text" value="${txt}" oninput="window.edSetFabricProp('text', this.value)"></div><div class="pf-row"><label>Font Family</label><select onchange="window.edSetFabricProp('fontFamily', this.value)"><option value="${ff}" selected>${ff}</option>${fontOpts}</select></div><div class="pf-2col"><div class="pf-row"><label>Font Size</label><input type="number" value="${fs}" min="6" max="200" oninput="window.edSetFabricProp('fontSize', parseFloat(this.value))"></div><div class="pf-row"><label>Weight</label><select onchange="window.edSetFabricProp('fontWeight', this.value)"><option value="300" ${fw==='300'?'selected':''}>Light</option><option value="400" ${fw==='400'||fw==='normal'?'selected':''}>Regular</option><option value="500" ${fw==='500'?'selected':''}>Medium</option><option value="600" ${fw==='600'?'selected':''}>SemiBold</option><option value="700" ${fw==='700'||fw==='bold'?'selected':''}>Bold</option><option value="900" ${fw==='900'?'selected':''}>Black</option></select></div></div><div class="pf-row"><label>Letter Spacing</label>${rrow(-200,800,10,ls, `window.edSetFabricProp('charSpacing', parseFloat(this.value))`)}</div><div class="pf-row"><label>Line Height</label>${rrow(0.8,4,0.05,lh, `window.edSetFabricProp('lineHeight', parseFloat(this.value))`, '')}</div><div class="pf-row"><label>Alignment</label><div class="pf-3col"><button class="pf-btn" onclick="window.edSetFabricProp('textAlign', 'left')">Left</button><button class="pf-btn" onclick="window.edSetFabricProp('textAlign', 'center')">Center</button><button class="pf-btn" onclick="window.edSetFabricProp('textAlign', 'right')">Right</button></div></div></div><hr class="pf-divider"><div class="pf-section"><div class="pf-section-title">Text Color</div><div class="pf-row">${cpair(col, `window.edSetFabricProp('fill', this.value)`)}</div></div>`;
        }

        if (id === 'cover') {
          const br = obj.clipPath ? (obj.clipPath.rx || 0) : 0;
          const bw = obj.strokeWidth || 0;
          const bc = obj.stroke || '#ffffff';
          const shadowBlur = obj.shadow ? (obj.shadow.blur / 2) : 0;
          const imgScale = Math.round((obj.scaleX || 1) * 100);

          html += `<hr class="pf-divider"><div class="pf-section">
            <div class="pf-section-title">Cover Art Controls</div>
            <div class="pf-row"><label>Border Radius</label>${rrow(0, 150, 1, br, `window.setCoverBorderProp('borderRadius', this.value)`)}</div>
            <div class="pf-row"><label>Border Width</label>${rrow(0, 40, 1, bw, `window.setCoverBorderProp('borderWidth', this.value)`)}</div>
            <div class="pf-row"><label>Border Color</label>${cpair(bc, `window.setCoverBorderProp('borderColor', this.value)`)}</div>
            <div class="pf-row"><label>Border Style</label>
              <select onchange="window.setCoverBorderProp('borderStyle', this.value)">
                <option value="solid" ${obj.strokeDashArray===null?'selected':''}>Solid</option>
                <option value="dashed" ${obj.strokeDashArray&&obj.strokeDashArray[0]===10?'selected':''}>Dashed</option>
                <option value="dotted" ${obj.strokeDashArray&&obj.strokeDashArray[0]===2?'selected':''}>Dotted</option>
                <option value="none" ${obj.strokeWidth===0?'selected':''}>None</option>
              </select>
            </div>
            <div class="pf-row"><label>Shadow Blur</label>${rrow(0, 80, 1, shadowBlur, `window.setCoverBorderProp('shadow', this.value)`)}</div>
            <div class="pf-row"><label>Image Scale</label>${rrow(10, 200, 1, imgScale, `window.setCoverBorderProp('imageScale', this.value)`, '%')}</div>
          </div>`;
        }

        if (id === 'v-vinyl') {
          const vsTextSize = parseInt((document.getElementById('vinyl-text-size') as HTMLInputElement)?.value || "12");
          const vsLetterSpacing = parseFloat((document.getElementById('vinyl-letter-spacing') as HTMLInputElement)?.value || "2");
          const vsColor = (document.getElementById('c-v-st-t') as HTMLInputElement)?.value || "#212121";
          const lblColor = (document.getElementById('c-v-lbl') as HTMLInputElement)?.value || "#e0e0e0";
          const labelSize = parseInt((document.getElementById('vinyl-center-label-size') as HTMLInputElement)?.value || "80");
          const currentScale = Math.round((obj.scaleX || 1) * 100);
          const currentFont = (document.getElementById('vinyl-font-family') as HTMLInputElement)?.value || "'DM Sans', sans-serif";

          html += `<hr class="pf-divider"><div class="pf-section"><div class="pf-section-title">Vinyl Record Controls</div>
          <div class="pf-row"><label>Overall Size (%)</label>${rrow(10,150,1,currentScale, `window.setVinylProp('overallSize', this.value)`, '%')}</div>
          <div class="pf-row"><label>Spiral Font Family</label>
            <select onchange="window.setVinylProp('fontFamily', this.value)">
              <option value="${currentFont}" selected>Current: ${currentFont.replace(/'/g, "")}</option>
              ${fontOpts}
            </select>
          </div>
          <div class="pf-row"><label>Spiral Text Size</label>${rrow(6,30,1,vsTextSize, `window.setVinylProp('textSize', this.value)`)}</div>
          <div class="pf-row"><label>Spiral Letter Spacing</label>${rrow(-2,15,0.2,vsLetterSpacing, `window.setVinylProp('letterSpacing', this.value)`, '')}</div>
          <div class="pf-row"><label>Spiral Text Color</label>${cpair(vsColor, `window.setVinylProp('textColor', this.value)`)}</div>
          <div class="pf-row"><label>Center Label Color</label>${cpair(lblColor, `window.setVinylProp('labelColor', this.value)`)}</div>
          <div class="pf-row"><label>Center Label Size</label>${rrow(20,200,1,labelSize, `window.setVinylProp('labelSize', this.value)`)}</div>
          </div>`;
        }

        return html;
      };

      w.edBuildMulti = function() {
        const fontOpts = `<option value="'DM Sans', sans-serif">DM Sans</option><option value="'Inter', sans-serif">Inter</option><option value="'Montserrat', sans-serif">Montserrat</option><option value="'Oswald', sans-serif">Oswald</option><option value="'Poppins', sans-serif">Poppins</option><option value="'Playfair Display', serif">Playfair Display</option><option value="'Anton', sans-serif">Anton</option><option value="'Bebas Neue', sans-serif">Bebas Neue</option><option value="'Lora', serif">Lora</option><option value="'Merriweather', serif">Merriweather</option>`;
        
        return `<div class="pf-section"><div class="pf-section-title">Align to Canvas</div><div class="pf-2col" style="margin-bottom:6px;"><button class="pf-btn" onclick="window.edAlign('left')">← Left</button><button class="pf-btn" onclick="window.edAlign('right')">Right →</button><button class="pf-btn" onclick="window.edAlign('cx')">↔ Center H</button><button class="pf-btn" onclick="window.edAlign('cy')">↕ Center V</button><button class="pf-btn" onclick="window.edAlign('top')">↑ Top</button><button class="pf-btn" onclick="window.edAlign('bottom')">↓ Bottom</button></div></div><hr class="pf-divider"><div class="pf-section"><div class="pf-section-title">Distribute</div><div class="pf-2col"><button class="pf-btn" onclick="window.edDistribute('h')">↔ Horizontal</button><button class="pf-btn" onclick="window.edDistribute('v')">↕ Vertical</button></div></div><hr class="pf-divider"><div class="pf-section"><div class="pf-section-title">Batch Formatting</div>
        <div class="pf-row"><label>Font Family (texts)</label><select onchange="window.edSetFabricProp('fontFamily', this.value)"><option value="" disabled selected>Change Font...</option>${fontOpts}</select></div>
        <div class="pf-row"><label>Color</label><div class="pf-color-row"><input type="color" value="#ffffff" oninput="const v=this.value; window.edSetFabricProp('fill', v); this.nextElementSibling.value=v;" /><input type="text" value="#ffffff" oninput="let v=this.value; if(/^#[0-9a-fA-F]{3}$/i.test(v)){v='#'+v[1]+v[1]+v[2]+v[2]+v[3]+v[3];} if(/^#[0-9a-fA-F]{6}$/i.test(v)){this.previousElementSibling.value=v; window.edSetFabricProp('fill', v);}" /></div></div>
        <div class="pf-row"><label>Opacity</label><div class="pf-range-row"><input type="range" min="0" max="100" value="100" oninput="window.edSetFabricProp('opacity', parseFloat(this.value)/100);this.nextElementSibling.textContent=this.value+'%'"><span class="pf-range-val">100%</span></div></div><div class="pf-row"><label>Visibility</label><div class="pf-2col"><button class="pf-btn" onclick="window.edSetFabricProp('visible', true)">Show All</button><button class="pf-btn" onclick="window.edSetFabricProp('visible', false)">Hide All</button></div></div></div>`;
      };

      canvas.on('selection:created', () => { w.edUpdatePanel(); w.edUpdateAlignBar(); });
      canvas.on('selection:updated', () => { w.edUpdatePanel(); w.edUpdateAlignBar(); });
      canvas.on('selection:cleared', () => { w.edUpdatePanel(); w.edUpdateAlignBar(); });
      canvas.on('object:moving', () => { w.edUpdatePanel(); });
      canvas.on('object:scaling', () => { w.edUpdatePanel(); });

      // ══════════════════════════════════════════════════════════════
      // SCENE INITIALIZERS
      // ══════════════════════════════════════════════════════════════

      w.updateContentPosition = function() {
        const val = parseFloat((document.getElementById('content-y') as HTMLInputElement).value) / 100;
        document.getElementById('content-y-display')!.textContent = Math.round(val * 100) + '%';
        
        const key = (document.getElementById('canvas-size') as HTMLSelectElement).value;
        const [wIn, hIn] = w.CANVAS_SIZES[key];
        const canvasHeight = BASE_WIDTH / (wIn / hIn);
        const centerY = canvasHeight * val;

        const nowPlaying = canvas.getObjects().find((o: any) => o.id === 'label-top');
        const cover = canvas.getObjects().find((o: any) => o.id === 'cover');
        const title = canvas.getObjects().find((o: any) => o.id === 'song-title');
        const artist = canvas.getObjects().find((o: any) => o.id === 'song-artist');
        const heart = canvas.getObjects().find((o: any) => o.id === 'heart');
        const track = canvas.getObjects().find((o: any) => o.id === 'progress-track');
        const fill = canvas.getObjects().find((o: any) => o.id === 'progress-fill');
        const tStart = canvas.getObjects().find((o: any) => o.id === 'time-start-el');
        const tEnd = canvas.getObjects().find((o: any) => o.id === 'time-end-el');
        const bShuffle = canvas.getObjects().find((o: any) => o.id === 'btn-shuffle');
        const bPrev = canvas.getObjects().find((o: any) => o.id === 'btn-prev');
        const bPlay = canvas.getObjects().find((o: any) => o.id === 'play');
        const bNext = canvas.getObjects().find((o: any) => o.id === 'btn-next');
        const bRepeat = canvas.getObjects().find((o: any) => o.id === 'btn-repeat');
        const barcode = canvas.getObjects().find((o: any) => o.id === 'barcode');

        if (nowPlaying) nowPlaying.set('top', centerY - 400);
        if (cover) cover.set('top', centerY - 320);
        if (title) title.set('top', centerY + 230);
        if (artist) artist.set('top', centerY + 285);
        if (heart) heart.set('top', centerY + 240);
        if (track) track.set('top', centerY + 350);
        if (fill) fill.set('top', centerY + 350);
        if (tStart) tStart.set('top', centerY + 370);
        if (tEnd) tEnd.set('top', centerY + 370);
        if (bShuffle) bShuffle.set('top', centerY + 420);
        if (bPrev) bPrev.set('top', centerY + 420);
        if (bPlay) bPlay.set('top', centerY + 420);
        if (bNext) bNext.set('top', centerY + 420);
        if (bRepeat) bRepeat.set('top', centerY + 420);
        if (barcode) barcode.set('top', centerY + 490);

        canvas.requestRenderAll();
      };

      w.initSpotifyScene = function() {
        canvas.clear();
        canvas.setBackgroundColor('#121212', canvas.renderAll.bind(canvas));

        const key = (document.getElementById('canvas-size') as HTMLSelectElement).value;
        const [wIn, hIn] = w.CANVAS_SIZES[key];
        const canvasHeight = BASE_WIDTH / (wIn / hIn);
        const centerY = canvasHeight * 0.5;

        const nowPlaying = new fabric.Text('Now Playing', {
          left: 400,
          top: centerY - 400,
          originX: 'center',
          fontFamily: 'DM Sans',
          fontSize: 22,
          fontWeight: '700',
          fill: '#FFFFFF',
          charSpacing: 150,
          id: 'label-top'
        });

        const coverPlaceholder = new fabric.Rect({
          left: 150,
          top: centerY - 320,
          width: 500,
          height: 500,
          fill: '#282828',
          rx: 10,
          ry: 10,
          id: 'cover',
          hasControls: true
        });

        const title = new fabric.Text('Song Title', {
          left: 150,
          top: centerY + 230,
          fontFamily: 'DM Sans',
          fontSize: 36,
          fontWeight: '700',
          fill: '#FFFFFF',
          id: 'song-title'
        });

        const artist = new fabric.Text('Artist Name', {
          left: 150,
          top: centerY + 285,
          fontFamily: 'DM Sans',
          fontSize: 24,
          fill: '#B3B3B3',
          id: 'song-artist'
        });

        const heartPath = "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z";
        const heart = new fabric.Path(heartPath, {
          left: 610,
          top: centerY + 240,
          fill: '#6366f1',
          scaleX: 1.5,
          scaleY: 1.5,
          id: 'heart'
        });

        const track = new fabric.Rect({
          left: 150,
          top: centerY + 350,
          width: 500,
          height: 8,
          fill: '#535353',
          rx: 4,
          ry: 4,
          id: 'progress-track',
          selectable: false
        });

        const fill = new fabric.Rect({
          left: 150,
          top: centerY + 350,
          width: 175,
          height: 8,
          fill: '#FFFFFF',
          rx: 4,
          ry: 4,
          id: 'progress-fill',
          selectable: false
        });

        const tStart = new fabric.Text('1:12', {
          left: 150,
          top: centerY + 370,
          fontFamily: 'DM Sans',
          fontSize: 18,
          fill: '#B3B3B3',
          id: 'time-start-el'
        });

        const tEnd = new fabric.Text('3:45', {
          left: 650,
          top: centerY + 370,
          originX: 'right',
          fontFamily: 'DM Sans',
          fontSize: 18,
          fill: '#B3B3B3',
          id: 'time-end-el'
        });

        const btnShuffle = new fabric.Path("M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6", {
          left: 170,
          top: centerY + 420,
          fill: 'none',
          stroke: '#B3B3B3',
          strokeWidth: 2,
          scaleX: 1.5,
          scaleY: 1.5,
          id: 'btn-shuffle'
        });

        const btnPrev = new fabric.Path("M19 20L9 12l10-8v16z M5 19V5h2v14H5z", {
          left: 270,
          top: centerY + 420,
          fill: '#B3B3B3',
          scaleX: 1.5,
          scaleY: 1.5,
          id: 'btn-prev'
        });

        const playBtn = new fabric.Path("M5 3l14 9-14 9V3z", {
          left: 380,
          top: centerY + 410,
          fill: '#FFFFFF',
          scaleX: 2.2,
          scaleY: 2.2,
          id: 'play'
        });

        const btnNext = new fabric.Path("M5 4l10 8-10 8V4z M17 5v14h2V5h-2z", {
          left: 490,
          top: centerY + 420,
          fill: '#B3B3B3',
          scaleX: 1.5,
          scaleY: 1.5,
          id: 'btn-next'
        });

        const btnRepeat = new fabric.Path("M17 1l4 4-4 4M3 11V9a4 4 0 0 1 4-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 0 1-4 4H3", {
          left: 590,
          top: centerY + 420,
          fill: 'none',
          stroke: '#B3B3B3',
          strokeWidth: 2,
          scaleX: 1.5,
          scaleY: 1.5,
          id: 'btn-repeat'
        });

        canvas.add(nowPlaying, coverPlaceholder, title, artist, heart, track, fill, tStart, tEnd, btnShuffle, btnPrev, playBtn, btnNext, btnRepeat);
        canvas.requestRenderAll();
        w.updateCanvasSize();
      };

      w.initVinylScene = function() {
        canvas.clear();
        canvas.setBackgroundColor('#f5f5f5', canvas.renderAll.bind(canvas));

        const key = (document.getElementById('canvas-size') as HTMLSelectElement).value;
        const [wIn, hIn] = w.CANVAS_SIZES[key];
        const canvasHeight = BASE_WIDTH / (wIn / hIn);

        const labelTopLeft = new fabric.Text('ARTIST NAME', {
          left: 80,
          top: 80,
          fontFamily: 'DM Sans',
          fontSize: 22,
          fontWeight: '700',
          fill: '#212121',
          charSpacing: 100,
          id: 'v-top-left'
        });

        const labelTopRight = new fabric.Text('1992', {
          left: 720,
          top: 80,
          originX: 'right',
          fontFamily: 'DM Sans',
          fontSize: 22,
          fontWeight: '700',
          fill: '#212121',
          charSpacing: 100,
          id: 'v-top-right'
        });

        const songTitle = new fabric.Text('SONG NAME', {
          left: 400,
          top: 150,
          originX: 'center',
          fontFamily: 'Josefin Sans',
          fontSize: 54,
          fontWeight: '800',
          fill: '#212121',
          charSpacing: 150,
          id: 'v-song-title'
        });

        const labelBottom = new fabric.Text('UNKNOWN ALBUM', {
          left: 400,
          top: canvasHeight - 100,
          originX: 'center',
          fontFamily: 'DM Sans',
          fontSize: 20,
          fontWeight: '600',
          fill: '#555555',
          charSpacing: 50,
          id: 'v-bottom'
        });

        canvas.add(labelTopLeft, labelTopRight, songTitle, labelBottom);
        
        w.updateVinylSpiral();
        w.updateCanvasSize();
      };

      setTimeout(() => {
        if(w.POSTER_MODE === 'vinyl') {
          w.initVinylScene();
        } else {
          w.initSpotifyScene();
          w.updateOverlay();
        }
      }, 50);
    };

    initApp();

    return () => {
      active = false;
      const w = window as any;
      window.removeEventListener('resize', w.updateCanvasSize);
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.dispose();
        fabricCanvasRef.current = null;
      }
    };
  }, [posterMode]);

  return (
    <div className="spotify-poster-page">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Abril+Fatface&family=Alfa+Slab+One&family=Anton&family=Archivo+Black&family=Bangers&family=Bebas+Neue&family=Bodoni+Moda:ital,opsz,wght@0,6..96,400..900;1,6..96,400..900&family=Caveat:wght@400..700&family=Cinzel:wght@400..900&family=Cormorant+Garamond:ital,wght@0,300..700;1,300..700&family=Courgette&family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=Dancing+Script:wght@400..700&family=EB+Garamond:ital,wght@0,400..800;1,400..800&family=Fjalla+One&family=Great+Vibes&family=Inter:wght@100..900&family=Josefin+Sans:ital,wght@0,100..700;1,100..700&family=Kanit:ital,wght@0,100..900;1,100..900&family=Lato:ital,wght@0,100..900;1,100..900&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Lobster&family=Lora:ital,wght@0,400..700;1,400..700&family=Merriweather:ital,wght@0,300..900;1,300..900&family=Montserrat:ital,wght@0,100..900;1,100..900&family=Open+Sans:ital,wght@0,300..800;1,300..800&family=Oswald:wght@200..700&family=PT+Serif:ital,wght@0,400;0,700;1,400;1,700&family=Pacifico&family=Patua+One&family=Permanent+Marker&family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Poppins:ital,wght@0,100..900;1,100..900&family=Prata&family=Raleway:ital,wght@0,100..900;1,100..900&family=Righteous&family=Roboto:ital,wght@0,100..900;1,100..900&family=Sacramento&family=Satisfy&family=Teko:wght@300..700&family=Ubuntu:ital,wght@0,300..700;1,300..700&family=Yellowtail&display=swap');        
        .spotify-poster-page {
          --spotify-green: #1DB954;
          --spotify-black: #121212;
          --spotify-dark: #181818;
          --spotify-card: #282828;
          --spotify-hover: #333333;
          --spotify-text: #FFFFFF;
          --spotify-subtext: #B3B3B3;
          --panel-bg: #09090b;
          --panel-section: #18181b;
          --panel-border: #27272a;
          --accent: #6366f1;
          --input-bg: #09090b;
          --input-border: #27272a;
          --radius: 8px;
          display: flex;
          height: 100vh;
          width: 100vw;
          overflow: hidden;
          font-family: 'Inter', sans-serif;
          background: var(--panel-bg);
          color: var(--spotify-text);
          padding-top: 64px;
        }
        .spotify-poster-page * { box-sizing: border-box; }

        /* ===== PANEL ===== */
        .spotify-poster-page #panel { width: 320px; min-width: 320px; background: var(--panel-bg); border-right: 1px solid var(--panel-border); overflow-y: auto; display: flex; flex-direction: column; }
        .spotify-poster-page #panel::-webkit-scrollbar { width: 4px; }
        .spotify-poster-page #panel::-webkit-scrollbar-track { background: transparent; }
        .spotify-poster-page #panel::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }
        .spotify-poster-page .panel-header { padding: 20px; border-bottom: 1px solid var(--panel-border); display: flex; align-items: center; justify-content: space-between; gap: 10px; }
        .spotify-poster-page .panel-header .title-group { display: flex; align-items: center; gap: 10px; }
        .spotify-poster-page .panel-header svg { color: var(--accent); }
        .spotify-poster-page .panel-header h1 { font-size: 14px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; color: var(--spotify-text); margin: 0;}
        .spotify-poster-page .back-btn { background: none; border: 1px solid #444; color: #aaa; font-size: 10px; padding: 4px 8px; border-radius: 4px; cursor: pointer; transition: all 0.2s;}
        .spotify-poster-page .back-btn:hover { background: #fff; color: #000; border-color: #fff; }
        
        .spotify-poster-page .panel-section { border-bottom: 1px solid var(--panel-border); padding: 16px; }
        .spotify-poster-page .section-title { font-size: 10px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--spotify-subtext); margin-bottom: 12px; }
        .spotify-poster-page .form-row { margin-bottom: 10px; }
        .spotify-poster-page .form-row label { display: block; font-size: 11px; color: var(--spotify-subtext); margin-bottom: 4px; font-weight: 500; }
        .spotify-poster-page .form-row input[type="text"], .spotify-poster-page .form-row input[type="number"], .spotify-poster-page .form-row select, .spotify-poster-page .form-row textarea { width: 100%; background: var(--input-bg); border: 1px solid var(--input-border); border-radius: var(--radius); color: var(--spotify-text); padding: 7px 10px; font-size: 12px; font-family: 'Inter', sans-serif; outline: none; transition: border-color 0.2s; }
        .spotify-poster-page .form-row input:focus, .spotify-poster-page .form-row select:focus, .spotify-poster-page .form-row textarea:focus { border-color: var(--accent); }
        .spotify-poster-page .form-row textarea { resize: vertical; min-height: 80px; }
        .spotify-poster-page .form-row select option { background: #222; }
        .spotify-poster-page .form-row input[type="range"] { width: 100%; accent-color: var(--accent); cursor: pointer; }
        .spotify-poster-page .form-row input[type="color"] { width: 36px; height: 28px; border: none; border-radius: 4px; cursor: pointer; padding: 2px; background: var(--input-bg); }
        .spotify-poster-page .color-row { display: flex; align-items: center; gap: 8px; }
        .spotify-poster-page .color-row input[type="text"] { flex: 1; }
        .spotify-poster-page .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .spotify-poster-page .three-col { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px; }
        .spotify-poster-page .btn { display: flex; align-items: center; justify-content: center; gap: 6px; padding: 9px 14px; border-radius: var(--radius); border: none; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.15s; font-family: 'Inter', sans-serif; letter-spacing: 0.03em; }
        .spotify-poster-page .btn-primary { background: var(--accent); color: #fff; width: 100%; margin-bottom: 6px; }
        .spotify-poster-page .btn-primary:hover { background: #4f46e5; transform: scale(1.01); }
        .spotify-poster-page .btn-secondary { background: var(--panel-section); color: var(--spotify-text); border: 1px solid var(--panel-border); flex: 1; }
        .spotify-poster-page .btn-secondary:hover { background: var(--spotify-hover); }
        .spotify-poster-page .btn-outline { background: transparent; color: var(--spotify-text); border: 1px solid var(--panel-border); width: 100%; }
        .spotify-poster-page .btn-outline:hover { border-color: var(--accent); color: var(--accent); }
        .spotify-poster-page .btn-download-group { display: flex; gap: 6px; margin-top: 6px; }
        .spotify-poster-page .range-val { font-size: 11px; color: var(--accent); font-weight: 600; min-width: 28px; text-align: right; }
        .spotify-poster-page .range-row { display: flex; align-items: center; gap: 8px; }
        .spotify-poster-page .toggle-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
        .spotify-poster-page .toggle-row label { font-size: 12px; color: var(--spotify-subtext); margin-bottom:0;}
        .spotify-poster-page .toggle { position: relative; width: 36px; height: 20px; }
        .spotify-poster-page .toggle input { opacity: 0; width: 0; height: 0; }
        .spotify-poster-page .slider { position: absolute; inset: 0; background: #333; border-radius: 20px; cursor: pointer; transition: 0.2s; }
        .spotify-poster-page .slider:before { content: ''; position: absolute; width: 14px; height: 14px; background: white; border-radius: 50%; left: 3px; top: 3px; transition: 0.2s; }
        .spotify-poster-page .toggle input:checked + .slider { background: var(--accent); }
        .spotify-poster-page .toggle input:checked + .slider:before { transform: translateX(16px); }
        .spotify-poster-page .upload-area { border: 1.5px dashed var(--panel-border); border-radius: var(--radius); padding: 16px; text-align: center; cursor: pointer; transition: border-color 0.2s; position: relative; overflow: hidden; }
        .spotify-poster-page .upload-area:hover { border-color: var(--accent); }
        .spotify-poster-page .upload-area input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
        .spotify-poster-page .upload-area p { font-size: 11px; color: var(--spotify-subtext); margin-top: 4px; }
        .spotify-poster-page .search-row { display: flex; gap: 6px; align-items: flex-end; }
        .spotify-poster-page .search-row .form-row { flex: 1; margin-bottom: 0; }
        .spotify-poster-page .search-results { max-height: 150px; overflow-y: auto; margin-top: 6px; border-radius: var(--radius); border: 1px solid var(--panel-border); display: none; }
        .spotify-poster-page .search-result-item { display: flex; align-items: center; gap: 8px; padding: 8px 10px; cursor: pointer; transition: background 0.15s; border-bottom: 1px solid var(--panel-border); }
        .spotify-poster-page .search-result-item:last-child { border-bottom: none; }
        .spotify-poster-page .search-result-item:hover { background: var(--spotify-hover); }
        .spotify-poster-page .search-result-item img { width: 36px; height: 36px; border-radius: 4px; object-fit: cover; }
        .spotify-poster-page .result-info p { font-size: 12px; font-weight: 600; margin:0; }
        .spotify-poster-page .result-info span { font-size: 11px; color: var(--spotify-subtext); }

        /* ===== CANVAS AREA ===== */
        .spotify-poster-page #canvas-area { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #0d0d0d; padding: 30px; overflow: hidden; position: relative; }
        .spotify-poster-page #canvas-area::before { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse at center, #1a1a1a 0%, #0d0d0d 70%); pointer-events: none; }
        .spotify-poster-page #poster-wrapper { position: relative; z-index: 1; display: flex; flex-direction: column; align-items: center; gap: 20px; }
        .spotify-poster-page #poster-container { position: relative; overflow: hidden; box-shadow: 0 32px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.05); border-radius: 4px; transition: width 0.4s cubic-bezier(0.4,0,0.2,1), height 0.4s cubic-bezier(0.4,0,0.2,1); display: flex; align-items: center; justify-content: center; }
        
        /* ===== ACCORDION ===== */
        .spotify-poster-page .accordion-btn { width: 100%; background: none; border: none; color: var(--spotify-subtext); font-size: 10px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; text-align: left; padding: 16px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--panel-border); font-family: 'DM Sans', sans-serif; transition: color 0.15s; }
        .spotify-poster-page .accordion-btn:hover { color: var(--spotify-text); }
        .spotify-poster-page .accordion-btn .arrow { font-size: 9px; transition: transform 0.2s; }
        .spotify-poster-page .accordion-btn.open .arrow { transform: rotate(180deg); }
        .spotify-poster-page .accordion-content { display: none; padding: 14px 16px; border-bottom: 1px solid var(--panel-border); }
        .spotify-poster-page .accordion-content.open { display: block; }
        .spotify-poster-page #toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%) translateY(20px); background: var(--accent); color: #000; padding: 10px 20px; border-radius: 24px; font-size: 13px; font-weight: 600; opacity: 0; transition: all 0.3s; z-index: 9999; pointer-events: none; }
        .spotify-poster-page #toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }

        /* ════════════ EDITOR OVERLAY ════════════ */
        .spotify-poster-page #props-panel { width: 260px; min-width: 260px; background: var(--panel-bg); border-left: 1px solid var(--panel-border); overflow-y: auto; flex-shrink: 0; display: flex; flex-direction: column; }
        .spotify-poster-page #props-panel::-webkit-scrollbar { width: 3px; }
        .spotify-poster-page #props-panel::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }
        .spotify-poster-page #props-header { padding: 14px 16px 10px; border-bottom: 1px solid var(--panel-border); font-size: 10px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--spotify-subtext); display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; }
        .spotify-poster-page #props-selected-name { color: var(--accent); font-size: 10px; font-weight: 600; letter-spacing: 0; text-transform: none; }
        .spotify-poster-page #props-body { flex: 1; overflow-y: auto; padding: 12px 14px; }
        .spotify-poster-page #props-body::-webkit-scrollbar { width: 3px; }
        .spotify-poster-page #props-body::-webkit-scrollbar-thumb { background: #333; }
        .spotify-poster-page #props-empty-state { padding: 32px 16px; text-align: center; color: #444; font-size: 11px; line-height: 1.7; }
        .spotify-poster-page #props-empty-state svg { margin-bottom: 12px; }
        .spotify-poster-page #ed-align-bar { position: absolute; top: 10px; left: 50%; transform: translateX(-50%); background: #111; border: 1px solid var(--panel-border); border-radius: 8px; display: none; align-items: center; gap: 2px; padding: 4px 6px; z-index: 500; box-shadow: 0 4px 16px rgba(0,0,0,0.6); }
        .spotify-poster-page #ed-align-bar.ed-bar-visible { display: flex; }
        .spotify-poster-page .ed-ab-btn { width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; background: none; border: none; color: var(--spotify-subtext); border-radius: 5px; cursor: pointer; transition: all 0.15s; }
        .spotify-poster-page .ed-ab-btn:hover { background: #1a1a1a; color: var(--spotify-text); }
        .spotify-poster-page .ed-ab-sep { width: 1px; height: 18px; background: var(--panel-border); margin: 0 3px; }
        .spotify-poster-page .pf-section { margin-bottom: 4px; }
        .spotify-poster-page .pf-section-title { font-size: 9px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #555; margin: 12px 0 6px; }
        .spotify-poster-page .pf-row { margin-bottom: 7px; }
        .spotify-poster-page .pf-row label { display: block; font-size: 10px; color: var(--spotify-subtext); margin-bottom: 3px; }
        .spotify-poster-page .pf-row input[type=text], .spotify-poster-page .pf-row input[type=number], .spotify-poster-page .pf-row select { width: 100%; background: var(--input-bg); border: 1px solid var(--input-border); border-radius: 5px; color: var(--spotify-text); padding: 5px 8px; font-size: 11px; font-family: 'DM Sans', sans-serif; outline: none; transition: border-color 0.15s; }
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
        .spotify-poster-page .pf-btn { flex: 1; padding: 5px 4px; background: var(--input-bg); border: 1px solid var(--input-border); border-radius: 4px; color: var(--spotify-subtext); font-size: 10px; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.15s; text-align: center; }
        .spotify-poster-page .pf-btn:hover { background: #252525; color: var(--spotify-text); }
        .spotify-poster-page .pf-btn.active { background: #0d2218; color: var(--accent); border-color: #1DB954; }
      `}</style>

      {/* Synchronized state values representing hidden inputs */}
      <input type="hidden" id="vinyl-text-size" defaultValue="12" />
      <input type="hidden" id="vinyl-letter-spacing" defaultValue="2" />
      <input type="hidden" id="vinyl-center-label-size" defaultValue="80" />
      <input type="hidden" id="vinyl-font-family" defaultValue="'DM Sans', sans-serif" />

      <div id="panel">
        <div className="panel-header">
          <div className="title-group">
            {posterMode === 'spotify' ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="12" r="12" fill="#1DB954"/>
                    <path d="M17.9 10.9C14.7 9 9.35 8.8 6.3 9.75c-.5.15-1-.15-1.15-.6-.15-.5.15-1 .6-1.15 3.55-1.05 9.4-.85 13.1 1.35.45.25.6.85.35 1.3-.25.35-.85.5-1.3.25zm-.1 2.8c-.25.35-.7.5-1.05.25-2.7-1.65-6.8-2.15-9.95-1.15-.4.1-.85-.1-.95-.5-.1-.4.1-.85.5-.95 3.65-1.1 8.15-.55 11.25 1.35.3.15.45.65.2 1zm-1.2 2.75c-.2.3-.55.4-.85.2-2.35-1.45-5.3-1.75-8.8-.95-.35.1-.65-.15-.75-.45-.1-.35.15-.65.45-.75 3.8-.85 7.1-.5 9.7 1.1.35.15.4.55.25.85z" fill="white"/>
                </svg>
            ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="1" fill="currentColor"/></svg>
            )}
            <h1>{posterMode === 'spotify' ? 'Spotify Poster' : 'Vinyl Poster'}</h1>
          </div>
          <button className="back-btn" onClick={() => setPosterMode('select')}>⟵ Back</button>
        </div>

        {/* COMMON: SEARCH */}
        <button className="accordion-btn open" onClick={(e) => (window as any).toggleAccordion(e.currentTarget)}>🔍 Search Song (iTunes)<span className="arrow">▼</span></button>
        <div className="accordion-content open">
          <div className="search-row">
            <div className="form-row">
              <input type="text" id="search-input" placeholder="Song or artist name..." onKeyDown={(e) => { if (e.key === 'Enter') (window as any).searchSong(); }} />
            </div>
            <button className="btn btn-primary" style={{ width: 'auto', margin: 0, padding: '7px 12px' }} onClick={() => (window as any).searchSong()}>Search</button>
          </div>
          <div className="loading-spinner" id="search-spinner" style={{ margin: '8px auto' }}></div>
          <div className="search-results" id="search-results"></div>
        </div>

        {/* COMMON: CANVAS SIZE */}
        <button className="accordion-btn open" onClick={(e) => (window as any).toggleAccordion(e.currentTarget)}>📐 Canvas Size<span className="arrow">▼</span></button>
        <div className="accordion-content open">
          <div className="form-row">
            <label>Print Size</label>
            <select id="canvas-size" defaultValue="40x50" onChange={() => (window as any).updateCanvasSize()}>
              <option value="5.83x8.27">A5 (5.83" x 8.27")</option>
              <option value="8.27x11.69">A4 (8.27" x 11.69")</option>
              <option value="11.69x16.54">A3 (11.69" x 16.54")</option>
              <option value="16.54x23.39">A2 (16.54" x 23.39")</option>
              <option value="23.39x33.11">A1 (23.39" x 33.11")</option>
              <option value="5x7">5" x 7"</option>
              <option value="6x8">6" x 8"</option>
              <option value="8x10">8" x 10"</option>
              <option value="9x11">9" x 11"</option>
              <option value="11x14">11" x 14"</option>
              <option value="11x17">11" x 17"</option>
              <option value="11.7x16.5">11.7" x 16.5"</option>
              <option value="12x16">12" x 16"</option>
              <option value="12x18">12" x 18"</option>
              <option value="16x20">16" x 20"</option>
              <option value="16x24">16" x 24"</option>
              <option value="16.5x23.4">16.5" x 23.4"</option>
              <option value="18x24">18" x 24"</option>
              <option value="20x30">20" x 30"</option>
              <option value="22x34">22" x 34"</option>
              <option value="23.4x33.1">23.4" x 33.1"</option>
              <option value="24x32">24" x 32"</option>
              <option value="24x36">24" x 36"</option>
              <option value="26x36">26" x 36"</option>
              <option value="28x40">28" x 40"</option>
              <option value="30x40">30" x 40"</option>
              <option value="40x50">40" x 50" (Default)</option>
              <option value="50x60">50" x 60"</option>
              <option value="60x80">60" x 80"</option>
              <option value="68x80">68" x 80"</option>
              <option value="88x104">88" x 104"</option>
            </select>
          </div>
        </div>

        {/* ════════════ SPOTIFY SPECIFIC ACCORDIONS ════════════ */}
        <div style={{ display: posterMode === 'spotify' ? 'block' : 'none' }}>
            <button className="accordion-btn" onClick={(e) => (window as any).toggleAccordion(e.currentTarget)}>🎵 Spotify Barcode<span className="arrow">▼</span></button>
            <div className="accordion-content">
              <div className="toggle-row">
                <label>Visible</label>
                <label className="toggle"><input type="checkbox" id="show-barcode" defaultChecked onChange={() => (window as any).updateBarcode()} /><span className="slider"></span></label>
              </div>
              <div className="form-row">
                <label>Spotify Link or URI</label>
                <input type="text" id="spotify-uri" placeholder="https://open.spotify.com/track/..." onInput={() => (window as any).handleSpotifyInput()} />
              </div>
              <p style={{ fontSize: '10px', color: '#666', marginTop: '4px' }}>Use "Share &gt; Copy Link" from the Spotify app</p>
              <div className="form-row" style={{ marginTop: '8px' }}><label>Height (px)</label>
                <div className="range-row"><input type="range" min="24" max="120" defaultValue="48" id="barcode-height" onInput={(e: any) => (window as any).updateBarcodeHeight(e.target.value)} /><span className="range-val" id="barcode-height-display">48px</span></div>
              </div>
              <div className="form-row">
                <label>Logo Color</label>
                <div className="color-row">
                  <input type="color" id="barcode-logo-color" defaultValue="#FFFFFF" onChange={() => (window as any).updateBarcodeStyle()} />
                  <input type="text" id="barcode-logo-color-txt" defaultValue="#FFFFFF" onInput={() => { (window as any).syncColor('barcode-logo-color', 'barcode-logo-color-txt'); (window as any).updateBarcodeStyle(); }} />
                </div>
              </div>
              <div className="form-row">
                <label>Wave Color</label>
                <div className="color-row">
                  <input type="color" id="barcode-bar-color" defaultValue="#FFFFFF" onChange={() => (window as any).updateBarcodeStyle()} />
                  <input type="text" id="barcode-bar-color-txt" defaultValue="#FFFFFF" onInput={() => { (window as any).syncColor('barcode-bar-color', 'barcode-bar-color-txt'); (window as any).updateBarcodeStyle(); }} />
                </div>
              </div>
            </div>

            <button className="accordion-btn" onClick={(e) => (window as any).toggleAccordion(e.currentTarget)}>🔤 Top Label<span className="arrow">▼</span></button>
            <div className="accordion-content">
              <div className="toggle-row">
                <label>Visible</label>
                <label className="toggle"><input type="checkbox" id="show-label-top" defaultChecked onChange={(e: any) => (window as any).edSetFabricProp('visible', e.target.checked)} /><span className="slider"></span></label>
              </div>
              <div className="form-row">
                <label>Text</label>
                <input type="text" id="label-top-input" defaultValue="Now Playing" onInput={(e: any) => (window as any).edSetFabricProp('text', e.target.value)} />
              </div>
              <div className="form-row">
                <label>Text Color</label>
                <div className="color-row">
                  <input type="color" id="c-s-tl" defaultValue="#FFFFFF" onInput={(e:any) => { (window as any).updateTextColor('label-top', e.target.value); (window as any).syncColor('c-s-tl', 'c-s-tl-t'); }} />
                  <input type="text" id="c-s-tl-t" defaultValue="#FFFFFF" onInput={(e:any) => { (window as any).syncColor('c-s-tl', 'c-s-tl-t'); (window as any).updateTextColor('label-top', document.getElementById('c-s-tl-t')!.value); }} />
                </div>
              </div>
            </div>

            <button className="accordion-btn" onClick={(e) => (window as any).toggleAccordion(e.currentTarget)}>🎵 Song Title & Artist<span className="arrow">▼</span></button>
            <div className="accordion-content">
              <div className="form-row">
                <label>Song Title Text</label>
                <input type="text" id="song-title-input" defaultValue="Song Title" onInput={(e: any) => (window as any).edSetFabricProp('text', e.target.value)} />
              </div>
              <div className="form-row">
                <label>Song Title Color</label>
                <div className="color-row">
                  <input type="color" id="c-s-st" defaultValue="#FFFFFF" onInput={(e:any) => { (window as any).updateTextColor('song-title', e.target.value); (window as any).syncColor('c-s-st', 'c-s-st-t'); }} />
                  <input type="text" id="c-s-st-t" defaultValue="#FFFFFF" onInput={(e:any) => { (window as any).syncColor('c-s-st', 'c-s-st-t'); (window as any).updateTextColor('song-title', document.getElementById('c-s-st-t')!.value); }} />
                </div>
              </div>
              <div className="form-row" style={{ marginTop: '12px' }}>
                <label>Artist Name Text</label>
                <input type="text" id="song-artist-input" defaultValue="Artist Name" onInput={(e: any) => (window as any).edSetFabricProp('text', e.target.value)} />
              </div>
              <div className="form-row">
                <label>Artist Name Color</label>
                <div className="color-row">
                  <input type="color" id="c-s-sa" defaultValue="#B3B3B3" onInput={(e:any) => { (window as any).updateTextColor('song-artist', e.target.value); (window as any).syncColor('c-s-sa', 'c-s-sa-t'); }} />
                  <input type="text" id="c-s-sa-t" defaultValue="#B3B3B3" onInput={(e:any) => { (window as any).syncColor('c-s-sa', 'c-s-sa-t'); (window as any).updateTextColor('song-artist', document.getElementById('c-s-sa-t')!.value); }} />
                </div>
              </div>
            </div>

            <button className="accordion-btn" onClick={(e) => (window as any).toggleAccordion(e.currentTarget)}>⏱️ Progress & Time<span className="arrow">▼</span></button>
            <div className="accordion-content">
              <div className="toggle-row">
                <label>Visible</label>
                <label className="toggle"><input type="checkbox" defaultChecked onChange={(e: any) => {
                  const trackObj = fabricCanvasRef.current?.getObjects().find((o: any) => o.id === 'progress-track');
                  const fillObj = fabricCanvasRef.current?.getObjects().find((o: any) => o.id === 'progress-fill');
                  const stObj = fabricCanvasRef.current?.getObjects().find((o: any) => o.id === 'time-start-el');
                  const etObj = fabricCanvasRef.current?.getObjects().find((o: any) => o.id === 'time-end-el');
                  [trackObj, fillObj, stObj, etObj].forEach(o => { if(o) o.set('visible', e.target.checked); });
                  fabricCanvasRef.current?.requestRenderAll();
                }} /><span className="slider"></span></label>
              </div>
              <div className="two-col">
                <div className="form-row"><label>Start Time</label><input type="text" id="time-start" defaultValue="1:12" onInput={() => (window as any).handleStartTimeChange()} /></div>
                <div className="form-row"><label>End Time</label><input type="text" id="time-end" defaultValue="3:45" onInput={() => (window as any).handleEndTimeChange()} /></div>
              </div>
              <div className="form-row"><label>Progress %</label>
                <div className="range-row"><input type="range" min="0" max="100" defaultValue="35" id="progress-val" onInput={(e: any) => (window as any).updateProgress(e.target.value)} /><span className="range-val" id="progress-display">35%</span></div>
              </div>
            </div>

            <button className="accordion-btn" onClick={(e) => (window as any).toggleAccordion(e.currentTarget)}>🖼️ Background & Cover<span className="arrow">▼</span></button>
            <div className="accordion-content">
              <div className="form-row">
                <label>Background Type</label>
                <select id="bg-type" defaultValue="blur" onChange={() => (window as any).updateBg()}>
                  <option value="blur">Blurred Cover Image</option>
                  <option value="color">Solid Color</option>
                </select>
              </div>
              <div id="bg-color-section" style={{ display: 'none' }}>
                <div className="form-row">
                  <label>Background Color</label>
                  <div className="color-row">
                    <input type="color" id="bg-color" defaultValue="#121212" onInput={() => (window as any).updateBgColor()} />
                    <input type="text" id="bg-color-txt" defaultValue="#121212" onInput={() => { (window as any).syncColor('bg-color', 'bg-color-txt'); (window as any).updateBgColor(); }} />
                  </div>
                </div>
              </div>
              <div id="bg-blur-section">
                <div className="form-row">
                  <label>Blur</label>
                  <div className="range-row">
                    <input type="range" min="0" max="40" defaultValue="10" id="blur-val" onInput={() => (window as any).updateBgBlur()} />
                    <span className="range-val" id="blur-display">10px</span>
                  </div>
                </div>
                <div className="form-row">
                  <label>Brightness</label>
                  <div className="range-row">
                    <input type="range" min="10" max="200" defaultValue="100" id="brightness-val" onInput={() => (window as any).updateBgBlur()} />
                    <span className="range-val" id="brightness-display">100%</span>
                  </div>
                </div>
              </div>
              <div className="form-row" style={{ marginTop: '12px' }}>
                <label>Background Overlay Opacity</label>
                <div className="range-row">
                  <input type="range" min="0" max="100" defaultValue="50" id="overlay-val" onInput={() => (window as any).updateOverlay()} />
                  <span className="range-val" id="overlay-display">50%</span>
                </div>
              </div>
              <div className="upload-area" onClick={() => document.getElementById('cover-upload')?.click()} style={{marginTop:'12px'}}>
                <input type="file" id="cover-upload" accept="image/*" onChange={(e: any) => (window as any).handleCoverUpload(e)} style={{ opacity: 0, position: 'absolute', inset: 0, cursor: 'pointer' }} />
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                <p>Click to upload image</p>
              </div>
            </div>

            <button className="accordion-btn" onClick={(e) => (window as any).toggleAccordion(e.currentTarget)}>📏 Layout Settings<span className="arrow">▼</span></button>
            <div className="accordion-content">
              <div className="form-row">
                <label>Content Vertical Position (%)</label>
                <div className="range-row">
                  <input type="range" min="20" max="80" defaultValue="50" id="content-y" onInput={() => (window as any).updateContentPosition()} />
                  <span className="range-val" id="content-y-display">50%</span>
                </div>
              </div>
            </div>
        </div>

        {/* ════════════ VINYL SPECIFIC ACCORDIONS ════════════ */}
        <div style={{ display: posterMode === 'vinyl' ? 'block' : 'none' }}>
            <button className="accordion-btn open" onClick={(e) => (window as any).toggleAccordion(e.currentTarget)}>🔤 Top & Bottom Texts<span className="arrow">▼</span></button>
            <div className="accordion-content open">
                <div className="form-row">
                    <label>Artist Name (Top Left) Text</label>
                    <input type="text" id="v-label-input" defaultValue="ARTIST NAME" onInput={(e: any) => (window as any).edSetFabricProp('text', e.target.value)} />
                </div>
                <div className="form-row">
                    <label>Artist Name (Top Left) Color</label>
                    <div className="color-row">
                        <input type="color" id="c-v-tl" defaultValue="#212121" onInput={(e:any)=>{ (window as any).updateTextColor('v-top-left', e.target.value); (window as any).syncColor('c-v-tl', 'c-v-tl-t'); }} />
                        <input type="text" id="c-v-tl-t" defaultValue="#212121" onInput={(e:any)=>{ (window as any).syncColor('c-v-tl', 'c-v-tl-t'); (window as any).updateTextColor('v-top-left', document.getElementById('c-v-tl-t')!.value); }} />
                    </div>
                </div>

                <div className="form-row" style={{ marginTop: '12px' }}>
                    <label>Year (Top Right) Text</label>
                    <input type="text" id="v-year-input" defaultValue="1992" onInput={(e: any) => (window as any).edSetFabricProp('text', e.target.value)} />
                </div>
                <div className="form-row">
                    <label>Year Color</label>
                    <div className="color-row">
                        <input type="color" id="c-v-tr" defaultValue="#212121" onInput={(e:any)=>{ (window as any).updateTextColor('v-top-right', e.target.value); (window as any).syncColor('c-v-tr', 'c-v-tr-t'); }} />
                        <input type="text" id="c-v-tr-t" defaultValue="#212121" onInput={(e:any)=>{ (window as any).syncColor('c-v-tr', 'c-v-tr-t'); (window as any).updateTextColor('v-top-right', document.getElementById('c-v-tr-t')!.value); }} />
                    </div>
                </div>

                <div className="form-row" style={{ marginTop: '12px' }}>
                    <label>Bottom Text (Album Name / Optional)</label>
                    <input type="text" id="v-bottom-input" defaultValue="UNKNOWN ALBUM" onInput={(e: any) => (window as any).edSetFabricProp('text', e.target.value)} />
                </div>
                <div className="form-row">
                    <label>Bottom Text Color</label>
                    <div className="color-row">
                        <input type="color" id="c-v-bot" defaultValue="#555555" onInput={(e:any)=>{ (window as any).updateTextColor('v-bottom', e.target.value); (window as any).syncColor('c-v-bot', 'c-v-bot-t'); }} />
                        <input type="text" id="c-v-bot-t" defaultValue="#555555" onInput={(e:any)=>{ (window as any).syncColor('c-v-bot', 'c-v-bot-t'); (window as any).updateTextColor('v-bottom', document.getElementById('c-v-bot-t')!.value); }} />
                    </div>
                </div>
            </div>

            <button className="accordion-btn open" onClick={(e) => (window as any).toggleAccordion(e.currentTarget)}>🎵 Song Details<span className="arrow">▼</span></button>
            <div className="accordion-content open">
                <div className="form-row">
                    <label>Song Title Text</label>
                    <input type="text" id="v-song-title-input" defaultValue="SONG NAME" onInput={(e: any) => (window as any).edSetFabricProp('text', e.target.value)} />
                </div>
                <div className="form-row">
                    <label>Song Title Color</label>
                    <div className="color-row">
                        <input type="color" id="c-v-st" defaultValue="#212121" onInput={(e:any)=>{ (window as any).updateTextColor('v-song-title', e.target.value); (window as any).syncColor('c-v-st', 'c-v-st-t'); }} />
                        <input type="text" id="c-v-st-t" defaultValue="#212121" onInput={(e:any)=>{ (window as any).syncColor('c-v-st', 'c-v-st-t'); (window as any).updateTextColor('v-song-title', document.getElementById('c-v-st-t')!.value); }} />
                    </div>
                </div>
            </div>

            <button className="accordion-btn open" onClick={(e) => (window as any).toggleAccordion(e.currentTarget)}>💿 Vinyl Record & Lyrics<span className="arrow">▼</span></button>
            <div className="accordion-content open">
                <div className="form-row">
                    <label>Spiral Text Size</label>
                    <div className="range-row">
                        <input type="range" id="vinyl-text-size" min="6" max="40" defaultValue="12" onInput={(e:any) => { e.target.nextElementSibling.textContent = e.target.value+'px'; (window as any).updateVinylSpiral(); }} />
                        <span className="range-val">12px</span>
                    </div>
                </div>
                <div className="form-row">
                    <label>Spiral Text Color</label>
                    <div className="color-row">
                        <input type="color" id="c-v-st" defaultValue="#212121" onInput={(e:any)=>{ (window as any).syncColor('c-v-st', 'c-v-st-t'); (window as any).updateVinylSpiral(); }} />
                        <input type="text" id="c-v-st-t" defaultValue="#212121" onInput={(e:any)=>{ (window as any).syncColor('c-v-st', 'c-v-st-t'); (window as any).updateVinylSpiral(); }} />
                    </div>
                </div>
                <div className="form-row">
                    <label>Center Label Color</label>
                    <div className="color-row">
                        <input type="color" id="c-v-lbl" defaultValue="#e0e0e0" onInput={() => (window as any).updateVinylSpiral()} />
                    </div>
                </div>
                <div className="form-row">
                    <label>Lyrics / Text Content</label>
                    <textarea id="vinyl-lyrics-input" defaultValue="LOREM IPSUM DOLOR SIT AMET CONSECTETUR ADIPISCING ELIT SED DO EIUSMOD TEMPOR INCIDIDUNT UT LABORE ET DOLORE MAGNA ALIQUA" onInput={() => (window as any).updateVinylSpiral()}></textarea>
                    <p style={{fontSize:'10px', color:'#777', marginTop:'4px'}}>Arama yaptığınızda sözler otomatik olarak çekilmeye çalışılır. Çekilemezse buraya manuel yapıştırabilirsiniz.</p>
                </div>
            </div>

            <button className="accordion-btn" onClick={(e) => (window as any).toggleAccordion(e.currentTarget)}>🖼️ Main Background (Current View)<span className="arrow">▼</span></button>
            <div className="accordion-content">
                <div className="form-row">
                  <label>Background Type</label>
                  <select id="v-bg-type" defaultValue="color" onChange={() => (window as any).updateVinylBg()}>
                    <option value="color">Solid Color</option>
                    <option value="blur">Blurred Image</option>
                  </select>
                </div>
                
                <div id="v-bg-color-section">
                    <div className="form-row">
                      <label>Background Color</label>
                      <div className="color-row">
                        <input type="color" id="v-bg-color" defaultValue="#f5f5f5" onInput={() => (window as any).updateBgColor()} />
                        <input type="text" id="v-bg-color-txt" defaultValue="#f5f5f5" onInput={() => { (window as any).syncColor('v-bg-color', 'v-bg-color-txt'); (window as any).updateBgColor(); }} />
                      </div>
                    </div>
                </div>
                
                <div id="v-bg-blur-section" style={{ display: 'none' }}>
                    <div className="form-row">
                      <label>Blur</label>
                      <div className="range-row">
                        <input type="range" min="0" max="40" defaultValue="10" id="v-blur-val" onInput={() => (window as any).updateVinylBgBlur()} />
                        <span className="range-val" id="v-blur-display">10px</span>
                      </div>
                    </div>
                    <div className="upload-area" onClick={() => document.getElementById('v-cover-upload')?.click()} style={{marginTop:'12px'}}>
                      <input type="file" id="v-cover-upload" accept="image/*" onChange={(e: any) => (window as any).handleVinylCoverUpload(e)} style={{ opacity: 0, position: 'absolute', inset: 0, cursor: 'pointer' }} />
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                      <p>Click to upload image</p>
                    </div>
                </div>
            </div>

            {/* MULTI-COLOR EXPORT SECTION */}
            <button className="accordion-btn open" onClick={(e) => (window as any).toggleAccordion(e.currentTarget)}>🎨 Multi-Color Export (Toplu Çıktı)<span className="arrow">▼</span></button>
            <div className="accordion-content open">
                <p style={{fontSize:'10px', color:'#777', marginBottom:'10px'}}>Seçili renkler indirme butonuna bastığınızda otomatik olarak sırayla arka plan yapılıp ZIP olarak kaydedilir.</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {vinylColors.map((col, i) => (
                    <div className="pf-color-row multi-export-item" key={i}>
                        <input type="checkbox" defaultChecked className="export-color-check" style={{cursor: 'pointer'}} />
                        <input type="color" defaultValue={col} className="export-color-picker" onInput={(e:any) => e.target.nextElementSibling.value = e.target.value} style={{width:'26px', height:'26px', border:'none', padding:'0', background:'transparent', cursor:'pointer'}}/>
                        <input type="text" defaultValue={col} style={{fontSize:'10px', padding:'4px'}} onInput={(e:any) => { let v=e.target.value; if(/^#[0-9a-fA-F]{3}$/i.test(v)){v='#'+v[1]+v[1]+v[2]+v[2]+v[3]+v[3];} if(/^#[0-9a-fA-F]{6}$/i.test(v)){e.target.previousElementSibling.value=v;} }} />
                    </div>
                    ))}
                </div>
            </div>
        </div>

        {/* COMMON: DOWNLOAD */}
        <button className="accordion-btn open" onClick={(e) => (window as any).toggleAccordion(e.currentTarget)}>⬇️ Download<span className="arrow">▼</span></button>
        <div className="accordion-content open">
          <div className="btn-download-group">
            <button className="btn btn-secondary" onClick={() => (window as any).downloadPNG()}>PNG</button>
            <button className="btn btn-secondary" onClick={() => (window as any).downloadPDF()}>PDF</button>
            <button className="btn btn-secondary" onClick={() => (window as any).downloadSVG()}>SVG</button>
          </div>
        </div>
      </div>

      <div id="canvas-area">
        <div id="ed-align-bar">
          <button className="ed-ab-btn" title="Align Left" onClick={() => (window as any).edAlign('left')}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="3" x2="3" y2="21" strokeWidth="2.5"/><rect x="5" y="8" width="8" height="3" rx="1"/><rect x="5" y="13" width="13" height="3" rx="1"/></svg></button>
          <button className="ed-ab-btn" title="Center X" onClick={() => (window as any).edAlign('cx')}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="3" x2="12" y2="21" strokeWidth="2.5"/><rect x="6" y="8" width="12" height="3" rx="1"/><rect x="4" y="13" width="16" height="3" rx="1"/></svg></button>
          <button className="ed-ab-btn" title="Align Right" onClick={() => (window as any).edAlign('right')}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="21" y1="3" x2="21" y2="21" strokeWidth="2.5"/><rect x="11" y="8" width="8" height="3" rx="1"/><rect x="6" y="13" width="13" height="3" rx="1"/></svg></button>
          <div className="ed-ab-sep"></div>
          <button className="ed-ab-btn" title="Align Top" onClick={() => (window as any).edAlign('top')}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="3" x2="21" y2="3" strokeWidth="2.5"/><rect x="8" y="5" width="3" height="8" rx="1"/><rect x="13" y="5" width="3" height="13" rx="1"/></svg></button>
          <button className="ed-ab-btn" title="Center Y" onClick={() => (window as any).edAlign('cy')}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12" strokeWidth="2.5"/><rect x="8" y="4" width="3" height="16" rx="1"/><rect x="13" y="6" width="3" height="12" rx="1"/></svg></button>
          <button className="ed-ab-btn" title="Align Bottom" onClick={() => (window as any).edAlign('bottom')}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="21" x2="21" y2="21" strokeWidth="2.5"/><rect x="8" y="11" width="3" height="8" rx="1"/><rect x="13" y="6" width="3" height="13" rx="1"/></svg></button>
          <div className="ed-ab-sep"></div>
          <button className="ed-ab-btn" title="Distribute H" onClick={() => (window as any).edDistribute('h')}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="3" x2="3" y2="21"/><line x1="21" y1="3" x2="21" y2="21"/><rect x="9" y="8" width="6" height="8" rx="1"/></svg></button>
          <button className="ed-ab-btn" title="Distribute V" onClick={() => (window as any).edDistribute('v')}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="3" x2="21" y2="3"/><line x1="3" y1="21" x2="21" y2="21"/><rect x="8" y="9" width="8" height="6" rx="1"/></svg></button>
        </div>
        
        <div id="poster-wrapper">
          <div id="poster-container" style={{ width: `${dimensions.width}px`, height: `${dimensions.height}px` }}>
            <canvas ref={canvasElRef} id="canvas-el"></canvas>
          </div>
        </div>
      </div>

      <div id="props-panel">
        <div id="props-header">
          Properties
          <span id="props-selected-name"></span>
        </div>
        <div id="props-body">
          <div id="props-empty-state">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="1.5">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
            </svg>
            <p>Click an element<br/>on the canvas</p>
          </div>
          <div id="props-fields" style={{ display: 'none' }}></div>
        </div>
      </div>

      <div id="toast">✓ İşlem tamamlandı</div>
    </div>
  );
}
