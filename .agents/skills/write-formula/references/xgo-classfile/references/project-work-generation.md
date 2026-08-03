# Generated Project/Work Example

Use this example when designing a class framework or mapping generated Go diagnostics back to project and work classfiles.

## Framework Package

```go
package task
const GopPackage = true
type Game struct{}
func (p *Game) initGame() {}
type Gamer interface {
	initGame()
	MainEntry()
}
type Worker struct{}
func (p *Worker) Main(name string) {}
type Handler interface {
	Main(string)
	Classfname() string
	Classclone() Handler
}
func Gopt_Game_Main(game Gamer, workers ...Handler) {
	game.MainEntry()
}
```

Register one shared extension in `gox.mod`:

```text
xgo 1.1
project _task.gox Game example.com/task
class _task.gox Worker
```

## Classfiles

`main_task.gox`:

```gox
echo "start"
```

`job_task.gox`:

```gox
echo "work"
```

## Essential Generated Go

```go
package main
import (
	"example.com/task"
	"fmt"
)
type job struct {
	task.Worker
	*Game
}
type Game struct {
	task.Game
}
func (this *Game) MainEntry() {
	fmt.Println("start")
}
func (this *Game) Main() {
	_xgo_obj0 := &job{Game: this}
	task.Gopt_Game_Main(this, _xgo_obj0)
}
func (this *job) Main(_xgo_arg0 string) {
	this.Worker.Main(_xgo_arg0)
	fmt.Println("work")
}
func (this *job) Classfname() string {
	return "job"
}
func (this *job) Classclone() task.Handler {
	_xgo_ret := *this
	return &_xgo_ret
}
func main() {
	new(Game).Main()
}
```

Temporary identifiers such as `_xgo_obj0` may change. Treat base embedding, receiver methods, `MainEntry`, work construction, the `Gopt_Game_Main` call, the work-base `Main` call, and package `main()` as the relationships to verify.
