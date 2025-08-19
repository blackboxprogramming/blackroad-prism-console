

#[test]
fn basic_resolution() {
    let r = symbol_gateway::resolve_one("sym.arrow.r").unwrap();
    assert_eq!(r.ch, '→');
}
#[test]
fn halo_emoji() {
    let r = symbol_gateway::resolve_one("emoji.face.halo").unwrap();
    assert_eq!(r.ch, '😇');
}

