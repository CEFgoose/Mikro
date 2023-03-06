#!/usr/bin/env python3
import os
import logging
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"))

for variable in [
    "POSTGRES_DB",
    "POSTGRES_USER",
    "POSTGRES_PASSWORD",
]:
    if not os.getenv(variable):  # pragma: no cover
        logging.error(
            "Missing environment variable {variable}".format(variable=variable)
        )
POSTGRES_DB = os.getenv("POSTGRES_DB", None)
POSTGRES_ENDPOINT = os.getenv("POSTGRES_ENDPOINT", "postgresql")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD", None)
POSTGRES_PORT = os.getenv("POSTGRES_PORT", "5432")
POSTGRES_USER = os.getenv("POSTGRES_USER", None)
TASKING_KEY= os.getenv("TASKING_KEY")
APP_BASE_URL = os.getenv("APP_BASE_URL", "https://viewer.kaart.com")

ASCII_RECORD_SEPARATOR = b"\x1E"
ASCII_LINE_FEED = b"\x0A"

# PROD

# SSO_BASE_URL = "https://my.kaart.com/api/"
# API_BASE_URL = "https://viewer.kaart.com/api"

# DEV

SSO_BASE_URL = "http://127.0.0.1:5001/api/"
API_BASE_URL = "http://127.0.0.1:3000/api"
