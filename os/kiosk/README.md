# Kiosk
- Create a user `blackroad` (no sudo), log in once to create a user session.
- Enable lingering: `loginctl enable-linger blackroad`
- As that user: `systemctl --user enable --now blackroad-kiosk.service`
- HDMI boots straight into http://localhost
