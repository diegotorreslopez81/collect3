package main

import (
	. "collect3/backend/routes"
	. "collect3/backend/storage"
	. "collect3/backend/utils"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	//setup login
	logFile, err := os.OpenFile("./logs.txt", os.O_APPEND|os.O_RDWR|os.O_CREATE, 0644)
	if err != nil {
		fmt.Printf("failed to create log file: %s, \n", err)
		panic(err)
	}
	defer logFile.Close()
	InitLogger(logFile)

	var db_connection = GetEnvVar("DB_CONNECTION")
	var host = GetEnvVar("HOST")
	var port = GetEnvVar("PORT")
	var gin_realease = GetEnvVar("GIN_RELEASE")
	var tls_cert = GetEnvVar("TLS_CERT")
	var tls_key = GetEnvVar("TLS_KEY")

	//setup env variables
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
		Logger.Fatal("No S5 Key")
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
	router.GET("/share/:uid", GetSharedContent)
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
		Logger.Fatal("Failed To Open DB", "Details", err.Error())
	}

	//WARNING: this can panic on error
	db.Migrate()

	user, err := db.GetUserByID(1)
	if err != nil {
		Logger.Fatal("Failed to get the id 1 account", "Details", err.Error())
	}

	if user == (User{}) {
		s5Key := GetEnvVar("ADMIN_S5_KEY")
		url := "http://localhost:5050/s5/admin/accounts/new_auth_token?id=1"

		req, err := http.NewRequest(http.MethodPost, url, nil)
		if err != nil {
			Logger.Fatal("Error Creating Request To Init Admin", "error", err)
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
			Logger.Fatal("Failed To Init Admin", err)
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
			Logger.Fatal(
				fmt.Sprintf("Failed To Create Auth Token For Admin, Status %d", res.StatusCode),
				"Response.Body",
				bodyString,
			)
		}

		//s5-node admin account
		err = db.CreateUser(1, "admin", tokenResponse.AuthToken)
		if err != nil {
			Logger.Fatal("Failed to create the id 1 Admin account", "Details", err)
		}
	}

	if tls_cert != "" {
		err = router.RunTLS(":"+port, tls_cert, tls_key)
		if err != nil {
			Logger.Fatal("Failed To Run With TLS")
		}
	}
	err = router.Run(host + ":" + port)
	if err != nil {
		Logger.Fatal("Failed To Start Server", err)
	}
}

func ping(c *gin.Context) {
	c.String(http.StatusOK, "pong")
}
