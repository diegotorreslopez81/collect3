package routes

import (
	"bytes"
	. "collect3/backend/storage"
	. "collect3/backend/utils"
	"encoding/json"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

type Metadata struct {
	Url      string `json:"url"` //url
	Title    string `json:"title"`
	Byline   string `json:"byline"` //author
	Lang     string `json:"lang"`
	Length   int    `json:"length"` //length in minutes
	Excerpt  string `json:"excerpt"`
	SiteName string `json:"siteName"`
}

func GetNftMetadata(c *gin.Context) {
	var err error

	cid := c.Param("cid")

	adminUser, err := DB.GetUserByID(1)
	if err != nil {
		Logger.Error("Failed To Get AdminUser From DB", "err", err)
		c.String(http.StatusInternalServerError, "Something Went Wrong")
		return
	}

	content, err := DB.GetContentByCID(cid)

	if err != nil {
		Logger.Error("Failed to Find Content By CID", "err", err, "cid", cid)
		c.String(http.StatusBadRequest, "Failed to Find Content")
		return
	}

	storage, err := GetStorage(content.Storage)

	if err != nil {
		c.String(http.StatusInternalServerError, "Something Went Wrong")
		return
	}

	file, err := storage.DownloadFile(DownloadFilePayload{CID: content.CID, AuthToken: adminUser.Token})

	if err != nil {
		Logger.Error(
			"Failed To Download File",
			"err", err,
			"cid", content.CID,
		)
		c.String(http.StatusInternalServerError, "Failed to Get File")
		return
	}

	file = strings.ReplaceAll(file, "\\\\", "\\")

	quote := []byte{'"'}
	trimmedData := bytes.TrimPrefix(bytes.TrimSuffix([]byte(file), quote), quote)

	var metadata Metadata
	err = json.Unmarshal(trimmedData, &metadata)

	if err != nil {
		Logger.Error("Failed to Unmarshal", "err", err, "rawData", trimmedData)
		c.String(http.StatusInternalServerError, "Failed to Get File")
		return
	}

	c.JSON(http.StatusOK, metadata)
}
