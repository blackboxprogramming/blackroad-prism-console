//! Rekey policy helpers (stub).

pub fn should_rekey(age_secs: u64, frame_count: u64) -> bool {
    age_secs >= 24 * 60 * 60 || frame_count >= 1_000_000
}
