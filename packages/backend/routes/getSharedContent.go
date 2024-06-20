package routes

import (
	. "collect3/backend/utils"
	"net/http"

	"github.com/gin-gonic/gin"
)

func GetSharedContent(c *gin.Context) {
	var err error

	UID := c.Param("uid")

	if UID == "" {
		c.String(http.StatusBadRequest, "Missing UID")
		return
	}

	content, err := DB.GetSharedContentByUid(UID)
	if err != nil {
		Logger.Error(
			"Failed To Get Shared Content",
			"Details", err,
			"uid", UID,
		)
		c.String(http.StatusBadRequest, "Failed to Find Content")
		return
	}
	c.JSON(http.StatusOK, content)
}
