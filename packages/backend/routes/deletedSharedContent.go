package routes

import (
	. "collect3/backend/utils"
	"net/http"

	"github.com/gin-gonic/gin"
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
		Logger.Error(
			"Failed To Insert CID In DB",
			"Details",
			err,
		)
		c.String(http.StatusInternalServerError, "Something Went Wrong")
		return
	}
	c.JSON(http.StatusOK, gin.H{"cid": CID})
}
