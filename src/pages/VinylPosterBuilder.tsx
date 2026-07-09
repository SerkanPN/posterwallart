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
      w.LOGICAL_W = 2400; 
      w.LOGICAL_H = 3000;

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

      w.canvas = new w.fabric.Canvas('poster-canvas', { preserveObjectStacking: true, selection: true });
      w.fabric.Object.prototype.set({ transparentCorners: false, cornerColor: '#6366f1', borderColor: '#6366f1', cornerSize: 10, padding: 5, cornerStrokeColor: '#fff', cornerStyle: 'circle' });

      w.updateCanvasSize = function() {
        const selectEl = document.getElementById('canvas-size') as HTMLSelectElement;
        if(!selectEl) return;
        const key = selectEl.value;
        const[w_size, h_size] = w.CANVAS_SIZES[key];
        const ratio = w_size / h_size;

        w.LOGICAL_W = 2400;
        w.LOGICAL_H = 2400 / ratio;

        const area = document.getElementById('canvas-area');
        if(!area) return;
        const areaW = area.clientWidth - 80;
        const areaH = area.clientHeight - 80;

        let pw, ph;
        if (areaW / ratio <= areaH) { pw = areaW; ph = areaW / ratio; } else { ph = areaH; pw = areaH * ratio; }

        w.canvas.setWidth(pw);
        w.canvas.setHeight(ph);
        w.canvas.setZoom(pw / w.LOGICAL_W);
        w.canvas.renderAll();
      };

      window.addEventListener('resize', w.updateCanvasSize);

      w.vCurrentCoverSrc = ''; 

      w.updateVinylBgBlur = function() {
        const blurEl = document.getElementById('v-blur-val') as HTMLInputElement;
        if (!blurEl || !w.vCurrentCoverSrc) return;
        const blurAmount = parseFloat(blurEl.value);
        
        const blurDisp = document.getElementById('v-blur-display');
        if (blurDisp) blurDisp.textContent = blurAmount + 'px';
        
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = () => {
          const c = document.createElement('canvas');
          c.width = w.LOGICAL_W;
          c.height = w.LOGICAL_H;
          const ctx = c.getContext('2d');
          if(ctx) {
              ctx.filter = `blur(${blurAmount * 2}px)`;
              const scale = Math.max(c.width / img.width, c.height / img.height);
              const dx = (c.width / 2) - (img.width / 2) * scale;
              const dy = (c.height / 2) - (img.height / 2) * scale;
              ctx.drawImage(img, dx, dy, img.width * scale, img.height * scale);
          }
          w.fabric.Image.fromURL(c.toDataURL('image/jpeg', 0.85), (fImg: any) => {
              w.canvas.setBackgroundImage(fImg, w.canvas.renderAll.bind(w.canvas));
          });
        };
        img.src = w.vCurrentCoverSrc;
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
        const labelCol    = isDark ? '#eeeeee' : '#e0e0e0';

        const setObjCol = (id: string, col: string) => {
            const obj = w.canvas.getObjects().find((o:any) => o.id === id);
            if(obj) { obj.set('fill', col); }
        };

        setObjCol('v-top-left', mainTextCol);
        setObjCol('v-top-right', mainTextCol);
        setObjCol('v-song-title', mainTextCol);
        setObjCol('v-bottom-text', subTextCol);

        w.VINYL_TEXT_COLOR = mainTextCol;
        w.VINYL_LABEL_COLOR = labelCol;
        w.updateVinylSpiral();

        const setInp = (id: string, col: string) => { 
          const el = document.getElementById(id) as HTMLInputElement; if(el) el.value = col; 
          const txt = document.getElementById(id+'-t') as HTMLInputElement; if(txt) txt.value = col;
        };
        setInp('c-v-tl', mainTextCol);
        setInp('c-v-tr', mainTextCol);
        setInp('c-v-st', mainTextCol);
        setInp('c-v-bot', subTextCol);
        
        w.canvas.requestRenderAll();
      };

      w.updateBgColor = function() {
        const colorEl = document.getElementById('v-bg-color') as HTMLInputElement;
        const txtEl = document.getElementById('v-bg-color-txt') as HTMLInputElement;
        if(!colorEl) return;
        const color = colorEl.value;
        if(txtEl) txtEl.value = color;
        
        w.canvas.setBackgroundImage(null, () => {
            w.canvas.setBackgroundColor(color, w.canvas.renderAll.bind(w.canvas));
        });
        w.applyAutoContrast(color);
      };

      w.updateVinylBg = function() {
        const type = (document.getElementById('v-bg-type') as HTMLSelectElement).value;
        const bgColorSection = document.getElementById('v-bg-color-section');
        const bgBlurSection = document.getElementById('v-bg-blur-section');

        if (type === 'color') {
          if(bgColorSection) bgColorSection.style.display = 'block';
          if(bgBlurSection) bgBlurSection.style.display = 'none';
          w.updateBgColor();
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
            if (btype && btype.value === 'blur') {
                w.updateVinylBgBlur();
            }
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
            w.showToast('No results found');
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
          w.showToast('Search error: ' + e.message);
        }
      };

      w.applySearchResult = async function(item: any) {
        const updateText = (id: string, text: string) => {
            const obj = w.canvas.getObjects().find((o:any) => o.id === id);
            if(obj) obj.set('text', text);
            const inp = document.getElementById(id+'-input') as HTMLInputElement;
            if(inp) inp.value = text;
        };

        const year = new Date(item.releaseDate).getFullYear() || "1992";
        const album = item.collectionName ? item.collectionName.toUpperCase() : "UNKNOWN ALBUM";
        const artist = item.artistName || 'ARTIST NAME';
        
        updateText('v-song-title', item.trackName.toUpperCase());
        updateText('v-top-right', year.toString());
        updateText('v-bottom-text', album);
        updateText('v-top-left', artist.toUpperCase());
        
        const yearInp = document.getElementById('v-year-input') as HTMLInputElement;
        if(yearInp) yearInp.value = year.toString();

        w.showToast('Searching for lyrics...');
        let lyrics = await w.fetchLyrics(item.artistName, item.trackName);
        
        const linp = document.getElementById('vinyl-lyrics-input') as HTMLTextAreaElement;
        if(lyrics) {
            if(linp) linp.value = lyrics;
            w.showToast('✓ Lyrics and song loaded');
        } else {
            if(linp) linp.value = "LOREM IPSUM DOLOR SIT AMET CONSECTETUR ADIPISCING ELIT SED DO EIUSMOD TEMPOR INCIDIDUNT UT LABORE ET DOLORE MAGNA ALIQUA";
            w.showToast('Lyrics not found, default text added');
        }
        w.updateVinylSpiral();
        w.canvas.requestRenderAll();
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

      w.updateVinylSpiral = function() {
          const fs = parseInt((document.getElementById('vinyl-text-size') as HTMLInputElement)?.value || "12");
          const rawInput = (document.getElementById('vinyl-lyrics-input') as HTMLTextAreaElement)?.value || "LOREM IPSUM...";
          const ff = (document.getElementById('v-spiral-font') as HTMLSelectElement)?.value || "'DM Sans', sans-serif";
          
          const textLen = rawInput.length * (fs * 0.6); 
          const minR = 70;
          const spacing = fs * 1.2;
          
          const standardLoops = (380 - minR) / spacing;
          const standardLen = Math.PI * spacing * standardLoops * standardLoops + 2 * Math.PI * minR * standardLoops;
          
          let finalStr = rawInput.trim();
          if (textLen < standardLen) {
             let repeats = Math.ceil(standardLen / (textLen + 20));
             let arr = []; for(let k=0; k<repeats; k++) arr.push(finalStr);
             finalStr = arr.join(' • ');
          }
          finalStr = finalStr.toUpperCase();

          let loops = standardLoops;
          let maxR = 380;
          
          if (textLen > standardLen) {
              const a = Math.PI * spacing;
              const b = 2 * Math.PI * minR;
              const c = -textLen;
              loops = (-b + Math.sqrt(b*b - 4*a*c)) / (2*a);
              maxR = minR + loops * spacing;
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

          const textColor = w.VINYL_TEXT_COLOR || '#212121';
          const labelColor = w.VINYL_LABEL_COLOR || '#e0e0e0';
          const centerSize = parseInt((document.getElementById('v-vinyl-label-size') as HTMLInputElement)?.value || "50");

          const svgStr = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgSize} ${svgSize}" width="${svgSize}" height="${svgSize}">
                <defs><path id="v-spiral-path" d="${pathD}" fill="none" /></defs>
                <circle cx="${cx}" cy="${cy}" r="${maxR + 15}" fill="none" />
                <circle cx="${cx}" cy="${cy}" r="60" fill="none" stroke="#2a2a2a" stroke-width="1" />
                <circle cx="${cx}" cy="${cy}" r="64" fill="none" stroke="#2a2a2a" stroke-width="1" />
                <text fill="${textColor}" font-size="${fs}" letter-spacing="2" font-family="${ff.replace(/"/g, "'")}" font-weight="700" text-anchor="start">
                    <textPath href="#v-spiral-path" startOffset="0%">${finalStr}</textPath>
                </text>
                <circle cx="${cx}" cy="${cy}" r="${centerSize}" fill="${labelColor}" />
                <circle cx="${cx}" cy="${cy}" r="${centerSize * 0.12}" fill="#111111" />
            </svg>
          `;

          w.fabric.loadSVGFromString(svgStr, function(objects: any, options: any) {
              const group = w.fabric.util.groupSVGElements(objects, options);
              
              const oldVinyl = w.canvas.getObjects().find((o:any) => o.id === 'v-vinyl');
              const hwRaw = (document.getElementById('v-vinyl-size') as HTMLInputElement)?.value || '85';
              const targetW = w.LOGICAL_W * (parseFloat(hwRaw) / 100);

              group.set({
                  id: 'v-vinyl',
                  originX: 'center', originY: 'center',
                  left: oldVinyl ? oldVinyl.left : w.LOGICAL_W / 2,
                  top: oldVinyl ? oldVinyl.top : w.LOGICAL_H * 0.55
              });
              
              group.scaleToWidth(oldVinyl ? oldVinyl.getScaledWidth() : targetW);

              if (oldVinyl) w.canvas.remove(oldVinyl);
              w.canvas.add(group);
              w.canvas.sendToBack(group);
              w.canvas.renderAll();
          });
      };

      w.getExportFilename = function(ext: string) {
        let artist = ((document.getElementById('v-label-input') as HTMLInputElement)?.value || 'artist').replace(/[^a-z0-9]/gi, '-').toLowerCase();
        let song = ((document.getElementById('v-song-title-input') as HTMLInputElement)?.value || 'song').replace(/[^a-z0-9]/gi, '-').toLowerCase();
        const size = (document.getElementById('canvas-size') as HTMLSelectElement).value;
        const now = new Date(); const date = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
        const hour = String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0');
        return `vinyl-${artist}-${song}-${size}-${date}-${hour}.${ext}`;
      };

      w.exportVinylLoop = async function(format: string) {
          w.canvas.discardActiveObject();
          w.canvas.renderAll();
          
          const items = document.querySelectorAll('.multi-export-item');
          const colorsToExport: string[] = [];
          items.forEach((item: any) => {
              const chk = item.querySelector('.export-color-check') as HTMLInputElement;
              const pck = item.querySelector('.export-color-picker') as HTMLInputElement;
              if (chk && chk.checked && pck) colorsToExport.push(pck.value);
          });

          if (colorsToExport.length === 0) { w.showToast('Please select at least one color to export.'); return; }

          w.showToast(`Preparing ZIP for ${colorsToExport.length} colors... Please wait.`);

          const origW = w.canvas.getWidth();
          const origH = w.canvas.getHeight();
          const origZoom = w.canvas.getZoom();

          w.canvas.setZoom(1);
          w.canvas.setWidth(w.LOGICAL_W);
          w.canvas.setHeight(w.LOGICAL_H);

          const zip = new (window as any).JSZip(); 
          const folder = zip.folder(`vinyl-posters-${format}`);

          const originalBgColor = (document.getElementById('v-bg-color') as HTMLInputElement).value;
          const bgImgDiv = document.getElementById('poster-bg-img') as HTMLElement;
          const originalBgImgDisplay = bgImgDiv ? bgImgDiv.style.display : 'none';
          if(bgImgDiv) bgImgDiv.style.display = 'none'; 

          for (let i = 0; i < colorsToExport.length; i++) {
              const color = colorsToExport[i];
              
              await new Promise(r => {
                  w.canvas.setBackgroundColor(color, () => {
                      w.applyAutoContrast(color);
                      setTimeout(r, 100); 
                  });
              });

              try {
                  let baseFilename = w.getExportFilename(format);
                  let filename = baseFilename.replace(`.${format}`, `-${color.replace('#', '')}.${format}`);

                  if (format === 'png') {
                      const dataUrl = w.canvas.toDataURL({ format: 'png', quality: 1.0 });
                      const base64Content = dataUrl.split(',')[1];
                      folder.file(filename, base64Content, {base64: true});
                  } else if (format === 'pdf') {
                      const { jsPDF } = w.jspdf;
                      const pdf = new jsPDF({ orientation: w.LOGICAL_W > w.LOGICAL_H ? 'landscape' : 'portrait', unit: 'px', format: [w.LOGICAL_W, w.LOGICAL_H] });
                      const imgData = w.canvas.toDataURL({ format: 'jpeg', quality: 0.95 });
                      pdf.addImage(imgData, 'JPEG', 0, 0, w.LOGICAL_W, w.LOGICAL_H);
                      const pdfArrayBuffer = pdf.output('arraybuffer');
                      folder.file(filename, pdfArrayBuffer);
                  } else if (format === 'svg') {
                      const svgContent = w.canvas.toSVG();
                      folder.file(filename, svgContent);
                  }
              } catch(e) {}
          }

          zip.generateAsync({type:"blob"}).then(function(content: Blob) {
              const url = URL.createObjectURL(content); const link = document.createElement('a');
              link.download = `Vinyl-Posters-${new Date().getTime()}.zip`; link.href = url; link.click(); URL.revokeObjectURL(url);
              w.showToast(`✓ ZIP file downloaded!`);
          });

          w.canvas.setWidth(origW);
          w.canvas.setHeight(origH);
          w.canvas.setZoom(origZoom);
          
          w.canvas.setBackgroundColor(originalBgColor, w.canvas.renderAll.bind(w.canvas));
          w.applyAutoContrast(originalBgColor);
          if(bgImgDiv) bgImgDiv.style.display = originalBgImgDisplay;
      };

      w.downloadPNG = async function() { await w.exportVinylLoop('png'); };
      w.downloadPDF = async function() { await w.exportVinylLoop('pdf'); };
      w.downloadSVG = async function() { await w.exportVinylLoop('svg'); };

      // ══════════════════════════════════════════════════════════════
      // EDITOR ENGINE & SELECTION
      // ══════════════════════════════════════════════════════════════

      w.updateFabObj = function(id: string, prop: string, val: any) {
         const obj = w.canvas.getObjects().find((o:any) => o.id === id);
         if (!obj) return;
         if (prop === 'fontSize') { 
            obj.set('fontSize', parseFloat(val)); obj.set('scaleX', 1); obj.set('scaleY', 1); 
         } else if (prop === 'charSpacing') { 
            obj.set('charSpacing', parseFloat(val) * 10); 
         } else if (prop === 'scaleToWidth') {
            obj.scaleToWidth(w.LOGICAL_W * (parseFloat(val) / 100));
         } else { 
            obj.set(prop, val); 
         }
         w.canvas.requestRenderAll();
      };

      w.edUpdatePanel = function() {
        const empty  = document.getElementById('props-empty-state'); 
        const fields = document.getElementById('props-fields'); 
        const nameEl = document.getElementById('props-selected-name');
        
        const activeObj = w.canvas.getActiveObject();

        if (!activeObj) { 
            if(empty) empty.style.display = ''; 
            if(fields) fields.style.display = 'none'; 
            if(nameEl) nameEl.textContent = ''; 
            return; 
        }

        if(empty) empty.style.display = 'none'; 
        if(fields) fields.style.display = '';

        if (activeObj.type === 'activeSelection') { 
            if(nameEl) nameEl.textContent = 'Multiple Elements'; 
            if(fields) fields.innerHTML = w.edBuildMulti(); 
            return; 
        }

        const id = activeObj.id; 
        if(nameEl) nameEl.textContent = id ? id.toUpperCase() : 'Element'; 
        if(fields) fields.innerHTML = w.edBuildSingle(activeObj);
      };

      w.edBuildSingle = function(obj: any) {
        const id = obj.id;
        if (!id) return '';

        function cpair(initColor: string, oninput: string) { return `<div class="pf-color-row"><input type="color" value="${initColor}" oninput="const v=this.value; ${oninput.replace(/"/g,"'")}; this.nextElementSibling.value=v;"><input type="text" value="${initColor}" oninput="let v=this.value; if(/^#[0-9a-fA-F]{3}$/i.test(v)){v='#'+v[1]+v[1]+v[2]+v[2]+v[3]+v[3];} if(/^#[0-9a-fA-F]{6}$/i.test(v)){${oninput.replace(/this\.value/g,"v").replace(/"/g,"'")}; this.previousElementSibling.value=v;}"></div>`; }
        function rrow(min:number,max:number,step:number,val:number,oninput:string,unit='px') { return `<div class="pf-range-row"><input type="range" min="${min}" max="${max}" step="${step}" value="${val}" oninput="${oninput.replace(/"/g,"'")}; this.nextElementSibling.textContent=this.value+'${unit}'"><span class="pf-range-val">${val}${unit}</span></div>`; }
        const fontOpts = `<option value="'Abril Fatface', serif">Abril Fatface</option><option value="'Alfa Slab One', serif">Alfa Slab One</option><option value="'Anton', sans-serif">Anton</option><option value="'Archivo Black', sans-serif">Archivo Black</option><option value="'Bangers', cursive">Bangers</option><option value="'Bebas Neue', sans-serif">Bebas Neue</option><option value="'Bodoni Moda', serif">Bodoni Moda</option><option value="'Caveat', cursive">Caveat</option><option value="'Cinzel', serif">Cinzel</option><option value="'Cormorant Garamond', serif">Cormorant Garamond</option><option value="'Courgette', cursive">Courgette</option><option value="'DM Sans', sans-serif">DM Sans</option><option value="'Dancing Script', cursive">Dancing Script</option><option value="'EB Garamond', serif">EB Garamond</option><option value="'Fjalla One', sans-serif">Fjalla One</option><option value="'Great Vibes', cursive">Great Vibes</option><option value="'Inter', sans-serif">Inter</option><option value="'Josefin Sans', sans-serif">Josefin Sans</option><option value="'Kanit', sans-serif">Kanit</option><option value="'Lato', sans-serif">Lato</option><option value="'Libre Baskerville', serif">Libre Baskerville</option><option value="'Lobster', cursive">Lobster</option><option value="'Lora', serif">Lora</option><option value="'Merriweather', serif">Merriweather</option><option value="'Montserrat', sans-serif">Montserrat</option><option value="'Open Sans', sans-serif">Open Sans</option><option value="'Oswald', sans-serif">Oswald</option><option value="'PT Serif', serif">PT Serif</option><option value="'Pacifico', cursive">Pacifico</option><option value="'Patua One', serif">Patua One</option><option value="'Permanent Marker', cursive">Permanent Marker</option><option value="'Playfair Display', serif">Playfair Display</option><option value="'Poppins', sans-serif">Poppins</option><option value="'Prata', serif">Prata</option><option value="'Raleway', sans-serif">Raleway</option><option value="'Righteous', cursive">Righteous</option><option value="'Roboto', sans-serif">Roboto</option><option value="'Sacramento', cursive">Sacramento</option><option value="'Satisfy', cursive">Satisfy</option><option value="'Teko', sans-serif">Teko</option><option value="'Ubuntu', sans-serif">Ubuntu</option><option value="'Yellowtail', cursive">Yellowtail</option>`;

        let html = `<div class="pf-section"><div class="pf-section-title">Position &amp; Size</div><div class="pf-2col"><div class="pf-row"><label>X</label><input type="number" value="${Math.round(obj.left)}" oninput="window.updateFabObj('${id}','left',this.value)"></div><div class="pf-row"><label>Y</label><input type="number" value="${Math.round(obj.top)}" oninput="window.updateFabObj('${id}','top',this.value)"></div></div></div><hr class="pf-divider">`;

        if (['v-top-left','v-top-right','v-song-title','v-bottom-text'].includes(id)) {
          const txt = (obj.text || '').replace(/"/g,'&quot;');
          const fs  = Math.round(obj.fontSize * obj.scaleX); 
          const fw = obj.fontWeight; const col = obj.fill || '#000000'; const ls = (obj.charSpacing || 0) / 10;
          const isUC = obj.textTransform === 'uppercase'; const ff = (obj.fontFamily || "").replace(/"/g, "'");

          html += `<div class="pf-section"><div class="pf-section-title">Text properties</div><div class="pf-row"><label>Content</label><input type="text" value="${txt}" oninput="window.updateFabObj('${id}', 'text', this.value)"></div><div class="pf-row"><label>Font Family</label><select onchange="window.updateFabObj('${id}', 'fontFamily', this.value)"><option value="${ff}" selected>Current Font</option>${fontOpts}</select></div><div class="pf-2col"><div class="pf-row"><label>Font Size</label><input type="number" value="${fs}" min="6" max="1000" oninput="window.updateFabObj('${id}','fontSize',this.value)"></div><div class="pf-row"><label>Weight</label><select onchange="window.updateFabObj('${id}','fontWeight',this.value)"><option value="300" ${fw==='300'?'selected':''}>Light</option><option value="400" ${fw==='400'||fw==='normal'?'selected':''}>Regular</option><option value="500" ${fw==='500'?'selected':''}>Medium</option><option value="600" ${fw==='600'?'selected':''}>SemiBold</option><option value="700" ${fw==='700'||fw==='bold'?'selected':''}>Bold</option><option value="900" ${fw==='900'?'selected':''}>Black</option></select></div></div><div class="pf-row"><label>Letter Spacing</label>${rrow(-5,30,0.5,ls, `window.updateFabObj('${id}','charSpacing',this.value)`)}</div></div><hr class="pf-divider"><div class="pf-section"><div class="pf-section-title">Text Color</div><div class="pf-row">${cpair(col, `window.updateFabObj('${id}','fill',this.value)`)}</div></div>`;
        }

        if (id === 'v-vinyl') {
          const tsz = parseInt((document.getElementById('vinyl-text-size') as HTMLInputElement)?.value || "12");
          const lsz = parseInt((document.getElementById('v-vinyl-label-size') as HTMLInputElement)?.value || "50");
          const hw = Math.round((obj.getScaledWidth() / w.LOGICAL_W) * 100);

          html += `<div class="pf-section">
            <div class="pf-section-title">Vinyl Record</div>
            <div class="pf-row"><label>Overall Size (%)</label>${rrow(10,150,1,hw, `window.updateFabObj('${id}','scaleToWidth',this.value); document.getElementById('v-vinyl-size').value=this.value;`, '%')}</div>
            <div class="pf-row">
                <label>Spiral Font Family</label>
                <select id="v-spiral-font" onchange="window.updateVinylSpiral();">
                    <option value="'DM Sans', sans-serif" selected>Current Font</option>
                    ${fontOpts}
                </select>
            </div>
            <div class="pf-row"><label>Spiral Text Size</label>${rrow(6,40,1,tsz, `document.getElementById('vinyl-text-size').value=this.value; window.updateVinylSpiral();`)}</div>
            <div class="pf-row"><label>Center Label Size</label>${rrow(20,200,1,lsz, `document.getElementById('v-vinyl-label-size').value=this.value; window.updateVinylSpiral();`)}</div>
          </div>`;
        }
        return html;
      };

      w.edBuildMulti = function() {
        return `<div class="pf-section"><div class="pf-section-title">Align to Canvas</div><div class="pf-2col" style="margin-bottom:6px;"><button class="pf-btn" onclick="window.alignObjects('left')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="3" x2="3" y2="21" strokeWidth="2.5"/><rect x="5" y="8" width="8" height="3" rx="1"/><rect x="5" y="13" width="13" height="3" rx="1"/></svg></button><button class="pf-btn" onclick="window.alignObjects('right')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="21" y1="3" x2="21" y2="21" strokeWidth="2.5"/><rect x="11" y="8" width="8" height="3" rx="1"/><rect x="6" y="13" width="13" height="3" rx="1"/></svg></button><button class="pf-btn" onclick="window.alignObjects('center')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="3" x2="12" y2="21" strokeWidth="2.5"/><rect x="6" y="8" width="12" height="3" rx="1"/><rect x="4" y="13" width="16" height="3" rx="1"/></svg></button><button class="pf-btn" onclick="window.alignObjects('middle')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12" strokeWidth="2.5"/><rect x="8" y="4" width="3" height="16" rx="1"/><rect x="13" y="6" width="3" height="12" rx="1"/></svg></button><button class="pf-btn" onclick="window.alignObjects('top')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="3" x2="21" y2="3" strokeWidth="2.5"/><rect x="8" y="5" width="3" height="8" rx="1"/><rect x="13" y="5" width="3" height="13" rx="1"/></svg></button><button class="pf-btn" onclick="window.alignObjects('bottom')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="21" x2="21" y2="21" strokeWidth="2.5"/><rect x="8" y="11" width="3" height="8" rx="1"/><rect x="13" y="6" width="3" height="13" rx="1"/></svg></button></div></div><hr class="pf-divider"><div class="pf-section"><div class="pf-section-title">Distribute</div><div class="pf-2col"><button class="pf-btn" onclick="window.distributeObjects('h')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="3" x2="3" y2="21"/><line x1="21" y1="3" x2="21" y2="21"/><rect x="9" y="8" width="6" height="8" rx="1"/></svg></button><button class="pf-btn" onclick="window.distributeObjects('v')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="3" x2="21" y2="3"/><line x1="3" y1="21" x2="21" y2="21"/><rect x="8" y="9" width="8" height="6" rx="1"/></svg></button></div></div>`;
      };

      w.alignObjects = function(alignType: string) {
          let activeObj = w.canvas.getActiveObject(); if (!activeObj) return;
          const cw = w.LOGICAL_W; const ch = w.LOGICAL_H;
          if (activeObj.type === 'activeSelection') {
              const objs = activeObj.getObjects(); const bound = activeObj.getBoundingRect(); w.canvas.discardActiveObject(); 
              objs.forEach((obj: any) => {
                  let wObj = obj.getScaledWidth(); let hObj = obj.getScaledHeight();
                  if (alignType === 'left') { if (obj.originX === 'left') obj.set('left', bound.left); else if (obj.originX === 'center') obj.set('left', bound.left + wObj/2); else if (obj.originX === 'right') obj.set('left', bound.left + wObj); } else if (alignType === 'center') { let centerX = bound.left + (bound.width / 2); if (obj.originX === 'left') obj.set('left', centerX - wObj/2); else if (obj.originX === 'center') obj.set('left', centerX); else if (obj.originX === 'right') obj.set('left', centerX + wObj/2); } else if (alignType === 'right') { let rightX = bound.left + bound.width; if (obj.originX === 'left') obj.set('left', rightX - wObj); else if (obj.originX === 'center') obj.set('left', rightX - wObj/2); else if (obj.originX === 'right') obj.set('left', rightX); }
                  if (alignType === 'top') { if (obj.originY === 'top') obj.set('top', bound.top); else if (obj.originY === 'center') obj.set('top', bound.top + hObj/2); else if (obj.originY === 'bottom') obj.set('top', bound.top + hObj); } else if (alignType === 'middle') { let centerY = bound.top + (bound.height / 2); if (obj.originY === 'top') obj.set('top', centerY - hObj/2); else if (obj.originY === 'center') obj.set('top', centerY); else if (obj.originY === 'bottom') obj.set('top', centerY + hObj/2); } else if (alignType === 'bottom') { let bottomY = bound.top + bound.height; if (obj.originY === 'top') obj.set('top', bottomY - hObj); else if (obj.originY === 'center') obj.set('top', bottomY - hObj/2); else if (obj.originY === 'bottom') obj.set('top', bottomY); }
                  obj.setCoords();
              });
              let sel = new w.fabric.ActiveSelection(objs, { canvas: w.canvas }); w.canvas.setActiveObject(sel);
          } else {
              let wObj = activeObj.getScaledWidth(); let hObj = activeObj.getScaledHeight();
              if (alignType === 'left') { if (activeObj.originX === 'left') activeObj.set('left', 0); else if (activeObj.originX === 'center') activeObj.set('left', wObj/2); else if (activeObj.originX === 'right') activeObj.set('left', wObj); } else if (alignType === 'center') { activeObj.centerH(); } else if (alignType === 'right') { if (activeObj.originX === 'left') activeObj.set('left', cw - wObj); else if (activeObj.originX === 'center') activeObj.set('left', cw - wObj/2); else if (activeObj.originX === 'right') activeObj.set('left', cw); } else if (alignType === 'top') { if (activeObj.originY === 'top') activeObj.set('top', 0); else if (activeObj.originY === 'center') activeObj.set('top', hObj/2); else if (activeObj.originY === 'bottom') activeObj.set('top', hObj); } else if (alignType === 'middle') { activeObj.centerV(); } else if (alignType === 'bottom') { if (activeObj.originY === 'top') activeObj.set('top', ch - hObj); else if (activeObj.originY === 'center') activeObj.set('top', ch - hObj/2); else if (activeObj.originY === 'bottom') activeObj.set('top', ch); }
              activeObj.setCoords(); w.canvas.fire('object:modified', {target: activeObj});
          }
          w.canvas.requestRenderAll();
      };

      w.distributeObjects = function(axis: string) {
          let activeObj = w.canvas.getActiveObject(); if (!activeObj || activeObj.type !== 'activeSelection') return;
          const objs = activeObj.getObjects(); if (objs.length < 3) return; w.canvas.discardActiveObject(); 
          const items = objs.map((obj: any) => { const bound = obj.getBoundingRect(); return { obj, pos: axis === 'h' ? bound.left : bound.top, size: axis === 'h' ? bound.width : bound.height }; }).sort((a: any, b: any) => a.pos - b.pos);
          const first = items[0]; const last = items[items.length - 1]; const totalSpan = (last.pos + last.size) - first.pos; const totalSize = items.reduce((sum: number, item: any) => sum + item.size, 0); const gap = (totalSpan - totalSize) / (items.length - 1); let cursor = first.pos + first.size + gap;
          for (let i = 1; i < items.length - 1; i++) { let it = items[i]; if (axis === 'h') { it.obj.set('left', it.obj.left + (cursor - it.pos)); } else { it.obj.set('top', it.obj.top + (cursor - it.pos)); } it.obj.setCoords(); cursor += it.size + gap; }
          let sel = new w.fabric.ActiveSelection(objs, { canvas: w.canvas }); w.canvas.setActiveObject(sel); w.canvas.requestRenderAll();
      };

      // FABRIC INITIALIZATION
      w.setupInitialObjects = function() {
          w.canvas.clear();
          const lw = w.LOGICAL_W; const lh = w.LOGICAL_H;

          const tl = new w.fabric.IText("ARTIST NAME", { id: 'v-top-left', left: lw * 0.08, top: lh * 0.08, fontFamily: 'DM Sans', fontSize: 60, fontWeight: 700, fill: '#212121', originX: 'left', originY: 'top', charSpacing: 100 });
          const tr = new w.fabric.IText("1992", { id: 'v-top-right', left: lw * 0.92, top: lh * 0.08, fontFamily: 'DM Sans', fontSize: 60, fontWeight: 700, fill: '#212121', originX: 'right', originY: 'top', charSpacing: 100 });
          const st = new w.fabric.IText("SONG NAME", { id: 'v-song-title', left: lw * 0.5, top: lh * 0.14, fontFamily: 'Josefin Sans', fontSize: 130, fontWeight: 800, fill: '#212121', originX: 'center', originY: 'top', charSpacing: 300 });
          const bt = new w.fabric.IText("UNKNOWN ALBUM", { id: 'v-bottom-text', left: lw * 0.5, top: lh * 0.92, fontFamily: 'DM Sans', fontSize: 45, fontWeight: 600, fill: '#555555', originX: 'center', originY: 'bottom', charSpacing: 50 });

          w.canvas.add(tl, tr, st, bt);
          w.updateVinylSpiral();
      };

      w.canvas.on('selection:created', w.edUpdatePanel);
      w.canvas.on('selection:updated', w.edUpdatePanel);
      w.canvas.on('selection:cleared', w.edUpdatePanel);
      w.canvas.on('object:modified', w.edUpdatePanel);

      setTimeout(() => { 
        w.updateCanvasSize();
        w.setupInitialObjects();
        const vbg = document.getElementById('v-bg-color') as HTMLInputElement;
        const vbgtxt = document.getElementById('v-bg-color-txt') as HTMLInputElement;
        if (vbg) vbg.value = "#f5f5f5";
        if (vbgtxt) vbgtxt.value = "#f5f5f5";
        w.updateBgColor(); 
      }, 500);

      document.addEventListener('keydown', function(e: any) {
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
        const obj = w.canvas.getActiveObject(); if (!obj) return;
        if (e.key === 'Delete' || e.key === 'Backspace') { 
            if(obj.type === 'activeSelection') { obj.getObjects().forEach((o:any) => w.canvas.remove(o)); w.canvas.discardActiveObject(); } else w.canvas.remove(obj); 
            w.canvas.requestRenderAll(); e.preventDefault(); return; 
        }
        const step = e.shiftKey ? 50 : 5; let dx = 0, dy = 0;
        if (e.key === 'ArrowLeft') { dx = -step; e.preventDefault(); } if (e.key === 'ArrowRight') { dx = step; e.preventDefault(); } if (e.key === 'ArrowUp') { dy = -step; e.preventDefault(); } if (e.key === 'ArrowDown') { dy = step; e.preventDefault(); }
        if (dx || dy) { obj.set({left: obj.left + dx, top: obj.top + dy}); obj.setCoords(); w.canvas.requestRenderAll(); w.edUpdatePanel(); }
      });
    };

    initApp();
    return () => { const w = window as any; if(w.canvas) w.canvas.dispose(); };
  },[]);

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
        .spotify-poster-page .btn-outline { background: transparent; color: var(--spotify-text); border: 1px solid var(--panel-border); width: 100%; } .spotify-poster-page .btn-outline:hover { border-color: var(--accent); color: var(--accent); }
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
        .spotify-poster-page #poster-wrapper { position: relative; z-index: 1; display: flex; flex-direction: column; align-items: center; gap: 20px; }
        .spotify-poster-page #poster-container { position: relative; overflow: hidden; box-shadow: 0 32px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.05); border-radius: 4px; transition: width 0.4s cubic-bezier(0.4,0,0.2,1), height 0.4s cubic-bezier(0.4,0,0.2,1); }
        .spotify-poster-page #poster { width: 100%; height: 100%; position: relative; overflow: hidden; display: flex; flex-direction: column; align-items: center; justify-content: center; }
        .spotify-poster-page #poster-bg { position: absolute; top: -2px; left: -2px; bottom: -2px; right: -2px; background: #f5f5f5; z-index: 0; }
        .spotify-poster-page #poster-bg-img { position: absolute; top: -5%; left: -5%; right: -5%; bottom: -5%; background-size: cover; background-position: center; background-repeat: no-repeat; display: none; z-index: 1; }
        .spotify-poster-page #poster-bg-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.5); z-index: 2; display: none; }
        .spotify-poster-page #poster-content { position: relative; z-index: 10; width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; }
        
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
        .spotify-poster-page .ed-el { outline: 1.5px solid transparent; cursor: pointer; transition: outline-color 0.1s; position: relative; transform-origin: top left; } .spotify-poster-page .ed-el:hover { outline-color: rgba(29,185,84,0.45) !important; } .spotify-poster-page .ed-el.ed-selected { outline-color: #1DB954 !important; } .spotify-poster-page .ed-el.ed-selected::before { content: ''; position: absolute; inset: 0; background: rgba(29,185,84,0.04); pointer-events: none; z-index: 0; }
        .spotify-poster-page #ed-marquee { position: absolute; border: 1px dashed #1DB954; background: rgba(29,185,84,0.05); pointer-events: none; display: none; z-index: 9999; }
        .spotify-poster-page #ed-align-bar { position: absolute; top: 10px; left: 50%; transform: translateX(-50%); background: #111; border: 1px solid var(--panel-border); border-radius: 8px; display: none; align-items: center; gap: 2px; padding: 4px 6px; z-index: 500; box-shadow: 0 4px 16px rgba(0,0,0,0.6); } .spotify-poster-page #ed-align-bar.ed-bar-visible { display: flex; }
        .spotify-poster-page .ed-ab-btn { width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; background: none; border: none; color: var(--spotify-subtext); border-radius: 5px; cursor: pointer; transition: all 0.15s; } .spotify-poster-page .ed-ab-btn:hover { background: #1a1a1a; color: var(--spotify-text); }
        .spotify-poster-page .ed-ab-sep { width: 1px; height: 18px; background: var(--panel-border); margin: 0 3px; }
        .spotify-poster-page .pf-section { margin-bottom: 4px; } .spotify-poster-page .pf-section-title { font-size: 9px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #555; margin: 12px 0 6px; }
        .spotify-poster-page .pf-row { margin-bottom: 7px; } .spotify-poster-page .pf-row label { display: block; font-size: 10px; color: var(--spotify-subtext); margin-bottom: 3px; }
        .spotify-poster-page .pf-row input[type=text], .spotify-poster-page .pf-row input[type=number], .spotify-poster-page .pf-row select { width: 100%; background: var(--input-bg); border: 1px solid var(--input-border); border-radius: 5px; color: var(--spotify-text); padding: 5px 8px; font-size: 11px; font-family: 'DM Sans', sans-serif; outline: none; transition: border-color 0.15s; } .spotify-poster-page .pf-row input:focus, .spotify-poster-page .pf-row select:focus { border-color: var(--accent); } .spotify-poster-page .pf-row select option { background: #1a1a1a; }
        .spotify-poster-page .pf-row input[type=range] { width: 100%; accent-color: var(--accent); cursor: pointer; } .spotify-poster-page .pf-row input[type=color] { width: 30px; height: 26px; border: none; border-radius: 4px; cursor: pointer; padding: 2px; background: var(--input-bg); }
        .spotify-poster-page .pf-2col { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; } .spotify-poster-page .pf-3col { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 4px; }
        .spotify-poster-page .pf-color-row { display: flex; gap: 6px; align-items: center; } .spotify-poster-page .pf-color-row input[type=text] { flex: 1; }
        .spotify-poster-page .pf-range-row { display: flex; align-items: center; gap: 6px; } .spotify-poster-page .pf-range-val { font-size: 10px; color: var(--accent); font-weight: 600; min-width: 32px; text-align: right; }
        .spotify-poster-page .pf-toggle-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; } .spotify-poster-page .pf-toggle-row > span { font-size: 11px; color: var(--spotify-subtext); }
        .spotify-poster-page .pf-divider { border: none; border-top: 1px solid #1e1e1e; margin: 10px 0; }
        .spotify-poster-page .pf-btn-row { display: flex; gap: 4px; } .spotify-poster-page .pf-btn { flex: 1; padding: 5px 4px; background: var(--input-bg); border: 1px solid var(--input-border); border-radius: 4px; color: var(--spotify-subtext); font-size: 10px; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.15s; text-align: center; } .spotify-poster-page .pf-btn:hover { background: #252525; color: var(--spotify-text); }
        .canvas-container { margin: 0 auto; }
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

        <button className="accordion-btn open" onClick={(e) => (window as any).toggleAccordion(e.currentTarget)}>🔤 Top & Bottom Texts<span className="arrow">▼</span></button>
        <div className="accordion-content open">
            <div className="form-row">
                <label>Artist Name (Top Left) Text</label>
                <input type="text" id="v-label-input" defaultValue="ARTIST NAME" onInput={(e: any) => {
                    const obj = (window as any).canvas.getObjects().find((o:any) => o.id === 'v-top-left');
                    if(obj) { obj.set('text', e.target.value); (window as any).canvas.renderAll(); }
                }} />
            </div>
            <div className="form-row">
                <label>Artist Name (Top Left) Color</label>
                <div className="color-row">
                    <input type="color" id="c-v-tl" defaultValue="#212121" onInput={(e:any)=>{ 
                        const obj = (window as any).canvas.getObjects().find((o:any) => o.id === 'v-top-left');
                        if(obj) { obj.set('fill', e.target.value); (window as any).canvas.renderAll(); }
                        (window as any).syncColor('c-v-tl', 'c-v-tl-t'); 
                    }} />
                    <input type="text" id="c-v-tl-t" defaultValue="#212121" onInput={(e:any)=>{ 
                        (window as any).syncColor('c-v-tl-t', 'c-v-tl'); 
                        const obj = (window as any).canvas.getObjects().find((o:any) => o.id === 'v-top-left');
                        if(obj) { obj.set('fill', document.getElementById('c-v-tl-t')!.value); (window as any).canvas.renderAll(); }
                    }} />
                </div>
            </div>

            <div className="form-row" style={{ marginTop: '12px' }}>
                <label>Year (Top Right) Text</label>
                <input type="text" id="v-year-input" defaultValue="1992" onInput={(e: any) => {
                    const obj = (window as any).canvas.getObjects().find((o:any) => o.id === 'v-top-right');
                    if(obj) { obj.set('text', e.target.value); (window as any).canvas.renderAll(); }
                }} />
            </div>
            <div className="form-row">
                <label>Year Color</label>
                <div className="color-row">
                    <input type="color" id="c-v-tr" defaultValue="#212121" onInput={(e:any)=>{ 
                        const obj = (window as any).canvas.getObjects().find((o:any) => o.id === 'v-top-right');
                        if(obj) { obj.set('fill', e.target.value); (window as any).canvas.renderAll(); }
                        (window as any).syncColor('c-v-tr', 'c-v-tr-t'); 
                    }} />
                    <input type="text" id="c-v-tr-t" defaultValue="#212121" onInput={(e:any)=>{ 
                        (window as any).syncColor('c-v-tr-t', 'c-v-tr'); 
                        const obj = (window as any).canvas.getObjects().find((o:any) => o.id === 'v-top-right');
                        if(obj) { obj.set('fill', document.getElementById('c-v-tr-t')!.value); (window as any).canvas.renderAll(); }
                    }} />
                </div>
            </div>

            <div className="form-row" style={{ marginTop: '12px' }}>
                <label>Bottom Text (Album Name / Optional)</label>
                <input type="text" id="v-bottom-input" defaultValue="UNKNOWN ALBUM" onInput={(e: any) => {
                    const obj = (window as any).canvas.getObjects().find((o:any) => o.id === 'v-bottom-text');
                    if(obj) { obj.set('text', e.target.value); (window as any).canvas.renderAll(); }
                }} />
            </div>
            <div className="form-row">
                <label>Bottom Text Color</label>
                <div className="color-row">
                    <input type="color" id="c-v-bot" defaultValue="#555555" onInput={(e:any)=>{ 
                        const obj = (window as any).canvas.getObjects().find((o:any) => o.id === 'v-bottom-text');
                        if(obj) { obj.set('fill', e.target.value); (window as any).canvas.renderAll(); }
                        (window as any).syncColor('c-v-bot', 'c-v-bot-t'); 
                    }} />
                    <input type="text" id="c-v-bot-t" defaultValue="#555555" onInput={(e:any)=>{ 
                        (window as any).syncColor('c-v-bot-t', 'c-v-bot'); 
                        const obj = (window as any).canvas.getObjects().find((o:any) => o.id === 'v-bottom-text');
                        if(obj) { obj.set('fill', document.getElementById('c-v-bot-t')!.value); (window as any).canvas.renderAll(); }
                    }} />
                </div>
            </div>
        </div>

        <button className="accordion-btn open" onClick={(e) => (window as any).toggleAccordion(e.currentTarget)}>🎵 Song Details<span className="arrow">▼</span></button>
        <div className="accordion-content open">
            <div className="form-row">
                <label>Song Title Text</label>
                <input type="text" id="v-song-title-input" defaultValue="SONG NAME" onInput={(e: any) => {
                    const obj = (window as any).canvas.getObjects().find((o:any) => o.id === 'v-song-title');
                    if(obj) { obj.set('text', e.target.value); (window as any).canvas.renderAll(); }
                }} />
            </div>
            <div className="form-row">
                <label>Song Title Color</label>
                <div className="color-row">
                    <input type="color" id="c-v-st" defaultValue="#212121" onInput={(e:any)=>{ 
                        const obj = (window as any).canvas.getObjects().find((o:any) => o.id === 'v-song-title');
                        if(obj) { obj.set('fill', e.target.value); (window as any).canvas.renderAll(); }
                        (window as any).syncColor('c-v-st', 'c-v-st-t'); 
                    }} />
                    <input type="text" id="c-v-st-t" defaultValue="#212121" onInput={(e:any)=>{ 
                        (window as any).syncColor('c-v-st-t', 'c-v-st'); 
                        const obj = (window as any).canvas.getObjects().find((o:any) => o.id === 'v-song-title');
                        if(obj) { obj.set('fill', document.getElementById('c-v-st-t')!.value); (window as any).canvas.renderAll(); }
                    }} />
                </div>
            </div>
        </div>

        <button className="accordion-btn open" onClick={(e) => (window as any).toggleAccordion(e.currentTarget)}>💿 Vinyl Record & Lyrics<span className="arrow">▼</span></button>
        <div className="accordion-content open">
            <div className="form-row" style={{ display: 'none' }}>
                <input type="hidden" id="vinyl-text-size" defaultValue="12" />
                <input type="hidden" id="v-vinyl-label-size" defaultValue="50" />
                <input type="hidden" id="v-vinyl-size" defaultValue="85" />
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
        <div id="poster-wrapper">
          <div id="poster-container" style={{ width: '420px', height: '525px', position: 'relative' }}>
            <canvas id="poster-canvas"></canvas>
          </div>
        </div>
      </div>

      <div id="props-panel">
        <div id="props-header">Properties<span id="props-selected-name"></span></div>
        <div id="props-body">
          <div id="props-empty-state"><p>Click an element on the canvas</p></div>
          <div id="props-fields" style={{ display: 'none' }}></div>
        </div>
      </div>

      <div id="toast">Operation completed successfully</div>
    </div>
  );
}
