# Blood Connector Java Backend

This is the Java/Spring Boot backend used by the React frontend. The former `../backend` Node/Express implementation is not part of the supported runtime.

## Migration status

### Phase 1 — project foundation

- Spring Boot 4.1.1 with Java 21 bytecode
- Maven Wrapper (Maven 3.10.0 is downloaded automatically on first use)
- PostgreSQL driver and Spring Data JPA
- Spring Security and JJWT dependencies
- Environment-based database, JWT, server, and CORS settings
- CORS policy for the React development server at `http://localhost:5173`
- Actuator health endpoint at `/actuator/health`
- Stateless JWT authentication, BCrypt password hashing, and donor/hospital role enforcement
- Registration, login, and current-user endpoints under `/api/auth`

### Phase 2 — PostgreSQL domain model

- JPA entities for user accounts, blood requests, chats, and chat messages
- UUID primary keys, validation annotations, relationships, and repository interfaces
- Donor/hospital profiles, donor availability and donation history, request urgency/status, and chat read state
- Flyway migration at `src/main/resources/db/migration/V1__create_core_schema.sql`
- PostgreSQL constraints, foreign keys, role-aware profile checks, coordinate checks, audit timestamps, indexes, and update triggers

Phases 3–5 provide authenticated profiles, donor matching, blood requests, SOS alerts, and donor/hospital chat APIs. The React frontend is configured to use these APIs.

## Prerequisites

- JDK 21 or newer. The project compiles for Java 21; JDK 24 installed on this machine is compatible.
- PostgreSQL running locally or reachable over the network.
- Internet access the first time `mvnw.cmd` runs, so it can download the pinned Maven distribution and dependencies.

## Configuration

Copy the template before running the application:

```powershell
Copy-Item -LiteralPath .env.example -Destination .env
```

Edit `.env` and set a real PostgreSQL password and a unique cryptographically random `JWT_SECRET`. It must be Base64 encoding of at least 32 random bytes; the example placeholder is intentionally rejected. The application fails startup when the secret is missing, malformed, or too short. `.env` is ignored by Git. Deployment environments may set the same values as operating-system environment variables instead.

| Variable | Purpose |
| --- | --- |
| `PORT` | HTTP port supplied by the hosting platform; defaults to `8080`. `SERVER_PORT` is retained as a local compatibility fallback. |
| `DB_URL` | JDBC URL for PostgreSQL. |
| `DB_USERNAME` | PostgreSQL login name. |
| `DB_PASSWORD` | PostgreSQL password; required. |
| `JWT_SECRET` | Base64-encoded JWT signing key of at least 32 cryptographically random bytes; required. |
| `JWT_EXPIRATION_MILLIS` | Access-token lifetime in milliseconds; defaults to 24 hours. |
| `CORS_ALLOWED_ORIGINS` | Comma-separated permitted frontend origins. |

## Phase 3 authentication API

- `POST /api/auth/register` creates a donor or hospital account and returns a bearer token and password-free user profile. Donor registration requires `bloodGroup`; hospital registration requires `hospitalName`. Both require name, email, password (at least 8 characters), phone, latitude, and longitude.
- `POST /api/auth/login` accepts `email` or `username` (the username is the account's email) and `password`.
- `GET /api/auth/me` requires `Authorization: Bearer <token>`.
- All other `/api/**` routes require authentication. Future `/api/donor/**` and `/api/hospital/**` routes are restricted to their matching role.
- Email is the account identifier in the existing schema; no extra username or password table was introduced. Passwords are stored only as BCrypt hashes in `users.password_hash`.

## Phase 4 profiles, donor matching, and blood requests

- `GET/PATCH /api/donor/profile` reads or updates the authenticated donor's profile. Supported updates include name, phone, address, location, blood group, availability, and last donation date.
- `GET/PATCH /api/hospital/profile` reads or updates the authenticated hospital's profile. Supported updates include name, phone, address, location, and hospital name.
- `GET /api/request/donors?bloodGroup=O_POSITIVE&latitude=...&longitude=...&maxDistanceKm=30` searches available donors for hospitals. Distance is capped at 30 km, results are nearest-first, and donors are eligible only if they have not donated in the preceding 90 days.
- `POST /api/request` creates an open blood request for the authenticated hospital. Hospital ownership is derived from the token.
- `GET /api/request/hospital` lists only the authenticated hospital's requests. `GET /api/request/{id}` and `PATCH /api/request/{id}/status` enforce ownership. Only open requests can transition to completed or dismissed.
- `GET /api/request/alert/{id}/donors` matches eligible donors to one of the authenticated hospital's open requests.
- `GET /api/request/nearby` returns only open, future, blood-group-compatible requests within 30 km for an available, eligible authenticated donor.
- Profile and request APIs use response DTOs, not serialized JPA entities. The database remains based on the existing entities; V2 adds a partial coordinate index for open-request matching.
- The `/api/request` paths reuse the corresponding legacy route conventions where appropriate. Profile operations use role-specific `/api/donor/profile` and `/api/hospital/profile` routes. No endpoint accepts a client-provided account ID to establish ownership.

For a default local database, create `blood_connector` using PostgreSQL tooling or pgAdmin. If `psql` is available, this command creates it:

```powershell
psql -U postgres -d postgres -c "CREATE DATABASE blood_connector;"
```

## Verify the current backend

From this directory, run:

```powershell
$env:JAVA_HOME = "C:\Program Files\Java\jdk-24"
.\mvnw.cmd --version
.\mvnw.cmd test
.\mvnw.cmd package
.\mvnw.cmd spring-boot:run
```

Use the path of your own JDK if it differs. With PostgreSQL running and `.env` configured, application startup executes the Flyway migration and validates the JPA mapping against the resulting schema. Stop the application with `Ctrl+C`.

Tests for Phases 3 through 5 exercise API security and business rules using mocks and do not require a database. The PostgreSQL Haversine queries and migrations require validation against a real PostgreSQL instance; they are not replaced with an in-memory database because the schema and native queries use PostgreSQL-specific SQL.

## Phase 5 SOS and chat

- `POST /api/request/sos` creates a critical SOS alert for the authenticated hospital and returns eligible donors found by the PostgreSQL-backed 30 km Haversine matcher. `GET /api/request/sos` and `GET /api/request/sos/{id}` show only that hospital's alerts; `PATCH /api/request/sos/{id}/status` completes or dismisses an owned open alert.
- SOS alerts are distinguished from regular critical blood requests with `blood_requests.is_sos`. Donors must be available, enabled, blood-group compatible, and at least 90 days past their last donation.
- SMS is deliberately suppressed. Responses report `SUPPRESSED_MOCK_MODE`, and the logger records only the alert identifier and recipient count; no provider credentials or real SMS delivery are used.
- `POST /api/chats` creates or retrieves a donor/hospital conversation, optionally associated with an open request. `GET /api/chats` lists a user's conversations and unread counts.
- `GET /api/chats/{id}/messages?page=0&size=50` returns a bounded page (maximum 100) of messages. `POST /api/chats/{id}/messages` sends a message, and `PATCH /api/chats/{id}/read` marks incoming messages read and clears that participant's unread indicator.
- Every conversation/message operation checks current-user membership. Non-members receive not-found responses, and message DTOs do not expose persistence entities.
- Migration V3 adds the SOS discriminator/index and a unique index for request-less donor/hospital conversations.
- Phase 5 tests use mocks. SOS donor discovery uses the same native PostgreSQL distance query as Phase 4; the migration and native SQL have not been exercised by the unit tests and require a live PostgreSQL database for integration validation.

## Deployment: PostgreSQL, Render, Vercel, and GitHub

Deployments are manual. No service is created, deployed, or pushed by these instructions.

### 1. Prepare PostgreSQL

Create a managed PostgreSQL database with your hosting provider. Copy its host, port, database name, username, and password into the backend service environment. Build `DB_URL` in JDBC form:

```text
jdbc:postgresql://HOST:PORT/DATABASE?sslmode=require
```

Use the provider's required SSL options. The application runs the checked-in V1–V3 Flyway migrations at startup and uses `ddl-auto: validate`; do not create a parallel schema manually.

### 2. Deploy the backend to Render

1. Create a Render **Web Service** from your GitHub repository.
2. Select **Docker** as the runtime and set the Docker build context/root directory to `backend-java/`.
3. Add `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET`, `JWT_EXPIRATION_MILLIS`, and `CORS_ALLOWED_ORIGINS` as Render environment variables. Render supplies `PORT`; the application binds to it.
4. Set `CORS_ALLOWED_ORIGINS` to the exact browser origin for the deployed Vercel site (for example `https://your-project.vercel.app`), without a wildcard. For local development, use `http://localhost:5173`.
5. Generate `JWT_SECRET` from at least 32 cryptographically random bytes and Base64-encode the bytes. Keep secrets in Render's environment settings only; never commit them.
6. After deploy, check `/actuator/health` and verify startup logs show successful Flyway migration and database connection. Health success is not proof that the entire user flow or live PostgreSQL Haversine matching works; exercise those features against the deployed database separately.

### 3. Deploy the frontend to Vercel

1. Import the same GitHub repository into Vercel and set the project root to `frontend/`.
2. Use `npm run build` as the build command and `dist` as the output directory.
3. Set `VITE_API_BASE_URL` to the public Spring API URL ending in `/api`, for example `https://your-api.onrender.com/api`.
4. Add the exact Vercel site origin to the backend's `CORS_ALLOWED_ORIGINS`, then redeploy the backend if changed. The checked-in `frontend/vercel.json` routes SPA paths such as `/dashboard` through the React app.
5. Rebuild/redeploy the frontend after changing `VITE_API_BASE_URL`; Vite embeds this setting into the built bundle.

### 4. GitHub and required environment

Commit and push the reviewed project to GitHub using your normal workflow; nothing pushes automatically. Do not commit either `.env` file, access tokens, database credentials, or signing keys. Required production variables are:

| Variable | Production value |
| --- | --- |
| `PORT` | Supplied by Render; do not hard-code it in the Render dashboard. |
| `DB_URL` | PostgreSQL JDBC URL with the host/provider's required SSL mode. |
| `DB_USERNAME` / `DB_PASSWORD` | Managed PostgreSQL credentials. |
| `JWT_SECRET` | Base64 encoding of at least 32 random bytes; no default/fallback secret is used. |
| `JWT_EXPIRATION_MILLIS` | Optional; defaults to 86400000 (24 hours). |
| `CORS_ALLOWED_ORIGINS` | Exact Vercel origin(s), comma-separated; `*` is rejected. |
| `VITE_API_BASE_URL` | Public backend URL ending in `/api`, configured in Vercel before build. |

## Verification and remaining live checks

Run `npm ci`, `npm run build`, and `npm run lint` from `frontend/`; run `.\mvnw.cmd test` and `.\mvnw.cmd package` from `backend-java/`. Automated Java tests use mocks, not a live PostgreSQL database. The PostgreSQL migration chain, native Haversine queries, hosted CORS behavior, and complete deployed browser flow remain live-environment checks; do not treat unit tests or a successful build as evidence of deployment.
