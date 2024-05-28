package routes

import (
	. "collect3/backend/storage"
	. "collect3/backend/utils"
	"errors"
	"log/slog"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/mdobak/go-xerrors"
)

func UploadFileEncrypted(c *gin.Context) {
	var payload UploadFileEncryptedPayload
	var response UploadFileEncryptedResponse
	var err error
	storage := GetFVMEncrypted(FVMApiKey)

	err = c.Request.ParseMultipartForm(32 << 20)
	if err != nil {
		Logger.Error(
			xerrors.WithStackTrace(err, 0).Error(),
		)
		c.String(http.StatusBadRequest, "Invalid Request Body")
		return
	}
	file, _, err := c.Request.FormFile("file")

	payload.File = file
	payload.UID = c.Request.FormValue("uid")
	payload.AuthToken = c.Request.FormValue("auth_token")

	if err != nil {
		Logger.Error(
			xerrors.WithStackTrace(err, 0).Error(),
		)
		c.String(http.StatusBadRequest, "Invalid Request Body")
		return
	}

	defer file.Close()

	response, err = storage.UploadFile(payload)

	if err != nil {
		if errors.Is(err, ErrorFailedToParseFile) {
			Logger.Error(
				xerrors.WithStackTrace(err, 0).Error(),
			)
			c.String(http.StatusInternalServerError, "Failed to Parse File")
			return
		}

		if errors.Is(err, ErrorFailedToReadFile) {
			Logger.Error(
				xerrors.WithStackTrace(err, 0).Error(),
			)
			c.String(http.StatusInternalServerError, "Failed to Read File")
			return
		}

		if errors.Is(err, ErrorFailedToCreateClient) {
			Logger.Error(
				xerrors.WithStackTrace(err, 0).Error(),
			)
			c.String(http.StatusInternalServerError, "Failed To Upload File")
			return
		}

		if errors.Is(err, ErrorFailedToUploadFile) {
			Logger.Error(
				xerrors.WithStackTrace(err, 0).Error(),
			)
			c.String(http.StatusInternalServerError, "Failed To Upload File")
			return
		}

		if errors.Is(err, ErrorBadRequest) {
			c.String(http.StatusBadRequest, "This File May Already Exist")
			return
		}
		if errors.Is(err, ErrorUnauthorized) {
			c.String(http.StatusUnauthorized, "Invalid Token")
			return
		}
		if errors.Is(err, ErrorNonOkay) {
			c.String(http.StatusInternalServerError, "Something Went Wrong")
			return
		}
		if errors.Is(err, ErrorFailedToReadResponse) {
			Logger.Error(
				xerrors.WithStackTrace(err, 0).Error(),
			)
			c.String(http.StatusInternalServerError, "Failed to read response")
			return
		}
		c.String(http.StatusInternalServerError, "Something Went Wrong")
		return
	}

	Logger.Info(
		"Uploaded File",
		slog.String(
			"CID",
			response.CID,
		),
	)

	err = DB.UploadContent(payload.UID, response.CID, FVMEncryptedOption)
	if err != nil {
		if errors.Is(err, ErrDuplicate) {
			c.JSON(http.StatusOK, gin.H{"cid": response.CID})
			return
		}
		Logger.Error(
			"Failed To Insert CID In DB",
			slog.String(
				"Details",
				xerrors.WithStackTrace(err, 0).Error(),
			),
		)
		c.String(http.StatusInternalServerError, "Something Went Wrong")
		return
	}
	c.JSON(http.StatusOK, gin.H{"cid": response.CID, "name": response.Name})
}
