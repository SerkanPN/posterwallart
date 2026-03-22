const API_URL = 'https://api.posterwallart.shop/api.php';

/**
 * Returns a hi-res URL for the given product.
 * - If already upscaled (hires_url in DB), returns it directly.
 * - Otherwise calls Vercel /api/upscale → saves result to DB → returns URL.
 */
export async function getUpscaledImage(
  productId: string,
  originalUrl: string,
  accessToken: string
): Promise<string> {

  // 1. Check if hires already exists in DB
  const checkRes = await fetch(`${API_URL}?action=get_hires&product_id=${productId}`, {
    headers: { 'Authorization': `Bearer ${accessToken}` },
  });
  const checkData = await checkRes.json();

  if (checkData.success && checkData.hires_url) {
    console.log('[Upscale] Cache hit — returning existing hires URL');
    return checkData.hires_url;
  }

  // 2. Call Vercel upscale endpoint
  console.log('[Upscale] No cache — calling Replicate...');
  const upscaleRes = await fetch('/api/upscale', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageUrl: originalUrl }),
  });

  if (!upscaleRes.ok) {
    const err = await upscaleRes.json();
    throw new Error(err.error || 'Upscale failed');
  }

  const { upscaledUrl } = await upscaleRes.json();
  if (!upscaledUrl) throw new Error('Upscale returned empty URL');

  // 3. Save hires_url to DB
  console.log('[Upscale] Saving hires URL to DB...');
  await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'save_hires',
      product_id: productId,
      hires_url: upscaledUrl,
    }),
  });

  return upscaledUrl;
}
