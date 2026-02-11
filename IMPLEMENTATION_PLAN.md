pdate# Mikro Migration Implementation Plan

## Overview

This document outlines the complete plan to:
1. Migrate Mikro from Kaart SSO to Auth0 authentication
2. Rebuild frontend with Next.js 15 + Tailwind (matching Viewer/TM4 patterns)
3. Deploy on DigitalOcean Apps Platform
4. Remove TM3 support (deprecated)
5. Update TM4 integration for the new deployment

**Note:** This is a greenfield rebuild - no data migration required.

---

## Phase 1: Backend Auth0 Migration

### 1.1 Update Dependencies

**File:** `backend/requirements.txt`

```
flask>=3.0.0
flask-cors>=4.0.0
flask-migrate>=4.0.0
flask-sqlalchemy>=3.1.0
gunicorn>=21.0.0
python-jose[cryptography]>=3.3.0
psycopg2-binary>=2.9.0
python-dotenv>=1.0.0
requests>=2.31.0
sqlalchemy>=2.0.0
```

Remove: `flask-jwt-extended`

### 1.2 Create Auth Module

**New File:** `backend/api/auth/__init__.py`
```python
from .auth import authenticate_request, AuthError, get_auth0_management_api_token

__all__ = ['authenticate_request', 'AuthError', 'get_auth0_management_api_token']
```

**New File:** `backend/api/auth/auth.py`
```python
import json
import os
from urllib.request import urlopen

from flask import request, jsonify, g, current_app
from jose import jwt
import requests


class AuthError(Exception):
    def __init__(self, error, status_code):
        self.error = error
        self.status_code = status_code


def get_token_auth_header():
    auth = request.headers.get("Authorization", None)
    if not auth:
        raise AuthError({
            "code": "authorization_header_missing",
            "description": "Authorization header is expected"
        }, 401)

    parts = auth.split()

    if parts[0].lower() != "bearer":
        raise AuthError({
            "code": "invalid_header",
            "description": "Authorization header must start with Bearer"
        }, 401)
    elif len(parts) == 1:
        raise AuthError({
            "code": "invalid_header",
            "description": "Token not found"
        }, 401)
    elif len(parts) > 2:
        raise AuthError({
            "code": "invalid_header",
            "description": "Authorization header must be Bearer token"
        }, 401)

    return parts[1]


def authenticate_request():
    """Validate JWT token from Authorization header."""
    # Skip auth for health checks and preflight
    if request.method == 'OPTIONS':
        return
    if request.path == '/health' or request.path == '/api/health':
        return

    try:
        auth0_domain = current_app.config.get('AUTH0_DOMAIN')
        api_audience = current_app.config.get('API_AUDIENCE')
        algorithms = current_app.config.get('ALGORITHMS', ['RS256'])

        token = get_token_auth_header()
        jsonurl = urlopen(f"https://{auth0_domain}/.well-known/jwks.json")
        jwks = json.loads(jsonurl.read())
        unverified_header = jwt.get_unverified_header(token)
        rsa_key = {}

        for key in jwks["keys"]:
            if key["kid"] == unverified_header["kid"]:
                rsa_key = {
                    "kty": key["kty"],
                    "kid": key["kid"],
                    "use": key["use"],
                    "n": key["n"],
                    "e": key["e"]
                }

        if rsa_key:
            try:
                payload = jwt.decode(
                    token,
                    rsa_key,
                    algorithms=algorithms,
                    audience=api_audience,
                    issuer=f"https://{auth0_domain}/"
                )
                g.current_user = payload

                # Load user from database
                from ..database import User
                auth0_sub = payload.get('sub')
                user = User.query.filter_by(auth0_sub=auth0_sub).first()
                g.user = user

                return

            except jwt.ExpiredSignatureError:
                raise AuthError({
                    "code": "token_expired",
                    "description": "Token has expired"
                }, 401)

            except jwt.JWTClaimsError:
                raise AuthError({
                    "code": "invalid_claims",
                    "description": "Incorrect claims. Please check the audience and issuer"
                }, 401)

            except Exception:
                raise AuthError({
                    "code": "invalid_header",
                    "description": "Unable to parse authentication token"
                }, 401)

        raise AuthError({
            "code": "invalid_header",
            "description": "Unable to find appropriate key"
        }, 401)

    except AuthError as e:
        return jsonify(e.error), e.status_code
    except Exception as e:
        return jsonify({
            "code": "auth_error",
            "description": f"An error occurred during authentication: {str(e)}"
        }), 401


def get_auth0_management_api_token():
    """Retrieve an access token for Auth0 Management API."""
    url = f"https://{os.getenv('AUTH0_DOMAIN')}/oauth/token"

    payload = {
        "grant_type": "client_credentials",
        "client_id": os.getenv('AUTH0_M2M_CLIENT_ID'),
        "client_secret": os.getenv('AUTH0_M2M_CLIENT_SECRET'),
        "audience": f"https://{os.getenv('AUTH0_DOMAIN')}/api/v2/"
    }

    try:
        response = requests.post(url, json=payload)
        response.raise_for_status()
        return response.json()["access_token"]
    except requests.RequestException as e:
        print(f"Failed to retrieve access token: {e}")
        return None
```

### 1.3 Create Config Module

**New File:** `backend/api/config.py`

```python
import os


class BaseConfig:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-prod')

    # Auth0
    ALGORITHMS = ["RS256"]
    AUTH0_DOMAIN = os.environ.get('AUTH0_DOMAIN')
    API_AUDIENCE = os.environ.get('API_AUDIENCE', 'https://mikro/api/authorize')
    AUTH0_NAMESPACE = 'mikro'  # For custom claims like mikro/roles

    # Database
    DB_USERNAME = os.environ.get('POSTGRES_USER')
    DB_PASSWORD = os.environ.get('POSTGRES_PASSWORD')
    DB_HOST = os.environ.get('POSTGRES_ENDPOINT', 'localhost')
    DB_NAME = os.environ.get('POSTGRES_DB')
    DB_PORT = os.environ.get('POSTGRES_PORT', '5432')

    @property
    def SQLALCHEMY_DATABASE_URI(self):
        return f"postgresql://{self.DB_USERNAME}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"

    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # TM4 Integration
    TM4_API_URL = os.environ.get('TM4_API_URL', 'https://tasks.kaart.com/api/v2')
    TM4_API_TOKEN = os.environ.get('TM4_API_TOKEN')

    # Logging
    LOG_LEVEL = os.environ.get('LOG_LEVEL', 'INFO')
```

### 1.4 Refactor app.py

**File:** `backend/app.py`

Complete rewrite using application factory pattern:

```python
import os
from flask import Flask, request, g, jsonify
from flask_cors import CORS
from flask_migrate import Migrate
from dotenv import load_dotenv

load_dotenv()


def create_app(config_class=None):
    app = Flask(__name__)

    # Load config
    if config_class:
        app.config.from_object(config_class)
    else:
        from api.config import BaseConfig
        app.config.from_object(BaseConfig())

    # Initialize extensions
    CORS(app, origins=['*'], supports_credentials=True)

    from api.database import db
    db.init_app(app)

    migrate = Migrate(app, db)

    # Import views
    from api.views import (
        LoginAPI, UserAPI, ProjectAPI,
        TransactionAPI, TaskAPI, TrainingAPI, ChecklistAPI
    )

    # Register routes with /api prefix
    app.add_url_rule("/api/login", view_func=LoginAPI.as_view("auth"))
    app.add_url_rule("/api/user/<path>", view_func=UserAPI.as_view("user"))
    app.add_url_rule("/api/project/<path>", view_func=ProjectAPI.as_view("project"))
    app.add_url_rule("/api/transaction/<path>", view_func=TransactionAPI.as_view("transaction"))
    app.add_url_rule("/api/task/<path>", view_func=TaskAPI.as_view("task"))
    app.add_url_rule("/api/training/<path>", view_func=TrainingAPI.as_view("training"))
    app.add_url_rule("/api/checklist/<path>", view_func=ChecklistAPI.as_view("checklist"))

    @app.before_request
    def before_request():
        from api.auth import authenticate_request
        return authenticate_request()

    @app.route('/health')
    @app.route('/api/health')
    def health():
        return jsonify({'status': 'healthy'}), 200

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({'error': 'Not found'}), 404

    @app.errorhandler(500)
    def server_error(e):
        return jsonify({'error': 'Internal server error'}), 500

    return app


# For gunicorn
app = create_app()

if __name__ == '__main__':
    app.run(debug=True, port=5004)
```

### 1.5 Update User Model

**File:** `backend/api/database/core.py`

Update User model for Auth0:

```python
class User(ModelWithSoftDeleteAndCRUD, SurrogatePK):
    __tablename__ = "users"

    # Primary key is now Auth0 sub (string)
    id = db.Column(db.String(255), primary_key=True, nullable=False)
    auth0_sub = db.Column(db.String(255), unique=True, nullable=False)

    # User info
    email = Column(String, unique=True, nullable=True)
    payment_email = Column(String, nullable=True)  # Remove unique - can be same as email
    first_name = Column(String)
    last_name = Column(String)
    osm_username = Column(String, unique=True, nullable=True)

    # Location
    city = Column(String, nullable=True)
    country = Column(String, nullable=True)

    # Role and org
    role = Column(String, default="user")  # user, validator, admin
    org_id = Column(String, nullable=True)  # Auth0 org ID (string now)

    # ... rest of fields remain the same
```

### 1.6 Refactor Login View

**File:** `backend/api/views/Login.py`

```python
from flask.views import MethodView
from flask import g, jsonify, current_app
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
        namespace = current_app.config.get('AUTH0_NAMESPACE', 'mikro')

        # Extract user info from Auth0 token
        email = auth0_payload.get('email')
        name = auth0_payload.get('name', '')
        name_parts = name.split(' ', 1)
        first_name = name_parts[0] if name_parts else ''
        last_name = name_parts[1] if len(name_parts) > 1 else ''

        # Get role from custom claim
        roles = auth0_payload.get(f'{namespace}/roles', ['user'])
        role = roles[0] if roles else 'user'

        # Get org_id from custom claim
        org_id = auth0_payload.get(f'{namespace}/org_id')

        # Get or create user
        user = User.query.filter_by(auth0_sub=auth0_sub).first()

        if not user:
            user = User.create(
                id=auth0_sub,
                auth0_sub=auth0_sub,
                email=email,
                first_name=first_name,
                last_name=last_name,
                role=role,
                org_id=org_id,
            )
        else:
            # Update user info from Auth0 on each login
            user.update(
                email=email,
                first_name=first_name,
                last_name=last_name,
                role=role,
            )

        g.user = user

        # Check if first login (missing required fields)
        needs_onboarding = not user.osm_username or not user.payment_email

        return jsonify({
            "id": user.id,
            "name": f"{user.first_name} {user.last_name}".strip(),
            "email": user.email,
            "role": user.role,
            "osm_username": user.osm_username,
            "payment_email": user.payment_email,
            "city": user.city,
            "country": user.country,
            "needs_onboarding": needs_onboarding,
            "status": 200
        })
```

### 1.7 Update View Decorators

**File:** `backend/api/utils/decorators.py`

```python
from functools import wraps
from flask import g, jsonify, abort


def requires_auth(f):
    """Decorator to require authenticated user."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not hasattr(g, 'user') or not g.user:
            return jsonify({"message": "Unauthorized", "status": 401}), 401
        return f(*args, **kwargs)
    return decorated_function


def requires_admin(f):
    """Decorator to require admin role."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not hasattr(g, 'user') or not g.user:
            return jsonify({"message": "Unauthorized", "status": 401}), 401
        if g.user.role != 'admin':
            return jsonify({"message": "Admin access required", "status": 403}), 403
        return f(*args, **kwargs)
    return decorated_function


def requires_validator(f):
    """Decorator to require validator or admin role."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not hasattr(g, 'user') or not g.user:
            return jsonify({"message": "Unauthorized", "status": 401}), 401
        if g.user.role not in ['admin', 'validator']:
            return jsonify({"message": "Validator access required", "status": 403}), 403
        return f(*args, **kwargs)
    return decorated_function
```

### 1.8 Update All Views

Remove `@jwt_required()` decorators from all view files:
- `Users.py`
- `Projects.py`
- `Tasks.py`
- `Transactions.py`
- `Training.py`
- `Checklists.py`

Auth is now handled by `before_request` hook.

---

## Phase 2: Remove TM3 Support

### 2.1 Clean Tasks.py

**File:** `backend/api/views/Tasks.py`

**Remove methods:**
- `getMappedTM3Tasks()`
- `getValidatedTM3Tasks()`
- `getInvalidatedTM3Tasks()`
- `TM3PaymentCall()`

**Update methods to only handle TM4:**

```python
def update_user_tasks(self):
    if not g.user:
        return {"message": "User not found", "status": 304}

    user_project_ids = [
        relation.project_id
        for relation in ProjectUser.query.filter_by(user_id=g.user.id).all()
    ]

    user_projects = Project.query.filter(
        Project.org_id == g.user.org_id,
        Project.id.in_(user_project_ids)
    ).all()

    # Only TM4 projects now
    for project in user_projects:
        self.TM4_payment_call(project.id, g.user)

    return {"message": "updated", "status": 200}
```

### 2.2 Update TM4 Integration

Replace hardcoded tokens with config:

```python
from flask import current_app

def TM4_payment_call(self, project_id, user):
    headers = {
        "Authorization": f"Bearer {current_app.config['TM4_API_TOKEN']}",
        "Accept-Language": "en-US",
    }

    tm4_url = f"{current_app.config['TM4_API_URL']}/projects/{project_id}/contributions/"

    response = requests.get(tm4_url, headers=headers)
    # ... rest of method
```

### 2.3 Clean Project Model

Remove `source` field checks for TM3 throughout codebase.

---

## Phase 3: Frontend Next.js Migration

### 3.1 Project Structure

Archive old CRA code and create new Next.js structure:

```
frontend/
├── Mikro/                    # OLD - Keep for reference
│   └── src/
│       └── components/       # Legacy components (de-referenced)
│
└── mikro-next/              # NEW - Next.js app
    ├── src/
    │   ├── app/
    │   │   ├── (authenticated)/    # Protected routes
    │   │   │   ├── admin/
    │   │   │   │   ├── dashboard/
    │   │   │   │   ├── users/
    │   │   │   │   ├── projects/
    │   │   │   │   ├── payments/
    │   │   │   │   ├── tasks/
    │   │   │   │   ├── training/
    │   │   │   │   └── checklists/
    │   │   │   ├── validator/
    │   │   │   │   ├── dashboard/
    │   │   │   │   └── checklists/
    │   │   │   ├── user/
    │   │   │   │   ├── dashboard/
    │   │   │   │   ├── projects/
    │   │   │   │   ├── payments/
    │   │   │   │   ├── training/
    │   │   │   │   └── checklists/
    │   │   │   ├── account/
    │   │   │   ├── layout.js
    │   │   │   └── page.js
    │   │   ├── api/
    │   │   │   ├── auth/
    │   │   │   │   └── [auth0]/
    │   │   │   │       └── route.js
    │   │   │   ├── user/
    │   │   │   ├── project/
    │   │   │   ├── task/
    │   │   │   ├── transaction/
    │   │   │   ├── training/
    │   │   │   └── checklist/
    │   │   ├── onboarding/
    │   │   ├── layout.js
    │   │   ├── page.js              # Landing/Login
    │   │   └── providers.js
    │   ├── components/
    │   │   ├── ui/                  # Reusable UI components
    │   │   ├── layout/              # Header, Sidebar, Footer
    │   │   └── features/            # Feature-specific components
    │   ├── hooks/
    │   ├── lib/
    │   │   └── api.js               # API client for Flask backend
    │   └── middleware.js
    ├── public/
    ├── tailwind.config.js
    ├── next.config.js
    ├── package.json
    └── .env.local.example
```

### 3.2 Initialize Next.js Project

```bash
cd frontend
npx create-next-app@latest mikro-next --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
cd mikro-next
npm install @auth0/nextjs-auth0
```

### 3.3 Configure Tailwind

**File:** `frontend/mikro-next/tailwind.config.js`

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
        },
        // Kaart brand colors
        kaart: {
          orange: '#ff6b35',
          blue: '#004e89',
          dark: '#1a1a2e',
        },
      },
    },
  },
  plugins: [],
}
```

### 3.4 Auth0 Configuration

**File:** `frontend/mikro-next/src/app/api/auth/[auth0]/route.js`

```javascript
import { handleAuth, handleLogin, handleLogout } from '@auth0/nextjs-auth0';

export const GET = handleAuth({
  login: handleLogin({
    authorizationParams: {
      audience: process.env.AUTH0_AUDIENCE,
      scope: 'openid profile email',
    },
  }),
  logout: handleLogout({
    returnTo: process.env.AUTH0_BASE_URL,
  }),
});
```

**File:** `frontend/mikro-next/src/app/providers.js`

```javascript
'use client';

import { UserProvider } from '@auth0/nextjs-auth0/client';

export function Providers({ children }) {
  return (
    <UserProvider>
      {children}
    </UserProvider>
  );
}
```

**File:** `frontend/mikro-next/src/app/layout.js`

```javascript
import { Providers } from './providers';
import './globals.css';

export const metadata = {
  title: 'Mikro - OSM Micropayments',
  description: 'Task tracking and payments for OpenStreetMap mappers',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
```

### 3.5 Middleware for Route Protection

**File:** `frontend/mikro-next/src/middleware.js`

```javascript
import { getSession } from '@auth0/nextjs-auth0/edge';
import { NextResponse } from 'next/server';

export async function middleware(request) {
  try {
    const response = NextResponse.next();
    const session = await getSession(request, response);

    const { pathname } = request.nextUrl;

    // Check if accessing protected routes
    if (pathname.startsWith('/admin') ||
        pathname.startsWith('/validator') ||
        pathname.startsWith('/user') ||
        pathname.startsWith('/account')) {

      if (!session) {
        return NextResponse.redirect(new URL('/api/auth/login', request.url));
      }

      const userRole = session.user?.['mikro/roles']?.[0] || 'user';

      // Role-based route protection
      if (pathname.startsWith('/admin') && userRole !== 'admin') {
        return NextResponse.redirect(new URL('/unauthorized', request.url));
      }

      if (pathname.startsWith('/validator') && !['admin', 'validator'].includes(userRole)) {
        return NextResponse.redirect(new URL('/unauthorized', request.url));
      }
    }

    return response;
  } catch (error) {
    console.error('Middleware error:', error);
    return NextResponse.redirect(new URL('/api/auth/login', request.url));
  }
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/validator/:path*',
    '/user/:path*',
    '/account/:path*',
    '/onboarding/:path*',
  ],
};
```

### 3.6 API Client for Flask Backend

**File:** `frontend/mikro-next/src/lib/api.js`

```javascript
const BACKEND_URL = process.env.FLASK_BACKEND_URL || 'http://localhost:5004';

export async function fetchFromBackend(endpoint, options = {}, accessToken = null) {
  const url = `${BACKEND_URL}/api${endpoint}`;

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}
```

### 3.7 API Route Proxying

**File:** `frontend/mikro-next/src/app/api/user/[...path]/route.js`

```javascript
import { getAccessToken, withApiAuthRequired } from '@auth0/nextjs-auth0';
import { fetchFromBackend } from '@/lib/api';

export const POST = withApiAuthRequired(async function handler(req, { params }) {
  const { accessToken } = await getAccessToken(req);
  const path = params.path.join('/');
  const body = await req.json();

  const data = await fetchFromBackend(`/user/${path}`, {
    method: 'POST',
    body: JSON.stringify(body),
  }, accessToken);

  return Response.json(data);
});
```

### 3.8 Authenticated Layout

**File:** `frontend/mikro-next/src/app/(authenticated)/layout.js`

```javascript
import { getSession } from '@auth0/nextjs-auth0';
import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';

export default async function AuthenticatedLayout({ children }) {
  const session = await getSession();

  if (!session) {
    redirect('/api/auth/login');
  }

  const user = session.user;
  const role = user?.['mikro/roles']?.[0] || 'user';

  // Check if user needs onboarding
  // This would require a backend call to check user details

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} />
      <div className="flex">
        <Sidebar role={role} />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
```

### 3.9 Key UI Components (Tailwind)

**File:** `frontend/mikro-next/src/components/ui/Button.jsx`

```javascript
import { cn } from '@/lib/utils';

export function Button({ children, variant = 'primary', size = 'md', className, ...props }) {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';

  const variants = {
    primary: 'bg-kaart-orange text-white hover:bg-orange-600 focus:ring-kaart-orange',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500',
    outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-kaart-orange',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </button>
  );
}
```

**File:** `frontend/mikro-next/src/components/ui/Card.jsx`

```javascript
import { cn } from '@/lib/utils';

export function Card({ children, className, ...props }) {
  return (
    <div
      className={cn('bg-white rounded-lg shadow-sm border border-gray-200 p-6', className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }) {
  return (
    <div className={cn('mb-4', className)}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className }) {
  return (
    <h3 className={cn('text-lg font-semibold text-gray-900', className)}>
      {children}
    </h3>
  );
}

export function CardContent({ children, className }) {
  return (
    <div className={cn('', className)}>
      {children}
    </div>
  );
}
```

### 3.10 Environment Variables

**File:** `frontend/mikro-next/.env.local.example`

```
# Auth0
AUTH0_SECRET='generate-a-32-character-secret'
AUTH0_BASE_URL='http://localhost:3000'
AUTH0_ISSUER_BASE_URL='https://your-tenant.auth0.com'
AUTH0_CLIENT_ID='your-client-id'
AUTH0_CLIENT_SECRET='your-client-secret'
AUTH0_AUDIENCE='https://mikro/api/authorize'

# Backend
FLASK_BACKEND_URL='http://localhost:5004'
```

---

## Phase 4: DigitalOcean Apps Platform

### 4.1 App Specification

**File:** `app.yaml`

```yaml
name: mikro
region: nyc

services:
  # Flask Backend
  - name: backend
    source_dir: /backend
    github:
      repo: CEFgoose/Mikro
      branch: main
      deploy_on_push: true
    run_command: gunicorn --worker-tmp-dir /dev/shm "app:create_app()" --timeout 120
    environment_slug: python
    instance_count: 1
    instance_size_slug: professional-xs
    http_port: 8080
    routes:
      - path: /api
        preserve_path_prefix: true
    envs:
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
      - key: AUTH0_DOMAIN
        type: SECRET
      - key: API_AUDIENCE
        type: SECRET
      - key: TM4_API_URL
        value: "https://tasks.kaart.com/api/v2"
      - key: TM4_API_TOKEN
        type: SECRET
      - key: SECRET_KEY
        type: SECRET

  # Next.js Frontend
  - name: frontend
    source_dir: /frontend/mikro-next
    github:
      repo: CEFgoose/Mikro
      branch: main
      deploy_on_push: true
    build_command: npm ci && npm run build
    run_command: npm start
    environment_slug: node-js
    instance_count: 1
    instance_size_slug: professional-xs
    http_port: 3000
    routes:
      - path: /
    envs:
      - key: AUTH0_SECRET
        type: SECRET
      - key: AUTH0_BASE_URL
        value: "https://mikro.kaart.com"
      - key: AUTH0_ISSUER_BASE_URL
        type: SECRET
      - key: AUTH0_CLIENT_ID
        type: SECRET
      - key: AUTH0_CLIENT_SECRET
        type: SECRET
      - key: AUTH0_AUDIENCE
        type: SECRET
      - key: FLASK_BACKEND_URL
        value: ${backend.PRIVATE_URL}

databases:
  - name: db
    engine: PG
    version: "16"
    production: true
    cluster_name: mikro-db
```

### 4.2 Backend Procfile

**File:** `backend/Procfile`

```
web: gunicorn --worker-tmp-dir /dev/shm "app:create_app()" --timeout 120 --bind 0.0.0.0:$PORT
release: flask db upgrade
```

### 4.3 Backend Runtime

**File:** `backend/runtime.txt`

```
python-3.12.x
```

---

## Phase 5: Auth0 Configuration

### 5.1 Auth0 Tenant Setup

Use existing Kaart Auth0 tenant.

### 5.2 Create Mikro Application

1. Auth0 Dashboard → Applications → Create Application
2. Type: Regular Web Application (for Next.js)
3. Settings:
   - **Allowed Callback URLs:** `https://mikro.kaart.com/api/auth/callback, http://localhost:3000/api/auth/callback`
   - **Allowed Logout URLs:** `https://mikro.kaart.com, http://localhost:3000`
   - **Allowed Web Origins:** `https://mikro.kaart.com, http://localhost:3000`

### 5.3 Create Mikro API

1. Auth0 Dashboard → APIs → Create API
2. Settings:
   - **Name:** Mikro API
   - **Identifier:** `https://mikro/api/authorize`
   - **Signing Algorithm:** RS256

### 5.4 Create Auth0 Action for Roles

Add to existing Login Flow Action or create new:

```javascript
exports.onExecutePostLogin = async (event, api) => {
  // Existing viewer claims
  const viewerRoles = event.authorization?.roles || ['user'];
  api.accessToken.setCustomClaim('viewer/roles', viewerRoles);
  api.idToken.setCustomClaim('viewer/roles', viewerRoles);

  // New mikro claims
  const mikroRoles = event.user.app_metadata?.mikro_role
    ? [event.user.app_metadata.mikro_role]
    : ['user'];
  const mikroOrgId = event.user.app_metadata?.mikro_org_id;

  api.accessToken.setCustomClaim('mikro/roles', mikroRoles);
  api.idToken.setCustomClaim('mikro/roles', mikroRoles);

  if (mikroOrgId) {
    api.accessToken.setCustomClaim('mikro/org_id', mikroOrgId);
    api.idToken.setCustomClaim('mikro/org_id', mikroOrgId);
  }
};
```

---

## Phase 6: Database Migration

### 6.1 Create Fresh Schema

Since this is greenfield, run migrations to create fresh tables:

```bash
cd backend
flask db init  # If not already initialized
flask db migrate -m "Initial schema with Auth0 user model"
flask db upgrade
```

### 6.2 Seed Data (Optional)

Create admin user after first Auth0 login, or via Management API.

---

## Phase 7: Testing

### 7.1 Local Development Setup

1. Start backend: `cd backend && flask run --port 5004`
2. Start frontend: `cd frontend/mikro-next && npm run dev`
3. Configure Auth0 with localhost URLs
4. Test login flow

### 7.2 Test Checklist

- [ ] Auth0 login/logout works
- [ ] Role-based routing works
- [ ] API calls pass auth token
- [ ] Backend validates tokens correctly
- [ ] User creation on first login
- [ ] Onboarding flow for new users
- [ ] Admin dashboard accessible only to admins
- [ ] Validator dashboard accessible to validators/admins
- [ ] User dashboard accessible to all authenticated users
- [ ] TM4 task syncing works

---

## File Changes Summary

### New Files
- `backend/api/auth/__init__.py`
- `backend/api/auth/auth.py`
- `backend/api/config.py`
- `backend/Procfile`
- `backend/runtime.txt`
- `frontend/mikro-next/` (entire new Next.js app)
- `app.yaml`

### Modified Files
- `backend/requirements.txt`
- `backend/app.py` (complete rewrite)
- `backend/api/database/core.py` (User model)
- `backend/api/views/Login.py` (complete rewrite)
- `backend/api/views/Tasks.py` (remove TM3)
- `backend/api/views/Users.py` (remove jwt_required)
- `backend/api/utils/decorators.py`

### Archived (Keep for Reference)
- `frontend/Mikro/` (entire old CRA app)

### Deleted
- `backend/mikro.env` (already removed)
- All TM3-related code

---

## Environment Variables Summary

### Backend

| Variable | Description |
|----------|-------------|
| `POSTGRES_DB` | Database name |
| `POSTGRES_USER` | Database user |
| `POSTGRES_PASSWORD` | Database password |
| `POSTGRES_ENDPOINT` | Database host |
| `POSTGRES_PORT` | Database port |
| `AUTH0_DOMAIN` | Auth0 tenant domain |
| `API_AUDIENCE` | Auth0 API identifier |
| `TM4_API_URL` | TM4 API base URL |
| `TM4_API_TOKEN` | TM4 API Bearer token |
| `SECRET_KEY` | Flask secret key |

### Frontend

| Variable | Description |
|----------|-------------|
| `AUTH0_SECRET` | Session encryption key |
| `AUTH0_BASE_URL` | App base URL |
| `AUTH0_ISSUER_BASE_URL` | Auth0 tenant URL |
| `AUTH0_CLIENT_ID` | Application client ID |
| `AUTH0_CLIENT_SECRET` | Application client secret |
| `AUTH0_AUDIENCE` | API identifier |
| `FLASK_BACKEND_URL` | Backend URL for API calls |
