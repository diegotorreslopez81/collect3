package routes

import (
	. "collect3/backend/utils"
	"encoding/json"
	"fmt"
	"io"
	"net/http"

	"github.com/gin-gonic/gin"
)

type CreateAccountPayload struct {
	UID string `json:"uid"`
}

type CreateAccountResponse struct {
	Id int64 `json:"id"`
}

func CreateAccount(c *gin.Context) {
	var payload CreateAccountPayload
	var response CreateAccountResponse
	s5Key := GetEnvVar("ADMIN_S5_KEY")

	err := c.BindJSON(&payload)
	if err != nil {
		Logger.Error("Invalid Request Body", "err", err, "req", c.Request.Body)
		c.String(http.StatusBadRequest, "Invalid Request Body")
		return
	}

	var url = fmt.Sprintf(
		"http://localhost:5050/s5/admin/accounts?email=%s@hotmail.com",
		payload.UID,
	)

	req, err := http.NewRequest(http.MethodPost, url, nil)
	if err != nil {
		Logger.Error("Failed To Create Account Request", "err", err, "uid", payload.UID)
		c.String(http.StatusInternalServerError, "Failed To Create Account")
		return
	}

	req.Header.Add(
		"Authorization",
		fmt.Sprintf(
			"Bearer %s",
			s5Key,
		),
	)
	res, err := http.DefaultClient.Do(req)
	if err != nil {
		Logger.Error("Failed To Create Account", "err", err, "uid", payload.UID)
		c.String(http.StatusInternalServerError, "Failed To Create Account")
		return
	}

	if res.StatusCode != http.StatusOK {
		defer res.Body.Close()
		bodyBytes, err := io.ReadAll(res.Body)
		var bodyString = ""
		if err == nil {
			bodyString = string(bodyBytes)
		}
		Logger.Error(
			fmt.Sprintf("Failed To Create Account, Status %d", res.StatusCode),
			"Response.Body",
			bodyString,
		)
		if bodyString == "This email address is already in use by another account on this node" {
			c.String(http.StatusConflict, "Account Already Exist")
			return
		}
		c.String(res.StatusCode, "Something Went Wrong")
		fmt.Println(res)
		return
	}

	err = json.NewDecoder(res.Body).Decode(&response)
	if err != nil {
		Logger.Error(
			"Failed To Decode S5 Response When Creating A User",
			"err",
			err,
			"res.Body",
			res.Body,
		)
		c.String(res.StatusCode, "Failed To Create Account")
		return
	}

	token, _ := FetchNewToken(response.Id, c)

	err = DB.CreateUser(response.Id, payload.UID, token)
	if err != nil {
		Logger.Error(
			"Failed To Write To DB",
			"err",
			err,
			"userId",
			response.Id,
			"uid",
			payload.UID,
			"token",
			token,
		)
		c.String(http.StatusInternalServerError, "Failed To Write To DB")
		return
	}

	c.JSON(http.StatusOK, gin.H{"id": response.Id, "auth_token": token})
}
