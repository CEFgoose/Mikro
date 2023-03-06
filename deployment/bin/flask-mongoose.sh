#!/usr/bin/env bash
cd ${HOME}/mikro/backend
source venv/bin/activate
pip install -r requirements.txt
flask run
