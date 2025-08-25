use core::fmt;

#[derive(Debug)]
pub enum PrismError {
    WriteError,
}

impl fmt::Display for PrismError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            PrismError::WriteError => write!(f, "write error"),
        }
    }
}

pub trait PrismNode {
    fn name(&self) -> &str;
    fn read(&self) -> Option<String>;
    fn write(&mut self, data: &str) -> Result<(), PrismError>;
}

pub struct LogNode {
    name: String,
    buf: String,
}

impl LogNode {
    pub fn new(name: &str) -> Self {
        Self { name: name.into(), buf: String::new() }
    }
}

impl PrismNode for LogNode {
    fn name(&self) -> &str { &self.name }
    fn read(&self) -> Option<String> { Some(self.buf.clone()) }
    fn write(&mut self, data: &str) -> Result<(), PrismError> {
        self.buf.push_str(data);
        Ok(())
    }
}
