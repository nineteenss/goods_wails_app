//go:build windows

package services

import (
	"os/exec"
	"syscall"
)

// startDetached starts a process in the background on Windows without attaching to the current console.
func startDetached(command string, args []string) error {
	cmd := exec.Command(command, args...)
	cmd.SysProcAttr = &syscall.SysProcAttr{
		HideWindow:    true,
		CreationFlags: 0x00000008 | 0x00000200, // DETACHED_PROCESS | CREATE_NEW_PROCESS_GROUP
	}
	return cmd.Start()
}
