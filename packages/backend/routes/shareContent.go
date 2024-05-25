package routes

import (
	. "collect3/backend/utils"
	"errors"
	"log/slog"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/mdobak/go-xerrors"
)

type ShareContentPayload struct {
	UID string `json:"uid"`
	CID string `json:"cid"`
}

func ShareContent(c *gin.Context) {
	var payload ShareContentPayload
	var err error

	err = c.BindJSON(&payload)
	if err != nil {
		Logger.Error(
			xerrors.WithStackTrace(err, 0).Error(),
		)
		c.String(http.StatusBadRequest, "Invalid Request Body")
		return
	}

	err = DB.SetSharedContent(payload.CID, payload.UID)
	if err != nil {
		if errors.Is(err, ErrDuplicate) {
			c.JSON(http.StatusOK, gin.H{"cid": payload.CID})
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
	c.JSON(http.StatusOK, gin.H{"cid": payload.CID})
}
