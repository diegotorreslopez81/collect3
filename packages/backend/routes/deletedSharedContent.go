package routes

import (
	. "collect3/backend/utils"
	"errors"
	"log/slog"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/mdobak/go-xerrors"
)

func DeleteSharedContent(c *gin.Context) {
	var err error

	CID := c.Param("cid")
	UID := c.Param("uid")

	if CID == "" || UID == "" {
		c.String(http.StatusBadRequest, "Missing Parameters")
		return
	}

	err = DB.DeleteSharedContent(UID, CID)
	if err != nil {
		if errors.Is(err, ErrDuplicate) {
			c.JSON(http.StatusOK, gin.H{"cid": CID})
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
	c.JSON(http.StatusOK, gin.H{"cid": CID})
}
