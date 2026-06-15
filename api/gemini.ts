export default async function handler(req: any, res: any) {
  // CORS ayarları (Gerekirse)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error("CRITICAL: GEMINI_API_KEY is missing in Vercel Environment Variables");
    return res.status(500).json({ error: 'Server configuration error: Missing API Key' });
  }

  try {
    const { endpoint, payload } = req.body;

    if (!endpoint || !payload) {
      return res.status(400).json({ error: 'Missing endpoint or payload' });
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${endpoint}?key=${apiKey}`;

    console.log(`[DEBUG] Calling Gemini API: ${endpoint}`);

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini API returned error:", data);
      return res.status(response.status).json(data);
    }

    return res.status(200).json(data);
  } catch (error: any) {
    console.error("Backend Catch Error:", error.message);
    return res.status(500).json({ error: error.message });
  }
}
