package services

import (
	"fmt"
	"path/filepath"

    "github.com/glebarez/sqlite"
	"gorm.io/gorm"
)

// DatabaseService encapsulates GORM DB instance.
type DatabaseService struct {
	DB *gorm.DB
}

// NewDatabaseService initializes a SQLite database in the given directory.
func NewDatabaseService(appDataDir string, dbName string) (*DatabaseService, error) {
	dbPath := filepath.Join(appDataDir, dbName)
	db, err := gorm.Open(sqlite.Open(dbPath), &gorm.Config{})
	if err != nil {
		return nil, fmt.Errorf("open db: %w", err)
	}
	return &DatabaseService{DB: db}, nil
}
