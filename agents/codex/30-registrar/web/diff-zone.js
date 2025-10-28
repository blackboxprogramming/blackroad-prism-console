import recordsEqual from './records-equal.js';

export function diffZone(current, desired) {
  const existing = indexRecords(current.records || []);
  const target = indexRecords(desired.records || []);
  const diffs = [];

  Object.keys(target).forEach((key) => {
    if (!existing[key]) {
      diffs.push({ action: 'create', record: target[key], reason: 'missing' });
      return;
    }
    if (!recordsEqual(existing[key], target[key])) {
      diffs.push({ action: 'update', record: target[key], reason: 'attributes_changed' });
    }
  });

  Object.keys(existing).forEach((key) => {
    if (!target[key]) {
      diffs.push({ action: 'delete', record: existing[key], reason: 'unexpected' });
    }
  });

  return diffs;
}

function indexRecords(records) {
  return Object.fromEntries(
    records.map((record) => {
      const key = `${record.name || '@'}|${record.type}|${record.value}`;
      return [key, record];
    }),
  );
}
