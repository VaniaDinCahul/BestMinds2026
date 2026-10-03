cmake_minimum_required(VERSION 3.10)

# Add "C" at the end to tell CMake this is a C project
project(MyOverlay C)

# Create the executable from your .c file
add_executable(MyOverlay main.c)

add_subdirectory(llama.cpp)
target_link_libraries(MyOverlay PRIVATE llama pthread)