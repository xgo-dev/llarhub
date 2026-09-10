#include <curses.h>
#include <term.h>
#include <termcap.h>

#include <stdio.h>
#include <string.h>

int main(void) {
    if (strstr(curses_version(), NCURSES_VERSION) == NULL)
        return 1;
    FILE *input = tmpfile();
    FILE *output = tmpfile();
    if (input == NULL || output == NULL)
        return 2;
    SCREEN *screen = newterm("xterm", output, input);
    if (screen == NULL)
        return 3;
    if (tigetnum("cols") <= 0 || tgetnum("co") <= 0)
        return 4;
    WINDOW *window = newwin(2, 12, 0, 0);
    if (window == NULL || waddwstr(window, L"llar") == ERR)
        return 5;
    if ((mvwinch(window, 0, 0) & A_CHARTEXT) != 'l')
        return 6;
    delwin(window);
    endwin();
    delscreen(screen);
    fclose(input);
    fclose(output);
    puts("ncurses window and terminal database consumer passed");
    return 0;
}
