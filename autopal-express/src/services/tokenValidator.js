const jwt = require('jsonwebtoken');
const jwksRsa = require('jwks-rsa');
const { getConfig } = require('../config');

let jwksClient;

function getClient() {
  if (jwksClient) {
    return jwksClient;
  }
  const config = getConfig();
  jwksClient = jwksRsa({
    jwksUri: config.jwksUrl,
    cache: true,
    cacheMaxEntries: 5,
    cacheMaxAge: config.jwksCacheTtl * 1000
  });
  return jwksClient;
}

function reset() {
  jwksClient = undefined;
}

function getKey(header, callback) {
  const client = getClient();
  client
    .getSigningKey(header.kid)
    .then((key) => {
      callback(null, key.getPublicKey());
    })
    .catch((error) => callback(error));
}

async function verifyBearerToken(token) {
  const config = getConfig();
  if (!token) {
    throw new Error('Missing bearer token');
  }
  const allowInsecure = ['1', 'true', 'yes'].includes(String(process.env.AUTOPAL_ALLOW_INSECURE_TOKENS || '').toLowerCase());
  if (allowInsecure) {
    return jwt.decode(token, { complete: false }) || {};
  }
  return new Promise((resolve, reject) => {
    jwt.verify(
      token,
      getKey,
      {
        issuer: config.issuer,
        audience: config.expectedAudiences.length > 0 ? config.expectedAudiences : undefined,
        algorithms: ['RS256', 'RS512']
      },
      (error, decoded) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(decoded);
      }
    );
  });
}

module.exports = {
  verifyBearerToken,
  reset
};
