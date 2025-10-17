# Incidents
- Declare: `POST /api/itsm/incidents/declare { sev, summary, service }`
- Update: `POST /api/itsm/incidents/:id/update { msg }`
- Resolve: `POST /api/itsm/incidents/:id/resolve { outcome }`
- Timeline: `GET /api/itsm/incidents/:id/timeline`
