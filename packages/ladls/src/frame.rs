#[derive(Debug, Clone)]
pub struct LAdlsHeader {
    pub version: u8,
    pub msg_type: u8,
    pub spi: u32,
    pub sn: u64,
    pub flags: u8,
    pub ad_len: u16,
}

impl LAdlsHeader {
    pub const VERSION: u8 = 1;

    pub fn new(msg_type: u8, spi: u32, sn: u64, flags: u8, ad_len: u16) -> Self {
        Self {
            version: Self::VERSION,
            msg_type,
            spi,
            sn,
            flags,
            ad_len,
        }
    }

    pub fn encode(&self) -> [u8; 17] {
        let mut buf = [0u8; 17];
        buf[0] = self.version;
        buf[1] = self.msg_type;
        buf[2..6].copy_from_slice(&self.spi.to_be_bytes());
        buf[6..14].copy_from_slice(&self.sn.to_be_bytes());
        buf[14] = self.flags;
        buf[15..17].copy_from_slice(&self.ad_len.to_be_bytes());
        buf
    }
}
