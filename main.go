// Gold Pelet frontend service — serves the public static site at / and
// the admin dashboard at /admin, as two plain multi-page HTML sites (no
// SPA routing needed). This is a separate Railway service from the Go API
// backend; the split exists purely for hosting, not application logic —
// every admin page talks to the API backend cross-origin via its own
// explicit BACKEND_ORIGIN (see admin/js/api.js), not through this server.
package main

import (
	"log"
	"net/http"
	"os"
	"strings"
)

// The repo root doubles as both the site's document root and this
// server's own source — block direct requests for the build/source files
// that happen to live alongside the HTML rather than moving the whole
// site into a public/ subdirectory just to avoid this.
var denyPrefixes = []string{"/main.go", "/go.mod", "/go.sum", "/Dockerfile", "/.git", "/.gitignore", "/railway.json"}

func denyBuildFiles(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		for _, p := range denyPrefixes {
			if r.URL.Path == p || strings.HasPrefix(r.URL.Path, p+"/") {
				http.NotFound(w, r)
				return
			}
		}
		next.ServeHTTP(w, r)
	})
}

// This is a low-traffic content site with no build step, so there's no
// content-hashed filename to cache indefinitely and bust on change. Instead,
// force every request to revalidate with the server (a cheap 304 when
// nothing changed) rather than let browsers silently serve a stale HTML/
// CSS/JS/image straight from disk cache after a deploy — the alternative
// forces every reader to know to hard-refresh, which they won't.
func noCache(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Cache-Control", "no-cache, must-revalidate")
		next.ServeHTTP(w, r)
	})
}

func main() {
	mux := http.NewServeMux()
	mux.Handle("/admin/", noCache(http.StripPrefix("/admin/", http.FileServer(http.Dir("./admin")))))
	mux.Handle("/", noCache(denyBuildFiles(http.FileServer(http.Dir(".")))))

	port := os.Getenv("PORT")
	if port == "" {
		port = "8123"
	}
	log.Printf("gold-pelet-frontend listening on :%s", port)
	if err := http.ListenAndServe(":"+port, mux); err != nil {
		log.Fatal(err)
	}
}
