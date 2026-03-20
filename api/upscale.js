import Replicate from "replicate";

export default async function handler(req, res) {
  // Debug için token kontrolü
  if (!process.env.REPLICATE_API_TOKEN) {
    return res.status(500).json({ error: "API Token eksik! Vercel panelinden ekle." });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Sadece POST isteği atabilirsin.' });
  }

  const { imageUrl } = req.body;
  
  if (!imageUrl) {
    return res.status(400).json({ error: "Görsel URL'si gelmedi." });
  }

  const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
  });

  try {
    const output = await replicate.run(
      "nightmare-ai/real-esrgan:42fed1c4974cc6b73a469f3c509371239c43b81180295da4e74e6488d758066f",
      {
        input: {
          image: imageUrl,
          upscale: 4,
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
