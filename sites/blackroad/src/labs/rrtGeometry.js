export function distance(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

function pointInsideRect(p, rect) {
  return (
    p.x >= rect.x &&
    p.x <= rect.x + rect.w &&
    p.y >= rect.y &&
    p.y <= rect.y + rect.h
  );
}

export function segmentIntersectsRect(a, b, rect) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;

  if (dx === 0 && dy === 0) {
    return pointInsideRect(a, rect);
  }

  let t0 = 0;
  let t1 = 1;
  const p = [-dx, dx, -dy, dy];
  const q = [
    a.x - rect.x,
    rect.x + rect.w - a.x,
    a.y - rect.y,
    rect.y + rect.h - a.y,
  ];

  for (let i = 0; i < 4; i += 1) {
    const pi = p[i];
    const qi = q[i];
    if (pi === 0) {
      if (qi < 0) return false;
      continue;
    }
    const r = qi / pi;
    if (pi < 0) {
      if (r > t1) return false;
      if (r > t0) t0 = r;
    } else {
      if (r < t0) return false;
      if (r < t1) t1 = r;
    }
  }

  return t0 <= t1 && t1 >= 0 && t0 <= 1;
}

export function segmentHitsAnyRect(a, b, obstacles) {
  for (const rect of obstacles) {
    if (segmentIntersectsRect(a, b, rect)) {
      return true;
    }
  }
  return false;
}
