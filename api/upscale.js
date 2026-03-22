import Replicate from "replicate";

export default async function handler(req, res) {
  if (!process.env.REPLICATE_API_TOKEN) {
    return res.status(500).json({ error: "API Token eksik!" });
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Sadece POST isteği atabilirsin.' });
  }

  const { imageUrl } = req.body;
  if (!imageUrl) return res.status(400).json({ error: "Görsel URL'si gelmedi." });

  const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

  try {
    const output = await replicate.run(
      "nightmareai/real-esrgan",  // ← versiyon hash'i kaldırıldı
      {
        input: {
          image: imageUrl,
          scale: 4,               // ← upscale → scale olarak değişti
          face_enhance: false
        }
      }
    );
    return res.status(200).json({ upscaledUrl: output });
  } catch (error) {
    console.error("Replicate Hatası:", error);
    return res.status(500).json({ error: error.message });
  }
}
