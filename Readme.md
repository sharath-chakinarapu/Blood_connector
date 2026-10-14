# Blood Connector

Blood Connector connects blood donors and hospitals through a React frontend and a Java/Spring Boot API backed by PostgreSQL.

## Technology

- Frontend: React, Vite, Axios, React Router
- Backend: Java 21, Spring Boot, Spring Security, JWT
- Database: PostgreSQL, managed by Flyway migrations
- Deployment: Render (backend and PostgreSQL) and Vercel (frontend)

The supported production backend is `backend-java/`. The previous Node/Express backend is a migration artifact and is not used by the frontend.

## Local setup

### PostgreSQL and Java API

1. Install JDK 21+ and PostgreSQL, then create a database named `blood_connector`.
2. From `backend-java/`, copy `.env.example` to `.env`.
3. Set `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, and a strong Base64 `JWT_SECRET` (at least 32 random bytes). Do not commit `.env`.
4. Run:

   ```powershell
   $env:JAVA_HOME = "C:\Program Files\Java\jdk-21"
   .\mvnw.cmd test
   .\mvnw.cmd package
   .\mvnw.cmd spring-boot:run
   ```

Flyway creates the schema when the application connects. The API listens on port 8080 by default.

### React frontend

From `frontend/`:

```powershell
npm ci
npm run dev
```

Vite reads `VITE_API_BASE_URL` from `frontend/.env`; the example points to `http://localhost:8080/api`. The API's development CORS origin is `http://localhost:5173`.

## Available functionality

- Donor and hospital registration/login, BCrypt password storage, stateless JWT authentication, and protected profile access.
- Donor profile and availability management, donor search within 30 km, and the 90-day donation eligibility rule.
- Hospital-owned blood requests and SOS alerts, donor matching, and role/ownership checks.
- Donor/hospital chat with membership enforcement, pagination, and unread/read state.
- SOS SMS remains explicitly in mock/logging mode; the API does not send real texts.

See [backend-java/README.md](./backend-java/README.md) for API paths, environment variables, deployment, and test limitations. The database-specific Haversine SQL and Flyway migrations must be validated against live PostgreSQL; unit tests alone do not establish that live deployment works.

## Deployment

See the deployment guide in [backend-java/README.md](./backend-java/README.md). Deployment and GitHub push are manual; this repository setup does not deploy or push automatically.
