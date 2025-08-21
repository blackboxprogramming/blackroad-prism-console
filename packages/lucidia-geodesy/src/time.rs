//! Time system utilities.

/// Convert UTC (seconds) to TAI (seconds).
///
/// This stub assumes a constant 37 second offset.
pub fn utc_to_tai(utc_seconds: f64) -> f64 {
    utc_seconds + 37.0
}

/// Convert ITRS coordinates to GCRS.
///
/// For now this is an identity transform that returns the input.
pub fn itrs_to_gcrs(x: [f64; 3]) -> [f64; 3] {
    x
}
