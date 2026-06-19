// workers/x402-gate.js
// x402 micropayment gate — checks X-PAYMENT header, returns 402 challenge if missing

const USDC_BASE_SEPOLIA = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';
const QUERY_COST_MICRO_USDC = '1000'; // 0.001 USDC in 6-decimal units

export function checkPayment(request, resourceUrl, env) {
  if (request.headers.get('X-PAYMENT')) return null; // paid — proceed

  return new Response(
    JSON.stringify({ jsonrpc: '2.0', error: { code: -32402, message: 'Payment required' } }),
    {
      status: 402,
      headers: {
        'Content-Type': 'application/json',
        'PAYMENT-REQUIRED': JSON.stringify({
          scheme: 'exact',
          network: 'base-sepolia',
          maxAmountRequired: QUERY_COST_MICRO_USDC,
          resource: resourceUrl,
          description: 'Memory query - UnifiedMemory',
          mimeType: 'application/json',
          payTo: env.CIRCLE_WALLET_ADDRESS,
          maxTimeoutSeconds: 30,
          asset: USDC_BASE_SEPOLIA
        })
      }
    }
  );
}
