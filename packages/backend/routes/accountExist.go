package routes

import (
	. "collect3/backend/utils"
	"net/http"

	"github.com/gin-gonic/gin"
)

func AccountExist(c *gin.Context) {
	var payload CreateAccountPayload

	Logger.Info("POST /account_exist")

	err := c.BindJSON(&payload)
	if err != nil {
		Logger.Error("Invalid Request Body", "err", err, "req", c.Request.Body)
		c.String(http.StatusBadRequest, "Invalid Request Body")
		return
	}

	user, err := DB.GetUserByUID(payload.UID)
	if err != nil {
		Logger.Error("Failed To Get User", "err", err, "uid", payload.UID)
		c.String(http.StatusInternalServerError, "Something Went Wrong")
		return
	}

	if user == (User{}) {
		c.JSON(http.StatusOK, gin.H{"exist": false})
		return
	}

	c.JSON(http.StatusOK, gin.H{"exist": true})
}
