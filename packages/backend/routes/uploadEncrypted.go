package routes

import (
	. "collect3/backend/storage"
	. "collect3/backend/utils"
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
)

func UploadFileEncrypted(c *gin.Context) {
	var payload UploadFileEncryptedPayload
	var response UploadFileEncryptedResponse
	var err error
	storage := GetFVMEncrypted(FVMApiKey)

	Logger.Info("POST /uploadEncrypted")

	err = c.Request.ParseMultipartForm(32 << 20)
	if err != nil {
		Logger.Error("Failed To Parse MultipartForm", "err", err)
		c.String(http.StatusBadRequest, "Invalid Request Body")
		return
	}

	file, _, err := c.Request.FormFile("file")

	if err != nil {
		Logger.Error("Failed To Get File From Form", err)
		c.String(http.StatusBadRequest, "Invalid Request Body")
		return
	}

	payload.File = file
	payload.UID = c.Request.FormValue("uid")
	payload.AuthToken = c.Request.FormValue("auth_token")

	defer file.Close()

	response, err = storage.UploadFile(payload)

	if err != nil {
		if errors.Is(err, ErrorFailedToParseFile) {
			Logger.Error(err)
			c.String(http.StatusInternalServerError, "Failed to Parse File")
			return
		}

		if errors.Is(err, ErrorFailedToReadFile) {
			Logger.Error(err)
			c.String(http.StatusInternalServerError, "Failed to Read File")
			return
		}

		if errors.Is(err, ErrorFailedToCreateClient) {
			Logger.Error(err)
			c.String(http.StatusInternalServerError, "Failed To Upload File")
			return
		}

		if errors.Is(err, ErrorFailedToUploadFile) {
			Logger.Error(err)
			c.String(http.StatusInternalServerError, "Failed To Upload File")
			return
		}

		if errors.Is(err, ErrorBadRequest) {
			Logger.Error(err)
			c.String(http.StatusBadRequest, "This File May Already Exist")
			return
		}
		if errors.Is(err, ErrorUnauthorized) {
			Logger.Error(err)
			c.String(http.StatusUnauthorized, "Invalid Token")
			return
		}
		if errors.Is(err, ErrorNonOkay) {
			Logger.Error(err)
			c.String(http.StatusInternalServerError, "Something Went Wrong")
			return
		}
		if errors.Is(err, ErrorFailedToReadResponse) {
			Logger.Error(err)
			c.String(http.StatusInternalServerError, "Failed to read response")
			return
		}
		c.String(http.StatusInternalServerError, "Something Went Wrong")
		return
	}

	Logger.Info("Uploaded File", "CID", response.CID)

	err = DB.UploadContent(payload.UID, response.CID, FVMEncryptedOption)
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
	c.JSON(http.StatusOK, gin.H{"cid": response.CID, "name": response.Name})
}
