use thiserror::Error;

#[derive(Debug, Error)]
pub enum LadlsError {
    #[error("not implemented")]
    NotImplemented,
    #[error("parse error")]
    Parse,
}
