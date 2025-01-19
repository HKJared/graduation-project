#include <stdio.h>

int main() {
    int i;

    // In các số từ 1 đến 200
    for (i = 1; i <= 200; i++) {
        printf("%d ", i); // In số hiện tại

        // Nếu số hiện tại là bội số của 10, in dấu xuống dòng
        if (i % 10 == 0) {
            printf("\n");
        }
    }

    return 0;
}