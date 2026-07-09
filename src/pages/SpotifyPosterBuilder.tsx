import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export default function SpotifyPosterBuilder() {
  const isInitialized = useRef(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    // Load External Scripts (html2canvas, jsPDF, JSZip)
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
      w.POSTER_MODE = 'spotify';

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
        const el = document.getElementById('time-start-el');
        if(el) el.textContent = startStr;
        
        const s = w.timeToSeconds(startStr);
        const e = w.timeToSeconds(endStr);
        if (e > 0 && s <= e) {
          let pct = (s / e) * 100;
          if (pct < 0) pct = 0;
          if (pct > 100) pct = 100;
          const pval = document.getElementById('progress-val') as HTMLInputElement;
          if(pval) pval.value = pct.toString();
          const pfill = document.getElementById('progress-bar-fill');
          if(pfill) pfill.style.width = pct + '%';
          const pdisp = document.getElementById('progress-display');
          if(pdisp) pdisp.textContent = Math.round(pct) + '%';
        }
      };

      w.handleEndTimeChange = function() {
        const endStr = (document.getElementById('time-end') as HTMLInputElement).value;
        const el = document.getElementById('time-end-el');
        if(el) el.textContent = endStr;
        w.handleStartTimeChange(); 
      };

      w.updateProgress = function(val: string) {
        const pfill = document.getElementById('progress-bar-fill');
        if(pfill) pfill.style.width = val + '%';
        const pdisp = document.getElementById('progress-display');
        if(pdisp) pdisp.textContent = Math.round(parseFloat(val)) + '%';
        
        const endStr = (document.getElementById('time-end') as HTMLInputElement).value;
        const e = w.timeToSeconds(endStr);
        if (e > 0) {
          const newSecs = (parseFloat(val) / 100) * e;
          const newTimeStr = w.secondsToTime(newSecs);
          const tstart = document.getElementById('time-start') as HTMLInputElement;
          if(tstart) tstart.value = newTimeStr;
          const tel = document.getElementById('time-start-el');
          if(tel) tel.textContent = newTimeStr;
        }
      };

      w.currentCoverSrc = '';

      w.updateBgBlur = function() {
        const blurEl = document.getElementById('blur-val') as HTMLInputElement;
        if (!blurEl) return;
        const blur = blurEl.value;
        
        const brightEl = document.getElementById('brightness-val') as HTMLInputElement;
        const brightness = brightEl ? brightEl.value : "100";
        
        const blurDisp = document.getElementById('blur-display');
        if (blurDisp) blurDisp.textContent = blur + 'px';
        
        const brightDisp = document.getElementById('brightness-display');
        if (brightDisp) brightDisp.textContent = brightness + '%';
        
        const bgImgDiv = document.getElementById('poster-bg-img') as HTMLElement;
        if (!w.currentCoverSrc) return;
        
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
        tempImg.src = w.currentCoverSrc;
      };

      w.updateBgColor = function() {
        const colorEl = document.getElementById('bg-color') as HTMLInputElement;
        const txtEl = document.getElementById('bg-color-txt') as HTMLInputElement;
        if(!colorEl) return;
        const color = colorEl.value;
        document.getElementById('poster-bg')!.style.background = color;
        if(txtEl) txtEl.value = color;
      };

      w.updateBg = function() {
        const type = (document.getElementById('bg-type') as HTMLSelectElement).value;
        const bgColorSection = document.getElementById('bg-color-section');
        const bgBlurSection = document.getElementById('bg-blur-section');
        const bgImg = document.getElementById('poster-bg-img');
        const posterBg = document.getElementById('poster-bg');

        if (type === 'color') {
          if (bgColorSection) bgColorSection.style.display = 'block';
          if (bgBlurSection) bgBlurSection.style.display = 'none';
          if (bgImg) bgImg.style.display = 'none';
          w.updateBgColor();
        } else {
          if (bgColorSection) bgColorSection.style.display = 'none';
          if (bgBlurSection) bgBlurSection.style.display = 'block';
          if (posterBg) posterBg.style.background = 'none';
          if (bgImg) bgImg.style.display = w.currentCoverSrc ? 'block' : 'none';
          w.updateBgBlur();
        }
      };

      w.updateOverlay = function() {
        const ov = document.getElementById('overlay-val') as HTMLInputElement;
        if(!ov) return;
        const val = ov.value;
        document.getElementById('overlay-display')!.textContent = val + '%';
        const overlay = document.getElementById('poster-bg-overlay');
        overlay!.style.display = 'block';
        overlay!.style.background = `rgba(0,0,0,${parseFloat(val)/100})`;
        overlay!.style.backgroundImage = 'none';
        overlay!.style.boxShadow = 'none';
      };

      w.updateCoverTransform = function() {
        const x = (document.getElementById('cover-x') as HTMLInputElement).value;
        const y = (document.getElementById('cover-y') as HTMLInputElement).value;
        const scale = (document.getElementById('cover-scale') as HTMLInputElement).value;
        document.getElementById('cover-x-display')!.textContent = x;
        document.getElementById('cover-y-display')!.textContent = y;
        document.getElementById('cover-scale-display')!.textContent = scale + '%';

        const img = document.getElementById('cover-img');
        if(img) img.style.transform = `translate(${x}px, ${y}px) scale(${parseFloat(scale)/100})`;
      };

      w.setCoverImage = function(src: string) {
        w.currentCoverSrc = src;
        const img = document.getElementById('cover-img') as HTMLImageElement;
        const placeholder = document.getElementById('cover-placeholder');
        if(img) {
            img.src = src;
            img.style.display = 'block';
            if(placeholder) placeholder.style.display = 'none';
        }

        const bgImgDiv = document.getElementById('poster-bg-img') as HTMLElement;
        if(bgImgDiv) {
            bgImgDiv.style.backgroundImage = `url(${src})`;
            const btype = document.getElementById('bg-type') as HTMLSelectElement;
            if (btype && btype.value === 'blur') {
                bgImgDiv.style.display = 'block';
                w.updateBgBlur();
            }
        }
        w.updateCoverTransform();
      };

      w.handleCoverUpload = function(event: any) {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e: any) => w.setCoverImage(e.target.result);
        reader.readAsDataURL(file);
      };

      w.updateContentPosition = function() {
        const val = (document.getElementById('content-y') as HTMLInputElement).value;
        document.getElementById('content-y-display')!.textContent = val + '%';
        const card = document.getElementById('spotify-card');
        if(card) card.style.top = val + '%';
      };

      w.updatePlaySize = function() {
        const val = (document.getElementById('play-size') as HTMLInputElement).value;
        document.getElementById('play-size-display')!.textContent = val + 'px';
        const btn = document.getElementById('play-btn');
        if(btn) {
            btn.style.width = val + 'px';
            btn.style.height = val + 'px';
        }
      };

      w.setCtrlColor = function(color: string) {
        document.querySelectorAll<HTMLElement>('.ctrl-btn').forEach(b => b.style.color = color);
        (document.getElementById('ctrl-color-txt') as HTMLInputElement).value = color;
      };

      w.setTimeColor = function(color: string) {
        document.querySelectorAll<HTMLElement>('#time-row span').forEach(el => el.style.color = color);
        (document.getElementById('time-color-txt') as HTMLInputElement).value = color;
      };

      w.updateTextColor = function(id: string, color: string) {
        const el = document.getElementById(id);
        if (el) el.style.color = color;
      };

      w.updateCtrlSize = function(val: string) {
        document.getElementById('ctrl-size-display')!.textContent = val + 'px';
        document.querySelectorAll('.ctrl-btn svg').forEach((svg: any) => {
          svg.setAttribute('width', val);
          svg.setAttribute('height', val);
        });
      };

      w.updateProgressHeight = function(val: string) {
        document.getElementById('progress-height-display')!.textContent = val + 'px';
        const tr = document.getElementById('progress-bar-track');
        if(tr){
            tr.style.height = val + 'px';
            tr.style.borderRadius = (parseFloat(val)/2) + 'px';
        }
      };

      w.updateBarcodeHeight = function(val: string) {
        document.getElementById('barcode-height-display')!.textContent = val + 'px';
        const svg = document.getElementById('barcode-svg');
        if(svg) svg.style.height = val + 'px';
      };

      w.updateHeartSize = function(val: string) {
        document.getElementById('heart-size-display')!.textContent = val + 'px';
        const heart = document.getElementById('heart-icon');
        if(heart){
            heart.style.width = val + 'px';
            heart.style.height = val + 'px';
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
          colEl.dispatchEvent(new Event('change', { bubbles: true }));
        }
      };

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

        fetched.querySelectorAll('circle').forEach(el => el.setAttribute('fill', logoColor));
        fetched.querySelectorAll('path').forEach(el => {
          const fill = el.getAttribute('fill');
          if (fill && fill !== 'none') el.setAttribute('fill', logoColor);
          const stroke = el.getAttribute('stroke');
          if (stroke && stroke !== 'none') el.setAttribute('stroke', logoColor);
        });

        const svg = document.getElementById('barcode-svg');
        if(svg){
            svg.setAttribute('viewBox', fetched.getAttribute('viewBox') || '0 0 400 100');
            svg.innerHTML = fetched.innerHTML;
        }

        const chk = document.getElementById('show-barcode') as HTMLInputElement;
        if (chk && chk.checked) {
          const sec = document.getElementById('barcode-section');
          if(sec) sec.style.display = 'flex';
        }
      };

      w.drawBarcode = async function() {
        if (!w.currentTrackUri) return;
        const svg = document.getElementById('barcode-svg');
        if(svg) svg.innerHTML = `<text x="50%" y="50%" text-anchor="middle" fill="#888" font-size="10" dy=".3em">Loading...</text>`;

        w.cachedSvgText = await w.fetchSvgRaw();

        if (!w.cachedSvgText) {
          if(svg) svg.innerHTML = `<text x="50%" y="50%" text-anchor="middle" fill="#ff4444" font-size="10" dy=".3em">Barcode error</text>`;
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
        const sec = document.getElementById('barcode-section');
        if(sec) sec.style.display = show ? 'flex' : 'none';
      };

      w.updateBarcodeStyle = function() {
        if (w.cachedSvgText) w.renderBarcodeFromCache();
        else if (w.currentTrackUri) w.drawBarcode();
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
        const stitle = document.getElementById('song-title');
        const sartist = document.getElementById('song-artist');
        if(stitle) stitle.textContent = item.trackName;
        if(sartist) sartist.textContent = item.artistName;
        
        const tinp = document.getElementById('song-title-input') as HTMLInputElement;
        const ainp = document.getElementById('song-artist-input') as HTMLInputElement;
        if(tinp) tinp.value = item.trackName;
        if(ainp) ainp.value = item.artistName;

        if (item.trackTimeMillis) {
          const totalSecs = item.trackTimeMillis / 1000;
          const endStr = w.secondsToTime(totalSecs);
          const tend = document.getElementById('time-end') as HTMLInputElement;
          if(tend) tend.value = endStr;
          const tel = document.getElementById('time-end-el');
          if(tel) tel.textContent = endStr;
          w.handleStartTimeChange();
        }

        const artUrl = item.artworkUrl100.replace('100x100bb', '600x600bb');
        w.setCoverImage(artUrl);
        w.showToast('✓ ' + item.trackName + ' yüklendi');
      };

      w.getExportFilename = function(ext: string) {
        let artist = ((document.getElementById('song-artist-input') as HTMLInputElement)?.value || 'artist').replace(/[^a-z0-9]/gi, '-').toLowerCase();
        let song = ((document.getElementById('song-title-input') as HTMLInputElement)?.value || 'song').replace(/[^a-z0-9]/gi, '-').toLowerCase();
        const size = (document.getElementById('canvas-size') as HTMLSelectElement).value;
        const now = new Date();
        const date = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
        const hour = String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0');
        return `spotify-${artist}-${song}-${size}-${date}-${hour}.${ext}`;
      };

      w.generateSafeCanvas = async function(container: HTMLElement, scale: number) {
        const origBoxShadow = container.style.boxShadow;
        container.style.boxShadow = 'none';
        
        const currentScrollX = window.scrollX;
        const currentScrollY = window.scrollY;
        window.scrollTo(0, 0);

        try {
          const generatedCanvas = await w.html2canvas(container, {
            scale: scale,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#121212',
            scrollX: 0,
            scrollY: 0
          });
          
          window.scrollTo(currentScrollX, currentScrollY);
          container.style.boxShadow = origBoxShadow;
          return generatedCanvas;
        } catch (error) {
          window.scrollTo(currentScrollX, currentScrollY);
          container.style.boxShadow = origBoxShadow;
          throw error;
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

      w.downloadPNG = async function() {
        w.edDeselect();
        w.showToast('PNG hazırlanıyor...');
        const container = document.getElementById('poster-container');
        const key = (document.getElementById('canvas-size') as HTMLSelectElement).value;
        const [wIn, hIn] = w.CANVAS_SIZES[key];
        
        let targetWidthPx = Math.round(wIn * 300);
        let targetHeightPx = Math.round(hIn * 300);
        let scale = targetWidthPx / container!.offsetWidth;

        const MAX_DIMENSION = 16000;
        if (targetWidthPx > MAX_DIMENSION || targetHeightPx > MAX_DIMENSION) {
          const limitScale = Math.min(MAX_DIMENSION / targetWidthPx, MAX_DIMENSION / targetHeightPx);
          scale = scale * limitScale;
        }

        try {
          const canvas = await w.generateSafeCanvas(container, scale);
          const base64Data = canvas.toDataURL('image/png', 1.0);
          const dpiFixedData = w.changeDpiDataUrl(base64Data, 300);
          const link = document.createElement('a');
          link.download = w.getExportFilename('png'); link.href = dpiFixedData; link.click();
          w.showToast('✓ PNG indirildi!');
        } catch(e: any) { w.showToast('Hata: ' + e.message); }
      };

      w.downloadPDF = async function() {
        w.edDeselect();
        w.showToast('PDF hazırlanıyor...');
        const container = document.getElementById('poster-container');
        const key = (document.getElementById('canvas-size') as HTMLSelectElement).value;
        const [wIn, hIn] = w.CANVAS_SIZES[key];
        
        let targetWidthPx = Math.round(wIn * 300);
        let targetHeightPx = Math.round(hIn * 300);
        let scale = targetWidthPx / container!.offsetWidth;

        const MAX_DIMENSION = 16000;
        if (targetWidthPx > MAX_DIMENSION || targetHeightPx > MAX_DIMENSION) {
          const limitScale = Math.min(MAX_DIMENSION / targetWidthPx, MAX_DIMENSION / targetHeightPx);
          scale = scale * limitScale;
        }

        try {
          const canvas = await w.generateSafeCanvas(container, scale);
          const { jsPDF } = w.jspdf;
          const pdf = new jsPDF({ orientation: wIn > hIn ? 'landscape' : 'portrait', unit: 'in', format: [wIn, hIn] });
          const imgData = canvas.toDataURL('image/jpeg', 0.95);
          pdf.addImage(imgData, 'JPEG', 0, 0, wIn, hIn);
          pdf.save(w.getExportFilename('pdf'));
          w.showToast('✓ PDF indirildi!');
        } catch(e: any) { w.showToast('Hata: ' + e.message); }
      };

      w.downloadSVG = async function() {
        w.edDeselect();
        w.showToast('SVG hazırlanıyor...');
        const container = document.getElementById('poster-container');
        const key = (document.getElementById('canvas-size') as HTMLSelectElement).value;
        const [wIn, hIn] = w.CANVAS_SIZES[key];
        
        let targetWidthPx = Math.round(wIn * 300);
        let targetHeightPx = Math.round(hIn * 300);
        let scale = targetWidthPx / container!.offsetWidth;

        const MAX_DIMENSION = 16000;
        if (targetWidthPx > MAX_DIMENSION || targetHeightPx > MAX_DIMENSION) {
          const limitScale = Math.min(MAX_DIMENSION / targetWidthPx, MAX_DIMENSION / targetHeightPx);
          scale = scale * limitScale;
          targetWidthPx = Math.round(targetWidthPx * limitScale);
          targetHeightPx = Math.round(targetHeightPx * limitScale);
        }

        try {
          const canvas = await w.generateSafeCanvas(container, scale);
          const imgData = canvas.toDataURL('image/png', 1.0);
          const svgContent = `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${targetWidthPx}" height="${targetHeightPx}" viewBox="0 0 ${targetWidthPx} ${targetHeightPx}">\n  <image href="${imgData}" x="0" y="0" width="${targetWidthPx}" height="${targetHeightPx}"/>\n</svg>`;
          const blob = new Blob([svgContent], { type: 'image/svg+xml' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.download = w.getExportFilename('svg'); link.href = url; link.click();
          URL.revokeObjectURL(url);
          w.showToast('✓ SVG indirildi!');
        } catch(e: any) { w.showToast('Hata: ' + e.message); }
      };

      // ══════════════════════════════════════════════════════════════
      // EDITOR ENGINE
      // ══════════════════════════════════════════════════════════════

      w.ED_LABELS = {
        'label-top':  'Top Label', 'cover': 'Cover Art', 'song-info': 'Song Info Group',
        'song-title': 'Song Title', 'song-artist':'Artist Name', 'heart': 'Heart Icon',
        'progress': 'Progress Bar', 'play': 'Play Button', 'btn-shuffle':'Shuffle Button',
        'btn-prev': 'Previous Button', 'btn-next': 'Next Button', 'btn-repeat': 'Repeat Button',
        'barcode': 'Spotify Barcode'
      };

      w.edSel =[];          
      w.edDragState = null;  
      w.edMarqState = null;  
      w.edOffsets = {};    

      w.edEl = function(id: string) { return document.querySelector(`[data-ed="${id}"]`) as HTMLElement; };

      w.edInitOffsets = function() {
        document.querySelectorAll('.ed-el').forEach((el: any) => {
          const id = el.dataset.ed;
          if (!w.edOffsets[id]) w.edOffsets[id] = { tx: 0, ty: 0 };
          w.edApplyTransform(id);
        });
      };

      w.edApplyTransform = function(id: string) {
        const el = w.edEl(id); if (!el) return;
        const o = w.edOffsets[id] || { tx: 0, ty: 0 };
        const cur = el.style.transform.replace(/translate\([^)]+\)/g, '').trim();
        el.style.transform = `translate(${o.tx}px,${o.ty}px)${cur ? ' ' + cur : ''}`;
      };

      w.edSelect = function(id: string, additive: boolean) {
        if (!additive) {
          w.edSel.forEach((s: string) => w.edEl(s)?.classList.remove('ed-selected'));
          w.edSel =[];
        }
        if (id && !w.edSel.includes(id)) {
          w.edSel.push(id);
          w.edEl(id)?.classList.add('ed-selected');
        }
        w.edUpdatePanel();
        w.edUpdateAlignBar();
      };

      w.edDeselect = function() {
        w.edSel.forEach((s: string) => w.edEl(s)?.classList.remove('ed-selected'));
        w.edSel =[];
        w.edUpdatePanel();
        w.edUpdateAlignBar();
      };

      w.edAlign = function(mode: string) {
        if (!w.edSel.length) return;
        const pc = document.getElementById('poster-container');
        const pcW = pc!.offsetWidth, pcH = pc!.offsetHeight;
        const pcR = pc!.getBoundingClientRect();

        w.edSel.forEach((id: string) => {
          const el = w.edEl(id); if (!el) return;
          const er = el.getBoundingClientRect();
          const ew = er.width, eh = er.height;
          const o = w.edOffsets[id] || { tx: 0, ty: 0 };
          const localX = er.left - pcR.left - o.tx;
          const localY = er.top  - pcR.top  - o.ty;

          if (mode === 'left')   o.tx = -localX;
          if (mode === 'right')  o.tx = pcW - ew - localX;
          if (mode === 'cx')     o.tx = (pcW - ew) / 2 - localX;
          if (mode === 'top')    o.ty = -localY;
          if (mode === 'bottom') o.ty = pcH - eh - localY;
          if (mode === 'cy')     o.ty = (pcH - eh) / 2 - localY;

          w.edOffsets[id] = o;
          w.edApplyTransform(id);
        });
      };

      w.edDistribute = function(axis: string) {
        if (w.edSel.length < 3) return;
        const pcR = document.getElementById('poster-container')!.getBoundingClientRect();
        const items = w.edSel.map((id: string) => {
          const el = w.edEl(id);
          const er = el.getBoundingClientRect();
          const o = w.edOffsets[id] || { tx: 0, ty: 0 };
          return { id, el, er, o, pos: axis === 'h' ? er.left - pcR.left - o.tx : er.top - pcR.top - o.ty, size: axis === 'h' ? er.width : er.height };
        }).sort((a: any, b: any) => a.pos - b.pos);

        const first = items[0], last = items[items.length - 1];
        const totalSpan = (last.pos + last.size) - first.pos;
        const totalSize = items.reduce((s: number, it: any) => s + it.size, 0);
        const gap = (totalSpan - totalSize) / (items.length - 1);
        let cursor = first.pos + first.size + gap;

        items.slice(1, -1).forEach((it: any) => {
          if (axis === 'h') it.o.tx = cursor - it.pos + it.o.tx;
          else              it.o.ty = cursor - it.pos + it.o.ty;
          w.edOffsets[it.id] = it.o;
          w.edApplyTransform(it.id);
          cursor += it.size + gap;
        });
      };

      w.edUpdateAlignBar = function() {
        document.getElementById('ed-align-bar')!.classList.toggle('ed-bar-visible', w.edSel.length > 0);
      };

      w.edUpdatePanel = function() {
        const empty  = document.getElementById('props-empty-state');
        const fields = document.getElementById('props-fields');
        const nameEl = document.getElementById('props-selected-name');

        if (w.edSel.length === 0) {
          if(empty) empty.style.display = ''; 
          if(fields) fields.style.display = 'none';
          if(nameEl) nameEl.textContent = ''; return;
        }

        if(empty) empty.style.display = 'none'; 
        if(fields) fields.style.display = '';

        if (w.edSel.length > 1) {
          if(nameEl) nameEl.textContent = w.edSel.length + ' elements';
          if(fields) fields.innerHTML = w.edBuildMulti();
          return;
        }

        const id = w.edSel[0];
        if(nameEl) nameEl.textContent = w.ED_LABELS[id] || id;
        if(fields) fields.innerHTML = w.edBuildSingle(id);
      };

      w.edUpdatePanelPos = function() {
        if (w.edSel.length !== 1) return;
        const id = w.edSel[0];
        const o = w.edOffsets[id] || { tx: 0, ty: 0 };
        const xi = document.getElementById('epx') as HTMLInputElement; if (xi) xi.value = Math.round(o.tx).toString();
        const yi = document.getElementById('epy') as HTMLInputElement; if (yi) yi.value = Math.round(o.ty).toString();
      };

      w.edRgbHex = function(rgb: string) {
        if (!rgb || rgb === 'transparent') return '#ffffff';
        if (rgb.startsWith('#')) return rgb;
        const m = rgb.match(/\d+/g);
        if (!m || m.length < 3) return '#ffffff';
        return '#' + m.slice(0,3).map(x => parseInt(x).toString(16).padStart(2,'0')).join('');
      };

      w.edSetW = function(id: string, v: string) { const el = w.edEl(id); if (el) el.style.width  = v + 'px'; };
      w.edSetH = function(id: string, v: string) { const el = w.edEl(id); if (el) el.style.height = v + 'px'; };
      w.edSetXY = function(id: string, axis: string, v: string) {
        if (!w.edOffsets[id]) w.edOffsets[id] = { tx: 0, ty: 0 };
        if (axis === 'x') w.edOffsets[id].tx = parseFloat(v);
        else              w.edOffsets[id].ty = parseFloat(v);
        w.edApplyTransform(id);
      };

      w.edSetText = function(id: string, val: string) {
        const el = w.edEl(id); if (!el) return;
        let tn = Array.from(el.childNodes).find((n: any) => n.nodeType === 3);
        if (tn) (tn as any).textContent = val;
        else el.insertBefore(document.createTextNode(val), el.firstChild);
        const map: any = { 
            'song-title': 'song-title-input', 'song-artist': 'song-artist-input', 'label-top': 'label-top-input'
        };
        const inp = document.getElementById(map[id]) as HTMLInputElement; if (inp) inp.value = val;
      };

      w.edBuildSingle = function(id: string) {
        const el = w.edEl(id); if (!el) return '';
        const o   = w.edOffsets[id] || { tx:0, ty:0 };
        const cs  = getComputedStyle(el);
        const cw  = Math.round(el.offsetWidth);
        const ch  = Math.round(el.offsetHeight);
        const op  = Math.round((parseFloat(el.style.opacity)||1)*100);
        const vis = el.style.display !== 'none';

        function cpair(initColor: string, oninput: string) {
          return `<div class="pf-color-row"><input type="color" value="${initColor}" oninput="const v=this.value; ${oninput.replace(/"/g,"'")}; this.nextElementSibling.value=v;"><input type="text" value="${initColor}" oninput="let v=this.value; if(/^#[0-9a-fA-F]{3}$/i.test(v)){v='#'+v[1]+v[1]+v[2]+v[2]+v[3]+v[3];} if(/^#[0-9a-fA-F]{6}$/i.test(v)){${oninput.replace(/this\.value/g,"v").replace(/"/g,"'")}; this.previousElementSibling.value=v;}"></div>`;
        }
        function rrow(min:number,max:number,step:number,val:number,oninput:string,unit='px') {
          return `<div class="pf-range-row"><input type="range" min="${min}" max="${max}" step="${step}" value="${val}" oninput="${oninput.replace(/"/g,"'")}; this.nextElementSibling.textContent=this.value+'${unit}'"><span class="pf-range-val">${val}${unit}</span></div>`;
        }

        const fontOpts = `<option value="'Abril Fatface', serif">Abril Fatface</option><option value="'Alfa Slab One', serif">Alfa Slab One</option><option value="'Anton', sans-serif">Anton</option><option value="'Archivo Black', sans-serif">Archivo Black</option><option value="'Bangers', cursive">Bangers</option><option value="'Bebas Neue', sans-serif">Bebas Neue</option><option value="'Bodoni Moda', serif">Bodoni Moda</option><option value="'Caveat', cursive">Caveat</option><option value="'Cinzel', serif">Cinzel</option><option value="'Cormorant Garamond', serif">Cormorant Garamond</option><option value="'Courgette', cursive">Courgette</option><option value="'DM Sans', sans-serif">DM Sans</option><option value="'Dancing Script', cursive">Dancing Script</option><option value="'EB Garamond', serif">EB Garamond</option><option value="'Fjalla One', sans-serif">Fjalla One</option><option value="'Great Vibes', cursive">Great Vibes</option><option value="'Inter', sans-serif">Inter</option><option value="'Josefin Sans', sans-serif">Josefin Sans</option><option value="'Kanit', sans-serif">Kanit</option><option value="'Lato', sans-serif">Lato</option><option value="'Libre Baskerville', serif">Libre Baskerville</option><option value="'Lobster', cursive">Lobster</option><option value="'Lora', serif">Lora</option><option value="'Merriweather', serif">Merriweather</option><option value="'Montserrat', sans-serif">Montserrat</option><option value="'Open Sans', sans-serif">Open Sans</option><option value="'Oswald', sans-serif">Oswald</option><option value="'PT Serif', serif">PT Serif</option><option value="'Pacifico', cursive">Pacifico</option><option value="'Patua One', serif">Patua One</option><option value="'Permanent Marker', cursive">Permanent Marker</option><option value="'Playfair Display', serif">Playfair Display</option><option value="'Poppins', sans-serif">Poppins</option><option value="'Prata', serif">Prata</option><option value="'Raleway', sans-serif">Raleway</option><option value="'Righteous', cursive">Righteous</option><option value="'Roboto', sans-serif">Roboto</option><option value="'Sacramento', cursive">Sacramento</option><option value="'Satisfy', cursive">Satisfy</option><option value="'Teko', sans-serif">Teko</option><option value="'Ubuntu', sans-serif">Ubuntu</option><option value="'Yellowtail', cursive">Yellowtail</option>`;

        let html = `<div class="pf-section"><div class="pf-section-title">Position &amp; Size</div><div class="pf-2col"><div class="pf-row"><label>X offset</label><input type="number" id="epx" value="${Math.round(o.tx)}" oninput="window.edSetXY('${id}','x',this.value)"></div><div class="pf-row"><label>Y offset</label><input type="number" id="epy" value="${Math.round(o.ty)}" oninput="window.edSetXY('${id}','y',this.value)"></div></div><div class="pf-2col"><div class="pf-row"><label>Width (px)</label><input type="number" value="${cw}" oninput="window.edSetW('${id}',this.value)"></div><div class="pf-row"><label>Height (px)</label><input type="number" value="${ch}" oninput="window.edSetH('${id}',this.value)"></div></div></div><hr class="pf-divider"><div class="pf-section"><div class="pf-section-title">Visibility</div><div class="pf-toggle-row"><span>Visible</span><label class="toggle"><input type="checkbox" ${vis?'checked':''} onchange="window.edEl('${id}').style.display=this.checked?'':'none'"><span class="slider"></span></label></div><div class="pf-row"><label>Opacity</label>${rrow(0,100,1,op, `window.edEl('${id}').style.opacity=this.value/100`, '%')}</div></div>`;

        if (['label-top','song-title','song-artist'].includes(id)) {
          const tn  = Array.from(el.childNodes).find((n: any)=>n.nodeType===3);
          const txt = (tn ? (tn as any).textContent!.trim() : el.innerText.trim()).replace(/"/g,'&quot;');
          const fs  = parseInt(cs.fontSize)||14;
          const fw  = cs.fontWeight;
          const col = w.edRgbHex(cs.color);
          const ls  = parseFloat(cs.letterSpacing)||0;
          const lhRaw = parseFloat(cs.lineHeight);
          const lh  = isNaN(lhRaw) ? "1.2" : (lhRaw / (parseFloat(cs.fontSize)||14)).toFixed(2);
          const isUC = cs.textTransform === 'uppercase';
          const ff = cs.fontFamily.replace(/"/g, "'");

          html += `<hr class="pf-divider"><div class="pf-section"><div class="pf-section-title">Text properties</div><div class="pf-row"><label>Content</label><input type="text" value="${txt}" oninput="window.edSetText('${id}',this.value)"></div><div class="pf-row"><label>Font Family</label><select onchange="window.edEl('${id}').style.fontFamily=this.value"><option value="${ff}" selected>Current Font</option>${fontOpts}</select></div><div class="pf-2col"><div class="pf-row"><label>Font Size</label><input type="number" value="${fs}" min="6" max="200" oninput="window.edEl('${id}').style.fontSize=this.value+'px'"></div><div class="pf-row"><label>Weight</label><select onchange="window.edEl('${id}').style.fontWeight=this.value"><option value="300" ${fw==='300'?'selected':''}>Light</option><option value="400" ${fw==='400'||fw==='normal'?'selected':''}>Regular</option><option value="500" ${fw==='500'?'selected':''}>Medium</option><option value="600" ${fw==='600'?'selected':''}>SemiBold</option><option value="700" ${fw==='700'||fw==='bold'?'selected':''}>Bold</option><option value="900" ${fw==='900'?'selected':''}>Black</option></select></div></div><div class="pf-row"><label>Letter Spacing</label>${rrow(-5,30,0.5,ls, `window.edEl('${id}').style.letterSpacing=this.value+'px'`)}</div><div class="pf-row"><label>Line Height</label>${rrow(0.8,4,0.05,parseFloat(lh), `window.edEl('${id}').style.lineHeight=this.value`, '')}</div><div class="pf-row"><label>Alignment</label><div class="pf-3col"><button class="pf-btn" onclick="window.edEl('${id}').style.textAlign='left'">Left</button><button class="pf-btn" onclick="window.edEl('${id}').style.textAlign='center'">Center</button><button class="pf-btn" onclick="window.edEl('${id}').style.textAlign='right'">Right</button></div></div><div class="pf-toggle-row"><span>Uppercase</span><label class="toggle"><input type="checkbox" ${isUC?'checked':''} onchange="window.edEl('${id}').style.textTransform=this.checked?'uppercase':'none'"><span class="slider"></span></label></div></div><hr class="pf-divider"><div class="pf-section"><div class="pf-section-title">Text Color</div><div class="pf-row">${cpair(col, `window.edEl('${id}').style.color=this.value`)}</div></div>`;
        }

        if (id === 'cover') {
          const cvEl = document.getElementById('cover-wrapper') || el;
          const br   = parseInt(cvEl.style.borderRadius)||0;
          const bw   = parseInt(cvEl.style.borderWidth)||0;
          const bc   = w.edRgbHex(cvEl.style.borderColor)||'#ffffff';
          html += `<hr class="pf-divider"><div class="pf-section"><div class="pf-section-title">Cover Art</div><div class="pf-row"><label>Border Radius</label>${rrow(0,50,1,br, `document.getElementById('cover-wrapper').style.borderRadius=this.value+'px'`)}</div><div class="pf-row"><label>Border Width</label>${rrow(0,20,1,bw, `document.getElementById('cover-wrapper').style.borderWidth=this.value+'px'; document.getElementById('cover-wrapper').style.borderStyle='solid'`)}</div><div class="pf-row"><label>Border Color</label>${cpair(bc, `document.getElementById('cover-wrapper').style.borderColor=this.value; document.getElementById('cover-wrapper').style.borderStyle='solid'`)}</div><div class="pf-row"><label>Border Style</label><select onchange="document.getElementById('cover-wrapper').style.borderStyle=this.value"><option value="solid">Solid</option><option value="dashed">Dashed</option><option value="dotted">Dotted</option><option value="none">None</option></select></div><div class="pf-row"><label>Shadow</label>${rrow(0,80,1,30, `document.getElementById('cover-wrapper').style.boxShadow='0 '+this.value+'px '+(this.value*2)+'px rgba(0,0,0,.8)'`)}</div><div class="pf-row"><label>Image X offset</label>${rrow(-100,100,1,0, `const img=document.getElementById('cover-img'); img.dataset.ox=this.value; img.style.transform='translate('+this.value+'px,'+(img.dataset.oy||0)+'px) scale('+(img.dataset.sc||1)+')'`)}</div><div class="pf-row"><label>Image Y offset</label>${rrow(-100,100,1,0, `const img=document.getElementById('cover-img'); img.dataset.oy=this.value; img.style.transform='translate('+(img.dataset.ox||0)+'px,'+this.value+'px) scale('+(img.dataset.sc||1)+')'`)}</div><div class="pf-row"><label>Image Scale</label>${rrow(80,200,1,100, `const img=document.getElementById('cover-img'); img.dataset.sc=this.value/100; img.style.transform='translate('+(img.dataset.ox||0)+'px,'+(img.dataset.oy||0)+'px) scale('+this.value/100+')'`, '%')}</div></div>`;
        }

        return html;
      };

      w.edBuildMulti = function() {
        const fontOpts = `<option value="'DM Sans', sans-serif">DM Sans</option><option value="'Inter', sans-serif">Inter</option><option value="'Montserrat', sans-serif">Montserrat</option><option value="'Oswald', sans-serif">Oswald</option><option value="'Poppins', sans-serif">Poppins</option><option value="'Playfair Display', serif">Playfair Display</option><option value="'Anton', sans-serif">Anton</option><option value="'Bebas Neue', sans-serif">Bebas Neue</option><option value="'Lora', serif">Lora</option><option value="'Merriweather', serif">Merriweather</option>`;
        
        return `<div class="pf-section"><div class="pf-section-title">Align to Canvas</div><div class="pf-2col" style="margin-bottom:6px;"><button class="pf-btn" onclick="window.edAlign('left')">← Left</button><button class="pf-btn" onclick="window.edAlign('right')">Right →</button><button class="pf-btn" onclick="window.edAlign('cx')">↔ Center H</button><button class="pf-btn" onclick="window.edAlign('cy')">↕ Center V</button><button class="pf-btn" onclick="window.edAlign('top')">↑ Top</button><button class="pf-btn" onclick="window.edAlign('bottom')">↓ Bottom</button></div></div><hr class="pf-divider"><div class="pf-section"><div class="pf-section-title">Distribute</div><div class="pf-2col"><button class="pf-btn" onclick="window.edDistribute('h')">↔ Horizontal</button><button class="pf-btn" onclick="window.edDistribute('v')">↕ Vertical</button></div></div><hr class="pf-divider"><div class="pf-section"><div class="pf-section-title">Batch Formatting</div>
        <div class="pf-row"><label>Font Family (selected texts)</label><select onchange="window.edSel.forEach(id=>{const el=window.edEl(id);if(el)el.style.fontFamily=this.value;})"><option value="" disabled selected>Change Font...</option>${fontOpts}</select></div>
        <div class="pf-row"><label>Color (all selected)</label><div class="pf-color-row"><input type="color" value="#ffffff" oninput="const v=this.value; window.edSel.forEach(id=>{const el=window.edEl(id);if(el){el.style.color=v; el.querySelectorAll('path,circle,rect').forEach(p=>{if(p.getAttribute('fill')!=='none')p.setAttribute('fill',v);});}}); this.nextElementSibling.value=v;" /><input type="text" value="#ffffff" oninput="let v=this.value; if(/^#[0-9a-fA-F]{3}$/i.test(v)){v='#'+v[1]+v[1]+v[2]+v[2]+v[3]+v[3];} if(/^#[0-9a-fA-F]{6}$/i.test(v)){this.previousElementSibling.value=v; this.previousElementSibling.dispatchEvent(new Event('input'));}" /></div></div>
        <div class="pf-row"><label>Opacity</label><div class="pf-range-row"><input type="range" min="0" max="100" value="100" oninput="window.edSel.forEach(id=>{const el=window.edEl(id);if(el)el.style.opacity=this.value/100});this.nextElementSibling.textContent=this.value+'%'"><span class="pf-range-val">100%</span></div></div><div class="pf-row"><label>Visibility</label><div class="pf-2col"><button class="pf-btn" onclick="window.edSel.forEach(id=>{const el=window.edEl(id);if(el)el.style.display=''})">Show All</button><button class="pf-btn" onclick="window.edSel.forEach(id=>{const el=window.edEl(id);if(el)el.style.display='none'})">Hide All</button></div></div></div>`;
      };

      // INIT CALLS
      w.updateBg();
      w.updateOverlay();

      setTimeout(() => {
        w.edInitOffsets();
        const mc = document.getElementById('poster-container');
        const mq = document.getElementById('ed-marquee');
        if (mc && mq) { mc.style.position = 'relative'; mc.appendChild(mq); }
      }, 100);

      // DOM EVENTS BINDING
      const handleMouseDown = function(e: MouseEvent) {
        const target = (e.target as Element).closest('.ed-el') as HTMLElement;
        if (!target) {
          const pr = document.getElementById('poster-container')?.getBoundingClientRect();
          if(!pr) return;
          w.edMarqState = { x0: e.clientX - pr.left, y0: e.clientY - pr.top, pr };
          if (!e.shiftKey) w.edDeselect();
          const m = document.getElementById('ed-marquee');
          if (m) {
              m.style.display = 'block';
              m.style.left = w.edMarqState.x0 + 'px';
              m.style.top  = w.edMarqState.y0 + 'px';
              m.style.width = '0'; m.style.height = '0';
          }
          e.preventDefault();
          return;
        }

        const id = target.dataset.ed;
        const additive = e.shiftKey || e.ctrlKey || e.metaKey;
        if (id && !w.edSel.includes(id)) w.edSelect(id, additive);

        w.edDragState = {
          startX: e.clientX,
          startY: e.clientY,
          startOffsets: w.edSel.map((sid: string) => ({
            id: sid,
            tx: (w.edOffsets[sid] || { tx: 0 }).tx,
            ty: (w.edOffsets[sid] || { ty: 0 }).ty,
          }))
        };
        e.preventDefault();
        e.stopPropagation();
      };

      const handleMouseMove = function(e: MouseEvent) {
        if (w.edDragState) {
          const dx = e.clientX - w.edDragState.startX;
          const dy = e.clientY - w.edDragState.startY;
          w.edDragState.startOffsets.forEach(({ id, tx, ty }: any) => {
            if (!w.edOffsets[id]) w.edOffsets[id] = { tx: 0, ty: 0 };
            w.edOffsets[id].tx = tx + dx;
            w.edOffsets[id].ty = ty + dy;
            w.edApplyTransform(id);
          });
          w.edUpdatePanelPos();
          return;
        }

        if (w.edMarqState) {
          const pr = w.edMarqState.pr;
          const x1 = e.clientX - pr.left;
          const y1 = e.clientY - pr.top;
          const x = Math.min(w.edMarqState.x0, x1);
          const y = Math.min(w.edMarqState.y0, y1);
          const wd = Math.abs(x1 - w.edMarqState.x0);
          const ht = Math.abs(y1 - w.edMarqState.y0);
          const m = document.getElementById('ed-marquee');
          if (m) {
              m.style.left = x + 'px'; m.style.top = y + 'px';
              m.style.width = wd + 'px'; m.style.height = ht + 'px';
          }

          document.querySelectorAll('.ed-el').forEach((el: any) => {
            const er = el.getBoundingClientRect();
            const ex = er.left - pr.left, ey = er.top - pr.top;
            const hit = ex < x+wd && ex+er.width > x && ey < y+ht && ey+er.height > y;
            el.classList.toggle('ed-selected', hit);
          });
        }
      };

      const handleMouseUp = function(e: MouseEvent) {
        if (w.edDragState) {
          w.edDragState = null;
          w.edUpdatePanel();
        }
        if (w.edMarqState) {
          w.edMarqState = null;
          const m = document.getElementById('ed-marquee');
          if (m) m.style.display = 'none';
          w.edSel = Array.from(document.querySelectorAll('.ed-el.ed-selected')).map((el: any) => el.dataset.ed);
          w.edUpdatePanel();
          w.edUpdateAlignBar();
        }
      };

      const handleKeyDown = function(e: KeyboardEvent) {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') return;
        if (e.key === 'Escape') { w.edDeselect(); return; }
        if (!w.edSel.length) return;
        const step = e.shiftKey ? 10 : 1;
        let dx = 0, dy = 0;
        if (e.key === 'ArrowLeft')  { dx = -step; e.preventDefault(); }
        if (e.key === 'ArrowRight') { dx =  step; e.preventDefault(); }
        if (e.key === 'ArrowUp')    { dy = -step; e.preventDefault(); }
        if (e.key === 'ArrowDown')  { dy =  step; e.preventDefault(); }
        if (dx || dy) {
          w.edSel.forEach((id: string) => {
            if (!w.edOffsets[id]) w.edOffsets[id] = { tx: 0, ty: 0 };
            w.edOffsets[id].tx += dx;
            w.edOffsets[id].ty += dy;
            w.edApplyTransform(id);
          });
          w.edUpdatePanelPos();
        }
      };

      setTimeout(() => {
          document.getElementById('poster-content')?.addEventListener('mousedown', handleMouseDown);
          document.addEventListener('mousemove', handleMouseMove);
          document.addEventListener('mouseup', handleMouseUp);
          document.addEventListener('keydown', handleKeyDown);
      }, 500);

      w._cleanupSpotifyPoster = () => {
          document.getElementById('poster-content')?.removeEventListener('mousedown', handleMouseDown);
          document.removeEventListener('mousemove', handleMouseMove);
          document.removeEventListener('mouseup', handleMouseUp);
          document.removeEventListener('keydown', handleKeyDown);
      };

    };

    initApp();

    return () => {
      const w = window as any;
      if (w._cleanupSpotifyPoster) w._cleanupSpotifyPoster();
    };
  },[]);

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
        .spotify-poster-page #poster-container { position: relative; overflow: hidden; box-shadow: 0 32px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.05); border-radius: 4px; transition: width 0.4s cubic-bezier(0.4,0,0.2,1), height 0.4s cubic-bezier(0.4,0,0.2,1); }
        .spotify-poster-page #poster { width: 100%; height: 100%; position: relative; overflow: hidden; display: flex; flex-direction: column; align-items: center; justify-content: center; }
        .spotify-poster-page #poster-bg { position: absolute; top: -2px; left: -2px; bottom: -2px; right: -2px; background: #121212; z-index: 0; }
        
        .spotify-poster-page #poster-bg-img { 
          position: absolute; 
          top: -5%; left: -5%; right: -5%; bottom: -5%; 
          background-size: cover; 
          background-position: center; 
          background-repeat: no-repeat; 
          display: none; 
          z-index: 1; 
        }
        
        .spotify-poster-page #poster-bg-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.5); z-index: 2; display: none; }
        .spotify-poster-page #poster-content { position: relative; z-index: 10; width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; }
        
        /* SPOTIFY CARD STYLES */
        .spotify-poster-page #spotify-card { width: 71.4%; display: flex; flex-direction: column; gap: 0; position: absolute; top: 50%; left: 0; right: 0; margin: 0 auto; translate: 0 -50%; }
        .spotify-poster-page #label-top { font-family: 'DM Sans', sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; color: #FFFFFF; margin-bottom: 20px; text-align: center; padding-bottom: 2px; }
        .spotify-poster-page #cover-wrapper { width: 100%; padding-bottom: 100%; position: relative; overflow: hidden; border-radius: 4px; background: #282828; box-shadow: 0 30px 60px rgba(0,0,0,0.8), 0 10px 20px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05); }
        .spotify-poster-page #cover-img { position: absolute; width: 100%; height: 100%; object-fit: cover; transform-origin: center center; transition: transform 0.2s, left 0.2s, top 0.2s; }
        .spotify-poster-page #cover-placeholder { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; color: #555; }
        .spotify-poster-page #song-info { margin-top: 36px; display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; }
        .spotify-poster-page #song-texts { flex: 1; min-width: 0; }
        .spotify-poster-page #song-title { font-family: 'DM Sans', sans-serif; font-size: 22px; font-weight: 700; color: #FFFFFF; line-height: 1.2; padding-bottom: 6px; margin-bottom: -6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .spotify-poster-page #song-artist { font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 400; color: #B3B3B3; margin-top: 2px; line-height: 1.2; padding-bottom: 6px; margin-bottom: -6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .spotify-poster-page #heart-icon { flex-shrink: 0; width: 24px; height: 24px; color: var(--accent); margin-top: 3px; }
        .spotify-poster-page #progress-section { margin-top: 14px; }
        .spotify-poster-page #progress-bar-track { width: 100%; height: 4px; background: #535353; border-radius: 2px; position: relative; overflow: hidden; }
        .spotify-poster-page #progress-bar-fill { height: 100%; background: #FFFFFF; border-radius: 2px; width: 35%; position: relative; }
        .spotify-poster-page #progress-bar-fill::after { content: ''; position: absolute; right: -5px; top: 50%; transform: translateY(-50%); width: 12px; height: 12px; background: #FFFFFF; border-radius: 50%; display: none; }
        .spotify-poster-page #progress-bar-track:hover #progress-bar-fill::after { display: block; }
        .spotify-poster-page #time-row { display: flex; justify-content: space-between; margin-top: 5px; }
        .spotify-poster-page #time-row span { font-size: 10px; color: #B3B3B3; font-family: 'DM Sans', sans-serif; font-weight: 400; }
        .spotify-poster-page #controls-row { display: flex; align-items: center; justify-content: space-between; margin-top: 14px; padding: 0 4px; }
        .spotify-poster-page .ctrl-btn { background: none; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #B3B3B3; transition: color 0.15s, transform 0.1s; padding: 4px; }
        .spotify-poster-page .ctrl-btn:hover { color: #FFFFFF; }
        .spotify-poster-page #play-btn { width: 56px; height: 56px; background: #FFFFFF; border-radius: 50%; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #000; transition: transform 0.1s, background 0.15s; box-shadow: 0 4px 12px rgba(0,0,0,0.4); flex-shrink: 0; }
        .spotify-poster-page #play-btn:hover { transform: scale(1.06); }
        .spotify-poster-page #barcode-section { display: none; align-items: center; justify-content: center; margin-top: 24px; gap: 12px; }
        .spotify-poster-page #barcode-svg { height: 48px; width: auto; }
        .spotify-poster-page .loading-spinner { width: 16px; height: 16px; border: 2px solid #333; border-top-color: var(--accent); border-radius: 50%; animation: spin 0.6s linear infinite; display: none; }

        /* ===== ACCORDION ===== */
        .spotify-poster-page .accordion-btn { width: 100%; background: none; border: none; color: var(--spotify-subtext); font-size: 10px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; text-align: left; padding: 16px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--panel-border); font-family: 'DM Sans', sans-serif; transition: color 0.15s; }
        .spotify-poster-page .accordion-btn:hover { color: var(--spotify-text); }
        .spotify-poster-page .accordion-btn .arrow { font-size: 9px; transition: transform 0.2s; }
        .spotify-poster-page .accordion-btn.open .arrow { transform: rotate(180deg); }
        .spotify-poster-page .accordion-content { display: none; padding: 14px 16px; border-bottom: 1px solid var(--panel-border); }
        .spotify-poster-page .accordion-content.open { display: block; }
        .spotify-poster-page #toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%) translateY(20px); background: var(--accent); color: #000; padding: 10px 20px; border-radius: 24px; font-size: 13px; font-weight: 600; opacity: 0; transition: all 0.3s; z-index: 9999; pointer-events: none; }
        .spotify-poster-page #toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }

        /* ══════════════════════════════════════════ EDITOR OVERLAY ══════════════════════════════════════════ */
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
        .spotify-poster-page .ed-el { outline: 1.5px solid transparent; cursor: pointer; transition: outline-color 0.1s; position: relative; transform-origin: top left; }
        .spotify-poster-page .ed-el:hover { outline-color: rgba(29,185,84,0.45) !important; }
        .spotify-poster-page .ed-el.ed-selected { outline-color: #1DB954 !important; }
        .spotify-poster-page .ed-el.ed-selected::before { content: ''; position: absolute; inset: 0; background: rgba(29,185,84,0.04); pointer-events: none; z-index: 0; }
        .spotify-poster-page #ed-marquee { position: absolute; border: 1px dashed #1DB954; background: rgba(29,185,84,0.05); pointer-events: none; display: none; z-index: 9999; }
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

      <div id="panel">
        <div className="panel-header">
          <div className="title-group">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="12" fill="#1DB954"/>
                <path d="M17.9 10.9C14.7 9 9.35 8.8 6.3 9.75c-.5.15-1-.15-1.15-.6-.15-.5.15-1 .6-1.15 3.55-1.05 9.4-.85 13.1 1.35.45.25.6.85.35 1.3-.25.35-.85.5-1.3.25zm-.1 2.8c-.25.35-.7.5-1.05.25-2.7-1.65-6.8-2.15-9.95-1.15-.4.1-.85-.1-.95-.5-.1-.4.1-.85.5-.95 3.65-1.1 8.15-.55 11.25 1.35.3.15.45.65.2 1zm-1.2 2.75c-.2.3-.55.4-.85.2-2.35-1.45-5.3-1.75-8.8-.95-.35.1-.65-.15-.75-.45-.1-.35.15-.65.45-.75 3.8-.85 7.1-.5 9.7 1.1.35.15.4.55.25.85z" fill="white"/>
            </svg>
            <h1>Spotify Poster</h1>
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
          <div className="form-row"><label>Opacity (%)</label>
            <div className="range-row"><input type="range" min="0" max="100" defaultValue="100" onInput={(e: any) => { document.getElementById('barcode-section')!.style.opacity = (parseFloat(e.target.value) / 100).toString(); e.target.nextElementSibling!.textContent = e.target.value + '%'; }} /><span className="range-val">100%</span></div>
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
            <label className="toggle"><input type="checkbox" id="show-label-top" defaultChecked onChange={(e: any) => document.getElementById('label-top')!.style.display = e.target.checked ? 'block' : 'none'} /><span className="slider"></span></label>
          </div>
          <div className="form-row">
            <label>Text</label>
            <input type="text" id="label-top-input" defaultValue="Now Playing" onInput={(e: any) => document.getElementById('label-top')!.textContent = e.target.value} />
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
            <input type="text" id="song-title-input" defaultValue="Song Title" onInput={(e: any) => document.getElementById('song-title')!.textContent = e.target.value} />
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
            <input type="text" id="song-artist-input" defaultValue="Artist Name" onInput={(e: any) => document.getElementById('song-artist')!.textContent = e.target.value} />
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
            <label className="toggle"><input type="checkbox" defaultChecked onChange={(e: any) => document.getElementById('progress-section')!.style.display = e.target.checked ? 'block' : 'none'} /><span className="slider"></span></label>
          </div>
          <div className="two-col">
            <div className="form-row"><label>Start Time</label><input type="text" id="time-start" defaultValue="1:12" onInput={() => (window as any).handleStartTimeChange()} /></div>
            <div className="form-row"><label>End Time</label><input type="text" id="time-end" defaultValue="3:45" onInput={() => (window as any).handleEndTimeChange()} /></div>
          </div>
          <div className="form-row"><label>Progress %</label>
            <div className="range-row"><input type="range" min="0" max="100" defaultValue="35" id="progress-val" onInput={(e: any) => (window as any).updateProgress(e.target.value)} /><span className="range-val" id="progress-display">35%</span></div>
          </div>
        </div>

        <button className="accordion-btn" onClick={(e) => (window as any).toggleAccordion(e.currentTarget)}>▶️ Controls & Heart<span className="arrow">▼</span></button>
        <div className="accordion-content">
          <div className="toggle-row">
            <label>Controls Visible</label>
            <label className="toggle"><input type="checkbox" defaultChecked onChange={(e: any) => document.getElementById('controls-row')!.style.display = e.target.checked ? 'flex' : 'none'} /><span className="slider"></span></label>
          </div>
          <div className="toggle-row">
            <label>Heart Visible</label>
            <label className="toggle"><input type="checkbox" defaultChecked onChange={(e: any) => document.getElementById('heart-icon')!.style.display = e.target.checked ? 'block' : 'none'} /><span className="slider"></span></label>
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
          <div className="form-row">
            <label>Content Width (%)</label>
            <div className="range-row">
              <input type="range" min="40" max="95" defaultValue="71" onInput={(e: any) => { document.getElementById('spotify-card')!.style.width = e.target.value + '%'; e.target.nextElementSibling!.textContent = e.target.value + '%'; }} />
              <span className="range-val">71%</span>
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
                <div id="spotify-card" style={{ display: 'flex' }}>
                  <div id="label-top" className="ed-el" data-ed="label-top">Now Playing</div>
                  <div id="cover-wrapper" className="ed-el" data-ed="cover">
                    <div id="cover-placeholder">
                      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <circle cx="12" cy="12" r="10"/>
                        <circle cx="12" cy="12" r="3"/>
                        <line x1="12" y1="2" x2="12" y2="9"/>
                        <line x1="12" y1="15" x2="12" y2="22"/>
                      </svg>
                    </div>
                    <img id="cover-img" src="" alt="" style={{ display: 'none' }} />
                  </div>
                  <div id="song-info" className="ed-el" data-ed="song-info">
                    <div id="song-texts">
                      <div id="song-title" className="ed-el" data-ed="song-title">Song Title</div>
                      <div id="song-artist" className="ed-el" data-ed="song-artist">Artist Name</div>
                    </div>
                    <svg id="heart-icon" className="ed-el" data-ed="heart" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                  </div>
                  <div id="progress-section" className="ed-el" data-ed="progress">
                    <div id="progress-bar-track"><div id="progress-bar-fill"></div></div>
                    <div id="time-row"><span id="time-start-el">1:12</span><span id="time-end-el">3:45</span></div>
                  </div>
                  <div id="controls-row">
                    <button className="ctrl-btn ed-el" data-ed="btn-shuffle" style={{ color: '#B3B3B3' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/>
                        <polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/>
                      </svg>
                    </button>
                    <button className="ctrl-btn ed-el" data-ed="btn-prev" style={{ color: '#B3B3B3' }}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="19 20 9 12 19 4 19 20"/><line x1="5" y1="19" x2="5" y2="5" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                    </button>
                    <button id="play-btn" className="ed-el" data-ed="play">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="5 3 19 12 5 21 5 3"/>
                      </svg>
                    </button>
                    <button className="ctrl-btn ed-el" data-ed="btn-next" style={{ color: '#B3B3B3' }}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                    </button>
                    <button className="ctrl-btn ed-el" data-ed="btn-repeat" style={{ color: '#B3B3B3' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/>
                        <polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>
                      </svg>
                    </button>
                  </div>
                  <div id="barcode-section" className="ed-el" data-ed="barcode" style={{ display: 'none' }}>
                    <svg id="barcode-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 48"></svg>
                  </div>
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
