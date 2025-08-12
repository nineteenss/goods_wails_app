package main

import (
	"context"
	"fmt"
	"goods_wails_app/models"
	"goods_wails_app/services"
	"log"
	"os"
	"path/filepath"
	"time"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// App struct
type App struct {
	ctx context.Context
	db  *services.DatabaseService
	// updater handles version checks and downloads
	updater        *services.UpdaterService
	exePath        string
	currentVersion string
	latestTag      string
	latestAssetURL string
	downloaded     bool
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	// Initialize SQLite database in user config directory
	initDatabase(a)
	// Resolve executable path for updater and DB colocated files
	exePath, err := os.Executable()
	if err != nil || exePath == "" {
		exePath, _ = os.Getwd()
	}
	a.exePath = exePath
	a.updater = services.NewUpdaterService(exePath, "nineteenss", "goods_wails_app")
	// Start background update watcher (check-only; no auto-download/apply)
	go a.backgroundUpdateLoop()
}

// Greet returns a greeting for the given name
func (a *App) Greet(name string) string {
	return fmt.Sprintf("Hello %s, It's show time!", name)
}

// CreateItem creates a new inventory item.
func (a *App) CreateItem(name string, quantity int, comment string) (*models.Item, error) {
	if a.db == nil || a.db.DB == nil {
		return nil, fmt.Errorf("database not initialised")
	}
	item := &models.Item{
		Name:      name,
		Quantity:  quantity,
		Comment:   comment,
		UpdatedAt: time.Now(),
	}
	if err := a.db.DB.Create(item).Error; err != nil {
		return nil, err
	}
	runtime.EventsEmit(a.ctx, "items:changed")
	return item, nil
}

// UpdateItem updates existing item by id.
func (a *App) UpdateItem(id uint, name string, quantity int, comment string) (*models.Item, error) {
	if a.db == nil || a.db.DB == nil {
		return nil, fmt.Errorf("database not initialised")
	}
	var item models.Item
	if err := a.db.DB.First(&item, id).Error; err != nil {
		return nil, err
	}
	item.Name = name
	item.Quantity = quantity
	item.Comment = comment
	item.UpdatedAt = time.Now()
	if err := a.db.DB.Save(&item).Error; err != nil {
		return nil, err
	}
	runtime.EventsEmit(a.ctx, "items:changed")
	return &item, nil
}

// WithdrawQuantity decreases quantity for the item by delta (must be positive).
func (a *App) WithdrawQuantity(id uint, delta int, comment string) (*models.Item, error) {
	if delta <= 0 {
		return nil, fmt.Errorf("delta must be positive")
	}
	if a.db == nil || a.db.DB == nil {
		return nil, fmt.Errorf("database not initialised")
	}
	var item models.Item
	if err := a.db.DB.First(&item, id).Error; err != nil {
		return nil, err
	}
	if item.Quantity < delta {
		return nil, fmt.Errorf("insufficient quantity")
	}
	item.Quantity -= delta
	if comment != "" {
		item.Comment = comment
	}
	item.UpdatedAt = time.Now()
	if err := a.db.DB.Save(&item).Error; err != nil {
		return nil, err
	}
	runtime.EventsEmit(a.ctx, "items:changed")
	return &item, nil
}

// ListItems returns all items ordered by name.
func (a *App) ListItems() ([]models.Item, error) {
	if a.db == nil || a.db.DB == nil {
		return nil, fmt.Errorf("database not initialised")
	}
	var items []models.Item
	if err := a.db.DB.Order("name asc").Find(&items).Error; err != nil {
		return nil, err
	}
	return items, nil
}

// initDatabase resolves an OS-specific config directory and initializes the DB.
// Separated for clarity and easier testing.
func initDatabase(a *App) {
	// Store DB next to the app executable
	exePath, err := os.Executable()
	if err != nil || exePath == "" {
		// Fallback: current working directory
		exePath, _ = os.Getwd()
	}
	appDir := filepath.Dir(exePath)
	if mkErr := os.MkdirAll(appDir, 0o755); mkErr != nil {
		log.Printf("failed to ensure app dir %s: %v", appDir, mkErr)
	}

	dbService, err := services.NewDatabaseService(appDir, "inventory.db")
	if err != nil {
		log.Printf("failed to init db: %v", err)
		return
	}
	a.db = dbService

	if err := a.db.DB.AutoMigrate(&models.Item{}); err != nil {
		log.Printf("auto migrate error: %v", err)
	}
}

// SetCurrentVersion sets the current app version (provided by the frontend package.json)
func (a *App) SetCurrentVersion(version string) {
	a.currentVersion = version
}

// CheckForUpdates checks GitHub releases and returns update status.
func (a *App) CheckForUpdates(currentVersion string) (models.UpdateStatus, error) {
	if currentVersion != "" {
		a.currentVersion = currentVersion
	}
	if a.updater == nil {
		return models.UpdateStatus{CurrentVersion: a.currentVersion, Error: "updater not initialised"}, nil
	}
	tag, assetURL, err := a.updater.CheckLatest(a.ctx)
	if err != nil {
		return models.UpdateStatus{CurrentVersion: a.currentVersion, Error: err.Error()}, nil
	}
	a.latestTag = tag
	a.latestAssetURL = assetURL
	available := false
	if tag != "" && a.currentVersion != "" {
		available = services.SemverIsNewer(a.currentVersion, tag)
	}
	status := models.UpdateStatus{
		CurrentVersion: a.currentVersion,
		LatestVersion:  tag,
		Available:      available,
		Downloaded:     a.downloaded,
	}
	return status, nil
}

// DownloadUpdate downloads the latest release asset in the background.
func (a *App) DownloadUpdate() (models.UpdateStatus, error) {
	if a.updater == nil {
		return models.UpdateStatus{CurrentVersion: a.currentVersion, Error: "updater not initialised"}, nil
	}
	if a.latestAssetURL == "" {
		// Refresh latest first
		if _, _, err := a.updater.CheckLatest(a.ctx); err != nil {
			return models.UpdateStatus{CurrentVersion: a.currentVersion, Error: err.Error()}, nil
		}
	}
	if a.latestAssetURL == "" {
		return models.UpdateStatus{CurrentVersion: a.currentVersion, LatestVersion: a.latestTag, Available: false}, nil
	}
	// Emit progress events while downloading
	_, err := a.updater.DownloadToNewWithProgress(a.ctx, a.latestAssetURL, func(downloaded, total int64) {
		// total may be -1; send -1 to frontend and let it show indeterminate
		runtime.EventsEmit(a.ctx, "update:progress", downloaded, total)
	})
	if err != nil {
		return models.UpdateStatus{CurrentVersion: a.currentVersion, LatestVersion: a.latestTag, Available: true, Error: err.Error()}, nil
	}
	a.downloaded = true
	runtime.EventsEmit(a.ctx, "update:downloaded")
	return models.UpdateStatus{CurrentVersion: a.currentVersion, LatestVersion: a.latestTag, Available: true, Downloaded: true}, nil
}

// ApplyAndRestart will replace the executable with the downloaded one and relaunch the app.
func (a *App) ApplyAndRestart() error {
	if a.updater == nil {
		return fmt.Errorf("updater not initialised")
	}
	if err := a.updater.PlanApplyOnExit(); err != nil {
		return err
	}
	// Quit the app; the helper will replace and relaunch
	go func() {
		// slight delay to allow response to return
		time.Sleep(200 * time.Millisecond)
		runtime.Quit(a.ctx)
	}()
	return nil
}

// backgroundUpdateLoop periodically checks for updates and downloads them silently.
func (a *App) backgroundUpdateLoop() {
	ticker := time.NewTicker(6 * time.Hour)
	defer ticker.Stop()
	for {
		// Do an initial short delay to avoid competing with startup
		select {
		case <-time.After(30 * time.Second):
		case <-a.ctx.Done():
			return
		}

		if a.currentVersion != "" && a.updater != nil {
			tag, assetURL, err := a.updater.CheckLatest(a.ctx)
			if err == nil && tag != "" && services.SemverIsNewer(a.currentVersion, tag) {
				a.latestTag = tag
				a.latestAssetURL = assetURL
				runtime.EventsEmit(a.ctx, "update:available", tag)
				// No auto-download/apply. The user must click the button to download and apply.
			}
		}

		select {
		case <-ticker.C:
			continue
		case <-a.ctx.Done():
			return
		}
	}
}
