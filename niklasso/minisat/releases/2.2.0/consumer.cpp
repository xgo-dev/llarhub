// Example adapted from the Conan Center test package.
#include <minisat/core/Solver.h>

using namespace Minisat;

int main() {
    Solver solver;
    Var a = solver.newVar();
    Var b = solver.newVar();
    Var c = solver.newVar();

    solver.addClause(mkLit(a), mkLit(b), mkLit(c));
    solver.addClause(~mkLit(a), mkLit(b), mkLit(c));
    solver.addClause(mkLit(a), ~mkLit(b), mkLit(c));
    solver.addClause(mkLit(a), mkLit(b), ~mkLit(c));

    return solver.solve() ? 0 : 1;
}
