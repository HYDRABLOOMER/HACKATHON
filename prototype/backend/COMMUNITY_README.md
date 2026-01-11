Quick test examples for the Community Issues API

Prereqs:
- Start the backend: `npm install` then `npm run start` from `prototype` folder.
- Sign up and login with the existing `/auth` routes to obtain the cookie `token`.

Example flows (replace host/port if needed):

1) Create issue (authenticated)

curl -X POST http://localhost:5000/api/community \
  -H "Content-Type: application/json" \
  -d '{"title":"Pothole on 5th","description":"Large pothole near 5th street","location":"5th Ave","images":[]}' \
  -b "token=YOUR_JWT_COOKIE_HERE"

2) List issues (public)

curl http://localhost:5000/api/community?page=1&limit=10

3) View single issue

curl http://localhost:5000/api/community/ISSUE_ID

4) Vote (toggle) (authenticated)

curl -X POST http://localhost:5000/api/community/ISSUE_ID/vote -b "token=YOUR_JWT_COOKIE_HERE"

5) Add comment (authenticated)

curl -X POST http://localhost:5000/api/community/ISSUE_ID/comments \
  -H "Content-Type: application/json" \
  -d '{"text":"This needs fixing ASAP"}' \
  -b "token=YOUR_JWT_COOKIE_HERE"

Notes:
- The login endpoint sets a cookie named `token` — use that cookie for authenticated requests.
- If your client stores the token instead of cookie, send `-H "Authorization: Bearer <token>"` and adjust `authMiddleware` accordingly.
