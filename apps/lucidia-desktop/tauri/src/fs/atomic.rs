use std::fs::{self, File};
use std::io::{self, Write};
use std::path::Path;

use tempfile::NamedTempFile;

pub fn atomic_write(path: &Path, contents: &[u8]) -> io::Result<()> {
    let parent = path.parent().ok_or_else(|| io::Error::new(io::ErrorKind::Other, "missing parent"))?;
    fs::create_dir_all(parent)?;
    let mut temp = NamedTempFile::new_in(parent)?;
    temp.write_all(contents)?;
    temp.flush()?;
    temp.as_file_mut().sync_all()?;
    temp.persist(path).map(|_| ()).map_err(|e| e.error)
}

#[cfg(test)]
mod tests {
    use super::atomic_write;
    use std::fs;
    use tempfile::tempdir;

    #[test]
    fn writes_file_atomically() {
        let dir = tempdir().unwrap();
        let path = dir.path().join("file.txt");
        atomic_write(&path, b"hello").unwrap();
        let content = fs::read_to_string(path).unwrap();
        assert_eq!(content, "hello");
    }
}
