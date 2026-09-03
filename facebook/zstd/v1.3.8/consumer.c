#include <string.h>
#define ZSTD_STATIC_LINKING_ONLY
#include <zstd.h>

int main(void) {
    const char input[] = "llar-zstd";
    char compressed[128];
    char output[128];

    ZSTD_CCtx *context = ZSTD_createCCtx();
    if (context == NULL)
        return 1;
    size_t workers = ZSTD_CCtx_setParameter(context, ZSTD_c_nbWorkers, 1);
    ZSTD_freeCCtx(context);
    if (ZSTD_isError(workers))
        return 2;

    size_t compressed_size = ZSTD_compress(
        compressed, sizeof(compressed), input, sizeof(input), 1);
    if (ZSTD_isError(compressed_size))
        return 3;

    size_t output_size = ZSTD_decompress(
        output, sizeof(output), compressed, compressed_size);
    if (ZSTD_isError(output_size))
        return 4;

    return output_size == sizeof(input) &&
           memcmp(input, output, sizeof(input)) == 0 ? 0 : 5;
}
