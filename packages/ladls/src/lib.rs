pub mod aead;
pub mod error;
pub mod frame;
pub mod kdf;
pub mod nonce;
pub mod rekey;
pub mod sa;
pub mod session;

pub use error::LadlsError;
pub use frame::LAdlsHeader;
pub use sa::SecurityAssociation;
pub use session::Session;

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn round_trip() {
        let sa = SecurityAssociation::new(1);
        let mut tx = Session::new_tx(sa.clone());
        let frame = tx.seal(0, &[], b"hello").unwrap();
        let mut rx = Session::new_rx(sa);
        let (_header, _ad, _pt) = rx.open(&frame).unwrap();
    }
}
