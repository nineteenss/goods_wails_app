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
}

// Greet returns a greeting for the given name
func (a *App) Greet(name string) string {
	return fmt.Sprintf("Hello %s, It's show time!", name)
}

// CreateItem creates a new inventory item.
func (a *App) CreateItem(name string, quantity int, comment string) (*models.Item, error) {
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
