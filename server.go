package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"io/ioutil"
	"net/http"
	"os"
	"path/filepath"
	"strings"
)

var addr = flag.String("addr", ":8080",
	"HTTP/REST listen address")
var dataPath = flag.String("dataPath", "./data",
	"Data directory")
var dataSuffix = flag.String("dataSuffix", ".json",
	"Suffix for data files")
var staticPath = flag.String("staticPath", "./static",
	"Path to static web UI content")

func main() {
	flag.Parse()
	fmt.Printf("%s\n", os.Args[0])
	flag.VisitAll(func(f *flag.Flag) {
		fmt.Printf("  -%s=%s\n", f.Name, f.Value)
	})

	dataHandler := func(w http.ResponseWriter, r *http.Request) {
		d, _ := json.Marshal(content(*dataPath, *dataSuffix, map[string]interface{}{}))
		w.Write(d)
	}

	http.HandleFunc("/data.json", dataHandler)

	http.Handle("/", http.FileServer(http.Dir(*staticPath)))

	http.ListenAndServe(*addr, nil)
}

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
