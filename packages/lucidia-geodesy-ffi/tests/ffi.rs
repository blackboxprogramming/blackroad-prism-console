use lucidgeo_ffi::{lucidgeo_itrs_to_gcrs, lucidgeo_utc_to_tai};

#[test]
fn test_ffi_time() {
    assert_eq!(lucidgeo_utc_to_tai(0.0), 37.0);
    let mut out = [0.0f64;3];
    lucidgeo_itrs_to_gcrs(1.0,2.0,3.0,&mut out);
    assert_eq!(out, [1.0,2.0,3.0]);
}
