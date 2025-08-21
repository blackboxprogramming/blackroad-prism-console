//! AEAD helpers (stub).

use crate::error::LadlsError;

pub fn seal(
    _key: &[u8],
    _nonce: &[u8],
    _plaintext: &[u8],
    _ad: &[u8],
) -> Result<Vec<u8>, LadlsError> {
    Err(LadlsError::NotImplemented)
}

pub fn open(
    _key: &[u8],
    _nonce: &[u8],
    _ciphertext: &[u8],
    _ad: &[u8],
) -> Result<Vec<u8>, LadlsError> {
    Err(LadlsError::NotImplemented)
}
