//! Simple least squares solver using normal equations.

/// Solve \(Ax = b\) in a least squares sense using normal equations.
/// `a` is row-major with dimensions m x n.
/// Returns vector x of length n.
pub fn lsq_fit_sparse(a: &[f64], b: &[f64], m: usize, n: usize) -> Vec<f64> {
    let mut ata = vec![0.0f64; n * n];
    let mut atb = vec![0.0f64; n];
    for i in 0..n {
        for j in 0..n {
            let mut sum = 0.0;
            for k in 0..m {
                sum += a[k * n + i] * a[k * n + j];
            }
            ata[i * n + j] = sum;
        }
        let mut s = 0.0;
        for k in 0..m {
            s += a[k * n + i] * b[k];
        }
        atb[i] = s;
    }
    gaussian_solve(&ata, &atb, n)
}

fn gaussian_solve(mat: &[f64], vec: &[f64], n: usize) -> Vec<f64> {
    let mut a = vec![vec![0.0f64; n + 1]; n];
    for i in 0..n {
        for j in 0..n {
            a[i][j] = mat[i * n + j];
        }
        a[i][n] = vec[i];
    }
    for i in 0..n {
        let pivot = a[i][i];
        for j in i..=n {
            a[i][j] /= pivot;
        }
        for k in 0..n {
            if k != i {
                let factor = a[k][i];
                for j in i..=n {
                    a[k][j] -= factor * a[i][j];
                }
            }
        }
    }
    a.into_iter().map(|row| row[n]).collect()
}

/// Placeholder for iterative outlier elimination.
/// Currently returns the indices of points kept (all of them).
pub fn outliers_eliminate(_residuals: &[f64]) -> Vec<usize> {
    (0.._residuals.len()).collect()
}
