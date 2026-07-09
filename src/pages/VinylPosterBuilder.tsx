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
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
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

      w.updateCanvasSize = function() {
        const selectEl = document.getElementById('canvas-size') as HTMLSelectElement;
        if(!selectEl) return;
        const key = selectEl.value;
        const[w_size, h_size] = w.CANVAS_SIZES[key];
        const ratio = w_size / h_size;

        const area = document.getElementById('canvas-area');
        if(!area) return;
        const areaW = area.clientWidth - 80;
        const areaH = area.clientHeight - 80;

        let pw, ph;
        if (areaW / ratio <= areaH) {
          pw = areaW;
          ph = areaW / ratio;
        } else {
          ph = areaH;
          pw = areaH * ratio;
        }

        pw = Math.floor(pw);
        ph = Math.floor(ph);

        const container = document.getElementById('poster-container');
        if(container) {
            container.style.width = pw + 'px';
            container.style.height = ph + 'px';
        }
      };

      window.addEventListener('resize', w.updateCanvasSize);

      w.itemPositions = {};
      w.setPos = function(id: string, axis: string, val: string) {
        if(!w.itemPositions[id]) w.itemPositions[id] = {x:0, y:0};
        w.itemPositions[id][axis] = parseFloat(val);
        const el = document.getElementById(id);
        if(el) el.style.transform = `translate(${w.itemPositions[id].x}px, ${w.itemPositions[id].y}px)`;
      };

      // ──────────────────────────────────────────────────────────
      // BACKGROUND LOGIC (VINYL ONLY)
      // ──────────────────────────────────────────────────────────
      w.vCurrentCoverSrc = ''; 

      w.updateVinylBgBlur = function() {
        const blurEl = document.getElementById('v-blur-val') as HTMLInputElement;
        if (!blurEl || !w.vCurrentCoverSrc) return;
        const blur = blurEl.value;
        const brightness = "100";
        
        const blurDisp = document.getElementById('v-blur-display');
        if (blurDisp) blurDisp.textContent = blur + 'px';
        
        const bgImgDiv = document.getElementById('poster-bg-img') as HTMLElement;
        const tempImg = new Image();
        tempImg.crossOrigin = "Anonymous";
        
        tempImg.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = 800;
          canvas.height = 800;

          if (ctx) {
             ctx.filter = `blur(${blur}px) brightness(${parseFloat(brightness)/100})`;
             const margin = parseInt(blur) * 3;
             ctx.drawImage(tempImg, -margin, -margin, canvas.width + margin * 2, canvas.height + margin * 2);
          }

          try {
            const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
            if (bgImgDiv) bgImgDiv.style.backgroundImage = `url(${dataUrl})`;
          } catch (e) {
            console.error(e);
          }
        };
        tempImg.src = w.vCurrentCoverSrc;
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

        const setCol = (id: string, col: string) => { const el = document.getElementById(id); if(el) el.style.color = col; };
        setCol('v-top-left', mainTextCol);
        setCol('v-top-right', mainTextCol);
        setCol('v-song-title', mainTextCol);
        setCol('v-bottom-text', subTextCol);

        const spText = document.getElementById('v-spiral-text');
        if(spText) spText.setAttribute('fill', mainTextCol);
        
        const vLabel = document.getElementById('v-vinyl-label');
        if(vLabel) vLabel.setAttribute('fill', labelCol);

        const setInp = (id: string, col: string) => { 
          const el = document.getElementById(id) as HTMLInputElement; if(el) el.value = col; 
          const txt = document.getElementById(id+'-t') as HTMLInputElement; if(txt) txt.value = col;
        };
        setInp('c-v-tl', mainTextCol);
        setInp('c-v-tr', mainTextCol);
        setInp('c-v-st', mainTextCol);
        setInp('c-v-bot', subTextCol);
      };

      w.updateBgColor = function() {
        const colorEl = document.getElementById('v-bg-color') as HTMLInputElement;
        const txtEl = document.getElementById('v-bg-color-txt') as HTMLInputElement;
        if(!colorEl) return;
        const color = colorEl.value;
        document.getElementById('poster-bg')!.style.background = color;
        if(txtEl) txtEl.value = color;
        w.applyAutoContrast(color);
      };

      w.updateVinylBg = function() {
        const type = (document.getElementById('v-bg-type') as HTMLSelectElement).value;
        const bgColorSection = document.getElementById('v-bg-color-section');
        const bgBlurSection = document.getElementById('v-bg-blur-section');
        const bgImg = document.getElementById('poster-bg-img');
        const posterBg = document.getElementById('poster-bg');

        if (type === 'color') {
          if(bgColorSection) bgColorSection.style.display = 'block';
          if(bgBlurSection) bgBlurSection.style.display = 'none';
          if(bgImg) bgImg.style.display = 'none';
          w.updateBgColor();
        } else {
          if(bgColorSection) bgColorSection.style.display = 'none';
          if(bgBlurSection) bgBlurSection.style.display = 'block';
          if(posterBg) posterBg.style.background = 'none';
          if(bgImg) bgImg.style.display = w.vCurrentCoverSrc ? 'block' : 'none';
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
            const bgImgDiv = document.getElementById('poster-bg-img') as HTMLElement;
            if (bgImgDiv) {
                bgImgDiv.style.backgroundImage = `url(${e.target.result})`;
                const btype = document.getElementById('v-bg-type') as HTMLSelectElement;
                if (btype && btype.value === 'blur') {
                    bgImgDiv.style.display = 'block';
                    w.updateVinylBgBlur();
                }
            }
        };
        reader.readAsDataURL(file);
      };

      w.updateTextColor = function(id: string, color: string) {
        const el = document.getElementById(id);
        if (el) el.style.color = color;
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
        const vtitle = document.getElementById('v-song-title');
        if(vtitle) vtitle.textContent = item.trackName.toUpperCase();

        const tinp = document.getElementById('v-song-title-input') as HTMLInputElement;
        if(tinp) tinp.value = item.trackName.toUpperCase();
        
        const year = new Date(item.releaseDate).getFullYear() || "1992";
        const yearEl = document.getElementById('v-top-right');
        if(yearEl) yearEl.textContent = year.toString();
        const yearInp = document.getElementById('v-year-input') as HTMLInputElement;
        if(yearInp) yearInp.value = year.toString();

        const album = item.collectionName ? item.collectionName.toUpperCase() : "UNKNOWN ALBUM";
        const bottomEl = document.getElementById('v-bottom-text');
        if (bottomEl) bottomEl.textContent = album;
        const bottomInp = document.getElementById('v-bottom-input') as HTMLInputElement;
        if (bottomInp) bottomInp.value = album;

        let artistLabel = item.artistName || 'ARTIST NAME';
        const labelEl = document.getElementById('v-top-left');
        if (labelEl) labelEl.textContent = artistLabel.toUpperCase();
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
      };

      // --- VINYL SPECIFIC LOGIC ---
      w.updateVinylSpiral = function() {
          const pathEl = document.getElementById('v-spiral-path');
          if(!pathEl) return;
          
          const fs = parseInt((document.getElementById('vinyl-text-size') as HTMLInputElement)?.value || "12");
          const input = (document.getElementById('vinyl-lyrics-input') as HTMLTextAreaElement)?.value || "LOREM IPSUM...";
          
          const textLen = input.length * (fs * 0.6); 
          const minR = 100;
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
          
          let svgSize = 800; let cx = 400; let cy = 400;
          if (maxR > 380) { svgSize = (maxR + 30) * 2; cx = svgSize / 2; cy = svgSize / 2; }

          const svgEl = document.getElementById('vinyl-svg');
          if(svgEl) {
              svgEl.setAttribute('viewBox', `0 0 ${svgSize} ${svgSize}`);
              document.getElementById('v-vinyl-bg')?.setAttribute('cx', cx.toString());
              document.getElementById('v-vinyl-bg')?.setAttribute('cy', cy.toString());
              document.getElementById('v-vinyl-bg')?.setAttribute('r', (maxR + 15).toString());
              
              document.getElementById('v-vinyl-groove1')?.setAttribute('cx', cx.toString());
              document.getElementById('v-vinyl-groove1')?.setAttribute('cy', cy.toString());
              document.getElementById('v-vinyl-groove2')?.setAttribute('cx', cx.toString());
              document.getElementById('v-vinyl-groove2')?.setAttribute('cy', cy.toString());
              
              document.getElementById('v-vinyl-label')?.setAttribute('cx', cx.toString());
              document.getElementById('v-vinyl-label')?.setAttribute('cy', cy.toString());
              document.getElementById('v-vinyl-hole')?.setAttribute('cx', cx.toString());
              document.getElementById('v-vinyl-hole')?.setAttribute('cy', cy.toString());
          }

          let points = []; let steps = Math.ceil(loops * 100);
          for(let i=0; i<=steps; i++) {
              let t = -Math.PI/2 + (i/steps) * loops * Math.PI * 2;
              let r = minR + ((maxR - minR) * (i/steps));
              let x = cx + r * Math.cos(t); let y = cy + r * Math.sin(t);
              if(i===0) points.push(`M ${x} ${y}`); else points.push(`L ${x} ${y}`);
          }
          pathEl.setAttribute('d', points.join(' '));
          w.updateVinylLyrics();
      };

      w.updateVinylLyrics = function() {
          const input = (document.getElementById('vinyl-lyrics-input') as HTMLTextAreaElement)?.value || "LOREM IPSUM...";
          const textEl = document.getElementById('v-spiral-text');
          if(!textEl) return;
          
          const fs = parseInt((document.getElementById('vinyl-text-size') as HTMLInputElement)?.value || "12");
          const textLen = input.length * (fs * 0.6);
          const minR = 100; const spacing = fs * 1.2;
          const standardLen = Math.PI * (380 + minR) * (380 - minR) / spacing;
          
          let finalStr = input.trim();
          if (textLen < standardLen) {
             let repeats = Math.ceil(standardLen / (textLen + 20));
             let arr = []; for(let k=0; k<repeats; k++) arr.push(finalStr);
             finalStr = arr.join(' • ');
          }
          textEl.textContent = finalStr.toUpperCase();
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

      w.getExportFilename = function(ext: string) {
        let artist = ((document.getElementById('v-label-input') as HTMLInputElement)?.value || 'artist').replace(/[^a-z0-9]/gi, '-').toLowerCase();
        let song = ((document.getElementById('v-song-title-input') as HTMLInputElement)?.value || 'song').replace(/[^a-z0-9]/gi, '-').toLowerCase();
        const size = (document.getElementById('canvas-size') as HTMLSelectElement).value;
        const now = new Date(); const date = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
        const hour = String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0');
        return `vinyl-${artist}-${song}-${size}-${date}-${hour}.${ext}`;
      };

      w.generateSafeCanvas = async function(container: HTMLElement, scale: number) {
        const origBoxShadow = container.style.boxShadow; container.style.boxShadow = 'none';
        const currentScrollX = window.scrollX; const currentScrollY = window.scrollY; window.scrollTo(0, 0);
        try {
          const generatedCanvas = await w.html2canvas(container, {
            scale: scale, useCORS: true, allowTaint: true, backgroundColor: document.getElementById('poster-bg')?.style.background || '#f5f5f5', scrollX: 0, scrollY: 0
          });
          window.scrollTo(currentScrollX, currentScrollY); container.style.boxShadow = origBoxShadow; return generatedCanvas;
        } catch (error) { window.scrollTo(currentScrollX, currentScrollY); container.style.boxShadow = origBoxShadow; throw error; }
      };

      w.changeDpiDataUrl = function(base64: string, dpi: number) {
        const dataArray = new Uint8Array(atob(base64.split(',')[1]).split('').map(c => c.charCodeAt(0)));
        const format = 'image/png'; const ppm = Math.round(dpi / 0.0254); let offset = 8;
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
          } offset += 12 + length;
        } return base64;
      };

      w.exportVinylLoop = async function(format: string) {
          w.edDeselect(); 
          const items = document.querySelectorAll('.multi-export-item');
          const colorsToExport: string[] = [];
          items.forEach((item: any) => {
              const chk = item.querySelector('.export-color-check') as HTMLInputElement;
              const pck = item.querySelector('.export-color-picker') as HTMLInputElement;
              if (chk && chk.checked && pck) colorsToExport.push(pck.value);
          });

          if (colorsToExport.length === 0) { w.showToast('Lütfen dışa aktarmak için en az bir renk seçin.'); return; }

          const posterBg = document.getElementById('poster-bg'); if(!posterBg) return;
          const originalBg = posterBg.style.background;
          w.showToast(`${colorsToExport.length} renk için ZIP hazırlanıyor... Lütfen bekleyin.`);

          const container = document.getElementById('poster-container');
          const key = (document.getElementById('canvas-size') as HTMLSelectElement).value;
          const [wIn, hIn] = w.CANVAS_SIZES[key];
          
          let targetWidthPx = Math.round(wIn * 300); let targetHeightPx = Math.round(hIn * 300);
          let scale = targetWidthPx / container!.offsetWidth;

          const MAX_DIMENSION = 16000;
          if (targetWidthPx > MAX_DIMENSION || targetHeightPx > MAX_DIMENSION) {
              const limitScale = Math.min(MAX_DIMENSION / targetWidthPx, MAX_DIMENSION / targetHeightPx);
              scale = scale * limitScale; targetWidthPx = Math.round(targetWidthPx * limitScale); targetHeightPx = Math.round(targetHeightPx * limitScale);
          }

          const zip = new (window as any).JSZip(); const folder = zip.folder(`vinyl-posters-${format}`);

          for (let i = 0; i < colorsToExport.length; i++) {
              const color = colorsToExport[i];
              posterBg.style.background = color;
              
              const bgImgDiv = document.getElementById('poster-bg-img') as HTMLElement;
              const originalBgImgDisplay = bgImgDiv ? bgImgDiv.style.display : 'none';
              if(bgImgDiv) bgImgDiv.style.display = 'none'; 
              
              w.applyAutoContrast(color);
              await new Promise(r => setTimeout(r, 150));

              try {
                  const canvas = await w.generateSafeCanvas(container, scale);
                  let baseFilename = w.getExportFilename(format);
                  let filename = baseFilename.replace(`.${format}`, `-${color.replace('#', '')}.${format}`);

                  if (format === 'png') {
                      const base64Data = canvas.toDataURL('image/png', 1.0);
                      const dpiFixedData = w.changeDpiDataUrl(base64Data, 300);
                      const base64Content = dpiFixedData.split(',')[1];
                      folder.file(filename, base64Content, {base64: true});
                  } else if (format === 'pdf') {
                      const { jsPDF } = w.jspdf;
                      const pdf = new jsPDF({ orientation: wIn > hIn ? 'landscape' : 'portrait', unit: 'in', format: [wIn, hIn] });
                      const imgData = canvas.toDataURL('image/jpeg', 0.95);
                      pdf.addImage(imgData, 'JPEG', 0, 0, wIn, hIn);
                      const pdfArrayBuffer = pdf.output('arraybuffer');
                      folder.file(filename, pdfArrayBuffer);
                  } else if (format === 'svg') {
                      const imgData = canvas.toDataURL('image/png', 1.0);
                      const svgContent = `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${targetWidthPx}" height="${targetHeightPx}" viewBox="0 0 ${targetWidthPx} ${targetHeightPx}">\n  <image href="${imgData}" x="0" y="0" width="${targetWidthPx}" height="${targetHeightPx}"/>\n</svg>`;
                      folder.file(filename, svgContent);
                  }
              } catch(e) {}
              if(bgImgDiv) bgImgDiv.style.display = originalBgImgDisplay;
          }

          zip.generateAsync({type:"blob"}).then(function(content: Blob) {
              const url = URL.createObjectURL(content); const link = document.createElement('a');
              link.download = `Vinyl-Posters-${new Date().getTime()}.zip`; link.href = url; link.click(); URL.revokeObjectURL(url);
              w.showToast(`✓ ZIP dosyası indirildi!`);
          });

          posterBg.style.background = originalBg;
          const currentType = (document.getElementById('v-bg-type') as HTMLSelectElement)?.value || 'color';
          if (currentType === 'color') w.applyAutoContrast(originalBg); else w.applyAutoContrast('#121212');
      };

      w.downloadPNG = async function() { await w.exportVinylLoop('png'); };
      w.downloadPDF = async function() { await w.exportVinylLoop('pdf'); };
      w.downloadSVG = async function() { await w.exportVinylLoop('svg'); };

      // ══════════════════════════════════════════════════════════════
      // EDITOR ENGINE
      // ══════════════════════════════════════════════════════════════

      w.ED_LABELS = { 'v-top-left': 'Artist Name', 'v-top-right': 'Year', 'v-song-title': 'Vinyl Song Title', 'v-vinyl': 'Vinyl Record Graphic', 'v-bottom': 'Bottom Text' };
      w.edSel =[]; w.edDragState = null; w.edMarqState = null; w.edOffsets = {}; w.edEl = function(id: string) { return document.querySelector(`[data-ed="${id}"]`) as HTMLElement; };

      w.edInitOffsets = function() { document.querySelectorAll('.ed-el').forEach((el: any) => { const id = el.dataset.ed; if (!w.edOffsets[id]) w.edOffsets[id] = { tx: 0, ty: 0 }; w.edApplyTransform(id); }); };
      w.edApplyTransform = function(id: string) { const el = w.edEl(id); if (!el) return; const o = w.edOffsets[id] || { tx: 0, ty: 0 }; const cur = el.style.transform.replace(/translate\([^)]+\)/g, '').trim(); el.style.transform = `translate(${o.tx}px,${o.ty}px)${cur ? ' ' + cur : ''}`; };

      w.edSelect = function(id: string, additive: boolean) { if (!additive) { w.edSel.forEach((s: string) => w.edEl(s)?.classList.remove('ed-selected')); w.edSel =[]; } if (id && !w.edSel.includes(id)) { w.edSel.push(id); w.edEl(id)?.classList.add('ed-selected'); } w.edUpdatePanel(); w.edUpdateAlignBar(); };
      w.edDeselect = function() { w.edSel.forEach((s: string) => w.edEl(s)?.classList.remove('ed-selected')); w.edSel =[]; w.edUpdatePanel(); w.edUpdateAlignBar(); };

      w.edAlign = function(mode: string) {
        if (!w.edSel.length) return; const pc = document.getElementById('poster-container'); const pcW = pc!.offsetWidth, pcH = pc!.offsetHeight; const pcR = pc!.getBoundingClientRect();
        w.edSel.forEach((id: string) => {
          const el = w.edEl(id); if (!el) return; const er = el.getBoundingClientRect(); const ew = er.width, eh = er.height; const o = w.edOffsets[id] || { tx: 0, ty: 0 };
          const localX = er.left - pcR.left - o.tx; const localY = er.top  - pcR.top  - o.ty;
          if (mode === 'left') o.tx = -localX; if (mode === 'right') o.tx = pcW - ew - localX; if (mode === 'cx') o.tx = (pcW - ew) / 2 - localX;
          if (mode === 'top') o.ty = -localY; if (mode === 'bottom') o.ty = pcH - eh - localY; if (mode === 'cy') o.ty = (pcH - eh) / 2 - localY;
          w.edOffsets[id] = o; w.edApplyTransform(id);
        });
      };

      w.edDistribute = function(axis: string) {
        if (w.edSel.length < 3) return; const pcR = document.getElementById('poster-container')!.getBoundingClientRect();
        const items = w.edSel.map((id: string) => { const el = w.edEl(id); const er = el.getBoundingClientRect(); const o = w.edOffsets[id] || { tx: 0, ty: 0 }; return { id, el, er, o, pos: axis === 'h' ? er.left - pcR.left - o.tx : er.top - pcR.top - o.ty, size: axis === 'h' ? er.width : er.height }; }).sort((a: any, b: any) => a.pos - b.pos);
        const first = items[0], last = items[items.length - 1]; const totalSpan = (last.pos + last.size) - first.pos; const totalSize = items.reduce((s: number, it: any) => s + it.size, 0); const gap = (totalSpan - totalSize) / (items.length - 1); let cursor = first.pos + first.size + gap;
        items.slice(1, -1).forEach((it: any) => { if (axis === 'h') it.o.tx = cursor - it.pos + it.o.tx; else it.o.ty = cursor - it.pos + it.o.ty; w.edOffsets[it.id] = it.o; w.edApplyTransform(it.id); cursor += it.size + gap; });
      };

      w.edUpdateAlignBar = function() { document.getElementById('ed-align-bar')!.classList.toggle('ed-bar-visible', w.edSel.length > 0); };
      w.edUpdatePanelPos = function() { if (w.edSel.length !== 1) return; const id = w.edSel[0]; const o = w.edOffsets[id] || { tx: 0, ty: 0 }; const xi = document.getElementById('epx') as HTMLInputElement; if (xi) xi.value = Math.round(o.tx).toString(); const yi = document.getElementById('epy') as HTMLInputElement; if (yi) yi.value = Math.round(o.ty).toString(); };
      
      w.edUpdatePanel = function() {
        const empty  = document.getElementById('props-empty-state'); const fields = document.getElementById('props-fields'); const nameEl = document.getElementById('props-selected-name');
        if (w.edSel.length === 0) { if(empty) empty.style.display = ''; if(fields) fields.style.display = 'none'; if(nameEl) nameEl.textContent = ''; return; }
        if(empty) empty.style.display = 'none'; if(fields) fields.style.display = '';
        if (w.edSel.length > 1) { if(nameEl) nameEl.textContent = w.edSel.length + ' elements'; if(fields) fields.innerHTML = w.edBuildMulti(); return; }
        const id = w.edSel[0]; if(nameEl) nameEl.textContent = w.ED_LABELS[id] || id; if(fields) fields.innerHTML = w.edBuildSingle(id);
      };

      w.edRgbHex = function(rgb: string) { if (!rgb || rgb === 'transparent') return '#ffffff'; if (rgb.startsWith('#')) return rgb; const m = rgb.match(/\d+/g); if (!m || m.length < 3) return '#ffffff'; return '#' + m.slice(0,3).map(x => parseInt(x).toString(16).padStart(2,'0')).join(''); };
      w.edSetW = function(id: string, v: string) { const el = w.edEl(id); if (el) el.style.width  = v + 'px'; }; w.edSetH = function(id: string, v: string) { const el = w.edEl(id); if (el) el.style.height = v + 'px'; };
      w.edSetXY = function(id: string, axis: string, v: string) { if (!w.edOffsets[id]) w.edOffsets[id] = { tx: 0, ty: 0 }; if (axis === 'x') w.edOffsets[id].tx = parseFloat(v); else w.edOffsets[id].ty = parseFloat(v); w.edApplyTransform(id); };

      w.edSetText = function(id: string, val: string) {
        const el = w.edEl(id); if (!el) return;
        let tn = Array.from(el.childNodes).find((n: any) => n.nodeType === 3);
        if (tn) (tn as any).textContent = val; else el.insertBefore(document.createTextNode(val), el.firstChild);
        const map: any = { 'v-top-left': 'v-label-input', 'v-top-right': 'v-year-input', 'v-song-title': 'v-song-title-input', 'v-bottom': 'v-bottom-input' };
        const inp = document.getElementById(map[id]) as HTMLInputElement; if (inp) inp.value = val;
      };

      w.edBuildSingle = function(id: string) {
        const el = w.edEl(id); if (!el) return '';
        const o = w.edOffsets[id] || { tx:0, ty:0 }; const cs = getComputedStyle(el); const cw = Math.round(el.offsetWidth); const ch = Math.round(el.offsetHeight); const op = Math.round((parseFloat(el.style.opacity)||1)*100); const vis = el.style.display !== 'none';
        function cpair(initColor: string, oninput: string) { return `<div class="pf-color-row"><input type="color" value="${initColor}" oninput="const v=this.value; ${oninput.replace(/"/g,"'")}; this.nextElementSibling.value=v;"><input type="text" value="${initColor}" oninput="let v=this.value; if(/^#[0-9a-fA-F]{3}$/i.test(v)){v='#'+v[1]+v[1]+v[2]+v[2]+v[3]+v[3];} if(/^#[0-9a-fA-F]{6}$/i.test(v)){${oninput.replace(/this\.value/g,"v").replace(/"/g,"'")}; this.previousElementSibling.value=v;}"></div>`; }
        function rrow(min:number,max:number,step:number,val:number,oninput:string,unit='px') { return `<div class="pf-range-row"><input type="range" min="${min}" max="${max}" step="${step}" value="${val}" oninput="${oninput.replace(/"/g,"'")}; this.nextElementSibling.textContent=this.value+'${unit}'"><span class="pf-range-val">${val}${unit}</span></div>`; }
        const fontOpts = `<option value="'Abril Fatface', serif">Abril Fatface</option><option value="'Alfa Slab One', serif">Alfa Slab One</option><option value="'Anton', sans-serif">Anton</option><option value="'Archivo Black', sans-serif">Archivo Black</option><option value="'Bangers', cursive">Bangers</option><option value="'Bebas Neue', sans-serif">Bebas Neue</option><option value="'Bodoni Moda', serif">Bodoni Moda</option><option value="'Caveat', cursive">Caveat</option><option value="'Cinzel', serif">Cinzel</option><option value="'Cormorant Garamond', serif">Cormorant Garamond</option><option value="'Courgette', cursive">Courgette</option><option value="'DM Sans', sans-serif">DM Sans</option><option value="'Dancing Script', cursive">Dancing Script</option><option value="'EB Garamond', serif">EB Garamond</option><option value="'Fjalla One', sans-serif">Fjalla One</option><option value="'Great Vibes', cursive">Great Vibes</option><option value="'Inter', sans-serif">Inter</option><option value="'Josefin Sans', sans-serif">Josefin Sans</option><option value="'Kanit', sans-serif">Kanit</option><option value="'Lato', sans-serif">Lato</option><option value="'Libre Baskerville', serif">Libre Baskerville</option><option value="'Lobster', cursive">Lobster</option><option value="'Lora', serif">Lora</option><option value="'Merriweather', serif">Merriweather</option><option value="'Montserrat', sans-serif">Montserrat</option><option value="'Open Sans', sans-serif">Open Sans</option><option value="'Oswald', sans-serif">Oswald</option><option value="'PT Serif', serif">PT Serif</option><option value="'Pacifico', cursive">Pacifico</option><option value="'Patua One', serif">Patua One</option><option value="'Permanent Marker', cursive">Permanent Marker</option><option value="'Playfair Display', serif">Playfair Display</option><option value="'Poppins', sans-serif">Poppins</option><option value="'Prata', serif">Prata</option><option value="'Raleway', sans-serif">Raleway</option><option value="'Righteous', cursive">Righteous</option><option value="'Roboto', sans-serif">Roboto</option><option value="'Sacramento', cursive">Sacramento</option><option value="'Satisfy', cursive">Satisfy</option><option value="'Teko', sans-serif">Teko</option><option value="'Ubuntu', sans-serif">Ubuntu</option><option value="'Yellowtail', cursive">Yellowtail</option>`;

        let html = `<div class="pf-section"><div class="pf-section-title">Position &amp; Size</div><div class="pf-2col"><div class="pf-row"><label>X offset</label><input type="number" id="epx" value="${Math.round(o.tx)}" oninput="window.edSetXY('${id}','x',this.value)"></div><div class="pf-row"><label>Y offset</label><input type="number" id="epy" value="${Math.round(o.ty)}" oninput="window.edSetXY('${id}','y',this.value)"></div></div><div class="pf-2col"><div class="pf-row"><label>Width (px)</label><input type="number" value="${cw}" oninput="window.edSetW('${id}',this.value)"></div><div class="pf-row"><label>Height (px)</label><input type="number" value="${ch}" oninput="window.edSetH('${id}',this.value)"></div></div></div><hr class="pf-divider"><div class="pf-section"><div class="pf-section-title">Visibility</div><div class="pf-toggle-row"><span>Visible</span><label class="toggle"><input type="checkbox" ${vis?'checked':''} onchange="window.edEl('${id}').style.display=this.checked?'':'none'"><span class="slider"></span></label></div><div class="pf-row"><label>Opacity</label>${rrow(0,100,1,op, `window.edEl('${id}').style.opacity=this.value/100`, '%')}</div></div>`;

        if (['v-top-left','v-top-right','v-song-title','v-bottom'].includes(id)) {
          const tn  = Array.from(el.childNodes).find((n: any)=>n.nodeType===3);
          const txt = (tn ? (tn as any).textContent!.trim() : el.innerText.trim()).replace(/"/g,'&quot;');
          const fs  = parseInt(cs.fontSize)||14; const fw = cs.fontWeight; const col = w.edRgbHex(cs.color); const ls = parseFloat(cs.letterSpacing)||0;
          const lhRaw = parseFloat(cs.lineHeight); const lh = isNaN(lhRaw) ? "1.2" : (lhRaw / (parseFloat(cs.fontSize)||14)).toFixed(2);
          const isUC = cs.textTransform === 'uppercase'; const ff = cs.fontFamily.replace(/"/g, "'");

          html += `<hr class="pf-divider"><div class="pf-section"><div class="pf-section-title">Text properties</div><div class="pf-row"><label>Content</label><input type="text" value="${txt}" oninput="window.edSetText('${id}',this.value)"></div><div class="pf-row"><label>Font Family</label><select onchange="window.edEl('${id}').style.fontFamily=this.value"><option value="${ff}" selected>Current Font</option>${fontOpts}</select></div><div class="pf-2col"><div class="pf-row"><label>Font Size</label><input type="number" value="${fs}" min="6" max="200" oninput="window.edEl('${id}').style.fontSize=this.value+'px'"></div><div class="pf-row"><label>Weight</label><select onchange="window.edEl('${id}').style.fontWeight=this.value"><option value="300" ${fw==='300'?'selected':''}>Light</option><option value="400" ${fw==='400'||fw==='normal'?'selected':''}>Regular</option><option value="500" ${fw==='500'?'selected':''}>Medium</option><option value="600" ${fw==='600'?'selected':''}>SemiBold</option><option value="700" ${fw==='700'||fw==='bold'?'selected':''}>Bold</option><option value="900" ${fw==='900'?'selected':''}>Black</option></select></div></div><div class="pf-row"><label>Letter Spacing</label>${rrow(-5,30,0.5,ls, `window.edEl('${id}').style.letterSpacing=this.value+'px'`)}</div><div class="pf-row"><label>Line Height</label>${rrow(0.8,4,0.05,parseFloat(lh), `window.edEl('${id}').style.lineHeight=this.value`, '')}</div><div class="pf-row"><label>Alignment</label><div class="pf-3col"><button class="pf-btn" onclick="window.edEl('${id}').style.textAlign='left'">Left</button><button class="pf-btn" onclick="window.edEl('${id}').style.textAlign='center'">Center</button><button class="pf-btn" onclick="window.edEl('${id}').style.textAlign='right'">Right</button></div></div><div class="pf-toggle-row"><span>Uppercase</span><label class="toggle"><input type="checkbox" ${isUC?'checked':''} onchange="window.edEl('${id}').style.textTransform=this.checked?'uppercase':'none'"><span class="slider"></span></label></div></div><hr class="pf-divider"><div class="pf-section"><div class="pf-section-title">Text Color</div><div class="pf-row">${cpair(col, `window.edEl('${id}').style.color=this.value`)}</div></div>`;
        }

        if (id === 'v-vinyl') {
          const vs = document.getElementById('v-spiral-text');
          const tcol = vs ? w.edRgbHex(vs.getAttribute('fill') || '#b3b3b3') : '#b3b3b3';
          const tsz = vs ? parseInt(vs.getAttribute('font-size') || "12") : 12;
          const ls = vs ? parseFloat(vs.getAttribute('letter-spacing') || "2") : 2;
          const l1 = document.getElementById('v-vinyl-label');
          const lcol = l1 ? w.edRgbHex(l1.getAttribute('fill') || '#dedede') : '#dedede';
          const lsz = l1 ? parseInt(l1.getAttribute('r') || "80") : 80;
          const hwRaw = el.style.width || '85%'; let hw = 85; if (hwRaw.includes('%')) hw = parseFloat(hwRaw); else if (hwRaw.includes('px')) { const pc = document.getElementById('poster-container'); hw = pc ? Math.round((parseFloat(hwRaw) / pc.offsetWidth) * 100) : 85; }

          html += `<hr class="pf-divider"><div class="pf-section"><div class="pf-section-title">Vinyl Record</div><div class="pf-row"><label>Overall Size (%)</label>${rrow(10,150,1,hw, `document.getElementById('v-vinyl-center').style.width=this.value+'%'; document.getElementById('v-vinyl-center').style.height='auto'`, '%')}</div><div class="pf-row"><label>Spiral Text Color</label>${cpair(tcol, `document.getElementById('v-spiral-text').setAttribute('fill', this.value)`)}</div><div class="pf-row"><label>Spiral Text Size</label>${rrow(6,30,1,tsz, `document.getElementById('v-spiral-text').setAttribute('font-size', this.value); document.getElementById('vinyl-text-size').value=this.value; window.updateVinylSpiral();`)}</div><div class="pf-row"><label>Letter Spacing</label>${rrow(0,10,0.5,ls, `document.getElementById('v-spiral-text').setAttribute('letter-spacing', this.value)`)}</div><div class="pf-row"><label>Center Label Color</label>${cpair(lcol, `document.getElementById('v-vinyl-label').setAttribute('fill', this.value)`)}</div><div class="pf-row"><label>Center Label Size</label>${rrow(20,200,1,lsz, `document.getElementById('v-vinyl-label').setAttribute('r', this.value); document.getElementById('v-vinyl-hole').setAttribute('r', this.value/10); document.getElementById('v-vinyl-groove1').setAttribute('r', this.value*1.1); document.getElementById('v-vinyl-groove2').setAttribute('r', this.value*1.15)`)}</div></div>`;
        }
        return html;
      };

      w.edBuildMulti = function() {
        const fontOpts = `<option value="'DM Sans', sans-serif">DM Sans</option><option value="'Inter', sans-serif">Inter</option><option value="'Montserrat', sans-serif">Montserrat</option><option value="'Oswald', sans-serif">Oswald</option><option value="'Poppins', sans-serif">Poppins</option><option value="'Playfair Display', serif">Playfair Display</option><option value="'Anton', sans-serif">Anton</option><option value="'Bebas Neue', sans-serif">Bebas Neue</option><option value="'Lora', serif">Lora</option><option value="'Merriweather', serif">Merriweather</option>`;
        return `<div class="pf-section"><div class="pf-section-title">Align to Canvas</div><div class="pf-2col" style="margin-bottom:6px;"><button class="pf-btn" onclick="window.edAlign('left')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="3" x2="3" y2="21" strokeWidth="2.5"/><rect x="5" y="8" width="8" height="3" rx="1"/><rect x="5" y="13" width="13" height="3" rx="1"/></svg></button><button class="pf-btn" onclick="window.edAlign('right')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="21" y1="3" x2="21" y2="21" strokeWidth="2.5"/><rect x="11" y="8" width="8" height="3" rx="1"/><rect x="6" y="13" width="13" height="3" rx="1"/></svg></button><button class="pf-btn" onclick="window.edAlign('cx')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="3" x2="12" y2="21" strokeWidth="2.5"/><rect x="6" y="8" width="12" height="3" rx="1"/><rect x="4" y="13" width="16" height="3" rx="1"/></svg></button><button class="pf-btn" onclick="window.edAlign('cy')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12" strokeWidth="2.5"/><rect x="8" y="4" width="3" height="16" rx="1"/><rect x="13" y="6" width="3" height="12" rx="1"/></svg></button><button class="pf-btn" onclick="window.edAlign('top')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="3" x2="21" y2="3" strokeWidth="2.5"/><rect x="8" y="5" width="3" height="8" rx="1"/><rect x="13" y="5" width="3" height="13" rx="1"/></svg></button><button class="pf-btn" onclick="window.edAlign('bottom')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="21" x2="21" y2="21" strokeWidth="2.5"/><rect x="8" y="11" width="3" height="8" rx="1"/><rect x="13" y="6" width="3" height="13" rx="1"/></svg></button></div></div><hr class="pf-divider"><div class="pf-section"><div class="pf-section-title">Distribute</div><div class="pf-2col"><button class="pf-btn" onclick="window.edDistribute('h')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="3" x2="3" y2="21"/><line x1="21" y1="3" x2="21" y2="21"/><rect x="9" y="8" width="6" height="8" rx="1"/></svg></button><button class="pf-btn" onclick="window.edDistribute('v')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="3" x2="21" y2="3"/><line x1="3" y1="21" x2="21" y2="21"/><rect x="8" y="9" width="8" height="6" rx="1"/></svg></button></div></div><hr class="pf-divider"><div class="pf-section"><div class="pf-section-title">Batch Formatting</div>
        <div class="pf-row"><label>Font Family (selected texts)</label><select onchange="window.edSel.forEach(id=>{const el=window.edEl(id);if(el)el.style.fontFamily=this.value;})"><option value="" disabled selected>Change Font...</option>${fontOpts}</select></div>
        <div class="pf-row"><label>Color (all selected)</label><div class="pf-color-row"><input type="color" value="#ffffff" oninput="const v=this.value; window.edSel.forEach(id=>{const el=window.edEl(id);if(el){el.style.color=v; el.querySelectorAll('path,circle,rect').forEach(p=>{if(p.getAttribute('fill')!=='none')p.setAttribute('fill',v);});}}); this.nextElementSibling.value=v;" /><input type="text" value="#ffffff" oninput="let v=this.value; if(/^#[0-9a-fA-F]{3}$/i.test(v)){v='#'+v[1]+v[1]+v[2]+v[2]+v[3]+v[3];} if(/^#[0-9a-fA-F]{6}$/i.test(v)){this.previousElementSibling.value=v; this.previousElementSibling.dispatchEvent(new Event('input'));}" /></div></div>
        <div class="pf-row"><label>Opacity</label><div class="pf-range-row"><input type="range" min="0" max="100" value="100" oninput="window.edSel.forEach(id=>{const el=window.edEl(id);if(el)el.style.opacity=this.value/100});this.nextElementSibling.textContent=this.value+'%'"><span class="pf-range-val">100%</span></div></div><div class="pf-row"><label>Visibility</label><div class="pf-2col"><button class="pf-btn" onclick="window.edSel.forEach(id=>{const el=window.edEl(id);if(el)el.style.display=''})">Show All</button><button class="pf-btn" onclick="window.edSel.forEach(id=>{const el=window.edEl(id);if(el)el.style.display='none'})">Hide All</button></div></div></div>`;
      };

      // INIT CALLS
      const vbg = document.getElementById('v-bg-color') as HTMLInputElement;
      const vbgtxt = document.getElementById('v-bg-color-txt') as HTMLInputElement;
      if (vbg) vbg.value = "#f5f5f5";
      if (vbgtxt) vbgtxt.value = "#f5f5f5";
      w.updateBgColor(); w.updateVinylSpiral(); w.updateVinylLyrics();

      setTimeout(() => { w.edInitOffsets(); const mc = document.getElementById('poster-container'); const mq = document.getElementById('ed-marquee'); if (mc && mq) { mc.style.position = 'relative'; mc.appendChild(mq); } }, 100);

      const handleMouseDown = function(e: MouseEvent) {
        const target = (e.target as Element).closest('.ed-el') as HTMLElement;
        if (!target) {
          const pr = document.getElementById('poster-container')?.getBoundingClientRect(); if(!pr) return;
          w.edMarqState = { x0: e.clientX - pr.left, y0: e.clientY - pr.top, pr }; if (!e.shiftKey) w.edDeselect();
          const m = document.getElementById('ed-marquee'); if (m) { m.style.display = 'block'; m.style.left = w.edMarqState.x0 + 'px'; m.style.top  = w.edMarqState.y0 + 'px'; m.style.width = '0'; m.style.height = '0'; }
          e.preventDefault(); return;
        }
        const id = target.dataset.ed; const additive = e.shiftKey || e.ctrlKey || e.metaKey;
        if (id && !w.edSel.includes(id)) w.edSelect(id, additive);
        w.edDragState = { startX: e.clientX, startY: e.clientY, startOffsets: w.edSel.map((sid: string) => ({ id: sid, tx: (w.edOffsets[sid] || { tx: 0 }).tx, ty: (w.edOffsets[sid] || { ty: 0 }).ty })) };
        e.preventDefault(); e.stopPropagation();
      };

      const handleMouseMove = function(e: MouseEvent) {
        if (w.edDragState) {
          const dx = e.clientX - w.edDragState.startX; const dy = e.clientY - w.edDragState.startY;
          w.edDragState.startOffsets.forEach(({ id, tx, ty }: any) => { if (!w.edOffsets[id]) w.edOffsets[id] = { tx: 0, ty: 0 }; w.edOffsets[id].tx = tx + dx; w.edOffsets[id].ty = ty + dy; w.edApplyTransform(id); });
          w.edUpdatePanelPos(); return;
        }
        if (w.edMarqState) {
          const pr = w.edMarqState.pr; const x1 = e.clientX - pr.left; const y1 = e.clientY - pr.top; const x = Math.min(w.edMarqState.x0, x1); const y = Math.min(w.edMarqState.y0, y1); const wd = Math.abs(x1 - w.edMarqState.x0); const ht = Math.abs(y1 - w.edMarqState.y0);
          const m = document.getElementById('ed-marquee'); if (m) { m.style.left = x + 'px'; m.style.top = y + 'px'; m.style.width = wd + 'px'; m.style.height = ht + 'px'; }
          document.querySelectorAll('.ed-el').forEach((el: any) => { const er = el.getBoundingClientRect(); const ex = er.left - pr.left, ey = er.top - pr.top; const hit = ex < x+wd && ex+er.width > x && ey < y+ht && ey+er.height > y; el.classList.toggle('ed-selected', hit); });
        }
      };

      const handleMouseUp = function() {
        if (w.edDragState) { w.edDragState = null; w.edUpdatePanel(); }
        if (w.edMarqState) { w.edMarqState = null; const m = document.getElementById('ed-marquee'); if (m) m.style.display = 'none'; w.edSel = Array.from(document.querySelectorAll('.ed-el.ed-selected')).map((el: any) => el.dataset.ed); w.edUpdatePanel(); w.edUpdateAlignBar(); }
      };

      const handleKeyDown = function(e: KeyboardEvent) {
        const target = e.target as HTMLElement; if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
        if (e.key === 'Escape') { w.edDeselect(); return; } if (!w.edSel.length) return;
        const step = e.shiftKey ? 10 : 1; let dx = 0, dy = 0;
        if (e.key === 'ArrowLeft') { dx = -step; e.preventDefault(); } if (e.key === 'ArrowRight') { dx = step; e.preventDefault(); } if (e.key === 'ArrowUp') { dy = -step; e.preventDefault(); } if (e.key === 'ArrowDown') { dy = step; e.preventDefault(); }
        if (dx || dy) { w.edSel.forEach((id: string) => { if (!w.edOffsets[id]) w.edOffsets[id] = { tx: 0, ty: 0 }; w.edOffsets[id].tx += dx; w.edOffsets[id].ty += dy; w.edApplyTransform(id); }); w.edUpdatePanelPos(); }
      };

      setTimeout(() => { document.getElementById('poster-content')?.addEventListener('mousedown', handleMouseDown); document.addEventListener('mousemove', handleMouseMove); document.addEventListener('mouseup', handleMouseUp); document.addEventListener('keydown', handleKeyDown); }, 500);
      w._cleanupSpotifyPoster = () => { document.getElementById('poster-content')?.removeEventListener('mousedown', handleMouseDown); document.removeEventListener('mousemove', handleMouseMove); document.removeEventListener('mouseup', handleMouseUp); document.removeEventListener('keydown', handleKeyDown); };
    };

    initApp();
    return () => { const w = window as any; if (w._cleanupSpotifyPoster) w._cleanupSpotifyPoster(); };
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
        
        .spotify-poster-page #vinyl-card { width: 100%; height: 100%; position: relative; display: flex; flex-direction: column; }
        .spotify-poster-page #v-top-left { position: absolute; top: 8%; left: 8%; font-family: 'DM Sans', sans-serif; font-size: 18px; font-weight: 700; color: #212121; letter-spacing: 0.1em; text-transform: uppercase !important; white-space: nowrap; }
        .spotify-poster-page #v-top-right { position: absolute; top: 8%; right: 8%; font-family: 'DM Sans', sans-serif; font-size: 18px; font-weight: 700; color: #212121; letter-spacing: 0.1em; text-transform: uppercase !important; white-space: nowrap; }
        .spotify-poster-page #v-song-title { position: absolute; top: 12%; left: 0; right: 0; text-align: center; font-family: 'Josefin Sans', sans-serif; font-size: 42px; font-weight: 800; color: #212121; letter-spacing: 4px; text-transform: uppercase !important; }
        .spotify-poster-page #v-vinyl-center { position: absolute; top: 55%; left: 50%; translate: -50% -50%; width: 85%; aspect-ratio: 1 / 1; display: flex; align-items: center; justify-content: center; }
        .spotify-poster-page #v-bottom-text { position: absolute; bottom: 8%; left: 0; right: 0; text-align: center; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 600; color: #555555; text-transform: uppercase !important; letter-spacing: 0.05em; }
        
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
                <input type="text" id="v-label-input" defaultValue="ARTIST NAME" onInput={(e: any) => document.getElementById('v-top-left')!.textContent = e.target.value} />
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
                <input type="text" id="v-year-input" defaultValue="1992" onInput={(e: any) => document.getElementById('v-top-right')!.textContent = e.target.value} />
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
                <input type="text" id="v-bottom-input" defaultValue="UNKNOWN ALBUM" onInput={(e: any) => document.getElementById('v-bottom-text')!.textContent = e.target.value} />
            </div>
            <div className="form-row">
                <label>Bottom Text Color</label>
                <div className="color-row">
                    <input type="color" id="c-v-bot" defaultValue="#555555" onInput={(e:any)=>{ (window as any).updateTextColor('v-bottom-text', e.target.value); (window as any).syncColor('c-v-bot', 'c-v-bot-t'); }} />
                    <input type="text" id="c-v-bot-t" defaultValue="#555555" onInput={(e:any)=>{ (window as any).syncColor('c-v-bot', 'c-v-bot-t'); (window as any).updateTextColor('v-bottom-text', document.getElementById('c-v-bot-t')!.value); }} />
                </div>
            </div>
        </div>

        <button className="accordion-btn open" onClick={(e) => (window as any).toggleAccordion(e.currentTarget)}>🎵 Song Details<span className="arrow">▼</span></button>
        <div className="accordion-content open">
            <div className="form-row">
                <label>Song Title Text</label>
                <input type="text" id="v-song-title-input" defaultValue="SONG NAME" onInput={(e: any) => document.getElementById('v-song-title')!.textContent = e.target.value} />
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
                    <input type="range" id="vinyl-text-size" min="6" max="40" defaultValue="12" onInput={(e:any) => { e.target.nextElementSibling.textContent = e.target.value+'px'; document.getElementById('v-spiral-text')?.setAttribute('font-size', e.target.value); (window as any).updateVinylSpiral(); }} />
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
        <div id="ed-marquee"></div>
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
          <div id="poster-container" style={{ width: '420px', height: '525px' }}>
            <div id="poster">
              <div id="poster-bg">
                <div id="poster-bg-img"></div>
                <div id="poster-bg-overlay"></div>
              </div>
              <div id="poster-content">
                <div id="vinyl-card">
                    <div id="v-top-left" className="ed-el" data-ed="v-top-left">ARTIST NAME</div>
                    <div id="v-top-right" className="ed-el" data-ed="v-top-right">1992</div>
                    <div id="v-song-title" className="ed-el" data-ed="v-song-title">SONG NAME</div>
                    <div id="v-vinyl-center" className="ed-el" data-ed="v-vinyl">
                        <svg viewBox="0 0 800 800" width="100%" height="100%" id="vinyl-svg">
                            <defs><path id="v-spiral-path" d="" fill="none" /></defs>
                            <circle id="v-vinyl-bg" cx="400" cy="400" r="395" fill="none" />
                            <circle id="v-vinyl-groove1" cx="400" cy="400" r="88" fill="none" stroke="#2a2a2a" strokeWidth="1" />
                            <circle id="v-vinyl-groove2" cx="400" cy="400" r="92" fill="none" stroke="#2a2a2a" strokeWidth="1" />
                            <text fill="#212121" fontSize="12" letterSpacing="2" fontFamily="'DM Sans', sans-serif" fontWeight="700" textAnchor="start">
                                <textPath href="#v-spiral-path" id="v-spiral-text" startOffset="0%">LOREM IPSUM DOLOR SIT AMET CONSECTETUR ADIPISCING ELIT SED DO EIUSMOD TEMPOR INCIDIDUNT UT LABORE ET DOLORE MAGNA ALIQUA</textPath>
                            </text>
                            <circle id="v-vinyl-label" cx="400" cy="400" r="80" fill="#e0e0e0" />
                            <circle id="v-vinyl-hole" cx="400" cy="400" r="8" fill="#111111" />
                        </svg>
                    </div>
                    <div id="v-bottom-text" className="ed-el" data-ed="v-bottom">UNKNOWN ALBUM</div>
                </div>
              </div>
            </div>
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

      <div id="toast">✓ İşlem tamamlandı</div>
    </div>
  );
}
