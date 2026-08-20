# Formula Semantics

These are design rules, not a versioned API table. Resolve every concrete name,
signature, and return behavior from the target LLAR revision.

## Module And Version Ownership

Keep a module under its upstream repository id. Preserve exact upstream tag
spelling, including prefixes and case. Enumerate the complete upstream tag set
visible to LLAR, then inspect every existing Formula threshold and comparator
before adding another one.

Set `fromVer` to the lowest upstream version for which the same dependency,
build, install, metadata, and consumer contract is verified. Work upward from
the oldest available candidate instead of starting at the requested version.
Verify all older tags are incompatible or intentionally unsupported so a lower
compatible version is not missed. Add a new threshold when a source-backed
incompatibility begins; do not split ranges merely because a dependency version
changed if the active Formula can discover it from the selected tag.

Add a comparator only when the store's active default comparator misorders the
real tag set. Before writing one, check every upstream version LLAR may select,
not only the requested version or Formula thresholds. Every tag must conform to
the comparator's input rules and the complete set must have the intended total
order. In particular, use a semantic-version comparator only when every tag is
valid semantic-version syntax.

In llarhub, start every `_llar.gox` filename stem with a lowercase ASCII letter.
For example, use `picobench_llar.gox`, not `Picobench_llar.gox`; do not present
this convention as an LLAR parser limit.

## Upstream Investigation

Inspect the exact source revision before editing. Read:

- the build-system entrypoint and install rules;
- dependency manifests, lock files, and vendored-subproject declarations;
- build options and their defaults;
- package metadata generated or installed upstream;
- source patches and exported files used by the reference package recipe;
- upstream or package-recipe consumer tests.

Translate package semantics, not another package manager's implementation.
Exclude its cache layout, generated toolchains, cleanup conventions, generic
compatibility code, and defensive flags unless the selected upstream revision
requires equivalent behavior.

## Dependencies

Declare direct dependencies only. Map each upstream dependency name to an LLAR
module id using verified repository evidence.

When dependency versions vary inside a Formula range and upstream records them
in a stable machine-readable source file, discover them from the requested tag
through the active Formula dependency hook. Parse structured formats with a
structured parser.

Resolve source ownership separately for every hook. Do not assume a project
filesystem exposed during dependency discovery refers to the same source as a
build context. During build or test, use the upstream source directory exposed
by the active context unless that LLAR revision proves another API owns it.

Use `versions.json` according to the selected LLAR loader's actual reconciliation
rules. Treat static dependency entries as verified conservative data, not as a
place to copy the newest known dependency versions. Never add fallback data for
a failure mode that has not been shown to occur.

## Matrix And Options

Expose a dimension only when it changes dependencies, commands, installed
output, metadata, tests, or supported platforms.

- Environment-owned requirements belong to the target requirements surface.
- Package-owned build choices belong to the target options surface.
- Defaults choose option values; they do not by themselves define every legal
  value.
- Reject a selection only when the selected upstream revision proves it is
  unsupported.

Keep options independent. Combine values that represent one indivisible choice
instead of creating invalid cartesian combinations.

## Build And Install

Use the LLAR helper matching upstream when it owns the required flow. Configure
only source-backed flags. Do not force a generator, build type, linkage mode,
toolchain, policy version, test toggle, or optional feature because another
Formula used it.

Expose dependency install roots through the active helper or context contract.
Install the complete public result into the current module's output directory.
Do not depend on a build scratch path after the build callback returns.

For an unsupported build system, use gsh commands with separate arguments and
explicit failure propagation. Call active CMake or Autotools helper methods
according to their real return contract; do not add `!` to a void helper that
already panics on failure. Add a shell only when the verified upstream step
requires shell grammar.

## Metadata

Metadata describes how an installed consumer uses the package. Derive it from
installed headers, libraries, tools, CMake package files, pkg-config files, or
another verified public interface.

Prefer valid installed package metadata. Otherwise construct only the flags
proved by a consumer compile/link/load/run check. Include dependency metadata
only when the package's public interface requires it, preserving verified link
ordering.

For C/C++ library metadata exposed through pkg-config, install a valid `.pc`
file under `lib/pkgconfig` in the output. Derive its name, version, libraries,
private dependencies, and flags from the selected upstream source and the
actual installed interface; do not invent missing fields. Make the file
relocatable, for example by deriving its prefix from `${pcfiledir}` instead of
embedding the build or installation path.

Resolve the pkg-config helper API from the target LLAR revision. When that
revision provides `pkgconfig.use` and `pkgconfig.lookup`, call
`pkgconfig.use installDir` before `pkgconfig.lookup(name)!`. The lookup must run
the equivalent of `pkg-config --cflags --libs` and its complete result must be
the Formula metadata. Do not replace it with a handwritten include, library,
or linker fragment, and do not use a libs-only helper. Apply the same full
query to a header-only library even though its libs portion is empty.

Do not copy a package manager's `package_info` declaration without comparing it
to the actual installed result.

## Consumer Test

Base `onTest` on upstream or reference-package consumer behavior. Build against
the installed output and declared dependencies, then run or load the produced
artifact when the platform supports it.

When the Formula publishes pkg-config metadata, require the installed `.pc`
file and compile/link the consumer with the complete flags returned by the
verified cflags-and-libs lookup. A test that reconstructs `-I`, `-L`, or `-l`
flags independently does not validate the published metadata.

Use a test build tree distinct from the build callback's scratch tree. A cached
artifact may skip the build callback while still running the consumer test.
Tests must not repair or mutate cached metadata.

## Validation Range

Test the exact requested tag, the lowest compatible `fromVer`, the immediately
preceding incompatible or unsupported version, every changed threshold,
representative tags where dependencies or build files differ, defaults, and
each retained output-changing option. When a comparator exists, validate it
against the complete upstream tag set. Use every required environment dimension
when the CLI does not merge host defaults into an explicit matrix.

Re-run a supported selection to exercise cache-hit consumer behavior. Inspect
the installed files and consumer result; parsing and build completion alone are
not sufficient.
