# Working Copy — dead simple flow
1) Add remote over WebDAV: http://192.168.4.23:3000/ (user: blackboxprogramming / pass: Aa060070003!)
2) Pull, edit, **Commit**, then **Push** — CI runs, bots comment, deploys on main.
3) To redeploy quickly: just push to `main` or merge PR; deploy workflow handles the rest.
