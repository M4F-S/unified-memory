// NEAR ConsentNFT Smart Contract — source file (ESM)
// Build: npx near-sdk-js build contracts/consent_nft_src.js contracts/consent_nft.wasm contracts/package.json

import { NearBindgen, near, call, view, initialize } from 'near-sdk-js';

@NearBindgen({})
class ConsentNFT {
  constructor() {
    this.consents = {};
    this.nextTokenId = 0;
  }

  @initialize({})
  init({ owner_id }) {
    this.owner = owner_id;
  }

  @call({ payableFunction: true })
  mint_consent({ agent_id, allowed_platforms, allowed_memory_types,
    max_queries, max_usdc_budget, expires_at, data_root_hash }) {
    const caller = near.predecessorAccountId();
    const tokenId = (this.nextTokenId++).toString();
    this.consents[tokenId] = {
      owner: caller, agent_id,
      allowed_platforms, allowed_memory_types,
      max_queries, max_usdc_budget,
      usdc_spent: 0, queries_used: 0,
      expires_at, data_root_hash,
      is_active: true,
      created_at: near.blockTimestamp().toString(),
      revoked_at: null
    };
    near.log(`ConsentNFT minted: tokenId=${tokenId} agent=${agent_id}`);
    return tokenId;
  }

  @call({})
  revoke_consent({ token_id }) {
    const caller = near.predecessorAccountId();
    const consent = this.consents[token_id];
    if (!consent) throw new Error('Token not found');
    if (consent.owner !== caller) throw new Error('Not owner');
    if (!consent.is_active) throw new Error('Already revoked');
    consent.is_active = false;
    consent.revoked_at = near.blockTimestamp().toString();
    this.consents[token_id] = consent;
    near.log(`ConsentNFT revoked: tokenId=${token_id}`);
  }

  @view({})
  validate_query({ token_id, platform, memory_type, query_cost_usdc }) {
    const c = this.consents[token_id];
    if (!c) return { valid: false, reason: 'Token not found' };
    if (!c.is_active) return { valid: false, reason: 'Consent revoked' };
    if (BigInt(near.blockTimestamp()) > BigInt(c.expires_at) * 1000000n)
      return { valid: false, reason: 'Consent expired' };
    if (platform !== 'all' && !c.allowed_platforms.includes(platform))
      return { valid: false, reason: 'Platform not in scope' };
    if (memory_type !== 'all' && !c.allowed_memory_types.includes(memory_type))
      return { valid: false, reason: 'Memory type not in scope' };
    if (c.queries_used >= c.max_queries)
      return { valid: false, reason: 'Query limit reached' };
    if ((c.usdc_spent + query_cost_usdc) > c.max_usdc_budget)
      return { valid: false, reason: 'Budget exceeded' };
    return { valid: true, remaining_queries: c.max_queries - c.queries_used };
  }

  @call({})
  record_query({ token_id, usdc_spent }) {
    const c = this.consents[token_id];
    if (!c) throw new Error('Token not found');
    c.queries_used += 1;
    c.usdc_spent += usdc_spent;
    this.consents[token_id] = c;
  }

  @view({})
  get_consent({ token_id }) {
    return this.consents[token_id] || null;
  }

  @view({})
  get_consents_by_owner({ owner_id }) {
    return Object.entries(this.consents)
      .filter(([_, c]) => c.owner === owner_id)
      .map(([id, c]) => ({ token_id: id, ...c }));
  }
}
