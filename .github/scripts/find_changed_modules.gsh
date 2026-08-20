import (
	"encoding/json"
	"io/fs"
	"os"
	"path/filepath"
	"sort"
)

func formulaDir(module, changedPath string) string {
	dir := filepath.dir(changedPath)
	for dir.hasPrefix(module + "/") {
		matches := filepath.glob(filepath.join(dir, "*_llar.gox"))!
		if matches.len > 0 {
			return dir
		}
		dir = filepath.dir(dir)
	}
	return ""
}

func hasFormula(module string) (bool, error) {
	found := false
	err := filepath.walkDir(module, (_, entry, err) => {
		if err != nil {
			return err
		}
		if !entry.isDir && entry.name.hasSuffix("_llar.gox") {
			found = true
			return fs.SkipAll
		}
		return nil
	})
	if os.isNotExist(err) {
		return false, nil
	}
	return found, err
}

baseSHA := $BASE_SHA
defaultBranch := $DEFAULT_BRANCH
eventName := $EVENT_NAME
headSHA := $HEAD_SHA
refName := $REF_NAME

var diffBase string
if eventName == "pull_request" {
	capout => { git! "merge-base", baseSHA, headSHA }
	diffBase = output.trimSpace
} else if refName == defaultBranch {
	diffBase = baseSHA
} else {
	capout => { git! "merge-base", "origin/"+defaultBranch, headSHA }
	diffBase = output.trimSpace
}

capout => {
	git! "diff", "--name-only", "--diff-filter=ACDMRT", "-z", diffBase, headSHA
}

var modules map[string]bool = {}
var formulaDirs map[string]map[string]bool = {}
for changedPath in output.split("\x00") {
	parts := changedPath.splitN("/", 3)
	if parts.len < 3 {
		continue
	}
	module := parts[0] + "/" + parts[1]
	_, err := os.stat(filepath.join(module, "versions.json"))
	if err != nil {
		if !os.isNotExist(err) {
			panic err
		}
		has := hasFormula(module)!
		if has {
			panic "module ${module} is missing versions.json"
		}
		continue
	}
	modules[module] = true

	dir := formulaDir(module, changedPath)
	if dir != "" {
		dirs := formulaDirs[module]
		if dirs == nil {
			dirs = {}
			formulaDirs[module] = dirs
		}
		dirs[dir] = true
	}
}

changedModules := [module for module, _ in modules]
sort.strings changedModules

for module in changedModules {
	dirs := formulaDirs[module]
	if len(dirs) > 1 {
		changedDirs := [dir for dir, _ in dirs]
		sort.strings changedDirs
		changedDirsText := changedDirs.join(", ")
		panic "module ${module} changes multiple Formula directories: ${changedDirsText}; llar test cannot validate multiple fromVer ranges yet"
	}
}

// TODO: When changed modules depend on each other, test only the leaf modules
// in their dependency graph.
modulesJSON := json.marshal(changedModules)!

outputFile := os.openFile($GITHUB_OUTPUT, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)!
defer outputFile.close()
fprintf! outputFile, "modules=%s\nhas_modules=%t\n", modulesJSON, changedModules.len > 0

summaryFile := os.openFile($GITHUB_STEP_SUMMARY, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)!
defer summaryFile.close()
fprintf! summaryFile, "Changed modules: %s\n", modulesJSON
