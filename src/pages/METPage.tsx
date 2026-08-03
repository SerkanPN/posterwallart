/**
 * METPage.tsx
 * Met Müzesi verilerinden poster oluşturma sayfası
 * Vercel'e deploy edilecek React sayfası
 *
 * posterwallart.shop/met rotasına bağlayın
 *
 * Kurulum:
 *  1. Bu dosyayı src/pages/ altına ekleyin
 *  2. App.tsx'te route ekleyin: <Route path="/met" element={<METPage />} />
 *  3. API_BASE_URL'i kendi cPanel URL'inizle değiştirin
 */

import { useState, useEffect, useRef, useCallback } from 'react';

// ─── Config ──────────────────────────────────────────────────────────────────
// cPanel'inizdeki PHP API URL'ini buraya yazın
const API_BASE_URL = 'https://posterwallart.shop/api/met-api.php';

// Poster boyutları (px) – gerçek print resolution'ı yüksek tutmak için
const POSTER_SIZES = [
  { label: '50×70 cm (Dikey)',  w: 1417, h: 1984 },
  { label: '70×100 cm (Dikey)', w: 1984, h: 2835 },
  { label: '30×40 cm (Dikey)',  w: 850,  h: 1134 },
  { label: '40×50 cm (Dikey)',  w: 1134, h: 1417 },
  { label: 'A4 Dikey',          w: 794,  h: 1123 },
  { label: 'A3 Dikey',          w: 1123, h: 1587 },
  { label: 'Kare 50×50',        w: 1417, h: 1417 },
];

const FONT_OPTIONS = [
  'Georgia, serif',
  'Times New Roman, serif',
  'Playfair Display, serif',
  '"Cormorant Garamond", serif',
  'Arial, sans-serif',
  '"Helvetica Neue", Helvetica, sans-serif',
  '"Courier New", monospace',
];

// MET CSV'de bulunmayan veya teknik sütunlar – varsayılan gizli
const HIDDEN_COLUMNS_DEFAULT = [
  'Object Number', 'Is Highlight', 'Is Timeline Work', 'Is Public Domain',
  'AccessionYear', 'Object Wikidata URL', 'Artist Wikidata URL',
  'Artist ULAN URL', 'Tags AAT URL', 'Tags Wikidata URL', 'Link Resource',
  'Object URL', 'Metadata Date',
];

// ─── Types ───────────────────────────────────────────────────────────────────
interface FilterState {
  [column: string]: string;
}

interface Record {
  [key: string]: string;
}

interface PosterField {
  column: string;
  label: string;         // Posterde gösterilecek etiket
  fontSize: number;      // px
  bold: boolean;
  italic: boolean;
  color: string;
  visible: boolean;
  align: 'left' | 'center' | 'right';
}

interface PosterConfig {
  size: typeof POSTER_SIZES[0];
  bgColor: string;
  font: string;
  padding: number;
  imageHeight: number;  // yüzde (0-100)
  showBorder: boolean;
  borderColor: string;
  borderWidth: number;
  showWatermark: boolean;
  imageObjectFit: 'contain' | 'cover';
  fields: PosterField[];
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function METPage() {
  const [step, setStep]             = useState<1 | 2 | 3>(1);
  const [columns, setColumns]       = useState<string[]>([]);
  const [totalRows, setTotalRows]   = useState(0);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');

  // Step 1: Filtreler
  const [filters, setFilters]           = useState<FilterState>({});
  const [activeFilterCols, setActiveFilterCols] = useState<string[]>([]);
  const [onlyWithImage, setOnlyWithImage]       = useState(true);
  const [searchResults, setSearchResults]       = useState<Record[]>([]);
  const [searchTotal, setSearchTotal]           = useState(0);
  const [searchOffset, setSearchOffset]         = useState(0);
  const SEARCH_LIMIT = 30;

  // Step 2: Seçilen kayıt + hangi alanları göster
  const [selectedRecord, setSelectedRecord]     = useState<Record | null>(null);
  const [visibleFields, setVisibleFields]       = useState<string[]>([]);

  // Step 3: Poster config
  const [config, setConfig] = useState<PosterConfig>({
    size:           POSTER_SIZES[0],
    bgColor:        '#FFFFFF',
    font:           FONT_OPTIONS[0],
    padding:        80,
    imageHeight:    55,
    showBorder:     false,
    borderColor:    '#000000',
    borderWidth:    2,
    showWatermark:  false,
    imageObjectFit: 'contain',
    fields:         [],
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // ── İlk yükleme: sütunları çek ──────────────────────────────────────────
  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE_URL}?action=columns`)
      .then(r => r.json())
      .then(data => {
        if (data.error) { setError(data.error); return; }
        setColumns(data.columns || []);
        setTotalRows(data.total || 0);
        // Varsayılan filtre sütunları
        setActiveFilterCols(['Title', 'Artist Display Name', 'Department', 'Object Date', 'Medium', 'Country']);
      })
      .catch(() => setError('API\'ye bağlanılamadı. cPanel\'inizdeki met-api.php adresini kontrol edin.'))
      .finally(() => setLoading(false));
  }, []);

  // ── Arama ────────────────────────────────────────────────────────────────
  const doSearch = useCallback((offset = 0) => {
    setLoading(true);
    const params = new URLSearchParams({
      action: 'search',
      filters: JSON.stringify(filters),
      fields: ['Object ID', 'Title', 'Artist Display Name', 'Object Date',
               'Department', 'Medium', 'Link Resource', 'Image URL'].join(','),
      limit: String(SEARCH_LIMIT),
      offset: String(offset),
      hasImage: onlyWithImage ? '1' : '',
    });
    fetch(`${API_BASE_URL}?${params}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) { setError(data.error); return; }
        setSearchResults(data.results || []);
        setSearchTotal(data.total || 0);
        setSearchOffset(offset);
      })
      .catch(() => setError('Arama başarısız'))
      .finally(() => setLoading(false));
  }, [filters, onlyWithImage]);

  // ── Kayıt seç → Poster alanlarını hazırla ────────────────────────────────
  const selectRecord = (rec: Record) => {
    setSelectedRecord(rec);

    // Seçili alanların varsayılan görünürlüğü
    const defaultVisible = columns.filter(c => !HIDDEN_COLUMNS_DEFAULT.includes(c));
    setVisibleFields(defaultVisible);

    // Poster field config
    const defaultFields: PosterField[] = columns
      .filter(c => !HIDDEN_COLUMNS_DEFAULT.includes(c))
      .map((col, i) => ({
        column: col,
        label: col,
        fontSize: i === 0 ? 48 : i <= 2 ? 28 : 22,
        bold: i === 0,
        italic: col.includes('Artist'),
        color: '#1A1A1A',
        visible: defaultVisible.includes(col),
        align: 'left' as const,
      }));

    setConfig(prev => ({ ...prev, fields: defaultFields }));
    setStep(2);
  };

  // ── Step 3: Poster render (Canvas) ───────────────────────────────────────
  const renderPoster = useCallback(async () => {
    if (!canvasRef.current || !selectedRecord) return;

    const canvas = canvasRef.current;
    const { w, h }   = config.size;
    canvas.width  = w;
    canvas.height = h;

    const ctx = canvas.getContext('2d')!;
    const pad = config.padding;

    // Arka plan
    ctx.fillStyle = config.bgColor;
    ctx.fillRect(0, 0, w, h);

    // Kenarlık
    if (config.showBorder) {
      ctx.strokeStyle = config.borderColor;
      ctx.lineWidth   = config.borderWidth;
      ctx.strokeRect(
        config.borderWidth / 2,
        config.borderWidth / 2,
        w - config.borderWidth,
        h - config.borderWidth,
      );
    }

    let yPos = pad;

    // ── Görsel ──────────────────────────────────────────────────────────
    const imgUrl = selectedRecord['Link Resource'] || selectedRecord['Image URL'] || '';
    if (imgUrl && config.imageHeight > 0) {
      try {
        const imgH = Math.round(h * (config.imageHeight / 100));
        const imgW = w - pad * 2;

        const img = await loadImage(imgUrl);
        if (config.imageObjectFit === 'contain') {
          const scale = Math.min(imgW / img.width, imgH / img.height);
          const dw    = img.width * scale;
          const dh    = img.height * scale;
          const dx    = pad + (imgW - dw) / 2;
          ctx.drawImage(img, dx, yPos, dw, dh);
          yPos += dh + 32;
        } else {
          ctx.save();
          ctx.rect(pad, yPos, imgW, imgH);
          ctx.clip();
          const scale = Math.max(imgW / img.width, imgH / img.height);
          const dw    = img.width * scale;
          const dh    = img.height * scale;
          const dx    = pad + (imgW - dw) / 2;
          const dy    = yPos + (imgH - dh) / 2;
          ctx.drawImage(img, dx, dy, dw, dh);
          ctx.restore();
          yPos += imgH + 32;
        }
      } catch {
        // Görsel yüklenemedi – devam et
      }
    }

    // ── Metin alanları ────────────────────────────────────────────────────
    const visibleFieldConfigs = config.fields.filter(f => f.visible && selectedRecord[f.column]);

    for (const field of visibleFieldConfigs) {
      const text = selectedRecord[field.column];
      if (!text?.trim()) continue;

      const weight = field.bold   ? 'bold '   : '';
      const style  = field.italic ? 'italic ' : '';
      ctx.font      = `${style}${weight}${field.fontSize}px ${config.font}`;
      ctx.fillStyle = field.color;

      const maxW = w - pad * 2;
      const lines = wrapText(ctx, text, maxW);

      for (const line of lines) {
        if (yPos + field.fontSize > h - pad) break;

        if (field.align === 'center') {
          ctx.textAlign = 'center';
          ctx.fillText(line, w / 2, yPos + field.fontSize);
        } else if (field.align === 'right') {
          ctx.textAlign = 'right';
          ctx.fillText(line, w - pad, yPos + field.fontSize);
        } else {
          ctx.textAlign = 'left';
          ctx.fillText(line, pad, yPos + field.fontSize);
        }
        yPos += field.fontSize + 6;
      }
      yPos += 16; // alan arası boşluk
    }

    // ── Filigran ─────────────────────────────────────────────────────────
    if (config.showWatermark) {
      ctx.font      = `14px Arial, sans-serif`;
      ctx.fillStyle = 'rgba(100,100,100,0.4)';
      ctx.textAlign = 'center';
      ctx.fillText('The Metropolitan Museum of Art | metmuseum.org', w / 2, h - 20);
    }

  }, [selectedRecord, config]);

  useEffect(() => {
    if (step === 3) renderPoster();
  }, [step, renderPoster]);

  // ── İndir ────────────────────────────────────────────────────────────────
  const downloadPoster = () => {
    if (!canvasRef.current) return;
    const link      = document.createElement('a');
    link.download   = `met-poster-${Date.now()}.png`;
    link.href       = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <h1 style={styles.headerTitle}>MET Müzesi Poster Oluşturucu</h1>
        <p style={styles.headerSub}>Metropolitan Museum of Art açık erişim koleksiyonundan poster tasarlayın</p>
        <div style={styles.steps}>
          {(['1. Filtrele', '2. Seç', '3. Tasarla'] as const).map((s, i) => (
            <div key={i} style={{
              ...styles.stepBtn,
              ...(step === i + 1 ? styles.stepBtnActive : {}),
              ...(step > i + 1   ? styles.stepBtnDone  : {}),
            }}>
              {s}
            </div>
          ))}
        </div>
      </header>

      <main style={styles.main}>
        {error && <div style={styles.error}>{error}</div>}

        {/* ══════════ STEP 1: Filtrele & Ara ══════════════════════════════ */}
        {step === 1 && (
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h2>Eser Filtrele</h2>
              {totalRows > 0 && (
                <span style={styles.badge}>{totalRows.toLocaleString()} eser mevcut</span>
              )}
            </div>

            {/* Aktif filtre sütunlarını seç */}
            <div style={styles.section}>
              <label style={styles.label}>Filtre Sütunları Seç:</label>
              <div style={styles.chipRow}>
                {columns
                  .filter(c => !HIDDEN_COLUMNS_DEFAULT.includes(c))
                  .map(col => (
                    <button
                      key={col}
                      onClick={() => setActiveFilterCols(prev =>
                        prev.includes(col)
                          ? prev.filter(c => c !== col)
                          : [...prev, col]
                      )}
                      style={{
                        ...styles.chip,
                        ...(activeFilterCols.includes(col) ? styles.chipActive : {}),
                      }}
                    >
                      {col}
                    </button>
                  ))
                }
              </div>
            </div>

            {/* Filtre giriş alanları */}
            <div style={styles.filterGrid}>
              {activeFilterCols.map(col => (
                <div key={col} style={styles.filterField}>
                  <label style={styles.label}>{col}</label>
                  <input
                    style={styles.input}
                    placeholder={`${col} ile ara...`}
                    value={filters[col] || ''}
                    onChange={e => setFilters(prev => ({
                      ...prev, [col]: e.target.value,
                    }))}
                  />
                </div>
              ))}
            </div>

            <div style={styles.filterActions}>
              <label style={styles.checkLabel}>
                <input
                  type="checkbox"
                  checked={onlyWithImage}
                  onChange={e => setOnlyWithImage(e.target.checked)}
                />
                &nbsp; Sadece görseli olan eserler
              </label>

              <button
                onClick={() => doSearch(0)}
                disabled={loading}
                style={styles.btn}
              >
                {loading ? 'Aranıyor...' : '🔍 Ara'}
              </button>

              <button
                onClick={() => { setFilters({}); setSearchResults([]); }}
                style={styles.btnSecondary}
              >
                Temizle
              </button>
            </div>

            {/* Sonuçlar */}
            {searchResults.length > 0 && (
              <div>
                <p style={styles.resultCount}>
                  {searchTotal.toLocaleString()} sonuç bulundu — {searchOffset + 1}–{Math.min(searchOffset + SEARCH_LIMIT, searchTotal)} gösteriliyor
                </p>
                <div style={styles.grid}>
                  {searchResults.map((rec, idx) => (
                    <div key={idx} style={styles.resultCard} onClick={() => selectRecord(rec)}>
                      {(rec['Link Resource'] || rec['Image URL']) && (
                        <img
                          src={rec['Link Resource'] || rec['Image URL']}
                          alt={rec['Title']}
                          style={styles.thumbnail}
                          onError={e => (e.currentTarget.style.display = 'none')}
                        />
                      )}
                      <div style={styles.resultInfo}>
                        <strong style={styles.resultTitle}>{rec['Title'] || '—'}</strong>
                        {rec['Artist Display Name'] && (
                          <em style={styles.resultArtist}>{rec['Artist Display Name']}</em>
                        )}
                        {rec['Object Date'] && (
                          <span style={styles.resultDate}>{rec['Object Date']}</span>
                        )}
                        {rec['Department'] && (
                          <span style={styles.resultDept}>{rec['Department']}</span>
                        )}
                      </div>
                      <button style={styles.selectBtn}>Seç →</button>
                    </div>
                  ))}
                </div>

                {/* Sayfalama */}
                <div style={styles.pagination}>
                  <button
                    disabled={searchOffset === 0}
                    onClick={() => doSearch(Math.max(0, searchOffset - SEARCH_LIMIT))}
                    style={styles.pageBtn}
                  >
                    ← Önceki
                  </button>
                  <span>Sayfa {Math.floor(searchOffset / SEARCH_LIMIT) + 1} / {Math.ceil(searchTotal / SEARCH_LIMIT)}</span>
                  <button
                    disabled={searchOffset + SEARCH_LIMIT >= searchTotal}
                    onClick={() => doSearch(searchOffset + SEARCH_LIMIT)}
                    style={styles.pageBtn}
                  >
                    Sonraki →
                  </button>
                </div>
              </div>
            )}

            {searchResults.length === 0 && !loading && (
              <div style={styles.emptyState}>
                <p>Yukarıdaki filtrelerle arama yapın</p>
                <p style={{ fontSize: 13, color: '#888' }}>
                  Filtre bırakıp sadece "Ara"ya basarsanız tüm koleksiyondan sonuçlar gelir
                </p>
              </div>
            )}
          </div>
        )}

        {/* ══════════ STEP 2: Alan Seçimi ══════════════════════════════════ */}
        {step === 2 && selectedRecord && (
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h2>Poster Alanlarını Seç</h2>
              <button onClick={() => setStep(1)} style={styles.backBtn}>← Geri</button>
            </div>

            <div style={styles.twoCol}>
              {/* Sol: Veri önizleme */}
              <div>
                <h3 style={styles.sectionTitle}>Seçilen Eser</h3>
                {(selectedRecord['Link Resource'] || selectedRecord['Image URL']) && (
                  <img
                    src={selectedRecord['Link Resource'] || selectedRecord['Image URL']}
                    alt="Seçilen eser"
                    style={styles.previewImg}
                  />
                )}
                <div style={styles.dataTable}>
                  {columns
                    .filter(c => selectedRecord[c])
                    .map(col => (
                      <div key={col} style={styles.dataRow}>
                        <span style={styles.dataKey}>{col}</span>
                        <span style={styles.dataVal}>{selectedRecord[col]}</span>
                      </div>
                    ))
                  }
                </div>
              </div>

              {/* Sağ: Alan seçici */}
              <div>
                <h3 style={styles.sectionTitle}>Postere Eklenecek Alanlar</h3>
                <p style={{ fontSize: 13, color: '#666', marginBottom: 12 }}>
                  Hangilerini göstermek istediğinizi seçin. Sırası Step 3'te ayarlanabilir.
                </p>
                <div style={styles.fieldList}>
                  {columns
                    .filter(c => !HIDDEN_COLUMNS_DEFAULT.includes(c) && selectedRecord[c])
                    .map(col => (
                      <label key={col} style={styles.fieldItem}>
                        <input
                          type="checkbox"
                          checked={visibleFields.includes(col)}
                          onChange={e => {
                            setVisibleFields(prev =>
                              e.target.checked
                                ? [...prev, col]
                                : prev.filter(c2 => c2 !== col)
                            );
                            // Config'daki field'ı da güncelle
                            setConfig(prev => ({
                              ...prev,
                              fields: prev.fields.map(f =>
                                f.column === col ? { ...f, visible: e.target.checked } : f
                              ),
                            }));
                          }}
                        />
                        <span style={styles.fieldItemLabel}>{col}</span>
                        <span style={styles.fieldItemVal}>
                          {selectedRecord[col].length > 60
                            ? selectedRecord[col].substring(0, 60) + '…'
                            : selectedRecord[col]}
                        </span>
                      </label>
                    ))
                  }
                </div>

                <div style={styles.actionRow}>
                  <button
                    onClick={() => {
                      const allUserCols = columns.filter(c =>
                        !HIDDEN_COLUMNS_DEFAULT.includes(c) && selectedRecord[c]
                      );
                      setVisibleFields(allUserCols);
                      setConfig(prev => ({
                        ...prev,
                        fields: prev.fields.map(f => ({
                          ...f,
                          visible: allUserCols.includes(f.column),
                        })),
                      }));
                    }}
                    style={styles.btnSecondary}
                  >
                    Tümünü Seç
                  </button>
                  <button
                    onClick={() => {
                      setVisibleFields([]);
                      setConfig(prev => ({
                        ...prev,
                        fields: prev.fields.map(f => ({ ...f, visible: false })),
                      }));
                    }}
                    style={styles.btnSecondary}
                  >
                    Temizle
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    disabled={visibleFields.length === 0}
                    style={styles.btn}
                  >
                    Poster Tasarla →
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════ STEP 3: Poster Tasarımı ═══════════════════════════════ */}
        {step === 3 && selectedRecord && (
          <div style={styles.posterLayout}>
            {/* Sol: Ayarlar paneli */}
            <aside style={styles.settingsPanel}>
              <div style={styles.cardHeader}>
                <h2 style={{ fontSize: 18 }}>Poster Ayarları</h2>
                <button onClick={() => setStep(2)} style={styles.backBtn}>← Geri</button>
              </div>

              {/* Boyut */}
              <div style={styles.section}>
                <label style={styles.label}>Boyut</label>
                <select
                  style={styles.select}
                  onChange={e => {
                    const sz = POSTER_SIZES[parseInt(e.target.value)];
                    setConfig(prev => ({ ...prev, size: sz }));
                  }}
                >
                  {POSTER_SIZES.map((sz, i) => (
                    <option key={i} value={i}>{sz.label}</option>
                  ))}
                </select>
              </div>

              {/* Arka plan rengi */}
              <div style={styles.section}>
                <label style={styles.label}>Arka Plan Rengi</label>
                <div style={styles.colorRow}>
                  <input
                    type="color"
                    value={config.bgColor}
                    onChange={e => setConfig(prev => ({ ...prev, bgColor: e.target.value }))}
                    style={styles.colorInput}
                  />
                  <input
                    style={{ ...styles.input, flex: 1 }}
                    value={config.bgColor}
                    onChange={e => setConfig(prev => ({ ...prev, bgColor: e.target.value }))}
                  />
                </div>
                <div style={styles.presetColors}>
                  {['#FFFFFF', '#F5F0E8', '#1A1A1A', '#2C3E50', '#F9F3E3', '#EEF2F7'].map(c => (
                    <div
                      key={c}
                      onClick={() => setConfig(prev => ({ ...prev, bgColor: c }))}
                      style={{
                        ...styles.colorSwatch,
                        background: c,
                        border: config.bgColor === c ? '3px solid #007AFF' : '2px solid #ddd',
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Font */}
              <div style={styles.section}>
                <label style={styles.label}>Yazı Tipi</label>
                <select
                  style={styles.select}
                  value={config.font}
                  onChange={e => setConfig(prev => ({ ...prev, font: e.target.value }))}
                >
                  {FONT_OPTIONS.map(f => (
                    <option key={f} value={f} style={{ fontFamily: f }}>
                      {f.split(',')[0].replace(/"/g, '')}
                    </option>
                  ))}
                </select>
              </div>

              {/* Kenar boşluğu */}
              <div style={styles.section}>
                <label style={styles.label}>İç Kenar Boşluğu: {config.padding}px</label>
                <input
                  type="range" min={20} max={200} step={5}
                  value={config.padding}
                  onChange={e => setConfig(prev => ({ ...prev, padding: parseInt(e.target.value) }))}
                  style={styles.range}
                />
              </div>

              {/* Görsel yüzdesi */}
              <div style={styles.section}>
                <label style={styles.label}>Görsel Yüksekliği: %{config.imageHeight}</label>
                <input
                  type="range" min={0} max={80} step={5}
                  value={config.imageHeight}
                  onChange={e => setConfig(prev => ({ ...prev, imageHeight: parseInt(e.target.value) }))}
                  style={styles.range}
                />
              </div>

              {/* Görsel sığdırma */}
              <div style={styles.section}>
                <label style={styles.label}>Görsel Sığdırma</label>
                <div style={styles.radioRow}>
                  {(['contain', 'cover'] as const).map(v => (
                    <label key={v} style={styles.radio}>
                      <input
                        type="radio"
                        checked={config.imageObjectFit === v}
                        onChange={() => setConfig(prev => ({ ...prev, imageObjectFit: v }))}
                      />
                      {v === 'contain' ? 'Tam Görünür' : 'Alanı Doldur'}
                    </label>
                  ))}
                </div>
              </div>

              {/* Kenarlık */}
              <div style={styles.section}>
                <label style={styles.checkLabel}>
                  <input
                    type="checkbox"
                    checked={config.showBorder}
                    onChange={e => setConfig(prev => ({ ...prev, showBorder: e.target.checked }))}
                  />
                  &nbsp; Kenarlık Ekle
                </label>
                {config.showBorder && (
                  <div style={{ marginTop: 8 }}>
                    <div style={styles.colorRow}>
                      <input
                        type="color"
                        value={config.borderColor}
                        onChange={e => setConfig(prev => ({ ...prev, borderColor: e.target.value }))}
                        style={styles.colorInput}
                      />
                      <span style={{ fontSize: 13 }}>Kenarlık Rengi</span>
                    </div>
                    <label style={{ ...styles.label, marginTop: 8 }}>
                      Kalınlık: {config.borderWidth}px
                    </label>
                    <input
                      type="range" min={1} max={20}
                      value={config.borderWidth}
                      onChange={e => setConfig(prev => ({ ...prev, borderWidth: parseInt(e.target.value) }))}
                      style={styles.range}
                    />
                  </div>
                )}
              </div>

              {/* Filigran */}
              <div style={styles.section}>
                <label style={styles.checkLabel}>
                  <input
                    type="checkbox"
                    checked={config.showWatermark}
                    onChange={e => setConfig(prev => ({ ...prev, showWatermark: e.target.checked }))}
                  />
                  &nbsp; MET Filigranı
                </label>
              </div>

              {/* Alan ayarları */}
              <div style={styles.section}>
                <h3 style={styles.sectionTitle}>Metin Alanları</h3>
                {config.fields.filter(f => f.visible).map((field, fi) => (
                  <div key={field.column} style={styles.fieldConfig}>
                    <div style={styles.fieldConfigHeader}>
                      <strong style={{ fontSize: 13 }}>{field.column}</strong>
                      <button
                        onClick={() => setConfig(prev => ({
                          ...prev,
                          fields: prev.fields.map(f =>
                            f.column === field.column ? { ...f, visible: false } : f
                          ),
                        }))}
                        style={styles.removeBtn}
                      >
                        ✕
                      </button>
                    </div>
                    <div style={styles.miniRow}>
                      <label style={styles.miniLabel}>Yazı Boyutu</label>
                      <input
                        type="number" min={10} max={200}
                        value={field.fontSize}
                        onChange={e => updateField(field.column, 'fontSize', parseInt(e.target.value))}
                        style={{ ...styles.input, width: 60 }}
                      />
                    </div>
                    <div style={styles.miniRow}>
                      <label style={styles.checkLabel}>
                        <input
                          type="checkbox"
                          checked={field.bold}
                          onChange={e => updateField(field.column, 'bold', e.target.checked)}
                        />
                        &nbsp;Kalın
                      </label>
                      <label style={styles.checkLabel}>
                        <input
                          type="checkbox"
                          checked={field.italic}
                          onChange={e => updateField(field.column, 'italic', e.target.checked)}
                        />
                        &nbsp;İtalik
                      </label>
                    </div>
                    <div style={styles.miniRow}>
                      <label style={styles.miniLabel}>Renk</label>
                      <input
                        type="color"
                        value={field.color}
                        onChange={e => updateField(field.column, 'color', e.target.value)}
                        style={{ ...styles.colorInput, height: 28 }}
                      />
                    </div>
                    <div style={styles.miniRow}>
                      <label style={styles.miniLabel}>Hizalama</label>
                      <select
                        style={{ ...styles.select, height: 28, fontSize: 12 }}
                        value={field.align}
                        onChange={e => updateField(field.column, 'align', e.target.value as any)}
                      >
                        <option value="left">Sol</option>
                        <option value="center">Orta</option>
                        <option value="right">Sağ</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>

              <button onClick={renderPoster} style={{ ...styles.btn, width: '100%', marginTop: 12 }}>
                🔄 Yenile
              </button>
              <button onClick={downloadPoster} style={{ ...styles.btnDownload, width: '100%', marginTop: 8 }}>
                ⬇️ PNG İndir
              </button>
            </aside>

            {/* Sağ: Canvas önizleme */}
            <div style={styles.previewArea} ref={previewRef}>
              <div style={styles.canvasWrapper}>
                <canvas
                  ref={canvasRef}
                  style={styles.canvas}
                />
              </div>
              <p style={styles.canvasNote}>
                Gerçek çözünürlük: {config.size.w} × {config.size.h}px &nbsp;|&nbsp; {config.size.label}
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );

  // Field güncelleme helper
  function updateField(col: string, key: keyof PosterField, val: any) {
    setConfig(prev => ({
      ...prev,
      fields: prev.fields.map(f =>
        f.column === col ? { ...f, [key]: val } : f
      ),
    }));
  }
}

// ─── Yardımcı fonksiyonlar ────────────────────────────────────────────────────

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img     = new Image();
    img.crossOrigin = 'anonymous';
    img.onload    = () => resolve(img);
    img.onerror   = reject;
    img.src       = src;
  });
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words  = text.split(' ');
  const lines: string[] = [];
  let current  = '';

  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

// ─── Inline Styles ────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: '#F7F8FA',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    color: '#1A1A1A',
  },
  header: {
    background: '#1A1A2E',
    color: '#fff',
    padding: '32px 40px 24px',
    borderBottom: '4px solid #E8C97A',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 700,
    margin: '0 0 6px',
    letterSpacing: '-0.5px',
  },
  headerSub: {
    fontSize: 14,
    opacity: 0.7,
    margin: '0 0 20px',
  },
  steps: {
    display: 'flex',
    gap: 8,
  },
  stepBtn: {
    padding: '6px 16px',
    borderRadius: 20,
    fontSize: 13,
    background: 'rgba(255,255,255,0.15)',
    color: 'rgba(255,255,255,0.7)',
    cursor: 'default',
  },
  stepBtnActive: {
    background: '#E8C97A',
    color: '#1A1A2E',
    fontWeight: 700,
  },
  stepBtnDone: {
    background: 'rgba(232,201,122,0.3)',
    color: '#E8C97A',
  },
  main: {
    maxWidth: 1400,
    margin: '0 auto',
    padding: '32px 24px',
  },
  card: {
    background: '#fff',
    borderRadius: 12,
    padding: 28,
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  badge: {
    background: '#E8F4FD',
    color: '#1A6FA8',
    padding: '4px 12px',
    borderRadius: 20,
    fontSize: 13,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 700,
    marginBottom: 10,
    color: '#333',
  },
  label: {
    display: 'block',
    fontSize: 13,
    fontWeight: 600,
    color: '#555',
    marginBottom: 6,
  },
  chipRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    padding: '4px 12px',
    borderRadius: 16,
    border: '1px solid #ddd',
    background: '#F5F5F5',
    fontSize: 12,
    cursor: 'pointer',
  },
  chipActive: {
    background: '#1A1A2E',
    color: '#E8C97A',
    borderColor: '#1A1A2E',
  },
  filterGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
    gap: 12,
    marginBottom: 16,
  },
  filterField: {},
  input: {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #ddd',
    borderRadius: 6,
    fontSize: 13,
    boxSizing: 'border-box',
  },
  filterActions: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  checkLabel: {
    display: 'flex',
    alignItems: 'center',
    fontSize: 13,
    cursor: 'pointer',
  },
  btn: {
    background: '#1A1A2E',
    color: '#E8C97A',
    border: 'none',
    padding: '10px 24px',
    borderRadius: 6,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  btnSecondary: {
    background: '#F0F0F0',
    color: '#333',
    border: '1px solid #ddd',
    padding: '10px 20px',
    borderRadius: 6,
    fontSize: 14,
    cursor: 'pointer',
  },
  btnDownload: {
    background: '#16A34A',
    color: '#fff',
    border: 'none',
    padding: '10px 24px',
    borderRadius: 6,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  backBtn: {
    background: 'none',
    border: '1px solid #ddd',
    padding: '6px 14px',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 13,
  },
  error: {
    background: '#FEF2F2',
    border: '1px solid #FCA5A5',
    color: '#B91C1C',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    fontSize: 14,
  },
  resultCount: {
    fontSize: 13,
    color: '#666',
    margin: '16px 0 12px',
  },
  grid: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  resultCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    padding: '12px 16px',
    border: '1px solid #eee',
    borderRadius: 8,
    cursor: 'pointer',
    transition: 'background 0.15s',
  },
  thumbnail: {
    width: 70,
    height: 70,
    objectFit: 'cover',
    borderRadius: 4,
    flexShrink: 0,
    background: '#F5F5F5',
  },
  resultInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  resultTitle: {
    fontSize: 15,
    fontWeight: 600,
  },
  resultArtist: {
    fontSize: 13,
    color: '#555',
  },
  resultDate: {
    fontSize: 12,
    color: '#888',
  },
  resultDept: {
    fontSize: 11,
    color: '#aaa',
  },
  selectBtn: {
    background: '#E8C97A',
    border: 'none',
    padding: '6px 14px',
    borderRadius: 6,
    cursor: 'pointer',
    fontWeight: 700,
    fontSize: 13,
    flexShrink: 0,
  },
  pagination: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    marginTop: 16,
    justifyContent: 'center',
    fontSize: 14,
  },
  pageBtn: {
    background: '#F0F0F0',
    border: '1px solid #ddd',
    padding: '8px 16px',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 13,
  },
  emptyState: {
    textAlign: 'center',
    padding: '48px 20px',
    color: '#888',
  },
  twoCol: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 32,
  },
  previewImg: {
    width: '100%',
    maxHeight: 300,
    objectFit: 'contain',
    background: '#F5F5F5',
    borderRadius: 8,
    marginBottom: 16,
  },
  dataTable: {
    maxHeight: 400,
    overflowY: 'auto',
    border: '1px solid #eee',
    borderRadius: 8,
  },
  dataRow: {
    display: 'flex',
    gap: 12,
    padding: '8px 12px',
    borderBottom: '1px solid #f0f0f0',
    fontSize: 13,
  },
  dataKey: {
    width: 160,
    flexShrink: 0,
    color: '#888',
    fontWeight: 600,
  },
  dataVal: {
    flex: 1,
    wordBreak: 'break-word',
  },
  fieldList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    maxHeight: 480,
    overflowY: 'auto',
    border: '1px solid #eee',
    borderRadius: 8,
    padding: 12,
  },
  fieldItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 8,
    cursor: 'pointer',
    padding: '6px 0',
    borderBottom: '1px solid #f5f5f5',
    fontSize: 13,
  },
  fieldItemLabel: {
    fontWeight: 600,
    width: 150,
    flexShrink: 0,
  },
  fieldItemVal: {
    color: '#777',
    fontSize: 12,
  },
  actionRow: {
    display: 'flex',
    gap: 8,
    marginTop: 16,
    flexWrap: 'wrap',
  },
  /* Step 3 */
  posterLayout: {
    display: 'grid',
    gridTemplateColumns: '360px 1fr',
    gap: 24,
    alignItems: 'start',
  },
  settingsPanel: {
    background: '#fff',
    borderRadius: 12,
    padding: 20,
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
    maxHeight: '90vh',
    overflowY: 'auto',
  },
  select: {
    width: '100%',
    padding: '8px 10px',
    border: '1px solid #ddd',
    borderRadius: 6,
    fontSize: 13,
  },
  range: {
    width: '100%',
  },
  colorRow: {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
  },
  colorInput: {
    width: 36,
    height: 36,
    border: '1px solid #ddd',
    borderRadius: 4,
    cursor: 'pointer',
    padding: 2,
  },
  presetColors: {
    display: 'flex',
    gap: 6,
    marginTop: 8,
  },
  colorSwatch: {
    width: 28,
    height: 28,
    borderRadius: 4,
    cursor: 'pointer',
  },
  radioRow: {
    display: 'flex',
    gap: 16,
    fontSize: 13,
  },
  radio: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    cursor: 'pointer',
  },
  fieldConfig: {
    border: '1px solid #eee',
    borderRadius: 6,
    padding: 10,
    marginBottom: 8,
  },
  fieldConfigHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  removeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#999',
    fontSize: 14,
    padding: '0 4px',
  },
  miniRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
    flexWrap: 'wrap',
  },
  miniLabel: {
    fontSize: 12,
    color: '#777',
    width: 80,
    flexShrink: 0,
  },
  previewArea: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
  },
  canvasWrapper: {
    width: '100%',
    maxHeight: '80vh',
    overflow: 'auto',
    background: '#e0e0e0',
    borderRadius: 8,
    padding: 16,
    display: 'flex',
    justifyContent: 'center',
  },
  canvas: {
    maxWidth: '100%',
    boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
    display: 'block',
  },
  canvasNote: {
    fontSize: 12,
    color: '#888',
  },
};
