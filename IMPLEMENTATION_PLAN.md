# Mikro Migration Implementation Plan

## Overview

This document outlines the complete plan to:
1. Migrate Mikro from Kaart SSO to Auth0 authentication
2. Deploy Mikro on DigitalOcean Apps Platform
3. Remove TM3 support (deprecated)
4. Update TM4 integration for the new deployment

---

## Phase 1: Backend Auth0 Migration

### 1.1 Install Auth0 Dependencies

**File:** `backend/requirements.txt`

Add:
```
python-jose[cryptography]==3.3.0
```

Remove (no longer needed for Auth0):
```
flask-jwt-extended  # Remove - replacing with Auth0 JWT validation
```

### 1.2 Create Auth Module

**New File:** `backend/api/auth/__init__.py`
```python
# Empty init file
```

**New File:** `backend/api/auth/auth.py`

Create Auth0 JWT validation (copy pattern from Viewer):
- `AuthError` exception class
- `get_token_auth_header()` - Extract Bearer token from Authorization header
- `authenticate_request()` - Validate JWT against Auth0 JWKS
- `get_auth0_management_api_token()` - For Management API calls (user creation, etc.)

Key differences from Kaart SSO:
- No more cookie-based JWT (`JWT_TOKEN_LOCATION = "cookies"`)
- Bearer tokens in Authorization header instead
- Validate against Auth0's `/.well-known/jwks.json`

### 1.3 Create Config Module

**New File:** `backend/api/config.py`

```python
import os

class BaseConfig:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'default-secret-key-for-dev')

    # Auth0
    ALGORITHMS = ["RS256"]
    AUTH0_DOMAIN = os.environ.get('AUTH0_DOMAIN')
    API_AUDIENCE = os.environ.get('API_AUDIENCE', 'https://Mikro/api/authorize')

    # Database
    DB_USERNAME = os.environ.get('POSTGRES_USER')
    DB_PASSWORD = os.environ.get('POSTGRES_PASSWORD')
    DB_HOST = os.environ.get('POSTGRES_ENDPOINT', 'localhost')
    DB_NAME = os.environ.get('POSTGRES_DB')
    DB_PORT = os.environ.get('POSTGRES_PORT', '5432')
    SQLALCHEMY_DATABASE_URI = f"postgresql://{DB_USERNAME}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # TM4 Integration
    TM4_API_URL = os.environ.get('TM4_API_URL', 'https://tasks.kaart.com/api/v2')
    TM4_API_TOKEN = os.environ.get('TM4_API_TOKEN')

    # Logging
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
```

### 1.4 Refactor app.py

**File:** `backend/app.py`

**Remove:**
- All `flask_jwt_extended` imports and configuration
- `JWT_TOKEN_LOCATION`, `JWT_COOKIE_CSRF_PROTECT`, `JWT_SECRET_KEY` config
- `optional_jwt()`, `load_user_from_jwt()` functions
- SSO-related code and `SSO_BASE_URL` references
- Registration handling in `@app.before_request`

**Add:**
- Import `authenticate_request` from new auth module
- Load config from `BaseConfig`
- New `@app.before_request` that calls `authenticate_request()`
- Store decoded JWT payload in `g.current_user`

**Refactored Structure:**
```python
from flask import Flask, request, g
from flask_cors import CORS
from flask_migrate import Migrate
from dotenv import load_dotenv

load_dotenv()

def create_app():
    app = Flask(__name__)
    app.config.from_object('api.config.BaseConfig')

    CORS(app)
    db.init_app(app)
    migrate = Migrate(app, db)

    # Import and register blueprints
    from api.views import (LoginAPI, UserAPI, ProjectAPI,
                           TransactionAPI, TaskAPI, TrainingAPI, ChecklistAPI)

    # Register routes with /api prefix for DO Apps Platform
    app.add_url_rule("/api/login", view_func=LoginAPI.as_view("auth"))
    app.add_url_rule("/api/training/<path>", view_func=TrainingAPI.as_view("training"))
    app.add_url_rule("/api/user/<path>", view_func=UserAPI.as_view("user"))
    app.add_url_rule("/api/project/<path>", view_func=ProjectAPI.as_view("project"))
    app.add_url_rule("/api/transaction/<path>", view_func=TransactionAPI.as_view("transaction"))
    app.add_url_rule("/api/task/<path>", view_func=TaskAPI.as_view("task"))
    app.add_url_rule("/api/checklist/<path>", view_func=ChecklistAPI.as_view("checklist"))

    @app.before_request
    def before_request():
        # Skip auth for health checks and OPTIONS
        if request.method == 'OPTIONS' or request.path == '/health':
            return

        from api.auth.auth import authenticate_request
        return authenticate_request()

    @app.route('/health')
    def health():
        return {'status': 'healthy'}, 200

    return app

app = create_app()
```

### 1.5 Update User Model

**File:** `backend/api/database/core.py`

**Changes to User model:**
```python
class User(ModelWithSoftDeleteAndCRUD, SurrogatePK):
    __tablename__ = "users"
    # Change from BigInteger to String for Auth0 'sub' claim
    id = db.Column(db.String(255), primary_key=True, nullable=False)  # Auth0 sub
    auth0_sub = db.Column(db.String(255), unique=True, nullable=False)  # Explicit Auth0 ID
    email = Column(String, unique=True, nullable=True)
    # ... rest remains the same
```

**Note:** This is a breaking change. Migration strategy:
1. Add `auth0_sub` column
2. Create migration to populate existing users (manual mapping or invite flow)
3. New users created via Auth0 will have Auth0 `sub` as ID

### 1.6 Refactor Login View

**File:** `backend/api/views/Login.py`

**Complete Rewrite:**
```python
from flask.views import MethodView
from flask import g, jsonify
from ..database import User


class LoginAPI(MethodView):
    def post(self):
        """
        Login endpoint - creates or retrieves user from Auth0 JWT.
        JWT is already validated by before_request hook.
        """
        if not hasattr(g, 'current_user') or not g.current_user:
            return jsonify({"message": "Unauthorized"}), 401

        auth0_payload = g.current_user
        auth0_sub = auth0_payload.get('sub')
        email = auth0_payload.get('email', auth0_payload.get(f'{AUTH0_NAMESPACE}/email'))

        # Get or create user
        user = User.query.filter_by(auth0_sub=auth0_sub).first()

        if not user:
            # Create new user from Auth0 data
            # Extract name from Auth0 (may need custom claims)
            name_parts = auth0_payload.get('name', '').split(' ', 1)
            first_name = name_parts[0] if name_parts else ''
            last_name = name_parts[1] if len(name_parts) > 1 else ''

            user = User.create(
                id=auth0_sub,
                auth0_sub=auth0_sub,
                email=email,
                first_name=first_name,
                last_name=last_name,
                role=auth0_payload.get(f'{AUTH0_NAMESPACE}/roles', ['user'])[0],
                org_id=auth0_payload.get(f'{AUTH0_NAMESPACE}/org_id'),
            )

        g.user = user

        return jsonify({
            "id": user.id,
            "name": f"{user.first_name} {user.last_name}".strip(),
            "email": user.email,
            "role": user.role,
            "osm_username": user.osm_username,
            "payment_email": user.payment_email,
            "city": user.city,
            "country": user.country,
            "status": 200
        })
```

### 1.7 Update All View Decorators

**Files:** All files in `backend/api/views/`

**Replace:**
```python
from flask_jwt_extended import jwt_required

@jwt_required()
def post(self, path: str):
```

**With:**
```python
# No decorator needed - auth handled by before_request
def post(self, path: str):
    if not hasattr(g, 'user') or not g.user:
        return {"message": "Unauthorized", "status": 401}, 401
```

### 1.8 Update requires_admin Decorator

**File:** `backend/api/utils/decorators.py`

Update to work with new auth:
```python
from functools import wraps
from flask import g

def requires_admin(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not hasattr(g, 'user') or not g.user:
            return {"message": "Unauthorized", "status": 401}, 401
        if g.user.role != 'admin':
            return {"message": "Admin access required", "status": 403}, 403
        return f(*args, **kwargs)
    return decorated_function
```

---

## Phase 2: Remove TM3 Support

### 2.1 Clean Tasks.py

**File:** `backend/api/views/Tasks.py`

**Remove entirely:**
- `getMappedTM3Tasks()` method
- `getValidatedTM3Tasks()` method
- `getInvalidatedTM3Tasks()` method
- `TM3PaymentCall()` method

**Update `update_user_tasks()` and `admin_update_all_user_tasks()`:**
- Remove `user_tm3_project_ids` logic
- Remove TM3 for loop
- Only process TM4 projects

### 2.2 Update TM4 Integration

**File:** `backend/api/views/Tasks.py`

**Replace hardcoded tokens:**
```python
# Before
headers = {
    "Authorization": "Bearer TVRBek5ERTBNalEu...",
    ...
}

# After
from flask import current_app

headers = {
    "Authorization": f"Bearer {current_app.config['TM4_API_TOKEN']}",
    "Accept-Language": "en-US",
}
```

**Update TM4 URL:**
```python
# Before
TM4url = "https://tasks.kaart.com/api/v2/projects/%s/contributions/" % (project_id)

# After
TM4url = f"{current_app.config['TM4_API_URL']}/projects/{project_id}/contributions/"
```

### 2.3 Update Project Model Usage

Projects with `source != "tasks"` (TM3) should either:
- Be migrated to TM4
- Be marked as archived/completed
- Be deleted if no longer relevant

---

## Phase 3: Frontend Auth0 Migration

### 3.1 Install Auth0 React SDK

**File:** `frontend/Mikro/package.json`

Add dependency:
```json
{
  "dependencies": {
    "@auth0/auth0-react": "^2.2.4",
    ...
  }
}
```

### 3.2 Create Auth0 Provider Setup

**New File:** `frontend/Mikro/src/auth/Auth0ProviderWithNavigate.js`

```javascript
import { Auth0Provider } from "@auth0/auth0-react";
import { useNavigate } from "react-router-dom";

export const Auth0ProviderWithNavigate = ({ children }) => {
  const navigate = useNavigate();

  const domain = process.env.REACT_APP_AUTH0_DOMAIN;
  const clientId = process.env.REACT_APP_AUTH0_CLIENT_ID;
  const audience = process.env.REACT_APP_AUTH0_AUDIENCE;
  const redirectUri = window.location.origin;

  const onRedirectCallback = (appState) => {
    navigate(appState?.returnTo || "/");
  };

  return (
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: redirectUri,
        audience: audience,
        scope: "openid profile email",
      }}
      onRedirectCallback={onRedirectCallback}
    >
      {children}
    </Auth0Provider>
  );
};
```

### 3.3 Refactor AuthContext

**File:** `frontend/Mikro/src/common/AuthContext/index.js`

**Complete Rewrite:**
```javascript
import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { API_URL } from "components/constants";

export const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const {
    isAuthenticated,
    isLoading,
    user: auth0User,
    loginWithRedirect,
    logout: auth0Logout,
    getAccessTokenSilently,
  } = useAuth0();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch Mikro user data after Auth0 authentication
  useEffect(() => {
    const fetchUserData = async () => {
      if (isAuthenticated && auth0User) {
        try {
          const token = await getAccessTokenSilently();
          const response = await fetch(`${API_URL}login`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });

          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      }
      setLoading(false);
    };

    if (!isLoading) {
      fetchUserData();
    }
  }, [isAuthenticated, isLoading, auth0User, getAccessTokenSilently]);

  const login = () => loginWithRedirect();

  const logout = () => {
    setUser(null);
    auth0Logout({
      logoutParams: {
        returnTo: window.location.origin,
      },
    });
  };

  const value = {
    user,
    setUser,
    login,
    logout,
    isAuthenticated,
    isLoading: isLoading || loading,
    getAccessTokenSilently,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
```

### 3.4 Update API Calls Module

**File:** `frontend/Mikro/src/calls.js`

**Complete Rewrite:**
```javascript
import { API_URL } from "./components/constants";

// This will be set by the AuthContext
let getToken = null;

export const setTokenGetter = (getter) => {
  getToken = getter;
};

export async function poster(info, route) {
  if (!getToken) {
    throw new Error("Auth not initialized");
  }

  const token = await getToken();

  const response = await fetch(API_URL.concat(route), {
    method: "POST",
    body: JSON.stringify(info),
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 401) {
    // Token expired - trigger re-auth
    window.location.href = "/";
    return { response: "unauthorized" };
  }

  if (response.ok) {
    return await response.json();
  }

  return { response: "error" };
}

export async function fetcher(route) {
  if (!getToken) {
    throw new Error("Auth not initialized");
  }

  const token = await getToken();

  const response = await fetch(API_URL.concat(route), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 401) {
    window.location.href = "/";
    return { response: "unauthorized" };
  }

  if (response.ok) {
    return await response.json();
  }

  return { response: "Error" };
}
```

### 3.5 Update App.js

**File:** `frontend/Mikro/src/App.js`

Wrap with Auth0Provider and update routing:

```javascript
import { BrowserRouter } from "react-router-dom";
import { Auth0ProviderWithNavigate } from "./auth/Auth0ProviderWithNavigate";
import { AuthProvider } from "common/AuthContext";
import { DataProvider } from "common/DataContext";
// ... other imports

function App() {
  return (
    <BrowserRouter>
      <Auth0ProviderWithNavigate>
        <DataProvider>
          <AuthProvider>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<LandingPage />} />

              {/* Protected routes - wrap with AuthenticationGuard */}
              <Route path="/dashboard" element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} />
              <Route path="/admindash" element={<ProtectedRoute requiredRole="admin"><AdminDash /></ProtectedRoute>} />
              {/* ... other routes */}
            </Routes>
          </AuthProvider>
        </DataProvider>
      </Auth0ProviderWithNavigate>
    </BrowserRouter>
  );
}
```

### 3.6 Create Protected Route Component

**New File:** `frontend/Mikro/src/components/ProtectedRoute/index.js`

```javascript
import { useAuth0 } from "@auth0/auth0-react";
import { useAuth } from "common/AuthContext";
import { Navigate } from "react-router-dom";
import { PreloaderIcon } from "components/Preloader";

export const ProtectedRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, isLoading } = useAuth0();
  const { user } = useAuth();

  if (isLoading) {
    return <PreloaderIcon />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    // Redirect to appropriate dashboard based on role
    if (user?.role === "admin") {
      return <Navigate to="/admindash" replace />;
    } else if (user?.role === "validator") {
      return <Navigate to="/validatordash" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};
```

### 3.7 Update Login Component

**File:** `frontend/Mikro/src/components/Login/index.js`

**Complete Rewrite:**
```javascript
import { useAuth0 } from "@auth0/auth0-react";
import { useAuth } from "common/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import kaartLogo from "../../images/20-KAART-Color.svg";
import { LoginPage, LoginForm, LoginImage, LoginButton } from "./styles";

export const Login = () => {
  const { loginWithRedirect, isAuthenticated, isLoading } = useAuth0();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect authenticated users to their dashboard
    if (isAuthenticated && user) {
      const destination =
        user.role === "admin" ? "/admindash" :
        user.role === "validator" ? "/validatordash" :
        "/dashboard";
      navigate(destination);
    }
  }, [isAuthenticated, user, navigate]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <LoginPage>
      <LoginForm>
        <LoginImage src={kaartLogo} alt="Kaart Logo" />
        <LoginButton onClick={() => loginWithRedirect()}>
          Sign In with Auth0
        </LoginButton>
      </LoginForm>
    </LoginPage>
  );
};
```

### 3.8 Update constants.js

**File:** `frontend/Mikro/src/components/constants.js`

```javascript
// API URL - use relative path for DO Apps Platform
export const API_URL = "/api/";

// Remove SSO_URL - no longer needed
// export const SSO_URL = "https://my.kaart.com/api/";
```

### 3.9 Create Environment File Template

**New File:** `frontend/Mikro/.env.example`

```
REACT_APP_AUTH0_DOMAIN=your-tenant.auth0.com
REACT_APP_AUTH0_CLIENT_ID=your-client-id
REACT_APP_AUTH0_AUDIENCE=https://Mikro/api/authorize
```

### 3.10 Remove Deprecated Components

**Delete:**
- `frontend/Mikro/src/components/SSOControl/` - No longer needed
- `frontend/Mikro/src/components/RegisterUser/` - User registration via Auth0

---

## Phase 4: DigitalOcean Apps Platform Deployment

### 4.1 Create App Specification

**New File:** `app.yaml`

```yaml
name: mikro
region: nyc

services:
  # Backend API Service
  - name: backend
    source_dir: /backend
    github:
      repo: KaartGroup/Mikro
      branch: main
      deploy_on_push: true
    run_command: gunicorn --worker-tmp-dir /dev/shm "app:create_app()" --timeout 120
    environment_slug: python
    instance_count: 1
    instance_size_slug: basic-s
    http_port: 8080
    routes:
      - path: /api
    envs:
      # Database
      - key: POSTGRES_DB
        scope: RUN_TIME
        value: ${db.DATABASE}
      - key: POSTGRES_USER
        scope: RUN_TIME
        value: ${db.USERNAME}
      - key: POSTGRES_PASSWORD
        scope: RUN_TIME
        value: ${db.PASSWORD}
      - key: POSTGRES_ENDPOINT
        scope: RUN_TIME
        value: ${db.HOSTNAME}
      - key: POSTGRES_PORT
        scope: RUN_TIME
        value: ${db.PORT}

      # Auth0
      - key: AUTH0_DOMAIN
        type: SECRET
      - key: API_AUDIENCE
        type: SECRET
      - key: AUTH0_M2M_CLIENT_ID
        type: SECRET
      - key: AUTH0_M2M_CLIENT_SECRET
        type: SECRET

      # TM4 Integration
      - key: TM4_API_URL
        value: "https://tasks.kaart.com/api/v2"
      - key: TM4_API_TOKEN
        type: SECRET

      # App Config
      - key: SECRET_KEY
        type: SECRET
      - key: LOG_LEVEL
        value: "INFO"

  # Frontend Static Site
  - name: frontend
    source_dir: /frontend/Mikro
    github:
      repo: KaartGroup/Mikro
      branch: main
      deploy_on_push: true
    build_command: npm ci && npm run build
    environment_slug: node-js
    routes:
      - path: /
    envs:
      - key: REACT_APP_AUTH0_DOMAIN
        type: SECRET
      - key: REACT_APP_AUTH0_CLIENT_ID
        type: SECRET
      - key: REACT_APP_AUTH0_AUDIENCE
        type: SECRET

databases:
  - name: db
    engine: PG
    version: "15"
    production: true
    cluster_name: mikro-db
```

### 4.2 Create Backend Procfile

**New File:** `backend/Procfile`

```
web: gunicorn --worker-tmp-dir /dev/shm "app:create_app()" --timeout 120
release: flask db upgrade
```

### 4.3 Create Gunicorn Config

**New File:** `backend/gunicorn_config.py`

```python
bind = "0.0.0.0:8080"
workers = 2
timeout = 120
worker_tmp_dir = "/dev/shm"
```

### 4.4 Create Python Version File

**New File:** `backend/runtime.txt`

```
python-3.11.x
```

### 4.5 Update Backend requirements.txt

**File:** `backend/requirements.txt`

Ensure these are present:
```
flask>=2.3.0
flask-cors>=4.0.0
flask-migrate>=4.0.0
flask-sqlalchemy>=3.0.0
gunicorn>=21.0.0
python-jose[cryptography]>=3.3.0
psycopg2-binary>=2.9.0
python-dotenv>=1.0.0
requests>=2.31.0
sqlalchemy>=2.0.0
```

Remove:
```
flask-jwt-extended
```

### 4.6 Update Frontend for Static Build

**File:** `frontend/Mikro/package.json`

Add production start script:
```json
{
  "scripts": {
    "start": "./node_modules/.bin/react-scripts start",
    "build": "./node_modules/.bin/react-scripts build",
    "start:prod": "serve -s build -l 8080",
    ...
  },
  "dependencies": {
    "serve": "^14.2.0",
    ...
  }
}
```

---

## Phase 5: Auth0 Configuration

### 5.1 Create Auth0 Application

1. Log into Auth0 Dashboard
2. Create new Application → Single Page Application
3. Configure:
   - **Allowed Callback URLs:** `https://mikro.kaart.com, http://localhost:3000`
   - **Allowed Logout URLs:** `https://mikro.kaart.com, http://localhost:3000`
   - **Allowed Web Origins:** `https://mikro.kaart.com, http://localhost:3000`

### 5.2 Create Auth0 API

1. APIs → Create API
2. Configure:
   - **Name:** Mikro API
   - **Identifier:** `https://Mikro/api/authorize`
   - **Signing Algorithm:** RS256

### 5.3 Configure Roles (Rules/Actions)

Create Auth0 Action to add roles to token:

```javascript
exports.onExecutePostLogin = async (event, api) => {
  const namespace = 'mikro';

  // Get roles from user metadata or Auth0 roles
  const roles = event.authorization?.roles || ['user'];
  const orgId = event.user.app_metadata?.org_id;

  api.idToken.setCustomClaim(`${namespace}/roles`, roles);
  api.idToken.setCustomClaim(`${namespace}/org_id`, orgId);
  api.accessToken.setCustomClaim(`${namespace}/roles`, roles);
  api.accessToken.setCustomClaim(`${namespace}/org_id`, orgId);
};
```

### 5.4 Create M2M Application (for Management API)

1. Applications → Create Application → Machine to Machine
2. Authorize for Auth0 Management API
3. Grant permissions: `read:users`, `update:users`, `create:users`

---

## Phase 6: Database Migration

### 6.1 Create Alembic Migration

```bash
cd backend
flask db migrate -m "Add auth0_sub column and update user id type"
```

**Migration file will need manual editing to:**
1. Add `auth0_sub` column (String, nullable initially)
2. Update foreign key relationships
3. Handle existing user data

### 6.2 Data Migration Strategy

For existing users:
1. Export current user data
2. Create Auth0 accounts for each user (via Management API)
3. Map Auth0 `sub` to existing user records
4. Update `auth0_sub` column with Auth0 IDs

---

## Phase 7: Testing & Validation

### 7.1 Local Testing Checklist

- [ ] Backend starts without errors
- [ ] Auth0 JWT validation works
- [ ] User login creates/retrieves user correctly
- [ ] Role-based access control works
- [ ] TM4 API calls work with new token config
- [ ] Frontend Auth0 login flow works
- [ ] Protected routes redirect correctly
- [ ] API calls include Bearer token

### 7.2 Integration Testing

- [ ] Full login → dashboard flow
- [ ] Admin functions work
- [ ] Validator functions work
- [ ] User functions work
- [ ] Task syncing with TM4 works
- [ ] Payment flows work

### 7.3 DO Apps Platform Testing

- [ ] Backend deploys successfully
- [ ] Frontend deploys successfully
- [ ] Database connection works
- [ ] Environment variables loaded correctly
- [ ] HTTPS works
- [ ] API routing works (`/api/*` → backend)

---

## Phase 8: Deployment Steps

### 8.1 Pre-Deployment

1. Create Auth0 tenant and configure applications
2. Set up DO Managed Database
3. Export existing user data for migration
4. Test locally with production-like config

### 8.2 Deployment

1. Push code to main branch
2. Create DO App from `app.yaml`
3. Configure environment secrets in DO dashboard
4. Run database migrations
5. Verify deployment health

### 8.3 Post-Deployment

1. Migrate existing users to Auth0
2. Update DNS records
3. Monitor logs for errors
4. Test all functionality

---

## Environment Variables Reference

### Backend

| Variable | Description | Example |
|----------|-------------|---------|
| `POSTGRES_DB` | Database name | `mikro` |
| `POSTGRES_USER` | Database user | `mikro_user` |
| `POSTGRES_PASSWORD` | Database password | `secret` |
| `POSTGRES_ENDPOINT` | Database host | `db-mikro.xxx.db.ondigitalocean.com` |
| `POSTGRES_PORT` | Database port | `25060` |
| `AUTH0_DOMAIN` | Auth0 tenant domain | `kaart.auth0.com` |
| `API_AUDIENCE` | Auth0 API identifier | `https://Mikro/api/authorize` |
| `AUTH0_M2M_CLIENT_ID` | M2M app client ID | `abc123` |
| `AUTH0_M2M_CLIENT_SECRET` | M2M app client secret | `secret` |
| `TM4_API_URL` | TM4 API base URL | `https://tasks.kaart.com/api/v2` |
| `TM4_API_TOKEN` | TM4 API Bearer token | `token` |
| `SECRET_KEY` | Flask secret key | `random-secret` |

### Frontend

| Variable | Description | Example |
|----------|-------------|---------|
| `REACT_APP_AUTH0_DOMAIN` | Auth0 tenant domain | `kaart.auth0.com` |
| `REACT_APP_AUTH0_CLIENT_ID` | SPA client ID | `xyz789` |
| `REACT_APP_AUTH0_AUDIENCE` | Auth0 API identifier | `https://Mikro/api/authorize` |

---

## Files Changed Summary

### New Files
- `backend/api/auth/__init__.py`
- `backend/api/auth/auth.py`
- `backend/api/config.py`
- `backend/Procfile`
- `backend/gunicorn_config.py`
- `backend/runtime.txt`
- `frontend/Mikro/src/auth/Auth0ProviderWithNavigate.js`
- `frontend/Mikro/src/components/ProtectedRoute/index.js`
- `frontend/Mikro/.env.example`
- `app.yaml`

### Modified Files
- `backend/requirements.txt`
- `backend/app.py` (major refactor)
- `backend/api/views/Login.py` (complete rewrite)
- `backend/api/views/Users.py` (remove jwt_required, update auth)
- `backend/api/views/Tasks.py` (remove TM3, update TM4 tokens)
- `backend/api/views/Projects.py` (remove jwt_required)
- `backend/api/views/Transactions.py` (remove jwt_required)
- `backend/api/views/Training.py` (remove jwt_required)
- `backend/api/views/Checklists.py` (remove jwt_required)
- `backend/api/database/core.py` (User model changes)
- `backend/api/utils/decorators.py` (update requires_admin)
- `backend/api/static_variables.py` (cleanup)
- `frontend/Mikro/package.json` (add Auth0 SDK)
- `frontend/Mikro/src/App.js` (add Auth0Provider, update routes)
- `frontend/Mikro/src/common/AuthContext/index.js` (complete rewrite)
- `frontend/Mikro/src/calls.js` (use Bearer tokens)
- `frontend/Mikro/src/components/constants.js` (remove SSO_URL)
- `frontend/Mikro/src/components/Login/index.js` (Auth0 login)

### Deleted Files
- `frontend/Mikro/src/components/SSOControl/`
- `frontend/Mikro/src/components/RegisterUser/`

---

## Timeline Estimate

| Phase | Tasks | Dependencies |
|-------|-------|--------------|
| Phase 1 | Backend Auth0 Migration | None |
| Phase 2 | Remove TM3 | Phase 1 |
| Phase 3 | Frontend Auth0 Migration | Phase 1 |
| Phase 4 | DO Apps Platform Config | Phases 1-3 |
| Phase 5 | Auth0 Configuration | None (can be parallel) |
| Phase 6 | Database Migration | Phases 1, 5 |
| Phase 7 | Testing | Phases 1-6 |
| Phase 8 | Deployment | All phases |

---

## Resources

- [Auth0 React SDK Documentation](https://auth0.com/docs/libraries/auth0-react)
- [Auth0 React SDK GitHub](https://github.com/auth0/auth0-react)
- [DigitalOcean App Platform Flask Guide](https://www.digitalocean.com/community/tutorials/how-to-deploy-a-flask-app-using-gunicorn-to-app-platform)
- [DigitalOcean App Platform React Guide](https://www.digitalocean.com/community/tutorials/how-to-deploy-a-react-application-to-digitalocean-app-platform)
- [python-jose Documentation](https://python-jose.readthedocs.io/)
