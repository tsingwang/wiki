#include <stdio.h>

void show_bytes(char *s, size_t len) {
    printf("    Address↓\tValue\n");
    for (int i = len - 1; i >= 0; i--)
        printf("%p\t0x%.2x\n", s+i, s[i]);
}

int main() {
    unsigned int i = 1;
    char *c = (char *)&i;
    if (*c) printf("Little Endian\n");
    else printf("Big Endian\n");

    i = 0x01234567;
    printf("\nExample: 0x%08x\n", i);
    show_bytes((char *)&i, sizeof(i));
    return 0;
}
