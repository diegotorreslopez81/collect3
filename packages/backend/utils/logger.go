package utils

import (
	"github.com/charmbracelet/log"
	"io"
	"os"
)

var Logger *log.Logger

func InitLogger(file io.Writer) {
	Logger = log.NewWithOptions(
		io.MultiWriter(os.Stdout, file),
		log.Options{
			ReportCaller:    true,
			ReportTimestamp: true,
		},
	)
}
