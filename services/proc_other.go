//go:build !windows

package services

import "errors"

func startDetached(command string, args []string) error {
	return errors.New("detached process start is only implemented on Windows in this project")
}
