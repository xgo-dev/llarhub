# LLAR Contract Discovery

Resolve the active contract before writing Formula source. Keep the result as
task-local evidence; do not copy a version-specific API snapshot back into the
skill.

## 1. Resolve The LLAR Revision

Use an explicit user-selected revision when provided. Otherwise inspect the
target Formula store's CI workflow and find the repository and revision used to
build or install LLAR. In llarhub, inspect every workflow step that checks out
LLAR or installs the `llar` command; do not assume the current sibling checkout
or a globally installed binary matches CI.

Use a temporary checkout or an existing checkout only after verifying its
commit matches the selected revision. Do not change the user's active LLAR
worktree to inspect another revision.

If the workflow follows a moving branch, record the exact commit inspected for
the current task. This makes the Formula reviewable without pretending the
branch is immutable.

## 2. Locate The Formula Class

Search by symbols and registered extension instead of relying only on paths:

```sh
rg -n 'RegisterProject|_llar\.gox|ModuleF' .
rg -n 'type ModuleF|func \([^)]*\*ModuleF\)' . -g '*.go'
rg -n 'type Context|func \([^)]*\*Context\)' . -g '*.go'
rg -n 'type Project|func \([^)]*\*Project\)' . -g '*.go'
```

Read the complete declarations found by these searches. Establish:

- the `_llar.gox` project base class and automatic imports;
- the generated entry contract;
- each top-level Formula method and callback signature;
- promoted fields and methods available inside callbacks;
- the ownership and error behavior of source, build, and test context values.

Also locate the Formula and comparator selection code. Confirm suffix matching,
`fromVer` extraction and ordering, duplicate-threshold behavior, comparator
discovery, and cache keys instead of inferring them from the directory layout.

Do not infer an XGo surface from a generated Go name. Resolve lowercase aliases,
auto-properties, overloads, and template receiver methods using the selected
toolchain.

## 3. Establish The Complete Version Set

Enumerate every upstream tag LLAR can select, including peeled values for
annotated tags. Include existing Formula thresholds and every version recorded
by the Formula store or source package recipe.

Use the active default comparator to order the set before proposing a custom
one. To establish `fromVer`, investigate from the oldest candidate upward and
identify the first version for which the same dependency, build, install,
metadata, and test contract works. Verify every older candidate is incompatible
or intentionally unsupported. The requested version is a validation target,
not an automatic threshold.

Before creating `_cmp.gox`, validate the proposed comparator against the full
tag set. Confirm:

- every tag is valid input for the comparator;
- distinct ordered releases do not collapse to equality;
- ordering is antisymmetric and transitive;
- all existing and proposed Formula thresholds select in the intended order.

For a semantic-version comparator, require every tag in the set to be valid
semantic-version syntax. One invalid tag is enough to reject that comparator;
do not let invalid values silently compare as equal.

## 4. Inspect Build Helpers And Runtime Flow

Locate the active helper implementations and their tests:

```sh
rg -n 'type CMake|func \([^)]*\*CMake\)|func New' . -g '*.go'
rg -n 'type AutoTools|func \([^)]*\*AutoTools\)|func New' . -g '*.go'
rg -n 'OnBuild|OnTest|OnRequire|fOnBuild|fOnTest|fOnRequire' . -g '*.go'
```

Read the call sites that invoke each Formula callback. Confirm working
directory, environment, streams, panic recovery, cache behavior, and whether a
helper returns an error or fails internally. A method's spelling alone does not
establish these semantics.

## 5. Resolve The XGo And Gsh Toolchain

Read the selected LLAR revision's `go.mod`. Record the exact versions of:

- `github.com/goplus/ixgo`;
- `github.com/goplus/xgo`;
- `github.com/goplus/gogen`;
- `github.com/goplus/mod`;
- the module providing `gsh.App`.

Treat a Formula store's standalone XGo or gsh script toolchain separately. For
example, llarhub may run a CI helper with `ixgo@latest` while compiling Formulas
through the ixgo version pinned by LLAR. Acceptance by the first does not prove
acceptance by the second.

Read the matching module-cache source and documentation when a syntax or
classfile rule matters. The Formula is compiled through LLAR's ixgo embedding
path, so successful standalone `xgo` compilation is not sufficient evidence.

When using a nontrivial XGo form not already exercised by the target repository,
compile a minimal task-local probe through the same ixgo/LLAR path before using
it in the Formula.

## 6. Prefer Executable Evidence

Use this evidence order:

1. A successful Formula compiled and run through the selected LLAR revision.
2. Tests and working classfiles in that exact revision.
3. Base-class and helper source from that revision.
4. Matching-version ixgo, XGo, gogen, mod, and gsh source.
5. Matching-version official documentation.

Use older Formula files and external examples only to find questions to verify.
Never copy their signatures, flags, or failure handling without confirming the
active contract.
