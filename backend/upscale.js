const Replicate = require("replicate");

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

async function upscaleImage(imageUrl) {
  console.log("Upscale işlemi Replicate üzerinde başlatıldı...");

  try {
    const output = await replicate.run(
      "nightmare-ai/real-esrgan:42fed1c4974cc6b73a469f3c509371239c43b81180295da4e74e6488d758066f",
      {
        input: {
          image: imageUrl,
          upscale: 4, // 4 kat büyütür (4K seviyesi)
          face_enhance: false // Posterlerde yüz yoksa kapalı kalmalı
        }
      }
    );
    
    // Output doğrudan upscaled görselin URL'sini döner
    return output; 
  } catch (error) {
    console.error("Replicate API Hatası:", error);
    throw error;
  }
}

module.exports = { upscaleImage };
