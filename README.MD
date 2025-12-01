<div align="center">
  <h2 align="center">Groupie Tracker</h2>
  <p align="center">
    A small Go web app that visualizes the <strong>Groupie Tracker</strong> music API with a clean UI, search, and filters.
  </p>
  <p align="center">
    <img src="https://img.shields.io/badge/language-Go-00ADD8?style=for-the-badge&labelColor=000000" />
    <img src="https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-6E56CF?style=for-the-badge&labelColor=000000" />
    <img src="https://img.shields.io/badge/status-Learning%20Project-f97316?style=for-the-badge&labelColor=000000" />
  </p>
</div>

---

### 🎧 Overview

**Groupie Tracker** is a lightweight web interface built in Go that consumes the public Groupie Tracker API  
(`https://groupietrackers.herokuapp.com/api`).  
It lets you browse artists, see tour dates and locations, and run advanced searches through a simple, responsive UI.

The Go backend only serves static files and acts as a small **reverse proxy** to the public API, keeping all calls on the same origin.

### ✨ Main Features

- **Artist grid** on the home page with:
  - Artist picture, ID, name, members
  - Creation date and first album
  - List of concert dates and locations
- **Search page** (`/search.html`) with:
  - Global text search (name, members, locations, albums…)
  - Filters on name, location, first album, creation date
  - Double slider to filter by **number of members**
  - Autocomplete suggestions while typing
- **About page** (`/aboutus.html`) explaining the project and providing a contact form
- **Clean UI** built with vanilla HTML/CSS/JS, no frontend framework

### 🧰 Requirements

- Go **1.21+** (earlier versions may also work)
- A terminal (PowerShell / cmd / bash / zsh, etc.)
- Windows, macOS or Linux

> On Windows, you can run it from PowerShell or cmd. Just make sure you are in the `Projet/src` folder before running the commands below.

### 🚀 Quick Start

1. **Clone the repository**

```bash
git clone https://github.com/Askin242/Groupie-Tracker.git²
cd Groupie-Tracker/Projet/src
```

2. **Download dependencies**

```bash
go mod tidy
```

3. **Run the server**

```bash
go run .
```

By default the server listens on **http://localhost:8080**.

- Home (artist grid): `http://localhost:8080/`
- Search: `http://localhost:8080/search.html`
- About: `http://localhost:8080/aboutus.html`

### 🌐 Backend & API

The Go backend is intentionally very small:

- Serves static files from the `static` folder (HTML, CSS, JS, images)
- Exposes a `/proxy/*` route that forwards requests to  
  `https://groupietrackers.herokuapp.com/api` (bypass CORS)
- Only allows a limited set of resources: `artists`, `locations`, `dates`, `relation`

Examples:

- `GET /proxy/artists` → `https://groupietrackers.herokuapp.com/api/artists`
- `GET /proxy/relation/1` → `https://groupietrackers.herokuapp.com/api/relation/1`

The frontend JavaScript (`index.js`, `search.js`) only talks to the local `/proxy/...` endpoints.

### 🗂️ Project Structure

- **Root**
  - `README.MD` — project description (this file)
  - `LICENSE` — license file
  - `Projet/` — Go source code and static assets
- **Projet/src/**
  - `main.go` — application entry point
  - `go.mod`, `go.sum` — Go module files
  - `pkg/server/Server.go` — HTTP server and proxy handler
  - `static/` — frontend
    - `index.html` — home page with artist grid
    - `search.html` — search + filters UI
    - `aboutus.html` — about / contact page
    - `css/`
      - `index.css` — base layout and home styles
      - `search.css` — search page and filters styling
      - `aboutus.css` — about page layout
    - `js/`
      - `index.js` — fetches artists + relations and renders the home grid
      - `search.js` — search, filters, autocomplete, and result cards
    - `img/`
      - `a.png` — fallback/example image

### 🧪 Development Notes

- The project uses only the Go standard library (`net/http`, etc.).
- No database is used; all data comes from the Groupie Tracker API.
- Frontend logic is written in plain JavaScript and manipulates the DOM directly.

### 🙌 Credits

- **Development & design**: [Sylvestre Graziani](https://github.com/Askin242) & [Matthieu Rey](https://github.com/MathCat975)
- **Data source**: [Groupie Tracker API](https://groupietrackers.herokuapp.com/)

### 📜 License

This project is licensed under the **MIT License**. See the `LICENSE` file for details.
