#include <z3.h>

int main() {
    Z3_config config = Z3_mk_config();
    Z3_context context = Z3_mk_context(config);
    Z3_del_config(config);

    Z3_solver solver = Z3_mk_solver(context);
    Z3_solver_inc_ref(context, solver);
    Z3_solver_assert(context, solver, Z3_mk_true(context));
    Z3_lbool result = Z3_solver_check(context, solver);

    Z3_solver_dec_ref(context, solver);
    Z3_del_context(context);
    return result == Z3_L_TRUE ? 0 : 1;
}
