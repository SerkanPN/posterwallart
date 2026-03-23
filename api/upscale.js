export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.RUNWARE_API_KEY;

  if (!apiKey) {
    console.error("[DEBUG] CRITICAL: RUNWARE_API_KEY is missing in Vercel Environment Variables");
    return res.status(500).json({ error: 'Server configuration error: Missing Runware API Key' });
  }

  const { imageUrl } = req.body;

  if (!imageUrl) {
    console.error("[DEBUG] Error: No imageUrl provided in request body");
    return res.status(400).json({ error: "Görsel URL'si gelmedi." });
  }

  console.log("[DEBUG] Starting Runware Upscale (2x) for:", imageUrl);

  try {
    const response = await fetch('https://api.runware.ai/v1', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify([
        {
          taskType: 'upscale',
          taskUUID: crypto.randomUUID(),
          inputImage: imageUrl,
          model: 'runware:501@1',
          upscaleFactor: 2, // HATA BURADAYDI: 4 yerine 2 destekleniyor
          outputType: 'URL',
          outputFormat: 'PNG'
        }
      ])
    });

    const data = await response.json();

    if (!response.ok || (data.errors && data.errors.length > 0)) {
      const errMsg = data.errors ? data.errors[0].message : 'Runware API Error';
      console.error("[DEBUG] Runware API Failure:", errMsg);
      return res.status(response.status || 500).json({ error: errMsg });
    }

    const result = data.data[0];
    
    console.log("[DEBUG] Upscale Successful. New URL:", result.imageURL);
    console.log("[DEBUG] Operation Cost:", result.cost || 0);

    return res.status(200).json({ 
      upscaledUrl: result.imageURL,
      cost: result.cost || 0
    });

  } catch (error) {
    console.error("[DEBUG] Internal Server Error in Upscale Endpoint:", error.message);
    return res.status(500).json({ error: error.message });
  }
}
