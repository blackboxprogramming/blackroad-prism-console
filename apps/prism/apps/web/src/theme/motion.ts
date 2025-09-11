export const motion = {
  durations: { micro: 0.18, small: 0.24, medium: 0.32, large: 0.50 },
  easing: {
    standard: [0.2, 0.0, 0.2, 1],
    decel:    [0.0, 0.0, 0.2, 1],
    accel:    [0.4, 0.0, 1,   1],
    spring:   { type: 'spring', stiffness: 260, damping: 24 }
  }
};
