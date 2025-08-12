package models

import (
	"time"
)

// Note: Keep field names exported for GORM and Wails bindings.
type Item struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Name      string    `gorm:"not null;index" json:"name"`
	Quantity  int       `gorm:"not null;default:0" json:"quantity"`
	Comment   string    `gorm:"type:text" json:"comment"`
	UpdatedAt time.Time `json:"updated"`
	CreatedAt time.Time `json:"-"`
}

// UpdateStatus represents application update state exposed to the frontend.
// Returned by bound methods and used for simple UI state.
type UpdateStatus struct {
	CurrentVersion string `json:"currentVersion"`
	LatestVersion  string `json:"latestVersion"`
	Available      bool   `json:"available"`
	Downloaded     bool   `json:"downloaded"`
	Error          string `json:"error,omitempty"`
}
