# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Mikro is an OSM (OpenStreetMap) micropayments platform by Kaart. It tracks user tasks (mapping/validation), manages payments, and handles training/checklists for mappers.

## Tech Stack

- **Backend**: Python 3, Flask, SQLAlchemy, PostgreSQL with PostGIS
- **Frontend (Legacy)**: React 18, styled-components, MUI, Bootstrap, React Router 6 (`frontend/Mikro/`)
- **Frontend (New)**: Next.js 16, React 19, Tailwind CSS 4, Auth0 (`frontend/mikro-next/`)
- **Authentication**: Auth0 (migrated from Kaart SSO)

## Development Commands

### Backend
```bash
cd backend
source venv/bin/activate          # Activate virtualenv
pip3 install -r requirements.txt  # Install dependencies
flask run -p 5004 --reload        # Run dev server on port 5004
```

### Frontend (New - mikro-next)
```bash
cd frontend/mikro-next
npm install
npm run dev                       # Run on port 3000
```

### Frontend (Legacy)
```bash
cd frontend/Mikro
npm install                       # or yarn install
DANGEROUSLY_DISABLE_HOST_CHECK=true yarn start  # Run on port 3000
```

For local dev, use `dev.localhost:3000` in browser to avoid CORS issues. Open Chrome in CORS-disabled mode:
```bash
open -n -a /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --args --user-data-dir="/tmp/chrome_dev_test" --disable-web-security
```

### Linting/Formatting
```bash
# Backend
black .
flake8

# Frontend
npm run prettier
```

### Tests
```bash
# Backend (from backend/)
python -m pytest tests/

# Frontend
npm test
```

## Architecture

### Backend Structure (`backend/`)
- `app.py` - Flask app initialization, route registration, JWT/SSO setup
- `api/views/` - API endpoints organized by domain:
  - `Login.py`, `Users.py`, `Projects.py`, `Tasks.py`, `Transactions.py`, `Training.py`, `Checklists.py`
- `api/database/core.py` - SQLAlchemy models (User, Project, Task, Checklist, Training, Payments, etc.)
- `api/database/common.py` - Base model mixins (CRUDMixin, SoftDelete)
- `api/static_variables.py` - Environment config (Postgres connection, etc.)
- `mikro.env` - Environment variables

### Frontend Structure (`frontend/Mikro/src/`)
- `App.js` - React Router configuration with role-based routes
- `components/` - Page components organized by role:
  - Admin pages: `AdminDash/`, `AdminProjectsPage/`, `AdminUsersPage/`, `AdminPaymentsPage/`, `AdminTasksPage/`, `AdminTrainingPage/`, `AdminChecklistsPage/`
  - Validator pages: `ValidatorDashboard/`, `ValdatorChecklistsPage/`
  - User pages: `UserDashboard/`, `UserProjectPage/`, `UserPaymentsPage/`, `UserTrainingPage/`, `UserChecklistsPage/`
- `common/` - Shared context providers:
  - `AuthContext/` - Authentication state and JWT refresh
  - `DataContext/` - Application data management
  - `InteractionContext/` - UI interaction state

### User Roles
Three roles with different access levels: `admin`, `validator`, `user`

### API Routes
Backend routes follow pattern `/<resource>/<path>` (production) or `/api/<resource>/<path>` (dev, commented out in app.py)

## Database

PostgreSQL with PostGIS extension. Key models:
- `User` - Mapper accounts with payment tracking, points, assigned projects
- `Project` - OSM tasking projects with payment rates
- `Task` - Individual mapping/validation tasks
- `Checklist`/`UserChecklist` - Task checklists for users
- `Training` - Training modules with questions/answers
- `Payments`/`PayRequests` - Payment tracking

Migrations handled via Flask-Migrate (Alembic).

## Port Conventions
- SSO: 5001
- Viewer: 5002
- Tabula Rasa: 5003
- Mikro: 5004
- Gem: 5000
- Frontend: 3000

## Deployment

Deployed to mikro.kaart.com via GitLab CI/CD to Kubernetes. See `deployment/kubernetes/` for configs.

## Auth0 Configuration (mikro-next)

### Environment Variables
Create `frontend/mikro-next/.env.local` with:
```
AUTH0_SECRET=<random-32-char-string>
AUTH0_DOMAIN=dev-p6r3cciondp4has2.us.auth0.com
AUTH0_ISSUER_BASE_URL=https://dev-p6r3cciondp4has2.us.auth0.com
AUTH0_CLIENT_ID=<your-client-id>
AUTH0_CLIENT_SECRET=<your-client-secret>
AUTH0_BASE_URL=http://localhost:3000
AUTH0_AUDIENCE=https://mikro/api/authorize
```

### Auth0 Dashboard Setup
1. **Application Type**: Regular Web Application
2. **Allowed Callback URLs**: `http://localhost:3000/auth/callback`
3. **Allowed Logout URLs**: `http://localhost:3000`
4. **API Authorization**: In Application → APIs tab, ensure **User Access** is AUTHORIZED for the Mikro API (not just Client Access)

### SDK v4 + Next.js 16 Notes
- Auth0 SDK v4 uses `/auth/login`, `/auth/logout`, `/auth/callback` routes (not `/api/auth/`)
- Next.js 16 uses `proxy.ts` instead of `middleware.ts` (middleware is deprecated)
- Route handlers are in `src/app/auth/login/route.ts`, `src/app/auth/logout/route.ts`, `src/app/auth/callback/route.ts`
- Auth0 client config is in `src/lib/auth0.ts`

### Troubleshooting
- **"Client not authorized to access resource server"**: Go to Application → APIs tab → Edit the API → Toggle **User Access** to AUTHORIZED
- **Callback URL mismatch**: Add `http://localhost:3000/auth/callback` to Allowed Callback URLs in Auth0 Application settings
