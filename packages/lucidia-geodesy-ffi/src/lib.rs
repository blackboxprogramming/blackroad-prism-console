//! C bindings for lucidia-geodesy.

use lucidgeo::time::{utc_to_tai, itrs_to_gcrs};

#[no_mangle]
pub extern "C" fn lucidgeo_utc_to_tai(utc: f64) -> f64 {
    utc_to_tai(utc)
}

#[no_mangle]
pub extern "C" fn lucidgeo_itrs_to_gcrs(x0: f64, x1: f64, x2: f64, out: &mut [f64;3]) {
    let res = itrs_to_gcrs([x0, x1, x2]);
    *out = res;
}
