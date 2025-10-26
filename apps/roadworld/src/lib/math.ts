export const degToRad = (deg: number) => (deg * Math.PI) / 180;
export const radToDeg = (rad: number) => (rad * 180) / Math.PI;

export const snapValue = (value: number, increment: number) => {
  if (increment <= 0) return value;
  return Math.round(value / increment) * increment;
};

export const snapVector = (values: [number, number, number], increment: number): [number, number, number] => [
  snapValue(values[0], increment),
  snapValue(values[1], increment),
  snapValue(values[2], increment),
];

export const clampRotation = (value: number) => {
  const twoPi = Math.PI * 2;
  let result = value % twoPi;
  if (result <= -Math.PI) result += twoPi;
  if (result > Math.PI) result -= twoPi;
  return result;
};

export const applySnap = {
  translate: (values: [number, number, number], increment: number) => snapVector(values, increment),
  rotate: (values: [number, number, number], incrementDeg: number) =>
    snapVector(values, degToRad(incrementDeg)),
  scale: (values: [number, number, number], increment: number) => snapVector(values, increment),
};
