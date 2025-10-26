use once_cell::sync::Lazy;
use std::collections::HashMap;
use std::sync::Mutex;

static MEMORY_KEYCHAIN: Lazy<Mutex<HashMap<String, String>>> = Lazy::new(|| Mutex::new(HashMap::new()));

pub fn set_secret(key: &str, value: &str) -> anyhow::Result<()> {
  let mut guard = MEMORY_KEYCHAIN.lock().expect("keychain poisoned");
  guard.insert(key.to_string(), value.to_string());
  Ok(())
}

pub fn get_secret(key: &str) -> anyhow::Result<Option<String>> {
  let guard = MEMORY_KEYCHAIN.lock().expect("keychain poisoned");
  Ok(guard.get(key).cloned())
}

pub fn delete_secret(key: &str) -> anyhow::Result<()> {
  let mut guard = MEMORY_KEYCHAIN.lock().expect("keychain poisoned");
  guard.remove(key);
  Ok(())
}
