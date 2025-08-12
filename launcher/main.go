//go:build windows

package main

import (
	"flag"
	"fmt"
	"io/fs"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"syscall"
	"time"
)

func main() {
	exePathFlag := flag.String("exe", "", "Path to target executable to relaunch")
	newPathFlag := flag.String("new", "", "Path to downloaded replacement (.new) file")
	waitFlag := flag.Duration("wait", 60*time.Second, "Maximum time to wait for swap")
	logFlag := flag.String("log", "", "Optional path to log file")
	flag.Parse()

	// resolve base directory
	self, _ := os.Executable()
	baseDir := filepath.Dir(self)
	if *exePathFlag == "" {
		// infer from our directory: goods_wails_app.exe next to launcher
		*exePathFlag = filepath.Join(baseDir, "goods_wails_app.exe")
	}
	if *newPathFlag == "" {
		*newPathFlag = *exePathFlag + ".new"
	}

	// default log path
	if *logFlag == "" {
		*logFlag = filepath.Join(baseDir, "launcher.log")
	}
	f, _ := os.OpenFile(*logFlag, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0o600)
	log := func(s string) {
		if f == nil {
			return
		}
		t := time.Now().Format("2006-01-02T15:04:05")
		_, _ = f.WriteString(fmt.Sprintf("[%s] %s\n", t, s))
	}
	if f != nil {
		defer f.Close()
	}

	deadline := time.Now().Add(*waitFlag)

	// If there is no .new, just launch the app normally and exit
	if _, err := os.Stat(*newPathFlag); err != nil {
		target := resolveTarget(*exePathFlag, baseDir, log)
		log("no .new; launching: " + target)
		launchVisible(target)
		return
	}

	// Try swap loop
	for {
		// Try to move current exe to .old
		oldPath := *exePathFlag + ".old"
		_ = os.Remove(oldPath)
		if err := os.Rename(*exePathFlag, oldPath); err != nil {
			if time.Now().After(deadline) {
				log("rename exe->old failed: " + err.Error())
				return
			}
			time.Sleep(250 * time.Millisecond)
			continue
		}

		// Move new -> exe
		if err := os.Rename(*newPathFlag, *exePathFlag); err != nil {
			// Try to restore original exe
			_ = os.Rename(oldPath, *exePathFlag)
			log("rename new->exe failed: " + err.Error())
			return
		}

		// Cleanup old silently
		_ = os.Remove(oldPath)
		break
	}

	// Relaunch target hidden
	target := resolveTarget(*exePathFlag, baseDir, log)
	log("swap done; launching: " + target)
	launchVisible(target)
}

func launchVisible(path string) {
	cmd := exec.Command(path)
	// Visible window for the GUI app
	cmd.SysProcAttr = &syscall.SysProcAttr{}
	cmd.Dir = filepath.Dir(path)
	if err := cmd.Start(); err != nil {
		// best-effort fallback to ShellExecute via start
		_ = exec.Command("cmd", "/c", "start", "", path).Start()
	}
}

// resolveTarget returns a valid app exe path. If the provided path doesn't exist,
// it tries to find any .exe in the same folder except this launcher.
func resolveTarget(preferred string, dir string, log func(string)) string {
	if fi, err := os.Stat(preferred); err == nil && !fi.IsDir() {
		return preferred
	}
	// scan for an exe next to us
	entries, err := os.ReadDir(dir)
	if err != nil {
		log("readdir failed: " + err.Error())
		return preferred
	}
	selfBase := strings.ToLower(filepath.Base(os.Args[0]))
	var fallback string
	_ = fs.ValidPath
	for _, e := range entries {
		name := e.Name()
		lower := strings.ToLower(name)
		if strings.HasSuffix(lower, ".exe") && lower != selfBase {
			// prefer goods_wails_app.exe if present
			if lower == "goods_wails_app.exe" {
				return filepath.Join(dir, name)
			}
			if fallback == "" {
				fallback = filepath.Join(dir, name)
			}
		}
	}
	if fallback != "" {
		return fallback
	}
	return preferred
}
