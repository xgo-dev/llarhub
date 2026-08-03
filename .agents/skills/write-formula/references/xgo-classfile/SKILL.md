---
name: xgo-classfile
description: Write, update, register, configure, implement, or debug generic XGo classfiles and class frameworks. Use when working with .gox classes, project and work class files, generated Go types and entrypoints, Gopt/Gops/Gopx/Gopo package conventions, framework base classes, ClassKind and LookupClass registration, class filename rules, or gox.mod project/class/import declarations.
---

# Write XGo Classfiles

Treat XGo as a superset of Go. Use ordinary Go syntax whenever it is clear, then use XGo conveniences and classfile generation deliberately. Keep language syntax, classfile-to-Go transformation, and framework APIs conceptually separate.

Use the official [XGo language guide](https://github.com/goplus/xgo/blob/main/doc/docs.md) and [classfile guide](https://github.com/goplus/xgo/blob/main/doc/classfile.md) for general syntax. Use the target project's XGo, `gogen`, and `github.com/goplus/mod` versions when implementation details matter.

## Workflow

1. Identify the exact XGo, `gogen`, and `github.com/goplus/mod` versions and the actual build path: XGo CLI/module loader, `x/build`, ixgo, or another embedding host.
2. Classify each source as ordinary `.gox`, project class, or work class from its normalized extension and the active registry.
3. Inspect the real `modfile.Project`, its first package path, base types, `Main` contract, automatic imports, and work interfaces before interpreting DSL names.
4. Map fields, receiverless functions, entry statements, and framework conventions to their generated Go shape.
5. Make the smallest framework-compatible change, then compile through the owning build path and run its behavioral tests.

## Source Map

Use the matching XGo checkout: read `doc/classfile.md` for the public model; `parser/parser_xgo.go` and `parser/parser.go` for detection and class syntax; `cl/classfile.go`, `cl/compile.go`, and `cl/expr.go` for generated types, entrypoints, and lookup; and `x/build/build.go` for core programmatic registration. Read `modfile/rule.go` and `xgomod/classfile.go` from the `github.com/goplus/mod` version selected by that checkout, and `gogen/import.go` from its selected `gogen` version.

## XGo Syntax

### Go Compatibility

Treat XGo as a syntactic superset of Go, not a replacement for Go syntax. Ordinary Go declarations, expressions, statements, control flow, imports, parenthesized calls, composite literals, and exported identifier spellings remain valid in XGo. XGo syntax sugar adds shorter alternative forms; it does not replace or disable the corresponding Go forms.

XGo can import ordinary Go packages, including packages that use cgo. Go programs can also import XGo packages when they are built through the XGo toolchain. See the official [Go compatibility](https://github.com/goplus/xgo/blob/main/doc/docs.md#compatibility-with-go) section.

### Syntax Sugar

Treat XGo syntax as language documentation, not classfile-specific knowledge. All language features apply inside classfiles unless a framework contract says otherwise. The links below are common cases, not an exhaustive syntax index; use the official guide's [table of contents](https://github.com/goplus/xgo/blob/main/doc/docs.md#table-of-contents) for the rest.

- [command-style calls](https://github.com/goplus/xgo/blob/main/doc/docs.md#hello-world), [imports](https://github.com/goplus/xgo/blob/main/doc/docs.md#module-imports), and [Go compatibility](https://github.com/goplus/xgo/blob/main/doc/docs.md#compatibility-with-go);
- [slices](https://github.com/goplus/xgo/blob/main/doc/docs.md#slices), [maps](https://github.com/goplus/xgo/blob/main/doc/docs.md#maps), and [inferred struct literals](https://github.com/goplus/xgo/blob/main/doc/docs.md#deduce-struct-type);
- [`for` forms](https://github.com/goplus/xgo/blob/main/doc/docs.md#for-loop) and [list comprehensions](https://github.com/goplus/xgo/blob/main/doc/docs.md#list-comprehension);
- [optional parameters](https://github.com/goplus/xgo/blob/main/doc/docs.md#optional-parameters), [keyword arguments](https://github.com/goplus/xgo/blob/main/doc/docs.md#keyword-arguments), and [lambda expressions](https://github.com/goplus/xgo/blob/main/doc/docs.md#lambda-expressions);
- [custom iterators](https://github.com/goplus/xgo/blob/main/doc/docs.md#custom-iterators), [overload operators](https://github.com/goplus/xgo/blob/main/doc/docs.md#overload-operators), [rational numbers](https://github.com/goplus/xgo/blob/main/doc/docs.md#rational-numbers), and [domain-specific text](https://github.com/goplus/xgo/blob/main/doc/docs.md#domain-specific-text-literals);
- [error-wrap expressions](https://github.com/goplus/xgo/blob/main/doc/docs.md#error-handling) and [auto properties](https://github.com/goplus/xgo/blob/main/doc/docs.md#auto-property).

One compiler rule not explained clearly there is the lowercase-first-letter alias: `os.readFile(path)` resolves to `os.ReadFile(path)`, and `object.run()` resolves to `object.Run()`. Change only the first ASCII letter. The original Go spelling remains valid, and this alias applies to exported functions and methods rather than arbitrary unexported members.

Keep framework behavior separate from language syntax. For example, `expr!` panics on a non-nil final error result, but whether a class framework recovers that panic is defined by the framework.

## Ordinary `.gox` Transformation

An unregistered `.gox` file is an ordinary classfile. It defines a class without an explicit type declaration. With no `package` clause XGo supplies `package main`; an explicit package is retained. Classfiles can coexist with `.go`, `.xgo`, and `.gop` files in the same package. For example, `Rect.gox`:

```gox
import "bytes"
var (
	*bytes.Buffer
	value int
)
func Add(n int) {
	value += n
}
add 2
echo value
```

generates Go with this essential shape:

```go
package main
import (
	"bytes"
	"fmt"
)
type Rect struct {
	*bytes.Buffer
	value int
}
func (this *Rect) Add(n int) {
	this.value += n
}
func (this *Rect) Main() {
	this.Add(2)
	fmt.Println(this.value)
}
func main() {
	new(Rect).Main()
}
```

### Fields

- Treat the first top-level `var` declaration before any function or executable statement as the generated class's field list; imports, constants, and named types may precede it.
- Allow named fields, embedded types, pointers, qualified types, and field tags in that declaration.
- Do not initialize class fields in the field declaration. XGo rejects `field int = 1` there.
- Treat later top-level `var` declarations as package variables. If a class needs package variables but no fields, reserve the first `var` block for the field list, even if it is empty.

### Methods and Static Methods

- Turn a top-level function without a receiver into a method on the generated class. Resolve unqualified field and method references through `this`.
- Keep an explicitly received Go method as a method of its declared type.
- Turn `func .New(...)` in a classfile into a static method of the generated class.
- Turn `func T.New(...)` into a static method of `T` in any XGo file.
- Put package-level helper functions in a `.go`, `.xgo`, or `.gop` file; a receiverless function in a classfile is not a package function.

Static methods are emitted as Go functions using the `Gops_` convention. For example:

```gox
func .New(n int) *Rect { return &Rect{value: n} }
x := Rect.new(10)
```

is represented in Go as:

```go
func Gops_Rect_New(n int) *Rect { return &Rect{value: n} }
x := Gops_Rect_New(10)
```

### Overloads

Turn an XGo overload declaration into generated methods/functions plus a `Gopo_` overload table. In a classfile:

```gox
func add = (
	addInt
	func(a, b float64) float64 { return a + b }
	addString
)
```

the generated Go includes a class-scoped table such as:

```go
const Gopo_Rect_add = ".addInt,,.addString"
```

and numbered generated implementations for inline alternatives, such as
`add__1`. Call the XGo overload name; do not call numbered Go names directly.

### Entrypoint

- Put top-level executable statements into `(*Class).Main`.
- Put every declaration before the first top-level executable statement; the parser consumes the remainder of the file as the entry body.
- In a `main` package without an explicit `main`, generate `main()` as `new(Class).Main()` only when exactly one ordinary `.gox` class has top-level executable statements.
- If zero or multiple ordinary classes are entry candidates, no class is selected. XGo then emits an empty `main()` unless `NoAutoGenMain` is enabled.
- Keep ordinary constants, named types, and later variables at package scope. Do not generate package `main()` for a non-`main` package.

## Filename Rules

Use `modfile.SplitFname`; do not implement class naming by trimming a suffix manually. For `.gox`, the last underscore starts the class extension:

| Filename | Class name | Class extension |
| --- | --- | --- |
| `Rect.gox` | `Rect` | `.gox` |
| `abc_demo.gox` | `abc` | `_demo.gox` |
| `foo_bar_demo.gox` | `foo_bar` | `_demo.gox` |
| `main.gox` | `_main` internally | `.gox` |

For custom extensions, the basename is the class name. XGo normalizes characters such as `:`, `#`, `-`, and `.` when it must form a Go identifier; for example, `get_p_#id.yap` becomes `get_p_id`.

Directory parsing ignores source filenames beginning with `_`; direct single-file parsing is a separate path. A work-class stem that is a Go keyword is prefixed with `_`, so `init.tspx` generates `_init` unless a registered prefix changes the name first.

Module declarations accept `_name.gox`, `*_name.gox`, `.name`, and `*.name` forms; project declarations also accept `main_name.gox` and `main.name`. Use the exact pattern already chosen by the framework.

A framework registration decides whether a matching file is a project or work class. If project and work classes share an extension, `main` plus that extension is the project class and other matching files are work classes. If they use different extensions, the registered project extension identifies the project file directly.

## Classfile and Base-Class Relationship

`ProjectClass` and `WorkClass` in `gox.mod` name exported Go base types in the first `project` package path. The module grammar accepts an optional leading `*`; the names otherwise must be exported identifiers. XGo uses Go anonymous embedding, not a separate inheritance runtime:

| Registration | Generated relationship |
| --- | --- |
| `project _task.gox Game example.com/task` | Project class anonymously embeds `task.Game`. |
| `project _task.gox *Game example.com/task` | Project class anonymously embeds `*task.Game`. |
| `class _task.gox Worker` | Every matching work class anonymously embeds `task.Worker`. |
| `class _task.gox *Worker` | The `*` is accepted but current XGo still embeds `task.Worker` by value. |
| Project plus work class | Work class also anonymously embeds `*GeneratedProject`. |

Only `*ProjectClass` controls pointer embedding. The module parser also accepts `*WorkClass`, but the current compiler strips that marker while resolving the type and does not use it when generating the anonymous work-base field.

Thus the generated types have this basic shape:

```go
type Game struct { // generated from main_task.gox
	task.Game // project base class
	// project classfile fields
}
type job struct { // generated from job_task.gox
	task.Worker // work base class
	*Game       // owning generated project
	// work classfile fields
}
```

Go promotion makes exported base fields and methods available on the generated class. XGo's lowercase method aliases and auto-properties apply to those promoted methods too. A method declared in the classfile belongs directly to the generated type and therefore takes precedence over a promoted method with the same name. XGo inserts generated base, owner, and `-embed` fields before classfile fields and rejects name conflicts. Unexported base members cannot be named from the generated package, although embedding can still make the generated type satisfy an interface owned by the base package.

Treat every generated object as zero-value construction. `new(GeneratedProject)` and generated work struct literals do not call a base-class constructor or initialize a pointer-embedded base; make the framework's `Main` contract perform any required initialization.

Base classes also define entry contracts:

- Put project top-level statements in generated `MainEntry`. If the project base has `MainEntry`, copy its signature and call `this.ProjectBase.MainEntry(args...)` before the classfile statements.
- Put work top-level statements in generated `Main`. If the work base has `Main`, copy its signature and results and call `this.WorkBase.Main(args...)` before the classfile statements.
- Synthesize an empty `MainEntry` or `Main` for a registered class that has no entry statements. An explicit classfile `func MainEntry` or `func Main` suppresses that synthetic entry and its automatic base-method chain.
- Generate a separate project `Main` that constructs work objects and calls the project base's `Main` contract, normally supplied by `Gopt_<ProjectBase>_Main`. That framework function decides when to invoke the generated project's `MainEntry`.
- In a `main` package without an explicit `main`, select one non-test project before generating `new(GeneratedProject).Main()`. Projects with top-level entry statements or a base package `GopTestClass` marker take priority, and the selected priority group must contain exactly one project.
- If project selection is ambiguous, XGo emits an empty `main()` instead, unless `NoAutoGenMain` is enabled.

For a project source named `main` plus the registered extension, use the project base name for the generated type; for another project filename, use its normalized stem. When work files load a registered project that has a base class but no project source, synthesize a default project type from that base. Only one project file may exist per registered project.

Read the [complete generated project/work example](references/project-work-generation.md) when designing a base-class contract or tracing generated Go. It includes the framework package, `gox.mod`, both classfiles, and the resulting entrypoints.

## Test Class Frameworks

The XGo CLI module loader and ixgo's build adapter pre-register `_test.gox`; the core `x/build` registry in the inspected checkout does not. Never assume the same built-ins across build paths. Any registered extension whose normalized name ends in `test.gox` uses the compiler's test-class generation path.

With the standard `_test.gox` registration, a work file such as `foo_test.gox` embeds `test.Case` and generates a Go test wrapper:

```gox
if got := foo(50); got != 100 {
	t.fatal "unexpected result"
}
```

```go
type case_foo struct { test.Case }
func (this *case_foo) Main() {
	if got := foo(50); got != 100 {
		this.T().Fatal("unexpected result")
	}
}
func Test_foo(t *testing.T) {
	test.Gopt_Case_TestMain(new(case_foo), t)
}
```

An uppercase filename stem keeps the separator out: `Foo_test.gox` generates `caseFoo` and `TestFoo`, while `foo_test.gox` generates `case_foo` and `Test_foo`. The project file `main_test.gox` embeds `test.App`; its top-level statements become `MainEntry`, and XGo generates `TestMain(m *testing.M)` calling `test.Gopt_App_TestMain`.

## XGo Go-Package Conventions

Class frameworks expose XGo-friendly APIs from ordinary Go packages through naming conventions. The XGo importer implements these conventions; they are not functions that classfile authors should call by generated name.

Mark a Go package that exposes these conventions:

```go
const GopPackage = true
```

Without that marker, an imported Go package is not initialized as an XGo package and names such as `Gopt_*` are not installed as synthetic methods. A string value may list comma-separated dependent XGo package paths that also need initialization.

The core conventions are:

| Go declaration | XGo surface | Generated Go call |
| --- | --- | --- |
| `Name__0`, `Name__1` functions | overloaded `name(...)` | selected numbered function |
| `type Name__0`, `type Name__1` | overloaded type `Name` | selected numbered named type |
| `const Gopo_Name = "Fn0,Fn1"` | explicit overload `name(...)` | selected listed function |
| `Gopt_Type_Method(recv, ...)` | template receiver method `recv.method(...)` | `Gopt_Type_Method(recv, ...)` |
| `Gops_Type_Method(...)` | static method `Type.method(...)` | `Gops_Type_Method(...)` |
| `Gopx_Func[T](...)` | type-as-parameter call `funcName T, ...` | `Gopx_Func[T](...)` |
| `Gopt_Type_Gopx_Method[T](recv, ...)` | receiver method with type arguments | combined `Gopt`/`Gopx` call |

Use `Gopt_` when the effective XGo receiver is not the Go receiver. Its first Go parameter is the effective receiver. This is why a framework declares:

```go
func Gopt_Game_Main(game interface{ MainEntry() }) {
	game.MainEntry()
}
```

but classfile code sees a `Main` method and generated Go calls:

```go
framework.Gopt_Game_Main(this)
```

Use `Gops_` for static methods. Use `Gopx_` when XGo source passes a type in the argument list and generated Go must pass it as a type argument. Use `Gopo_` or `__0`, `__1`, and so on for overload sets. A `Gopo_` name can encode a function, method, or synthetic `Gopt_` name; an empty table slot selects the corresponding numbered declaration.

For example, `func Gopx_Col[T any](name string)` lets XGo source write `col string, "name"`; generated Go calls `Gopx_Col[string]("name")`. The combined form similarly turns `table.col string, "name"` into a `Gopt_Table_Gopx_Col[string](table, "name")` call.

Optional parameters have a Go ABI that the language guide does not document: XGo `func f(n int?)` generates a parameter named `__xgo_optional_n`, and an imported Go API can use that prefix to let XGo callers omit the argument. The generated call supplies the parameter's zero value.

When an encoded type or method name contains `_`, the convention uses doubled separators, for example `Gopt__Type_Name__Method_Name`. Verify the exact symbol with the selected `gogen` version instead of hand-guessing it. The current rules are implemented in [`gogen/import.go`](https://github.com/goplus/gogen/blob/v1.19.5/import.go).

### Project `Main` Contract

The project base class must expose `Main` to XGo. A class framework normally does this with `Gopt_<ProjectBase>_Main`, although an actual pointer-receiver base method is also supported.

- If the first Go parameter is an interface implemented by the generated project, generated `Main` passes `this`.
- If the first parameter is a pointer to the base class, generated `Main` passes the address of the embedded base field.
- With one work kind and a variadic work parameter, generated `Main` constructs every work object and passes the pointers as variadic arguments.
- With multiple work kinds, generated `Main` groups objects into typed slices according to the registered prototypes and the `Gopt_*_Main` parameters.
- If one group has no work objects, generated `Main` passes `nil` for that slice.
- Do not expect registration alone to instantiate work classes. If `Main` exposes no work parameters, generated project `Main` does not construct them, and `-embed` has nothing to assign.
- Preserve ordering assumptions carefully: the inspected compiler sorts source paths and preserves that order within each work group, but verify the target version before treating it as framework API.

Treat the `Gopt_*_Main` signature as framework ABI. Keep its work parameters aligned with `gox.mod` class prototypes.

### Work-Class Features

XGo inspects the work interfaces accepted by the project `Main` contract. When an interface requires these methods, XGo generates them:

- `Classfname() string` returns the source class filename stem.
- `Classclone() T` shallow-copies the generated work value and returns a pointer using the interface's declared result type.

The work base class's own `Main` controls the generated work `Main` parameters and results. Generated code calls the base `Main` before classfile entry statements unless the classfile explicitly declares `Main`.

The `class` flags affect generated ownership:

- `-prefix=Prefix` prepends `Prefix` to generated work type names.
- `-embed` embeds each constructed work pointer in the project and assigns it to that field; a class field with the same generated name is rejected.
- `WorkPrototype` identifies the corresponding typed work group when one project has multiple work class kinds. Multiple work kinds require prototypes.

### Additional Framework Hooks

A generated class receiver can obtain `Gop_Env` and `Gop_Exec` from its own methods or promoted base/project methods. The compiler reads package-level markers such as `Gop_sched` and `GopTestClass` from the first framework package path.

| Go hook | XGo behavior |
| --- | --- |
| `Gop_Env(name string)` | Implements `$NAME` and unresolved interpolated environment names. |
| `Gop_Exec(name string, args ...any)` | Handles unresolved command-style calls such as `tool "arg"`. |
| `const Gop_sched = "Sched,SchedNow"` | Names scheduler functions inserted into generated control-flow bodies. |
| `GopTestClass` package symbol | Gives a project test-entry priority even without top-level statements. |

Other `Gop_*` names implement general XGo protocols such as operators and custom iteration (`Gop_Enum`). Treat those as language extension protocols, not classfile entrypoints.

## Name Lookup Inside a Classfile

Resolve an unqualified identifier in this order:

1. Local variables.
2. Members of the generated class receiver.
3. Package globals, types, constants, and explicit imports.
4. Exports from the registered framework package paths.
5. XGo builtins and universe names.

This order explains why a receiverless helper can access a field directly and why a framework method can be called without a package qualifier. If multiple framework package paths export the same referenced name, lookup reports a conflict. Read the actual base classes and framework packages before assuming what an unqualified name means.

## XGo Modules and `gox.mod`

Use XGo's module commands:

```sh
xgo mod init example.com/project
xgo get example.com/class-framework@latest
xgo mod tidy
```

`go.mod` remains the module and dependency file. The optional `gox.mod` stores
XGo version and class-framework metadata. The current loader falls back to the
legacy filename `gop.mod` only when `gox.mod` is absent. Do not name the file
`xgo.mod`.

A framework module declares classes in `gox.mod`:

```text
xgo XGoVersion
project [*.projExt ProjectClass] classFilePkgPath ...
class [-embed -prefix=Prefix] *.workExt WorkClass [WorkPrototype]
import [name] pkgPath
```

For example:

```text
xgo 1.1
project .gmx Game github.com/goplus/spx math
class -prefix=T -embed .spx Sprite
class .spx2 Sprite2
class .spx3 Sprite SpriteProto
```

Apply these module rules:

- Resolve the project and work base classes from the first project package path.
- Use exported identifiers for module-declared project bases, work bases, and work prototypes.
- Search all project package paths for unqualified framework exports.
- Use `import [name] pkgPath` for an automatic named import in classfiles.
- Attach each `class` and `import` to the preceding `project`; both directives require a project first.
- Use a prototype to map each work kind to the corresponding typed slice in a multi-work `Gopt_*_Main` signature.
- Use `*ProjectClass` when the generated project must embed its base by pointer. Do not use `*WorkClass` to request pointer embedding; current XGo still emits a value-embedded work base.
- For a project-only framework, declare `project` and omit all `class` directives.
- For a work-only framework, omit the project extension and base class: `project example.com/task`, followed by `class _task.gox Worker`. Every matching file is then a work class that embeds `task.Worker`, without an owning generated project.

When a consumer runs `xgo get` for a module that has project declarations, XGo records the dependency in `go.mod` with a class marker:

```text
require example.com/class-framework v1.2.3 //xgo:class
```

That marker tells module loading to import the dependency's `gox.mod` class registrations. The module grammar and loading path are implemented in [`modfile/rule.go`](https://github.com/goplus/mod/blob/v0.17.1/modfile/rule.go) and [`xgomod/classfile.go`](https://github.com/goplus/mod/blob/v0.17.1/xgomod/classfile.go).

### Programmatic Registration

Choose the registration layer used by the actual build path. The XGo CLI loads `gox.mod`; XGo's `x/build` package provides a process-global convenience registry; an embedding host may expose its own full-project registry.

Register project and work base classes with `x/build` like this:

```go
build.RegisterClassFileType("_task.gox", "Game", []*build.Class{
	{Ext: "_task.gox", Class: "Worker"},
}, "example.com/task")
```

`Game` is the project base class, each `Works[i].Class` is a work base class, and both are resolved from the first package path. With the shared extension above, `main_task.gox` is the project and other matching files are works. Additional package paths provide unqualified framework lookup.

`RegisterClassFileType` records only `Ext`, `Class`, `Works`, and `PkgPaths`. When full `modfile.Project` data such as automatic `Import` entries is required, use the embedding host's API. For example, `github.com/goplus/ixgo/xgobuild.RegisterProject` is an ixgo API, not a core XGo API.

Register process-global class mappings before parsing, normally from `init`. In the inspected `x/build` implementation, a later registration for the same project or work extension silently replaces the earlier map entry; do not mutate the registry concurrently with builds.

Do not assume registry defaults transfer between build paths. The XGo module loader seeds SPX, GSH, and test projects; the inspected core `x/build` package seeds only its SPX-compatible mapping; embedding hosts can add or replace registrations.

At the lowest level, the parser's `ClassKind` callback must recognize and classify each filename, while `cl.Config.LookupClass` must return the same `modfile.Project` for its normalized extension. Keep both callbacks backed by the same registry; normalize with `modfile.ClassExt` and delegate project/work classification to `Project.IsProj` instead of duplicating the shared-extension rule. See [`x/build/build.go`](https://github.com/goplus/xgo/blob/main/x/build/build.go).

## Validation

1. Confirm the active build path and its registered project for every extension.
2. Confirm the generated class name, base embedding, field block, and `Main` or `MainEntry` shape from source or a matching golden test.
3. Verify the base package's `GopPackage`, `Main`, work interfaces, hooks, and automatic imports instead of inferring them from another framework.
4. Compile through the owning framework, inspect generated Go when diagnostics cross the classfile boundary, and run behavioral tests.
5. Do not call generated helpers from classfile source unless the framework documents them as API.
