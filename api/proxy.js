export default async function handler(req, res) {
    const { url } = req.query;
    
    if (!url) {
        return res.status(400).send('URL eksik');
    }

    try {
        const response = await fetch(decodeURIComponent(url));
        if (!response.ok) throw new Error('Gorsel indirilemedi');
        
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        res.setHeader('Content-Type', 'image/jpeg');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cache-Control', 'public, max-age=86400');
        res.send(buffer);
    } catch (error) {
        res.status(500).send('Hata olustu');
    }
}
