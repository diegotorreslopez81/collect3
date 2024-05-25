package main

import (
	. "collect3/backend/routes"
	. "collect3/backend/storage"
	. "collect3/backend/utils"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"os"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/mdobak/go-xerrors"
)

var db_connection = GetEnvVar("DB_CONNECTION")
var host = GetEnvVar("HOST")
var port = GetEnvVar("PORT")
var gin_realease = GetEnvVar("GIN_RELEASE")
var tls_cert = GetEnvVar("TLS_CERT")
var tls_key = GetEnvVar("TLS_KEY")

func main() {
	slog.SetDefault(Logger)
	if gin_realease == "true" {
		gin.SetMode(gin.ReleaseMode)
	}
	key := GetEnvVar("NFT_STORAGE_API_KEY")
	if key != "" {
		SetFileCoinApiKey(key)
	}

	key = GetEnvVar("LIGHTHOUSE_API_KEY")
	if key != "" {
		SetFVMApiKey(key)
	}
	key = GetEnvVar("ADMIN_S5_KEY")

	if key == "" {
		Logger.Error("No S5 Key")
		panic("No S5 Key")
	}
	SetS5ApiKey(key)

	router := gin.Default()

	config := cors.DefaultConfig()
	config.AllowAllOrigins = true
	config.AllowMethods = []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}
	config.AllowHeaders = []string{"Origin", "Content-Type", "Authorization"}

	router.Use(cors.New(config))

	//TODO: Handle properly the 401 errors
	router.GET("/ping", ping)
	router.GET("/:storage/available", IsStorageAvailable)
	router.GET("/nft/:uid", GetUri)
	router.GET("/nft/id/:cid", GetNftId)
	router.GET("/nft/metadata/:cid", GetNftMetadata)
	router.GET("/share/:cid/:uid", GetSharedContent)
	router.DELETE("/share/:cid/:uid", DeleteSharedContent)
	router.POST("/nft", SetUriToFile)
	router.POST("/account_exist", AccountExist)
	router.POST("/create_account", CreateAccount)
	router.POST("/create_token", CreateToken)
	router.POST("/:storage/upload", UploadFile)
	router.POST("/:storage/download", DownloadFile)
	router.POST("/delete", DeleteForUser)
	router.POST("/uploadEncrypted", UploadFileEncrypted)
	router.POST("/share", ShareContent)

	db, err := OpenDB("sqlite3", db_connection)
	if err != nil {
		Logger.Error(
			"Failed To Open DB",
			slog.String(
				"Details",
				err.Error(),
			),
		)
		os.Exit(1)
	}

	//this can panic on error
	db.Migrate()

	user, err := db.GetUserByID(1)
	if err != nil {
		Logger.Error(
			"Failed to get the id 1 account",
			slog.String(
				"Details",
				err.Error(),
			),
		)
		os.Exit(1)
	}

	if user == (User{}) {
		s5Key := GetEnvVar("ADMIN_S5_KEY")
		url := "http://localhost:5050/s5/admin/accounts/new_auth_token?id=1"

		req, err := http.NewRequest(http.MethodPost, url, nil)
		if err != nil {
			Logger.Error(
				xerrors.WithStackTrace(err, 0).Error(),
			)
			panic(err)
		}

		req.Header.Add(
			"Authorization",
			fmt.Sprintf(
				"Bearer %s",
				s5Key,
			),
		)
		res, err := http.DefaultClient.Do(req)
		if err != nil {
			Logger.Error(
				xerrors.WithStackTrace(err, 0).Error(),
			)
			panic(err)
		}

		var tokenResponse CreateTokenResponse
		err = json.NewDecoder(res.Body).Decode(&tokenResponse)
		if err != nil {
			defer res.Body.Close()
			bodyBytes, err := io.ReadAll(res.Body)
			var bodyString = ""
			if err == nil {
				bodyString = string(bodyBytes)
			}
			Logger.Error(
				fmt.Sprintf("Failed To Create Auth Token, Status %d", res.StatusCode),
				slog.Any(
					"StackTrace",
					xerrors.WithStackTrace(
						xerrors.New("Error"),
						0,
					).Error(),
				),
				slog.String(
					"Response.Body",
					bodyString,
				),
			)

			panic(err)
		}

		//s5-node admin account
		err = db.CreateUser(1, "admin", tokenResponse.AuthToken)
		if err != nil {
			Logger.Error(
				"Failed to create the id 1 account",
				slog.String(
					"Details",
					err.Error(),
				),
			)
			os.Exit(1)
		}
	}

	if tls_cert != "" {
		err = router.RunTLS(":"+port, tls_cert, tls_key)
		if err != nil {
			Logger.Error("Failed To Run With TLS")
			panic(err)
		}
	}
	err = router.Run(host + ":" + port)
	if err != nil {
		Logger.Error(
			xerrors.WithStackTrace(err, 0).Error(),
		)
		os.Exit(1)
	}
}

func ping(c *gin.Context) {
	c.String(http.StatusOK, "pong")
}
