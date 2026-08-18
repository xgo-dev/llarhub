cmake_minimum_required(VERSION 3.12)
project(whereami C)

if (WIN32 AND BUILD_SHARED_LIBS)
  set(CMAKE_WINDOWS_EXPORT_ALL_SYMBOLS ON)
endif()

add_library(${CMAKE_PROJECT_NAME} src/whereami.c src/whereami.h)
target_include_directories(${CMAKE_PROJECT_NAME} PUBLIC ${CMAKE_CURRENT_SOURCE_DIR}/src)
set_property(TARGET ${CMAKE_PROJECT_NAME} PROPERTY C_STANDARD 99)

include(GNUInstallDirs)
install(TARGETS ${CMAKE_PROJECT_NAME})
install(FILES src/whereami.h DESTINATION include)
