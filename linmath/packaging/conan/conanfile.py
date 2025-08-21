from conan import ConanFile
class Linmath(ConanFile):
    name = "linmath"
    version = "0.1.0"
    license = "WTFPL"
    description = "Header-only linear math for graphics"
    url = "https://github.com/blackboxprogramming/linmath.h"
    exports_sources = "include/*"
    no_copy_source = True
    def package(self):
        self.copy("*.h", dst="include", src="include")
    def package_info(self):
        self.cpp_info.includedirs = ["include"]
