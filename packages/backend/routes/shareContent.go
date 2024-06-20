package routes

import (
	. "collect3/backend/utils"
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
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
			"Invalid Request Body",
			"err", err,
			"res.Body", c.Request.Body,
		)
		c.String(http.StatusBadRequest, "Invalid Request Body")
		return
	}

	if payload.UID == "" || payload.CID == "" {
		Logger.Error("Invalid Request Body No CID or UID")
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
			"err", err,
			"cid", payload.CID,
			"uid", payload.UID,
		)
		c.String(http.StatusInternalServerError, "Something Went Wrong")
		return
	}
	c.JSON(http.StatusOK, gin.H{"cid": payload.CID})
}
