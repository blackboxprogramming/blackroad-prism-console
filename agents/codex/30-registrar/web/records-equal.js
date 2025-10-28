export default function recordsEqual(a, b) {
  if (!a || !b) return false;
  return (
    (a.name || '@') === (b.name || '@') &&
    a.type === b.type &&
    a.value === b.value &&
    Number(a.ttl || 0) === Number(b.ttl || 0) &&
    Number(a.priority || 0) === Number(b.priority || 0)
  );
}
