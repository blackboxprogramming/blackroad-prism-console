# OAuth for Partner Apps
- Authorization: `GET /oauth/authorize?client_id&redirect_uri&scope&state`
- Token exchange: `POST /oauth/token { grant_type:'authorization_code', code }`
- Revoke: `POST /oauth/revoke { token }`
- Rotate secret: `POST /oauth/apps/:id/rotate-secret`
