package main

import (
	"context"
	"embed"
	"io/fs"
	"log"
	"modules/internal"
	"net/http"
	"os"

	"flag"

	"github.com/gorilla/mux"
	"github.com/rs/cors"
)

//go:embed ui
var UI embed.FS

const defaultPort = "8080"
const defaultOrigin = "*"
const defaultAPIKey = ""
const defaultWebsitePassword = ""

type Middleware func(http.HandlerFunc) http.HandlerFunc

var ctxMap map[string]interface{} = make(map[string]interface{})

func ContextAdd(ctx context.Context) Middleware {
	return func(f http.HandlerFunc) http.HandlerFunc {
		return func(w http.ResponseWriter, r *http.Request) {
			contextReq := r.WithContext(ctx)
			f(w, contextReq)
		}
	}
}

func Chain(f http.HandlerFunc, middlewares ...Middleware) http.HandlerFunc {
	for _, m := range middlewares {
		f = m(f)
	}
	return f
}
func main() {
	port := defaultPort
	origin := defaultOrigin
	var apikey string
	var websitePassword string

	flag.StringVar(&apikey, "anthropic_api_key", "", "eg: xxxx")
	flag.StringVar(&websitePassword, "website_password", "", "eg: xxxx")
	flag.Parse()
	if os.Getenv("PORT") != "" {
		port = os.Getenv("PORT")
	}
	if os.Getenv("ORIGIN") != "" {
		origin = os.Getenv("ORIGIN")
	}
	if apikey == defaultAPIKey && os.Getenv("ANTHROPIC_API_KEY") != "" {
		apikey = os.Getenv("ANTHROPIC_API_KEY")
	}
	if apikey == defaultAPIKey {
		log.Fatal("API Key not set")
	}

	if websitePassword == defaultWebsitePassword && os.Getenv("WEBSITE_PASSWORD") != "" {
		websitePassword = os.Getenv("WEBSITE_PASSWORD")
	}

	ctx := context.WithValue(context.Background(), "map", ctxMap)
	ctxMap["apikey"] = apikey
	ctxMap["websitePassword"] = websitePassword

	ui, _ := fs.Sub(UI, "ui")

	router := mux.NewRouter()
	router.HandleFunc("/api/call", Chain(internal.ApiCall, ContextAdd(ctx)))
	router.HandleFunc("/api/auth", Chain(func(w http.ResponseWriter, r *http.Request) {
		if internal.WebsitePasswordVerify(r) {
			w.WriteHeader(http.StatusOK)
		} else {
			w.WriteHeader(http.StatusUnauthorized)
		}
	}, ContextAdd(ctx)))
	router.PathPrefix("/").Handler(http.FileServer(http.FS(ui)))
	cor := cors.New(cors.Options{
		AllowedOrigins:   []string{origin},
		AllowCredentials: false,
		AllowedHeaders:   []string{"*"},
	})
	corHandler := cor.Handler(router)
	log.Printf("Server started on port %s", port)
	http.ListenAndServe(":"+port, corHandler)

	log.Fatal(http.ListenAndServe(":"+port, router))
}
