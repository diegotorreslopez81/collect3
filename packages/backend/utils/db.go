package utils

import (
	"database/sql"
	"errors"
	"strings"

	"github.com/jmoiron/sqlx"
	"github.com/mattn/go-sqlite3"
	"github.com/mdobak/go-xerrors"
)

type User struct {
	ID        int64  `db:"id"`
	UID       string `db:"uid"`
	Token     string `db:"auth_token"`
	CreatedAt string `db:"createdAt"`
	UpdatedAt string `db:"updatedAt"`
}

type Content struct {
	CID       string `db:"cid"`
	Storage   string `db:"storage"`
	CreatedAt string `db:"createdAt"`
	UpdatedAt string `db:"updatedAt"`
}
type UserContent struct {
	User_ID     int64  `db:"user_id"`
	Content_CID string `db:"content_cid"`
}

type NFTContent struct {
	ID          int64  `db:"id"`
	UID         string `db:"uid"`
	Content_CID string `db:"content_cid"`
}

type SharedContent struct {
	User_ID     string `db:"user_id"`
	Content_CID string `db:"content_cid"`
}

var (
	ErrDuplicate    = errors.New("record already exists")
	ErrNotExists    = errors.New("row not exists")
	ErrUpdateFailed = errors.New("update failed")
	ErrDeleteFailed = errors.New("delete failed")
)

type SQLiteRepository struct {
	db *sqlx.DB
}

var DB *SQLiteRepository

func OpenDB(driver string, datasource string) (*SQLiteRepository, error) {
	rawdb, err := sqlx.Connect(driver, datasource)
	if err != nil {
		return nil, err
	}
	DB = &SQLiteRepository{db: rawdb}
	return DB, nil
}

func (db *SQLiteRepository) Migrate() {
	setPragma := "PRAGMA foreign_keys;"
	createUserTable := `
    CREATE TABLE IF NOT EXISTS user(
      id         INTEGER PRIMARY KEY NOT NULL, 
      uid        TEXT UNIQUE NOT NULL,
      auth_token TEXT UNIQUE NOT NULL,
      createdAt  DATETIME DEFAULT CURRENT_DATE,
      updatedAt  DATETIME DEFAULT CURRENT_DATE
    );
  `
	createContentTable := `
    CREATE TABLE IF NOT EXISTS content(
      cid       TEXT  PRIMARY KEY NOT NULL,
			storage   TEXT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_DATE,
      updatedAt DATETIME DEFAULT CURRENT_DATE
    );
  `
	createUserContentTable := `
    CREATE TABLE IF NOT EXISTS user_content(
      user_id     INTEGER NOT NULL,
      content_cid TEXT NOT NULL,
      UNIQUE(user_id, content_cid),
      FOREIGN KEY(user_id) REFERENCES user(id) ON DELETE CASCADE,
      FOREIGN KEY(content_cid) REFERENCES content(cid) ON DELETE CASCADE
    );
  `
	createNFTContentTable := `
    CREATE TABLE IF NOT EXISTS nft_content(
			id          INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      uid					TEXT NOT NULL,
      content_cid TEXT NOT NULL,
      UNIQUE(uid, content_cid),
      FOREIGN KEY(content_cid) REFERENCES content(cid) ON DELETE CASCADE
    );
  `

	createSharedContentTable := `
		CREATE TABLE IF NOT EXISTS shared_content(
			user_id     INTEGER NOT NULL,
			content_cid TEXT NOT NULL,
			UNIQUE(user_id, content_cid),
			FOREIGN KEY(user_id) REFERENCES user(id) ON DELETE CASCADE,
			FOREIGN KEY(content_cid) REFERENCES content(cid) ON DELETE CASCADE
		);
	`

	tx := db.db.MustBegin()

	tx.MustExec(setPragma)
	Logger.Info("setting pragma")

	tx.MustExec(createUserTable)
	Logger.Info("setting user table")

	tx.MustExec(createContentTable)
	Logger.Info("setting content table")

	tx.MustExec(createUserContentTable)
	Logger.Info("setting user_content table")

	tx.MustExec(createNFTContentTable)
	Logger.Info("setting nft_content table")

	tx.MustExec(createSharedContentTable)
	Logger.Info("setting shared_content table")

	err := tx.Commit()
	if err != nil {
		Logger.Error(err.Error())
		panic(err)
	}
}

func (db *SQLiteRepository) CreateUser(
	id int64,
	uid string,
	token string,
) error {
	res, err := db.db.Exec("INSERT INTO user(id,uid,auth_token) values(?,?,?)", id, uid, token)
	if err != nil {
		var sqliteErr sqlite3.Error
		if errors.As(err, &sqliteErr) {
			if errors.Is(sqliteErr.ExtendedCode, sqlite3.ErrConstraintUnique) {
				return ErrDuplicate
			}
		}
		return err
	}

	_, err = res.LastInsertId()
	if err != nil {
		return err
	}

	return nil
}

func (db *SQLiteRepository) UpdateToken(id int64, token string) error {
	_, err := db.db.Exec("UPDATE user SET auth_token=? WHERE id=?", token, id)
	if err != nil {
		var sqliteErr sqlite3.Error
		if errors.As(err, &sqliteErr) {
			if errors.Is(sqliteErr.ExtendedCode, sqlite3.ErrConstraintUnique) {
				return ErrDuplicate
			}
		}
		return err
	}

	return nil
}

func (db *SQLiteRepository) GetUserByID(id int64) (User, error) {
	var user User
	err := db.db.Get(&user, "SELECT * FROM user WHERE id=?", id)
	if errors.Is(err, sql.ErrNoRows) {
		return User{}, nil
	}
	if err != nil {
		return User{}, err
	}
	return user, nil
}

func (db *SQLiteRepository) GetUserByUID(uid string) (User, error) {
	var user User
	err := db.db.Get(&user, "SELECT * FROM user WHERE uid=?", uid)
	if errors.Is(err, sql.ErrNoRows) {
		return User{}, nil
	}
	if err != nil {
		return User{}, err
	}
	return user, nil
}

func (db *SQLiteRepository) AllUsers() ([]User, error) {
	var all []User
	err := db.db.Get(&all, "SELECT * FROM user")
	if errors.Is(err, sql.ErrNoRows) {
		return []User{}, nil
	}
	if err != nil {
		return nil, err
	}

	return all, nil
}

func (db *SQLiteRepository) GetContentByCID(cid string) (Content, error) {
	var content Content
	err := db.db.Get(&content, "SELECT * FROM content WHERE cid=?", cid)
	if errors.Is(err, sql.ErrNoRows) {
		return Content{}, nil
	}
	if err != nil {
		return Content{}, err
	}
	return content, nil
}

func (db *SQLiteRepository) CreateContent(cid string, storage string) error {
	res, err := db.db.Exec("INSERT INTO content(cid, storage) values(?,?)", cid, storage)
	if err != nil {
		var sqliteErr sqlite3.Error
		if errors.As(err, &sqliteErr) {
			if errors.Is(sqliteErr.ExtendedCode, sqlite3.ErrConstraintUnique) {
				return ErrDuplicate
			}
		}
		return err
	}

	_, err = res.LastInsertId()
	if err != nil {
		return err
	}

	return nil
}

func (db *SQLiteRepository) CreateUserContent(id int64, cid string) error {
	res, err := db.db.Exec("INSERT INTO user_content(user_id, content_cid) values(?,?)", id, cid)
	if err != nil {
		var sqliteErr sqlite3.Error
		if errors.As(err, &sqliteErr) {
			if errors.Is(sqliteErr.ExtendedCode, sqlite3.ErrConstraintUnique) {
				return ErrDuplicate
			}
		}
		return err
	}

	_, err = res.LastInsertId()
	if err != nil {
		return err
	}

	return nil
}

func (db *SQLiteRepository) UploadContent(uid string, cid string, storage string) error {
	var err error
	user, err := db.GetUserByUID(uid)
	if err != nil {
		return err
	}
	if user == (User{}) {
		return xerrors.New("User Does Not Exist")
	}
	content, err := db.GetContentByCID(cid)
	if err != nil {
		return err
	}
	if content == (Content{}) {
		err = db.CreateContent(cid, storage)
		if err != nil {
			if !errors.Is(err, ErrDuplicate) {
				return err
			}
		}
	}
	err = db.CreateUserContent(user.ID, cid)
	return err
}

func (db *SQLiteRepository) UnlinkContent(uid string, cid string) error {
	var err error

	user, err := db.GetUserByUID(uid)
	if err != nil {
		return err
	}

	if user == (User{}) {
		return ErrNotExists
	}

	res, err := db.db.Exec("DELETE FROM user_content WHERE user_id=? AND content_cid=?", user.ID, cid)

	if err != nil {
		return err
	}

	rowsAffected, err := res.RowsAffected()
	if err != nil {
		return err
	}

	if rowsAffected == 0 {
		return ErrDeleteFailed
	}
	return nil
}

func (db *SQLiteRepository) SetNftUid(uid string, cid string) error {
	res, err := db.db.Exec("INSERT INTO nft_content(uid, content_cid) values(?,?)", uid, cid)
	if err != nil {
		var sqliteErr sqlite3.Error
		if errors.As(err, &sqliteErr) {
			if errors.Is(sqliteErr.ExtendedCode, sqlite3.ErrConstraintUnique) {
				return ErrDuplicate
			}
		}
		return err
	}

	_, err = res.LastInsertId()
	if err != nil {
		return err
	}

	return nil
}

func (db *SQLiteRepository) GetNftCidByUid(uid string) (NFTContent, error) {
	var content NFTContent
	err := db.db.Get(&content, "SELECT * FROM nft_content WHERE uid=?", uid)
	if errors.Is(err, sql.ErrNoRows) {
		return NFTContent{}, nil
	}
	if err != nil {
		return NFTContent{}, err
	}
	return content, nil
}

func (db *SQLiteRepository) GetNftIdByCid(cid string) (NFTContent, error) {
	var content NFTContent
	err := db.db.Get(&content, "SELECT * FROM nft_content WHERE content_cid=?", cid)
	if errors.Is(err, sql.ErrNoRows) {
		return NFTContent{}, nil
	}
	if err != nil {
		return NFTContent{}, err
	}
	return content, nil
}

func (db *SQLiteRepository) GetNextNFTId() (int64, error) {
	var id int64
	err := db.db.Get(&id, "SELECT MAX(id) FROM nft_content")
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return 1, nil
		}
		if strings.Contains(err.Error(), "converting NULL to int64") {
			return 1, nil
		}
		return 0, err
	}
	return id + 1, nil
}

func (db *SQLiteRepository) GetNFTByCid(cid string) (NFTContent, error) {
	var content NFTContent
	err := db.db.Get(&content, "SELECT * FROM nft_content WHERE content_cid=?", cid)
	if errors.Is(err, sql.ErrNoRows) {
		return NFTContent{}, nil
	}
	if err != nil {
		return NFTContent{}, err
	}
	return content, nil
}

func (db *SQLiteRepository) SetSharedContent(cid string, uid string) error {
	var err error
	user, err := db.GetUserByUID(uid)
	if err != nil {
		return err
	}
	if user == (User{}) {
		return nil
	}
	res, err := db.db.Exec("INSERT INTO shared_content(user_id, content_cid) values(?,?)", user.ID, cid)
	if err != nil {
		var sqliteErr sqlite3.Error
		if errors.As(err, &sqliteErr) {
			if errors.Is(sqliteErr.ExtendedCode, sqlite3.ErrConstraintUnique) {
				return ErrDuplicate
			}
		}
		return err
	}

	_, err = res.LastInsertId()
	if err != nil {
		return err
	}

	return nil
}

func (db *SQLiteRepository) DeleteSharedContent(uid string, cid string) error {
	var err error
	user, err := db.GetUserByUID(uid)
	if err != nil {
		return err
	}
	if user == (User{}) {
		return nil
	}
	_, err = db.db.Exec("DELETE FROM shared_content WHERE user_id=? AND content_cid=?", user.ID, cid)
	if err != nil {
		return err
	}
	return nil
}

func (db *SQLiteRepository) GetSharedContentByUid(uid string) ([]SharedContent, error) {
	var content = []SharedContent{}
	var err error
	user, err := db.GetUserByUID(uid)
	if err != nil {
		return []SharedContent{}, err
	}
	if user == (User{}) {
		return []SharedContent{}, nil
	}
	err = db.db.Select(&content, "SELECT * FROM shared_content WHERE user_id=?", user.ID)
	if errors.Is(err, sql.ErrNoRows) {
		return []SharedContent{}, nil
	}
	if err != nil {
		return []SharedContent{}, err
	}
	return content, nil
}
