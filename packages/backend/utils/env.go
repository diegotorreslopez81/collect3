package utils

import (
	"fmt"
	"os"

	"github.com/joho/godotenv"
)

var isEnvLoaded = false

func GetEnvVar(key string) string {
	var err error
	if !isEnvLoaded {
		err = godotenv.Load(".env")
		if err != nil {
			Logger.Error("Error Loading .env", err)
		}
		isEnvLoaded = true
	}
	Logger.Info(fmt.Sprintf("getting %s", key))

	return os.Getenv(key)
}
