# Blood Connector frontend

React/Vite frontend for the Java Spring Boot API. The application uses bearer JWT authentication, protects dashboard/profile/chat routes, and shows role-specific pages for donors and hospitals.

## Local development

1. Install Node.js supported by the Vite version in `package.json`.
2. Run `npm ci`.
3. Copy `.env.example` to `.env` or set `VITE_API_BASE_URL=http://localhost:8080/api`.
4. Start the Java API with PostgreSQL configured, then run `npm run dev`.
5. Open `http://localhost:5173`.

Vite variables are embedded at build time. For a deployed build, set `VITE_API_BASE_URL` to the public Java API base URL, including `/api`.

## Connected API functionality

- Authentication: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`.
- Profiles: `GET/PATCH /api/donor/profile`, `GET/PATCH /api/hospital/profile`.
- Requests and matching: `POST /api/request`, `GET /api/request/hospital`, `GET /api/request/nearby`, `GET /api/request/donors`, and the matching/status subroutes.
- SOS: `POST /api/request/sos`; SMS delivery is mock-only.
- Chat: `/api/chats` and `/api/chats/{id}/messages`.

The UI does not call the retired Node/Express API. Availability, ownership, donor eligibility, and chat membership are enforced by the Java API, not by client-supplied identifiers.

## Production hosting

For Vercel, set the project root to `frontend`, build command to `npm run build`, output directory to `dist`, and define `VITE_API_BASE_URL` as the deployed Spring API URL ending in `/api`. `vercel.json` provides SPA route fallback. Configure the same exact Vercel origin in the backend's `CORS_ALLOWED_ORIGINS`.
