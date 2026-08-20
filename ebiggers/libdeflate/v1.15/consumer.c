/*
 * Minimal libdeflate consumer used by the Formula's onTest hook.
 *
 * It mirrors the Conan Center test_package.c: allocate a compressor and free
 * it again, exercising the installed <libdeflate.h> interface and the linked
 * library. Both the static and shared installed outputs must satisfy it.
 */
#include <libdeflate.h>

int main(void) {
	struct libdeflate_compressor *c = libdeflate_alloc_compressor(12);
	if (c == NULL) {
		return 1;
	}
	libdeflate_free_compressor(c);
	return 0;
}
