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

	flag.StringVar(&apikey, "anthropic_api_key", "", "eg: xxxx")
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

	ctx := context.WithValue(context.Background(), "map", ctxMap)
	ctxMap["apikey"] = apikey

	ui, _ := fs.Sub(UI, "ui")

	router := mux.NewRouter()
	router.HandleFunc("/api/call", Chain(internal.ApiCall, ContextAdd(ctx)))
	router.PathPrefix("/").Handler(http.FileServer(http.FS(ui)))
	cor := cors.New(cors.Options{
		AllowedOrigins:   []string{origin},
		AllowCredentials: true,
	})
	corHandler := cor.Handler(router)
	log.Printf("Server started on port %s", port)
	http.ListenAndServe(":"+port, corHandler)

	log.Fatal(http.ListenAndServe(":"+port, router))
}
