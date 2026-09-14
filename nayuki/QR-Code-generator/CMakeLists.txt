cmake_minimum_required(VERSION 3.15)
project(QR-Code-Generator)

set(SRC_C "${CMAKE_SOURCE_DIR}/c/qrcodegen.c")
set(LIBRARY_NAME_C qrcodegenc)
set(HEADERS_C "${CMAKE_SOURCE_DIR}/c/qrcodegen.h")

add_library(${LIBRARY_NAME_C} ${SRC_C})
set_target_properties(${LIBRARY_NAME_C} PROPERTIES PUBLIC_HEADER "${HEADERS_C}")
install(TARGETS ${LIBRARY_NAME_C}
    RUNTIME DESTINATION bin
    LIBRARY DESTINATION lib
    ARCHIVE DESTINATION lib
    PUBLIC_HEADER DESTINATION include/qrcodegenc)

if(EXISTS "${CMAKE_SOURCE_DIR}/cpp/qrcodegen.cpp")
    set(SRC "${CMAKE_SOURCE_DIR}/cpp/qrcodegen.cpp")
    set(HEADERS "${CMAKE_SOURCE_DIR}/cpp/qrcodegen.hpp")
    set(LIBRARY_NAME qrcodegencpp)
elseif(EXISTS "${CMAKE_SOURCE_DIR}/cpp/BitBuffer.cpp")
    set(SRC
        "${CMAKE_SOURCE_DIR}/cpp/QrCode.cpp"
        "${CMAKE_SOURCE_DIR}/cpp/QrSegment.cpp"
        "${CMAKE_SOURCE_DIR}/cpp/BitBuffer.cpp")
    set(HEADERS
        "${CMAKE_SOURCE_DIR}/cpp/QrCode.hpp"
        "${CMAKE_SOURCE_DIR}/cpp/QrSegment.hpp"
        "${CMAKE_SOURCE_DIR}/cpp/BitBuffer.hpp")
    set(LIBRARY_NAME qrcodegen)
else()
    set(SRC "${CMAKE_SOURCE_DIR}/cpp/QrCode.cpp")
    set(HEADERS "${CMAKE_SOURCE_DIR}/cpp/QrCode.hpp")
    set(LIBRARY_NAME qrcodegen)
endif()

add_library(${LIBRARY_NAME} ${SRC})
set_target_properties(${LIBRARY_NAME} PROPERTIES PUBLIC_HEADER "${HEADERS}")
install(TARGETS ${LIBRARY_NAME}
    RUNTIME DESTINATION bin
    LIBRARY DESTINATION lib
    ARCHIVE DESTINATION lib
    PUBLIC_HEADER DESTINATION include/qrcodegen)
