package db

import (
	"database/sql"
	"log"

	_ "github.com/mattn/go-sqlite3"
)

type DBService struct {
	Conn *sql.DB
}

func NewDBService(dbPath string) (*DBService, error) {
	conn, err := sql.Open("sqlite3", dbPath)
	if err != nil {
		return nil, err
	}

	if err := conn.Ping(); err != nil {
		return nil, err
	}

	log.Println("Database connected:", dbPath)
	return &DBService{Conn: conn}, nil
}
