use std::{fs, io::Write, path::Path};

use anyhow::Result;

pub fn atomic_write(path: &Path, data: &[u8]) -> Result<()> {
  if let Some(parent) = path.parent() {
    fs::create_dir_all(parent)?;
  }
  let mut temp = path.to_path_buf();
  temp.set_extension("tmp");
  let mut file = fs::File::create(&temp)?;
  file.write_all(data)?;
  file.sync_all()?;
  fs::rename(temp, path)?;
  Ok(())
}
