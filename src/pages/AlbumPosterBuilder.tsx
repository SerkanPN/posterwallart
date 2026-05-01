import React, { useState } from 'react';
import InteractiveCanvas from '../components/InteractiveCanvas';
import { useStore } from '../store/useStore';

interface Track {
  title: string;
  duration: string;
}

interface AlbumData {
  collectionId: string;
  title: string;
  artist: string;
  year: string;
  coverUrl: string;
  hdCoverUrl: string;
  tracklist: Track[];
  genre: string;
}

const AlbumPosterBuilder: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<AlbumData | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedSize, setSelectedSize] = useState('18x24');
  
  // useStore yapına göre burayı kendi sepete ekleme fonksiyonunun adıyla değiştirebilirsin
  const addToCart = useStore((state: any) => state.addToCart); 

  const searchiTunes = async () => {
    if (!query) return;
    setLoading(true);
    try {
      const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=album&attribute=artistTerm&limit=20`);
      const data = await res.json();
      setResults(data.results || []);
    } catch (error) {
      console.error('API Hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAlbum = async (album: any) => {
    setLoading(true);
    try {
      const detailUrl = `https://itunes.apple.com/lookup?id=${album.collectionId}&entity=song`;
      const response = await fetch(detailUrl);
      const data = await response.json();

      const songs = data.results.filter((item: any) => item.wrapperType === 'track');
      const tracklist = songs.map((track: any) => {
        const minutes = Math.floor(track.trackTimeMillis / 60000);
        const seconds = ((track.trackTimeMillis % 60000) / 1000).toFixed(0);
        return {
          title: track.trackName,
          duration: `${minutes}:${Number(seconds) < 10 ? '0' : ''}${seconds}`
        };
      });

      setSelectedAlbum({
        collectionId: album.collectionId,
        title: album.collectionName,
        artist: album.artistName,
        year: album.releaseDate ? album.releaseDate.substring(0, 4) : 'Unknown',
        coverUrl: album.artworkUrl100.replace('100x100bb', '500x500bb'),
        hdCoverUrl: album.artworkUrl100.replace('100x100bb', '3000x3000bb'),
        tracklist: tracklist,
        genre: album.primaryGenreName
      });
    } catch (error) {
      console.error('Detay çekme hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (!selectedAlbum) return;
    
    // Sepet reçetesi oluşturuluyor
    addToCart({
      id: `custom_${selectedAlbum.collectionId}_${Date.now()}`,
      name: `${selectedAlbum.artist} - ${selectedAlbum.title} Custom Poster`,
      price: 29.99,
      image: selectedAlbum.coverUrl,
      type: 'custom_album',
      metadata: {
        itunesId: selectedAlbum.collectionId,
        size: selectedSize,
        format: 'print',
        hdCoverUrl: selectedAlbum.hdCoverUrl
      }
    });
  };

  return (
    <div className="container mx-auto p-4 flex flex-col md:flex-row gap-8 text-white min-h-screen bg-[#121212]">
      {/* Sol Panel: Arama ve Liste */}
      <div className="w-full md:w-1/3 flex flex-col">
        <h1 className="text-2xl font-bold mb-4">Create Your Album Poster</h1>
        <div className="flex gap-2 mb-6">
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && searchiTunes()}
            placeholder="Sanatçı adı girin..."
            className="w-full p-3 border border-gray-700 rounded bg-[#181818] text-white focus:outline-none focus:border-green-500"
          />
          <button 
            onClick={searchiTunes}
            className="bg-[#1db954] hover:bg-[#1ed760] px-6 py-3 rounded text-white font-bold transition-colors"
          >
            Ara
          </button>
        </div>

        {loading && <p className="text-gray-400 mb-4">Veriler getiriliyor...</p>}

        <div className="grid grid-cols-2 gap-4 overflow-y-auto max-h-[calc(100vh-200px)] pr-2 custom-scrollbar">
          {results.map((album) => (
            <div 
              key={album.collectionId} 
              className="bg-[#181818] p-3 rounded-lg cursor-pointer hover:bg-[#282828] transition-colors border border-transparent hover:border-gray-700"
              onClick={() => handleSelectAlbum(album)}
            >
              <img 
                src={album.artworkUrl100.replace('100x100bb', '300x300bb')} 
                alt={album.collectionName} 
                className="w-full aspect-square object-cover rounded mb-3 shadow-md"
              />
              <h3 className="font-bold text-sm truncate" title={album.collectionName}>{album.collectionName}</h3>
              <p className="text-xs text-gray-400 truncate" title={album.artistName}>{album.artistName}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Sağ Panel: Canvas Önizleme ve İşlemler */}
      <div className="w-full md:w-2/3 flex flex-col items-center justify-start pt-10">
        {selectedAlbum ? (
          <div className="w-full max-w-2xl flex flex-col items-center">
            
            <div className="w-full bg-[#181818] rounded-xl p-6 mb-6 flex justify-center shadow-2xl border border-gray-800 min-h-[500px]">
              <InteractiveCanvas albumData={selectedAlbum} />
            </div>
            
            <div className="flex gap-4 w-full">
              <select 
                value={selectedSize}
                onChange={(e) => setSelectedSize(e.target.value)}
                className="flex-1 p-3 bg-[#181818] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-gray-500"
              >
                <option value="12x18">12x18 inç - Print</option>
                <option value="18x24">18x24 inç - Print</option>
                <option value="24x36">24x36 inç - Print</option>
                <option value="digital">Digital Download</option>
              </select>
              <button 
                onClick={handleAddToCart}
                className="flex-1 bg-white text-black font-bold py-3 px-6 rounded-lg hover:bg-gray-200 transition-colors shadow-lg"
              >
                Sepete Ekle
              </button>
            </div>
          </div>
        ) : (
          <div className="h-[500px] w-full max-w-2xl flex items-center justify-center border-2 border-dashed border-gray-700 rounded-xl text-gray-500 bg-[#181818] bg-opacity-50">
            Tasarımı görmek için listeden bir albüm seçin.
          </div>
        )}
      </div>
    </div>
  );
};

export default AlbumPosterBuilder;
