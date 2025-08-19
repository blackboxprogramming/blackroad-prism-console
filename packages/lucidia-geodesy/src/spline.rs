//! B-spline utilities (stub).

/// Fit a simple linear spline to data.
/// Returns coefficients for y = ax + b.
pub fn spline_fit(x: &[f64], y: &[f64]) -> [f64; 2] {
    assert_eq!(x.len(), y.len());
    if x.is_empty() {
        return [0.0, 0.0];
    }
    let n = x.len() as f64;
    let sum_x: f64 = x.iter().sum();
    let sum_y: f64 = y.iter().sum();
    let sum_xy: f64 = x.iter().zip(y.iter()).map(|(xi, yi)| xi * yi).sum();
    let sum_x2: f64 = x.iter().map(|xi| xi * xi).sum();
    let denom = n * sum_x2 - sum_x * sum_x;
    if denom == 0.0 {
        return [0.0, 0.0];
    }
    let a = (n * sum_xy - sum_x * sum_y) / denom;
    let b = (sum_y - a * sum_x) / n;
    [a, b]
}
