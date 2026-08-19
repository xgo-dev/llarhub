---
name: write-formula
description: Use when creating, migrating, reviewing, debugging, or validating LLAR Formula modules in llarhub or another Formula store, including versions.json, _llar.gox recipes, _cmp.gox comparators, dependency discovery, build matrices, gsh commands, CMake and Autotools builds, metadata, and consumer tests.
argument-hint: "[owner/repo] [version]"
allowed-tools: Read, Grep, Glob, Bash, Write, Edit, WebFetch
---

# Write LLAR Formulas

Treat a Formula as an XGo classfile that composes LLAR's Formula contract with
the gsh execution surface. Write idiomatic XGo/gsh source, not Go code with a
`.gox` suffix. Use the simplest verified XGo/gsh form that preserves the
required semantics.

## Establish The Contract

Before interpreting or editing a Formula:

1. Read [Contract Discovery](references/contract-discovery.md) completely and
   resolve the exact LLAR revision used by the target Formula store.
2. Read [XGo And Gsh Style](references/xgo-gsh-style.md) completely. In
   llarhub, read `.github/scripts/find_changed_modules.gsh` when it exists in
   the target revision and use it as the repository's executable style sample.
3. Read [Formula Semantics](references/formula-semantics.md) completely for the
   source investigation, dependency, build, metadata, and test workflow.

The resolved LLAR source is the Formula API contract. Do not treat this skill,
an old Formula, generated Go names, a wiki page, or the latest standalone XGo
documentation as a substitute for that source.

## Workflow

1. Confirm the target Formula store, the LLAR revision its CI executes, and the
   exact upstream `<owner>/<repo>` tag requested by the user.
2. Inspect that upstream revision's build entrypoint, dependency declarations,
   install rules, package metadata, patches, and consumer tests. Do not infer a
   flag, dependency, output, or compatibility branch.
3. Enumerate the complete upstream tag set visible to LLAR. Inspect
   `versions.json`, all existing Formula thresholds, and the optional
   comparator. Set `fromVer` to the lowest upstream version proved compatible
   with the Formula; do not default it to the requested or newest version.
4. Resolve the active `_llar.gox` class registration, promoted base APIs,
   callback signatures, automatic imports, build helpers, and gsh/XGo versions
   from the selected LLAR revision.
5. Implement the smallest Formula that preserves the verified installed
   consumer interface. Prefer the LLAR build-system helper matching upstream;
   use inherited gsh commands for verified steps the helper does not own.
6. Perform an XGo style pass. Replace redundant setup, error checks, package
   qualifiers, and temporary collections with the simpler verified XGo/gsh
   form from the style reference.
7. Compile through LLAR's actual ixgo path, then run the target repository's
   Formula validation for exact and representative versions, options, and
   cache-hit tests required by the change.

## Expression Order

Choose the narrowest owner for each operation:

- Use LLAR's CMake or Autotools helper for behavior it already owns.
- Use the inherited gsh surface for external commands, command environment,
  captured output, and command status.
- Use XGo collection, string, lambda, property, command-call, and error-wrap
  forms for Formula logic when the active ixgo accepts them.
- Use Go standard-library packages through their XGo surface for structured
  parsing, filesystem access, and data formats.

Do not call `os/exec` from a Formula when gsh can run the command through
LLAR's configured streams, working directory, and execution path.

## Hard Rules

- Preserve source tag spelling and keep module ids consistent across the
  directory, metadata, Formula, and dependencies.
- Declare only direct dependencies proved by the selected upstream source and
  configuration.
- Keep imports, types, fields, and classfile methods before the first top-level
  executable Formula statement.
- In llarhub, start the Formula filename stem with a lowercase ASCII letter,
  for example `picobench_llar.gox`. Do not capitalize it from a repository or
  type name even when LLAR accepts that spelling.
- Use only callback signatures and APIs found in the resolved LLAR revision.
- Never call generated `XGot_`, `Gopt_`, `Gops_`, `Gopx_`, `Gopo_`, or numbered
  overload names from Formula source.
- Fail every required command or required error-returning operation. Branch on
  an error only when its distinct outcomes have verified meaning.
- Put `!` on a required error-returning outer call, including a gsh command
  inside `capout`. Keep parentheses when the result is consumed. Do not add `!`
  to a void helper that fails internally, or use `lastErr!` when direct `!` has
  the required semantics; read `lastErr` only for verified control flow.
- Use unqualified XGo format builtins such as `fprintf!`, `fprintln!`,
  `sprintf`, and `errorf`; do not import or prefix `fmt` only to call their Go
  equivalents.
  Prefer `${expr}` only when the expression has a verified XGo string
  conversion. Use a format builtin for bool, `[]byte`, formatting directives,
  or any value the active ixgo cannot interpolate.
- Keep commands inside Formula lifecycle hooks; top-level Formula statements
  register configuration and callbacks.
- Derive metadata from the installed consumer interface and verify it with a
  real consumer.
- For C/C++ library metadata exposed through pkg-config, install a verified,
  relocatable `.pc` file and set metadata from the complete pkg-config
  cflags-and-libs lookup. Do not substitute a handwritten `-I`, `-L`, or `-l`
  fragment, or a libs-only query, for the complete result.
- Keep consumer tests independent of the build scratch tree so they can run on
  a cache hit.
- Do not add compatibility paths, fallback behavior, flags, generators,
  options, abstractions, or helpers without evidence that the current Formula
  needs them.
- Do not extract a helper merely to enable `?`, `!`, a comprehension, or
  command-call syntax. Keep one-off control flow local.
- Add a comparator only after checking every upstream version LLAR may select.
  Every tag must belong to the comparator's accepted domain and the comparator
  must order the complete set correctly; checking only Formula thresholds or a
  few sample versions is insufficient.

## Validation

Discover the supported command line from the LLAR revision or the Formula
store workflow before running it. Validate through that exact LLAR build, not a
different globally installed binary.

At minimum, prove:

- Formula parsing and selection for every changed threshold;
- the lowest compatible `fromVer` and rejection or incompatibility immediately
  below it;
- comparator validity and ordering across the complete upstream version set
  when a comparator exists;
- dependency discovery and fallback behavior for representative exact tags;
- default and every retained output-changing matrix selection;
- required command failure propagation;
- installed headers, libraries, tools, or package metadata, including the
  installed `.pc` file and complete pkg-config lookup result when applicable;
- consumer behavior after a fresh build and, when supported, a cache hit.

Do not accept successful parsing or compilation as proof that the installed
package is usable.
