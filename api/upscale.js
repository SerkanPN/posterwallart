// api/upscale.js
import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export default async function handler(req, res) {
  // Sadece POST isteklerine izin ver
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { imageUrl } = req.body;

  if (!imageUrl) {
    return res.status(400).json({ error: 'Image URL is required' });
  }

  try {
    console.log("Upscaling via Replicate...");
    
    // Real-ESRGAN Modelini çalıştır
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

    // Başarılı sonucu dön
    return res.status(200).json({ upscaledUrl: output });
  } catch (error) {
    console.error("Replicate API Error:", error);
    return res.status(500).json({ error: 'Upscale failed' });
  }
}
