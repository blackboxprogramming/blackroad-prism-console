const counters = new Map();

function increment(metric, amount = 1) {
  if (amount < 0) {
    throw new Error('amount must be non-negative');
  }
  if (amount === 0) {
    return;
  }
  counters.set(metric, (counters.get(metric) || 0) + amount);
}

function snapshot() {
  return Object.fromEntries(counters);
}

module.exports = {
  increment,
  snapshot
};
