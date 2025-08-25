use prism_os::vfs::{LogNode, PrismNode};

#[test]
fn log_node_rw() {
    let mut n = LogNode::new("kernel");
    n.write("boot ok\n").unwrap();
    assert_eq!(n.read().unwrap(), "boot ok\n");
}
