// Cloudflare Worker proxy for HSP API
// Cloudflare won't challenge requests from its own Workers network
export default {
  async fetch(request, env) {
    // Only allow POST
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    try {
      const { url, method, headers, body } = await request.json();

      // Only proxy to HSP merchant API
      if (!url.startsWith('https://merchant-qa.hashkeymerchant.com/')) {
        return new Response('Invalid target URL', { status: 400 });
      }

      const hspRes = await fetch(url, {
        method: method || 'POST',
        headers: headers || {},
        body: body || undefined,
      });

      const responseBody = await hspRes.text();

      return new Response(responseBody, {
        status: hspRes.status,
        headers: {
          'Content-Type': hspRes.headers.get('Content-Type') || 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }
  },
};
