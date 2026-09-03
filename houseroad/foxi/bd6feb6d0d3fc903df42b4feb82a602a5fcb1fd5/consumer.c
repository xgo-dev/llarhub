#include <foxi/onnxifi_loader.h>

#include <stdio.h>

int main(int argc, char** argv) {
    struct onnxifi_library onnx;
    const char* path = argc > 1 ? argv[1] : NULL;
    int ret = onnxifi_load(ONNXIFI_LOADER_FLAG_VERSION_1_0, path, &onnx);
    if (!ret) {
        fprintf(stderr, "Cannot load onnxifi lib\n");
        return 1;
    }
    onnxifi_unload(&onnx);
    return 0;
}
