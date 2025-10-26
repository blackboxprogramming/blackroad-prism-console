#[allow(dead_code)]
pub fn store_secret(_key: &str, _value: &str) -> Result<(), String> {
    Ok(())
}

#[allow(dead_code)]
pub fn get_secret(_key: &str) -> Result<Option<String>, String> {
    Ok(None)
}

#[allow(dead_code)]
pub fn delete_secret(_key: &str) -> Result<(), String> {
    Ok(())
}
