#ifndef LUCIDIA_GEODESY_H
#define LUCIDIA_GEODESY_H

#ifdef __cplusplus
extern "C" {
#endif

double lucidgeo_utc_to_tai(double utc);
void lucidgeo_itrs_to_gcrs(double x0, double x1, double x2, double out[3]);

#ifdef __cplusplus
}
#endif

#endif /* LUCIDIA_GEODESY_H */
