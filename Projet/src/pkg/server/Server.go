package server

import (
	"fmt"
	"net/http"
)

func Server() {
	fs := http.FileServer(http.Dir("./static"))
	http.Handle("/static/", http.StripPrefix("/static/", fs))
	http.ListenAndServe(":8080", nil)
	fmt.Println("Server started on port 8080")
}
