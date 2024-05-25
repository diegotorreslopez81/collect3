package routes

import (
	. "collect3/backend/storage"
	"net/http"

	"github.com/gin-gonic/gin"
)

func IsStorageAvailable(c *gin.Context) {
	var err error
	storageOption := c.Param("storage")

	_, err = GetStorage(storageOption)

	if err != nil {
		if storageOption == FVMEncryptedOption {
			_, err = GetStorage(FVMOption)
			if err != nil {
				c.String(http.StatusNotFound, "not available")
				return
			}
			c.String(http.StatusAccepted, "is available")
			return
		}
		c.String(http.StatusOK, "not available")
		return
	}

	c.String(http.StatusAccepted, "is available")
}
