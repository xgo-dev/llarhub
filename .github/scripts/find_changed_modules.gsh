import (
	"encoding/json"
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"sort"
	"strings"
)

func formulaDir(module, changedPath string) string {
	dir := filepath.dir(changedPath)
	for strings.hasPrefix(dir, module+"/") {
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
	err := filepath.walkDir(module, func(_ string, entry fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if !entry.isDir() && strings.hasSuffix(entry.name(), "_llar.gox") {
			found = true
			return fs.SkipAll
		}
		return nil
	})
	return found, err
}

baseSHA := $BASE_SHA
defaultBranch := $DEFAULT_BRANCH
eventName := $EVENT_NAME
headSHA := $HEAD_SHA
refName := $REF_NAME

var diffBase string
if eventName == "pull_request" {
	capout => { git "merge-base", baseSHA, headSHA }
	lastErr!
	diffBase = strings.trimSpace(output)
} else if refName == defaultBranch {
	diffBase = baseSHA
} else {
	capout => { git "merge-base", "origin/"+defaultBranch, headSHA }
	lastErr!
	diffBase = strings.trimSpace(output)
}

capout => {
	git "diff", "--name-only", "--diff-filter=ACDMRT", "-z", diffBase, headSHA
}
lastErr!

var modules map[string]bool = {}
var formulaDirs map[string]map[string]bool = {}
for changedPath in output.split("\x00") {
	parts := strings.splitN(changedPath, "/", 3)
	if parts.len < 3 {
		continue
	}
	module := parts[0] + "/" + parts[1]
	versionsPath := filepath.join(module, "versions.json")
	_, err := os.stat(versionsPath)
	if os.isNotExist(err) {
		has, walkErr := hasFormula(module)
		if os.isNotExist(walkErr) {
			continue
		}
		if walkErr != nil {
			panic walkErr
		}
		if has {
			panic fmt.Sprintf("module %s is missing versions.json", module)
		}
		continue
	}
	if err != nil {
		panic err
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

var changedModules []string = []
changedModules <- [module for module, _ in modules]...
sort.strings changedModules

for module in changedModules {
	dirs := formulaDirs[module]
	if len(dirs) > 1 {
		changedDirs := [dir for dir, _ in dirs]
		sort.strings changedDirs
		panic fmt.Sprintf("module %s changes multiple Formula directories: %s; llar test cannot validate multiple fromVer ranges yet", module, strings.join(changedDirs, ", "))
	}
}

// TODO: When changed modules depend on each other, test only the leaf modules
// in their dependency graph.
modulesJSON := json.marshal(changedModules)!

outputFile := os.openFile($GITHUB_OUTPUT, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)!
defer outputFile.close()
fmt.fprintf! outputFile, "modules=%s\nhas_modules=%t\n", modulesJSON, changedModules.len > 0

summaryFile := os.openFile($GITHUB_STEP_SUMMARY, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)!
defer summaryFile.close()
fmt.fprintf! summaryFile, "Changed modules: %s\n", modulesJSON
