export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const apiKey = process.env.RUNWARE_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Missing Runware API Key' });
  try {
    const tasks = req.body;
    console.log("[LOG] Processing Runware Lab Tasks:", JSON.stringify(tasks).substring(0, 100));
    const response = await fetch('https://api.runware.ai/v1', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify(tasks)
    });
    const data = await response.json();
    res.status(200).json(data);
  } catch (error: any) {
    console.error("[ERROR] Runware API Hub:", error.message);
    res.status(500).json({ error: error.message });
  }
}
