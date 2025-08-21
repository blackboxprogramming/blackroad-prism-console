project('linmath', 'c', version: '0.1.0')
inc = include_directories('include')
linmath_dep = declare_dependency(include_directories: inc)
test('linmath_test', executable('linmath_test', 'tests/linmath_test.c', include_directories: inc))
