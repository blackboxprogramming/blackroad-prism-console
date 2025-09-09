#!/usr/bin/env node
// Auto-pin CIDs announced on Truth Garden pubsub.
// Env: TRUTH_TOPIC (default truth.garden/v1/announce), IPFS_API (default http://127.0.0.1:5001)
//      ALLOW_DIDS (comma-separated did:key list; if unset -> allow all)
const { create } = require('ipfs-http-client');

const TOPIC = process.env.TRUTH_TOPIC || 'truth.garden/v1/announce';
const API = process.env.IPFS_API || 'http://127.0.0.1:5001';
const ALLOW = (process.env.ALLOW_DIDS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
const ipfs = create({ url: API });

(async () => {
  console.log('[subpin] connecting', API, 'topic', TOPIC, 'allow', ALLOW.length ? ALLOW : 'ALL');
  await ipfs.pubsub.subscribe(TOPIC, async (msg) => {
    try {
      const text = new TextDecoder().decode(msg.data);
      const o = JSON.parse(text);
      if (!o?.cid) return;
      if (ALLOW.length && (!o.did || !ALLOW.includes(o.did))) return;
      console.log('[subpin] pin', o.cid, o.did || '?');
      await ipfs.pin.add(o.cid).catch(() => {});
    } catch (e) {
      /* ignore */
    }
  });
})();
