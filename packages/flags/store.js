const {
  SSMClient,
  GetParameterCommand,
  PutParameterCommand,
} = require('@aws-sdk/client-ssm');

const ssm = new SSMClient({});
let cache = null;

function normalizeDoc(doc) {
  const features =
    doc && doc.features && typeof doc.features === 'object' ? doc.features : {};
  const segments =
    doc && doc.segments && typeof doc.segments === 'object'
      ? doc.segments
      : undefined;
  const version = doc && typeof doc.version === 'number' ? doc.version : 0;
  return { features, segments, version };
}

async function fetchDoc(paramName) {
  const response = await ssm.send(
    new GetParameterCommand({ Name: paramName, WithDecryption: true })
  );
  const raw = response.Parameter && response.Parameter.Value;
  if (!raw) {
    return { features: {}, version: 0 };
  }
  try {
    const parsed = JSON.parse(raw);
    return normalizeDoc(parsed);
  } catch {
    return { features: {}, version: 0 };
  }
}

async function loadFlags(paramName, maxAgeMs = 30000) {
  const now = Date.now();
  if (cache && cache.param === paramName && now - cache.ts < maxAgeMs) {
    return cache.doc;
  }
  const doc = await fetchDoc(paramName);
  cache = { doc, ts: now, param: paramName };
  return doc;
}

function primeFlags(doc, paramName) {
  cache = { doc: normalizeDoc(doc), ts: Date.now(), param: paramName };
}

async function saveFlagsDoc(doc, paramName) {
  const normalized = normalizeDoc(doc);
  const nextDoc = { ...normalized, version: normalized.version + 1 };
  await ssm.send(
    new PutParameterCommand({
      Name: paramName,
      Type: 'SecureString',
      Value: JSON.stringify(nextDoc),
      Overwrite: true,
    })
  );
  primeFlags(nextDoc, paramName);
  return nextDoc;
}

module.exports = { loadFlags, primeFlags, saveFlagsDoc };
