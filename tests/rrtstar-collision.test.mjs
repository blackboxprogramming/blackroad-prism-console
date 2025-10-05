import assert from 'node:assert/strict';
import {
  distance,
  segmentIntersectsRect,
  segmentHitsAnyRect,
} from '../sites/blackroad/src/labs/rrtGeometry.js';

const rect = { x: 200, y: 120, w: 80, h: 60 };

assert.equal(distance({ x: 0, y: 0 }, { x: 3, y: 4 }), 5);

assert.equal(
  segmentIntersectsRect({ x: 180, y: 150 }, { x: 320, y: 150 }, rect),
  true
);

assert.equal(
  segmentIntersectsRect({ x: 100, y: 40 }, { x: 160, y: 90 }, rect),
  false
);

assert.equal(
  segmentIntersectsRect({ x: 240, y: 150 }, { x: 240, y: 180 }, rect),
  true
);

assert.equal(
  segmentIntersectsRect({ x: 210, y: 130 }, { x: 210, y: 130 }, rect),
  true
);

assert.equal(
  segmentIntersectsRect({ x: 10, y: 10 }, { x: 10, y: 10 }, rect),
  false
);

assert.equal(
  segmentHitsAnyRect({ x: 0, y: 0 }, { x: 400, y: 300 }, [
    rect,
    { x: 400, y: 0, w: 40, h: 40 },
  ]),
  true
);

assert.equal(
  segmentHitsAnyRect({ x: 0, y: 0 }, { x: 40, y: 30 }, [
    rect,
    { x: 400, y: 0, w: 40, h: 40 },
  ]),
  false
);
