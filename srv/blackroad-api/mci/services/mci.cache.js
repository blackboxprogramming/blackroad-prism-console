const cache = new Map();
const MAX = 100;
module.exports = {
  get: (k) => cache.get(k),
  set: (k, v) => {
    if (cache.size >= MAX) {
      const first = cache.keys().next().value;
      cache.delete(first);
    }
    cache.set(k, v);
  },
  stats: () => ({ size: cache.size })
};
