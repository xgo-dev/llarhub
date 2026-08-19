# XGo And Gsh Style For Formulas

## Repository Style Sample

When the target llarhub revision contains
`.github/scripts/find_changed_modules.gsh`, read it completely before writing a
Formula. It is an executable style sample, not a Formula API reference.

Reuse applicable idioms demonstrated there:

- lowercase-first-letter calls such as `filepath.join` and `json.marshal`;
- auto-properties such as `entry.isDir`, `output.trimSpace`, and `values.len`;
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

Prefer the shortest verified XGo form whenever it expresses the same behavior
directly:

- Write callback values as lambdas.
- Omit parentheses for a side-effect-only statement call.
- Use lowercase aliases for exported Go functions and methods.
- Use auto-properties for zero-argument getters.
- Use `for value in values` when the index is unused.
- Use string and slice methods instead of importing a package only for an
  equivalent operation supported by the active XGo version.
- Use a comprehension when it is a direct filter or transform, not when it
  hides stateful control flow or changes empty-value semantics.
- Use command-style calls and `!` when every failure must abort the current
  panic boundary.
- Use unqualified XGo builtins instead of a `fmt.` prefix. Prefer `${expr}` to
  `sprintf` when no formatting directive is needed.
- When an interpolation expression needs a string literal, use a raw string
  inside the braces, for example `${values.join(`, `)}`.

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

- Use `!` for a required operation whose only valid result is success.
- For a required gsh command, attach `!` to the command itself. Inside a
  capture block, write `capout => { command! args }`.
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
  or explicit environment overlays.
- Use `capout` only when the Formula consumes stdout. Put `!` on a required
  command inside the capture block before reading `output`.
- Use the explicit argument form when arguments must remain separate.
- Treat the one-string `exec` form as field splitting plus environment
  expansion unless the selected gsh source proves otherwise.
- Invoke a verified shell explicitly when a build step truly requires pipes,
  redirection, globbing, command substitution, or shell operators.

Keep build commands inside `onBuild` or `onTest`. Prefer the active LLAR CMake or
Autotools helper when it owns the upstream build flow; use gsh for unsupported
build systems and additional source-backed steps.

During the final style pass, review every `exec "literal-name", ...` call. When
the literal is a valid, unshadowed identifier, rewrite it as a direct gsh
command and compile through the active ixgo path.

## Go Interoperation

Using a Go package does not make Formula source Go-first. XGo is designed to
call Go libraries. Use structured Go APIs through XGo spelling for JSON, YAML,
filesystem traversal, archive formats, and source manifest parsing instead of
reimplementing parsers with shell text processing. XGo exposes common `fmt`
operations as builtins; use `fprintf!`, `sprintf`, `errorf`, and related forms
without importing or qualifying `fmt`.
