# Licensing
- Define plan & seat cap: `POST /api/admin/licenses/plan`
- Assign seats: `POST /api/admin/licenses/assign`
- Check usage: `GET /api/admin/licenses/usage?product=…`
# License Keys
- Issue via `/api/admin/licenses/issue` with `{owner,plan,days}`.
- Verify via `/api/admin/licenses/verify`.
- Client SDKs can embed verification using HMAC token format.
