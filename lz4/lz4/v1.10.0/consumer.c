#include <lz4.h>
#include <lz4frame.h>
#include <lz4hc.h>

#include <stdio.h>
#include <string.h>

int main(void) {
	const char src[] = "llar lz4 consumer covers block, HC, and frame APIs";
	const int srcSize = (int)sizeof(src);
	char compressed[256];
	char regenerated[256];

	if (LZ4_versionNumber() != LZ4_VERSION_NUMBER) {
		return 1;
	}
	if (LZ4_versionString() == 0 || LZ4_versionString()[0] == '\0') {
		return 2;
	}

	const int bound = LZ4_compressBound(srcSize);
	if (bound <= 0 || bound > (int)sizeof(compressed)) {
		return 3;
	}

	const int compressedSize = LZ4_compress_default(src, compressed, srcSize, bound);
	if (compressedSize <= 0) {
		return 4;
	}

	const int decodedSize = LZ4_decompress_safe(compressed, regenerated, compressedSize, srcSize);
	if (decodedSize != srcSize || memcmp(src, regenerated, (size_t)srcSize) != 0) {
		return 5;
	}

	const int hcSize = LZ4_compress_HC(src, compressed, srcSize, bound, LZ4HC_CLEVEL_DEFAULT);
	if (hcSize <= 0) {
		return 6;
	}

	memset(regenerated, 0, sizeof(regenerated));
	const int hcDecoded = LZ4_decompress_safe(compressed, regenerated, hcSize, srcSize);
	if (hcDecoded != srcSize || memcmp(src, regenerated, (size_t)srcSize) != 0) {
		return 7;
	}

	if (LZ4F_getVersion() != LZ4F_VERSION) {
		return 8;
	}

	const size_t frameBound = LZ4F_compressFrameBound((size_t)srcSize, 0);
	if (LZ4F_isError(frameBound) || frameBound > sizeof(compressed)) {
		return 9;
	}

	const size_t frameSize = LZ4F_compressFrame(compressed, sizeof(compressed), src, (size_t)srcSize, 0);
	if (LZ4F_isError(frameSize)) {
		return 10;
	}

	LZ4F_dctx *dctx = 0;
	if (LZ4F_isError(LZ4F_createDecompressionContext(&dctx, LZ4F_VERSION)) || dctx == 0) {
		return 11;
	}

	size_t dstSize = sizeof(regenerated);
	size_t srcSizeConsumed = frameSize;
	memset(regenerated, 0, sizeof(regenerated));
	const size_t hint = LZ4F_decompress(dctx, regenerated, &dstSize, compressed, &srcSizeConsumed, 0);
	LZ4F_freeDecompressionContext(dctx);
	if (LZ4F_isError(hint) || dstSize != (size_t)srcSize || memcmp(src, regenerated, (size_t)srcSize) != 0) {
		return 12;
	}

	printf("lz4 %s block=%d hc=%d frame=%zu\n", LZ4_versionString(), compressedSize, hcSize, frameSize);
	return 0;
}
