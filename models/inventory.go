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
