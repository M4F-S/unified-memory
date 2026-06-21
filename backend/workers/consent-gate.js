// workers/consent-gate.js
// NEAR Consent NFT validation — imported by mcp-server.js

async function nearView(contractId, method, args, rpcUrl) {
  const resp = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0', id: 1, method: 'query',
      params: {
        request_type: 'call_function',
        finality: 'final',
        account_id: contractId,
        method_name: method,
        args_base64: btoa(JSON.stringify(args))
      }
    })
  });
  const data = await resp.json();
  if (data.error || !data.result?.result) {
    throw new Error(`NEAR RPC error on ${method}: ${JSON.stringify(data.error ?? 'empty result')}`);
  }
  return JSON.parse(new TextDecoder().decode(new Uint8Array(data.result.result)));
}

export async function validateConsent(token_id, platform, memory_type, env) {
  return nearView(
    env.NEAR_CONTRACT_ID,
    'validate_query',
    { token_id, platform, memory_type, query_cost_usdc: 0.001 },
    env.NEAR_RPC
  );
}

export async function getConsent(token_id, env) {
  try {
    return await nearView(env.NEAR_CONTRACT_ID, 'get_consent', { token_id }, env.NEAR_RPC);
  } catch {
    return null;
  }
}

// fire-and-forget — requires NEAR_PRIVATE_KEY wrangler secret + signed tx support
// For hackathon: logs intent, does not submit signed tx
export function recordQuery(token_id, usdc_spent, env, ctx) {
  ctx.waitUntil(
    fetch(env.NEAR_RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0', id: 1, method: 'broadcast_tx_async',
        params: [
          // TODO: sign record_query({token_id, usdc_spent}) with NEAR_PRIVATE_KEY
          // Use near-api-js in a separate signing service or add signing here
          'PLACEHOLDER_SIGNED_TX'
        ]
      })
    }).catch(() => {})
  );
}
