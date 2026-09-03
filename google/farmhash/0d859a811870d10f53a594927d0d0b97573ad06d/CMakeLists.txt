cmake_minimum_required(VERSION 3.15)
project(farmhash VERSION 1.1.0 LANGUAGES CXX)

include(GNUInstallDirs)

# FarmHash's Autotools install layout uses lib/, which is also the LLAR
# pkg-config search path.
set(CMAKE_INSTALL_LIBDIR "lib" CACHE STRING "" FORCE)

if(NOT FARMHASH_NO_BUILTIN_EXPECT)
    # Transcribed from farmhash/src/Makefile.am
    include(CheckCXXSourceCompiles)
    check_cxx_source_compiles(
        "int main(int argc, char* argv[]) { return (int)__builtin_expect(0, 0); }"
        FARMHASH_HAS_BUILTIN_EXPECT
    )
endif()

add_library(farmhash "${FARMHASH_SRC_DIR}/src/farmhash.cc" )
target_include_directories(farmhash PRIVATE "${FARMHASH_SRC_DIR}/src")

if(NOT FARMHASH_HAS_BUILTIN_EXPECT)
    target_compile_definitions(farmhash PUBLIC FARMHASH_NO_BUILTIN_EXPECT)
endif()

set_target_properties(farmhash
    PROPERTIES
        PUBLIC_HEADER "${FARMHASH_SRC_DIR}/src/farmhash.h"
        WINDOWS_EXPORT_ALL_SYMBOLS ON
)

install(TARGETS farmhash
    RUNTIME DESTINATION ${CMAKE_INSTALL_BINDIR}
    LIBRARY DESTINATION ${CMAKE_INSTALL_LIBDIR}
    ARCHIVE DESTINATION ${CMAKE_INSTALL_LIBDIR}
    PUBLIC_HEADER DESTINATION ${CMAKE_INSTALL_INCLUDEDIR}
)

set(FARMHASH_PC "${CMAKE_CURRENT_BINARY_DIR}/farmhash.pc")
file(WRITE "${FARMHASH_PC}"
"prefix=\${pcfiledir}/../..\n"
"exec_prefix=\${prefix}\n"
"libdir=\${prefix}/${CMAKE_INSTALL_LIBDIR}\n"
"includedir=\${prefix}/${CMAKE_INSTALL_INCLUDEDIR}\n"
"\n"
"Name: farmhash\n"
"Description: FarmHash non-cryptographic hash functions\n"
"Version: ${PROJECT_VERSION}\n"
"Libs: -L\${libdir} -lfarmhash\n"
"Cflags: -I\${includedir}\n"
)
install(FILES "${FARMHASH_PC}" DESTINATION "${CMAKE_INSTALL_LIBDIR}/pkgconfig")
