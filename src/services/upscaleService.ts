export const getUpscaledImage = async (designId: string, originalUrl: string) => {
  // Önce veritabanı kontrolü (Daha önce söylemiştik, bir kere yapıldıysa DB'den çek)
  // Şimdilik doğrudan API'ye soruyoruz:
  
  try {
    const response = await fetch('/api/upscale', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageUrl: originalUrl }),
    });

    if (!response.ok) throw new Error('Upscale request failed');

    const data = await response.json();
    
    // Buraya DB güncelleme kodunu ekleyeceğiz (Upscaled URL'yi kaydetmek için)
    
    return data.upscaledUrl;
  } catch (error) {
    console.error("Service Error:", error);
    throw error;
  }
};
