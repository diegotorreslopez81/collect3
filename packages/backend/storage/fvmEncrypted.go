package storage

import (
	"bytes"
	. "collect3/backend/utils"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"mime/multipart"
	"net/http"
	"net/http/httputil"
	"net/textproto"
)

type fvmEncrypted struct {
	api_key string
}

type fvmEncryptedApiResponse struct {
	Hash string `json:"Hash"`
	Name string `json:"Name"`
}

func GetFVMEncrypted(apiKey string) fvmEncrypted {
	return fvmEncrypted{api_key: apiKey}
}

func (storage fvmEncrypted) UploadFile(payload UploadFileEncryptedPayload) (UploadFileEncryptedResponse, error) {
	var err error
	var response UploadFileEncryptedResponse
	var filecoinResponse fvmEncryptedApiResponse
	var body bytes.Buffer

	var writer *multipart.Writer = multipart.NewWriter(&body)

	//this is the same as writer.CreateFromFile
	//but the content type in the CreateFromFile is hardcoded to octet-stream
	//so this is why this code is here
	h := make(textproto.MIMEHeader)
	h.Set("Content-Disposition", `form-data; name="file"; filename="article.txt"`)
	h.Set("Content-Type", "text/plain")
	part, err := writer.CreatePart(h)

	if err != nil {
		return UploadFileEncryptedResponse{}, ErrorFailedToParseFile
	}
	_, err = io.Copy(part, payload.File)

	if err != nil {
		return UploadFileEncryptedResponse{}, ErrorFailedToReadFile
	}

	writer.Close()

	url := "https://node.lighthouse.storage/api/v0/add?wrap-with-directory=false"
	req, err := http.NewRequest(http.MethodPost, url, &body)
	if err != nil {
		return UploadFileEncryptedResponse{}, ErrorFailedToCreateClient
	}
	req.Header.Set("Authorization", "Bearer "+storage.api_key)
	contentType := writer.FormDataContentType()
	Logger.Info("Content-Type: " + contentType)
	req.Header.Set("Content-Type", contentType)
	req.Header.Set("Encryption", "true")
	req.Header.Set("Mime-Type", "text/plain")

	dump, err := httputil.DumpRequestOut(req, true)
	if err != nil {
		fmt.Println("failed to dump request: ", err)
	} else {
		fmt.Println("request: ")
		fmt.Println(string(dump))
	}

	res, err := http.DefaultClient.Do(req)

	if err != nil {
		Logger.Error(
			err.Error(),
			slog.String("Failed To create request", ""),
		)
		return UploadFileEncryptedResponse{}, ErrorFailedToUploadFile
	}
	dump, err = httputil.DumpResponse(res, true)
	if err != nil {
		fmt.Println("failed to dump response: ", err)
	} else {
		fmt.Println("response: ")
		fmt.Println(string(dump))
	}

	if res.StatusCode != http.StatusOK {
		defer res.Body.Close()
		bodyBytes, err := io.ReadAll(res.Body)
		var bodyString = ""
		if err == nil {
			bodyString = string(bodyBytes)
		}
		Logger.Error(
			fmt.Sprintf("Failed To Upload File, Status %d", res.StatusCode),
			slog.String(
				"Response.Body",
				bodyString,
			),
			slog.String(
				"Response.Status",
				res.Status,
			),
		)
		if res.StatusCode == http.StatusBadRequest {
			return UploadFileEncryptedResponse{}, ErrorBadRequest
		}
		if res.StatusCode == http.StatusUnauthorized {
			return UploadFileEncryptedResponse{}, ErrorUnauthorized
		}
		return UploadFileEncryptedResponse{}, ErrorNonOkay
	}

	err = json.NewDecoder(res.Body).Decode(&filecoinResponse)
	if err != nil {
		return UploadFileEncryptedResponse{}, ErrorFailedToReadResponse
	}
	response = UploadFileEncryptedResponse{
		CID:  filecoinResponse.Hash,
		Name: filecoinResponse.Name,
	}
	return response, nil
}

func (storage fvmEncrypted) DownloadFile(payload DownloadFilePayload) (string, error) {
	url := fmt.Sprintf("https://gateway.lighthouse.storage/ipfs/%s", payload.CID)
	req, err := http.NewRequest(http.MethodGet, url, nil)
	if err != nil {
		return "", ErrorFailedToCreateClient
	}

	res, err := http.DefaultClient.Do(req)
	if err != nil {
		return "", ErrorFailedToDownloadFile
	}
	if res.StatusCode != http.StatusOK {
		defer res.Body.Close()
		bodyBytes, err := io.ReadAll(res.Body)
		var bodyString = ""
		if err == nil {
			bodyString = string(bodyBytes)
		}
		Logger.Error(
			fmt.Sprintf("Failed To Download File, Status %d", res.StatusCode),
			slog.String(
				"Response.Body",
				bodyString,
			),
		)
		if res.StatusCode == http.StatusUnauthorized {
			return "", ErrorUnauthorized
		}
		if res.StatusCode == http.StatusNotFound {
			return "", ErrorNotFound
		}
		return "", ErrorNonOkay
	}

	defer res.Body.Close()

	file, err := io.ReadAll(res.Body)

	if err != nil {
		return "", ErrorFailedToReadFile
	}

	return string(file), nil
}
