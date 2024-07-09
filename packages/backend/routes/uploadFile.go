package routes

import (
	. "collect3/backend/storage"
	. "collect3/backend/utils"
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
)

func UploadFile(c *gin.Context) {
	var payload UploadFilePayload
	var response UploadFileResponse
	var err error
	storageOption := c.Param("storage")

	Logger.Info("POST /:storage/upload", "storage", storageOption)

	err = c.BindJSON(&payload)
	if err != nil {
		Logger.Error(
			"Invalid Request Body",
			"err", err,
			"res.Body", c.Request.Body,
		)
		c.String(http.StatusBadRequest, "Invalid Request Body")
		return
	}

	storage, err := GetStorage(storageOption)

	if err != nil {
		Logger.Error(
			"Invalid Storage Option",
			"err", err,
			"storage", storageOption,
		)
		c.String(http.StatusBadRequest, "Invalid Storage Option "+storageOption)
		return
	}

	response, err = storage.UploadFile(payload)

	if err != nil {
		LogWithPayload := Logger.With("uid", payload.UID)
		if errors.Is(err, ErrorFailedToParseFile) {
			LogWithPayload.Error(err)
			c.String(http.StatusInternalServerError, "Failed to Parse File")
			return
		}

		if errors.Is(err, ErrorFailedToReadFile) {
			LogWithPayload.Error(err)
			c.String(http.StatusInternalServerError, "Failed to Read File")
			return
		}

		if errors.Is(err, ErrorFailedToCreateClient) {
			LogWithPayload.Error(err)
			c.String(http.StatusInternalServerError, "Failed To Upload File")
			return
		}

		if errors.Is(err, ErrorFailedToUploadFile) {
			LogWithPayload.Error(err)
			c.String(http.StatusInternalServerError, "Failed To Upload File")
			return
		}

		if errors.Is(err, ErrorBadRequest) {
			LogWithPayload.Error(err)
			c.String(http.StatusBadRequest, "This File May Already Exist")
			return
		}
		if errors.Is(err, ErrorUnauthorized) {
			LogWithPayload.Error(err)
			c.String(http.StatusUnauthorized, "Invalid Token")
			return
		}
		if errors.Is(err, ErrorNonOkay) {
			LogWithPayload.Error(err)
			c.String(http.StatusInternalServerError, "Something Went Wrong")
			return
		}
		if errors.Is(err, ErrorFailedToReadResponse) {
			LogWithPayload.Error(err)
			c.String(http.StatusInternalServerError, "Failed to read response")
			return
		}
		c.String(http.StatusInternalServerError, "Something Went Wrong")
		return
	}

	Logger.Info("Uploaded File", "CID", response.CID)

	err = DB.UploadContent(payload.UID, response.CID, storageOption)
	if err != nil {
		if errors.Is(err, ErrDuplicate) {
			c.JSON(http.StatusOK, gin.H{"cid": response.CID})
			return
		}
		Logger.Error(
			"Failed To Insert CID In DB",
			"err", err,
			"cid", response.CID,
			"uid", payload.UID,
		)

		c.String(http.StatusInternalServerError, "Something Went Wrong")
		return
	}
	c.JSON(http.StatusOK, gin.H{"cid": response.CID})
}
