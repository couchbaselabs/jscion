package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
)

var addr = flag.String("addr", ":8080",
	"HTTP/REST listen address")
var dataPath = flag.String("dataPath", "./data",
	"data directory")
var dataSuffix = flag.String("dataSuffix", ".json",
	"suffix for data files")
var staticPath = flag.String("staticPath", "./static",
	"path to static web UI content")

func main() {
	flag.Parse()
	log.Printf("%s\n", os.Args[0])
	flag.VisitAll(func(f *flag.Flag) { log.Printf("  -%s=%s\n", f.Name, f.Value) })

	http.HandleFunc("/data.json", func(w http.ResponseWriter, r *http.Request) {
		m := map[string]interface{}{}
		err := content(*dataPath, *dataSuffix, func(path, name string, b []byte) error {
			key := name[0 : len(name)-len(*dataSuffix)]
			var val interface{}
			err := json.Unmarshal(b, &val)
			if err != nil {
				log.Printf("error: parsing JSON file: %s, err: %v\n", path, err)
				return err
			}
			m[key] = val
			return nil
		})
		if err != nil {
			log.Printf("error: collecting json: %s, err: %v\n", *dataPath, err)
			return
		}
		d, err := json.Marshal(m)
		if err != nil {
			log.Printf("error: marshaling json: %s, err: %v\n", *dataPath, err)
			return
		}
		w.Write(d)
	})

	http.HandleFunc("/data.js",
		suffixHandler(*dataPath, ".js", "/* %s.js */", "/* %s.js */"))
	http.HandleFunc("/data.css",
		suffixHandler(*dataPath, ".css", "/* %s.css */", "/* %s.css */"))
	http.HandleFunc("/data.ract",
		suffixHandler(*dataPath, ".ract", "<!-- {{>%s}} -->", "<!-- {{/%s}} -->"))

	http.Handle("/", http.FileServer(http.Dir(*staticPath)))

	http.ListenAndServe(*addr, nil)
}

// Visits every file in a directory tree that matches a name suffix.
func content(root, suffix string, visitor func(path, name string, b []byte) error) error {
	return filepath.Walk(root, func(path string, f os.FileInfo, err error) error {
		if f.IsDir() || !strings.HasSuffix(path, suffix) {
			return nil
		}
		b, err := ioutil.ReadFile(path)
		if err != nil {
			return err
		}
		return visitor(path, f.Name(), b)
	})
}

func suffixHandler(root, suffix, beg, end string) func(w http.ResponseWriter, r *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		content(root, suffix, func(path, name string, b []byte) error {
			base := name[0 : len(name)-len(suffix)]
			w.Write([]byte(fmt.Sprintf(beg + "\n", base)))
			w.Write(b)
			w.Write([]byte(fmt.Sprintf(end + "\n", base)))
			w.Write([]byte("\n"))
			return nil
		})
	}
}
