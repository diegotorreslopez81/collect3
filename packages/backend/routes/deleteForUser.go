package routes

import (
	. "collect3/backend/utils"
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
)

type DeleteForUserPayload struct {
	UID string `json:"uid"`
	CID string `json:"cid"`
}

func DeleteForUser(c *gin.Context) {
	var payload DeleteForUserPayload
	err := c.BindJSON(&payload)
	if err != nil {
		Logger.Error("Invalid Request Body", "err", err, "req", c.Request.Body)
		c.String(http.StatusBadRequest, "Invalid Request Body")
		return
	}

	err = DB.UnlinkContent(payload.UID, payload.CID)
	if err != nil {
		if errors.Is(err, ErrNotExists) {
			Logger.Error(
				"User Does Not Exist",
				"err", err,
				"uid", payload.UID,
				"cid", payload.CID,
			)
			c.String(http.StatusBadRequest, "User Does Not Exist")
			return
		}
		if errors.Is(err, ErrDeleteFailed) {
			Logger.Error(
				"File Does Not Exist",
				"err", err,
				"uid", payload.UID,
				"cid", payload.CID,
			)
			c.String(http.StatusBadRequest, "File Does Not Exist")
			return
		}
		Logger.Error("Something Failed Deleting For User", err)
		c.String(http.StatusInternalServerError, "Something Went Wrong")
		return
	}
}
