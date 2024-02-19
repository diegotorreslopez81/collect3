package routes

import (
	"fmt"
  "log/slog"
  "io"
	"net/http"
	"encoding/json"
  . "collect3/backend/utils"

	"github.com/gin-gonic/gin"
  "github.com/mdobak/go-xerrors"
)

type CreateAccountPayload struct {
	UID string `json:"uid"`;
}

type CreateAccountResponse struct {
	Id int64 `json:"id"`
}

func CreateAccount(c *gin.Context) {
  var payload CreateAccountPayload;
  var response CreateAccountResponse;
  var tokenResponse CreateTokenResponse
  s5Key := GetEnvVar("ADMIN_S5_KEY")

	err := c.BindJSON(&payload);
  if err != nil {
    Logger.Error(
      xerrors.WithStackTrace(err, 0).Error(),
    )
    c.String(http.StatusBadRequest, "Invalid Request Body");
		return;
	}

  var url = fmt.Sprintf(
    "http://localhost:5050/s5/admin/accounts?email=%s@hotmail.com",
    payload.UID,
  );

  req, err := http.NewRequest(http.MethodPost, url, nil);
  if err != nil {
    Logger.Error(
      xerrors.WithStackTrace(err, 0).Error(),
    )
    c.String(http.StatusInternalServerError, "Failed To Create Account");
		return;
	}

  req.Header.Add(
    "Authorization",
    fmt.Sprintf(
      "Bearer %s",
      s5Key,
    ),
  );
  res, err := http.DefaultClient.Do(req);
  if err != nil {
    Logger.Error(
      xerrors.WithStackTrace(err, 0).Error(),
    )
    c.String(http.StatusInternalServerError, "Failed To Create Account");
		return;
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
			slog.Any(
				"StackTrace",
				xerrors.WithStackTrace(
					xerrors.New("Error"),
					0,
				).Error(),
			),
			slog.String(
				"Response.Body",
				bodyString,
			),
		)
    c.String(res.StatusCode, "Something Went Wrong");
    fmt.Println(res);
    return;
  }
  
  err = json.NewDecoder(res.Body).Decode(&response)
	if err != nil {
		Logger.Error(
			xerrors.WithStackTrace(err, 0).Error(),
		)
		c.String(res.StatusCode, "Something Went Wrong")
		return
	}


  //Getting the auth token
  url = fmt.Sprintf(
    "http://localhost:5050/s5/admin/accounts/new_auth_token?id=%d",
    response.Id,
  );

  req, err = http.NewRequest(http.MethodPost, url, nil);
  if err != nil {
    Logger.Error(
      xerrors.WithStackTrace(err, 0).Error(),
    )
    c.String(http.StatusInternalServerError, "Failed To Create Auth Token");
		return;
	}

  req.Header.Add(
    "Authorization",
    fmt.Sprintf(
      "Bearer %s",
      s5Key,
    ),
  );
  res, err = http.DefaultClient.Do(req);
  if err != nil {
    Logger.Error(
      xerrors.WithStackTrace(err, 0).Error(),
    )
    c.String(http.StatusInternalServerError, "Failed To Create Auth Token");
		return;
	}

  if res.StatusCode != http.StatusOK {
    defer res.Body.Close()
		bodyBytes, err := io.ReadAll(res.Body)
		var bodyString = ""
		if err == nil {
			bodyString = string(bodyBytes)
		}
		Logger.Error(
			fmt.Sprintf("Failed To Create Auth Token, Status %d", res.StatusCode),
			slog.Any(
				"StackTrace",
				xerrors.WithStackTrace(
					xerrors.New("Error"),
					0,
				).Error(),
			),
			slog.String(
				"Response.Body",
				bodyString,
			),
		)
    c.String(res.StatusCode, "Something Went Wrong");
    fmt.Println(res);
    return;
  }

  err = json.NewDecoder(res.Body).Decode(&tokenResponse)
	if err != nil {
		Logger.Error(
			xerrors.WithStackTrace(err, 0).Error(),
		)
		c.String(res.StatusCode, "Something Went Wrong")
		return
	}

  err = DB.CreateUser(response.Id, payload.UID, tokenResponse.AuthToken);
  fmt.Println()
  fmt.Println()
  fmt.Println()
  fmt.Println()
  fmt.Println("Auth token: ", tokenResponse.AuthToken)
  fmt.Println()
  fmt.Println()
  fmt.Println()
  fmt.Println()
  if err != nil {
    Logger.Error(
      xerrors.WithStackTrace(err, 0).Error(),
    )
    c.String(res.StatusCode, "Something Went Wrong")
    return
  }

  c.JSON(http.StatusOK, gin.H{"id": response.Id, "auth_token": tokenResponse.AuthToken})
}
