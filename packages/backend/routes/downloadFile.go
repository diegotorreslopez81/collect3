package routes

import (
	"bytes"
	. "collect3/backend/storage"
	. "collect3/backend/utils"
	"encoding/json"
	"errors"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

func DownloadFile(c *gin.Context) {
	var payload DownloadFilePayload
	var err error
	var file string
	storageOption := c.Param("storage")

	Logger.Info("POST /:storage/download", "storage", storageOption)

	err = c.BindJSON(&payload)
	if err != nil {
		Logger.Error("Invalid Request Body", "err", err, "req", c.Request.Body)
		c.String(http.StatusBadRequest, "Invalid Request Body")
		return
	}

	storage, err := GetStorage(storageOption)

	if err != nil {
		Logger.Error("Invalid Storage Option %s", storageOption)
		c.String(http.StatusBadRequest, "Invalid Storage Option "+storageOption)
		return
	}

	file, err = storage.DownloadFile(payload)

	if err != nil {
		LogWithPayload := Logger.With("cid", payload.CID)
		if errors.Is(err, ErrorFailedToCreateClient) {
			LogWithPayload.Error(ErrorFailedToCreateClient)
			c.String(http.StatusInternalServerError, "Failed To Download File")
			return
		}

		if errors.Is(err, ErrorFailedToDownloadFile) {
			LogWithPayload.Error(ErrorFailedToDownloadFile)
			c.String(http.StatusInternalServerError, "Failed To Download File")
			return
		}

		if errors.Is(err, ErrorUnauthorized) {
			LogWithPayload.Error(ErrorUnauthorized)
			c.String(http.StatusUnauthorized, "Unauthorized")
			return
		}
		if errors.Is(err, ErrorNotFound) {
			LogWithPayload.Error(ErrorNotFound)
			c.String(http.StatusNotFound, "File Not Found")
			return
		}
		if errors.Is(err, ErrorNonOkay) {
			LogWithPayload.Error(ErrorNonOkay)
			c.String(http.StatusInternalServerError, "Failed To Download File")
			return
		}

		if errors.Is(err, ErrorFailedToReadFile) {
			LogWithPayload.Error(ErrorFailedToReadFile)
			c.String(http.StatusInternalServerError, "Failed To Read File")
			return
		}
		LogWithPayload.Error("Failed To Download File", "err", err)
		c.String(http.StatusInternalServerError, "Failed To Download File")
		return
	}

	file = strings.ReplaceAll(file, "\\\\", "\\")

	quote := []byte{'"'}
	trimmedData := bytes.TrimPrefix(bytes.TrimSuffix([]byte(file), quote), quote)

	var metadata FullMetadata
	err = json.Unmarshal(trimmedData, &metadata)

	if err != nil {
		Logger.Error("Failed to Unmarshal", "err", err, "rawData", trimmedData)
		c.String(http.StatusInternalServerError, "Failed to Get File")
		return
	}

	c.JSON(http.StatusOK, metadata)
}
