// Adapted from Conan Center's test_package for minisat 2.2.0.
#include <minisat/core/Solver.h>

using namespace Minisat;

int main() {
    Solver solver;
    Var A = solver.newVar();
    Var B = solver.newVar();
    Var C = solver.newVar();
    solver.addClause(mkLit(A), mkLit(B), mkLit(C));
    solver.addClause(~mkLit(A), mkLit(B), mkLit(C));
    solver.addClause(mkLit(A), ~mkLit(B), mkLit(C));
    solver.addClause(mkLit(A), mkLit(B), ~mkLit(C));
    return solver.solve() ? 0 : 1;
}
