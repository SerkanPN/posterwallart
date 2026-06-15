export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const apiKey = process.env.RUNWARE_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Missing Runware API Key' });
  const { imageUrl } = req.body;
  if (!imageUrl) return res.status(400).json({ error: 'No image URL provided' });
  try {
    console.log("[LOG] Requesting Vectorization for:", imageUrl);
    const response = await fetch('https://api.runware.ai/v1', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify([{
        taskType: 'vectorize',
        taskUUID: crypto.randomUUID(),
        model: 'recraft:1@1',
        outputType: 'URL',
        outputFormat: 'SVG',
        inputs: { image: imageUrl }
      }])
    });
    const data = await response.json();
    if (data.errors) throw new Error(data.errors[0].message);
    console.log("[LOG] Vectorization success:", data.data[0].imageURL);
    res.status(200).json({ svgUrl: data.data[0].imageURL, cost: data.data[0].cost || 0 });
  } catch (error: any) {
    console.error("[ERROR] Vectorize API:", error.message);
    res.status(500).json({ error: error.message });
  }
}
