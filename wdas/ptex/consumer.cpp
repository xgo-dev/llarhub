#include <Ptexture.h>

int main() {
    PtexPtr<PtexCache> cache(PtexCache::create(0, 1024 * 1024));
    return cache ? 0 : 1;
}
