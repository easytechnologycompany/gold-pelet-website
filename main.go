// Gold Pelet frontend service — now a redirector.
//
// This service used to serve the static multi-page site that lives at the
// repository root. That site has been replaced by the React app in app/,
// deployed as its own Railway service, and the two were indistinguishable
// from the outside: same <title>, same content at a glance, different age.
// A stale bookmark to this host showed the old site indefinitely, and no
// amount of cache clearing helped, because it was not a caching problem.
//
// So this no longer serves anything. Every request is sent to the app. The
// HTML, css/ and js/ at the repository root stay where they are — they are
// the reference the React port was made from, and removing them is a
// separate decision from not serving them.
package main

import (
	"io"
	"log"
	"net/http"
	"os"
	"strings"
)

// Where the real site lives. An env var rather than a constant because this
// is expected to become the custom domain once goldpeletcips.com is cut over
// to the app, and that should be a variable change rather than a deploy.
const defaultTarget = "https://gold-pelet-app-production.up.railway.app"

// The old site was a page per file; the app is a route per page. Sending
// /products.html to the app verbatim would land on its 404 — the bookmark
// that prompted this redirect would still be broken, just at a different
// host. Anything not listed carries its path across unchanged.
var legacyPages = map[string]string{
	"/":              "/",
	"/index.html":    "/",
	"/about.html":    "/about",
	"/services.html": "/services",
	"/products.html": "/products",
	"/contact.html":  "/contact",
	"/news.html":     "/news",
}

func main() {
	target := strings.TrimRight(os.Getenv("REDIRECT_TARGET"), "/")
	if target == "" {
		target = defaultTarget
	}

	mux := http.NewServeMux()

	// Answered here rather than redirected. A platform health check that
	// followed the redirect would be reporting on the app's health instead of
	// this service's, and one that did not follow it would read a 302 as a
	// failure and cycle the deployment.
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = io.WriteString(w, "ok")
	})

	// 302 rather than 301 deliberately. The target is expected to change to
	// the custom domain shortly, and browsers cache a permanent redirect hard
	// enough that the people most likely to have the stale bookmark — the team
	// — would be the last to pick the new target up. Nothing here is indexed
	// (the canonical URL points elsewhere), so there is no ranking to
	// consolidate and nothing to trade away for that flexibility.
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		path := r.URL.EscapedPath()
		if mapped, ok := legacyPages[path]; ok {
			path = mapped
		}
		to := target + path
		if r.URL.RawQuery != "" {
			to += "?" + r.URL.RawQuery
		}
		http.Redirect(w, r, to, http.StatusFound)
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8123"
	}
	log.Printf("gold-pelet-frontend redirecting to %s, listening on :%s", target, port)
	if err := http.ListenAndServe(":"+port, mux); err != nil {
		log.Fatal(err)
	}
}
