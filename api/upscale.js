export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const apiKey = process.env.RUNWARE_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Missing Runware API Key' });
  const { imageUrl } = req.body;
  if (!imageUrl) return res.status(400).json({ error: "No image URL provided" });
  try {
    console.log("[LOG] API: Starting Runware Upscale (2x) for:", imageUrl);
    const response = await fetch('https://api.runware.ai/v1', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify([{
        taskType: 'upscale',
        taskUUID: crypto.randomUUID(),
        inputImage: imageUrl,
        model: 'runware:501@1',
        upscaleFactor: 2,
        outputType: 'URL',
        outputFormat: 'PNG'
      }])
    });
    const data = await response.json();
    if (data.errors) throw new Error(data.errors[0].message);
    console.log("[LOG] API: Upscale success, URL delivered");
    res.status(200).json({ upscaledUrl: data.data[0].imageURL, cost: data.data[0].cost || 0 });
  } catch (error) {
    console.error("[ERROR] API: Upscale failed:", error.message);
    res.status(500).json({ error: error.message });
  }
}
