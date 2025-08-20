use crate::{error::LadlsError, frame::LAdlsHeader, sa::SecurityAssociation};

#[derive(Clone)]
pub struct Session {
    sa: SecurityAssociation,
    sn: u64,
}

impl Session {
    pub fn new_tx(sa: SecurityAssociation) -> Self {
        Self { sa, sn: 0 }
    }

    pub fn new_rx(sa: SecurityAssociation) -> Self {
        Self { sa, sn: 0 }
    }

    pub fn seal(
        &mut self,
        msg_type: u8,
        _ad: &[u8],
        _plaintext: &[u8],
    ) -> Result<Vec<u8>, LadlsError> {
        let header = LAdlsHeader::new(msg_type, self.sa.spi, self.sn, 0, 0);
        self.sn = self.sn.wrapping_add(1);
        Ok(header.encode().to_vec())
    }

    pub fn open(&mut self, frame: &[u8]) -> Result<(LAdlsHeader, Vec<u8>, Vec<u8>), LadlsError> {
        if frame.len() < 17 {
            return Err(LadlsError::Parse);
        }
        let header = LAdlsHeader {
            version: frame[0],
            msg_type: frame[1],
            spi: u32::from_be_bytes(frame[2..6].try_into().unwrap()),
            sn: u64::from_be_bytes(frame[6..14].try_into().unwrap()),
            flags: frame[14],
            ad_len: u16::from_be_bytes(frame[15..17].try_into().unwrap()),
        };
        Ok((header, Vec::new(), Vec::new()))
    }

    pub fn request_rekey(&mut self) {
        // placeholder
    }
}
