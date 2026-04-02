import crypto from 'crypto';

interface HSPConfig {
  baseUrl: string;
  appKey: string;
  appSecret: string;
  merchantPrivateKey: string;
  merchantName: string;
}

function sortKeys(val: unknown): unknown {
  if (val === null || typeof val !== 'object') return val;
  if (Array.isArray(val)) return val.map(sortKeys);
  const sorted: Record<string, unknown> = {};
  for (const key of Object.keys(val as Record<string, unknown>).sort()) {
    sorted[key] = sortKeys((val as Record<string, unknown>)[key]);
  }
  return sorted;
}

function canonicalJSON(obj: unknown): string {
  return JSON.stringify(sortKeys(obj));
}

function buildSignature(method: string, path: string, query: string, body: string, timestamp: string, nonce: string, appSecret: string): string {
  const bodyHash = body ? crypto.createHash('sha256').update(body).digest('hex') : '';
  return crypto.createHmac('sha256', appSecret).update([method, path, query, bodyHash, timestamp, nonce].join('\n')).digest('hex');
}

function authHeaders(method: string, path: string, query: string, body: string, config: HSPConfig): Record<string, string> {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = crypto.randomBytes(16).toString('hex');
  return {
    'X-App-Key': config.appKey,
    'X-Signature': buildSignature(method, path, query, body, timestamp, nonce, config.appSecret),
    'X-Timestamp': timestamp,
    'X-Nonce': nonce,
    'Content-Type': 'application/json',
  };
}

async function buildMerchantAuth(contents: Record<string, unknown>, config: HSPConfig): Promise<string> {
  const cartHash = crypto.createHash('sha256').update(canonicalJSON(contents)).digest('hex');
  const now = Math.floor(Date.now() / 1000);
  const payload = { iss: config.merchantName, sub: config.merchantName, aud: 'HashkeyMerchant', iat: now, exp: now + 3600, jti: `JWT-${now}-${crypto.randomBytes(4).toString('hex')}`, cart_hash: cartHash };
  const header = Buffer.from(JSON.stringify({ alg: 'ES256K', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signer = crypto.createSign('SHA256');
  signer.update(`${header}.${body}`);
  const sig = signer.sign({ key: config.merchantPrivateKey, dsaEncoding: 'ieee-p1363' });
  return `${header}.${body}.${Buffer.from(sig).toString('base64url')}`;
}

export async function createOrder(config: HSPConfig, params: {
  orderId: string; paymentRequestId: string; payTo: string; amount: string;
  coin: 'USDC' | 'USDT'; displayItems: Array<{ label: string; currency: string; value: string }>;
  redirectUrl?: string;
}): Promise<{ paymentRequestId: string; paymentUrl: string; multiPay: boolean }> {
  const tokenAddress = params.coin === 'USDC'
    ? (process.env.USDC_ADDRESS || '0x8FE3cB719Ee4410E236Cd6b72ab1fCDC06eF53c6')
    : (process.env.USDT_ADDRESS || '0x372325443233fEbaC1F6998aC750276468c83CC6');

  const contents: Record<string, unknown> = {
    id: params.orderId, user_cart_confirmation_required: true,
    payment_request: {
      method_data: [{ supported_methods: 'https://www.x402.org/', data: { x402Version: 2, network: 'hashkey-testnet', chain_id: 133, contract_address: tokenAddress, pay_to: params.payTo, coin: params.coin } }],
      details: { id: params.paymentRequestId, display_items: params.displayItems.map(i => ({ label: i.label, amount: { currency: i.currency, value: i.value } })), total: { label: 'Total', amount: { currency: 'USD', value: params.amount } } },
    },
    cart_expiry: new Date(Date.now() + 2 * 3600000).toISOString(),
    merchant_name: config.merchantName,
  };

  const merchantAuth = await buildMerchantAuth(contents, config);
  const body = canonicalJSON({ cart_mandate: { contents, merchant_authorization: merchantAuth }, redirect_url: params.redirectUrl || '' });
  const path = '/api/v1/merchant/orders';
  const headers = authHeaders('POST', path, '', body, config);
  headers['Accept'] = 'application/json';

  // Route through Cloudflare Worker proxy to bypass Cloudflare bot detection on HSP's QA API
  const HSP_PROXY = process.env.HSP_PROXY_URL || 'https://hsp-proxy.pat-ef5.workers.dev';
  const targetUrl = `${config.baseUrl}${path}`;

  const res = await fetch(HSP_PROXY, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: targetUrl, method: 'POST', headers, body }),
  });
  const text = await res.text();
  let json: any;
  try { json = JSON.parse(text); } catch { throw new Error(`HSP returned non-JSON (${res.status}): ${text.slice(0, 200)}`); }
  if (json.code !== 0) throw new Error(`HSP error ${json.code}: ${json.msg}`);
  return { paymentRequestId: json.data.payment_request_id, paymentUrl: json.data.payment_url, multiPay: json.data.multi_pay };
}
