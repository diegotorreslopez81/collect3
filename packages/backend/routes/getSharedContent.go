package routes

import (
	. "collect3/backend/utils"
	"log/slog"
	"net/http"

	"github.com/gin-gonic/gin"
)

func GetSharedContent(c *gin.Context) {
	var err error

	UID := c.Param("uid")

	content, err := DB.GetSharedContentByUid(UID)
	if err != nil {
		Logger.Error(
			"Failed To Get Shared Content",
			slog.String(
				"Details",
				err.Error(),
			),
		)
		c.String(http.StatusBadRequest, "Failed to Find Content")
		return
	}
	c.JSON(http.StatusOK, content)
}
