import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export default function VinylPosterBuilder() {
  const isInitialized = useRef(false);
  const navigate = useNavigate();

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

    const initApp = async () => {
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/fabric.js/5.3.1/fabric.min.js');
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js');

      const w = window as any;
      w.POSTER_MODE = 'vinyl';

      w.toggleAccordion = function(btn: HTMLElement) {
        btn.classList.toggle('open');
        const content = btn.nextElementSibling as HTMLElement;
        if (content) content.classList.toggle('open');
      };

      w.CANVAS_SIZES = {
        '5.83x8.27': [5.83, 8.27], '8.27x11.69':[8.27, 11.69], '11.69x16.54': [11.69, 16.54],
        '16.54x23.39': [16.54, 23.39], '23.39x33.11': [23.39, 33.11], '5x7': [5,7], '6x8': [6,8],
        '8x10': [8,10], '9x11': [9,11], '11x14': [11,14], '11x17': [11,17], '11.7x16.5': [11.7,16.5],
        '12x16': [12,16], '12x18':[12,18], '16x20': [16,20], '16x24': [16,24], '16.5x23.4':[16.5,23.4],
        '18x24': [18,24], '20x30': [20,30], '22x34':[22,34], '23.4x33.1':[23.4,33.1], '24x32': [24,32],
        '24x36': [24,36], '26x36': [26,36], '28x40': [28,40], '30x40':[30,40], '40x50': [40, 50],
        '50x60': [50,60], '60x80': [60,80], '68x80': [68,80], '88x104': [88,104]
      };

      // ──────────────────────────────────────────────────────────
      // FABRIC.JS ENGINE INITIALIZATION
      // ──────────────────────────────────────────────────────────
      w.canvas = new w.fabric.Canvas('poster-canvas', { preserveObjectStacking: true });
      w.fabric.Object.prototype.set({ transparentCorners: false, cornerColor: '#6366f1', borderColor: '#6366f1', cornerSize: 12, padding: 0, cornerStyle: 'circle' });

      w.getInternalSize = function(key: string) {
          const [wIn, hIn] = w.CANVAS_SIZES[key];
          return { w: wIn * 150, h: hIn * 150 }; // 150 DPI internal editing resolution for performance
      };

      w.updateCanvasSize = function() {
        const selectEl = document.getElementById('canvas-size') as HTMLSelectElement;
        if(!selectEl) return;
        const key = selectEl.value;
        const target = w.getInternalSize(key);
        
        const oldW = w.canvas.getWidth() || target.w;
        const oldH = w.canvas.getHeight() || target.h;
        
        w.canvas.setWidth(target.w);
        w.canvas.setHeight(target.h);
        
        const scaleX = target.w / oldW;
        const scaleY = target.h / oldH;
        
        w.canvas.getObjects().forEach((obj: any) => {
            obj.set({ left: obj.left * scaleX, top: obj.top * scaleY, scaleX: obj.scaleX * scaleX, scaleY: obj.scaleY * scaleY });
            obj.setCoords();
        });

        const area = document.getElementById('canvas-area');
        if(!area) return;
        const areaW = area.clientWidth - 80;
        const areaH = area.clientHeight - 80;
        const ratio = target.w / target.h;

        let pw, ph;
        if (areaW / ratio <= areaH) { pw = areaW; ph = areaW / ratio; } else { ph = areaH; pw = areaH * ratio; }

        w.canvas.setZoom(pw / target.w);
        const container = document.querySelector('.canvas-container') as HTMLElement;
        if(container) { container.style.width = Math.floor(pw) + 'px'; container.style.height = Math.floor(ph) + 'px'; }
        w.canvas.requestRenderAll();
      };

      window.addEventListener('resize', () => w.updateCanvasSize());

      w.updateFabricObjectById = function(id: string, prop: string, val: any) {
          const obj = w.canvas.getObjects().find((o: any) => o.id === id);
          if(obj) { obj.set(prop, val); w.canvas.requestRenderAll(); }
      };

      w.initFabricObjects = function() {
          w.canvas.clear();
          const W = w.canvas.getWidth();
          const H = w.canvas.getHeight();
          
          let tl = new w.fabric.IText('ARTIST NAME', { id: 'v-top-left', left: W*0.08, top: H*0.08, fontFamily: 'DM Sans', fontSize: W*0.035, fontWeight: 700, fill: '#212121' });
          let tr = new w.fabric.IText('1992', { id: 'v-top-right', left: W*0.92, top: H*0.08, fontFamily: 'DM Sans', fontSize: W*0.035, fontWeight: 700, fill: '#212121', originX: 'right' });
          let title = new w.fabric.IText('SONG NAME', { id: 'v-song-title', left: W/2, top: H*0.13, fontFamily: 'Josefin Sans', fontSize: W*0.08, fontWeight: 800, fill: '#212121', originX: 'center' });
          let bot = new w.fabric.IText('UNKNOWN ALBUM', { id: 'v-bottom', left: W/2, top: H*0.92, fontFamily: 'DM Sans', fontSize: W*0.025, fontWeight: 600, fill: '#555555', originX: 'center' });
          
          w.canvas.add(tl, tr, title, bot);
          w.canvas.setBackgroundColor('#f5f5f5', w.canvas.renderAll.bind(w.canvas));
          w.updateVinylSpiral();
      };

      // ──────────────────────────────────────────────────────────
      // VINYL SPECIFIC LOGIC (SVG TO FABRIC NATIVE)
      // ──────────────────────────────────────────────────────────
      w.updateVinylSpiral = function() {
          const W = w.canvas.getWidth();
          const H = w.canvas.getHeight();
          
          const fs = parseInt((document.getElementById('vinyl-text-size') as HTMLInputElement)?.value || "12");
          const input = (document.getElementById('vinyl-lyrics-input') as HTMLTextAreaElement)?.value || "LOREM IPSUM DOLOR SIT AMET...";
          const tcol = (document.getElementById('c-v-st') as HTMLInputElement)?.value || '#212121';
          const lcol = (document.getElementById('c-v-tl') as HTMLInputElement)?.value || '#e0e0e0';
          const ff = (document.getElementById('v-spiral-font') as HTMLSelectElement)?.value || "'DM Sans', sans-serif";
          
          const textLen = input.length * (fs * 0.6); 
          const minR = 70; // İstediğin varsayılan içeriden başlama yarıçapı
          const spacing = fs * 1.2;
          
          const standardLoops = (380 - minR) / spacing;
          const standardLen = Math.PI * spacing * standardLoops * standardLoops + 2 * Math.PI * minR * standardLoops;
          
          let loops = standardLoops;
          let maxR = 380;
          
          if (textLen > standardLen) {
              const a = Math.PI * spacing; const b = 2 * Math.PI * minR; const c = -textLen;
              loops = (-b + Math.sqrt(b*b - 4*a*c)) / (2*a); maxR = minR + loops * spacing;
          }
          
          let svgSize = 800; let cx = 400; let cy = 400;
          if (maxR > 380) { svgSize = (maxR + 30) * 2; cx = svgSize / 2; cy = svgSize / 2; }
          
          let points = []; let steps = Math.ceil(loops * 100);
          for(let i=0; i<=steps; i++) {
              let t = -Math.PI/2 + (i/steps) * loops * Math.PI * 2;
              let r = minR + ((maxR - minR) * (i/steps));
              let x = cx + r * Math.cos(t); let y = cy + r * Math.sin(t);
              if(i===0) points.push(`M ${x} ${y}`); else points.push(`L ${x} ${y}`);
          }
          const pathD = points.join(' ');
          
          let finalStr = input.trim();
          if (textLen < standardLen) {
              let repeats = Math.ceil(standardLen / (textLen + 20));
              let arr = []; for(let k=0; k<repeats; k++) arr.push(finalStr);
              finalStr = arr.join(' • ');
          }
          finalStr = finalStr.toUpperCase().replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
          
          // SVG YAPISI (Varsayılan 50 Göbek, 60-64 Çizgiler)
          const svgString = `<?xml version="1.0" encoding="UTF-8"?>
          <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${svgSize} ${svgSize}" width="${svgSize}" height="${svgSize}">
              <defs><path id="v-spiral-path" d="${pathD}" fill="none" /></defs>
              <circle cx="${cx}" cy="${cy}" r="${maxR + 15}" fill="none" />
              <circle cx="${cx}" cy="${cy}" r="60" fill="none" stroke="#2a2a2a" stroke-width="1" />
              <circle cx="${cx}" cy="${cy}" r="64" fill="none" stroke="#2a2a2a" stroke-width="1" />
              <text fill="${tcol}" font-size="${fs}" letter-spacing="2" font-family="${ff}" font-weight="700" text-anchor="start">
                  <textPath xlink:href="#v-spiral-path" startOffset="0%">${finalStr}</textPath>
              </text>
              <circle cx="${cx}" cy="${cy}" r="50" fill="${lcol}" />
              <circle cx="${cx}" cy="${cy}" r="6" fill="#111111" />
          </svg>`;
          
          w.fabric.loadSVGFromString(svgString, function(objects: any, options: any) {
              const vinylGroup = w.fabric.util.groupSVGElements(objects, options);
              vinylGroup.set({ id: 'v-vinyl', originX: 'center', originY: 'center' });
              
              let existing = w.canvas.getObjects().find((o:any) => o.id === 'v-vinyl');
              if (existing) {
                  vinylGroup.set({ left: existing.left, top: existing.top, scaleX: existing.scaleX, scaleY: existing.scaleY });
                  w.canvas.remove(existing);
              } else {
                  vinylGroup.set({ left: W / 2, top: H * 0.55 });
                  vinylGroup.scaleToWidth(W * 0.85); 
              }
              w.canvas.add(vinylGroup);
              vinylGroup.sendToBack(); 
              w.canvas.requestRenderAll();
          });
      };

      // ──────────────────────────────────────────────────────────
      // BACKGROUND LOGIC
      // ──────────────────────────────────────────────────────────
      w.vCurrentCoverSrc = ''; 
      w.updateVinylBgBlur = function() {
        const blurEl = document.getElementById('v-blur-val') as HTMLInputElement;
        if (!blurEl || !w.vCurrentCoverSrc) return;
        const blur = blurEl.value;
        const brightness = "100";
        document.getElementById('v-blur-display')!.textContent = blur + 'px';
        
        w.fabric.Image.fromURL(w.vCurrentCoverSrc, (img: any) => {
            const blurFilter = new w.fabric.Image.filters.Blur({ blur: parseFloat(blur) / 10 });
            const brightFilter = new w.fabric.Image.filters.Brightness({ brightness: 0 }); 
            img.filters.push(blurFilter, brightFilter);
            img.applyFilters();
            
            const canvasRatio = w.canvas.getWidth() / w.canvas.getHeight();
            const imgRatio = img.width / img.height;
            let scale = (canvasRatio > imgRatio) ? w.canvas.getWidth() / img.width : w.canvas.getHeight() / img.height;
            
            img.set({ originX: 'center', originY: 'center', left: w.canvas.getWidth()/2, top: w.canvas.getHeight()/2, scaleX: scale, scaleY: scale });
            w.canvas.setBackgroundImage(img, w.canvas.renderAll.bind(w.canvas));
        }, { crossOrigin: 'Anonymous' });
      };

      w.applyAutoContrast = function(bgHex: string) {
        let hex = bgHex.replace('#', '');
        if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
        const r = parseInt(hex.substr(0,2), 16) || 255;
        const g = parseInt(hex.substr(2,2), 16) || 255;
        const b = parseInt(hex.substr(4,2), 16) || 255;
        const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
        const isDark = yiq < 128;

        const mainTextCol = isDark ? '#ffffff' : '#212121';
        const subTextCol  = isDark ? '#cccccc' : '#555555';

        const setInp = (id: string, col: string) => { 
          const el = document.getElementById(id) as HTMLInputElement; if(el) el.value = col; 
          const txt = document.getElementById(id+'-t') as HTMLInputElement; if(txt) txt.value = col;
        };
        
        setInp('c-v-tl', mainTextCol); w.updateFabricObjectById('v-top-left', 'fill', mainTextCol);
        setInp('c-v-tr', mainTextCol); w.updateFabricObjectById('v-top-right', 'fill', mainTextCol);
        setInp('c-v-st', mainTextCol); w.updateFabricObjectById('v-song-title', 'fill', mainTextCol);
        setInp('c-v-bot', subTextCol); w.updateFabricObjectById('v-bottom', 'fill', subTextCol);
        
        w.updateVinylSpiral();
      };

      w.updateVinylBgColor = function() {
        const colorEl = document.getElementById('v-bg-color') as HTMLInputElement;
        const txtEl = document.getElementById('v-bg-color-txt') as HTMLInputElement;
        if(!colorEl) return;
        const color = colorEl.value;
        w.canvas.setBackgroundImage(null, w.canvas.renderAll.bind(w.canvas));
        w.canvas.setBackgroundColor(color, w.canvas.renderAll.bind(w.canvas));
        if(txtEl) txtEl.value = color;
        w.applyAutoContrast(color);
      };

      w.updateVinylBg = function() {
        const type = (document.getElementById('v-bg-type') as HTMLSelectElement).value;
        const bgColorSection = document.getElementById('v-bg-color-section');
        const bgBlurSection = document.getElementById('v-bg-blur-section');

        if (type === 'color') {
          if(bgColorSection) bgColorSection.style.display = 'block';
          if(bgBlurSection) bgBlurSection.style.display = 'none';
          w.updateVinylBgColor();
        } else {
          if(bgColorSection) bgColorSection.style.display = 'none';
          if(bgBlurSection) bgBlurSection.style.display = 'block';
          w.applyAutoContrast('#121212');
          w.updateVinylBgBlur();
        }
      };

      w.handleVinylCoverUpload = function(event: any) {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e: any) => {
            w.vCurrentCoverSrc = e.target.result;
            const btype = document.getElementById('v-bg-type') as HTMLSelectElement;
            if (btype && btype.value === 'blur') w.updateVinylBgBlur();
        };
        reader.readAsDataURL(file);
      };

      w.syncColor = function(colorId: string, textId: string) {
        const txtEl = document.getElementById(textId) as HTMLInputElement;
        const colEl = document.getElementById(colorId) as HTMLInputElement;
        if(!txtEl || !colEl) return;
        let txt = txtEl.value.trim();
        if (/^#[0-9A-Fa-f]{3}$/.test(txt)) txt = '#' + txt[1]+txt[1] + txt[2]+txt[2] + txt[3]+txt[3];
        if (/^#[0-9A-Fa-f]{6}$/.test(txt)) {
          colEl.value = txt;
          colEl.dispatchEvent(new Event('input', { bubbles: true }));
          colEl.dispatchEvent(new Event('change', { bubbles: true }));
        }
      };

      w.showToast = function(msg: string) {
        const toast = document.getElementById('toast');
        if(!toast) return;
        toast.textContent = msg;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3500);
      };

      // ──────────────────────────────────────────────────────────
      // ITUNES SEARCH
      // ──────────────────────────────────────────────────────────
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

          if (!data.results || data.results.length === 0) { w.showToast('Sonuç bulunamadı'); return; }

          if(results) {
              results.innerHTML = '';
              data.results.forEach((item: any) => {
                const div = document.createElement('div');
                div.className = 'search-result-item';
                div.innerHTML = `<img src="${item.artworkUrl100}" alt=""><div class="result-info"><p>${item.trackName}</p><span>${item.artistName}</span></div>`;
                div.onclick = () => { w.applySearchResult(item); results.style.display = 'none'; };
                results.appendChild(div);
              });
              results.style.display = 'block';
          }
        } catch(e: any) {
          if(spinner) spinner.style.display = 'none';
          w.showToast('Arama hatası: ' + e.message);
        }
      };

      w.fetchLyrics = async function(artist: string, title: string) {
          try {
              let a = encodeURIComponent(artist.split(',')[0].trim());
              let t = encodeURIComponent(title.replace(/\(.*\)/g, '').trim());
              let res = await fetch(`https://api.lyrics.ovh/v1/${a}/${t}`);
              if (res.ok) { let data = await res.json(); if (data.lyrics) return data.lyrics.replace(/\n/g, ' • ').replace(/\r/g, '').toUpperCase(); }
          } catch(e) {}
          return null;
      };

      w.applySearchResult = async function(item: any) {
        w.updateFabricObjectById('v-song-title', 'text', item.trackName.toUpperCase());
        (document.getElementById('v-song-title-input') as HTMLInputElement).value = item.trackName.toUpperCase();
        
        const year = new Date(item.releaseDate).getFullYear() || "1992";
        w.updateFabricObjectById('v-top-right', 'text', year.toString());
        (document.getElementById('v-year-input') as HTMLInputElement).value = year.toString();

        const album = item.collectionName ? item.collectionName.toUpperCase() : "UNKNOWN ALBUM";
        w.updateFabricObjectById('v-bottom', 'text', album);
        (document.getElementById('v-bottom-input') as HTMLInputElement).value = album;

        let artistLabel = item.artistName || 'ARTIST NAME';
        w.updateFabricObjectById('v-top-left', 'text', artistLabel.toUpperCase());
        (document.getElementById('v-label-input') as HTMLInputElement).value = artistLabel.toUpperCase();

        w.showToast('Sözler aranıyor...');
        let lyrics = await w.fetchLyrics(item.artistName, item.trackName);
        
        const linp = document.getElementById('vinyl-lyrics-input') as HTMLTextAreaElement;
        if(lyrics) {
            if(linp) linp.value = lyrics;
            w.showToast('✓ Sözler ve şarkı yüklendi');
        } else {
            if(linp) linp.value = "LOREM IPSUM DOLOR SIT AMET CONSECTETUR ADIPISCING ELIT SED DO EIUSMOD TEMPOR INCIDIDUNT UT LABORE ET DOLORE MAGNA ALIQUA";
            w.showToast('Sözler bulunamadı, varsayılan eklendi');
        }
        w.updateVinylSpiral();
      };

      // ──────────────────────────────────────────────────────────
      // PROPERTIES PANEL & EXPORT
      // ──────────────────────────────────────────────────────────
      w.updateActiveObject = function(prop: string, val: any) {
          let obj = w.canvas.getActiveObject();
          if(!obj) return;
          if (prop === 'fontSize') { obj.set('fontSize', parseFloat(val)); obj.set('scaleX', 1); obj.set('scaleY', 1); } 
          else { obj.set(prop, val); }
          w.canvas.requestRenderAll();
      };

      w.updatePropsPanel = function() {
        const obj = w.canvas.getActiveObject();
        const empty  = document.getElementById('props-empty-state'); 
        const fields = document.getElementById('props-fields'); 
        const nameEl = document.getElementById('props-selected-name');
        
        if (!obj) { if(empty) empty.style.display = 'block'; if(fields) fields.style.display = 'none'; if(nameEl) nameEl.textContent = ''; return; }
        if(empty) empty.style.display = 'none'; if(fields) fields.style.display = 'block';
        if(nameEl) nameEl.textContent = obj.id || 'Element';

        const fs = Math.round((obj.fontSize || 14) * (obj.scaleX || 1));
        const col = obj.fill || '#000000';
        const ff = obj.fontFamily ? obj.fontFamily.replace(/"/g, "'") : "'DM Sans', sans-serif";
        
        const fontOpts = `<option value="'DM Sans', sans-serif">DM Sans</option><option value="'Inter', sans-serif">Inter</option><option value="'Montserrat', sans-serif">Montserrat</option><option value="'Oswald', sans-serif">Oswald</option><option value="'Poppins', sans-serif">Poppins</option><option value="'Playfair Display', serif">Playfair Display</option><option value="'Anton', sans-serif">Anton</option><option value="'Bebas Neue', sans-serif">Bebas Neue</option><option value="'Lora', serif">Lora</option><option value="'Merriweather', serif">Merriweather</option>`;
        
        let html = '';
        if (obj.type === 'i-text' || obj.type === 'text') {
            html += `<div class="pf-section"><div class="pf-section-title">Text Style</div>
            <div class="pf-row"><label>Font Family</label><select onchange="window.updateActiveObject('fontFamily', this.value)"><option value="${ff}" selected>Current Font</option>${fontOpts}</select></div>
            <div class="pf-row"><label>Font Size</label><input type="number" value="${fs}" oninput="window.updateActiveObject('fontSize', this.value)"></div>
            <div class="pf-row"><label>Color</label><input type="color" value="${col}" oninput="window.updateActiveObject('fill', this.value)" style="width:100%; height:30px; border:none; background:transparent; cursor:pointer;" /></div>
            </div>`;
        }
        fields!.innerHTML = html;
      };

      w.canvas.on('selection:created', w.updatePropsPanel);
      w.canvas.on('selection:updated', w.updatePropsPanel);
      w.canvas.on('selection:cleared', w.updatePropsPanel);

      w.getExportFilename = function(ext: string) {
        let artist = ((document.getElementById('v-label-input') as HTMLInputElement)?.value || 'artist').replace(/[^a-z0-9]/gi, '-').toLowerCase();
        let song = ((document.getElementById('v-song-title-input') as HTMLInputElement)?.value || 'song').replace(/[^a-z0-9]/gi, '-').toLowerCase();
        const size = (document.getElementById('canvas-size') as HTMLSelectElement).value;
        const now = new Date(); const date = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
        const hour = String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0');
        return `vinyl-${artist}-${song}-${size}-${date}-${hour}.${ext}`;
      };

      w.exportVinylLoop = async function(format: string) {
          w.canvas.discardActiveObject(); w.canvas.requestRenderAll();
          const items = document.querySelectorAll('.multi-export-item');
          const colorsToExport: string[] = [];
          items.forEach((item: any) => {
              const chk = item.querySelector('.export-color-check') as HTMLInputElement;
              const pck = item.querySelector('.export-color-picker') as HTMLInputElement;
              if (chk && chk.checked && pck) colorsToExport.push(pck.value);
          });

          if (colorsToExport.length === 0) { w.showToast('Lütfen dışa aktarmak için en az bir renk seçin.'); return; }

          const originalBgColor = w.canvas.backgroundColor;
          const originalBgImage = w.canvas.backgroundImage;
          
          w.showToast(`${colorsToExport.length} renk için ZIP hazırlanıyor... Lütfen bekleyin.`);

          const key = (document.getElementById('canvas-size') as HTMLSelectElement).value;
          const target = w.getInternalSize(key);
          const multiplier = (target.w * 2) / w.canvas.getWidth(); // Yüksek çözünürlük için

          const zip = new (window as any).JSZip(); const folder = zip.folder(`vinyl-posters-${format}`);

          for (let i = 0; i < colorsToExport.length; i++) {
              const color = colorsToExport[i];
              w.canvas.setBackgroundImage(null, w.canvas.renderAll.bind(w.canvas));
              w.canvas.setBackgroundColor(color, w.canvas.renderAll.bind(w.canvas));
              w.applyAutoContrast(color);
              await new Promise(r => setTimeout(r, 200));

              try {
                  let baseFilename = w.getExportFilename(format);
                  let filename = baseFilename.replace(`.${format}`, `-${color.replace('#', '')}.${format}`);

                  if (format === 'png') {
                      const dataUrl = w.canvas.toDataURL({ format: 'png', multiplier: multiplier });
                      folder.file(filename, dataUrl.split(',')[1], {base64: true});
                  } else if (format === 'pdf') {
                      const { jsPDF } = w.jspdf;
                      const pdf = new jsPDF({ orientation: target.w > target.h ? 'landscape' : 'portrait', unit: 'px', format: [target.w, target.h] });
                      const imgData = w.canvas.toDataURL({ format: 'jpeg', quality: 1.0, multiplier: multiplier });
                      pdf.addImage(imgData, 'JPEG', 0, 0, target.w, target.h);
                      folder.file(filename, pdf.output('arraybuffer'));
                  } else if (format === 'svg') {
                      const svgData = w.canvas.toSVG({ width: target.w, height: target.h });
                      folder.file(filename, svgData);
                  }
              } catch(e) {}
          }

          zip.generateAsync({type:"blob"}).then(function(content: Blob) {
              const url = URL.createObjectURL(content); const link = document.createElement('a');
              link.download = `Vinyl-Posters-${new Date().getTime()}.zip`; link.href = url; link.click(); URL.revokeObjectURL(url);
              w.showToast(`✓ ZIP dosyası indirildi!`);
          });

          const currentType = (document.getElementById('v-bg-type') as HTMLSelectElement)?.value || 'color';
          if (currentType === 'color') {
              w.canvas.setBackgroundColor(originalBgColor, w.canvas.renderAll.bind(w.canvas));
              w.applyAutoContrast(originalBgColor);
          } else {
              w.canvas.setBackgroundImage(originalBgImage, w.canvas.renderAll.bind(w.canvas));
              w.applyAutoContrast('#121212');
          }
      };

      w.downloadPNG = async function() { await w.exportVinylLoop('png'); };
      w.downloadPDF = async function() { await w.exportVinylLoop('pdf'); };
      w.downloadSVG = async function() { await w.exportVinylLoop('svg'); };

      // Initialize
      setTimeout(() => { 
        w.updateCanvasSize(); 
        w.initFabricObjects(); 
        const vbg = document.getElementById('v-bg-color') as HTMLInputElement;
        const vbgtxt = document.getElementById('v-bg-color-txt') as HTMLInputElement;
        if (vbg) vbg.value = "#f5f5f5";
        if (vbgtxt) vbgtxt.value = "#f5f5f5";
      }, 300);

    };

    initApp();
    return () => {};
  },[]);

  const fontOpts = `<option value="'Abril Fatface', serif">Abril Fatface</option><option value="'Alfa Slab One', serif">Alfa Slab One</option><option value="'Anton', sans-serif">Anton</option><option value="'Bangers', cursive">Bangers</option><option value="'Bebas Neue', sans-serif">Bebas Neue</option><option value="'Caveat', cursive">Caveat</option><option value="'Cinzel', serif">Cinzel</option><option value="'Cormorant Garamond', serif">Cormorant Garamond</option><option value="'Courgette', cursive">Courgette</option><option value="'DM Sans', sans-serif">DM Sans</option><option value="'Dancing Script', cursive">Dancing Script</option><option value="'EB Garamond', serif">EB Garamond</option><option value="'Fjalla One', sans-serif">Fjalla One</option><option value="'Great Vibes', cursive">Great Vibes</option><option value="'Inter', sans-serif">Inter</option><option value="'Josefin Sans', sans-serif">Josefin Sans</option><option value="'Kanit', sans-serif">Kanit</option><option value="'Lato', sans-serif">Lato</option><option value="'Libre Baskerville', serif">Libre Baskerville</option><option value="'Lobster', cursive">Lobster</option><option value="'Lora', serif">Lora</option><option value="'Merriweather', serif">Merriweather</option><option value="'Montserrat', sans-serif">Montserrat</option><option value="'Open Sans', sans-serif">Open Sans</option><option value="'Oswald', sans-serif">Oswald</option><option value="'PT Serif', serif">PT Serif</option><option value="'Pacifico', cursive">Pacifico</option><option value="'Patua One', serif">Patua One</option><option value="'Permanent Marker', cursive">Permanent Marker</option><option value="'Playfair Display', serif">Playfair Display</option><option value="'Poppins', sans-serif">Poppins</option><option value="'Prata', serif">Prata</option><option value="'Raleway', sans-serif">Raleway</option><option value="'Righteous', cursive">Righteous</option><option value="'Roboto', sans-serif">Roboto</option><option value="'Sacramento', cursive">Sacramento</option><option value="'Satisfy', cursive">Satisfy</option><option value="'Teko', sans-serif">Teko</option><option value="'Ubuntu', sans-serif">Ubuntu</option><option value="'Yellowtail', cursive">Yellowtail</option>`;
  const vinylColors = [ '#f5f5f5', '#212121', '#d95c50', '#698f62', '#5c7c8c', '#e8ba4f', '#8b688f', '#d982ab', '#e07a3e', '#7e9b81', '#d6c5a5', '#c96567', '#4c6470', '#997e65', '#bd826b', '#6c5673' ];

  return (
    <div className="spotify-poster-page">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Abril+Fatface&family=Alfa+Slab+One&family=Anton&family=Archivo+Black&family=Bangers&family=Bebas+Neue&family=Bodoni+Moda:ital,opsz,wght@0,6..96,400..900;1,6..96,400..900&family=Caveat:wght@400..700&family=Cinzel:wght@400..900&family=Cormorant+Garamond:ital,wght@0,300..700;1,300..700&family=Courgette&family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=Dancing+Script:wght@400..700&family=EB+Garamond:ital,wght@0,400..800;1,400..800&family=Fjalla+One&family=Great+Vibes&family=Inter:wght@100..900&family=Josefin+Sans:ital,wght@0,100..700;1,100..700&family=Kanit:ital,wght@0,100..900;1,100..900&family=Lato:ital,wght@0,100..900;1,100..900&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Lobster&family=Lora:ital,wght@0,400..700;1,400..700&family=Merriweather:ital,wght@0,300..900;1,300..900&family=Montserrat:ital,wght@0,100..900;1,100..900&family=Open+Sans:ital,wght@0,300..800;1,300..800&family=Oswald:wght@200..700&family=PT+Serif:ital,wght@0,400;0,700;1,400;1,700&family=Pacifico&family=Patua+One&family=Permanent+Marker&family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Poppins:ital,wght@0,100..900;1,100..900&family=Prata&family=Raleway:ital,wght@0,100..900;1,100..900&family=Righteous&family=Roboto:ital,wght@0,100..900;1,100..900&family=Sacramento&family=Satisfy&family=Teko:wght@300..700&family=Ubuntu:ital,wght@0,300..700;1,300..700&family=Yellowtail&display=swap');        
        .spotify-poster-page { --spotify-green: #1DB954; --spotify-black: #121212; --spotify-dark: #181818; --spotify-card: #282828; --spotify-hover: #333333; --spotify-text: #FFFFFF; --spotify-subtext: #B3B3B3; --panel-bg: #09090b; --panel-section: #18181b; --panel-border: #27272a; --accent: #6366f1; --input-bg: #09090b; --input-border: #27272a; --radius: 8px; display: flex; height: 100vh; width: 100vw; overflow: hidden; font-family: 'Inter', sans-serif; background: var(--panel-bg); color: var(--spotify-text); padding-top: 64px; }
        .spotify-poster-page * { box-sizing: border-box; }
        .spotify-poster-page #panel { width: 320px; min-width: 320px; background: var(--panel-bg); border-right: 1px solid var(--panel-border); overflow-y: auto; display: flex; flex-direction: column; }
        .spotify-poster-page #panel::-webkit-scrollbar { width: 4px; } .spotify-poster-page #panel::-webkit-scrollbar-track { background: transparent; } .spotify-poster-page #panel::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }
        .spotify-poster-page .panel-header { padding: 20px; border-bottom: 1px solid var(--panel-border); display: flex; align-items: center; justify-content: space-between; gap: 10px; }
        .spotify-poster-page .panel-header .title-group { display: flex; align-items: center; gap: 10px; }
        .spotify-poster-page .panel-header svg { color: var(--accent); } .spotify-poster-page .panel-header h1 { font-size: 14px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; color: var(--spotify-text); margin: 0;}
        .spotify-poster-page .back-btn { background: none; border: 1px solid #444; color: #aaa; font-size: 10px; padding: 4px 8px; border-radius: 4px; cursor: pointer; transition: all 0.2s;} .spotify-poster-page .back-btn:hover { background: #fff; color: #000; border-color: #fff; }
        .spotify-poster-page .panel-section { border-bottom: 1px solid var(--panel-border); padding: 16px; } .spotify-poster-page .section-title { font-size: 10px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--spotify-subtext); margin-bottom: 12px; }
        .spotify-poster-page .form-row { margin-bottom: 10px; } .spotify-poster-page .form-row label { display: block; font-size: 11px; color: var(--spotify-subtext); margin-bottom: 4px; font-weight: 500; }
        .spotify-poster-page .form-row input[type="text"], .spotify-poster-page .form-row input[type="number"], .spotify-poster-page .form-row select, .spotify-poster-page .form-row textarea { width: 100%; background: var(--input-bg); border: 1px solid var(--input-border); border-radius: var(--radius); color: var(--spotify-text); padding: 7px 10px; font-size: 12px; font-family: 'Inter', sans-serif; outline: none; transition: border-color 0.2s; }
        .spotify-poster-page .form-row input:focus, .spotify-poster-page .form-row select:focus, .spotify-poster-page .form-row textarea:focus { border-color: var(--accent); } .spotify-poster-page .form-row textarea { resize: vertical; min-height: 80px; } .spotify-poster-page .form-row select option { background: #222; }
        .spotify-poster-page .form-row input[type="range"] { width: 100%; accent-color: var(--accent); cursor: pointer; } .spotify-poster-page .form-row input[type="color"] { width: 36px; height: 28px; border: none; border-radius: 4px; cursor: pointer; padding: 2px; background: var(--input-bg); }
        .spotify-poster-page .color-row { display: flex; align-items: center; gap: 8px; } .spotify-poster-page .color-row input[type="text"] { flex: 1; } .spotify-poster-page .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; } .spotify-poster-page .three-col { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px; }
        .spotify-poster-page .btn { display: flex; align-items: center; justify-content: center; gap: 6px; padding: 9px 14px; border-radius: var(--radius); border: none; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.15s; font-family: 'Inter', sans-serif; letter-spacing: 0.03em; }
        .spotify-poster-page .btn-primary { background: var(--accent); color: #fff; width: 100%; margin-bottom: 6px; } .spotify-poster-page .btn-primary:hover { background: #4f46e5; transform: scale(1.01); }
        .spotify-poster-page .btn-secondary { background: var(--panel-section); color: var(--spotify-text); border: 1px solid var(--panel-border); flex: 1; } .spotify-poster-page .btn-secondary:hover { background: var(--spotify-hover); }
        .spotify-poster-page .btn-download-group { display: flex; gap: 6px; margin-top: 6px; } .spotify-poster-page .range-val { font-size: 11px; color: var(--accent); font-weight: 600; min-width: 28px; text-align: right; } .spotify-poster-page .range-row { display: flex; align-items: center; gap: 8px; }
        .spotify-poster-page .toggle-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; } .spotify-poster-page .toggle-row label { font-size: 12px; color: var(--spotify-subtext); margin-bottom:0;}
        .spotify-poster-page .toggle { position: relative; width: 36px; height: 20px; } .spotify-poster-page .toggle input { opacity: 0; width: 0; height: 0; }
        .spotify-poster-page .slider { position: absolute; inset: 0; background: #333; border-radius: 20px; cursor: pointer; transition: 0.2s; } .spotify-poster-page .slider:before { content: ''; position: absolute; width: 14px; height: 14px; background: white; border-radius: 50%; left: 3px; top: 3px; transition: 0.2s; }
        .spotify-poster-page .toggle input:checked + .slider { background: var(--accent); } .spotify-poster-page .toggle input:checked + .slider:before { transform: translateX(16px); }
        .spotify-poster-page .upload-area { border: 1.5px dashed var(--panel-border); border-radius: var(--radius); padding: 16px; text-align: center; cursor: pointer; transition: border-color 0.2s; position: relative; overflow: hidden; } .spotify-poster-page .upload-area:hover { border-color: var(--accent); }
        .spotify-poster-page .upload-area input { position: absolute; inset: 0; opacity: 0; cursor: pointer; } .spotify-poster-page .upload-area p { font-size: 11px; color: var(--spotify-subtext); margin-top: 4px; }
        .spotify-poster-page .search-row { display: flex; gap: 6px; align-items: flex-end; } .spotify-poster-page .search-row .form-row { flex: 1; margin-bottom: 0; }
        .spotify-poster-page .search-results { max-height: 150px; overflow-y: auto; margin-top: 6px; border-radius: var(--radius); border: 1px solid var(--panel-border); display: none; }
        .spotify-poster-page .search-result-item { display: flex; align-items: center; gap: 8px; padding: 8px 10px; cursor: pointer; transition: background 0.15s; border-bottom: 1px solid var(--panel-border); }
        .spotify-poster-page .search-result-item:hover { background: var(--spotify-hover); } .spotify-poster-page .search-result-item img { width: 36px; height: 36px; border-radius: 4px; object-fit: cover; }
        .spotify-poster-page .result-info p { font-size: 12px; font-weight: 600; margin:0; } .spotify-poster-page .result-info span { font-size: 11px; color: var(--spotify-subtext); }

        .spotify-poster-page #canvas-area { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #0d0d0d; padding: 30px; overflow: hidden; position: relative; }
        .spotify-poster-page #canvas-area::before { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse at center, #1a1a1a 0%, #0d0d0d 70%); pointer-events: none; }
        .canvas-container { margin: 0 auto; box-shadow: 0 32px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.05); border-radius: 4px; transition: width 0.4s cubic-bezier(0.4,0,0.2,1), height 0.4s cubic-bezier(0.4,0,0.2,1); }
        
        .spotify-poster-page .accordion-btn { width: 100%; background: none; border: none; color: var(--spotify-subtext); font-size: 10px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; text-align: left; padding: 16px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--panel-border); font-family: 'DM Sans', sans-serif; transition: color 0.15s; }
        .spotify-poster-page .accordion-btn:hover { color: var(--spotify-text); }
        .spotify-poster-page .accordion-btn .arrow { font-size: 9px; transition: transform 0.2s; }
        .spotify-poster-page .accordion-btn.open .arrow { transform: rotate(180deg); }
        .spotify-poster-page .accordion-content { display: none; padding: 14px 16px; border-bottom: 1px solid var(--panel-border); }
        .spotify-poster-page .accordion-content.open { display: block; }
        .spotify-poster-page #toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%) translateY(20px); background: var(--accent); color: #000; padding: 10px 20px; border-radius: 24px; font-size: 13px; font-weight: 600; opacity: 0; transition: all 0.3s; z-index: 9999; pointer-events: none; }
        .spotify-poster-page #toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }

        .spotify-poster-page #props-panel { width: 260px; min-width: 260px; background: var(--panel-bg); border-left: 1px solid var(--panel-border); overflow-y: auto; flex-shrink: 0; display: flex; flex-direction: column; }
        .spotify-poster-page #props-panel::-webkit-scrollbar { width: 3px; } .spotify-poster-page #props-panel::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }
        .spotify-poster-page #props-header { padding: 14px 16px 10px; border-bottom: 1px solid var(--panel-border); font-size: 10px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--spotify-subtext); display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; }
        .spotify-poster-page #props-selected-name { color: var(--accent); font-size: 10px; font-weight: 600; letter-spacing: 0; text-transform: none; }
        .spotify-poster-page #props-body { flex: 1; overflow-y: auto; padding: 12px 14px; } .spotify-poster-page #props-body::-webkit-scrollbar { width: 3px; } .spotify-poster-page #props-body::-webkit-scrollbar-thumb { background: #333; }
        .spotify-poster-page #props-empty-state { padding: 32px 16px; text-align: center; color: #444; font-size: 11px; line-height: 1.7; } .spotify-poster-page #props-empty-state svg { margin-bottom: 12px; }
        .spotify-poster-page .pf-section { margin-bottom: 4px; } .spotify-poster-page .pf-section-title { font-size: 9px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #555; margin: 12px 0 6px; }
        .spotify-poster-page .pf-row { margin-bottom: 7px; } .spotify-poster-page .pf-row label { display: block; font-size: 10px; color: var(--spotify-subtext); margin-bottom: 3px; }
        .spotify-poster-page .pf-row input[type=text], .spotify-poster-page .pf-row input[type=number], .spotify-poster-page .pf-row select { width: 100%; background: var(--input-bg); border: 1px solid var(--input-border); border-radius: 5px; color: var(--spotify-text); padding: 5px 8px; font-size: 11px; font-family: 'DM Sans', sans-serif; outline: none; transition: border-color 0.15s; } .spotify-poster-page .pf-row input:focus, .spotify-poster-page .pf-row select:focus { border-color: var(--accent); } .spotify-poster-page .pf-row select option { background: #1a1a1a; }
      `}</style>

      <div id="panel">
        <div className="panel-header">
          <div className="title-group">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="1" fill="currentColor"/></svg>
            <h1>Vinyl Poster</h1>
          </div>
          <button className="back-btn" onClick={() => navigate('/song-poster')}>⟵ Back</button>
        </div>

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
              <option value="8x10">8" x 10"</option>
              <option value="11x14">11" x 14"</option>
              <option value="16x20">16" x 20"</option>
              <option value="18x24">18" x 24"</option>
              <option value="24x36">24" x 36"</option>
              <option value="40x50">40" x 50" (Default)</option>
            </select>
          </div>
        </div>

        <button className="accordion-btn open" onClick={(e) => (window as any).toggleAccordion(e.currentTarget)}>🔤 Top & Bottom Texts<span className="arrow">▼</span></button>
        <div className="accordion-content open">
            <div className="form-row">
                <label>Artist Name (Top Left) Text</label>
                <input type="text" id="v-label-input" defaultValue="ARTIST NAME" onInput={(e: any) => (window as any).updateFabricObjectById('v-top-left', 'text', e.target.value)} />
            </div>
            <div className="form-row">
                <label>Artist Name (Top Left) Color</label>
                <div className="color-row">
                    <input type="color" id="c-v-tl" defaultValue="#212121" onInput={(e:any)=>{ (window as any).updateFabricObjectById('v-top-left', 'fill', e.target.value); (window as any).syncColor('c-v-tl', 'c-v-tl-t'); }} />
                    <input type="text" id="c-v-tl-t" defaultValue="#212121" onInput={(e:any)=>{ (window as any).syncColor('c-v-tl', 'c-v-tl-t'); (window as any).updateFabricObjectById('v-top-left', 'fill', document.getElementById('c-v-tl-t')!.value); }} />
                </div>
            </div>

            <div className="form-row" style={{ marginTop: '12px' }}>
                <label>Year (Top Right) Text</label>
                <input type="text" id="v-year-input" defaultValue="1992" onInput={(e: any) => (window as any).updateFabricObjectById('v-top-right', 'text', e.target.value)} />
            </div>
            <div className="form-row">
                <label>Year Color</label>
                <div className="color-row">
                    <input type="color" id="c-v-tr" defaultValue="#212121" onInput={(e:any)=>{ (window as any).updateFabricObjectById('v-top-right', 'fill', e.target.value); (window as any).syncColor('c-v-tr', 'c-v-tr-t'); }} />
                    <input type="text" id="c-v-tr-t" defaultValue="#212121" onInput={(e:any)=>{ (window as any).syncColor('c-v-tr', 'c-v-tr-t'); (window as any).updateFabricObjectById('v-top-right', 'fill', document.getElementById('c-v-tr-t')!.value); }} />
                </div>
            </div>

            <div className="form-row" style={{ marginTop: '12px' }}>
                <label>Bottom Text (Album Name / Optional)</label>
                <input type="text" id="v-bottom-input" defaultValue="UNKNOWN ALBUM" onInput={(e: any) => (window as any).updateFabricObjectById('v-bottom', 'text', e.target.value)} />
            </div>
            <div className="form-row">
                <label>Bottom Text Color</label>
                <div className="color-row">
                    <input type="color" id="c-v-bot" defaultValue="#555555" onInput={(e:any)=>{ (window as any).updateFabricObjectById('v-bottom', 'fill', e.target.value); (window as any).syncColor('c-v-bot', 'c-v-bot-t'); }} />
                    <input type="text" id="c-v-bot-t" defaultValue="#555555" onInput={(e:any)=>{ (window as any).syncColor('c-v-bot', 'c-v-bot-t'); (window as any).updateFabricObjectById('v-bottom', 'fill', document.getElementById('c-v-bot-t')!.value); }} />
                </div>
            </div>
        </div>

        <button className="accordion-btn open" onClick={(e) => (window as any).toggleAccordion(e.currentTarget)}>🎵 Song Details<span className="arrow">▼</span></button>
        <div className="accordion-content open">
            <div className="form-row">
                <label>Song Title Text</label>
                <input type="text" id="v-song-title-input" defaultValue="SONG NAME" onInput={(e: any) => (window as any).updateFabricObjectById('v-song-title', 'text', e.target.value)} />
            </div>
            <div className="form-row">
                <label>Song Title Color</label>
                <div className="color-row">
                    <input type="color" id="c-v-st" defaultValue="#212121" onInput={(e:any)=>{ (window as any).updateFabricObjectById('v-song-title', 'fill', e.target.value); (window as any).syncColor('c-v-st', 'c-v-st-t'); }} />
                    <input type="text" id="c-v-st-t" defaultValue="#212121" onInput={(e:any)=>{ (window as any).syncColor('c-v-st', 'c-v-st-t'); (window as any).updateFabricObjectById('v-song-title', 'fill', document.getElementById('c-v-st-t')!.value); }} />
                </div>
            </div>
        </div>

        <button className="accordion-btn open" onClick={(e) => (window as any).toggleAccordion(e.currentTarget)}>💿 Vinyl Record & Lyrics<span className="arrow">▼</span></button>
        <div className="accordion-content open">
            <div className="form-row">
                <label>Spiral Font Family</label>
                <select id="v-spiral-font" defaultValue="'DM Sans', sans-serif" onChange={() => (window as any).updateVinylSpiral()}>
                    <option value="'Abril Fatface', serif">Abril Fatface</option><option value="'Alfa Slab One', serif">Alfa Slab One</option><option value="'Anton', sans-serif">Anton</option><option value="'Bangers', cursive">Bangers</option><option value="'Bebas Neue', sans-serif">Bebas Neue</option><option value="'Caveat', cursive">Caveat</option><option value="'Cinzel', serif">Cinzel</option><option value="'Cormorant Garamond', serif">Cormorant Garamond</option><option value="'Courgette', cursive">Courgette</option><option value="'DM Sans', sans-serif">DM Sans</option><option value="'Dancing Script', cursive">Dancing Script</option><option value="'EB Garamond', serif">EB Garamond</option><option value="'Fjalla One', sans-serif">Fjalla One</option><option value="'Great Vibes', cursive">Great Vibes</option><option value="'Inter', sans-serif">Inter</option><option value="'Josefin Sans', sans-serif">Josefin Sans</option><option value="'Kanit', sans-serif">Kanit</option><option value="'Lato', sans-serif">Lato</option><option value="'Libre Baskerville', serif">Libre Baskerville</option><option value="'Lobster', cursive">Lobster</option><option value="'Lora', serif">Lora</option><option value="'Merriweather', serif">Merriweather</option><option value="'Montserrat', sans-serif">Montserrat</option><option value="'Open Sans', sans-serif">Open Sans</option><option value="'Oswald', sans-serif">Oswald</option><option value="'PT Serif', serif">PT Serif</option><option value="'Pacifico', cursive">Pacifico</option><option value="'Patua One', serif">Patua One</option><option value="'Permanent Marker', cursive">Permanent Marker</option><option value="'Playfair Display', serif">Playfair Display</option><option value="'Poppins', sans-serif">Poppins</option><option value="'Prata', serif">Prata</option><option value="'Raleway', sans-serif">Raleway</option><option value="'Righteous', cursive">Righteous</option><option value="'Roboto', sans-serif">Roboto</option><option value="'Sacramento', cursive">Sacramento</option><option value="'Satisfy', cursive">Satisfy</option><option value="'Teko', sans-serif">Teko</option><option value="'Ubuntu', sans-serif">Ubuntu</option><option value="'Yellowtail', cursive">Yellowtail</option>
                </select>
            </div>
            <div className="form-row">
                <label>Spiral Text Size</label>
                <div className="range-row">
                    <input type="range" id="vinyl-text-size" min="6" max="40" defaultValue="12" onInput={(e:any) => { e.target.nextElementSibling.textContent = e.target.value+'px'; (window as any).updateVinylSpiral(); }} />
                    <span className="range-val">12px</span>
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
                    <input type="color" id="v-bg-color" defaultValue="#f5f5f5" onInput={() => (window as any).updateVinylBgColor()} />
                    <input type="text" id="v-bg-color-txt" defaultValue="#f5f5f5" onInput={() => { (window as any).syncColor('v-bg-color', 'v-bg-color-txt'); (window as any).updateVinylBgColor(); }} />
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
                  <p>Click to upload image</p>
                </div>
            </div>
        </div>

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

        <button className="accordion-btn open" onClick={(e) => (window as any).toggleAccordion(e.currentTarget)}>⬇️ Download<span className="arrow">▼</span></button>
        <div className="accordion-content open">
          <div className="btn-download-group">
            <button className="btn btn-secondary" onClick={() => (window as any).downloadPNG()}>PNG (ZIP)</button>
            <button className="btn btn-secondary" onClick={() => (window as any).downloadPDF()}>PDF (ZIP)</button>
            <button className="btn btn-secondary" onClick={() => (window as any).downloadSVG()}>SVG (ZIP)</button>
          </div>
        </div>
      </div>

      <div id="canvas-area">
        <canvas id="poster-canvas"></canvas>
      </div>

      <div id="props-panel">
        <div id="props-header">Properties<span id="props-selected-name"></span></div>
        <div id="props-body">
          <div id="props-empty-state"><p>Click an element on the canvas</p></div>
          <div id="props-fields" style={{ display: 'none' }}></div>
        </div>
      </div>

      <div id="toast">✓ İşlem tamamlandı</div>
    </div>
  );
}
