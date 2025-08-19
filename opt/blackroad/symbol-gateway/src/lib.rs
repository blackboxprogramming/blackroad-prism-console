

use codex::{Binding, Def, Module, Symbol, EMOJI, ROOT, SYM};

#[derive(Debug, Clone)]
pub struct Resolved {
    pub input: String,
    pub module: &'static str,
    pub base: String,
    pub modifiers: Vec<String>,
    pub ch: char,
    pub variant_key: Option<String>,
}

fn codepoint_hex(ch: char) -> String {
    format!("U+{:04X}", ch as u32)
}
fn utf8_bytes_hex(ch: char) -> String {
    let mut buf = [0u8; 4];
    let s = ch.encode_utf8(&mut buf);
    s.as_bytes()
        .iter()
        .map(|b| format!("{:02X}", b))
        .collect::<Vec<_>>()
        .join(" ")
}

pub fn module_for(prefix: &str) -> Option<(&'static str, Module)> {
    match prefix {
        "sym" => Some(("sym", SYM)),
        "emoji" => Some(("emoji", EMOJI)),
        // allow full-tree lookups: root.sym.arrow.r etc.
        "root" => Some(("root", ROOT)),
        _ => None,
    }
}

/// Parse "sym.arrow.r.quad" → (prefix="sym", base="arrow", mods=["r","quad"])
pub fn parse_name(name: &str) -> Option<(&str, &str, Vec<&str>)> {
    let mut parts = name.split('.').collect::<Vec<_>>();
    if parts.is_empty() {
        return None;
    }
    let prefix = parts.remove(0);
    if parts.is_empty() {
        return None;
    }
    let base = parts.remove(0);
    Some((prefix, base, parts))
}

/// Choose the best `Multi` variant: must contain all requested modifiers; among matches,
/// prefer the one with the fewest extra modifiers. Fallback: first variant.
fn pick_variant<'a>(
    requested: &[&str],
    alts: &'a [(&'static str, char)],
) -> (&'a str, char) {
    // normalize into sets
    let mut best: Option<(&str, char, usize)> = None;
    'outer: for (key, ch) in alts {
        let have: Vec<&str> = key.split('.').filter(|s| !s.is_empty()).collect();
        for &need in requested {
            if !have.iter().any(|h| h == &need) {
                continue 'outer;
            }
        }
        let extras = have.len().saturating_sub(requested.len());
        if best.map_or(true, |(_, _, b)| extras < b) {
            best = Some((key, *ch, extras));
        }
    }
    if let Some((k, c, _)) = best {
        (k, c)
    } else {
        // default documented by crate: Multi "defaults to its first variant"  [oai_citation:3‡Docs.rs](https://docs.rs/codex/latest/codex/enum.Symbol.html)
        alts.first().map(|(k, c)| (*k, *c)).unwrap_or(("", '\u{FFFD}'))
    }
}

pub fn resolve_one(name: &str) -> Option<Resolved> {
    let (prefix, base, mods) = parse_name(name)?;
    let (module_name, module) = module_for(prefix)?;
    let binding: Binding = module.get(base)?;
    match binding.def {
        Def::Symbol(Symbol::Single(c)) => Some(Resolved {
            input: name.to_string(),
            module: module_name,
            base: base.to_string(),
            modifiers: mods.iter().map(|s| s.to_string()).collect(),
            ch: c,
            variant_key: None,
        }),
        Def::Symbol(Symbol::Multi(alts)) => {
            let (k, c) = pick_variant(&mods, alts);
            Some(Resolved {
                input: name.to_string(),
                module: module_name,
                base: base.to_string(),
                modifiers: mods.iter().map(|s| s.to_string()).collect(),
                ch: c,
                variant_key: if k.is_empty() { None } else { Some(k.to_string()) },
            })
        }
        Def::Module(_) => None,
    }
}

#[derive(serde::Serialize)]
pub struct JsonResolved {
    pub name: String,
    pub char: String,
    pub codepoint: String,
    pub utf8: String,
    pub module: String,
    pub base: String,
    pub modifiers: Vec<String>,
    pub variant: Option<String>,
    pub source: &'static str,
}
impl From<Resolved> for JsonResolved {
    fn from(r: Resolved) -> Self {
        JsonResolved {
            name: r.input.clone(),
            char: r.ch.to_string(),
            codepoint: codepoint_hex(r.ch),
            utf8: utf8_bytes_hex(r.ch),
            module: r.module.to_string(),
            base: r.base,
            modifiers: r.modifiers,
            variant: r.variant_key,
            source: "codex 0.1.1",
        }
    }
}

/// Search within a module by substring (case-insensitive) over keys.
pub fn search(module: Module, q: &str) -> Vec<(String, char)> {
    let q = q.to_lowercase();
    module
        .iter()
        .filter_map(|(k, b)| match b.def {
            Def::Symbol(Symbol::Single(c)) if k.to_lowercase().contains(&q) => {
                Some((k.to_string(), c))
            }
            Def::Symbol(Symbol::Multi(alts)) if k.to_lowercase().contains(&q) => {
                Some((k.to_string(), alts[0].1))
            }
            _ => None,
        })
        .collect()
}
