#include <iconv.h>
#include <libcharset.h>

#include <locale.h>
#include <stdint.h>
#include <stdlib.h>

int main(void) {
    char input[] = "ciao";
    char *input_buffer = input;
    size_t input_left = sizeof(input) - 1;
    uint32_t output[4] = {0, 0, 0, 0};
    char *output_buffer = (char *)output;
    size_t output_left = sizeof(output);

    iconv_t converter = iconv_open("UCS-4-INTERNAL", "US-ASCII");
    if (converter == (iconv_t)-1)
        return 1;
    if (iconv(converter, &input_buffer, &input_left, &output_buffer, &output_left) == (size_t)-1) {
        iconv_close(converter);
        return 2;
    }
    iconv_close(converter);

    if (output[0] != 'c' || output[1] != 'i' || output[2] != 'a' || output[3] != 'o')
        return 3;

    setlocale(LC_ALL, "");
    return locale_charset() == NULL ? 4 : EXIT_SUCCESS;
}
