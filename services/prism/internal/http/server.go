package httpapi

import (
	"encoding/json"
	"net/http"

	"github.com/blackroad/prism-console/services/prism/internal/service"
)

// API exposes HTTP handlers that mirror the JavaScript API bridge.
type API struct {
	svc *service.Service
}

// NewAPI constructs a new HTTP API instance.
func NewAPI(svc *service.Service) *API {
	return &API{svc: svc}
}

// Router returns an http.Handler that serves the Prism endpoints.
func (a *API) Router() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("/api/health.json", a.handleHealth)
	mux.HandleFunc("/api/echo", a.handleEcho)
	mux.HandleFunc("/api/mini/infer", a.handleMiniInfer)
	return mux
}

func (a *API) handleHealth(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	resp, err := a.svc.Health(r.Context())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	writeJSON(w, resp)
}

func (a *API) handleEcho(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	var body interface{}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil && err.Error() != "EOF" {
		http.Error(w, "invalid json", http.StatusBadRequest)
		return
	}
	writeJSON(w, a.svc.Echo(r.Context(), body))
}

type miniInferPayload struct {
	X float64 `json:"x"`
	Y float64 `json:"y"`
}

func (a *API) handleMiniInfer(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	var payload miniInferPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, "invalid json", http.StatusBadRequest)
		return
	}
	result, err := a.svc.MiniInfer(r.Context(), payload.X, payload.Y)
	if err != nil {
		if err == service.ErrInvalidNumber {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	writeJSON(w, result)
}

func writeJSON(w http.ResponseWriter, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	enc := json.NewEncoder(w)
	enc.SetIndent("", "  ")
	_ = enc.Encode(v)
}
