#!/usr/binenv change
# /env python
import os
from flask_cors import CORS
from flask_migrate import Migrate
from flask_mail import Mail
from flask_jwt_extended import (
    JWTManager,
    get_jwt_identity,
    jwt_required,
    verify_jwt_in_request,
)
from flask import Flask, request
import requests
from dotenv import load_dotenv
from flask import g
from flask.globals import current_app


def optional_jwt():
    try:
        if verify_jwt_in_request():
            return True
    except BaseException:
        return False


def load_user_from_jwt():
    if "register_user" not in request.url:
        g.user = User.query.filter_by(id=get_jwt_identity()).one_or_none()


SSO_BASE_URL = "http://127.0.0.1:5001/api/"
# SSO_BASE_URL = "https://my.kaart.com/api/"
DB_key = "cjyjs1zsq0ypexp"
DB_secret = "d4q5mgo3i0sy9y3"
DB_AUTH_URL = "https://www.dropbox.com/oauth2/authorize"
DB_TOKEN_URL = "https://api.dropboxapi.com/oauth2/token"

load_dotenv("mikro.env")

try:
    from api.database import db, User
    from api.static_variables import (
        POSTGRES_DB,
        POSTGRES_ENDPOINT,
        POSTGRES_PASSWORD,
        POSTGRES_PORT,
        POSTGRES_USER,
    )
    from api.views import (
        LoginAPI,
        UserAPI,
        ProjectAPI,
        TransactionAPI,
        TaskAPI,
        TrainingAPI,
    )
except ImportError:
    from .api.database import db, User
    from .api.static_variables import (
        POSTGRES_DB,
        POSTGRES_ENDPOINT,
        POSTGRES_PASSWORD,
        POSTGRES_PORT,
        POSTGRES_USER,
    )
    from .api.views import (
        LoginAPI,
        UserAPI,
        ProjectAPI,
        TransactionAPI,
        TaskAPI,
        TrainingAPI,
    )
app = Flask(__name__)
cors = CORS(app)
app.config["OPENAPI_VERSION"] = "3.0.2"
jwt = JWTManager(app)
mail = Mail(app)

app.config["SQLALCHEMY_DATABASE_URI"] = (
    "postgresql://"
    + POSTGRES_USER
    + ":"
    + POSTGRES_PASSWORD
    + "@"
    + POSTGRES_ENDPOINT
    + ":"
    + POSTGRES_PORT
    + "/"
    + POSTGRES_DB
)
app.config["REDIS_URL"] = "redis://localhost:6379"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["SSO_URL"] = os.getenv("SSO_URL", "https://my.kaart.com/api")
app.config["JWT_TOKEN_LOCATION"] = "cookies"
app.config["JWT_COOKIE_CSRF_PROTECT"] = True
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET", None)

JWT_COOKIE_DOMAIN = os.getenv("JWT_COOKIE_DOMAIN", "dev.localhost")
app.secret_key = os.getenv("SECRET_KEY", os.urandom(64))

db.init_app(app)
migrate = Migrate(app, db)


#DEV
# app.add_url_rule("/api/login", view_func=LoginAPI.as_view("auth"))
# app.add_url_rule("/api/training/<path>", view_func=TrainingAPI.as_view("training"))
# app.add_url_rule("/api/user/<path>", view_func=UserAPI.as_view("user"))
# app.add_url_rule("/api/project/<path>", view_func=ProjectAPI.as_view("project"))
# app.add_url_rule("/api/transaction/<path>", view_func=TransactionAPI.as_view("transaction"))
# app.add_url_rule("/api/task/<path>", view_func=TaskAPI.as_view("task"))
#PROD
app.add_url_rule("/login", view_func=LoginAPI.as_view("auth"))
app.add_url_rule("/training/<path>", view_func=TrainingAPI.as_view("training"))
app.add_url_rule("/user/<path>", view_func=UserAPI.as_view("user"))
app.add_url_rule("/project/<path>", view_func=ProjectAPI.as_view("project"))
app.add_url_rule("/transaction/<path>", view_func=TransactionAPI.as_view("transaction"))
app.add_url_rule("/task/<path>", view_func=TaskAPI.as_view("task"))


@app.before_request
@jwt_required(optional=True)
def load_user():
    if "register_user" not in request.url:
        if optional_jwt():
            load_user_from_jwt()
    else:
        email = request.json.get("email")
        firstName = request.json.get("firstName")
        lastName = request.json.get("lastName")
        password = request.json.get("password")
        org = request.json.get("org")
        body = {
            "firstName": firstName,
            "lastName": lastName,
            "email": email,
            "password": password,
            "org": org,
            "int": "micro",
        }

        url = (
            SSO_BASE_URL + "auth/register_user"
        )
        response = requests.post(
            url,
            json=body,
        )  # noqa: E501 E228ar
        if response.status_code == 200:
            resp = response.json()
            if resp["code"] == 0:
                message = "Viewer integration added to your Kaart account, you may log into Mikro any time."  # noqa: E501
            if resp["code"] == 1:
                message = "Account already exists with micro integration, you may log into Mikro any time."  # noqa: E501
            if resp["code"] == 2:
                message = "Your Kaart account has been created with Mikro integration, press the button below to activate your account!"  # noqa: E501
            return {"message": message, "code": resp["code"]}
