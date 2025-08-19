use lucidgeo::time::{utc_to_tai, itrs_to_gcrs};
use lucidgeo::ls::{lsq_fit_sparse, outliers_eliminate};
use lucidgeo::spline::spline_fit;
use lucidgeo::sh::sh_synthesize;

#[test]
fn test_time() {
    assert_eq!(utc_to_tai(0.0), 37.0);
    assert_eq!(itrs_to_gcrs([1.0,2.0,3.0]), [1.0,2.0,3.0]);
}

#[test]
fn test_lsq() {
    // Solve x in Ax=b where A=[[1,1],[1,2]] and b=[3,5]
    let a = vec![1.0,1.0,1.0,2.0];
    let b = vec![3.0,5.0];
    let x = lsq_fit_sparse(&a, &b, 2, 2);
    assert!((x[0]-1.0).abs() < 1e-12);
    assert!((x[1]-2.0).abs() < 1e-12);

    let res = vec![0.1, -0.2, 0.05];
    let kept = outliers_eliminate(&res);
    assert_eq!(kept, vec![0,1,2]);
}

#[test]
fn test_spline_and_sh() {
    let x = [0.0, 1.0, 2.0];
    let y = [1.0, 3.0, 5.0];
    let coeff = spline_fit(&x, &y);
    assert!((coeff[0]-2.0).abs() < 1e-12);
    assert!((coeff[1]-1.0).abs() < 1e-12);
    assert_eq!(sh_synthesize(2, &[], 0.0, 0.0), 0.0);
}
