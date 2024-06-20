package storage

import (
	"errors"
	"mime/multipart"
)

type UploadFilePayload struct {
	UID       string `json:"uid"`
	AuthToken string `json:"auth_token"`
	File      string `json:"file"`
}

type UploadFileResponse struct {
	CID string `json:"cid"`
}

type DownloadFilePayload struct {
	CID       string `json:"cid"`
	AuthToken string `json:"auth_token"`
}

type UploadFileEncryptedPayload struct {
	UID       string         `form:"uid"`
	AuthToken string         `form:"auth_token"`
	File      multipart.File `form:"file"`
}

type UploadFileEncryptedResponse struct {
	CID  string `json:"cid"`
	Name string `json:"name"`
}

type Storage interface {
	DownloadFile(payload DownloadFilePayload) (string, error)
	UploadFile(payload UploadFilePayload) (UploadFileResponse, error)
}

const (
	SiaOption          string = "sia"
	FileCoinOption     string = "filecoin"
	FVMOption          string = "fvm"
	FVMEncryptedOption string = "fvmEncrypted"
)

var fileCoinApiKey string
var FVMApiKey string
var s5ApiKey string

var (
	ErrorInvalidStorageOption  error = errors.New("Invalid Storage Option")
	ErrorInactiveStorageOption error = errors.New("Inactive Storage Option")
	ErrorFailedToParseFile     error = errors.New("Failed To Parse File")
	ErrorFailedToReadFile      error = errors.New("Failed To Read File")
	ErrorFailedToCreateClient  error = errors.New("Failed To Create Client")
	ErrorFailedToUploadFile    error = errors.New("Failed To Upload File")
	ErrorBadRequest            error = errors.New("Bad Request Status")
	ErrorUnauthorized          error = errors.New("Unauthorized Status")
	ErrorNonOkay               error = errors.New("Another Error Status")
	ErrorFailedToReadResponse  error = errors.New("Failed To Read Response")
	ErrorFailedToDownloadFile  error = errors.New("Failed To Download File")
	ErrorNotFound              error = errors.New("File Not Found")
)

func SetFileCoinApiKey(key string) {
	fileCoinApiKey = key
}

func SetS5ApiKey(key string) {
	s5ApiKey = key
}

func SetFVMApiKey(key string) {
	FVMApiKey = key
}

// TODO: Implement a timeout to all the storage calls
func GetStorage(option string) (Storage, error) {
	switch option {
	case SiaOption:
		return GetS5(s5ApiKey), nil
	case FileCoinOption:
		if fileCoinApiKey == "" {
			return nil, ErrorInvalidStorageOption
		}
		return GetFilecoin(fileCoinApiKey), nil
	case FVMOption:
		if FVMApiKey == "" {
			return nil, ErrorInvalidStorageOption
		}
		return GetFVM(FVMApiKey), nil
	default:
		return nil, ErrorInvalidStorageOption
	}
}
