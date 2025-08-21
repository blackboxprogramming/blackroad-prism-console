#[derive(Clone, Debug)]
pub struct SecurityAssociation {
    pub spi: u32,
}

impl SecurityAssociation {
    pub fn new(spi: u32) -> Self {
        Self { spi }
    }
}
