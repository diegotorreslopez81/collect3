package storage

import (
	"bytes"
	. "collect3/backend/utils"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
)

type fvm struct {
	api_key string
}

type fvmApiResponse struct {
	Hash string `json:"Hash"`
}

func GetFVM(apiKey string) fvm {
	return fvm{api_key: apiKey}
}

func (storage fvm) UploadFile(payload UploadFilePayload) (UploadFileResponse, error) {
	var err error
	var response UploadFileResponse
	var filecoinResponse fvmApiResponse
	var body bytes.Buffer

	var writer *multipart.Writer = multipart.NewWriter(&body)
	part, err := writer.CreateFormFile("file", "article.json")
	if err != nil {
		Logger.Error(err)
		return UploadFileResponse{}, ErrorFailedToParseFile
	}
	_, err = part.Write([]byte(payload.File))

	if err != nil {
		Logger.Error(err)
		return UploadFileResponse{}, ErrorFailedToReadFile
	}

	writer.Close()

	url := "https://node.lighthouse.storage/api/v0/add"
	req, err := http.NewRequest(http.MethodPost, url, &body)
	if err != nil {
		Logger.Error(err)
		return UploadFileResponse{}, ErrorFailedToCreateClient
	}
	req.Header.Set("Authorization", "Bearer "+storage.api_key)
	req.Header.Set("Content-Type", writer.FormDataContentType())
	var dealParameter = "{\"network\":\"calibration\"}"
	req.Header.Set("X-Deal-Parameter", dealParameter)

	res, err := http.DefaultClient.Do(req)

	if err != nil {
		Logger.Error(err)
		return UploadFileResponse{}, ErrorFailedToUploadFile
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
			"uid", payload.UID,
			"Response.Body", bodyString,
		)
		if res.StatusCode == http.StatusBadRequest {
			return UploadFileResponse{}, ErrorBadRequest
		}
		if res.StatusCode == http.StatusUnauthorized {
			return UploadFileResponse{}, ErrorUnauthorized
		}
		return UploadFileResponse{}, ErrorNonOkay
	}

	err = json.NewDecoder(res.Body).Decode(&filecoinResponse)
	if err != nil {
		Logger.Error(err)
		return UploadFileResponse{}, ErrorFailedToReadResponse
	}
	response = UploadFileResponse{
		CID: filecoinResponse.Hash,
	}
	return response, nil
}

func (storage fvm) DownloadFile(payload DownloadFilePayload) (string, error) {
	url := fmt.Sprintf("https://gateway.lighthouse.storage/ipfs/%s", payload.CID)
	req, err := http.NewRequest(http.MethodGet, url, nil)
	if err != nil {
		Logger.Error(err)
		return "", ErrorFailedToCreateClient
	}

	res, err := http.DefaultClient.Do(req)
	if err != nil {
		Logger.Error(err)
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
			"cid", payload.CID,
			"Response.Body", bodyString,
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
		Logger.Error(err)
		return "", ErrorFailedToReadFile
	}

	return string(file), nil
}
