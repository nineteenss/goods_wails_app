package services

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"runtime"
	"strconv"
	"strings"
	"time"
)

// UpdaterService handles checking and downloading application updates from GitHub Releases.
type UpdaterService struct {
	httpClient  *http.Client
	repoOwner   string
	repoName    string
	assetFilter *regexp.Regexp
	exePath     string
}

// NewUpdaterService constructs a new updater for the given executable path.
// repoOwner/repoName specify the GitHub repository to check.
func NewUpdaterService(exePath string, repoOwner string, repoName string) *UpdaterService {
	// Attempt to pick a reasonable asset filter for Windows .exe
	// The filter will match assets containing repo name and .exe
	pattern := fmt.Sprintf(`(?i)%s.*\.exe$`, regexp.QuoteMeta(repoName))
	if runtime.GOOS != "windows" {
		// Fallback to any asset for non-Windows, though this project targets Windows per workspace
		pattern = fmt.Sprintf(`(?i)%s`, regexp.QuoteMeta(repoName))
	}
	return &UpdaterService{
		httpClient:  &http.Client{Timeout: 20 * time.Second},
		repoOwner:   repoOwner,
		repoName:    repoName,
		assetFilter: regexp.MustCompile(pattern),
		exePath:     exePath,
	}
}

type githubRelease struct {
	TagName string        `json:"tag_name"`
	Assets  []githubAsset `json:"assets"`
}

type githubAsset struct {
	Name               string `json:"name"`
	BrowserDownloadURL string `json:"browser_download_url"`
}

// CheckLatest queries GitHub for the latest release and returns tag and asset URL if any.
func (u *UpdaterService) CheckLatest(ctx context.Context) (tag string, assetURL string, err error) {
	apiURL := fmt.Sprintf("https://api.github.com/repos/%s/%s/releases/latest", u.repoOwner, u.repoName)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, apiURL, nil)
	if err != nil {
		return "", "", err
	}
	req.Header.Set("Accept", "application/vnd.github+json")

	resp, err := u.httpClient.Do(req)
	if err != nil {
		return "", "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNotFound {
		// No releases yet
		return "", "", nil
	}
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return "", "", fmt.Errorf("github api status: %d", resp.StatusCode)
	}

	var rel githubRelease
	if err := json.NewDecoder(resp.Body).Decode(&rel); err != nil {
		return "", "", err
	}

	// pick best asset
	for _, a := range rel.Assets {
		if u.assetFilter.MatchString(a.Name) {
			return rel.TagName, a.BrowserDownloadURL, nil
		}
	}

	// If not matched, but assets exist, return the first as a fallback
	if len(rel.Assets) > 0 {
		return rel.TagName, rel.Assets[0].BrowserDownloadURL, nil
	}

	// No assets; still return tag but empty url
	return rel.TagName, "", nil
}

// semverIsNewer returns true if b is newer than a.
// Accepts versions with optional leading 'v'. Non-numeric identifiers are treated as 0.
func SemverIsNewer(a, b string) bool {
	strip := func(s string) string { return strings.TrimPrefix(strings.TrimSpace(s), "v") }
	pa := strings.Split(strip(a), ".")
	pb := strings.Split(strip(b), ".")
	// normalize to length 3
	for len(pa) < 3 {
		pa = append(pa, "0")
	}
	for len(pb) < 3 {
		pb = append(pb, "0")
	}
	for i := 0; i < 3; i++ {
		ai, _ := strconv.Atoi(nonNegInt(pa[i]))
		bi, _ := strconv.Atoi(nonNegInt(pb[i]))
		if bi > ai {
			return true
		}
		if bi < ai {
			return false
		}
	}
	return false
}

func nonNegInt(s string) string {
	// strip any non-digits
	var b strings.Builder
	for _, r := range s {
		if r >= '0' && r <= '9' {
			b.WriteRune(r)
		} else {
			break
		}
	}
	if b.Len() == 0 {
		return "0"
	}
	return b.String()
}

// DownloadToNew downloads the asset to a side-by-side ".new" file next to the executable.
func (u *UpdaterService) DownloadToNew(ctx context.Context, assetURL string) (string, error) {
	if assetURL == "" {
		return "", errors.New("empty asset url")
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, assetURL, nil)
	if err != nil {
		return "", err
	}
	// GitHub asset URLs are direct; just download bytes
	resp, err := u.httpClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return "", fmt.Errorf("download status: %d", resp.StatusCode)
	}

	newPath := u.exePath + ".new"
	tmpPath := filepath.Join(filepath.Dir(u.exePath), ".partial-download")
	f, err := os.Create(tmpPath)
	if err != nil {
		return "", err
	}
	if _, err := io.Copy(f, resp.Body); err != nil {
		f.Close()
		os.Remove(tmpPath)
		return "", err
	}
	if err := f.Close(); err != nil {
		os.Remove(tmpPath)
		return "", err
	}
	if err := os.Rename(tmpPath, newPath); err != nil {
		os.Remove(tmpPath)
		return "", err
	}
	return newPath, nil
}

// PlanApplyOnExit spawns a background PowerShell that will wait for this process to exit
// and then atomically replace the current executable with the downloaded .new file.
func (u *UpdaterService) PlanApplyOnExit() error {
	if runtime.GOOS != "windows" {
		return errors.New("apply on exit is implemented for windows only in this project")
	}

	newPath := u.exePath + ".new"
	if _, err := os.Stat(newPath); err != nil {
		return fmt.Errorf("no pending update: %w", err)
	}

	pid := os.Getpid()
	// PowerShell script: wait for PID, rotate files, replace, cleanup
	script := fmt.Sprintf(`
$pidToWait = %d
$exe = '%s'
$new = '%s'
try { Wait-Process -Id $pidToWait } catch {}
Start-Sleep -Milliseconds 300
try { Move-Item -Force -ErrorAction SilentlyContinue -Path $exe -Destination ($exe + '.old') } catch {}
Move-Item -Force -Path $new -Destination $exe
Remove-Item -Force -ErrorAction SilentlyContinue ($exe + '.old')
Start-Process -FilePath $exe
`, pid, escapePS(u.exePath), escapePS(newPath))

	// Write to a temp .ps1 and run hidden
	tempDir := os.TempDir()
	psPath := filepath.Join(tempDir, fmt.Sprintf("wails_updater_%d.ps1", time.Now().UnixNano()))
	if err := os.WriteFile(psPath, []byte(script), 0o600); err != nil {
		return err
	}

	// Use powershell if available, fallback to pwsh
	shell := "powershell"
	if _, err := os.Stat("C:/Program Files/PowerShell/7/pwsh.exe"); err == nil {
		shell = "C:/Program Files/PowerShell/7/pwsh.exe"
	}

	// Start process detached
	// We avoid using exec.Command here to keep this service independent of syscall on Go <1.21
	// Using Start-Process from inline is more complex; rely on OS association
	return startDetached(shell, []string{"-NoProfile", "-ExecutionPolicy", "Bypass", "-WindowStyle", "Hidden", "-File", psPath})
}

// escapePS escapes single quotes for PowerShell single-quoted strings
func escapePS(s string) string {
	return strings.ReplaceAll(s, "'", "''")
}
