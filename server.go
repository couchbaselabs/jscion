package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"os"
	"path/filepath"
	"strings"
)

// Reads all the json files in a directory tree into a map.
func content(root, suffix string, res map[string]interface{}) map[string]interface{} {
	filepath.Walk(root, func(path string, f os.FileInfo, err error) error {
		if f.IsDir() || !strings.HasSuffix(path, suffix) {
			return nil
		}
		b, err := ioutil.ReadFile(path)
		if err != nil {
			return err
		}
		key := f.Name()[0:len(f.Name())-len(suffix)]
		var val interface{}
		err = json.Unmarshal(b, &val)
		if err != nil {
			return err
		}
		res[key] = val
		return nil
	})
	return res
}

func main() {
	addr := ":8080"
	dataPath := "./data"
	dataSuffix := ".json"
	fmt.Printf("addr: %s\n", addr)
	fmt.Printf("dataPath: %s\n", dataPath)
	fmt.Printf("dataSuffix: %s\n", dataSuffix)

	handler := func(w http.ResponseWriter, r *http.Request) {
		m, _ := json.Marshal(content(dataPath, dataSuffix, map[string]interface{}{}))
		w.Write(m)
	}

	http.HandleFunc("/", handler)
	http.ListenAndServe(addr, nil)
}
