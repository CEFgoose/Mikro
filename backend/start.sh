#!/usr/bin/env bash
set -ex
flask db upgrade

PYTHONPATH="$(pwd)" gunicorn --pythonpath "$(pwd)" --config gunicorn.config.py --log-level 'debug' --bind 0.0.0.0:8000 app:app
