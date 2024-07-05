package storage

import (
	. "collect3/backend/utils"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"

	"github.com/ipfs/go-cid"
	carThings "github.com/ipld/go-car/v2"
	BlockStore "github.com/ipld/go-car/v2/blockstore"
	"github.com/multiformats/go-multicodec"
	"github.com/multiformats/go-multihash"
)

type filecoin struct {
	api_key string
}
type filecoinApiResponseValue struct {
	CID     string `json:"cid"`
	Size    int32  `json:"size"`
	Created string `json:"created"`
	Type    string `json:"type"`
	Scope   string `json:"scope"`
}

type fileCoinApiResponseError struct {
	Name    string `json:"name,omitempty"`
	Message string `json:"message,omitempty"`
}

type filecoinApiResponse struct {
	Ok    bool                     `json:"ok"`
	Value filecoinApiResponseValue `json:"value,omitempty"`
	Error fileCoinApiResponseError `json:"error,omitempty"`
}

func GetFilecoin(apiKey string) filecoin {
	return filecoin{api_key: apiKey}
}

var (
	ErrorFailedToCreateTempFile error = errors.New("Failed To Create Temp File")
	ErrorFailedToWriteTempFile  error = errors.New("Failed To Write Temp File")
)

func (storage filecoin) UploadFile(payload UploadFilePayload) (UploadFileResponse, error) {
	var response UploadFileResponse
	var filecoinResponse filecoinApiResponse
	var err error
	var tempCarFile *os.File
	var tempFile *os.File

	tempCarFile, err = os.CreateTemp("", "article_")
	if err != nil {
		Logger.Error(err)
		return UploadFileResponse{}, ErrorFailedToCreateTempFile
	}
	//TODO: maybe is better to use a tempdir and clean with a cronjob or if the dir hits a certain size
	defer tempCarFile.Close()
	defer os.Remove(tempCarFile.Name())

	tempFile, err = os.CreateTemp("", "og_article_")
	if err != nil {
		Logger.Error(err)
		return UploadFileResponse{}, ErrorFailedToCreateTempFile
	}
	defer tempFile.Close()
	defer os.Remove(tempFile.Name())

	_, err = tempFile.WriteString(payload.File)
	if err != nil {
		Logger.Error(err)
		return UploadFileResponse{}, ErrorFailedToWriteTempFile
	}

	// make a cid with the right length that we eventually will patch with the root.
	hasher, err := multihash.GetHasher(multihash.SHA2_256)
	if err != nil {
		Logger.Error(err)
		return UploadFileResponse{}, errors.New("CREATE HAHSHER ERROR")
	}
	digest := hasher.Sum([]byte{})
	hash, err := multihash.Encode(digest, multihash.SHA2_256)
	if err != nil {
		Logger.Error(err)
		return UploadFileResponse{}, errors.New("CREATE HASH ERROR")
	}
	proxyRoot := cid.NewCidV1(uint64(multicodec.DagPb), hash)

	options := []carThings.Option{BlockStore.WriteAsCarV1(true)}

	blockreader, err := BlockStore.OpenReadWriteFile(tempCarFile, []cid.Cid{proxyRoot}, options...)

	if err != nil {
		Logger.Error(err)
		return UploadFileResponse{}, errors.New("BLOCK READER ERROR")
	}

	root, err := WriteFiles(context.Background(), true, blockreader, tempFile.Name())

	if err != nil {
		Logger.Error(err)
		return UploadFileResponse{}, errors.New("ERROR WRITING CAR FILE")
	}

	fmt.Println("CID: " + root.String())

	if err := blockreader.Finalize(); err != nil {
		Logger.Error(err)
		return UploadFileResponse{}, errors.New("ERROR CLOSING THE FILE")
	}

	err = carThings.ReplaceRootsInFile(tempCarFile.Name(), []cid.Cid{root})

	if err != nil {
		Logger.Error(err)
		return UploadFileResponse{}, errors.New("ERROR FAILED TO REWRITE THE CID")
	}

	url := "https://api.nft.storage/upload"
	req, err := http.NewRequest(http.MethodPost, url, tempCarFile)
	if err != nil {
		Logger.Error(err)
		return UploadFileResponse{}, ErrorFailedToCreateClient
	}
	req.Header.Set("Authorization", "Bearer "+storage.api_key)
	req.Header.Set("Content-Type", "application/car")

	res, err := http.DefaultClient.Do(req)

	if err != nil {
		Logger.Error(err)
		return UploadFileResponse{}, ErrorFailedToUploadFile
	}

	if res.StatusCode != http.StatusOK {

		err = json.NewDecoder(res.Body).Decode(&filecoinResponse)
		if err == nil {
			return UploadFileResponse{}, ErrorFailedToReadResponse
		}
		Logger.Error(
			fmt.Sprintf("Failed To Upload File, Status %d", res.StatusCode),
			"uid", payload.UID,
			"Response.Body", filecoinResponse.Error.Message,
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
		CID: filecoinResponse.Value.CID,
	}
	return response, nil
}

func (storage filecoin) DownloadFile(payload DownloadFilePayload) (string, error) {
	url := fmt.Sprintf("https://nftstorage.link/ipfs/%s", payload.CID)
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
