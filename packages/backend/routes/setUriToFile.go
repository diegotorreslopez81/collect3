package routes

import (
	. "collect3/backend/utils"
	"net/http"

	"github.com/gin-gonic/gin"
)

type UriToFilePayload struct {
	UID string `json:"uid"`
	CID string `json:"cid"`
}

func SetUriToFile(c *gin.Context) {
	var payload UriToFilePayload
	var err error

	err = c.BindJSON(&payload)
	if err != nil {
		Logger.Error(
			"Invalid Request Body",
			"err", err,
			"req.Body", c.Request.Body,
		)
		c.String(http.StatusBadRequest, "Invalid Request Body")
		return
	}

	content, err := DB.GetContentByCID(payload.CID)

	if err != nil {
		Logger.Error(
			"Failed To Find Content",
			"err", err,
			"cid", payload.CID,
		)
		c.String(http.StatusBadRequest, "Failed To Find Content")
		return
	}

	if content == (Content{}) {
		c.String(http.StatusNotFound, "Content Not Found")
		return
	}

	err = DB.SetNftUid(payload.UID, content.CID)

	if err != nil {
		Logger.Error(
			"Failed to Save NFT UID",
			"err", err,
			"nftUid", payload.UID,
			"cid", content.CID,
		)
		c.String(http.StatusBadRequest, "Failed to Save UID")
		return
	}

	c.String(http.StatusOK, "UID Saved Correctly")
}
