# LLAR Formula Reference

## Contents

- [Module layout and selection](#module-layout-and-selection)
- [Formula classfile](#formula-classfile)
- [Lifecycle](#lifecycle)
- [Formula API](#formula-api)
- [Failure handling](#failure-handling)
- [Dependencies](#dependencies)
- [Build matrix](#build-matrix)
- [Build environment](#build-environment)
- [CMake](#cmake)
- [Autotools](#autotools)
- [Commands and captured output](#commands-and-captured-output)
- [Metadata](#metadata)
- [Installed-output tests](#installed-output-tests)
- [Version comparator](#version-comparator)
- [Fictional complete example](#fictional-complete-example)
- [Validation checklist](#validation-checklist)

All module names, versions, options, targets, commands, and metadata values in
this reference are fictional unless they name an LLAR or XGo API. Replace them
with facts verified from the selected upstream source revision.

## Module Layout And Selection

An LLAR module id is the upstream GitHub repository path `<owner>/<repo>`. A
Formula store uses this shape:

```text
example/libalpha/
  versions.json
  Libalpha_cmp.gox             # optional; one comparator for the module
  v1.2.3/
    Libalpha_llar.gox          # Formula beginning at v1.2.3
  v2.0.0/
    Libalpha_llar.gox          # Formula beginning at v2.0.0
```

`versions.json` is required even when `onRequire` returns fully versioned
dependencies:

```json
{
  "path": "example/libalpha",
  "deps": {
    "v1.2.3": [
      {"path": "example/libbeta", "version": "v2.0.0"}
    ],
    "v1.4.0": [
      {"path": "example/libbeta", "version": "v2.0.0"}
    ]
  }
}
```

Apply these layout rules:

- Make `versions.json.path` and Formula `id` equal the module directory path.
- Key `deps` by the exact requested source tag, preserving prefixes and case.
- Store direct dependencies only. Treat each entry as a conservative fallback,
  not as the newest dependency snapshot. Use an empty object when no versions
  need fallback.
- End Formula names in `_llar.gox` and comparator names in `_cmp.gox`.
- Use a valid Go identifier before the first underscore in either filename and
  do not put another underscore in that stem. LLAR extracts the generated class
  name by cutting the basename at the first underscore.
- Keep the directory name aligned with `fromVer` for maintainability, but do
  not rely on it for selection. LLAR scans Formula contents recursively.

For a requested version, LLAR compares every literal `fromVer`, discards values
newer than the request, and selects the greatest remaining value. A request
older than every `fromVer` has no Formula. The optional module comparator is
used for both Formula selection and module version resolution.

`fromVer` lets one Formula describe a range of upstream versions. Dependencies
can change inside that range even when the build recipe remains valid. Pair the
range with `onRequire`: run the same Formula against each requested exact tag,
read that tag's dependency declarations, and return its current direct
dependencies. This keeps dependency data synchronized without adding a new
Formula for every dependency release.

Use `versions.json` as the fallback for that dynamic discovery. Choose a
conservative dependency version verified to work throughout the Formula's
served range; the fallback may intentionally be older than the dependency
declared by newer upstream tags. The current loader still looks up the table by
the exact requested source version, so place that fallback under every exact
version that may need it. `fromVer` does not make `versions.json` a range-keyed
table.

`fromVer` must be a non-empty string literal. LLAR's selector parses the source
AST without executing the Formula; a computed value cannot be selected.

## Formula Classfile

`_llar.gox` is an XGo project class registered with base class
`formula.ModuleF`. `cmake` and `autotools` are automatic imports. Import other
Go packages explicitly.

A file named `Libalpha_llar.gox` has this essential generated shape:

```go
type Libalpha struct {
    formula.ModuleF
}

func (this *Libalpha) MainEntry() {
    this.Id("example/libalpha")
    this.FromVer("v1.2.3")
    this.OnBuild(func(ctx *formula.Context) {
        // Formula hook body.
    })
}

func (this *Libalpha) Main() {
    formula.XGot_ModuleF_Main(this)
}
```

Do not write the generated type, `MainEntry`, `Main`, package `main`, or
`XGot_ModuleF_Main` yourself. Use only the XGo surface names.

`ModuleF` embeds `gsh.App`, so hook bodies also receive gsh command execution,
captured output, and last-command state. `XGot_ModuleF_Main` executes the
top-level Formula statements to register hooks, then initializes the embedded
gsh app. Keep commands inside hooks rather than executing them at top level.

Imports, named types, constants, class fields, and receiverless helper
functions must appear before the first executable top-level Formula statement,
normally `id`. A receiverless helper in a classfile becomes a method of the
generated Formula class and can access promoted Formula APIs.

Use normal Go syntax or verified XGo syntax. Common Formula forms include:

- `os.readFile(path)` as the XGo lowercase alias for `os.ReadFile(path)`;
- command-style calls such as `ctx.setMetadata value`;
- auto-properties such as `ctx.outputDir` and `target.options`;
- `expr!` to panic when the final error result is non-nil;
- lambdas such as `onBuild ctx => { ... }`.

Read the bundled XGo Classfile reference for the language and generated-name
rules. Never call `XGot_`, `Gopt_`, `Gops_`, `Gopx_`, `Gopo_`, or numbered
overload symbols from Formula source.

## Lifecycle

For each module version selected while resolving a build graph, LLAR:

1. Loads the module comparator or uses GNU version comparison.
2. Selects the greatest Formula `fromVer` not newer than the source version.
3. Creates an independent Formula class instance.
4. Starts `target.options` from that Formula's defaults, overlays requested
   options, and injects requested `target.require` values.
5. Runs `filter`, when present. A false result stops before dependency
   discovery.
6. Runs `onRequire`, when present, against the upstream source at the selected
   tag, then reconciles its direct dependencies with `versions.json`.
7. Resolves versions with MVS and builds dependencies before dependents.
8. Reuses a cached artifact or clones the source and runs `onBuild`.
9. Stores the install directory, metadata, and dependency list after a
   successful cache miss.
10. For `llar test`, runs only the requested root's `onTest`, after either a
    fresh build or a cache hit.

`filter`, `onRequire`, `onBuild`, and `onTest` are panic boundaries. LLAR
recovers their panics and returns errors. `onRequire`, `onTest`, `defaults`, and
`filter` are optional. A usable Formula must register `onBuild`; otherwise a
cache miss has no build callback to execute.

## Formula API

### Top-Level Surface

| XGo surface | Backing Go API | Meaning |
| --- | --- | --- |
| `id "owner/repo"` | `(*ModuleF).Id(string)` | Set the module id served by this Formula. |
| `fromVer "version"` | `(*ModuleF).FromVer(string)` | Set the first source version served by this Formula. |
| `defaults {"key": "value"}` | `(*ModuleF).Defaults(map[string]string)` | Set default option selections. |
| `filter => { ... }` | `(*ModuleF).Filter(func() bool)` | Accept or reject the effective matrix. |
| `onRequire (proj, deps) => { ... }` | `(*ModuleF).OnRequire(func(*Project, *ModuleDeps))` | Synchronize direct dependencies from the requested upstream tag. |
| `onBuild ctx => { ... }` | `(*ModuleF).OnBuild(func(*Context))` | Build and install on a cache miss. |
| `onTest ctx => { ... }` | `(*ModuleF).OnTest(func(*Context))` | Verify the requested root's installed output. |

There is no top-level `matrix` declaration.

### Target

| XGo surface | Type | Meaning |
| --- | --- | --- |
| `target.require` | `map[string][]string` | Selected environment requirements. |
| `target.options` | `map[string][]string` | Effective package option selections after defaults and overrides. |

Treat both maps as read-only. Test membership with `slices.contains`; do not
mutate a returned map or slice.

### Dependency Discovery

| XGo surface | Type | Meaning |
| --- | --- | --- |
| `proj` | `*formula.Project` | Project view for the selected upstream tag. |
| `proj.readFile(path)` | `([]byte, error)` | Read a file from that upstream source. |
| `deps` | `*formula.ModuleDeps` | Direct dependency collector. |
| `deps.require(path, version)` | `func(string, string)` | Append one direct dependency. |
| `deps.deps()` | `[]module.Version` | Return a copy of dependencies collected so far. |

`onRequire` has no source checkout path and does not run inside the build
command scope. Inspect source with `proj.readFile`; do not launch configure or
build commands there.

### Build And Test Context

| XGo surface | Type | Meaning |
| --- | --- | --- |
| `ctx.SourceDir` | `string` | Temporary checkout of the selected upstream source tag. |
| `ctx.Proj` | `*formula.Project` | Project data for the current build or test. |
| `ctx.Proj.Deps` | `[]module.Version` | Resolved dependency closure for this module in build order. |
| `ctx.Proj.readFile(path)` | `([]byte, error)` | Read a file from the Formula module directory, not `ctx.SourceDir`. |
| `ctx.outputDir` | `string` | Current module's install directory. |
| `ctx.outputDir(dep)` | `string` | Install directory for a resolved dependency. |
| `ctx.buildResult(dep)` | `(formula.BuildResult, bool)` | Read an already-built dependency result. |
| `ctx.setMetadata(value)` | `func(string)` | Replace this module's consumer metadata. |
| `ctx.Errs` | `errors.List` | Errors accumulated by the current hook context. |
| `ctx.Errs.add(err)` | `func(error)` | Record a non-nil hook error for LLAR to return after the hook. |

Use `ctx.SourceDir` plus normal filesystem APIs to inspect upstream files during
build or test. Use `ctx.Proj.readFile` only for data intentionally shipped next
to `versions.json` in the Formula module.

`ctx.outputDir(dep)` records a lookup error and panics when the dependency
output cannot be found. Do not add a second error check around it.

### Build Result

| XGo surface | Type | Meaning |
| --- | --- | --- |
| `ctx.Out` | `formula.BuildResult` | Current module's mutable build result. |
| `ctx.Out.metadata()` | `string` | Read its current metadata. |
| `ctx.Out.setMetadata(value)` | `func(string)` | Set its metadata directly. |
| `result.metadata()` | `string` | Read metadata from `ctx.buildResult(dep)`. |

Prefer `ctx.setMetadata` for the current module. `BuildResult` contains only a
metadata string; errors belong to `ctx.Errs` or the hook panic boundary. There
is no `TestResult` type and no separate build/test result callback parameter.

## Failure Handling

Choose failure handling from the actual operation:

- Use `value := operation()!` for a required error-returning expression.
- Use `panic err` after explicit inspection when additional context or cleanup
  is required.
- Use `ctx.Errs.add(err)` to collect multiple independent failures before the
  hook returns.
- Handle an error without failing only when the failure is an accepted source
  condition, such as an optional dependency file that is genuinely absent.

Example of a required source file:

```gox
data := proj.readFile("dependencies.lock")!
```

Example of an optional source file:

```gox
data, err := proj.readFile("optional-feature.lock")
if err == nil {
    inspectOptionalFeature(data)
}
```

In `onRequire`, a failed or unrecognized dependency-manifest read may return
without dependencies only when the corresponding `versions.json` entry is a
verified fallback for that Formula range. Otherwise fail the hook instead of
silently selecting an unrelated dependency.

Current CMake and Autotools `configure`, `build`, and `install` methods return
no value and panic on directory or command failure:

```gox
c.configure
c.build
c.install
```

Do not assign their result, add `!`, check `lastErr`, or wrap them in repetitive
manual error blocks.

## Dependencies

One Formula normally serves the interval beginning at its `fromVer` and ending
before the next Formula threshold. The build recipe can remain stable while
dependency names or versions change inside that interval. Use `onRequire` as
the primary synchronization mechanism: LLAR gives it the selected exact tag's
upstream filesystem, so it can read the same dependency manifest that upstream
maintains.

Declare only dependencies that the selected upstream configuration consumes
directly. Translate every upstream build-system name to its LLAR module id;
LLAR does not infer that mapping.

Preferred source-synchronized dependency:

```gox
onRequire (proj, deps) => {
    data, err := proj.readFile("dependency-version.txt")
    if err != nil {
        return
    }

    version := strings.trimSpace(string(data))
    if version != "" {
        deps.require "example/libbeta", version
    }
}
```

Read a build manifest, lock file, vendored-subproject declaration, or other
authoritative upstream source. Map only enabled direct dependencies. Do not
hardcode the dependency version in `onRequire` when upstream already records
it in a machine-readable form.

`versions.json` is the fallback path. Its version should be known compatible
with the Formula range and may deliberately lag the newest upstream dependency.
Returning no usable dependency from `onRequire` activates that fallback.

LLAR always parses `versions.json` and reconciles dependencies for the exact
requested module version:

1. If `onRequire` is absent or yields no usable dependency, LLAR uses the
   non-empty entries from `versions.json.deps[requestedVersion]`.
2. For each `onRequire` dependency with an empty version, LLAR fills it only
   from an entry with the same path under that exact version key.
3. An empty-version dependency with no matching pin is dropped.
4. If at least one usable `onRequire` dependency remains, LLAR returns only the
   usable `onRequire` set; it does not append other static entries.
5. If all `onRequire` dependencies are dropped, LLAR falls back to the complete
   non-empty static entry for that requested version.

Record the conservative fallback under every exact source version that may
rely on it. The same range-compatible dependency version may appear under
multiple source-version keys. An entry under a Formula threshold is not a
range; current dependency fallback keys are exact requested versions.

During build, expose installed dependencies to the build system:

```gox
for _, dep := range ctx.Proj.Deps {
    c.use ctx.outputDir(dep)
}
```

Use `ctx.buildResult(dep)` only when the current package's consumer metadata or
build logic actually needs the dependency's metadata. Do not assume that all
dependency metadata should be concatenated, especially across static/shared
linkage differences.

## Build Matrix

The Matrix API stores values as slices:

```go
type Matrix struct {
    Require        map[string][]string
    Options        map[string][]string
    DefaultOptions map[string][]string
}
```

Use the two groups by responsibility:

| Group | Responsibility | Typical keys |
| --- | --- | --- |
| `target.require` | Environment requirements that dependencies may also need. | `os`, `arch`, ABI, libc, toolchain |
| `target.options` | Choices owned by this package's recipe and output. | `shared`, `debug`, feature provider, tests |

Formula defaults initialize Options. Requested options replace defaults with
the same key. `filter` and `onRequire` see the same effective target.

```gox
import "slices"

defaults {
    "shared": "OFF",
}

filter => {
    for _, value := range target.options["shared"] {
        if value != "ON" && value != "OFF" {
            return false
        }
    }
    return true
}

onBuild ctx => {
    shared := slices.contains(target.options["shared"], "ON")
    // Apply shared only to a source-backed build-system setting.
}
```

Apply these matrix rules:

- Read a key only when it changes dependencies, commands, output, metadata,
  tests, or support.
- Defaults apply only to Options and do not define the set of legal values.
- Use `filter` to reject selections unsupported by the chosen source revision.
- Keep option keys independent. If two keys describe one indivisible choice,
  combine them into one option instead of creating meaningless combinations.
- Do not read the matrix from `Context`; `ctx.currentMatrix()` does not exist.
- Do not depend on the internal matrix-string encoding.

CLI forms are:

```text
--os linux
--arch amd64
--require abi=example
--option shared=ON
```

Unknown long flags such as `--os` are Require shortcuts. With no matrix flags,
`llar make` and `llar test` supply host `os` and `arch`. Once any matrix flag is
present, supply every required dimension explicitly; host values are not merged
into a partial explicit matrix.

## Build Environment

On a cache miss, `onBuild` receives:

- a fresh temporary upstream checkout at `ctx.SourceDir`;
- an existing current install directory at `ctx.outputDir`;
- already-built dependency install directories and results;
- command stdin/stdout/stderr and working directory scoped by LLAR.

Commands issued through gsh begin in `ctx.SourceDir`. CMake identifies source
and build directories in its arguments. Autotools runs configure, make, and
make install in its configured build directory.

CMake and Autotools `use` mutate process environment variables. LLAR restores
the original process environment after the graph build. Call `use` for the
dependencies that the current build must discover; do not hardcode cache or
workspace paths.

Use a build directory under the temporary source checkout unless the upstream
build system requires another layout. Install only into `ctx.outputDir`.

## CMake

Create a CMake helper:

```gox
installDir := ctx.outputDir
c := cmake.new(ctx.SourceDir, ctx.SourceDir+"/_build", installDir)

for _, dep := range ctx.Proj.Deps {
    c.use ctx.outputDir(dep)
}

c.configure
c.build
c.install
```

| XGo surface | Effect |
| --- | --- |
| `cmake.new(source, build, install)` | Create a CMake workflow. |
| `c.source(dir)` | Replace the source directory. |
| `c.generator(name)` | Add `-G name` during configure. |
| `c.buildType(name)` | Set `CMAKE_BUILD_TYPE` and pass `--config name` to build. |
| `c.toolchain(path)` | Set `CMAKE_TOOLCHAIN_FILE`. |
| `c.define(key, value)` | Add `-Dkey:STRING=value`. |
| `c.defineBool(key, value)` | Add `-Dkey:BOOL=ON` or `OFF`. |
| `c.use(root)` | Add an installed dependency to search paths and flags. |
| `c.configure(args...)` | Run CMake configure with extra trailing arguments. |
| `c.build(args...)` | Run `cmake --build` with extra trailing arguments. |
| `c.install(args...)` | Run `cmake --install` with extra trailing arguments. |
| `c.outputDir` | Return install dir when set, otherwise build dir. |

The generated commands have these shapes:

```text
cmake -S <source> -B <build> [configured options] [extra configure args]
cmake --build <build> [--config <build-type>] [extra build args]
cmake --install <build> [--prefix <install>] [extra install args]
```

`configure` creates the build directory. Cache definitions are emitted in
sorted key order. When `install` is non-empty, configure sets
`CMAKE_INSTALL_PREFIX` and install passes `--prefix`.

`c.use(root)` always prepends `root` to `CMAKE_PREFIX_PATH`. It adds
`root/include`, `root/lib`, and `root/lib/pkgconfig` only when those paths
exist, plus platform compiler/linker environment variables. Verify nonstandard
layouts such as `lib64` or `share/pkgconfig`; the helper does not guess them.

Do not force a generator, build type, policy version, static/shared mode,
toolchain, tests setting, or optional dependency switch without evidence from
the exact source revision and selected matrix.

## Autotools

Create an Autotools helper:

```gox
installDir := ctx.outputDir
a := autotools.new(ctx.SourceDir, ctx.SourceDir+"/_build", installDir)

for _, dep := range ctx.Proj.Deps {
    a.use ctx.outputDir(dep)
}

a.configure
a.build
a.install
```

| XGo surface | Effect |
| --- | --- |
| `autotools.new(source, build, install)` | Create a configure/make workflow. |
| `a.source(dir)` | Replace the source directory. |
| `a.use(root)` | Add an installed dependency to search paths and flags. |
| `a.configure(args...)` | Run the source `configure` script in the build directory. |
| `a.build(args...)` | Run `make` in the build directory. |
| `a.install(args...)` | Run `make install` in the build directory. |
| `a.outputDir` | Return install dir when set, otherwise build dir. |

`configure` creates the build directory and prepends
`--prefix=<installDir>` when an install directory is set. Extra flags follow
that prefix. An empty build directory means the current directory; normally
provide an explicit build tree.

`a.use(root)` has the same existing-path behavior as CMake `use`: it configures
the standard `include`, `lib`, and `lib/pkgconfig` layout plus CMake search
paths and platform compiler/linker variables.

The helper does not run `autoreconf`, choose a make implementation, or invent
configure flags. Add a separate verified command only when the selected source
requires it.

## Commands And Captured Output

`formula.ModuleF` embeds `gsh.App`. An unresolved command-style identifier is a
custom command:

```gox
tool "--flag", "value"
```

XGo lowers it to the generated call:

```go
this.XGo_Exec("tool", "--flag", "value")
```

`gsh.App.XGo_Exec` ultimately constructs:

```go
exec.Command("tool", "--flag", "value")
```

Arguments remain separate strings. No shell parses quoting, pipes,
redirection, wildcard expansion, command substitution, or `&&`.

The complete gsh command surface available to a Formula is:

| XGo surface | Behavior |
| --- | --- |
| `tool args...` | Resolve an otherwise-undefined command identifier through `XGo_Exec`. |
| `exec name, args...` | Run a command with explicit argument strings. |
| `exec commandLine` | Split one string with `strings.Fields`, expand environment references, and accept leading `NAME=value` entries. |
| `exec env, name, args...` | Run explicit arguments with a `map[string]string` environment overlay. |
| `capout => { ... }` | Capture stdout from commands in the block. |
| `output` | Return stdout from the last `capout`. |
| `lastErr` | Return the last command execution error. |
| `exitCode` | Return the last command exit code. |

Examples of the three `exec` overloads:

```gox
exec "tool", "--flag", "value"
exec "MODE=check tool --flag $HOME"
exec {"MODE": "check"}, "tool", "--flag", "value"
```

The one-string overload is only field splitting plus environment expansion; it
is not a shell. Prefer explicit arguments. If a verified build step genuinely
requires shell syntax, invoke the selected platform shell explicitly and treat
that shell as a build dependency.

Direct command syntax applies only when the command name is an unresolved XGo
identifier. Use `exec` when the executable name:

- is a Go/XGo keyword;
- contains `/`, `-`, `.`, or another non-identifier character;
- is an absolute or relative path; or
- collides with a local, imported, or promoted symbol.

`$NAME` in a direct command argument is lowered through `XGo_Env`. The explicit
argument form does not expand a `$NAME` contained inside an ordinary string;
resolve it in XGo or use the one-string overload deliberately.

Every gsh command stores its result in `lastErr`. A command statement ignores
the returned error unless it is error-wrapped or checked. Fail immediately with
one of these verified forms:

```gox
tool! "--check"
```

```gox
tool "--check"
lastErr!
```

```gox
exec "tool", "--check"
if lastErr != nil {
    panic lastErr
}
```

Check `lastErr` immediately because the next command overwrites it.

Capture command output only after validating the command result:

```gox
capout => {
    exec "tool", "--query"
}
if lastErr != nil {
    panic lastErr
}
value := output
```

`capout` captures stdout and leaves stderr on the active build/test stream.
Commands inside `onBuild` and `onTest` use LLAR's scoped working directory and
streams. Formula command output is normally hidden unless verbose output is
enabled; never use printed output as metadata.

## Metadata

Metadata is the current module's consumer-facing usage string. It is not a
dependency list, build log, or description. `ctx.setMetadata` replaces the
previous value.

For a C/C++ library, include the verified flags a consumer needs to compile and
link against the installed output. Prefer installed package metadata when it
is correct:

```gox
import "strings"

installDir := ctx.outputDir
c.use installDir
capout => {
    exec "pkg-config", "--cflags", "--libs", "libalpha"
}
if lastErr != nil {
    panic lastErr
}
ctx.setMetadata strings.trimSpace(output)
```

Verify the installed package-config name and file contents. If the package has
no usable metadata file, construct only the flags proved necessary by a
consumer compile/link test. Include install-directory paths when consumers
need them; LLAR's artifact encoder replaces the actual install prefix with its
portable `{{.InstallDir}}` representation and expands it at installation time.
Do not write that internal placeholder in Formula source.

Dependency metadata is available explicitly:

```gox
dep := ctx.Proj.Deps[0]
result, ok := ctx.buildResult(dep)
if ok {
    dependencyFlags := result.metadata()
    _ = dependencyFlags
}
```

Compose a dependency's flags only when the current package's public interface
requires consumers to use them. Preserve a source-backed link order and do not
blindly append the entire dependency closure.

## Installed-Output Tests

`onTest` verifies the requested root when `llar test` runs. It is not invoked
for transitive dependencies. On a cache miss, it runs after `onBuild`; on a
cache hit, `onBuild` is skipped but LLAR still creates a fresh source checkout
and runs `onTest` against the cached install directory.

Write tests from the consumer's perspective:

- use headers, libraries, executables, and package metadata under
  `ctx.outputDir`;
- use a test build directory separate from the `onBuild` build directory;
- use source files from the fresh `ctx.SourceDir` checkout or files shipped in
  the Formula module;
- add dependency roots only when the consumer requires them;
- execute or load the produced consumer artifact when the platform supports it;
- fail every required command;
- do not modify metadata in `onTest` because cache-hit tests do not rewrite the
  cached build result.

Fictional CMake consumer shape:

```gox
onTest ctx => {
    installDir := ctx.outputDir
    testSource := ctx.SourceDir + "/consumer"
    testBuild := ctx.SourceDir + "/_consumer_build"

    tc := cmake.new(testSource, testBuild, "")
    tc.use installDir
    for _, dep := range ctx.Proj.Deps {
        tc.use ctx.outputDir(dep)
    }
    tc.configure
    tc.build

    exec testBuild + "/consumer-check"
    if lastErr != nil {
        panic lastErr
    }
}
```

Use `ctx.Errs.add(err)` when several independent consumer assertions should be
reported together. Otherwise fail fast.

## Version Comparator

Without `_cmp.gox`, LLAR compares version strings with its GNU-style numeric
segment comparator. Add one comparator only when actual upstream tags require
a different ordering.

`_cmp.gox` is an XGo project class backed by `cmp.CmpApp`. `semver` and `gnu`
are automatic imports:

```gox
compareVer (a, b) => {
    return semver.Compare(a.Version, b.Version)
}
```

The callback receives two `module.Version` values and must return a negative
number, zero, or a positive number according to their ordering. Use
`semver.Compare` only when every relevant tag is valid Go semantic-version
syntax. Test the comparator against actual tags and every Formula `fromVer`.

Keep exactly one `_cmp.gox` file per module. LLAR uses the first matching file;
multiple comparators make ownership ambiguous.

## Fictional Complete Example

This example shows the current API shape, not a reusable recipe. Every build
flag, dependency, package-config name, source path, and consumer target must be
replaced with evidence from the selected source.

`versions.json`:

```json
{
  "path": "example/libalpha",
  "deps": {
    "v1.2.3": [
      {"path": "example/libbeta", "version": "v2.0.0"}
    ],
    "v1.4.0": [
      {"path": "example/libbeta", "version": "v2.0.0"}
    ]
  }
}
```

Both source tags use the same conservative `v2.0.0` fallback. When either
tag's `dependency-version.txt` declares a newer compatible dependency,
`onRequire` returns that upstream version instead.

`Libalpha_llar.gox`:

```gox
import (
    "slices"
    "strings"
)

id "example/libalpha"

fromVer "v1.2.3"

defaults {
    "shared": "OFF",
}

filter => {
    for _, value := range target.options["shared"] {
        if value != "ON" && value != "OFF" {
            return false
        }
    }
    return true
}

onRequire (proj, deps) => {
    data, err := proj.readFile("dependency-version.txt")
    if err != nil {
        return
    }
    version := strings.trimSpace(string(data))
    if version != "" {
        deps.require "example/libbeta", version
    }
}

onBuild ctx => {
    installDir := ctx.outputDir
    c := cmake.new(ctx.SourceDir, ctx.SourceDir+"/_build", installDir)

    for _, dep := range ctx.Proj.Deps {
        c.use ctx.outputDir(dep)
    }

    shared := slices.contains(target.options["shared"], "ON")
    c.defineBool "LIBALPHA_BUILD_SHARED", shared
    c.configure
    c.build
    c.install

    c.use installDir
    capout => {
        exec "pkg-config", "--cflags", "--libs", "libalpha"
    }
    if lastErr != nil {
        panic lastErr
    }
    ctx.setMetadata strings.trimSpace(output)
}

onTest ctx => {
    installDir := ctx.outputDir
    testSource := ctx.SourceDir + "/consumer"
    testBuild := ctx.SourceDir + "/_consumer_build"

    tc := cmake.new(testSource, testBuild, "")
    tc.use installDir
    tc.configure
    tc.build

    exec testBuild + "/consumer-check"
    if lastErr != nil {
        panic lastErr
    }
}
```

## Validation Checklist

- [ ] The exact upstream tag exists and its spelling is preserved.
- [ ] `versions.json.path`, Formula `id`, and directory ownership agree.
- [ ] The filename stem before the first underscore is the generated class
      name and is a valid Go identifier.
- [ ] Every `fromVer` is a non-empty string literal and Formula thresholds
      select the intended source ranges under the active comparator.
- [ ] Imports and helper declarations precede the first Formula statement.
- [ ] Hook signatures use the current one-context build/test API.
- [ ] `onRequire` reads the requested tag's authoritative dependency data,
      declares direct dependencies only, and maps upstream names to verified
      LLAR module ids.
- [ ] Representative versions across each affected Formula range produce the
      dependency names and versions declared by those upstream tags.
- [ ] `versions.json` uses a conservative fallback verified across the Formula
      range and records it under every exact source version that may need it.
- [ ] Empty dependency versions have an exact fallback pin or are intentionally
      absent.
- [ ] Required and option keys have the correct ownership, defaults are
      supported, and options remain independent.
- [ ] `filter` rejects only combinations proved unsupported.
- [ ] CMake/Autotools settings and custom commands come from the selected
      source revision rather than another Formula.
- [ ] Current CMake/Autotools methods are called without result assignments.
- [ ] Every required direct command or `exec` failure reaches the hook boundary.
- [ ] Dependency install roots come from `ctx.outputDir(dep)`.
- [ ] Metadata compiles and links a consumer against the installed output.
- [ ] `onTest` uses a separate build tree and succeeds after a fresh build and
      a cache hit.
- [ ] Exact versions, defaults, and every affected matrix selection pass
      `llar test`.
