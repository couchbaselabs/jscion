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
	"regexp"
	"strings"

	"github.com/gorilla/mux"
)

var addr = flag.String("addr", ":8080",
	"HTTP/REST listen address")
var appsPath = flag.String("appsPath", "./apps",
	"apps directory, optionally comma separated")
var staticPath = flag.String("staticPath", "./static",
	"path to static web UI content")

const APP_INFO_NAME = "app-info.json"

func main() {
	flag.Parse()
	log.Printf("%s\n", os.Args[0])
	flag.VisitAll(func(f *flag.Flag) { log.Printf("  -%s=%s\n", f.Name, f.Value) })
	apps := readApps(*appsPath)
	log.Printf("serving: /apps/{app}/")
	for name := range apps {
		log.Printf("  /apps/%s/", name)
	}
	err := http.ListenAndServe(*addr, routeApps(apps, *staticPath))
	if err != nil {
		log.Fatalf("error: http listen/serve err: %v", err)
	}
}

func readApps(appsPath string) map[string]string {
	apps := map[string]string{}
	for _, path := range strings.Split(appsPath, ",") {
		entries, err := ioutil.ReadDir(path)
		if err != nil {
			log.Fatalf("error: could not read dir path: %s", path)
		}
		for _, entry := range entries {
			matched, err := regexp.MatchString("^\\w[\\w_-]*$", entry.Name())
			if err == nil && matched && entry.IsDir() && apps[entry.Name()] == "" {
				apps[entry.Name()] = filepath.Join(path, entry.Name())
			}
		}
	}
	return apps
}

func routeApps(apps map[string]string, staticPath string) *mux.Router {
	fi, err := os.Stat(staticPath)
	if err != nil || !fi.Mode().IsDir() {
		log.Fatalf("error: staticPath is not a dir: %s, err: %v", staticPath, err)
	}
	r := mux.NewRouter()
	sr := r.PathPrefix("/apps/{app}/").Subrouter()
	sr.HandleFunc("/init.json",
		withApp(func(w http.ResponseWriter, r *http.Request, app string) {
			m := map[string]interface{}{}
			err := content(apps, app, ".json", func(name string, b []byte) error {
				key := name[0 : len(name)-len(".json")]
				var val interface{}
				err := json.Unmarshal(b, &val)
				if err != nil {
					log.Printf("error: parsing JSON file: %s, err: %v\n", name, err)
					return err
				}
				m[key] = val
				return nil
			})
			if err != nil {
				log.Printf("error: collecting json: %s, err: %v\n", appsPath, err)
				return
			}
			d, err := json.Marshal(m)
			if err != nil {
				log.Printf("error: marshaling json: %s, err: %v\n", appsPath, err)
				return
			}
			w.Write(d)
		}))
	sr.HandleFunc("/init.js",
		suffixHandler(apps, ".js", "/* %s.js */", "/* %s.js */"))
	sr.HandleFunc("/init.css",
		suffixHandler(apps, ".css", "/* %s.css */", "/* %s.css */"))
	sr.HandleFunc("/init.tmpl",
		suffixHandler(apps, ".tmpl", "<!-- {{>%s}} -->", "<!-- {{/%s}} -->"))
	sr.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, staticPath+"/index.html")
	})
	r.PathPrefix("/").Handler(http.FileServer(http.Dir(staticPath)))
	return r
}

// Visits every file in a directory tree that matches a name suffix.
// And, follow the app info include metadata to bring in files from included apps.
func content(apps map[string]string, app string, suffix string,
	visitor func(name string, b []byte) error) error {
	m := map[string][]byte{}
	var w func(app string) error
	w = func(app string) error {
		dir := apps[app]
		err := filepath.Walk(dir, func(path string, f os.FileInfo, err error) error {
			if f.IsDir() || !strings.HasSuffix(path, suffix) || strings.Index(path, " ") > 0 {
				return nil
			}
			b, ok := m[f.Name()]
			if ok || b != nil {
				return nil
			}
			b, err = ioutil.ReadFile(path)
			if err != nil {
				return err
			}
			m[f.Name()] = b
			return nil
		})
		if err != nil {
			return err
		}
		aci, err := readAppInfoInclude(dir)
		for _, app := range aci {
			err = w(app)
			if err != nil {
				return err
			}
		}
		return nil
	}
	err := w(app)
	if err != nil {
		return err
	}
	for name, b := range m {
		if err := visitor(name, b); err != nil {
			return err
		}
	}
	return nil
}

func suffixHandler(apps map[string]string, suffix, beg, end string) func(http.ResponseWriter, *http.Request) {
	return withApp(func(w http.ResponseWriter, r *http.Request, app string) {
		content(apps, app, suffix, func(name string, b []byte) error {
			base := name[0 : len(name)-len(suffix)]
			w.Write([]byte(fmt.Sprintf(beg+"\n", base)))
			w.Write(b)
			w.Write([]byte(fmt.Sprintf(end+"\n", base)))
			w.Write([]byte("\n"))
			return nil
		})
	})
}

func withApp(orig func(http.ResponseWriter, *http.Request,
	string)) func(http.ResponseWriter, *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		// TODO: Auth checks.
		orig(w, r, mux.Vars(r)["app"])
	}
}

func readAppInfoInclude(dir string) ([]string, error) {
	r := []string{}
	j, err := ioutil.ReadFile(filepath.Join(dir, APP_INFO_NAME))
	if err != nil {
		return r, err
	}
	var conf map[string]interface{}
	err = json.Unmarshal(j, &conf)
	if err != nil {
		return r, err
	}
	for _, s := range conf["include"].([]interface{}) {
		r = append(r, s.(string))
	}
	return r, nil
}
