---
name: write-formula
description: Create, migrate, review, debug, and validate LLAR formulas and module entries, including versions.json, _llar.gox build classfiles, _cmp.gox comparators, dependency discovery, build matrices, CMake and Autotools recipes, gsh commands, metadata, and onTest consumer checks. Use when adding a library to an LLAR formula store, changing an existing formula, porting legacy Formula hooks, or fixing formula selection, parsing, dependency, build, matrix, cache, command, metadata, or test failures.
---

# Write LLAR Formulas

## Required Reading

Read both references completely before creating or editing a Formula:

1. [XGo Classfile](references/xgo-classfile/SKILL.md) for XGo syntax,
   classfile generation, promoted base APIs, auto-properties, overloads, and
   generated-name conventions.
2. [LLAR Formula](references/llar-formula.md) for the current Formula contract,
   lifecycle, APIs, build helpers, commands, metadata, and validation rules.

Treat the LLAR Formula reference as the default contract. If the task targets a
different LLAR revision, inspect that revision's `formula/`, `x/cmake/`,
`x/autotools/`, `internal/modules/`, `internal/build/`, and
`internal/ixgo/classfile.go` before using a changed API. Never infer an API from
an old Formula or wiki example.

## Workflow

1. Confirm the upstream `<owner>/<repo>` module id and exact source tag. Keep
   the tag spelling unchanged, including a leading `v` or other prefix.
2. Inspect that exact source revision. Read its build entrypoint, dependency
   declarations or lock files, install rules, generated package metadata, and
   consumer tests before choosing any flag, dependency, output, or test.
3. Inspect the module's current `versions.json`, every Formula threshold, and
   its optional comparator. Determine which Formula must change or whether a
   new `fromVer` boundary is required.
4. Model direct dependencies for the whole Formula range. Prefer `onRequire`
   to read the requested tag's upstream dependency declarations so dependency
   changes inside the range do not require repeated Formula edits. Use
   `versions.json` only as a conservative, range-compatible fallback; it does
   not need to be the newest dependency version.
5. Model only build choices that affect dependency resolution, commands,
   installed output, metadata, tests, or support. Put environment dimensions
   under `target.require` and package-owned choices under `target.options`.
6. Implement the smallest source-backed recipe. Prefer LLAR's CMake or
   Autotools helper when it matches the source build; use gsh commands for
   unsupported build systems or extra verified steps.
7. Set metadata from the installed consumer interface. Add `onTest` when a
   small consumer can compile, link, load, or run solely from the source tree,
   installed output, and declared dependencies.
8. Run `llar test` at the affected `fromVer` boundary and representative exact
   versions across the served range, especially versions whose upstream
   dependencies differ. Test defaults and every affected matrix selection.
   Exercise both a fresh build and a cache hit when `onTest` exists.

## Hard Rules

- Keep `versions.json.path`, Formula `id`, dependency module ids, and source tag
  spelling consistent.
- Keep the filename stem before the first underscore a valid Go identifier
  without another underscore. LLAR uses that stem to find the generated class.
- Put imports and helper declarations before the first top-level Formula call.
- Declare direct dependencies only. Do not copy dependency names or versions
  from another package.
- Prefer source-synchronized `onRequire` over hardcoded dependency versions.
  Do not add a new Formula merely because an upstream dependency version
  changed when the existing Formula can read that change from the requested
  tag.
- Keep `versions.json` fallback dependencies conservative: choose versions
  verified to work throughout the Formula's served range, not automatically
  the newest available versions. The current loader indexes fallbacks by exact
  requested source version, so record the fallback under every exact version
  that may need it.
- Use `onBuild ctx => { ... }` and `onTest ctx => { ... }`.
- Use `target.require` for propagated environment requirements and
  `target.options` for package-owned choices. Keep options independent.
- Use `filter` only to reject a selection proved unsupported by the selected
  source revision.
- Treat `defaults` as option defaults, not as a list of legal values.
- Call current CMake and Autotools `configure`, `build`, and `install` methods
  directly. They return no value and panic on failure.
- Check or error-wrap every required gsh command. A direct command or `exec`
  call records failure in `lastErr`; an unchecked non-zero status does not fail
  the hook.
- Use `ctx.Errs.add(err)` only with a non-nil error and only when independent
  failures should be accumulated. Use `!` or `panic err` for fail-fast
  operations.
- Make `onTest` independent of the `onBuild` scratch tree because `onBuild` is
  skipped on cache hits.
- Derive metadata from installed headers, libraries, tools, or package metadata.
  Do not guess linker flags or blindly concatenate every dependency result.
- Add `_cmp.gox` only when actual tag ordering cannot use the default GNU
  comparison.
- Do not add compatibility flags, fallbacks, generators, optional features, or
  defensive branches unless the selected source proves they are required.

Do not use legacy or generated surfaces in Formula source:

- `onBuild (ctx, proj, out)` or `onTest (ctx, proj, out)`;
- `BuildResult.AddErr`, `TestResult`, or a separate hook result parameter;
- `ctx.currentMatrix()` or a top-level `matrix` declaration;
- assignments such as `err := c.configure()` for current CMake or Autotools;
- generated `XGot_`, `Gopt_`, `Gops_`, `Gopx_`, `Gopo_`, `__0`, or `__1`
  names.

## Validation

From a Formula-store root, validate a local module with its exact source tag:

```sh
llar test -v ./owner/repo@exact-source-tag
```

With any explicit matrix flag, supply every required environment dimension:

```sh
llar test -v ./owner/repo@exact-source-tag \
  --os "$(go env GOOS)" --arch "$(go env GOARCH)" \
  --option feature=value
```

Repeat the command for representative versions across the affected Formula
range. Confirm Formula selection, source-synchronized direct dependencies,
fallback behavior, installed files, consumer metadata, defaults, supported
options, `filter` rejection, command failure propagation, and cache-hit
`onTest` behavior. Do not accept parsing or build success alone as proof that
the installed package is usable.
