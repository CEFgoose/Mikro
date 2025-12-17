# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Mikro is an OSM (OpenStreetMap) micropayments platform by Kaart. It tracks user tasks (mapping/validation), manages payments, and handles training/checklists for mappers.

## Tech Stack

- **Backend**: Python 3, Flask, SQLAlchemy, PostgreSQL with PostGIS
- **Frontend**: React 18, styled-components, MUI, Bootstrap, React Router 6
- **Authentication**: JWT cookies via Kaart SSO (my.kaart.com)

## Development Commands

### Backend
```bash
cd backend
source venv/bin/activate          # Activate virtualenv
pip3 install -r requirements.txt  # Install dependencies
flask run -p 5004 --reload        # Run dev server on port 5004
```

### Frontend
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
