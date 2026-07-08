import React, { useEffect, useRef, useState } from 'react';

export default function SpotifyPosterBuilder() {
  const isInitialized = useRef(false);
  const [posterMode, setPosterMode] = useState<'select' | 'spotify' | 'vinyl'>('select');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<any>(null);

  useEffect(() => {
    if (posterMode === 'select') return;
    isInitialized.current = false;

    // Harici Kütüphaneleri Yükle (Fabric.js, jsPDF, JSZip)
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

      const w = window as any;
      const fabric = w.fabric;

      w.POSTER_MODE = posterMode;

      // Fabric Canvas Kurulumu
      if (canvasRef.current) {
        if (fabricCanvasRef.current) {
          fabricCanvasRef.current.dispose();
        }
        fabricCanvasRef.current = new fabric.Canvas(canvasRef.current, {
          preserveObjectStacking: true,
          backgroundColor: posterMode === 'vinyl' ? '#f5f5f5' : '#121212',
          selectionColor: 'rgba(29, 185, 84, 0.15)',
          selectionBorderColor: '#1DB954',
          selectionLineWidth: 1.5,
        });
      }

      const fCanvas = fabricCanvasRef.current;

      // Eleman Seçildiğinde Özellik Panelini Güncelleme
      fCanvas.on('selection:created', () => w.edUpdatePanel());
      fCanvas.on('selection:updated', () => w.edUpdatePanel());
      fCanvas.on('selection:cleared', () => w.edUpdatePanel());
      fCanvas.on('object:moving', () => w.edUpdatePanelPos());
      fCanvas.on('object:scaling', () => w.edUpdatePanelPos());

      // ══════════════════════════════════════════════════════════════
      // TEMEL CANVAS BOYUT VE ORAN AYARLARI
      // ══════════════════════════════════════════════════════════════
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
        if (!selectEl) return;
        const key = selectEl.value;
        const [w_size, h_size] = w.CANVAS_SIZES[key];
        const ratio = w_size / h_size;

        const area = document.getElementById('canvas-area');
        if (!area) return;
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

        // Sanal boyutu (baskı çözünürlüğü tabanı) yüksek tutup CSS ile ölçeklendiriyoruz
        const baseWidth = w_size * 100;
        const baseHeight = h_size * 100;

        fCanvas.setWidth(baseWidth);
        fCanvas.setHeight(baseHeight);

        const container = document.getElementById('poster-container');
        if (container) {
          container.style.width = pw + 'px';
          container.style.height = ph + 'px';
        }

        fCanvas.setZoom(pw / baseWidth);
        fCanvas.calcOffset();
        fCanvas.renderAll();
      };

      window.addEventListener('resize', w.updateCanvasSize);

      w.toggleAccordion = function(btn: HTMLElement) {
        btn.classList.toggle('open');
        const content = btn.nextElementSibling as HTMLElement;
        if (content) content.classList.toggle('open');
      };

      w.showToast = function(msg: string) {
        const toast = document.getElementById('toast');
        if (!toast) return;
        toast.textContent = msg;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3500);
      };

      // ══════════════════════════════════════════════════════════════
      // FABRIC NESNE AYARLARI VE FABRIC UYARLAMALARI
      // ══════════════════════════════════════════════════════════════
      w.customizeControls = function(obj: any) {
        obj.set({
          cornerColor: '#1DB954',
          cornerStrokeColor: '#1DB954',
          borderColor: '#1DB954',
          cornerStyle: 'circle',
          cornerSize: 8,
          transparentCorners: false,
          padding: 4
        });
      };

      // Spotify / Vinyl elemanlarını oluşturma
      w.initTemplate = function() {
        fCanvas.clear();
        fCanvas.setBackgroundColor(w.POSTER_MODE === 'vinyl' ? '#f5f5f5' : '#121212', fCanvas.renderAll.bind(fCanvas));

        if (w.POSTER_MODE === 'spotify') {
          // 1. Top Label (Now Playing)
          const topLabel = new fabric.IText('NOW PLAYING', {
            left: 100, top: 40, fontSize: 16, fontFamily: 'Inter',
            fill: '#ffffff', charSpacing: 150, textAlign: 'center', originX: 'center', id: 'label-top'
          });
          fCanvas.add(topLabel);
          w.customizeControls(topLabel);

          // 2. Cover Art Placeholder (Grup olarak)
          const rect = new fabric.Rect({
            width: 300, height: 300, fill: '#282828', rx: 4, ry: 4, stroke: '#333333', strokeWidth: 1
          });
          const coverGroup = new fabric.Group([rect], {
            left: 50, top: 80, id: 'cover', width: 300, height: 300
          });
          fCanvas.add(coverGroup);
          w.customizeControls(coverGroup);

          // 3. Song Title
          const songTitle = new fabric.IText('Song Title', {
            left: 50, top: 410, fontSize: 24, fontFamily: 'Inter', fontWeight: 'bold',
            fill: '#ffffff', id: 'song-title'
          });
          fCanvas.add(songTitle);
          w.customizeControls(songTitle);

          // 4. Artist Name
          const songArtist = new fabric.IText('Artist Name', {
            left: 50, top: 445, fontSize: 16, fontFamily: 'Inter',
            fill: '#B3B3B3', id: 'song-artist'
          });
          fCanvas.add(songArtist);
          w.customizeControls(songArtist);

          // 5. Heart Icon (SVG Path)
          const heartPath = new fabric.Path('M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z', {
            left: 320, top: 410, fill: '#1DB954', scale: 1.2, id: 'heart'
          });
          fCanvas.add(heartPath);
          w.customizeControls(heartPath);

          // 6. Progress Bar Track & Fill
          const track = new fabric.Rect({ width: 300, height: 4, fill: '#535353', rx: 2, ry: 2 });
          const fill = new fabric.Rect({ width: 105, height: 4, fill: '#ffffff', rx: 2, ry: 2 });
          const progressGroup = new fabric.Group([track, fill], {
            left: 50, top: 490, id: 'progress'
          });
          fCanvas.add(progressGroup);
          w.customizeControls(progressGroup);

          // 7. Time Stamps
          const timeStart = new fabric.Text('1:12', { left: 50, top: 505, fontSize: 12, fill: '#B3B3B3', fontFamily: 'Inter', id: 'time-start-el' });
          const timeEnd = new fabric.Text('3:45', { left: 320, top: 505, fontSize: 12, fill: '#B3B3B3', fontFamily: 'Inter', id: 'time-end-el' });
          fCanvas.add(timeStart);
          fCanvas.add(timeEnd);
          w.customizeControls(timeStart);
          w.customizeControls(timeEnd);

          // 8. Controls (Shuffle, Prev, Play, Next, Repeat)
          const playCircle = new fabric.Circle({ radius: 24, fill: '#ffffff', originX: 'center', originY: 'center' });
          const playTriangle = new fabric.Path('M0,0 L0,14 L12,7 Z', { fill: '#000000', originX: 'center', originY: 'center', left: 2 });
          const playBtn = new fabric.Group([playCircle, playTriangle], {
            left: 176, top: 540, id: 'play'
          });
          fCanvas.add(playBtn);
          w.customizeControls(playBtn);

        } else if (w.POSTER_MODE === 'vinyl') {
          // 1. Artist Name (Top Left)
          const vTL = new fabric.IText('ARTIST NAME', {
            left: 40, top: 40, fontSize: 18, fontFamily: 'Inter', fontWeight: 'bold', fill: '#212121', charSpacing: 100, id: 'v-top-left'
          });
          fCanvas.add(vTL);
          w.customizeControls(vTL);

          // 2. Year (Top Right)
          const vTR = new fabric.IText('1992', {
            left: 320, top: 40, fontSize: 18, fontFamily: 'Inter', fontWeight: 'bold', fill: '#212121', charSpacing: 100, id: 'v-top-right'
          });
          fCanvas.add(vTR);
          w.customizeControls(vTR);

          // 3. Song Title (Vinyl Center)
          const vTitle = new fabric.IText('SONG NAME', {
            left: 200, top: 100, fontSize: 32, fontFamily: 'Inter', fontWeight: '900', fill: '#212121', charSpacing: 200, originX: 'center', id: 'v-song-title'
          });
          fCanvas.add(vTitle);
          w.customizeControls(vTitle);

          // 4. Vinyl Center Record (Grup)
          w.renderVinylGroup();

          // 5. Bottom Text
          const vBot = new fabric.IText('UNKNOWN ALBUM', {
            left: 200, top: 510, fontSize: 14, fontFamily: 'Inter', fontWeight: '600', fill: '#555555', charSpacing: 100, originX: 'center', id: 'v-bottom'
          });
          fCanvas.add(vBot);
          w.customizeControls(vBot);
        }

        w.updateCanvasSize();
        fCanvas.renderAll();
      };

      // ══════════════════════════════════════════════════════════════
      // SPORAL VE VINYL GRUBU OLUŞTURMA VE GÜNCELLEME
      // ══════════════════════════════════════════════════════════════
      w.renderVinylGroup = function() {
        const existing = fCanvas.getObjects().find((o: any) => o.id === 'v-vinyl');
        if (existing) fCanvas.remove(existing);

        const fsInput = document.getElementById('vinyl-text-size') as HTMLInputElement;
        const lyricsInput = document.getElementById('vinyl-lyrics-input') as HTMLTextAreaElement;
        
        const fs = parseInt(fsInput?.value || "12");
        const rawLyrics = lyricsInput?.value || "LOREM IPSUM...";

        const cx = 200, cy = cx;
        const minR = 60;
        const spacing = fs * 0.7;

        // Spiral koordinatları hesaplama ve SVG Path oluşturma
        let points = [];
        const loops = 8;
        const steps = 300;
        const maxR = minR + loops * spacing;

        for (let i = 0; i <= steps; i++) {
          let t = -Math.PI / 2 + (i / steps) * loops * Math.PI * 2;
          let r = minR + ((maxR - minR) * (i / steps));
          let x = cx + r * Math.cos(t);
          let y = cy + r * Math.sin(t);
          points.push(`${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`);
        }
        const spiralPathD = points.join(' ');

        // Ana plak siyah gövdesi
        const vinylBody = new fabric.Circle({
          radius: 175, fill: '#111111', originX: 'center', originY: 'center', left: cx, top: cy
        });

        // Plak içi yiv çizgileri
        const groove1 = new fabric.Circle({
          radius: 140, fill: 'transparent', stroke: '#222222', strokeWidth: 1, originX: 'center', originY: 'center', left: cx, top: cy
        });
        const groove2 = new fabric.Circle({
          radius: 110, fill: 'transparent', stroke: '#222222', strokeWidth: 1, originX: 'center', originY: 'center', left: cx, top: cy
        });

        // Spiral yol (görünmez)
        const spiralPathObj = new fabric.Path(spiralPathD, {
          fill: 'transparent', stroke: 'transparent', objectCaching: false
        });

        // Fabric.js 5.x+ Text Path Özelliğiyle Şarkı Sözü Ekleme
        const spiralText = new fabric.Text(rawLyrics.toUpperCase(), {
          fontSize: fs,
          fontFamily: 'Inter',
          fill: '#b3b3b3',
          path: spiralPathObj,
          id: 'v-spiral-text'
        });

        // Merkez etiket kartonu (Görsel veya gri alan)
        const centerLabel = new fabric.Circle({
          radius: 45, fill: '#dedede', originX: 'center', originY: 'center', left: cx, top: cy, id: 'v-vinyl-label'
        });

        // Merkez mil deliği
        const centerHole = new fabric.Circle({
          radius: 6, fill: '#121212', originX: 'center', originY: 'center', left: cx, top: cy
        });

        const vinylGroup = new fabric.Group([vinylBody, groove1, groove2, spiralText, centerLabel, centerHole], {
          left: 100, top: 160, width: 350, height: 350, id: 'v-vinyl'
        });

        fCanvas.add(vinylGroup);
        w.customizeControls(vinylGroup);
        fCanvas.renderAll();
      };

      w.updateVinylSpiral = function() {
        if (w.POSTER_MODE !== 'vinyl') return;
        w.renderVinylGroup();
      };

      // ══════════════════════════════════════════════════════════════
      // OTOMATİK KONTRAST AYARI
      // ══════════════════════════════════════════════════════════════
      w.applyAutoContrast = function(bgHex: string) {
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

        const setObjFill = (id: string, col: string) => {
          const obj = fCanvas.getObjects().find((o: any) => o.id === id);
          if (obj) { obj.set('fill', col); }
        };

        setObjFill('v-top-left', mainTextCol);
        setObjFill('v-top-right', mainTextCol);
        setObjFill('v-song-title', mainTextCol);
        setObjFill('v-bottom', subTextCol);

        fCanvas.renderAll();
      };

      w.updateBgColor = function() {
        const colorId = w.POSTER_MODE === 'vinyl' ? 'v-bg-color' : 'bg-color';
        const txtId = w.POSTER_MODE === 'vinyl' ? 'v-bg-color-txt' : 'bg-color-txt';
        const colorEl = document.getElementById(colorId) as HTMLInputElement;
        const txtEl = document.getElementById(txtId) as HTMLInputElement;
        if (!colorEl) return;
        const color = colorEl.value;

        fCanvas.setBackgroundColor(color, fCanvas.renderAll.bind(fCanvas));
        if (txtEl) txtEl.value = color;

        if (w.POSTER_MODE === 'vinyl') {
          w.applyAutoContrast(color);
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
          w.updateBgColor();
        }
      };

      // ══════════════════════════════════════════════════════════════
      // HARİCİ METADATA YÜKLEME VE GÖRSEL DOSYA OKUMA
      // ══════════════════════════════════════════════════════════════
      w.handleCoverUpload = function(event: any) {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e: any) => {
          fabric.Image.fromURL(e.target.result, (img: any) => {
            const coverObj = fCanvas.getObjects().find((o: any) => o.id === 'cover');
            if (coverObj) {
              // Mevcut cover grubunu silip yenisini görselle kuruyoruz
              const targetWidth = coverObj.width * coverObj.scaleX;
              const targetHeight = coverObj.height * coverObj.scaleY;
              img.scaleToWidth(targetWidth);
              img.set({
                left: coverObj.left,
                top: coverObj.top,
                id: 'cover'
              });
              fCanvas.remove(coverObj);
              fCanvas.add(img);
              w.customizeControls(img);
              fCanvas.renderAll();
            }
          });
        };
        reader.readAsDataURL(file);
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

          if (results) {
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

      w.applySearchResult = async function(item: any) {
        const updateTextObject = (id: string, text: string) => {
          const obj = fCanvas.getObjects().find((o: any) => o.id === id);
          if (obj) {
            obj.set('text', text);
            fCanvas.renderAll();
          }
        };

        if (w.POSTER_MODE === 'spotify') {
          updateTextObject('song-title', item.trackName);
          updateTextObject('song-artist', item.artistName);

          const artUrl = item.artworkUrl100.replace('100x100bb', '600x600bb');
          fabric.Image.fromURL(artUrl, (img: any) => {
            const coverObj = fCanvas.getObjects().find((o: any) => o.id === 'cover');
            if (coverObj) {
              img.scaleToWidth(300);
              img.set({ left: coverObj.left, top: coverObj.top, id: 'cover' });
              fCanvas.remove(coverObj);
              fCanvas.add(img);
              w.customizeControls(img);
              fCanvas.renderAll();
            }
          }, { crossOrigin: 'anonymous' });

          w.showToast('✓ ' + item.trackName + ' yüklendi');
        } 
        else if (w.POSTER_MODE === 'vinyl') {
          updateTextObject('v-song-title', item.trackName.toUpperCase());
          updateTextObject('v-top-left', item.artistName.toUpperCase());
          
          const year = new Date(item.releaseDate).getFullYear() || "1992";
          updateTextObject('v-top-right', year.toString());

          const album = item.collectionName ? item.collectionName.toUpperCase() : "UNKNOWN ALBUM";
          updateTextObject('v-bottom', album);

          w.showToast('Sözler aranıyor...');
          let lyrics = await w.fetchLyrics(item.artistName, item.trackName);
          const linp = document.getElementById('vinyl-lyrics-input') as HTMLTextAreaElement;
          if (lyrics) {
            if (linp) linp.value = lyrics;
            w.showToast('✓ Şarkı ve sözleri başarıyla aktarıldı');
          } else {
            if (linp) linp.value = "LOREM IPSUM DOLOR SIT AMET CONSECTETUR ADIPISCING ELIT SED DO EIUSMOD TEMPOR INCIDIDUNT UT LABORE ET DOLORE MAGNA ALIQUA";
            w.showToast('Sözler bulunamadı, varsayılan metin yerleştirildi');
          }
          w.updateVinylSpiral();
        }
      };

      // ══════════════════════════════════════════════════════════════
      // SPORIFY BARKOD ENTEGRASYONU (FABRIC)
      // ══════════════════════════════════════════════════════════════
      w.currentTrackUri = '';
      w.handleSpotifyInput = function() {
        const input = (document.getElementById('spotify-uri') as HTMLInputElement).value.trim();
        let uri = null;
        const urlMatch = input.match(/track\/([a-zA-Z0-9]+)/);
        if (urlMatch) uri = `spotify:track:${urlMatch[1]}`;
        const uriMatch = input.match(/spotify:track:([a-zA-Z0-9]+)/);
        if (uriMatch) uri = input;

        if (uri) {
          w.currentTrackUri = uri;
          w.drawBarcode();
        }
      };

      w.drawBarcode = async function() {
        if (!w.currentTrackUri) return;
        const spotifyUrl = `https://scannables.scdn.co/uri/plain/svg/ffffff/black/640/${w.currentTrackUri}`;
        const url = `https://api.allorigins.win/raw?url=${encodeURIComponent(spotifyUrl)}`;
        
        try {
          const res = await fetch(url);
          if (!res.ok) return;
          const svgText = await res.text();

          // Mevcut varsa kaldır
          const existing = fCanvas.getObjects().find((o: any) => o.id === 'barcode');
          if (existing) fCanvas.remove(existing);

          fabric.loadSVGFromString(svgText, (objects: any, options: any) => {
            const barcodeGroup = fabric.util.groupSVGElements(objects, options);
            barcodeGroup.set({
              left: 50,
              top: 600,
              scaleX: 0.5,
              scaleY: 0.5,
              id: 'barcode'
            });
            fCanvas.add(barcodeGroup);
            w.customizeControls(barcodeGroup);
            fCanvas.renderAll();
          });
        } catch (e) {
          w.showToast('Barkod çekilemedi.');
        }
      };

      // ══════════════════════════════════════════════════════════════
      // HİZALAMA VE DAĞITMA FONKSİYONLARI (ALGIN & DISTRIBUTE)
      // ══════════════════════════════════════════════════════════════
      w.edAlign = function(mode: string) {
        const activeObjects = fCanvas.getActiveObjects();
        if (activeObjects.length === 0) return;

        const canvasWidth = fCanvas.width;
        const canvasHeight = fCanvas.height;

        activeObjects.forEach((obj: any) => {
          const bound = obj.getBoundingRect(true);
          switch (mode) {
            case 'left':
              obj.set('left', 0);
              break;
            case 'right':
              obj.set('left', canvasWidth - bound.width);
              break;
            case 'cx':
              obj.centerH();
              break;
            case 'cy':
              obj.centerV();
              break;
            case 'top':
              obj.set('top', 0);
              break;
            case 'bottom':
              obj.set('top', canvasHeight - bound.height);
              break;
          }
        });
        fCanvas.renderAll();
        w.edUpdatePanel();
      };

      w.edDistribute = function(axis: string) {
        const activeObjects = fCanvas.getActiveObjects();
        if (activeObjects.length < 3) return;

        if (axis === 'h') {
          activeObjects.sort((a: any, b: any) => a.left - b.left);
          const first = activeObjects[0];
          const last = activeObjects[activeObjects.length - 1];
          const totalSpace = last.left - (first.left + first.width);
          let sumWidth = 0;
          for (let i = 1; i < activeObjects.length - 1; i++) {
            sumWidth += activeObjects[i].width;
          }
          const gap = (totalSpace - sumWidth) / (activeObjects.length - 1);
          let currentLeft = first.left + first.width + gap;
          for (let i = 1; i < activeObjects.length - 1; i++) {
            activeObjects[i].set('left', currentLeft);
            currentLeft += activeObjects[i].width + gap;
          }
        } else {
          activeObjects.sort((a: any, b: any) => a.top - b.top);
          const first = activeObjects[0];
          const last = activeObjects[activeObjects.length - 1];
          const totalSpace = last.top - (first.top + first.height);
          let sumHeight = 0;
          for (let i = 1; i < activeObjects.length - 1; i++) {
            sumHeight += activeObjects[i].height;
          }
          const gap = (totalSpace - sumHeight) / (activeObjects.length - 1);
          let currentTop = first.top + first.height + gap;
          for (let i = 1; i < activeObjects.length - 1; i++) {
            activeObjects[i].set('top', currentTop);
            currentTop += activeObjects[i].height + gap;
          }
        }
        fCanvas.renderAll();
      };

      w.edUpdateAlignBar = function() {
        const hasSelection = fCanvas.getActiveObjects().length > 0;
        document.getElementById('ed-align-bar')!.classList.toggle('ed-bar-visible', hasSelection);
      };

      // ══════════════════════════════════════════════════════════════
      // DINAMIK ÖZELLİKLER PANELİ (PROPERTIES PANEL BRIDGE)
      // ══════════════════════════════════════════════════════════════
      w.edUpdatePanel = function() {
        const empty  = document.getElementById('props-empty-state');
        const fields = document.getElementById('props-fields');
        const nameEl = document.getElementById('props-selected-name');
        
        const activeObjects = fCanvas.getActiveObjects();

        if (activeObjects.length === 0) {
          if (empty) empty.style.display = '';
          if (fields) fields.style.display = 'none';
          if (nameEl) nameEl.textContent = '';
          w.edUpdateAlignBar();
          return;
        }

        if (empty) empty.style.display = 'none';
        if (fields) fields.style.display = '';

        if (activeObjects.length > 1) {
          if (nameEl) nameEl.textContent = activeObjects.length + ' elements';
          if (fields) fields.innerHTML = w.edBuildMulti();
          w.edUpdateAlignBar();
          return;
        }

        const activeObj = activeObjects[0];
        if (nameEl) nameEl.textContent = activeObj.id || activeObj.type;
        if (fields) fields.innerHTML = w.edBuildSingle(activeObj);
        w.edUpdateAlignBar();
      };

      w.edUpdatePanelPos = function() {
        const activeObj = fCanvas.getActiveObject();
        if (!activeObj) return;
        const xi = document.getElementById('epx') as HTMLInputElement;
        const yi = document.getElementById('epy') as HTMLInputElement;
        if (xi) xi.value = Math.round(activeObj.left).toString();
        if (yi) yi.value = Math.round(activeObj.top).toString();
      };

      w.edSetXY = function(axis: string, val: string) {
        const activeObj = fCanvas.getActiveObject();
        if (!activeObj) return;
        if (axis === 'x') activeObj.set('left', parseFloat(val));
        else activeObj.set('top', parseFloat(val));
        fCanvas.renderAll();
      };

      w.edSetProperty = function(prop: string, val: any) {
        const activeObj = fCanvas.getActiveObject();
        if (!activeObj) return;
        activeObj.set(prop, val);
        fCanvas.renderAll();
      };

      w.edSetText = function(val: string) {
        const activeObj = fCanvas.getActiveObject();
        if (!activeObj || !activeObj.isType('text') && !activeObj.isType('i-text')) return;
        activeObj.set('text', val);
        fCanvas.renderAll();
      };

      w.edBuildSingle = function(obj: any) {
        const left = Math.round(obj.left);
        const top = Math.round(obj.top);
        const width = Math.round(obj.width * obj.scaleX);
        const height = Math.round(obj.height * obj.scaleY);
        const opacity = Math.round(obj.opacity * 100);

        let html = `
          <div class="pf-section">
            <div class="pf-section-title">Konum &amp; Boyut</div>
            <div class="pf-2col">
              <div class="pf-row">
                <label>X Konumu</label>
                <input type="number" id="epx" value="${left}" oninput="window.edSetXY('x', this.value)">
              </div>
              <div class="pf-row">
                <label>Y Konumu</label>
                <input type="number" id="epy" value="${top}" oninput="window.edSetXY('y', this.value)">
              </div>
            </div>
            <div class="pf-2col">
              <div class="pf-row">
                <label>Genişlik (px)</label>
                <input type="number" value="${width}" oninput="window.edSetProperty('width', parseFloat(this.value)); window.fabricCanvasRef.current.renderAll();">
              </div>
              <div class="pf-row">
                <label>Yükseklik (px)</label>
                <input type="number" value="${height}" oninput="window.edSetProperty('height', parseFloat(this.value)); window.fabricCanvasRef.current.renderAll();">
              </div>
            </div>
          </div>
          <hr class="pf-divider">
          <div class="pf-section">
            <div class="pf-section-title">Görünürlük &amp; Opaklık</div>
            <div class="pf-row">
              <label>Opaklık (%)</label>
              <input type="range" min="0" max="100" value="${opacity}" oninput="window.edSetProperty('opacity', parseFloat(this.value)/100); this.nextElementSibling.textContent=this.value+'%'">
              <span class="pf-range-val">${opacity}%</span>
            </div>
          </div>
        `;

        if (obj.isType('text') || obj.isType('i-text')) {
          html += `
            <hr class="pf-divider">
            <div class="pf-section">
              <div class="pf-section-title">Metin Özellikleri</div>
              <div class="pf-row">
                <label>İçerik</label>
                <input type="text" value="${obj.text}" oninput="window.edSetText(this.value)">
              </div>
              <div class="pf-2col">
                <div class="pf-row">
                  <label>Yazı Boyutu</label>
                  <input type="number" value="${obj.fontSize}" oninput="window.edSetProperty('fontSize', parseInt(this.value))">
                </div>
                <div class="pf-row">
                  <label>Renk</label>
                  <input type="color" value="${obj.fill}" oninput="window.edSetProperty('fill', this.value)">
                </div>
              </div>
            </div>
          `;
        }

        return html;
      };

      w.edBuildMulti = function() {
        return `
          <div class="pf-section">
            <div class="pf-section-title">Çoklu Hizalama</div>
            <div class="pf-3col">
              <button class="pf-btn" onclick="window.edAlign('left')">Sola Yasla</button>
              <button class="pf-btn" onclick="window.edAlign('cx')">Yatay Ortala</button>
              <button class="pf-btn" onclick="window.edAlign('right')">Sağa Yasla</button>
            </div>
            <div class="pf-3col" style="margin-top: 6px;">
              <button class="pf-btn" onclick="window.edAlign('top')">Üste Yasla</button>
              <button class="pf-btn" onclick="window.edAlign('cy')">Dikey Ortala</button>
              <button class="pf-btn" onclick="window.edAlign('bottom')">Alta Yasla</button>
            </div>
          </div>
          <hr class="pf-divider">
          <div class="pf-section">
            <div class="pf-section-title">Eşit Boşluklu Dağıt</div>
            <div class="pf-2col">
              <button class="pf-btn" onclick="window.edDistribute('h')">Yatay Hizala</button>
              <button class="pf-btn" onclick="window.edDistribute('v')">Dikey Hizala</button>
            </div>
          </div>
        `;
      };

      // ══════════════════════════════════════════════════════════════
      // İNDİRME VE PDF/PNG/SVG DISA AKTARMA
      // ══════════════════════════════════════════════════════════════
      w.getExportFilename = function(ext: string) {
        const size = (document.getElementById('canvas-size') as HTMLSelectElement).value;
        const now = new Date();
        const date = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
        return `Poster-${size}-${date}.${ext}`;
      };

      w.downloadPNG = function() {
        w.showToast('PNG Hazırlanıyor...');
        fCanvas.discardActiveObject().renderAll();
        
        // Baskı kalitesi için çarpan kullanarak yüksek çözünürlüklü çıktı alıyoruz
        const dataUrl = fCanvas.toDataURL({
          format: 'png',
          multiplier: 3 
        });

        const link = document.createElement('a');
        link.download = w.getExportFilename('png');
        link.href = dataUrl;
        link.click();
        w.showToast('✓ PNG başarıyla indirildi!');
      };

      w.downloadPDF = function() {
        w.showToast('PDF Belgesi Hazırlanıyor...');
        fCanvas.discardActiveObject().renderAll();

        const selectEl = document.getElementById('canvas-size') as HTMLSelectElement;
        const key = selectEl.value;
        const [wIn, hIn] = w.CANVAS_SIZES[key];

        const imgData = fCanvas.toDataURL({ format: 'jpeg', quality: 0.95, multiplier: 3 });
        const { jsPDF } = w.jspdf;
        const pdf = new jsPDF({
          orientation: wIn > hIn ? 'landscape' : 'portrait',
          unit: 'in',
          format: [wIn, hIn]
        });

        pdf.addImage(imgData, 'JPEG', 0, 0, wIn, hIn);
        pdf.save(w.getExportFilename('pdf'));
        w.showToast('✓ PDF başarıyla indirildi!');
      };

      w.downloadSVG = function() {
        w.showToast('SVG Dosyası Hazırlanıyor...');
        fCanvas.discardActiveObject().renderAll();
        const svgData = fCanvas.toSVG();
        const blob = new Blob([svgData], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = w.getExportFilename('svg');
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
        w.showToast('✓ SVG başarıyla indirildi!');
      };

      // ══════════════════════════════════════════════════════════════
      // PLAK İÇİN TOPLU ZIP ÇIKTISI ALMA (MULTICOLOR ZIP BATCH EXPORT)
      // ══════════════════════════════════════════════════════════════
      w.exportVinylLoop = async function(format: string) {
        fCanvas.discardActiveObject().renderAll();
        
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
          w.showToast('Lütfen dışa aktarım için en az bir renk şeridi seçin.');
          return;
        }

        const originalBg = fCanvas.backgroundColor;
        w.showToast(`${colorsToExport.length} varyasyon için ZIP arşivi hazırlanıyor...`);

        const zip = new w.JSZip();
        const folder = zip.folder(`vinyl-posters-${format}`);

        for (let i = 0; i < colorsToExport.length; i++) {
          const color = colorsToExport[i];
          
          fCanvas.setBackgroundColor(color, fCanvas.renderAll.bind(fCanvas));
          w.applyAutoContrast(color);
          
          await new Promise(r => setTimeout(r, 100));

          let filename = `VinylPoster-${color.replace('#', '')}.${format}`;
          
          if (format === 'png') {
            const dataUrl = fCanvas.toDataURL({ format: 'png', multiplier: 2 });
            const base64Content = dataUrl.split(',')[1];
            folder.file(filename, base64Content, { base64: true });
          } else if (format === 'pdf') {
            const selectEl = document.getElementById('canvas-size') as HTMLSelectElement;
            const key = selectEl.value;
            const [wIn, hIn] = w.CANVAS_SIZES[key];
            const imgData = fCanvas.toDataURL({ format: 'jpeg', quality: 0.95, multiplier: 2 });
            const { jsPDF } = w.jspdf;
            const pdf = new jsPDF({ orientation: wIn > hIn ? 'landscape' : 'portrait', unit: 'in', format: [wIn, hIn] });
            pdf.addImage(imgData, 'JPEG', 0, 0, wIn, hIn);
            const pdfArrayBuffer = pdf.output('arraybuffer');
            folder.file(filename, pdfArrayBuffer);
          }
        }

        zip.generateAsync({ type: "blob" }).then(function(content: Blob) {
          const url = URL.createObjectURL(content);
          const link = document.createElement('a');
          link.download = `Vinyl-Posters-${new Date().getTime()}.zip`;
          link.href = url;
          link.click();
          URL.revokeObjectURL(url);
          w.showToast(`✓ ZIP Dosyası indirildi!`);
        });

        // Orijinal arka planı geri yüklüyoruz
        fCanvas.setBackgroundColor(originalBg, fCanvas.renderAll.bind(fCanvas));
        w.applyAutoContrast(originalBg);
      };

      // İlk Kurulum Çağrısı
      w.initTemplate();
    };

    initApp();

    return () => {
      const w = window as any;
      window.removeEventListener('resize', w.updateCanvasSize);
    };
  }, [posterMode]);

  const vinylColors = [
    '#f5f5f5', '#212121', '#d95c50', '#698f62', '#5c7c8c', '#e8ba4f', '#8b688f', '#d982ab',
    '#e07a3e', '#7e9b81', '#d6c5a5', '#c96567', '#4c6470', '#997e65', '#bd826b', '#6c5673'
  ];

  if (posterMode === 'select') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100vw', background: '#09090b', color: '#fff', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', sans-serif", padding: '20px' }}>
        <h1 style={{ fontSize: '36px', marginBottom: '50px', fontWeight: 700, letterSpacing: '-0.02em' }}>Choose Poster Template</h1>
        
        <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap', justifyContent: 'center' }}>
          {/* SPOTIFY CARD */}
          <div 
            onClick={() => setPosterMode('spotify')} 
            style={{ width: '360px', padding: '40px 30px', background: '#18181b', border: '2px solid #27272a', borderRadius: '16px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.3s ease', display: 'flex', flexDirection: 'column', alignItems: 'center' }} 
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = '#1DB954';
              e.currentTarget.style.transform = 'translateY(-8px)';
              e.currentTarget.style.boxShadow = '0 12px 40px rgba(29, 185, 84, 0.15)';
            }} 
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = '#27272a';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginBottom: '30px' }}>
              <svg width="160" height="200" viewBox="0 0 200 250" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0 20px 30px rgba(0,0,0,0.5))' }}>
                <rect width="200" height="250" rx="8" fill="#121212" stroke="#333" strokeWidth="2"/>
                <rect x="20" y="20" width="160" height="160" rx="4" fill="#282828"/>
                <rect x="20" y="195" width="100" height="12" rx="6" fill="#FFFFFF"/>
                <rect x="20" y="215" width="60" height="8" rx="4" fill="#B3B3B3"/>
                <circle cx="160" cy="210" r="16" fill="#1DB954"/>
                <path d="M156 205L166 210L156 215V205Z" fill="#121212"/>
              </svg>
            </div>
            <h2 style={{ fontSize: '22px', marginBottom: '12px', fontWeight: 600 }}>Spotify Poster</h2>
            <p style={{ fontSize: '14px', color: '#a1a1aa', lineHeight: 1.6, margin: 0 }}>Modern music player interface with cover art, progress bar, and play controls.</p>
          </div>
          
          {/* VINYL CARD */}
          <div 
            onClick={() => setPosterMode('vinyl')} 
            style={{ width: '360px', padding: '40px 30px', background: '#18181b', border: '2px solid #27272a', borderRadius: '16px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.3s ease', display: 'flex', flexDirection: 'column', alignItems: 'center' }} 
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = '#6366f1';
              e.currentTarget.style.transform = 'translateY(-8px)';
              e.currentTarget.style.boxShadow = '0 12px 40px rgba(99, 102, 241, 0.15)';
            }} 
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = '#27272a';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginBottom: '30px' }}>
              <svg width="160" height="200" viewBox="0 0 200 250" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0 20px 30px rgba(0,0,0,0.5))' }}>
                <rect width="200" height="250" rx="8" fill="#f5f5f5" stroke="#333" strokeWidth="2"/>
                <rect x="20" y="20" width="40" height="6" rx="3" fill="#212121"/>
                <rect x="150" y="20" width="30" height="6" rx="3" fill="#212121"/>
                <rect x="40" y="45" width="120" height="12" rx="6" fill="#212121"/>
                <rect x="60" y="65" width="80" height="6" rx="3" fill="#555555"/>
                <circle cx="100" cy="155" r="60" fill="none" stroke="#212121" strokeWidth="24"/>
                <circle cx="100" cy="155" r="22" fill="#e0e0e0"/>
                <circle cx="100" cy="155" r="4" fill="#111"/>
              </svg>
            </div>
            <h2 style={{ fontSize: '22px', marginBottom: '12px', fontWeight: 600 }}>Vinyl Song Poster</h2>
            <p style={{ fontSize: '14px', color: '#a1a1aa', lineHeight: 1.6, margin: 0 }}>Retro record design with spiral lyrics forming the vinyl grooves in the center.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="spotify-poster-page">
      <style>{`
        .spotify-poster-page {
          --spotify-green: #1DB954;
          --panel-bg: #09090b;
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
          color: #ffffff;
        }
        .spotify-poster-page * { box-sizing: border-box; }

        /* PANEL */
        #panel { width: 340px; min-width: 340px; background: var(--panel-bg); border-right: 1px solid var(--panel-border); overflow-y: auto; display: flex; flex-direction: column; }
        .panel-header { padding: 20px; border-bottom: 1px solid var(--panel-border); display: flex; align-items: center; justify-content: space-between; }
        .panel-header h1 { font-size: 14px; font-weight: 700; text-transform: uppercase; margin: 0; }
        .back-btn { background: none; border: 1px solid #444; color: #aaa; font-size: 11px; padding: 4px 8px; border-radius: 4px; cursor: pointer; }
        .back-btn:hover { background: #fff; color: #000; }

        .accordion-btn { width: 100%; background: none; border: none; color: #b3b3b3; font-size: 11px; font-weight: 700; text-transform: uppercase; text-align: left; padding: 16px; cursor: pointer; display: flex; justify-content: space-between; border-bottom: 1px solid var(--panel-border); }
        .accordion-content { display: none; padding: 14px 16px; border-bottom: 1px solid var(--panel-border); }
        .accordion-content.open { display: block; }

        .form-row { margin-bottom: 12px; }
        .form-row label { display: block; font-size: 11px; color: #b3b3b3; margin-bottom: 6px; }
        .form-row input[type="text"], .form-row input[type="number"], .form-row select, .form-row textarea { width: 100%; background: var(--input-bg); border: 1px solid var(--input-border); border-radius: var(--radius); color: #fff; padding: 8px 10px; font-size: 12px; outline: none; }
        .form-row input[type="color"] { width: 40px; height: 30px; border: none; border-radius: 4px; cursor: pointer; background: transparent; }
        
        .color-row { display: flex; align-items: center; gap: 8px; }
        .color-row input[type="text"] { flex: 1; }
        .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .three-col { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px; }
        
        .btn { display: flex; align-items: center; justify-content: center; gap: 6px; padding: 10px 14px; border-radius: var(--radius); border: none; font-size: 12px; font-weight: 600; cursor: pointer; width: 100%; }
        .btn-primary { background: var(--accent); color: #fff; }
        .btn-secondary { background: #18181b; color: #fff; border: 1px solid var(--panel-border); }
        .btn-download-group { display: flex; gap: 6px; margin-top: 6px; }

        .search-row { display: flex; gap: 6px; align-items: flex-end; }
        .search-results { max-height: 150px; overflow-y: auto; margin-top: 6px; border-radius: var(--radius); border: 1px solid var(--panel-border); display: none; }
        .search-result-item { display: flex; align-items: center; gap: 8px; padding: 8px 10px; cursor: pointer; border-bottom: 1px solid var(--panel-border); }
        .search-result-item:hover { background: #222; }
        .search-result-item img { width: 36px; height: 36px; border-radius: 4px; object-fit: cover; }
        .result-info p { font-size: 12px; font-weight: 600; margin: 0; }
        .result-info span { font-size: 11px; color: #b3b3b3; }

        /* WORKSPACE & CANVAS AREA */
        #canvas-area { flex: 1; display: flex; align-items: center; justify-content: center; background: #0d0d0d; overflow: hidden; position: relative; }
        #poster-container { position: relative; box-shadow: 0 32px 80px rgba(0,0,0,0.8); border-radius: 4px; overflow: hidden; }
        
        /* PROPERTIES PANEL */
        #props-panel { width: 280px; min-width: 280px; background: var(--panel-bg); border-left: 1px solid var(--panel-border); display: flex; flex-direction: column; }
        #props-header { padding: 16px; border-bottom: 1px solid var(--panel-border); font-size: 11px; font-weight: 700; text-transform: uppercase; color: #b3b3b3; display: flex; justify-content: space-between; }
        #props-selected-name { color: var(--spotify-green); }
        #props-body { flex: 1; overflow-y: auto; padding: 16px; }
        #props-empty-state { text-align: center; color: #444; font-size: 12px; padding: 40px 10px; }

        /* ALIGNMENT BAR OVERLAY */
        #ed-align-bar { position: absolute; top: 15px; left: 50%; transform: translateX(-50%); background: #111; border: 1px solid var(--panel-border); border-radius: 8px; display: none; align-items: center; gap: 2px; padding: 6px; z-index: 500; }
        #ed-align-bar.ed-bar-visible { display: flex; }
        .ed-ab-btn { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; background: none; border: none; color: #b3b3b3; border-radius: 6px; cursor: pointer; }
        .ed-ab-btn:hover { background: #222; color: #fff; }
        .ed-ab-sep { width: 1px; height: 20px; background: var(--panel-border); margin: 0 4px; }

        .pf-section-title { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #666; margin: 10px 0 6px; }
        .pf-row { margin-bottom: 10px; }
        .pf-row label { display: block; font-size: 11px; color: #b3b3b3; margin-bottom: 4px; }
        .pf-row input { width: 100%; background: var(--input-bg); border: 1px solid var(--input-border); border-radius: 5px; color: #fff; padding: 6px; font-size: 11px; }
        .pf-2col { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .pf-3col { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px; }
        .pf-btn { padding: 8px; background: #18181b; border: 1px solid var(--panel-border); border-radius: 4px; color: #fff; font-size: 11px; cursor: pointer; }
        .pf-btn:hover { background: #222; }
        .pf-divider { border: none; border-top: 1px solid var(--panel-border); margin: 14px 0; }
        
        #toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%) translateY(20px); background: var(--spotify-green); color: #000; padding: 10px 24px; border-radius: 20px; font-size: 13px; font-weight: 600; opacity: 0; transition: all 0.3s; z-index: 9999; }
        #toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }
      `}</style>

      {/* LEFT SETTINGS PANEL */}
      <div id="panel">
        <div className="panel-header">
          <h1>{posterMode === 'spotify' ? 'Spotify Poster' : 'Vinyl Poster'}</h1>
          <button className="back-btn" onClick={() => setPosterMode('select')}>⟵ Back</button>
        </div>

        {/* SEARCH TUNES SECTION */}
        <button className="accordion-btn" onClick={(e) => (window as any).toggleAccordion(e.currentTarget)}>🔍 Search Song (iTunes)<span className="arrow">▼</span></button>
        <div className="accordion-content open">
          <div className="search-row">
            <div className="form-row" style={{ flex: 1, marginBottom: 0 }}>
              <input type="text" id="search-input" placeholder="Song or artist name..." onKeyDown={(e) => { if (e.key === 'Enter') (window as any).searchSong(); }} />
            </div>
            <button className="btn btn-primary" style={{ width: 'auto' }} onClick={() => (window as any).searchSong()}>Arama</button>
          </div>
          <div className="search-results" id="search-results"></div>
        </div>

        {/* CANVAS DIMENSIONS SECTION */}
        <button className="accordion-btn" onClick={(e) => (window as any).toggleAccordion(e.currentTarget)}>📐 Print Size<span className="arrow">▼</span></button>
        <div className="accordion-content">
          <div className="form-row">
            <select id="canvas-size" defaultValue="40x50" onChange={() => (window as any).updateCanvasSize()}>
              <option value="8.27x11.69">A4 (8.27" x 11.69")</option>
              <option value="11.69x16.54">A3 (11.69" x 16.54")</option>
              <option value="12x16">12" x 16"</option>
              <option value="18x24">18" x 24"</option>
              <option value="24x36">24" x 36"</option>
              <option value="40x50">40" x 50" (Default)</option>
            </select>
          </div>
        </div>

        {/* SPOTIFY TEMPLATE SETTINGS */}
        {posterMode === 'spotify' && (
          <>
            <button className="accordion-btn" onClick={(e) => (window as any).toggleAccordion(e.currentTarget)}>🎵 Spotify Barcode<span className="arrow">▼</span></button>
            <div className="accordion-content">
              <div className="form-row">
                <label>Spotify Link / URI</label>
                <input type="text" id="spotify-uri" placeholder="https://open.spotify.com/track/..." onInput={() => (window as any).handleSpotifyInput()} />
              </div>
            </div>

            <button className="accordion-btn" onClick={(e) => (window as any).toggleAccordion(e.currentTarget)}>🖼️ Visual Settings<span className="arrow">▼</span></button>
            <div className="accordion-content">
              <div className="form-row">
                <label>Background Color</label>
                <div className="color-row">
                  <input type="color" id="bg-color" defaultValue="#121212" onInput={() => (window as any).updateBgColor()} />
                  <input type="text" id="bg-color-txt" defaultValue="#121212" onInput={() => (window as any).syncColor('bg-color', 'bg-color-txt')} />
                </div>
              </div>
              <div className="form-row">
                <label>Upload Cover Image</label>
                <input type="file" accept="image/*" onChange={(e) => (window as any).handleCoverUpload(e)} />
              </div>
            </div>
          </>
        )}

        {/* VINYL TEMPLATE SETTINGS */}
        {posterMode === 'vinyl' && (
          <>
            <button className="accordion-btn" onClick={(e) => (window as any).toggleAccordion(e.currentTarget)}>💿 Spiral &amp; Lyrics<span className="arrow">▼</span></button>
            <div className="accordion-content">
              <div className="form-row">
                <label>Text size on Spiral (px)</label>
                <input type="number" id="vinyl-text-size" defaultValue="11" onChange={() => (window as any).updateVinylSpiral()} />
              </div>
              <div className="form-row">
                <label>Lyrics / Text Content</label>
                <textarea id="vinyl-lyrics-input" defaultValue="LOREM IPSUM DOLOR SIT AMET CONSECTETUR ADIPISCING ELIT SED DO EIUSMOD TEMPOR INCIDIDUNT UT LABORE ET DOLORE MAGNA ALIQUA" onChange={() => (window as any).updateVinylSpiral()}></textarea>
              </div>
            </div>

            <button className="accordion-btn" onClick={(e) => (window as any).toggleAccordion(e.currentTarget)}>🎨 Background Color<span className="arrow">▼</span></button>
            <div className="accordion-content">
              <div className="form-row">
                <div className="color-row">
                  <input type="color" id="v-bg-color" defaultValue="#f5f5f5" onInput={() => (window as any).updateBgColor()} />
                  <input type="text" id="v-bg-color-txt" defaultValue="#f5f5f5" onInput={() => (window as any).syncColor('v-bg-color', 'v-bg-color-txt')} />
                </div>
              </div>
            </div>

            <button className="accordion-btn" onClick={(e) => (window as any).toggleAccordion(e.currentTarget)}>🎨 Multi-Color Batch Export<span className="arrow">▼</span></button>
            <div className="accordion-content">
              <p style={{ fontSize: '10px', color: '#777', marginBottom: '8px' }}>Select colors to compile into a .zip archive:</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                {vinylColors.map((col, i) => (
                  <div className="pf-color-row multi-export-item" key={i} style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    <input type="checkbox" defaultChecked className="export-color-check" />
                    <input type="color" defaultValue={col} className="export-color-picker" style={{ width: '22px', height: '22px', border: 'none', padding: 0 }} />
                    <span style={{ fontSize: '10px', color: '#888' }}>{col}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* COMMON DOWNLOAD BUTTONS */}
        <button className="accordion-btn open" onClick={(e) => (window as any).toggleAccordion(e.currentTarget)}>⬇️ Export Options<span className="arrow">▼</span></button>
        <div className="accordion-content open">
          {posterMode === 'vinyl' ? (
            <div className="btn-download-group">
              <button className="btn btn-secondary" onClick={() => (window as any).exportVinylLoop('png')}>PNG ZIP</button>
              <button className="btn btn-secondary" onClick={() => (window as any).exportVinylLoop('pdf')}>PDF ZIP</button>
            </div>
          ) : (
            <div className="btn-download-group">
              <button className="btn btn-secondary" onClick={() => (window as any).downloadPNG()}>PNG</button>
              <button className="btn btn-secondary" onClick={() => (window as any).downloadPDF()}>PDF</button>
              <button className="btn btn-secondary" onClick={() => (window as any).downloadSVG()}>SVG</button>
            </div>
          )}
        </div>
      </div>

      {/* WORKSPACE AREA */}
      <div id="canvas-area">
        {/* TOP QUICK ALIGN TOOLBAR */}
        <div id="ed-align-bar">
          <button className="ed-ab-btn" title="Align Left" onClick={() => (window as any).edAlign('left')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="3" x2="3" y2="21" strokeWidth="2.5"/><rect x="5" y="8" width="8" height="3" rx="1"/><rect x="5" y="13" width="13" height="3" rx="1"/></svg>
          </button>
          <button className="ed-ab-btn" title="Center Horizontal" onClick={() => (window as any).edAlign('cx')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="3" x2="12" y2="21" strokeWidth="2.5"/><rect x="6" y="8" width="12" height="3" rx="1"/><rect x="4" y="13" width="16" height="3" rx="1"/></svg>
          </button>
          <button className="ed-ab-btn" title="Align Right" onClick={() => (window as any).edAlign('right')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="21" y1="3" x2="21" y2="21" strokeWidth="2.5"/><rect x="11" y="8" width="8" height="3" rx="1"/><rect x="6" y="13" width="13" height="3" rx="1"/></svg>
          </button>
          <div className="ed-ab-sep"></div>
          <button className="ed-ab-btn" title="Align Top" onClick={() => (window as any).edAlign('top')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="3" x2="21" y2="3" strokeWidth="2.5"/><rect x="8" y="5" width="3" height="8" rx="1"/><rect x="13" y="5" width="3" height="13" rx="1"/></svg>
          </button>
          <button className="ed-ab-btn" title="Center Vertical" onClick={() => (window as any).edAlign('cy')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12" strokeWidth="2.5"/><rect x="8" y="4" width="3" height="16" rx="1"/><rect x="13" y="6" width="3" height="12" rx="1"/></svg>
          </button>
          <button className="ed-ab-btn" title="Align Bottom" onClick={() => (window as any).edAlign('bottom')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="21" x2="21" y2="21" strokeWidth="2.5"/><rect x="8" y="11" width="3" height="8" rx="1"/><rect x="13" y="6" width="3" height="13" rx="1"/></svg>
          </button>
          <div className="ed-ab-sep"></div>
          <button className="ed-ab-btn" title="Distribute Horizontal" onClick={() => (window as any).edDistribute('h')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="3" x2="3" y2="21"/><line x1="21" y1="3" x2="21" y2="21"/><rect x="9" y="8" width="6" height="8" rx="1"/></svg>
          </button>
          <button className="ed-ab-btn" title="Distribute Vertical" onClick={() => (window as any).edDistribute('v')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="3" x2="21" y2="3"/><line x1="3" y1="21" x2="21" y2="21"/><rect x="8" y="9" width="8" height="6" rx="1"/></svg>
          </button>
        </div>

        {/* CONTAINER FOR FABRIC CANVAS */}
        <div id="poster-container">
          <canvas ref={canvasRef}></canvas>
        </div>
      </div>

      {/* PROPERTIES CONTROLLER PANEL */}
      <div id="props-panel">
        <div id="props-header">
          Properties
          <span id="props-selected-name"></span>
        </div>
        <div id="props-body">
          <div id="props-empty-state">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#444" strokeWidth="1.5">
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
