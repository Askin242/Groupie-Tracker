package server

import (
	"fmt"
	"io"
	"net/http"
	"strings"
)

var allowedResources = map[string]bool{
	"locations": true,
	"dates":     true,
	"relation":  true,
	"artists":   true,
}

func proxyHandler(w http.ResponseWriter, r *http.Request) {
	path := strings.TrimPrefix(r.URL.Path, "/proxy/")
	parts := strings.Split(path, "/")
	if len(parts) != 2 && parts[0] != "artists" {
		http.Error(w, "invalid proxy path", http.StatusBadRequest)
		return
	}

	var targetURL string
	if len(parts) == 2 {
		resource, id := parts[0], parts[1]
		if !allowedResources[resource] || id == "" {
			http.Error(w, "resource not supported", http.StatusBadRequest)
			return
		}

		targetURL = fmt.Sprintf("https://groupietrackers.herokuapp.com/api/%s/%s", resource, id)
	} else {
		resource := parts[0]
		if !allowedResources[resource] {
			http.Error(w, "resource not supported", http.StatusBadRequest)
			return
		}

		targetURL = fmt.Sprintf("https://groupietrackers.herokuapp.com/api/%s", resource)
	}

	resp, err := http.Get(targetURL)
	if err != nil {
		fmt.Printf("proxy error fetching %s: %v", targetURL, err)
		http.Error(w, "failed to reach upstream API", http.StatusBadGateway)
		return
	}
	defer resp.Body.Close()

	for key, values := range resp.Header {
		for _, value := range values {
			w.Header().Add(key, value)
		}
	}

	w.WriteHeader(resp.StatusCode)
	if _, err := io.Copy(w, resp.Body); err != nil {
		fmt.Printf("proxy error copying response: %v", err)
	}
}

func Server() {
	mux := http.NewServeMux()

	fs := http.FileServer(http.Dir("./static"))
	mux.Handle("/", fs)
	mux.HandleFunc("/proxy/", proxyHandler)

	fmt.Println("Server started on port 8080")
	if err := http.ListenAndServe(":8080", mux); err != nil {
		fmt.Printf("server stopped: %v", err)
	}
}
