# XGo And Gsh Style For Formulas

## Repository Style Sample

When the target llarhub revision contains
`.github/scripts/find_changed_modules.gsh`, read it completely before writing a
Formula. It is an executable style sample, not a Formula API reference.

Reuse applicable idioms demonstrated there:

- lowercase-first-letter calls such as `filepath.join` and `json.marshal`;
- auto-properties such as `entry.isDir`, `output.trimSpace`, and the string or
  slice property `values.len`;
- XGo loops such as `for value in values`;
- lambdas such as `(_, entry, err) => { ... }`;
- direct list comprehensions for complete collection transformations;
- typed empty collections when the empty value's type or encoded form matters;
- `<-` only for genuine incremental slice append;
- `expr!` for operations that must succeed;
- `$NAME` for environment values exposed by the gsh class;
- `command! args`, `capout => { command! args }`, and `output` for required
  external processes;
- `${expr}` for plain string construction and panic messages;
- unqualified format builtins such as `fprintf!` when a format string is
  clearer than interpolation.

Do not copy its Git diff policy, GitHub output handling, filesystem rules, or
top-level execution shape into a Formula. A `.gsh` project executes its script
entry, while `_llar.gox` top-level statements configure a Formula and register
lifecycle hooks.

If the file is absent from the target revision, do not fetch an unrelated
branch merely to imitate its style. Use the matching toolchain source and the
rules below.

## XGo-First Formula Style

Use the simplest verified XGo form whenever it expresses the same behavior
directly:

- Write callback values as lambdas when the target API supplies an expected
  function type; an untyped standalone lambda has no context for inference.
- Omit parentheses for a side-effect-only statement call.
- Use lowercase aliases for exported Go functions and methods.
- Use auto-properties for zero-argument getters.
- Use `for value in values` when the index is unused.
- Use string and slice methods instead of importing a package only for an
  equivalent operation supported by the active XGo version.
- Use a comprehension when it is a direct filter or transform, not when it
  hides stateful control flow or changes empty-value semantics.
- Use `{value for value in values if condition}` for the first matching value
  and optional `value, ok` result. Use `{for value in values if condition}` for
  an existence check when first-match or any-match semantics are intended. Do
  not hide stateful actions in either form.
- Use command style for the outermost side-effect call. Attach `!` before its
  arguments when it must succeed, for example `format.node! buf, fset, file`.
  Keep parentheses for nested calls and calls whose result is consumed, for
  example `value := parse(input)!`.
- Use unqualified XGo builtins instead of a `fmt.` prefix. Prefer `${expr}` to
  `sprintf` only when the expression has a verified XGo string conversion.
  Bool, `[]byte`, formatting directives, and unsupported conversions require
  `sprintf`, `fprintf`, or separate output arguments.
- When an interpolation expression needs a string literal, use a raw string
  inside the braces, for example `${values.join(`, `)}`.
- Use `.len` for strings and slices. Use `len(mapping)` for maps; `mapping.len`
  is a lookup of the key `"len"`, not the map length.

### String Construction

- Prefer interpolation for short text containing values with a verified XGo
  string conversion, for example `"module=${module}"`.
- Use `+` only when both operands are strings. Convert numeric values explicitly
  with `.string`, for example `"age = " + age.string`.
- Use `values.join(separator)` when combining an existing string slice. When
  assembling many parts, collect the strings and join them instead of folding
  repeated `+` operations through a loop.
- Use `sprintf` or `fprintf` for format directives and values that the active
  ixgo cannot interpolate, such as `bool` or `[]byte`.
- Do not call compiler implementation helpers such as `stringutil.Concat` from
  a Formula; resolve the supported syntax against LLAR's active ixgo toolchain.

### Collections And Control Flow

- Use inferred list literals `[value1, value2]` and map literals
  `{"key": value}` for non-empty collections. Give an empty collection an
  explicit slice or map type, or use `make`, when later assignment or encoding
  depends on its concrete element types.
- Use list and map comprehensions for direct transforms and filters, for
  example `[f(value) for value in values if keep(value)]` and
  `{key(value): value for value in values}`. Keep side effects and multi-step
  logic in a loop.
- Use `for value in values`, `for key, value in mapping`, and a trailing `if`
  on a `for` loop when the body performs filtered side effects. Use
  `for i in start:end:step` for a numeric sequence; retain a C-style loop only
  when its mutable state is the clearest form.
- Use `<-` only for genuine incremental slice append. Use `append` when the
  returned slice is the value being composed or passed onward.
- Compare a map, slice, or pointer with `nil` only when the producing API can
  return nil. A nil map cannot accept entry assignments; initialize it before
  writing entries, and do not add nil checks as generic defensive code.
- Use comma-ok map access when missing data has a verified meaning, for example
  `value, ok := mapping[key]`; do not use it to hide a required configuration
  error.

For example:

```xgo
capout => { git! "merge-base", baseSHA, headSHA }
diffBase := output.trimSpace

changedModules := [module for module, _ in modules]
panic "invalid module ${module}"
fprintf! outputFile, "modules=%s\n", modulesJSON
```

After drafting, review Go-shaped candidates such as unused-index `range` loops,
manual panic-on-error blocks, uppercase imported calls, and parenthesized
side-effect statements. Replace them only after confirming the XGo form through
the active ixgo path.

Broad XGo usage is not a syntax quota. Do not introduce overloads, custom
iterators, operator definitions, wrapper functions, temporary collections, or
type conversions solely to demonstrate language features.

## Error Handling

Match syntax to semantics:

- Use `!` for a required error-returning operation whose only valid result is
  success. Do not attach it to a void LLAR helper that already panics on failure.
- For a required error-returning side-effect call, attach `!` to the outer
  command-style call.
  Inside a capture block, write `capout => { command! args }`. When a result is
  consumed, keep expression syntax such as `value := operation(args)!`.
- Use `?` only in a function that returns an error. When the resolved lifecycle
  callback returns no error, use `!` or inspect the error there. Use `?:` only
  for a source-backed default, not as a defensive fallback for a failed build
  operation.
- Inspect an error explicitly when absence, unsupported input, or another error
  class changes the Formula's behavior.
- Accumulate errors only when the active Formula contract exposes an error list
  and the operations are genuinely independent.
- Read `lastErr` only when command failure is an expected value that selects a
  verified branch. Do not use `lastErr!` after a required command when the
  command-style `!` form is available.

Do not replace meaningful error classification with `!`. Do not expand a
required operation into repetitive `if err != nil { panic err }` code.

## Gsh Execution Surface

`gsh.App` adds command execution and environment hooks to the XGo classfile. It
does not turn command strings into a POSIX shell language.

- Prefer a direct unresolved identifier for a verified executable whose name is
  a valid identifier and does not collide with an imported or promoted symbol.
  Do not wrap such a command in `exec` merely because it has flags or multiple
  arguments.
- Use `exec` only for paths, names containing punctuation, keywords, collisions,
  or explicit environment overlays. Prefer the map overload for a per-command
  overlay, for example
  `exec! {"CC": compiler}, "./configure", "--disable-shared"`.
- Use `capout` only when the Formula consumes stdout. Put `!` on a required
  command inside the capture block before reading `output`; stderr is not part
  of the captured value. Under LLAR's broker, this captures gsh child-command
  stdout; it does not make arbitrary XGo `echo` or `println` output part of
  `output`.
- Use the explicit argument form when arguments must remain separate.
- Treat the one-string `exec` form as whitespace splitting followed by
  environment expansion, without resplitting, unless the selected gsh source
  proves otherwise. Quotes do not group fields under this implementation, and
  prefix overlays do not affect later `$NAME` expansion in the same string.
- Invoke a verified shell explicitly when a build step truly requires pipes,
  redirection, globbing, command substitution, or shell operators.

Keep build commands inside `onBuild` or `onTest`. In `onBuild`, compile C/C++
packages with the active LLAR CMake or Autotools helper so `cmake`,
`configure`, and `make` run through execbroker. Do not call gsh `cc`, `c++`,
`ar`, or `ld` from `onBuild`; that skips later LLAR cross-compile toolchain
injection. `onTest` may use `cc!` or `c++!` to compile the consumer against
installed metadata. Use gsh for non-compile steps and for build systems that
are not CMake or Make.

During the final style pass, review every `exec "literal-name", ...` call. When
the literal is a valid, unshadowed identifier, rewrite it as a direct gsh
command and compile through the active ixgo path.

## Go Interoperation

Using a Go package does not make Formula source Go-first. XGo is designed to
call Go libraries. Use structured Go APIs through XGo spelling for JSON, YAML,
filesystem traversal, archive formats, and source manifest parsing instead of
reimplementing parsers with shell text processing. XGo exposes common `fmt`
operations as builtins; use `fprintf!`, `fprintln!`, `sprintf`, `errorf`, and
related forms without importing or qualifying `fmt`.

Imports remain explicit unless the resolved LLAR `gox.mod` registers an
auto-import. In the pinned Formula contract, `cmake` and `autotools` are
registered helpers; ordinary packages such as `os`, `strings`, `slices`, and
`encoding/json` still require an import. Resolve this list against the active
LLAR revision instead of assuming a helper is globally available.

Do not import `"runtime"` to read `GOOS` or `GOARCH` from a Formula. Those
are host-process values. Use `target.require["os"]` and `target.require["arch"]`.
When the resolved LLAR revision exposes `target.version`, that is the selected
version or ref for this build.

Use lowercase XGo aliases and auto-properties only for verified exported Go
functions and zero-argument getters, such as `filepath.join`, `ctx.outputDir`,
and `entry.isDir`. Keep parentheses for nested calls and calls whose result is
consumed; omit them for side-effect-only command statements. LLAR build
helpers whose methods return no error, such as
`c.configure`, `c.build`, `c.install`, and `pkgconfig.use`, are called directly;
use `!` for separate gsh or Go operations that return an error, such as
`pkgconfig.lookup`.
